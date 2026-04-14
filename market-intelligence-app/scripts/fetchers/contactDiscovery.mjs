/**
 * Contact Discovery Module
 * ────────────────────────
 * Automated discovery of bank contacts from three sources:
 *   1. Press releases and IR news — extract mentioned executives
 *   2. Web search — targeted LinkedIn/appointment queries via Google News RSS
 *   3. Job postings — infer open senior roles from signal data
 *
 * Core function: upsertDiscoveredPerson() — shared upsert that
 * handles legacy verification, enrichment, and new inserts.
 *
 * Usage:
 *   import { runContactDiscovery } from './contactDiscovery.mjs';
 *   const result = await runContactDiscovery(['Nordea_Sweden']);
 */

import { createHash } from 'crypto';
import { getDb } from '../db.mjs';
import { callClaude, isApiKeyConfigured } from './claudeClient.mjs';
import { writeProvenance } from '../lib/provenanceWriter.mjs';
import { recordChange } from '../lib/changeWriter.mjs';
import { BANK_SOURCES } from '../config.mjs';

// Deterministic ID (same pattern as entityExtractor.mjs)

function entityId(bankKey, canonicalName) {
  return createHash('sha256')
    .update(`person|${bankKey}|${canonicalName}`)
    .digest('hex')
    .substring(0, 32);
}

// Role category inference (shared logic with entityExtractor)

const ROLE_CATEGORY_PATTERNS = [
  { pattern: /\b(CEO|CFO|CTO|CIO|COO|CRO|CCO|CPIO|CMO|CDO|Chief)\b/i, category: 'C-suite' },
  { pattern: /\b(President|Group Head)\b/i, category: 'C-suite' },
  { pattern: /\b(EVP|SVP|Senior Vice President|Executive Vice President)\b/i, category: 'SVP' },
  { pattern: /\b(VP|Vice President)\b/i, category: 'VP' },
  { pattern: /\b(Head of|Director|Managing Director)\b/i, category: 'Director' },
  { pattern: /\b(Manager|Lead)\b/i, category: 'Manager' },
];

function inferRoleCategory(role) {
  if (!role) return null;
  for (const { pattern, category } of ROLE_CATEGORY_PATTERNS) {
    if (pattern.test(role)) return category;
  }
  return null;
}

const LOB_PATTERNS = [
  { pattern: /\b(technology|digital|IT|CTO|CIO|platform|architect)\b/i, lob: 'Technology' },
  { pattern: /\b(retail|personal|consumer|private)\b/i, lob: 'Retail Banking' },
  { pattern: /\b(SME|business|commercial|corporate)\b/i, lob: 'Business Banking' },
  { pattern: /\b(finance|CFO|treasury|accounting)\b/i, lob: 'Finance' },
  { pattern: /\b(risk|compliance|CRO|AML|KYC)\b/i, lob: 'Risk & Compliance' },
  { pattern: /\b(wealth|asset|investment|advisory|pension)\b/i, lob: 'Wealth Management' },
  { pattern: /\b(insurance|bancassurance)\b/i, lob: 'Insurance' },
  { pattern: /\b(marketing|CMO|brand|communication)\b/i, lob: 'Marketing' },
  { pattern: /\b(operations|COO|process|efficiency)\b/i, lob: 'Operations' },
  { pattern: /\b(HR|human|people|talent|culture)\b/i, lob: 'Human Resources' },
];

function inferLob(role) {
  if (!role) return null;
  for (const { pattern, lob } of LOB_PATTERNS) {
    if (pattern.test(role)) return lob;
  }
  return null;
}

// ═══════════════════════════════════════════════
// SHARED UPSERT
// ═══════════════════════════════════════════════

/**
 * Upsert a discovered person into the persons table.
 * - If exists AND is_legacy=1: verify (upgrade to non-legacy)
 * - If exists AND is_legacy=0: enrich only (add missing fields)
 * - If not exists: insert new row
 * @returns {{ action: 'verified'|'inserted'|'updated'|'skipped', name: string }}
 */
export function upsertDiscoveredPerson(bankKey, person, sourceType) {
  const db = getDb();
  const name = (person.name || '').trim();

  // Name must have at least 2 words
  if (!name || name.split(/\s+/).length < 2) {
    return { action: 'skipped', name: name || '(empty)' };
  }

  // Skip placeholders
  if (name.startsWith('(') || name.toLowerCase().startsWith('open role')) {
    return { action: 'skipped', name };
  }

  const existing = db.prepare(
    'SELECT id, is_legacy, role, lob, linkedin_url, note FROM persons WHERE bank_key = ? AND canonical_name = ?'
  ).get(bankKey, name);

  const role = person.role || null;
  const roleCategory = inferRoleCategory(role);
  const lob = person.lob || inferLob(role);
  const note = person.context || person.note || null;
  const linkedinUrl = person.linkedin_url || null;

  if (existing) {
    // Role change detection — record before updating
    if (role && existing.role && role !== existing.role) {
      recordChange({
        entityType: 'person',
        entityKey: bankKey,
        fieldPath: `person.${name}.role`,
        oldValue: existing.role,
        newValue: role,
        source: sourceType,
      });
    }

    if (existing.is_legacy === 1) {
      // Legacy person found again by pipeline — verify them
      db.prepare(`
        UPDATE persons SET
          role = COALESCE(?, role),
          role_category = COALESCE(?, role_category),
          lob = COALESCE(?, lob),
          linkedin_url = COALESCE(?, linkedin_url),
          note = CASE WHEN ? IS NOT NULL AND length(?) > length(COALESCE(note, '')) THEN ? ELSE note END,
          is_legacy = 0,
          discovery_source = ?,
          verified_at = datetime('now'),
          updated_at = datetime('now')
        WHERE bank_key = ? AND canonical_name = ?
      `).run(role, roleCategory, lob, linkedinUrl, note, note, note, sourceType, bankKey, name);

      writeProvenanceForPerson(bankKey, name, sourceType);
      return { action: 'verified', name };

    } else {
      // Non-legacy — enrich only (add missing fields, never overwrite existing)
      const updates = [];
      const values = [];
      if (!existing.lob && lob) { updates.push('lob = ?'); values.push(lob); }
      if (!existing.linkedin_url && linkedinUrl) { updates.push('linkedin_url = ?'); values.push(linkedinUrl); }
      if (!existing.note && note) { updates.push('note = ?'); values.push(note); }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        values.push(bankKey, name);
        db.prepare(`UPDATE persons SET ${updates.join(', ')} WHERE bank_key = ? AND canonical_name = ?`).run(...values);
        return { action: 'updated', name };
      }
      return { action: 'skipped', name };
    }
  }

  // New person — insert
  const id = entityId(bankKey, name);
  db.prepare(`
    INSERT INTO persons (id, bank_key, canonical_name, role, role_category, lob, linkedin_url, note, confidence_tier, is_legacy, discovery_source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 2, 0, ?)
  `).run(id, bankKey, name, role, roleCategory, lob, linkedinUrl, note, sourceType);

  writeProvenanceForPerson(bankKey, name, sourceType);
  return { action: 'inserted', name };
}

function writeProvenanceForPerson(bankKey, canonicalName, sourceType) {
  writeProvenance(
    'person',
    bankKey,
    `person.${canonicalName}`,
    canonicalName,
    sourceType,
    null,
    new Date().toISOString().slice(0, 10),
    2
  );
}

// ═══════════════════════════════════════════════
// SOURCE 1: Press Release Person Extraction
// ═══════════════════════════════════════════════

const EXTRACTION_PROMPT = `Extract people mentioned in this text who are employees or executives of the specified bank.
Return ONLY valid JSON, no markdown:
{
  "persons": [
    {
      "name": "Full Name",
      "role": "Their exact title as mentioned",
      "lob": "inferred line of business or null",
      "context": "one sentence about their relevance"
    }
  ]
}
If no bank employees are mentioned, return { "persons": [] }
Ignore external partners, customers, regulators, and journalists.`;

async function fetchArticleText(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaPipeline/1.0)' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) return null;
    const html = await res.text();
    // Strip HTML tags for plain text
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000); // Cap at 8K chars for Claude context
  } catch {
    return null;
  }
}

export async function discoverFromPressReleases(bankKey, bankName) {
  const db = getDb();
  const results = { verified: 0, inserted: 0, updated: 0, skipped: 0 };

  const signals = db.prepare(`
    SELECT title, source_url, snippet FROM live_signals
    WHERE bank_key = ? AND fetched_at > datetime('now', '-30 days')
    AND (source LIKE '%press%' OR source LIKE '%ir%' OR source LIKE '%cision%' OR source LIKE '%globe%')
    ORDER BY relevance_score DESC
    LIMIT 5
  `).all(bankKey);

  if (signals.length === 0) return results;

  for (const signal of signals) {
    // Try full article text, fall back to snippet
    let text = null;
    if (signal.source_url) {
      text = await fetchArticleText(signal.source_url);
    }
    if (!text) {
      text = [signal.title, signal.snippet].filter(Boolean).join('\n');
    }
    if (!text || text.length < 50) continue;

    try {
      const raw = await callClaude(
        EXTRACTION_PROMPT,
        `Bank: ${bankName}\n\nText:\n${text}`,
        { maxTokens: 1000, timeout: 20000 }
      );

      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      for (const person of (parsed.persons || [])) {
        const result = upsertDiscoveredPerson(bankKey, person, 'press_release');
        results[result.action]++;
      }
    } catch (err) {
      console.error(`   Warning: Press release extraction failed for ${bankKey}: ${err.message}`);
    }
  }

  return results;
}

// ═══════════════════════════════════════════════
// SOURCE 2: Web Search Discovery
// ═══════════════════════════════════════════════

async function searchGoogleNews(query, maxResults = 5) {
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=en&gl=US&ceid=US:en`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) && items.length < maxResults) {
      const itemXml = match[1];
      const title = (itemXml.match(/<title>(.*?)<\/title>/) || [])[1] || '';
      const cleanTitle = title.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      if (cleanTitle) items.push({ title: cleanTitle });
    }
    return items;
  } catch {
    return [];
  }
}

export async function discoverFromWebSearch(bankKey, bankName) {
  const results = { verified: 0, inserted: 0, updated: 0, skipped: 0 };

  const queries = [
    `"${bankName}" "Head of" OR "Chief" OR "Director" 2025 OR 2026`,
    `"${bankName}" appointed OR named OR joins executive`,
    `"${bankName}" digital banking OR transformation leadership`,
  ];

  const allHeadlines = [];
  const seenTitles = new Set();

  for (const query of queries) {
    const articles = await searchGoogleNews(query, 3);
    for (const article of articles) {
      if (!seenTitles.has(article.title)) {
        seenTitles.add(article.title);
        allHeadlines.push(article.title);
      }
    }
  }

  if (allHeadlines.length === 0) return results;

  const articleText = allHeadlines.map((t, i) => `Article ${i + 1}: ${t}`).join('\n');

  try {
    const raw = await callClaude(
      EXTRACTION_PROMPT,
      `Bank: ${bankName}\n\nExtract executives mentioned in these news headlines:\n${articleText}`,
      { maxTokens: 1500, timeout: 20000 }
    );

    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const seen = new Set();
    for (const person of (parsed.persons || [])) {
      const key = (person.name || '').trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const result = upsertDiscoveredPerson(bankKey, person, 'web_search');
      results[result.action]++;
    }
  } catch (err) {
    console.error(`   Warning: Web search extraction failed for ${bankKey}: ${err.message}`);
  }

  return results;
}

// ═══════════════════════════════════════════════
// SOURCE 3: Job Posting Role Inference
// ═══════════════════════════════════════════════

export async function discoverFromJobPostings(bankKey, bankName) {
  const db = getDb();
  const results = { verified: 0, inserted: 0, updated: 0, skipped: 0 };

  const signals = db.prepare(`
    SELECT title FROM live_signals
    WHERE bank_key = ? AND relevance_score >= 6
    AND (title LIKE '%hiring%' OR title LIKE '%recruit%' OR title LIKE '%appoint%'
      OR title LIKE '%vacancy%' OR title LIKE '%job%' OR title LIKE '%career%'
      OR title LIKE '%head of%' OR title LIKE '%director%' OR title LIKE '%chief%')
    AND fetched_at > datetime('now', '-60 days')
    LIMIT 10
  `).all(bankKey);

  if (signals.length === 0) return results;

  const titles = signals.map(s => s.title).join('\n');

  try {
    const jobSystemPrompt = `For each job posting or appointment announcement, extract the role being filled.
Only include senior roles: Head, Chief, Director, VP, SVP, Managing Director, EVP.
Return ONLY valid JSON:
{ "roles": [{ "title": "extracted role title", "lob": "inferred line of business or null" }] }
If no senior roles found, return { "roles": [] }`;
    const raw = await callClaude(
      jobSystemPrompt,
      `Bank: ${bankName}\n\nJob/appointment signals:\n${titles}`,
      { maxTokens: 1000, timeout: 15000 }
    );

    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    for (const role of (parsed.roles || [])) {
      if (!role.title) continue;
      const openRoleName = `Open Role: ${role.title}`;
      const id = entityId(bankKey, openRoleName);

      const existing = db.prepare('SELECT id FROM persons WHERE bank_key = ? AND canonical_name = ?').get(bankKey, openRoleName);
      if (existing) { results.skipped++; continue; }

      db.prepare(`
        INSERT INTO persons (id, bank_key, canonical_name, role, role_category, lob, confidence_tier, is_legacy, discovery_source)
        VALUES (?, ?, ?, ?, ?, ?, 3, 0, 'job_posting')
      `).run(id, bankKey, openRoleName, role.title, inferRoleCategory(role.title), role.lob || inferLob(role.title));

      results.inserted++;
    }
  } catch (err) {
    console.error(`   Warning: Job posting extraction failed for ${bankKey}: ${err.message}`);
  }

  return results;
}

// ═══════════════════════════════════════════════
// SOURCE 4: LinkedIn URL Resolution
// ═══════════════════════════════════════════════

/**
 * For each person at this bank without a linkedin_url,
 * search Google for their LinkedIn profile and write the URL if found.
 * Only writes direct profile URLs (containing /in/), never search pages.
 */
export async function resolveLinkedInUrls(bankKey, bankName) {
  const db = getDb();
  const stats = { resolved: 0, skipped: 0 };

  // Get persons without LinkedIn URLs (max 5 per run to control costs)
  const persons = db.prepare(
    "SELECT id, canonical_name, role FROM persons WHERE bank_key = ? AND linkedin_url IS NULL AND canonical_name NOT LIKE 'Open Role:%' LIMIT 5"
  ).all(bankKey);

  if (persons.length === 0) return stats;

  for (const person of persons) {
    try {
      const query = `"${person.canonical_name}" "${bankName}" site:linkedin.com`;
      const articles = await searchGoogleNews(query, 3);

      // Look for a direct LinkedIn profile URL in the results
      let linkedinUrl = null;
      for (const article of articles) {
        // Google News results for site:linkedin.com often have the LinkedIn URL in the title or link
        const title = article.title || '';
        // Extract linkedin.com/in/ URLs from the title text
        const match = title.match(/linkedin\.com\/in\/[\w-]+/i);
        if (match) {
          linkedinUrl = `https://www.${match[0]}`;
          break;
        }
      }

      // If Google News didn't surface it, try a direct search via Google
      if (!linkedinUrl) {
        const directQuery = encodeURIComponent(`${person.canonical_name} ${bankName} linkedin`);
        const searchUrl = `https://news.google.com/rss/search?q=${directQuery}+site:linkedin.com&hl=en&gl=US&ceid=US:en`;
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(searchUrl, { signal: controller.signal });
          clearTimeout(timer);
          if (res.ok) {
            const xml = await res.text();
            const linkMatch = xml.match(/linkedin\.com\/in\/[\w-]+/i);
            if (linkMatch) {
              linkedinUrl = `https://www.${linkMatch[0]}`;
            }
          }
        } catch { /* timeout or network error — skip */ }
      }

      if (linkedinUrl && linkedinUrl.includes('/in/')) {
        db.prepare('UPDATE persons SET linkedin_url = ?, updated_at = datetime(\'now\') WHERE id = ?').run(linkedinUrl, person.id);

        // Write provenance — tier 2 (inferred, not human-verified)
        writeProvenance(
          'person', bankKey,
          `person.${person.canonical_name}.linkedin`,
          linkedinUrl, 'web_search', null,
          new Date().toISOString().slice(0, 10), 2
        );

        stats.resolved++;
      } else {
        stats.skipped++;
      }
    } catch (err) {
      console.error(`   Warning: LinkedIn resolve failed for ${person.canonical_name}: ${err.message}`);
      stats.skipped++;
    }

    // Rate limit between lookups (avoid hammering Google)
    await new Promise(r => setTimeout(r, 2000));
  }

  return stats;
}

// ═══════════════════════════════════════════════
// DEPARTURE DETECTION — Flag Stale Contacts
// ═══════════════════════════════════════════════

/**
 * Checks for contacts that haven't been re-discovered in recent pipeline runs.
 * After 3+ full pipeline runs without being found, flags them as potentially departed.
 * Uses a simple heuristic: if verified_at is older than 90 days and the person
 * hasn't been seen in any recent signals, mark as stale.
 */
export function flagStaleContacts(bankKey) {
  const db = getDb();
  const stats = { flagged: 0, total: 0 };

  // Get non-legacy persons verified more than 90 days ago (or never verified)
  const stalePersons = db.prepare(`
    SELECT id, canonical_name, verified_at, note FROM persons
    WHERE bank_key = ? AND is_legacy = 0
    AND canonical_name NOT LIKE 'Open Role:%'
    AND (verified_at IS NULL OR verified_at < datetime('now', '-90 days'))
  `).all(bankKey);

  stats.total = stalePersons.length;

  for (const person of stalePersons) {
    // Check if this person appears in any recent signals (last 60 days)
    const recentMention = db.prepare(`
      SELECT COUNT(*) as c FROM live_signals
      WHERE bank_key = ? AND fetched_at > datetime('now', '-60 days')
      AND (title LIKE ? OR snippet LIKE ?)
    `).get(bankKey, `%${person.canonical_name.split(' ').pop()}%`, `%${person.canonical_name.split(' ').pop()}%`);

    if (recentMention.c === 0) {
      // No recent mentions — add a stale note if not already flagged
      if (!person.note?.includes('[STALE CONTACT]')) {
        const updatedNote = person.note
          ? `[STALE CONTACT — not seen in recent signals, verify still in role] ${person.note}`
          : '[STALE CONTACT — not seen in recent signals, verify still in role]';
        db.prepare("UPDATE persons SET note = ?, updated_at = datetime('now') WHERE id = ?").run(updatedNote, person.id);
        stats.flagged++;
      }
    }
  }

  return stats;
}

// ═══════════════════════════════════════════════
// ORCHESTRATOR
// ═══════════════════════════════════════════════

export async function runContactDiscovery(bankKeys = []) {
  if (!isApiKeyConfigured()) {
    console.log('  ⚠️  Claude API key not configured — skipping contact discovery');
    return { banksProcessed: 0, verified: 0, inserted: 0, updated: 0, skipped: 0 };
  }

  const allKeys = bankKeys.length > 0 ? bankKeys : Object.keys(BANK_SOURCES);
  const keys = allKeys.filter(k => !BANK_SOURCES[k]?.excluded);
  const totals = { banksProcessed: 0, verified: 0, inserted: 0, updated: 0, skipped: 0, linkedinResolved: 0, staleFlagged: 0 };

  for (const bankKey of keys) {
    const bankConfig = BANK_SOURCES[bankKey];
    if (!bankConfig) continue;

    const bankName = bankConfig.name;
    console.log(`  👤 [${bankKey}] Contact discovery...`);

    try {
      // Source 1-3: Discover and verify persons
      const pr = await discoverFromPressReleases(bankKey, bankName);
      const ws = await discoverFromWebSearch(bankKey, bankName);
      const jp = await discoverFromJobPostings(bankKey, bankName);

      // Source 4: Resolve LinkedIn URLs for persons missing them
      const li = await resolveLinkedInUrls(bankKey, bankName);

      // Departure detection: flag contacts not seen recently
      const stale = flagStaleContacts(bankKey);

      const bankTotal = {
        verified: pr.verified + ws.verified + jp.verified,
        inserted: pr.inserted + ws.inserted + jp.inserted,
        updated: pr.updated + ws.updated + jp.updated,
        skipped: pr.skipped + ws.skipped + jp.skipped,
        linkedinResolved: li.resolved,
        staleFlagged: stale.flagged,
      };

      totals.verified += bankTotal.verified;
      totals.inserted += bankTotal.inserted;
      totals.updated += bankTotal.updated;
      totals.skipped += bankTotal.skipped;
      totals.linkedinResolved += bankTotal.linkedinResolved;
      totals.staleFlagged += bankTotal.staleFlagged;
      totals.banksProcessed++;

      const parts = [];
      if (bankTotal.verified) parts.push(`${bankTotal.verified} verified`);
      if (bankTotal.inserted) parts.push(`${bankTotal.inserted} inserted`);
      if (bankTotal.updated) parts.push(`${bankTotal.updated} updated`);
      if (bankTotal.linkedinResolved) parts.push(`${bankTotal.linkedinResolved} LinkedIn resolved`);
      if (bankTotal.staleFlagged) parts.push(`${bankTotal.staleFlagged} stale flagged`);
      if (parts.length === 0) parts.push('no changes');
      console.log(`     ${parts.join(', ')}`);
    } catch (err) {
      console.error(`  ❌ [${bankKey}] Contact discovery failed: ${err.message}`);
    }

    // Rate limit between banks
    if (keys.indexOf(bankKey) < keys.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  return totals;
}

// Standalone execution
const isMain = process.argv[1] && process.argv[1].endsWith('contactDiscovery.mjs');
if (isMain) {
  const bankKeys = process.argv.slice(2);
  console.log('\n══════════════════════════════════════════');
  console.log('  👤 Contact Discovery');
  console.log('══════════════════════════════════════════');
  console.log(`  Banks: ${bankKeys.length > 0 ? bankKeys.join(', ') : 'ALL'}\n`);

  runContactDiscovery(bankKeys).then(totals => {
    console.log('\n  ── Summary ──');
    console.log(`  Banks processed: ${totals.banksProcessed}`);
    console.log(`  Verified: ${totals.verified} | Inserted: ${totals.inserted} | Updated: ${totals.updated} | Skipped: ${totals.skipped}`);
    console.log(`  LinkedIn resolved: ${totals.linkedinResolved} | Stale flagged: ${totals.staleFlagged}`);
    process.exit(0);
  }).catch(err => {
    console.error('Contact discovery crashed:', err);
    process.exit(1);
  });
}
