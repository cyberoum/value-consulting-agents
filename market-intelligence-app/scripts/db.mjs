/**
 * SQLite Database — connection, schema, and helpers
 * Uses better-sqlite3 (synchronous API, WAL mode)
 * DB file: data/market-intelligence.db
 */
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'data', 'market-intelligence.db');

let _db = null;

export function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

export function closeDb() {
  if (_db) { _db.close(); _db = null; }
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS markets (
      key TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      countries TEXT NOT NULL,
      emoji TEXT,
      has_data INTEGER DEFAULT 0,
      data TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS countries (
      name TEXT PRIMARY KEY,
      market_key TEXT REFERENCES markets(key),
      data TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS banks (
      key TEXT PRIMARY KEY,
      bank_name TEXT NOT NULL,
      country TEXT NOT NULL,
      tagline TEXT,
      data TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_banks_country ON banks(country);

    CREATE TABLE IF NOT EXISTS qualification (
      bank_key TEXT PRIMARY KEY REFERENCES banks(key) ON DELETE CASCADE,
      data TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cx (
      bank_key TEXT PRIMARY KEY REFERENCES banks(key) ON DELETE CASCADE,
      app_rating_ios REAL,
      app_rating_android REAL,
      digital_maturity TEXT,
      data TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS competition (
      bank_key TEXT PRIMARY KEY REFERENCES banks(key) ON DELETE CASCADE,
      core_banking TEXT,
      digital_platform TEXT,
      data TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS value_selling (
      bank_key TEXT PRIMARY KEY REFERENCES banks(key) ON DELETE CASCADE,
      data TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS relationships (
      bank_key TEXT PRIMARY KEY REFERENCES banks(key) ON DELETE CASCADE,
      data TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref_key TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT,
      category TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sources_ref ON sources(ref_key);

    CREATE TABLE IF NOT EXISTS meeting_packs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_key TEXT REFERENCES banks(key),
      kdm_name TEXT,
      meeting_type TEXT,
      result TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_key TEXT REFERENCES banks(key),
      analysis_type TEXT,
      result TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(bank_key, analysis_type)
    );

    CREATE TABLE IF NOT EXISTS ingestion_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      bank_key TEXT,
      source TEXT NOT NULL,
      action TEXT NOT NULL,
      table_name TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_ingestion_run ON ingestion_log(run_id);
    CREATE INDEX IF NOT EXISTS idx_ingestion_bank ON ingestion_log(bank_key);
    CREATE INDEX IF NOT EXISTS idx_ingestion_source ON ingestion_log(source);

    CREATE TABLE IF NOT EXISTS landing_zone_matrix (
      bank_key TEXT PRIMARY KEY REFERENCES banks(key) ON DELETE CASCADE,
      matrix TEXT NOT NULL,
      plays TEXT,
      unconsidered TEXT,
      challenges TEXT,
      top_zones TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS discovery_storylines (
      bank_key TEXT PRIMARY KEY REFERENCES banks(key) ON DELETE CASCADE,
      storyline TEXT NOT NULL,
      roi_estimate TEXT,
      next_steps TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

// JSON column sets per table (for auto-parsing)
const JSON_FIELDS = {
  banks: new Set(['data']),
  markets: new Set(['countries', 'data']),
  countries: new Set(['data']),
  qualification: new Set(['data']),
  cx: new Set(['data']),
  competition: new Set(['data']),
  value_selling: new Set(['data']),
  relationships: new Set(['data']),
  meeting_packs: new Set(['result']),
  ai_analyses: new Set(['result']),
  ingestion_log: new Set(['details']),
  landing_zone_matrix: new Set(['matrix', 'plays', 'unconsidered', 'challenges', 'top_zones']),
  discovery_storylines: new Set(['storyline', 'roi_estimate', 'next_steps']),
};

/**
 * Parse JSON columns in a row object
 * @param {string} table - table name (for field lookup)
 * @param {object} row - raw row from better-sqlite3
 * @returns {object} row with JSON fields parsed
 */
export function parseRow(table, row) {
  if (!row) return null;
  const fields = JSON_FIELDS[table];
  if (!fields) return row;
  const result = { ...row };
  for (const key of fields) {
    if (typeof result[key] === 'string') {
      try { result[key] = JSON.parse(result[key]); } catch { /* keep as string */ }
    }
  }
  return result;
}

/**
 * Parse all rows from a query
 */
export function parseRows(table, rows) {
  return rows.map(r => parseRow(table, r));
}
