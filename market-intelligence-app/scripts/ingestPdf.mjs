#!/usr/bin/env node
/**
 * PDF Ingestion Tool
 * ──────────────────
 * Extracts structured intelligence from bank PDF documents (annual reports,
 * strategy decks, financial statements) using pdf-parse + Claude AI.
 *
 * Flow:
 *   1. Extract text from PDF with pdf-parse
 *   2. Chunk text into ~60K char segments (Claude context limit)
 *   3. Send each chunk to Claude for structured extraction
 *   4. Merge chunk results into a unified extraction
 *   5. Write to SQLite under pdf_* namespaced keys
 *   6. Store full extraction in ai_analyses table
 *   7. Log to ingestion_log
 *
 * Usage:
 *   node scripts/ingestPdf.mjs <file.pdf> --bank Nordea_Sweden
 *   node scripts/ingestPdf.mjs <file.pdf> --bank "Danske Bank_Denmark"
 *   node scripts/ingestPdf.mjs <file.pdf> --detect        # Auto-detect bank from PDF content
 *   node scripts/ingestPdf.mjs <file.pdf> --dry-run       # Preview without writing to DB
 *
 * Requires: ANTHROPIC_API_KEY environment variable
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';
import { randomUUID } from 'crypto';
import { PDFParse } from 'pdf-parse';
import { getDb, closeDb } from './db.mjs';
import { BANK_SOURCES } from './config.mjs';
import { logIngestion, mergePdfExtraction, resolveBankKey } from './lib/mergeHelpers.mjs';

// ── Constants ──
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_CHUNK_CHARS = 60000; // Leave headroom for the prompt
const OVERLAP_CHARS = 2000;    // Overlap between chunks for context continuity

// ── CLI Parsing ──
const args = process.argv.slice(2);
const pdfPath = args.find(a => !a.startsWith('--'));
const bankFlag = args.includes('--bank') ? args[args.indexOf('--bank') + 1] : null;
const detectBank = args.includes('--detect');
const dryRun = args.includes('--dry-run');

// ── Pretty Logging ──
const log = {
  header: (msg) => console.log(`\n${'═'.repeat(60)}\n  ${msg}\n${'═'.repeat(60)}`),
  section: (msg) => console.log(`\n┌─ ${msg}`),
  done: (msg) => console.log(`└─ ✅ ${msg}`),
  warn: (msg) => console.log(`│  ⚠️  ${msg}`),
  error: (msg) => console.log(`│  ❌ ${msg}`),
  info: (msg) => console.log(`│  ${msg}`),
};

// ── Claude API Call ──

async function callClaude(systemPrompt, userMessage, maxTokens = 4096) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000); // 2 min timeout for large extractions

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Claude API ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    return text;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Text Chunking ──

function chunkText(text, maxChars = MAX_CHUNK_CHARS, overlap = OVERLAP_CHARS) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChars;

    // Try to break at a paragraph boundary
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n\n', end);
      if (lastNewline > start + maxChars * 0.5) {
        end = lastNewline;
      }
    } else {
      end = text.length;
    }

    chunks.push(text.slice(start, end));

    // Next chunk starts with overlap for context continuity
    start = end - overlap;
    if (start < 0) start = 0;
    if (end >= text.length) break;
  }

  return chunks;
}

// ── Extraction Prompt ──

const EXTRACTION_SYSTEM_PROMPT = `You are a financial analyst extracting structured intelligence from bank documents (annual reports, strategy presentations, financial statements).

Extract information into these categories. Return a JSON object with these keys — include only sections where you find relevant data:

{
  "bank_profile": {
    "total_assets": "string with currency",
    "revenue": "string with currency",
    "net_income": "string with currency",
    "employees": "number or string",
    "customers": "string",
    "branches": "number or string",
    "countries_active": ["list"],
    "year_founded": "number",
    "fiscal_year": "string"
  },
  "digital_strategy": {
    "digital_customers": "string (% or number)",
    "mobile_users": "string",
    "digital_transactions_pct": "string",
    "key_initiatives": ["list of strategic digital initiatives"],
    "tech_investments": "string",
    "cloud_strategy": "string"
  },
  "leadership": [
    { "name": "string", "title": "string", "background": "string (brief)" }
  ],
  "competitive_landscape": {
    "market_position": "string",
    "key_competitors": ["list"],
    "differentiators": ["list"],
    "market_share": "string if available"
  },
  "pain_points_indicators": [
    { "area": "string", "description": "string", "evidence": "quoted text" }
  ],
  "strategic_priorities": [
    { "priority": "string", "description": "string", "timeline": "string if stated" }
  ],
  "risk_factors": [
    { "risk": "string", "description": "string", "mitigation": "string if stated" }
  ]
}

Rules:
- Only include sections where you find relevant data
- Use exact numbers and quotes from the document
- Flag uncertainty with "(estimated)" suffix
- For financial figures, always include the currency
- Keep descriptions concise (1-2 sentences max)
- Return ONLY valid JSON — no markdown code fences, no comments`;

// ── Bank Detection ──

function detectBankFromText(text) {
  const firstChunk = text.slice(0, 5000).toLowerCase();

  // Score each bank by name mentions in the first pages
  let bestMatch = null;
  let bestScore = 0;

  for (const [configKey, cfg] of Object.entries(BANK_SOURCES)) {
    const name = cfg.name.toLowerCase();
    const regex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = firstChunk.match(regex);
    const score = matches ? matches.length : 0;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = configKey;
    }
  }

  if (bestScore >= 2) {
    return bestMatch;
  }
  return null;
}

// ── Merge Chunk Results ──

function mergeChunkResults(results) {
  const merged = {};

  for (const chunk of results) {
    if (!chunk) continue;

    for (const [key, value] of Object.entries(chunk)) {
      if (!merged[key]) {
        merged[key] = value;
        continue;
      }

      // Merge arrays (deduplicate by first significant field)
      if (Array.isArray(value) && Array.isArray(merged[key])) {
        const existing = new Set(merged[key].map(item =>
          JSON.stringify(typeof item === 'object' ? Object.values(item)[0] : item)
        ));
        for (const item of value) {
          const sig = JSON.stringify(typeof item === 'object' ? Object.values(item)[0] : item);
          if (!existing.has(sig)) {
            merged[key].push(item);
            existing.add(sig);
          }
        }
      }
      // Merge objects (prefer non-null values from later chunks)
      else if (typeof value === 'object' && typeof merged[key] === 'object') {
        for (const [k, v] of Object.entries(value)) {
          if (v !== null && v !== undefined && v !== '') {
            merged[key][k] = v;
          }
        }
      }
      // Strings: keep whichever is longer (more detail)
      else if (typeof value === 'string' && typeof merged[key] === 'string') {
        if (value.length > merged[key].length) merged[key] = value;
      }
    }
  }

  return merged;
}

// ── Main ──

async function main() {
  // Validate inputs
  if (!pdfPath) {
    console.error('Usage: node scripts/ingestPdf.mjs <file.pdf> --bank <BankKey>');
    console.error('       node scripts/ingestPdf.mjs <file.pdf> --detect');
    process.exit(1);
  }

  const resolvedPath = resolve(pdfPath);
  if (!existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set. This tool requires Claude AI for extraction.');
    console.error('Set it with: export ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
  }

  const runId = randomUUID();
  log.header('PDF Intelligence Extraction');
  console.log(`  📄 File: ${basename(resolvedPath)}`);
  console.log(`  🆔 Run: ${runId.slice(0, 8)}`);
  if (dryRun) console.log('  🧪 DRY RUN — will not write to database');

  // ── Step 1: Extract text from PDF ──
  log.section('Extracting text from PDF');
  const pdfBuffer = readFileSync(resolvedPath);
  const parser = new PDFParse({ data: pdfBuffer, verbosity: 0 });
  await parser.load();
  const pdfData = await parser.getText();
  const text = pdfData.text;
  const numPages = pdfData.pages?.length || 0;
  parser.destroy();

  log.info(`Pages: ${numPages}`);
  log.info(`Characters: ${text.length.toLocaleString()}`);
  log.done('Text extracted');

  if (text.length < 100) {
    log.error('PDF appears to be empty or image-only (no extractable text)');
    process.exit(1);
  }

  // ── Step 2: Resolve bank key ──
  let bankKey = bankFlag;

  if (detectBank && !bankKey) {
    log.section('Auto-detecting bank');
    const detected = detectBankFromText(text);
    if (detected) {
      bankKey = detected;
      log.done(`Detected: ${BANK_SOURCES[detected]?.name || detected}`);
    } else {
      log.error('Could not detect bank from PDF content. Use --bank <key> to specify.');
      process.exit(1);
    }
  }

  if (!bankKey) {
    log.error('No bank specified. Use --bank <key> or --detect');
    console.error('\nAvailable banks:');
    for (const [key, cfg] of Object.entries(BANK_SOURCES)) {
      console.error(`  ${key.padEnd(30)} (${cfg.name})`);
    }
    process.exit(1);
  }

  // Resolve to DB key
  const db = getDb();
  const dbKey = resolveBankKey(db, bankKey, BANK_SOURCES[bankKey]?.name);

  if (!dbKey) {
    log.error(`Bank "${bankKey}" not found in database`);
    closeDb();
    process.exit(1);
  }

  log.info(`Bank: ${bankKey} → DB key: ${dbKey}`);

  // ── Step 3: Chunk and extract ──
  const chunks = chunkText(text);
  log.section(`Extracting intelligence (${chunks.length} chunk${chunks.length > 1 ? 's' : ''})`);

  const chunkResults = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkNum = i + 1;
    log.info(`Chunk ${chunkNum}/${chunks.length} (${chunks[i].length.toLocaleString()} chars)...`);

    try {
      const response = await callClaude(
        EXTRACTION_SYSTEM_PROMPT,
        `Extract intelligence from this section of a bank document (chunk ${chunkNum}/${chunks.length}):\n\n${chunks[i]}`
      );

      // Parse JSON response
      let parsed;
      try {
        // Handle potential markdown code fences
        const jsonStr = response.replace(/^```json?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
        parsed = JSON.parse(jsonStr);
      } catch {
        log.warn(`Chunk ${chunkNum}: Could not parse JSON response — skipping`);
        parsed = null;
      }

      chunkResults.push(parsed);
      log.info(`Chunk ${chunkNum}: ${parsed ? Object.keys(parsed).length + ' sections' : 'no data'}`);

      // Rate limit between API calls
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (err) {
      log.error(`Chunk ${chunkNum} failed: ${err.message}`);
      chunkResults.push(null);
    }
  }

  // ── Step 4: Merge results ──
  const validResults = chunkResults.filter(Boolean);
  if (validResults.length === 0) {
    log.error('No valid extractions — nothing to save');
    closeDb();
    process.exit(1);
  }

  log.section('Merging extraction results');
  const merged = mergeChunkResults(validResults);
  const sections = Object.keys(merged);
  log.info(`Merged sections: ${sections.join(', ')}`);
  log.done(`${sections.length} sections extracted`);

  // ── Step 5: Write to database ──
  if (!dryRun) {
    log.section('Writing to database');

    try {
      const ok = mergePdfExtraction(db, dbKey, merged, runId);
      if (ok) {
        log.done('Written to banks.data.pdf_* and ai_analyses table');
      } else {
        log.error('Failed to write — bank may not exist in DB');
      }
    } catch (err) {
      log.error(`Database write failed: ${err.message}`);
      logIngestion(db, runId, dbKey, 'pdf_ingest', 'error', 'banks', err.message);
    }
  } else {
    log.section('Dry run — extraction preview');
    console.log(JSON.stringify(merged, null, 2).slice(0, 2000));
    if (JSON.stringify(merged).length > 2000) {
      console.log(`  ... (${JSON.stringify(merged).length.toLocaleString()} chars total)`);
    }
  }

  closeDb();

  // ── Summary ──
  log.header('Extraction Complete');
  console.log(`  📄 Source: ${basename(resolvedPath)} (${numPages} pages)`);
  console.log(`  🏦 Bank: ${BANK_SOURCES[bankKey]?.name || bankKey}`);
  console.log(`  📊 Sections: ${sections.join(', ')}`);
  console.log(`  📦 Chunks: ${chunks.length} total, ${validResults.length} successful`);
  if (!dryRun) {
    console.log(`  💾 Database: data/market-intelligence.db`);
    console.log(`  🔑 Namespace: pdf_financials, pdf_digital_strategy, pdf_leadership, etc.`);
  }
}

main().catch(err => {
  console.error('\n❌ PDF ingestion crashed:', err);
  process.exit(1);
});
