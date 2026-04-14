#!/usr/bin/env node
/**
 * Local API Proxy Server
 * ──────────────────────
 * Provides a lightweight HTTP API that the React app can call to
 * route requests to the Claude API, keeping the API key server-side.
 *
 * Route modules:
 *   routes/ai.mjs        — AI / research endpoints
 *   routes/data.mjs       — CRUD + search endpoints
 *   routes/ingestion.mjs  — Audit trail + freshness endpoints
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/apiProxy.mjs
 *   npm run api
 */

import dotenv from 'dotenv';
dotenv.config({ override: true, quiet: true });
import { createServer } from 'http';
import { isClaudeAvailable } from './fetchers/claudeAnalyzer.mjs';
import { getDb, parseRow, parseRows } from './db.mjs';

import { setCorsHeaders, jsonResponse, ALLOWED_ORIGINS } from './routes/helpers.mjs';
import { handleAiRoute } from './routes/ai.mjs';
import { handleDataRoute } from './routes/data.mjs';
import { handleIngestionRoute } from './routes/ingestion.mjs';
import { handleKnowledgeRoute } from './routes/knowledge.mjs';

const PORT = process.env.API_PORT || 3001;

// ── Route Handler ──
async function handleRequest(req, res) {
  const origin = req.headers.origin || '';
  setCorsHeaders(res, origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  try {
    const db = getDb();
    const ctx = { path, url, db, parseRow, parseRows };

    // Try each route module in order
    if (await handleAiRoute(req, res, ctx)) return;
    if (await handleDataRoute(req, res, ctx)) return;
    if (await handleIngestionRoute(req, res, ctx)) return;
    if (await handleKnowledgeRoute(req, res, ctx)) return;

    // ── 404 ──
    return jsonResponse(res, 404, { error: `Not found: ${path}` });
  } catch (err) {
    console.error(`❌ Error handling ${path}:`, err.message);
    return jsonResponse(res, 500, { error: err.message });
  }
}

// ── Start Server ──
const server = createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  🤖 Market Intelligence API Proxy`);
  console.log(`${'═'.repeat(50)}`);
  console.log(`  📍 http://localhost:${PORT}`);
  console.log(`  🔑 Claude API: ${isClaudeAvailable() ? '✅ Available' : '❌ Not configured'}`);
  console.log(`  📡 CORS: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`  📦 SQLite: data/market-intelligence.db`);
  console.log(`\n  AI Endpoints:`);
  console.log(`    GET  /api/status        — Check API availability`);
  console.log(`    POST /api/analyze       — Analyze raw intelligence`);
  console.log(`    POST /api/analyze-news  — Analyze bank news articles`);
  console.log(`    POST /api/deep-analysis — Deep bank analysis`);
  console.log(`\n  Data Endpoints:`);
  console.log(`    GET  /api/banks         — List all banks`);
  console.log(`    GET  /api/banks/:key    — Full bank profile`);
  console.log(`    POST /api/banks         — Create bank`);
  console.log(`    PUT  /api/banks/:key    — Update bank`);
  console.log(`    DEL  /api/banks/:key    — Delete bank`);
  console.log(`    GET  /api/markets       — List markets`);
  console.log(`    GET  /api/countries     — List countries`);
  console.log(`    GET  /api/stats         — Dashboard stats`);
  console.log(`    GET  /api/search?q=     — Full-text search`);
  console.log(`    GET  /api/signals       — Live + static signals (blended)`);
  console.log(`    POST /api/signals/refresh — Trigger signal refresh`);
  console.log(`    GET  /api/signals/status — Refresh status & stats`);
  console.log(`\n  Ingestion Endpoints:`);
  console.log(`    GET  /api/ingestion-log          — Pipeline audit trail`);
  console.log(`    GET  /api/banks/:key/freshness   — Data freshness per source`);
  console.log(`    GET  /api/banks/:key/ai-analyses — AI analysis results`);
  console.log(`\n  Knowledge Endpoints:`);
  console.log(`    GET  /api/knowledge/domains               — List domains`);
  console.log(`    GET  /api/knowledge/domains/:domain       — Full domain knowledge`);
  console.log(`    GET  /api/knowledge/domains/:domain/:file — Specific file`);
  console.log(`    GET  /api/knowledge/capability-taxonomy/:d — Maturity framework`);
  console.log(`    GET  /api/knowledge/benchmarks-csv        — Playbook benchmarks`);
  console.log(`    GET  /api/knowledge/for-bank/:key         — Bank-relevant knowledge`);
  console.log(`    GET  /api/knowledge/standards/:name       — Consulting standards`);
  console.log(`${'═'.repeat(50)}\n`);
});
