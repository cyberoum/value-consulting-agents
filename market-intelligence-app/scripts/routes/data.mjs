/**
 * Data CRUD route handlers — banks, markets, countries, search, stats.
 */

import { jsonResponse, parseBody } from './helpers.mjs';

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

    const result = {
      ...parseRow('banks', bank),
      qualification: qual ? parseRow('qualification', qual).data : null,
      cx: cx ? parseRow('cx', cx).data : null,
      competition: comp ? parseRow('competition', comp).data : null,
      value_selling: vs ? parseRow('value_selling', vs).data : null,
      relationship: rel ? parseRow('relationships', rel).data : null,
      sources,
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

  return false;
}
