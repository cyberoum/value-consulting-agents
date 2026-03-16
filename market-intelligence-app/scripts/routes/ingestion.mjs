/**
 * Ingestion & freshness route handlers.
 *
 * Endpoints:
 *   GET /api/ingestion-log                — Pipeline audit trail
 *   GET /api/banks/:key/freshness         — Data freshness per source
 *   GET /api/banks/:key/landing-zones     — Cached landing zone matrix
 *   GET /api/banks/:key/discovery-storyline — Cached discovery storyline
 *   GET /api/banks/:key/ai-analyses       — AI analysis results
 */

import { jsonResponse } from './helpers.mjs';

/**
 * Try to handle an ingestion/freshness route. Returns true if handled, false if not matched.
 */
export async function handleIngestionRoute(req, res, { path, url, db, parseRow, parseRows }) {
  let match;

  // ── GET /api/ingestion-log ──
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
    jsonResponse(res, 200, parseRows('ingestion_log', rows));
    return true;
  }

  // ── GET /api/banks/:key/freshness ──
  match = path.match(/^\/api\/banks\/([^/]+)\/freshness$/);
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const bank = db.prepare('SELECT key FROM banks WHERE key = ?').get(key);
    if (!bank) { jsonResponse(res, 404, { error: 'Bank not found' }); return true; }

    const rows = db.prepare(`
      SELECT source, MAX(created_at) as last_updated, action, COUNT(*) as total_runs
      FROM ingestion_log
      WHERE bank_key = ? AND action IN ('update', 'insert')
      GROUP BY source
      ORDER BY last_updated DESC
    `).all(key);

    const bankRow = db.prepare('SELECT data FROM banks WHERE key = ?').get(key);
    const bankData = bankRow?.data ? JSON.parse(bankRow.data) : {};

    const freshness = { sources: {}, overall_last_updated: null };
    for (const row of rows) {
      freshness.sources[row.source] = { last_updated: row.last_updated, total_runs: row.total_runs };
      if (!freshness.overall_last_updated || row.last_updated > freshness.overall_last_updated) {
        freshness.overall_last_updated = row.last_updated;
      }
    }
    if (bankData.live_stock?.fetchedAt) freshness.sources.stock_in_data = { last_updated: bankData.live_stock.fetchedAt };
    if (bankData.live_news?.fetchedAt) freshness.sources.news_in_data = { last_updated: bankData.live_news.fetchedAt };
    if (bankData.pdf_extracted_at) freshness.sources.pdf_in_data = { last_updated: bankData.pdf_extracted_at };

    jsonResponse(res, 200, freshness);
    return true;
  }

  // ── GET /api/banks/:key/landing-zones ──
  match = path.match(/^\/api\/banks\/([^/]+)\/landing-zones$/);
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const row = db.prepare('SELECT * FROM landing_zone_matrix WHERE bank_key = ?').get(key);
    if (!row) { jsonResponse(res, 404, { error: 'No landing zone analysis found. Run analysis first.' }); return true; }
    jsonResponse(res, 200, parseRow('landing_zone_matrix', row));
    return true;
  }

  // ── GET /api/banks/:key/discovery-storyline ──
  match = path.match(/^\/api\/banks\/([^/]+)\/discovery-storyline$/);
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const row = db.prepare('SELECT * FROM discovery_storylines WHERE bank_key = ?').get(key);
    if (!row) { jsonResponse(res, 404, { error: 'No discovery storyline found. Generate one first.' }); return true; }
    jsonResponse(res, 200, parseRow('discovery_storylines', row));
    return true;
  }

  // ── GET /api/banks/:key/ai-analyses ──
  match = path.match(/^\/api\/banks\/([^/]+)\/ai-analyses$/);
  if (match && req.method === 'GET') {
    const key = decodeURIComponent(match[1]);
    const rows = db.prepare('SELECT * FROM ai_analyses WHERE bank_key = ? ORDER BY created_at DESC').all(key);
    jsonResponse(res, 200, parseRows('ai_analyses', rows));
    return true;
  }

  return false;
}
