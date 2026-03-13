#!/usr/bin/env node
/**
 * Local API Proxy Server
 * ──────────────────────
 * Provides a lightweight HTTP API that the React app can call to
 * route requests to the Claude API, keeping the API key server-side.
 *
 * Endpoints:
 *   POST /api/analyze       — Analyze raw intelligence text
 *   POST /api/analyze-news  — Analyze news articles for a bank
 *   GET  /api/status        — Check if API key is configured
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/apiProxy.mjs
 *   npm run api
 */

import dotenv from 'dotenv';
dotenv.config({ override: true, quiet: true });
import { createServer } from 'http';
import { structureIntelWithClaude, analyzeNewsForBank, deepAnalyzeBank, isClaudeAvailable } from './fetchers/claudeAnalyzer.mjs';
import { researchPerson, enrichContext, isResearchAvailable } from './fetchers/personResearch.mjs';
import { generateMeetingPrep, isMeetingPrepAvailable } from './fetchers/meetingPrepAgent.mjs';
import { analyzeLandingZones, isLandingZoneAgentAvailable } from './fetchers/landingZoneAgent.mjs';
import { generateDiscoveryStoryline, isDiscoveryStorylineAvailable } from './fetchers/discoveryStorylineAgent.mjs';
import { generateValueHypothesisForMeeting, isValueHypothesisAvailable } from './fetchers/valueHypothesisAgent.mjs';
import { getDb, parseRow, parseRows } from './db.mjs';

const PORT = process.env.API_PORT || 3001;
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173', 'http://127.0.0.1:5173'];

// ── CORS Helper ──
function setCorsHeaders(res, origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// ── Request Body Parser ──
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString();
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

// ── JSON Response Helper ──
function jsonResponse(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ── Qualification Score Calculator (mirrors client-side calcScoreFromData) ──
const QUAL_WEIGHTS = {
  firmographics: 0.10, technographics: 0.15, decision_process: 0.10,
  landing_zones: 0.20, pain_push: 0.20, power_map: 0.15, partner_access: 0.10,
};
function calcBankScore(qualData) {
  if (!qualData) return 0;
  let w = 0;
  for (const [dim, weight] of Object.entries(QUAL_WEIGHTS)) {
    const d = qualData[dim];
    if (d && typeof d.score === 'number') w += d.score * weight;
  }
  if (qualData.power_map?.activated) w += 1.0;
  if (qualData.partner_access?.backbase_access) w += 0.5;
  return Math.round(Math.min(w, 10) * 10) / 10;
}

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

    // ── GET /api/status ──
    if (path === '/api/status' && req.method === 'GET') {
      return jsonResponse(res, 200, {
        available: isClaudeAvailable(),
        model: 'claude-sonnet-4-20250514',
        timestamp: new Date().toISOString(),
      });
    }

    // ── POST /api/analyze ──
    if (path === '/api/analyze' && req.method === 'POST') {
      if (!isClaudeAvailable()) {
        return jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured' });
      }

      const { category, text, bankContext } = await parseBody(req);
      if (!category || !text) {
        return jsonResponse(res, 400, { error: 'Missing required fields: category, text' });
      }

      console.log(`🤖 Analyzing ${category} for ${bankContext?.bankName || 'unknown bank'}...`);
      const result = await structureIntelWithClaude(category, text, bankContext || {});
      console.log(`   ✅ Analysis complete`);
      return jsonResponse(res, 200, { result, _source: 'claude-ai' });
    }

    // ── POST /api/analyze-news ──
    if (path === '/api/analyze-news' && req.method === 'POST') {
      if (!isClaudeAvailable()) {
        return jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured' });
      }

      const { bankName, articles } = await parseBody(req);
      if (!bankName || !articles) {
        return jsonResponse(res, 400, { error: 'Missing required fields: bankName, articles' });
      }

      console.log(`🤖 Analyzing ${articles.length} articles for ${bankName}...`);
      const result = await analyzeNewsForBank(bankName, articles);
      console.log(`   ✅ News analysis complete`);
      return jsonResponse(res, 200, { result, _source: 'claude-ai' });
    }

    // ── POST /api/deep-analysis ──
    if (path === '/api/deep-analysis' && req.method === 'POST') {
      if (!isClaudeAvailable()) {
        return jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured' });
      }

      const { bankName, analysisType, context } = await parseBody(req);
      if (!bankName || !analysisType) {
        return jsonResponse(res, 400, { error: 'Missing required fields: bankName, analysisType' });
      }

      console.log(`🤖 Deep analysis (${analysisType}) for ${bankName}...`);
      const result = await deepAnalyzeBank(bankName, analysisType, context || {});
      console.log(`   ✅ ${analysisType} analysis complete`);
      return jsonResponse(res, 200, { result, _source: 'claude-ai', analysisType });
    }

    // ── GET /api/research/status ── Check if research is available
    if (path === '/api/research/status' && req.method === 'GET') {
      return jsonResponse(res, 200, { available: isResearchAvailable() });
    }

    // ── POST /api/research/person ── Research a meeting attendee
    if (path === '/api/research/person' && req.method === 'POST') {
      if (!isResearchAvailable()) {
        return jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured. Person research requires AI.' });
      }

      const { name, role, customRole, bankName, bankContext } = await parseBody(req);
      if (!name || !bankName) {
        return jsonResponse(res, 400, { error: 'Missing required fields: name, bankName' });
      }

      console.log(`🔍 Person research: ${name} at ${bankName}...`);
      const result = await researchPerson({ name, role, customRole, bankName, bankContext });
      console.log(`   ✅ Person research complete`);
      return jsonResponse(res, 200, { result });
    }

    // ── POST /api/research/context ── Enrich scope/pain point knowledge
    if (path === '/api/research/context' && req.method === 'POST') {
      if (!isResearchAvailable()) {
        return jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured. Context enrichment requires AI.' });
      }

      const { bankName, scopeText, painText, attendeeRoles, bankContext } = await parseBody(req);
      if (!bankName) {
        return jsonResponse(res, 400, { error: 'Missing required field: bankName' });
      }

console.log(`🔍 Context enrichment for ${bankName}...`);
      const result = await enrichContext({ bankName, scopeText, painText, attendeeRoles, bankContext });
      console.log(`   ✅ Context enrichment complete`);
      return jsonResponse(res, 200, { result });
    }
    // ── POST /api/research/meeting-prep ── Generate AI meeting prep brief
    if (path === '/api/research/meeting-prep' && req.method === 'POST') {
      if (!isMeetingPrepAvailable()) {
        return jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured. Meeting prep requires AI.' });
      }

      const { bankName, bankKey, attendees, topics, scopeKnown, painPointKnown, scopeText, painText } = await parseBody(req);
      if (!bankName || !bankKey || !topics?.length) {
        return jsonResponse(res, 400, { error: 'Missing required fields: bankName, bankKey, topics[]' });
      }

      // Load full bank data from SQLite
      const bankRow = db.prepare('SELECT data FROM banks WHERE key = ?').get(bankKey);
      const bankData = bankRow?.data ? JSON.parse(bankRow.data) : {};

      console.log(`📋 Meeting prep: ${bankName} | Topics: ${topics.join(', ')}`);
      const result = await generateMeetingPrep({
        bankName, bankKey, attendees, topics,
        scopeKnown, painPointKnown, scopeText, painText,
        bankData,
      });
      console.log(`   ✅ Meeting prep complete`);
      return jsonResponse(res, 200, { result });
    }

    // ── POST /api/research/landing-zones ── AI landing zone matrix analysis
    if (path === '/api/research/landing-zones' && req.method === 'POST') {
      if (!isLandingZoneAgentAvailable()) {
        return jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured. Landing zone analysis requires AI.' });
      }

      const { bankName, bankKey, meetingContext } = await parseBody(req);
      if (!bankName || !bankKey) {
        return jsonResponse(res, 400, { error: 'Missing required fields: bankName, bankKey' });
      }

      // Load full bank data from SQLite
      const bankRow = db.prepare('SELECT data FROM banks WHERE key = ?').get(bankKey);
      const bankData = bankRow?.data ? JSON.parse(bankRow.data) : {};

      console.log(`🎯 Landing zone analysis: ${bankName}${meetingContext ? ' (meeting-tailored)' : ''}...`);
      const result = await analyzeLandingZones({ bankName, bankKey, bankData, meetingContext });

      // Persist to landing_zone_matrix table (UPSERT)
      db.prepare(`
        INSERT INTO landing_zone_matrix (bank_key, matrix, plays, unconsidered, challenges, top_zones)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(bank_key) DO UPDATE SET
          matrix = excluded.matrix, plays = excluded.plays,
          unconsidered = excluded.unconsidered, challenges = excluded.challenges,
          top_zones = excluded.top_zones, updated_at = datetime('now')
      `).run(
        bankKey,
        JSON.stringify(result.matrix),
        JSON.stringify(result.modernizationPlays),
        JSON.stringify(result.unconsideredNeeds),
        JSON.stringify(result.challenges),
        JSON.stringify(result.topLandingZones)
      );

      console.log(`   ✅ Landing zone analysis complete and persisted`);
      return jsonResponse(res, 200, { result });
    }

    // ── POST /api/research/discovery-storyline ── AI discovery meeting storyline
    if (path === '/api/research/discovery-storyline' && req.method === 'POST') {
      if (!isDiscoveryStorylineAvailable()) {
        return jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured. Discovery storyline requires AI.' });
      }
      const { bankName, bankKey, meetingContext } = await parseBody(req);
      if (!bankName || !bankKey) {
        return jsonResponse(res, 400, { error: 'Missing required fields: bankName, bankKey' });
      }
      const bankRow = db.prepare('SELECT data FROM banks WHERE key = ?').get(bankKey);
      const bankData = bankRow?.data ? JSON.parse(bankRow.data) : {};
      const lzRow = db.prepare('SELECT * FROM landing_zone_matrix WHERE bank_key = ?').get(bankKey);
      const lzMatrixData = lzRow ? parseRow('landing_zone_matrix', lzRow) : null;
      console.log(`\n🎯 Discovery storyline generation: ${bankName}${meetingContext ? ' (meeting-tailored)' : ''}...`);
      const result = await generateDiscoveryStoryline({ bankName, bankKey, bankData, lzMatrixData, meetingContext });
      db.prepare(`
        INSERT INTO discovery_storylines (bank_key, storyline, roi_estimate, next_steps)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(bank_key) DO UPDATE SET
          storyline = excluded.storyline, roi_estimate = excluded.roi_estimate,
          next_steps = excluded.next_steps, updated_at = datetime('now')
      `).run(
        bankKey,
        JSON.stringify(result),
        JSON.stringify(result.illustrativeRoi || null),
        JSON.stringify(result.nextSteps || null)
      );
      console.log(`   ✅ Discovery storyline complete and persisted`);
      return jsonResponse(res, 200, { result });
    }

    // ── POST /api/research/value-hypothesis ── Meeting-tailored value hypothesis
    if (path === '/api/research/value-hypothesis' && req.method === 'POST') {
      if (!isValueHypothesisAvailable()) {
        return jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured.' });
      }
      const { bankName, bankKey, meetingContext } = await parseBody(req);
      if (!bankName || !bankKey) {
        return jsonResponse(res, 400, { error: 'Missing required fields: bankName, bankKey' });
      }
      const bankRow = db.prepare('SELECT data FROM banks WHERE key = ?').get(bankKey);
      const bankData = bankRow?.data ? JSON.parse(bankRow.data) : {};
      const vsRow = db.prepare('SELECT data FROM value_selling WHERE bank_key = ?').get(bankKey);
      const existingHypothesis = vsRow?.data ? JSON.parse(vsRow.data)?.value_hypothesis || null : null;

      console.log(`\n🎯 Value hypothesis generation: ${bankName} (meeting-tailored)...`);
      const result = await generateValueHypothesisForMeeting({
        bankName, bankData, meetingContext, existingHypothesis,
      });
      console.log(`   ✅ Value hypothesis complete`);
      return jsonResponse(res, 200, { result });
    }

    // ═══════════════════════════════════════════════════
    // DATA API — SQLite-backed CRUD endpoints
    // ═══════════════════════════════════════════════════

    // ── GET /api/banks ── List all banks (summary)
    if (path === '/api/banks' && req.method === 'GET') {
      const rows = db.prepare(`
        SELECT b.key, b.bank_name, b.country, b.tagline,
               q.data as qual_data,
               c.core_banking, c.digital_platform
        FROM banks b
        LEFT JOIN qualification q ON q.bank_key = b.key
        LEFT JOIN competition c ON c.bank_key = b.key
        ORDER BY b.bank_name
      `).all();

      const banks = rows.map(row => {
        const qd = row.qual_data ? JSON.parse(row.qual_data) : null;
        return {
          key: row.key,
          bank_name: row.bank_name,
          country: row.country,
          tagline: row.tagline,
          core_banking: row.core_banking,
          digital_platform: row.digital_platform,
          qualification: qd,
        };
      });
      return jsonResponse(res, 200, banks);
    }

    // ── GET /api/stats ── Dashboard stats
    if (path === '/api/stats' && req.method === 'GET') {
      const totalBanks = db.prepare('SELECT COUNT(*) as c FROM banks').get().c;
      const totalCountries = db.prepare('SELECT COUNT(*) as c FROM countries').get().c;
      const totalMarkets = db.prepare('SELECT COUNT(*) as c FROM markets WHERE has_data = 1').get().c;
      return jsonResponse(res, 200, { totalBanks, totalCountries, totalMarkets });
    }

    // ── GET /api/search?q= ── Full-text search
    if (path === '/api/search' && req.method === 'GET') {
      const q = url.searchParams.get('q');
      if (!q || q.length < 2) return jsonResponse(res, 200, { results: [], counts: {} });
      const term = `%${q.toLowerCase()}%`;
      const results = [];
      const counts = {};

      // Search banks (include qual data for score)
      const bankRows = db.prepare(`
        SELECT b.key, b.bank_name, b.country, b.tagline, b.data as bank_data, q.data as qual_data
        FROM banks b LEFT JOIN qualification q ON q.bank_key = b.key
        WHERE LOWER(b.bank_name) LIKE ? OR LOWER(b.country) LIKE ? OR LOWER(b.tagline) LIKE ? OR LOWER(b.data) LIKE ?
        LIMIT 20
      `).all(term, term, term, term);
      for (const r of bankRows) {
        const bd = r.bank_data ? JSON.parse(r.bank_data) : {};
        const qd = r.qual_data ? JSON.parse(r.qual_data) : null;
        const dealSize = bd.backbase_qualification?.deal_size;
        results.push({
          type: 'bank', name: r.bank_name,
          meta: r.country + (dealSize ? ' \u2022 ' + dealSize : ''),
          key: r.key, score: calcBankScore(qd),
        });

        // Extract KDMs from bank data for person results
        const kdms = bd.key_decision_makers || [];
        for (const dm of kdms) {
          if (dm.name && !dm.name.startsWith('(')) {
            const hay = (dm.name + ' ' + dm.role + ' ' + (dm.note || '')).toLowerCase();
            if (q.toLowerCase().split(/\s+/).every(w => hay.includes(w) || r.bank_name.toLowerCase().includes(w))) {
              results.push({
                type: 'person', name: dm.name,
                meta: r.bank_name + ' \u2014 ' + dm.role,
                bankKey: r.key,
              });
            }
          }
        }
      }

      // Also search KDMs in banks not matched above
      const personRows = db.prepare(`
        SELECT key, bank_name, data FROM banks
        WHERE LOWER(data) LIKE ? AND key NOT IN (${bankRows.map(() => '?').join(',') || "''"})
        LIMIT 20
      `).all(term, ...bankRows.map(r => r.key));
      for (const r of personRows) {
        const bd = JSON.parse(r.data);
        const kdms = bd.key_decision_makers || [];
        for (const dm of kdms) {
          if (dm.name && !dm.name.startsWith('(')) {
            const hay = (dm.name + ' ' + dm.role + ' ' + (dm.note || '')).toLowerCase();
            if (q.toLowerCase().split(/\s+/).every(w => hay.includes(w))) {
              results.push({
                type: 'person', name: dm.name,
                meta: r.bank_name + ' \u2014 ' + dm.role,
                bankKey: r.key,
              });
            }
          }
        }
      }

      // Search countries
      const countryRows = db.prepare(`
        SELECT name, data FROM countries WHERE LOWER(name) LIKE ? OR LOWER(data) LIKE ? LIMIT 10
      `).all(term, term);
      for (const r of countryRows) {
        const d = JSON.parse(r.data);
        results.push({ type: 'country', name: r.name, meta: d.tagline || '' });
      }

      // Search markets
      const marketRows = db.prepare(`
        SELECT key, name FROM markets WHERE LOWER(name) LIKE ? LIMIT 5
      `).all(term);
      for (const r of marketRows) {
        results.push({ type: 'market', name: r.name, key: r.key });
      }

      // Compute type counts
      results.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });

      return jsonResponse(res, 200, { results, counts });
    }

    // ── GET /api/markets ── List markets
    if (path === '/api/markets' && req.method === 'GET') {
      const rows = db.prepare('SELECT * FROM markets ORDER BY name').all();
      return jsonResponse(res, 200, parseRows('markets', rows));
    }

    // ── GET /api/markets/:key ──
    let match = path.match(/^\/api\/markets\/([^/]+)$/);
    if (match && req.method === 'GET') {
      const key = decodeURIComponent(match[1]);
      const row = db.prepare('SELECT * FROM markets WHERE key = ?').get(key);
      if (!row) return jsonResponse(res, 404, { error: 'Market not found' });
      return jsonResponse(res, 200, parseRow('markets', row));
    }

    // ── GET /api/markets/:key/banks ──
    match = path.match(/^\/api\/markets\/([^/]+)\/banks$/);
    if (match && req.method === 'GET') {
      const key = decodeURIComponent(match[1]);
      const market = db.prepare('SELECT countries FROM markets WHERE key = ?').get(key);
      if (!market) return jsonResponse(res, 404, { error: 'Market not found' });
      const countries = JSON.parse(market.countries);
      if (!countries.length) return jsonResponse(res, 200, []);
      const placeholders = countries.map(() => '?').join(',');
      const rows = db.prepare(`
        SELECT b.key, b.bank_name, b.country, b.tagline, b.data as bank_data, q.data as qual_data
        FROM banks b LEFT JOIN qualification q ON q.bank_key = b.key
        WHERE b.country IN (${placeholders}) OR b.country LIKE '%' || ? || '%'
        ORDER BY b.bank_name
      `).all(...countries, countries[0]);
      const banks = rows.map(r => ({
        key: r.key, bank_name: r.bank_name, country: r.country, tagline: r.tagline,
        data: r.bank_data ? JSON.parse(r.bank_data) : null,
        qualification: r.qual_data ? JSON.parse(r.qual_data) : null,
      }));
      return jsonResponse(res, 200, banks);
    }

    // ── GET /api/countries ──
    if (path === '/api/countries' && req.method === 'GET') {
      const rows = db.prepare('SELECT name, market_key FROM countries ORDER BY name').all();
      return jsonResponse(res, 200, rows);
    }

    // ── GET /api/countries/:name ──
    match = path.match(/^\/api\/countries\/([^/]+)$/);
    if (match && req.method === 'GET') {
      const name = decodeURIComponent(match[1]);
      const row = db.prepare('SELECT * FROM countries WHERE name = ?').get(name);
      if (!row) return jsonResponse(res, 404, { error: 'Country not found' });
      return jsonResponse(res, 200, parseRow('countries', row));
    }

    // ── GET /api/countries/:name/banks ──
    match = path.match(/^\/api\/countries\/([^/]+)\/banks$/);
    if (match && req.method === 'GET') {
      const name = decodeURIComponent(match[1]);
      const rows = db.prepare(`
        SELECT b.key, b.bank_name, b.country, b.tagline, b.data as bank_data, q.data as qual_data,
               vs.data as vs_data
        FROM banks b
        LEFT JOIN qualification q ON q.bank_key = b.key
        LEFT JOIN value_selling vs ON vs.bank_key = b.key
        WHERE b.country = ? OR b.country LIKE '%' || ? || '%'
        ORDER BY b.bank_name
      `).all(name, name);
      const banks = rows.map(r => ({
        key: r.key, bank_name: r.bank_name, country: r.country, tagline: r.tagline,
        data: r.bank_data ? JSON.parse(r.bank_data) : null,
        qualification: r.qual_data ? JSON.parse(r.qual_data) : null,
        value_selling: r.vs_data ? JSON.parse(r.vs_data) : null,
      }));
      return jsonResponse(res, 200, banks);
    }

    // ── Bank sub-resources ──

    // GET /api/banks/:key/qualification
    match = path.match(/^\/api\/banks\/([^/]+)\/qualification$/);
    if (match && req.method === 'GET') {
      const key = decodeURIComponent(match[1]);
      const row = db.prepare('SELECT * FROM qualification WHERE bank_key = ?').get(key);
      if (!row) return jsonResponse(res, 404, { error: 'Not found' });
      return jsonResponse(res, 200, parseRow('qualification', row));
    }

    // PUT /api/banks/:key/qualification
    if (match && req.method === 'PUT') {
      const key = decodeURIComponent(match[1]);
      const body = await parseBody(req);
      db.prepare(`
        INSERT INTO qualification (bank_key, data, updated_at) VALUES (?, ?, datetime('now'))
        ON CONFLICT(bank_key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
      `).run(key, JSON.stringify(body));
      return jsonResponse(res, 200, { ok: true });
    }

    // GET /api/banks/:key/cx
    match = path.match(/^\/api\/banks\/([^/]+)\/cx$/);
    if (match && req.method === 'GET') {
      const key = decodeURIComponent(match[1]);
      const row = db.prepare('SELECT * FROM cx WHERE bank_key = ?').get(key);
      if (!row) return jsonResponse(res, 404, { error: 'Not found' });
      return jsonResponse(res, 200, parseRow('cx', row));
    }

    // GET /api/banks/:key/competition
    match = path.match(/^\/api\/banks\/([^/]+)\/competition$/);
    if (match && req.method === 'GET') {
      const key = decodeURIComponent(match[1]);
      const row = db.prepare('SELECT * FROM competition WHERE bank_key = ?').get(key);
      if (!row) return jsonResponse(res, 404, { error: 'Not found' });
      return jsonResponse(res, 200, parseRow('competition', row));
    }

    // GET /api/banks/:key/value-selling
    match = path.match(/^\/api\/banks\/([^/]+)\/value-selling$/);
    if (match && req.method === 'GET') {
      const key = decodeURIComponent(match[1]);
      const row = db.prepare('SELECT * FROM value_selling WHERE bank_key = ?').get(key);
      if (!row) return jsonResponse(res, 404, { error: 'Not found' });
      return jsonResponse(res, 200, parseRow('value_selling', row));
    }

    // GET /api/banks/:key/sources
    match = path.match(/^\/api\/banks\/([^/]+)\/sources$/);
    if (match && req.method === 'GET') {
      const key = decodeURIComponent(match[1]);
      const rows = db.prepare('SELECT * FROM sources WHERE ref_key = ?').all(key);
      return jsonResponse(res, 200, rows);
    }

    // GET /api/banks/:key/relationships
    match = path.match(/^\/api\/banks\/([^/]+)\/relationships$/);
    if (match && req.method === 'GET') {
      const key = decodeURIComponent(match[1]);
      const row = db.prepare('SELECT * FROM relationships WHERE bank_key = ?').get(key);
      if (!row) return jsonResponse(res, 200, null);
      return jsonResponse(res, 200, parseRow('relationships', row));
    }

    // ── GET /api/banks/:key ── Full bank profile (joined)
    match = path.match(/^\/api\/banks\/([^/]+)$/);
    if (match && req.method === 'GET') {
      const key = decodeURIComponent(match[1]);
      const bank = db.prepare('SELECT * FROM banks WHERE key = ?').get(key);
      if (!bank) return jsonResponse(res, 404, { error: 'Bank not found' });

      const qual = db.prepare('SELECT * FROM qualification WHERE bank_key = ?').get(key);
      const cx = db.prepare('SELECT * FROM cx WHERE bank_key = ?').get(key);
      const comp = db.prepare('SELECT * FROM competition WHERE bank_key = ?').get(key);
      const vs = db.prepare('SELECT * FROM value_selling WHERE bank_key = ?').get(key);
      const rel = db.prepare('SELECT * FROM relationships WHERE bank_key = ?').get(key);
      const sources = db.prepare('SELECT * FROM sources WHERE ref_key = ?').all(key);

      const result = {
        ...parseRow('banks', bank),
        qualification: qual ? parseRow('qualification', qual).data : null,
        cx: cx ? parseRow('cx', cx).data : null,
        competition: comp ? parseRow('competition', comp).data : null,
        value_selling: vs ? parseRow('value_selling', vs).data : null,
        relationship: rel ? parseRow('relationships', rel).data : null,
        sources,
      };
      return jsonResponse(res, 200, result);
    }

    // ── POST /api/banks ── Create a bank
    if (path === '/api/banks' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.key || !body.bank_name || !body.country) {
        return jsonResponse(res, 400, { error: 'key, bank_name, country required' });
      }

      const insertBank = db.transaction((b) => {
        db.prepare(`
          INSERT INTO banks (key, bank_name, country, tagline, data) VALUES (?, ?, ?, ?, ?)
        `).run(b.key, b.bank_name, b.country, b.tagline || null, JSON.stringify(b.data || b));

        if (b.qualification) {
          db.prepare('INSERT INTO qualification (bank_key, data) VALUES (?, ?)').run(b.key, JSON.stringify(b.qualification));
        }
        if (b.cx) {
          db.prepare('INSERT INTO cx (bank_key, app_rating_ios, app_rating_android, digital_maturity, data) VALUES (?, ?, ?, ?, ?)').run(
            b.key, b.cx.app_rating_ios ?? null, b.cx.app_rating_android ?? null, b.cx.digital_maturity || null, JSON.stringify(b.cx)
          );
        }
        if (b.competition) {
          db.prepare('INSERT INTO competition (bank_key, core_banking, digital_platform, data) VALUES (?, ?, ?, ?)').run(
            b.key, b.competition.core_banking || null, b.competition.digital_platform || null, JSON.stringify(b.competition)
          );
        }
        if (b.value_selling) {
          db.prepare('INSERT INTO value_selling (bank_key, data) VALUES (?, ?)').run(b.key, JSON.stringify(b.value_selling));
        }
      });

      try {
        insertBank(body);
        return jsonResponse(res, 201, { key: body.key });
      } catch (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return jsonResponse(res, 409, { error: `Bank ${body.key} already exists` });
        }
        throw err;
      }
    }

    // ── PUT /api/banks/:key ── Update bank
    match = path.match(/^\/api\/banks\/([^/]+)$/);
    if (match && req.method === 'PUT') {
      const key = decodeURIComponent(match[1]);
      const body = await parseBody(req);
      const existing = db.prepare('SELECT key FROM banks WHERE key = ?').get(key);
      if (!existing) return jsonResponse(res, 404, { error: 'Bank not found' });

      db.prepare(`
        UPDATE banks SET bank_name = ?, country = ?, tagline = ?, data = ?, updated_at = datetime('now')
        WHERE key = ?
      `).run(body.bank_name || key, body.country || '', body.tagline || null, JSON.stringify(body.data || body), key);

      return jsonResponse(res, 200, { ok: true });
    }

    // ── DELETE /api/banks/:key ── Delete bank (cascades)
    match = path.match(/^\/api\/banks\/([^/]+)$/);
    if (match && req.method === 'DELETE') {
      const key = decodeURIComponent(match[1]);
      const result = db.prepare('DELETE FROM banks WHERE key = ?').run(key);
      if (result.changes === 0) return jsonResponse(res, 404, { error: 'Bank not found' });
      return jsonResponse(res, 200, { ok: true, deleted: key });
    }

    // ═══════════════════════════════════════════════════
    // INGESTION API — Pipeline audit trail + freshness
    // ═══════════════════════════════════════════════════

    // ── GET /api/ingestion-log ── Query pipeline audit trail
    if (path === '/api/ingestion-log' && req.method === 'GET') {
      const bankKeyFilter = url.searchParams.get('bank_key');
      const sourceFilter = url.searchParams.get('source');
      const actionFilter = url.searchParams.get('action');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

      let sql = 'SELECT * FROM ingestion_log WHERE 1=1';
      const params = [];

      if (bankKeyFilter) { sql += ' AND bank_key = ?'; params.push(bankKeyFilter); }
      if (sourceFilter) { sql += ' AND source = ?'; params.push(sourceFilter); }
      if (actionFilter) { sql += ' AND action = ?'; params.push(actionFilter); }

      sql += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const rows = db.prepare(sql).all(...params);
      return jsonResponse(res, 200, parseRows('ingestion_log', rows));
    }

    // ── GET /api/banks/:key/freshness ── Per-source last-updated timestamps
    match = path.match(/^\/api\/banks\/([^/]+)\/freshness$/);
    if (match && req.method === 'GET') {
      const key = decodeURIComponent(match[1]);

      // Check bank exists
      const bank = db.prepare('SELECT key FROM banks WHERE key = ?').get(key);
      if (!bank) return jsonResponse(res, 404, { error: 'Bank not found' });

      // Get latest successful ingestion per source
      const rows = db.prepare(`
        SELECT source, MAX(created_at) as last_updated, action,
               COUNT(*) as total_runs
        FROM ingestion_log
        WHERE bank_key = ? AND action IN ('update', 'insert')
        GROUP BY source
        ORDER BY last_updated DESC
      `).all(key);

      // Also check the bank data for live_ timestamps
      const bankRow = db.prepare('SELECT data FROM banks WHERE key = ?').get(key);
      const bankData = bankRow?.data ? JSON.parse(bankRow.data) : {};

      const freshness = {
        sources: {},
        overall_last_updated: null,
      };

      for (const row of rows) {
        freshness.sources[row.source] = {
          last_updated: row.last_updated,
          total_runs: row.total_runs,
        };
        if (!freshness.overall_last_updated || row.last_updated > freshness.overall_last_updated) {
          freshness.overall_last_updated = row.last_updated;
        }
      }

      // Add in-data timestamps (from live_ fields)
      if (bankData.live_stock?.fetchedAt) freshness.sources.stock_in_data = { last_updated: bankData.live_stock.fetchedAt };
      if (bankData.live_news?.fetchedAt) freshness.sources.news_in_data = { last_updated: bankData.live_news.fetchedAt };
      if (bankData.pdf_extracted_at) freshness.sources.pdf_in_data = { last_updated: bankData.pdf_extracted_at };

      return jsonResponse(res, 200, freshness);
    }

    // ── GET /api/banks/:key/landing-zones ── Cached landing zone matrix
    match = path.match(/^\/api\/banks\/([^/]+)\/landing-zones$/);
    if (match && req.method === 'GET') {
      const key = decodeURIComponent(match[1]);
      const row = db.prepare('SELECT * FROM landing_zone_matrix WHERE bank_key = ?').get(key);
      if (!row) return jsonResponse(res, 404, { error: 'No landing zone analysis found. Run analysis first.' });
      return jsonResponse(res, 200, parseRow('landing_zone_matrix', row));
    }

    // ── GET /api/banks/:key/discovery-storyline ── Cached discovery storyline
    match = path.match(/^\/api\/banks\/([^/]+)\/discovery-storyline$/);
    if (match && req.method === 'GET') {
      const key = decodeURIComponent(match[1]);
      const row = db.prepare('SELECT * FROM discovery_storylines WHERE bank_key = ?').get(key);
      if (!row) return jsonResponse(res, 404, { error: 'No discovery storyline found. Generate one first.' });
      return jsonResponse(res, 200, parseRow('discovery_storylines', row));
    }

    // ── GET /api/banks/:key/ai-analyses ── AI analysis results for a bank
    match = path.match(/^\/api\/banks\/([^/]+)\/ai-analyses$/);
    if (match && req.method === 'GET') {
      const key = decodeURIComponent(match[1]);
      const rows = db.prepare('SELECT * FROM ai_analyses WHERE bank_key = ? ORDER BY created_at DESC').all(key);
      return jsonResponse(res, 200, parseRows('ai_analyses', rows));
    }

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
  console.log(`\n  Ingestion Endpoints:`);
  console.log(`    GET  /api/ingestion-log          — Pipeline audit trail`);
  console.log(`    GET  /api/banks/:key/freshness   — Data freshness per source`);
  console.log(`    GET  /api/banks/:key/ai-analyses — AI analysis results`);
  console.log(`${'═'.repeat(50)}\n`);
});
