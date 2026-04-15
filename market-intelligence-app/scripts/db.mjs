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

    -- ── Live Signals (AI-classified from external sources) ──
    CREATE TABLE IF NOT EXISTS live_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_key TEXT REFERENCES banks(key) ON DELETE CASCADE,
      source TEXT NOT NULL,
      source_url TEXT,
      title TEXT NOT NULL,
      snippet TEXT,
      published_at TEXT,
      fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
      relevance_score REAL,
      signal_type TEXT,
      implication TEXT,
      priority TEXT DEFAULT 'medium',
      classified_at TEXT,
      content_hash TEXT UNIQUE
    );
    CREATE INDEX IF NOT EXISTS idx_live_signals_bank ON live_signals(bank_key);
    CREATE INDEX IF NOT EXISTS idx_live_signals_score ON live_signals(relevance_score);
    CREATE INDEX IF NOT EXISTS idx_live_signals_date ON live_signals(published_at);

    CREATE TABLE IF NOT EXISTS signal_refresh_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      status TEXT DEFAULT 'running',
      articles_fetched INTEGER DEFAULT 0,
      articles_classified INTEGER DEFAULT 0,
      errors INTEGER DEFAULT 0,
      duration_ms INTEGER,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    -- ── Brief Feedback (post-meeting quality tracking) ──
    CREATE TABLE IF NOT EXISTS brief_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_key TEXT REFERENCES banks(key) ON DELETE CASCADE,
      bank_name TEXT NOT NULL,
      persona TEXT,
      sections_used TEXT NOT NULL,
      accuracy_rating INTEGER NOT NULL CHECK(accuracy_rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_brief_feedback_bank ON brief_feedback(bank_key);
    CREATE INDEX IF NOT EXISTS idx_brief_feedback_date ON brief_feedback(created_at);

    -- ── Field Provenance (Layer 1: per-field source lineage + confidence) ──
    CREATE TABLE IF NOT EXISTS field_provenance (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_key TEXT NOT NULL,
      field_path TEXT NOT NULL,
      value TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_url TEXT,
      source_date TEXT,
      confidence_tier INTEGER NOT NULL CHECK(confidence_tier BETWEEN 1 AND 3),
      is_stale INTEGER DEFAULT 0,
      captured_at TEXT DEFAULT (datetime('now')),
      UNIQUE(entity_type, entity_key, field_path)
    );
    CREATE INDEX IF NOT EXISTS idx_provenance_entity
      ON field_provenance(entity_type, entity_key);

    -- ── Entity History (Layer 3 schema, populated later — change detection log) ──
    CREATE TABLE IF NOT EXISTS entity_history (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_key TEXT NOT NULL,
      field_path TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT NOT NULL,
      changed_at TEXT DEFAULT (datetime('now')),
      source TEXT,
      pipeline_run_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_history_entity
      ON entity_history(entity_type, entity_key);
    CREATE INDEX IF NOT EXISTS idx_history_date
      ON entity_history(changed_at);

    -- ── Persons (Layer 2: normalized from banks.data.key_decision_makers[]) ──
    CREATE TABLE IF NOT EXISTS persons (
      id TEXT PRIMARY KEY,
      bank_key TEXT NOT NULL,
      canonical_name TEXT NOT NULL,
      role TEXT,
      role_category TEXT,
      aliases TEXT,
      linkedin_url TEXT,
      note TEXT,
      source_url TEXT,
      source_date TEXT,
      confidence_tier INTEGER DEFAULT 2,
      verified_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(bank_key, canonical_name)
    );
    CREATE INDEX IF NOT EXISTS idx_persons_bank ON persons(bank_key);

    -- ── Pain Points (Layer 2: normalized from banks.data.pain_points[]) ──
    CREATE TABLE IF NOT EXISTS pain_points (
      id TEXT PRIMARY KEY,
      bank_key TEXT NOT NULL,
      canonical_text TEXT NOT NULL,
      category TEXT,
      detail TEXT,
      source_url TEXT,
      source_date TEXT,
      confidence_tier INTEGER DEFAULT 2,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(bank_key, canonical_text)
    );
    CREATE INDEX IF NOT EXISTS idx_pain_points_bank ON pain_points(bank_key);

    -- ── Landing Zones (Layer 2: normalized from 2 curated sources) ──
    CREATE TABLE IF NOT EXISTS landing_zones (
      id TEXT PRIMARY KEY,
      bank_key TEXT NOT NULL,
      zone_name TEXT NOT NULL,
      fit_score INTEGER,
      rationale TEXT,
      entry_strategy TEXT,
      source TEXT NOT NULL,
      details TEXT,
      source_url TEXT,
      confidence_tier INTEGER DEFAULT 2,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(bank_key, zone_name, source)
    );
    CREATE INDEX IF NOT EXISTS idx_landing_zones_bank ON landing_zones(bank_key);

    -- ── Meeting History (Layer 4: deal context for brief enrichment) ──
    CREATE TABLE IF NOT EXISTS meeting_history (
      id TEXT PRIMARY KEY,
      bank_key TEXT NOT NULL,
      meeting_date TEXT NOT NULL,
      attendees TEXT,
      key_topics TEXT,
      objections_raised TEXT,
      commitments_made TEXT,
      outcome TEXT,
      notes TEXT,
      source TEXT DEFAULT 'manual',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_meeting_history_bank ON meeting_history(bank_key);
    CREATE INDEX IF NOT EXISTS idx_meeting_history_date ON meeting_history(meeting_date);
  `);

  // Migration: add meeting_type column (idempotent — safe to re-run)
  try {
    db.exec("ALTER TABLE meeting_history ADD COLUMN meeting_type TEXT DEFAULT 'client'");
  } catch (e) {
    // Column already exists — safe to ignore
  }

  // Migration: persons org chart columns (reports_to, lob, seniority_order)
  try { db.exec("ALTER TABLE persons ADD COLUMN reports_to TEXT"); } catch (e) { /* exists */ }
  try { db.exec("ALTER TABLE persons ADD COLUMN lob TEXT"); } catch (e) { /* exists */ }
  try { db.exec("ALTER TABLE persons ADD COLUMN seniority_order INTEGER"); } catch (e) { /* exists */ }

  // Migration: persons legacy flagging + discovery source
  try { db.exec("ALTER TABLE persons ADD COLUMN is_legacy INTEGER DEFAULT 0"); } catch (e) { /* exists */ }
  try { db.exec("ALTER TABLE persons ADD COLUMN discovery_source TEXT"); } catch (e) { /* exists */ }

  // Migration: Strategic Account Plan — MEDDICC + stakeholder fields (consultant-editable overrides)
  const stakeholderColumns = [
    "ALTER TABLE persons ADD COLUMN meddicc_roles TEXT",
    "ALTER TABLE persons ADD COLUMN influence_score INTEGER",
    "ALTER TABLE persons ADD COLUMN engagement_status TEXT",
    "ALTER TABLE persons ADD COLUMN support_status TEXT",
    "ALTER TABLE persons ADD COLUMN relationship_type TEXT",
    "ALTER TABLE persons ADD COLUMN linkedin_intel TEXT",
    "ALTER TABLE persons ADD COLUMN priorities TEXT",
    "ALTER TABLE persons ADD COLUMN kpis_of_interest TEXT",
  ];
  for (const stmt of stakeholderColumns) {
    try { db.prepare(stmt).run(); } catch (e) { /* column exists */ }
  }

  // Migration: pipeline_settings status + disqualify_reason columns
  try { db.exec("ALTER TABLE pipeline_settings ADD COLUMN status TEXT DEFAULT 'prospect'"); } catch (e) { /* exists */ }
  try { db.exec("ALTER TABLE pipeline_settings ADD COLUMN disqualify_reason TEXT"); } catch (e) { /* exists */ }

  // Power Maps table (MEDDICC analysis cache)
  db.exec(`
    CREATE TABLE IF NOT EXISTS power_maps (
      id TEXT PRIMARY KEY,
      bank_key TEXT NOT NULL,
      generated_at TEXT DEFAULT (datetime('now')),
      result TEXT NOT NULL,
      persona TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_power_maps_bank ON power_maps(bank_key);

    -- ── Account Plans (cached AI-generated account plan documents) ──
    CREATE TABLE IF NOT EXISTS account_plans (
      id TEXT PRIMARY KEY,
      bank_key TEXT NOT NULL,
      generated_at TEXT DEFAULT (datetime('now')),
      inputs TEXT,
      result TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_account_plans_bank ON account_plans(bank_key);

    -- ── Pipeline Settings (bank status + exclusions) ──
    CREATE TABLE IF NOT EXISTS pipeline_settings (
      bank_key TEXT PRIMARY KEY,
      excluded INTEGER DEFAULT 0,
      status TEXT DEFAULT 'prospect' CHECK(status IN ('prospect', 'discovery', 'qualification', 'proof_of_value', 'negotiation', 'won', 'lost', 'disqualified', 'watching')),
      disqualify_reason TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- ── Deal Outcomes (win/loss tracking for learning loop) ──
    CREATE TABLE IF NOT EXISTS deal_outcomes (
      id TEXT PRIMARY KEY,
      bank_key TEXT NOT NULL,
      outcome TEXT NOT NULL CHECK(outcome IN ('won', 'lost', 'stalled', 'no_decision')),
      arr_value TEXT,
      close_date TEXT,
      win_reasons TEXT,
      loss_reasons TEXT,
      competitor_won TEXT,
      lessons_learned TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_deal_outcomes_bank ON deal_outcomes(bank_key);

    -- ══════════════════════════════════════════════════════════════
    -- Intelligence Layer tables (Sprint 1)
    -- ══════════════════════════════════════════════════════════════

    -- 1. Deal Plays — named intelligence workflows per deal
    CREATE TABLE IF NOT EXISTS deal_plays (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL,
      play_type TEXT NOT NULL CHECK(play_type IN ('discovery', 'value', 'competitive', 'proposal', 'expansion')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_deal_plays_deal ON deal_plays(deal_id);
    CREATE INDEX IF NOT EXISTS idx_deal_plays_status ON deal_plays(status);

    -- 2. Play Outputs — artifacts each play produces
    CREATE TABLE IF NOT EXISTS play_outputs (
      id TEXT PRIMARY KEY,
      play_id TEXT NOT NULL,
      output_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      stakeholder_id TEXT,
      confidence_tier TEXT CHECK(confidence_tier IN ('verified', 'inferred', 'stale')),
      source_ids TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      used_in_meeting_id TEXT,
      feedback TEXT CHECK(feedback IN ('landed', 'missed', 'not_used', 'partially_landed', NULL)),
      FOREIGN KEY (play_id) REFERENCES deal_plays(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_play_outputs_play ON play_outputs(play_id);

    -- 3. Deal Signals — deal-relevant events that trigger play updates
    CREATE TABLE IF NOT EXISTS deal_signals (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL,
      signal_category TEXT NOT NULL CHECK(signal_category IN ('stakeholder', 'strategic', 'competitive', 'momentum', 'market', 'internal')),
      signal_event TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      source_url TEXT,
      source_type TEXT CHECK(source_type IN ('linkedin', 'news', 'internal', 'manual', 'meeting')),
      severity TEXT DEFAULT 'info' CHECK(severity IN ('info', 'attention', 'urgent')),
      detected_at TEXT NOT NULL DEFAULT (datetime('now')),
      acknowledged_at TEXT,
      actioned_at TEXT,
      routed_to_plays TEXT DEFAULT '[]',
      triggered_output_ids TEXT DEFAULT '[]'
    );
    CREATE INDEX IF NOT EXISTS idx_deal_signals_deal ON deal_signals(deal_id);
    CREATE INDEX IF NOT EXISTS idx_deal_signals_severity ON deal_signals(severity);
    CREATE INDEX IF NOT EXISTS idx_deal_signals_detected ON deal_signals(detected_at);

    -- 4. Deal Twin State — computational model of deal health
    CREATE TABLE IF NOT EXISTS deal_twin_state (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL UNIQUE,
      stakeholder_alignment REAL DEFAULT 50,
      strategic_fit REAL DEFAULT 50,
      competitive_position REAL DEFAULT 50,
      momentum REAL DEFAULT 50,
      value_clarity REAL DEFAULT 50,
      information_completeness REAL DEFAULT 50,
      deal_health_score REAL DEFAULT 50,
      deal_health_trend TEXT DEFAULT 'stable' CHECK(deal_health_trend IN ('improving', 'stable', 'declining')),
      top_risks TEXT DEFAULT '[]',
      recommended_actions TEXT DEFAULT '[]',
      last_calculated_at TEXT NOT NULL DEFAULT (datetime('now')),
      calculation_inputs TEXT DEFAULT '{}'
    );

    -- 5. Deal Twin History — snapshots for trend tracking
    CREATE TABLE IF NOT EXISTS deal_twin_history (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL,
      snapshot_date TEXT NOT NULL DEFAULT (date('now')),
      deal_health_score REAL,
      stakeholder_alignment REAL,
      strategic_fit REAL,
      competitive_position REAL,
      momentum REAL,
      value_clarity REAL,
      information_completeness REAL
    );
    CREATE INDEX IF NOT EXISTS idx_deal_twin_history_deal ON deal_twin_history(deal_id);

    -- 6. Output Feedback — learning loop from rep usage
    CREATE TABLE IF NOT EXISTS output_feedback (
      id TEXT PRIMARY KEY,
      play_output_id TEXT NOT NULL,
      meeting_id TEXT,
      feedback_type TEXT NOT NULL CHECK(feedback_type IN ('landed', 'missed', 'not_used', 'partially_landed')),
      notes TEXT,
      stakeholder_reaction TEXT CHECK(stakeholder_reaction IN ('positive', 'neutral', 'negative', 'unknown')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (play_output_id) REFERENCES play_outputs(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_output_feedback_output ON output_feedback(play_output_id);

    -- 7. Play Templates — reusable patterns (future Play Builder)
    CREATE TABLE IF NOT EXISTS play_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      play_type TEXT NOT NULL,
      bank_segment TEXT,
      deal_pattern TEXT DEFAULT '{}',
      template_config TEXT DEFAULT '{}',
      effectiveness_score REAL DEFAULT 0,
      times_used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 8. Template Usage Tracking
    CREATE TABLE IF NOT EXISTS deal_play_template_usage (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL,
      play_template_id TEXT NOT NULL,
      play_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (play_template_id) REFERENCES play_templates(id),
      FOREIGN KEY (play_id) REFERENCES deal_plays(id) ON DELETE CASCADE
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
  brief_feedback: new Set(['sections_used']),
  field_provenance: new Set([]),
  entity_history: new Set([]),
  persons: new Set(['aliases', 'meddicc_roles', 'priorities', 'kpis_of_interest']),
  pain_points: new Set([]),
  landing_zones: new Set(['details']),
  meeting_history: new Set(['attendees', 'key_topics', 'objections_raised', 'commitments_made']),
  power_maps: new Set(['result']),
  account_plans: new Set(['inputs', 'result']),
  deal_outcomes: new Set(['win_reasons', 'loss_reasons']),
  // Intelligence Layer tables
  deal_plays: new Set([]),
  play_outputs: new Set(['source_ids']),
  deal_signals: new Set(['routed_to_plays', 'triggered_output_ids']),
  deal_twin_state: new Set(['top_risks', 'recommended_actions', 'calculation_inputs']),
  deal_twin_history: new Set([]),
  output_feedback: new Set([]),
  play_templates: new Set(['deal_pattern', 'template_config']),
  deal_play_template_usage: new Set([]),
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
