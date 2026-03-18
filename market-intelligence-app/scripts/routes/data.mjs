/**
 * Data CRUD route handlers — banks, markets, countries, search, stats.
 */

import crypto from 'node:crypto';
import { jsonResponse, parseBody } from './helpers.mjs';
import { getChangesForBank } from '../lib/changeWriter.mjs';

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

/**
 * Try to handle a data route. Returns true if handled, false if not matched.
 */
export async function handleDataRoute(req, res, { path, url, db, parseRow, parseRows }) {
  let match;

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
        key: row.key, bank_name: row.bank_name, country: row.country,
        tagline: row.tagline, core_banking: row.core_banking,
        digital_platform: row.digital_platform, qualification: qd,
      };
    });
    jsonResponse(res, 200, banks);
    return true;
  }

  // ── GET /api/stats ──
  if (path === '/api/stats' && req.method === 'GET') {
    const totalBanks = db.prepare('SELECT COUNT(*) as c FROM banks').get().c;
    const totalCountries = db.prepare('SELECT COUNT(*) as c FROM countries').get().c;
    const totalMarkets = db.prepare('SELECT COUNT(*) as c FROM markets WHERE has_data = 1').get().c;
    jsonResponse(res, 200, { totalBanks, totalCountries, totalMarkets });
    return true;
  }

  // ── GET /api/signals ── Blended live + static signals for homepage
  if (path === '/api/signals' && req.method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit') || '8', 10);
    const minScore = parseFloat(url.searchParams.get('min_score') || '5');
    const sourceFilter = url.searchParams.get('source'); // 'live', 'static', or null (both)
    const bankFilter = url.searchParams.get('bank_key'); // filter to one bank
    const typeFilter = url.searchParams.get('type'); // 'strategic,hiring' etc.

    const signals = [];
    const priorityOrder = { high: 3, medium: 2, low: 1 };

    // ── 1. Live signals from live_signals table (AI-classified) ──
    if (sourceFilter !== 'static') {
      try {
        let liveQuery = `
          SELECT ls.*, b.bank_name, b.country, q.data as qual_data
          FROM live_signals ls
          JOIN banks b ON b.key = ls.bank_key
          LEFT JOIN qualification q ON q.bank_key = ls.bank_key
          WHERE ls.relevance_score >= ?
            AND ls.classified_at IS NOT NULL
        `;
        const params = [minScore];

        if (bankFilter) {
          liveQuery += ' AND ls.bank_key = ?';
          params.push(bankFilter);
        }
        if (typeFilter) {
          const types = typeFilter.split(',').map(t => t.trim());
          liveQuery += ` AND ls.signal_type IN (${types.map(() => '?').join(',')})`;
          params.push(...types);
        }

        liveQuery += ' ORDER BY ls.relevance_score DESC, ls.published_at DESC LIMIT 50';

        const liveRows = db.prepare(liveQuery).all(...params);
        for (const row of liveRows) {
          const qd = row.qual_data ? JSON.parse(row.qual_data) : null;
          const bankScore = calcBankScore(qd);
          signals.push({
            type: row.signal_type || 'signal',
            bank: row.bank_name,
            bankKey: row.bank_key,
            country: row.country,
            score: bankScore,
            text: row.title,
            detail: row.implication || row.snippet || '',
            source: `${row.source} (Live)`,
            sourceUrl: row.source_url,
            priority: row.priority || (row.relevance_score >= 8 ? 'high' : row.relevance_score >= 6 ? 'medium' : 'low'),
            relevanceScore: row.relevance_score,
            publishedAt: row.published_at,
            isLive: true,
          });
        }

        // ── Adaptive threshold: fill in underrepresented banks ──
        // If a bank has zero signals at the normal threshold, surface their
        // best signal at a lower threshold (score >= 3) so every tracked bank
        // gets at least some coverage. This prevents large-cap bias.
        if (!bankFilter) {
          const banksWithSignals = new Set(liveRows.map(r => r.bank_key));
          const allBankKeys = db.prepare('SELECT key FROM banks').all().map(r => r.key);
          const underrepresented = allBankKeys.filter(k => !banksWithSignals.has(k));

          if (underrepresented.length > 0) {
            const placeholders = underrepresented.map(() => '?').join(',');
            const fallbackRows = db.prepare(`
              SELECT ls.*, b.bank_name, b.country, q.data as qual_data
              FROM live_signals ls
              JOIN banks b ON b.key = ls.bank_key
              LEFT JOIN qualification q ON q.bank_key = ls.bank_key
              WHERE ls.bank_key IN (${placeholders})
                AND ls.relevance_score >= 3
                AND ls.classified_at IS NOT NULL
              ORDER BY ls.relevance_score DESC, ls.published_at DESC
            `).all(...underrepresented);

            // Take the single best signal per underrepresented bank
            const seenBanks = new Set();
            for (const row of fallbackRows) {
              if (seenBanks.has(row.bank_key)) continue;
              seenBanks.add(row.bank_key);

              const qd = row.qual_data ? JSON.parse(row.qual_data) : null;
              const bankScore = calcBankScore(qd);
              signals.push({
                type: row.signal_type || 'signal',
                bank: row.bank_name,
                bankKey: row.bank_key,
                country: row.country,
                score: bankScore,
                text: row.title,
                detail: row.implication || row.snippet || '',
                source: `${row.source} (Live)`,
                sourceUrl: row.source_url,
                priority: 'low',
                relevanceScore: row.relevance_score,
                publishedAt: row.published_at,
                isLive: true,
                isFallback: true, // Flag so UI can optionally style differently
              });
            }
          }
        }
      } catch {
        // live_signals table may not exist yet — graceful fallback
      }
    }

    // ── 2. Static signals from bank profile data ──
    if (sourceFilter !== 'live') {
      const bankQuery = bankFilter
        ? db.prepare(`SELECT b.key, b.bank_name, b.country, b.data as bank_data, q.data as qual_data
            FROM banks b LEFT JOIN qualification q ON q.bank_key = b.key
            WHERE b.key = ? AND b.data IS NOT NULL AND b.data != '{}'`).all(bankFilter)
        : db.prepare(`SELECT b.key, b.bank_name, b.country, b.data as bank_data, q.data as qual_data
            FROM banks b LEFT JOIN qualification q ON q.bank_key = b.key
            WHERE b.data IS NOT NULL AND b.data != '{}'
            ORDER BY b.updated_at DESC`).all();

      for (const row of bankQuery) {
        const bd = row.bank_data ? JSON.parse(row.bank_data) : {};
        const qd = row.qual_data ? JSON.parse(row.qual_data) : null;
        const score = calcBankScore(qd);

        // Strategic signals
        if (bd.signals && Array.isArray(bd.signals)) {
          for (const sig of bd.signals.slice(0, 2)) {
            signals.push({
              type: 'signal',
              bank: row.bank_name,
              bankKey: row.key,
              country: row.country,
              score,
              text: sig.signal || sig.text || '',
              detail: sig.implication || '',
              source: 'Strategic Signal',
              priority: score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low',
              isLive: false,
            });
          }
        }

        // Pain points
        if (bd.pain_points && Array.isArray(bd.pain_points)) {
          for (const pp of bd.pain_points.slice(0, 1)) {
            signals.push({
              type: 'pain_point',
              bank: row.bank_name,
              bankKey: row.key,
              country: row.country,
              score,
              text: pp.title || '',
              detail: pp.detail || '',
              source: 'Pain Point',
              priority: score >= 8 ? 'high' : 'medium',
              isLive: false,
            });
          }
        }

        // Stock movements
        if (bd.live_stock?.price && bd.live_stock?.dayChangePercent) {
          const pct = bd.live_stock.dayChangePercent;
          if (Math.abs(pct) > 3) {
            signals.push({
              type: 'stock',
              bank: row.bank_name,
              bankKey: row.key,
              country: row.country,
              score,
              text: `Stock ${pct > 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}% — ${bd.live_stock.ticker} at ${bd.live_stock.currency} ${bd.live_stock.price}`,
              detail: '',
              source: 'Stock Movement',
              priority: Math.abs(pct) > 5 ? 'high' : 'medium',
              isLive: false,
            });
          }
        }
      }
    }

    // Deduplicate: live signals take precedence over static with similar text
    const seen = new Set();
    const deduped = signals.filter(s => {
      const key = `${s.bankKey}|${s.text.substring(0, 50).toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort: live first, then by score, then by priority
    deduped.sort((a, b) =>
      (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0)
      || (b.score - a.score)
      || (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
    );

    jsonResponse(res, 200, deduped.slice(0, limit));
    return true;
  }

  // ── POST /api/signals/refresh ── Trigger on-demand signal refresh
  if (path === '/api/signals/refresh' && req.method === 'POST') {
    // Check cooldown (10 min between refreshes)
    const lastRun = db.prepare(
      `SELECT completed_at FROM signal_refresh_log WHERE status = 'complete' ORDER BY id DESC LIMIT 1`
    ).get();

    if (lastRun?.completed_at) {
      const elapsed = Date.now() - new Date(lastRun.completed_at + 'Z').getTime();
      if (elapsed < 10 * 60 * 1000) {
        jsonResponse(res, 429, {
          error: 'Signal refresh on cooldown',
          retryAfterMs: 10 * 60 * 1000 - elapsed,
          lastRefresh: lastRun.completed_at,
        });
        return true;
      }
    }

    // Run refresh in background (non-blocking)
    const { runSignalRefresh } = await import('../fetchers/signalIngestion.mjs');
    runSignalRefresh(db, { skipNews: false }).catch(err =>
      console.error('[signals/refresh] Error:', err.message)
    );

    jsonResponse(res, 202, { status: 'started', message: 'Signal refresh started in background' });
    return true;
  }

  // ── GET /api/signals/status ── Refresh status
  if (path === '/api/signals/status' && req.method === 'GET') {
    const lastRun = db.prepare(
      `SELECT * FROM signal_refresh_log ORDER BY id DESC LIMIT 1`
    ).get();

    let totalLiveSignals = 0;
    let topSources = [];
    try {
      totalLiveSignals = db.prepare('SELECT COUNT(*) as cnt FROM live_signals WHERE relevance_score >= 5').get()?.cnt || 0;
      topSources = db.prepare(`
        SELECT source, COUNT(*) as cnt FROM live_signals
        WHERE relevance_score >= 5 GROUP BY source ORDER BY cnt DESC LIMIT 5
      `).all();
    } catch {
      // Table may not exist yet
    }

    jsonResponse(res, 200, {
      lastRefresh: lastRun || null,
      totalLiveSignals,
      topSources,
    });
    return true;
  }

  // ── GET /api/search?q= ──
  if (path === '/api/search' && req.method === 'GET') {
    const q = url.searchParams.get('q');
    if (!q || q.length < 2) { jsonResponse(res, 200, { results: [], counts: {} }); return true; }
    const term = `%${q.toLowerCase()}%`;
    const results = [];
    const counts = {};

    // Search banks
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

    // Search KDMs in non-matched banks
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

    results.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
    jsonResponse(res, 200, { results, counts });
    return true;
  }

  // ── GET /api/markets ──
  if (path === '/api/markets' && req.method === 'GET') {
    const rows = db.prepare('SELECT * FROM markets ORDER BY name').all();
    jsonResponse(res, 200, parseRows('markets', rows));
    return true;
  }

  // ── GET /api/markets/:key ──
  match = path.match(/^\/api\/markets\/([^/]+)$/);
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const row = db.prepare('SELECT * FROM markets WHERE key = ?').get(key);
    if (!row) { jsonResponse(res, 404, { error: 'Market not found' }); return true; }
    jsonResponse(res, 200, parseRow('markets', row));
    return true;
  }

  // ── GET /api/markets/:key/banks ──
  match = path.match(/^\/api\/markets\/([^/]+)\/banks$/);
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const market = db.prepare('SELECT countries FROM markets WHERE key = ?').get(key);
    if (!market) { jsonResponse(res, 404, { error: 'Market not found' }); return true; }
    const countries = JSON.parse(market.countries);
    if (!countries.length) { jsonResponse(res, 200, []); return true; }
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
    jsonResponse(res, 200, banks);
    return true;
  }

  // ── GET /api/countries ──
  if (path === '/api/countries' && req.method === 'GET') {
    const rows = db.prepare('SELECT name, market_key FROM countries ORDER BY name').all();
    jsonResponse(res, 200, rows);
    return true;
  }

  // ── GET /api/countries/:name ──
  match = path.match(/^\/api\/countries\/([^/]+)$/);
  if (match && req.method === 'GET') {
    const name = decodeURIComponent(match[1]);
    const row = db.prepare('SELECT * FROM countries WHERE name = ?').get(name);
    if (!row) { jsonResponse(res, 404, { error: 'Country not found' }); return true; }
    jsonResponse(res, 200, parseRow('countries', row));
    return true;
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
    jsonResponse(res, 200, banks);
    return true;
  }

  // ── Bank sub-resources ──

  // GET /api/banks/:key/changes — Layer 3 change history
  match = path.match(/^\/api\/banks\/([^/]+)\/changes$/);
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const since = url.searchParams.get('since') || null;
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const changes = getChangesForBank(key, { since, limit });
    jsonResponse(res, 200, { bank_key: key, changes, total: changes.length, since });
    return true;
  }

  // ── Meeting History CRUD (Layer 4) ──

  // POST /api/banks/:key/meetings — create meeting record
  match = path.match(/^\/api\/banks\/([^/]+)\/meetings$/);
  if (match && req.method === 'POST') {
    const key = decodeURIComponent(match[1]);
    const body = await parseBody(req);
    if (\!body.meeting_date) {
      jsonResponse(res, 400, { error: 'Missing required field: meeting_date' });
      return true;
    }
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO meeting_history (id, bank_key, meeting_date, attendees, key_topics, objections_raised, commitments_made, outcome, notes, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, key, body.meeting_date,
      body.attendees ? JSON.stringify(body.attendees) : null,
      body.key_topics ? JSON.stringify(body.key_topics) : null,
      body.objections_raised ? JSON.stringify(body.objections_raised) : null,
      body.commitments_made ? JSON.stringify(body.commitments_made) : null,
      body.outcome || null,
      body.notes || null,
      body.source || 'manual',
    );
    const created = db.prepare('SELECT * FROM meeting_history WHERE id = ?').get(id);
    jsonResponse(res, 201, parseRow('meeting_history', created));
    return true;
  }

  // GET /api/banks/:key/meetings — list meetings for bank
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const rows = db.prepare('SELECT * FROM meeting_history WHERE bank_key = ? ORDER BY meeting_date DESC LIMIT ?').all(key, limit);
    jsonResponse(res, 200, { bank_key: key, meetings: parseRows('meeting_history', rows), total: rows.length });
    return true;
  }

  // PUT /api/banks/:key/meetings/:id — partial update
  match = path.match(/^\/api\/banks\/([^/]+)\/meetings\/([^/]+)$/);
  if (match && req.method === 'PUT') {
    const key = decodeURIComponent(match[1]);
    const id = decodeURIComponent(match[2]);
    const body = await parseBody(req);

    const allowedFields = ['meeting_date', 'attendees', 'key_topics', 'objections_raised', 'commitments_made', 'outcome', 'notes', 'source'];
    const jsonFieldSet = new Set(['attendees', 'key_topics', 'objections_raised', 'commitments_made']);
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (body[field] \!== undefined) {
        updates.push(field + ' = ?');
        values.push(jsonFieldSet.has(field) && typeof body[field] === 'object' ? JSON.stringify(body[field]) : body[field]);
      }
    }

    if (updates.length === 0) {
      jsonResponse(res, 400, { error: 'No valid fields to update' });
      return true;
    }

    values.push(id, key);
    const result = db.prepare('UPDATE meeting_history SET ' + updates.join(', ') + ' WHERE id = ? AND bank_key = ?').run(...values);
    if (result.changes === 0) {
      jsonResponse(res, 404, { error: 'Meeting not found' });
      return true;
    }
    jsonResponse(res, 200, { ok: true });
    return true;
  }

  // GET /api/banks/:key/qualification
  match = path.match(/^\/api\/banks\/([^/]+)\/qualification$/);
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const row = db.prepare('SELECT * FROM qualification WHERE bank_key = ?').get(key);
    if (!row) { jsonResponse(res, 404, { error: 'Not found' }); return true; }
    jsonResponse(res, 200, parseRow('qualification', row));
    return true;
  }
  // PUT /api/banks/:key/qualification
  if (match && req.method === 'PUT') {
    const key = decodeURIComponent(match[1]);
    const body = await parseBody(req);
    db.prepare(`
      INSERT INTO qualification (bank_key, data, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(bank_key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
    `).run(key, JSON.stringify(body));
    jsonResponse(res, 200, { ok: true });
    return true;
  }

  // GET /api/banks/:key/cx
  match = path.match(/^\/api\/banks\/([^/]+)\/cx$/);
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const row = db.prepare('SELECT * FROM cx WHERE bank_key = ?').get(key);
    if (!row) { jsonResponse(res, 404, { error: 'Not found' }); return true; }
    jsonResponse(res, 200, parseRow('cx', row));
    return true;
  }

  // GET /api/banks/:key/competition
  match = path.match(/^\/api\/banks\/([^/]+)\/competition$/);
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const row = db.prepare('SELECT * FROM competition WHERE bank_key = ?').get(key);
    if (!row) { jsonResponse(res, 404, { error: 'Not found' }); return true; }
    jsonResponse(res, 200, parseRow('competition', row));
    return true;
  }

  // GET /api/banks/:key/value-selling
  match = path.match(/^\/api\/banks\/([^/]+)\/value-selling$/);
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const row = db.prepare('SELECT * FROM value_selling WHERE bank_key = ?').get(key);
    if (!row) { jsonResponse(res, 404, { error: 'Not found' }); return true; }
    jsonResponse(res, 200, parseRow('value_selling', row));
    return true;
  }

  // GET /api/banks/:key/sources
  match = path.match(/^\/api\/banks\/([^/]+)\/sources$/);
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const rows = db.prepare('SELECT * FROM sources WHERE ref_key = ?').all(key);
    jsonResponse(res, 200, rows);
    return true;
  }

  // GET /api/banks/:key/relationships
  match = path.match(/^\/api\/banks\/([^/]+)\/relationships$/);
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const row = db.prepare('SELECT * FROM relationships WHERE bank_key = ?').get(key);
    if (!row) { jsonResponse(res, 200, null); return true; }
    jsonResponse(res, 200, parseRow('relationships', row));
    return true;
  }

  // ── GET /api/banks/:key ── Full bank profile (joined)
  match = path.match(/^\/api\/banks\/([^/]+)$/);
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const bank = db.prepare('SELECT * FROM banks WHERE key = ?').get(key);
    if (!bank) { jsonResponse(res, 404, { error: 'Bank not found' }); return true; }

    const qual = db.prepare('SELECT * FROM qualification WHERE bank_key = ?').get(key);
    const cx = db.prepare('SELECT * FROM cx WHERE bank_key = ?').get(key);
    const comp = db.prepare('SELECT * FROM competition WHERE bank_key = ?').get(key);
    const vs = db.prepare('SELECT * FROM value_selling WHERE bank_key = ?').get(key);
    const rel = db.prepare('SELECT * FROM relationships WHERE bank_key = ?').get(key);
    const sources = db.prepare('SELECT * FROM sources WHERE ref_key = ?').all(key);

    // Layer 2: normalized entities
    const personsRows = db.prepare('SELECT * FROM persons WHERE bank_key = ? ORDER BY role_category, canonical_name').all(key);
    const painPointsRows = db.prepare('SELECT * FROM pain_points WHERE bank_key = ?').all(key);
    const landingZonesRows = db.prepare('SELECT * FROM landing_zones WHERE bank_key = ? ORDER BY source, fit_score DESC').all(key);

    const result = {
      ...parseRow('banks', bank),
      qualification: qual ? parseRow('qualification', qual).data : null,
      cx: cx ? parseRow('cx', cx).data : null,
      competition: comp ? parseRow('competition', comp).data : null,
      value_selling: vs ? parseRow('value_selling', vs).data : null,
      relationship: rel ? parseRow('relationships', rel).data : null,
      sources,
      // Layer 2: normalized entity arrays (backward-compatible — new top-level keys)
      persons: parseRows('persons', personsRows),
      pain_points_normalized: parseRows('pain_points', painPointsRows),
      landing_zones_normalized: parseRows('landing_zones', landingZonesRows),
    };
    jsonResponse(res, 200, result);
    return true;
  }

  // ── POST /api/banks ── Create a bank
  if (path === '/api/banks' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.key || !body.bank_name || !body.country) {
      jsonResponse(res, 400, { error: 'key, bank_name, country required' });
      return true;
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
      jsonResponse(res, 201, { key: body.key });
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        jsonResponse(res, 409, { error: `Bank ${body.key} already exists` });
      } else {
        throw err;
      }
    }
    return true;
  }

  // ── PUT /api/banks/:key ──
  match = path.match(/^\/api\/banks\/([^/]+)$/);
  if (match && req.method === 'PUT') {
    const key = decodeURIComponent(match[1]);
    const body = await parseBody(req);
    const existing = db.prepare('SELECT key FROM banks WHERE key = ?').get(key);
    if (!existing) { jsonResponse(res, 404, { error: 'Bank not found' }); return true; }
    db.prepare(`
      UPDATE banks SET bank_name = ?, country = ?, tagline = ?, data = ?, updated_at = datetime('now')
      WHERE key = ?
    `).run(body.bank_name || key, body.country || '', body.tagline || null, JSON.stringify(body.data || body), key);
    jsonResponse(res, 200, { ok: true });
    return true;
  }

  // ── DELETE /api/banks/:key ──
  match = path.match(/^\/api\/banks\/([^/]+)$/);
  if (match && req.method === 'DELETE') {
    const key = decodeURIComponent(match[1]);
    const result = db.prepare('DELETE FROM banks WHERE key = ?').run(key);
    if (result.changes === 0) { jsonResponse(res, 404, { error: 'Bank not found' }); return true; }
    jsonResponse(res, 200, { ok: true, deleted: key });
    return true;
  }

  // ── POST /api/feedback/brief — Submit brief feedback ──
  if (path === '/api/feedback/brief' && req.method === 'POST') {
    const { bankKey, bankName, persona, sectionsUsed, accuracyRating, comment } = await parseBody(req);
    if (!bankName || !sectionsUsed || !accuracyRating) {
      jsonResponse(res, 400, { error: 'Missing required fields: bankName, sectionsUsed, accuracyRating' });
      return true;
    }
    const stmt = db.prepare(`
      INSERT INTO brief_feedback (bank_key, bank_name, persona, sections_used, accuracy_rating, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      bankKey || null,
      bankName,
      persona || null,
      JSON.stringify(sectionsUsed),
      accuracyRating,
      comment || null
    );
    jsonResponse(res, 200, { ok: true, id: result.lastInsertRowid });
    return true;
  }

  // ── GET /api/feedback/brief — Read all brief feedback (admin) ──
  if (path === '/api/feedback/brief' && req.method === 'GET') {
    const rows = db.prepare(`
      SELECT * FROM brief_feedback ORDER BY created_at DESC LIMIT 200
    `).all();
    const parsed = rows.map(r => parseRow('brief_feedback', r));
    jsonResponse(res, 200, { feedback: parsed });
    return true;
  }

  // ── GET /api/feedback/brief/stats — Aggregate feedback stats (admin) ──
  if (path === '/api/feedback/brief/stats' && req.method === 'GET') {
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM brief_feedback').get().count;
    const avgRating = db.prepare('SELECT AVG(accuracy_rating) as avg FROM brief_feedback').get().avg;
    const ratingDist = db.prepare('SELECT accuracy_rating, COUNT(*) as count FROM brief_feedback GROUP BY accuracy_rating ORDER BY accuracy_rating').all();
    const allSections = db.prepare('SELECT sections_used FROM brief_feedback').all();

    // Aggregate section usage counts
    const sectionCounts = {};
    for (const row of allSections) {
      let sections;
      try { sections = JSON.parse(row.sections_used); } catch { sections = []; }
      for (const s of sections) {
        sectionCounts[s] = (sectionCounts[s] || 0) + 1;
      }
    }

    jsonResponse(res, 200, {
      totalCount,
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      ratingDistribution: ratingDist,
      sectionUsage: Object.entries(sectionCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([section, count]) => ({ section, count, pct: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0 })),
    });
    return true;
  }

  return false;
}
