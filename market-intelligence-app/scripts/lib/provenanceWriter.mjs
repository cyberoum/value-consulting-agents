/**
 * Provenance Writer — Layer 1
 *
 * Tracks per-field source lineage and confidence tiers.
 * Every pipeline write should call writeProvenance() so the brief generator
 * can distinguish verified facts from inferred signals.
 *
 * Uses ON CONFLICT ... DO UPDATE to preserve the original captured_at
 * timestamp (when a fact was first tracked), while updating the current
 * value, source, and confidence tier.
 */
import crypto from 'node:crypto';
import { getDb } from '../db.mjs';
import { STALENESS_THRESHOLDS, FIELD_STALENESS_MAP } from '../config.mjs';

// ── Prepared statements (lazily initialized) ──

let _stmtUpsert = null;
let _stmtMarkStale = null;
let _stmtAllProvenance = null;
let _stmtBankProvenance = null;

function stmtUpsert() {
  if (!_stmtUpsert) {
    _stmtUpsert = getDb().prepare(`
      INSERT INTO field_provenance
        (id, entity_type, entity_key, field_path, value, source_type, source_url, source_date, confidence_tier, is_stale)
      VALUES
        (@id, @entityType, @entityKey, @fieldPath, @value, @sourceType, @sourceUrl, @sourceDate, @confidenceTier, @isStale)
      ON CONFLICT(entity_type, entity_key, field_path) DO UPDATE SET
        value = excluded.value,
        source_type = excluded.source_type,
        source_url = excluded.source_url,
        source_date = excluded.source_date,
        confidence_tier = excluded.confidence_tier,
        is_stale = excluded.is_stale
    `);
  }
  return _stmtUpsert;
}

function stmtMarkStale() {
  if (!_stmtMarkStale) {
    _stmtMarkStale = getDb().prepare(`
      UPDATE field_provenance SET is_stale = 1
      WHERE entity_type = @entityType AND entity_key = @entityKey AND field_path = @fieldPath
    `);
  }
  return _stmtMarkStale;
}

function stmtAllProvenance() {
  if (!_stmtAllProvenance) {
    _stmtAllProvenance = getDb().prepare(`SELECT * FROM field_provenance`);
  }
  return _stmtAllProvenance;
}

function stmtBankProvenance() {
  if (!_stmtBankProvenance) {
    _stmtBankProvenance = getDb().prepare(`
      SELECT * FROM field_provenance
      WHERE entity_type = @entityType AND entity_key = @entityKey
      ORDER BY field_path
    `);
  }
  return _stmtBankProvenance;
}

// ── Public API ──

/**
 * Write (or update) a single provenance record.
 *
 * On first call for a given (entityType, entityKey, fieldPath), inserts a new
 * row with a fresh UUID and captured_at = now. On subsequent calls, updates
 * value/source/confidence but preserves id and captured_at.
 */
export function writeProvenance(entityType, entityKey, fieldPath, value, sourceType, sourceUrl, sourceDate, confidenceTier) {
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  stmtUpsert().run({
    id: crypto.randomUUID(),
    entityType,
    entityKey,
    fieldPath,
    value: stringValue,
    sourceType,
    sourceUrl: sourceUrl ?? null,
    sourceDate: sourceDate ?? new Date().toISOString().slice(0, 10),
    confidenceTier,
    isStale: 0,
  });
}

/**
 * Write multiple provenance records in a single transaction.
 *
 * Each record is an object with:
 *   { entityType, entityKey, fieldPath, value, sourceType, sourceUrl?, sourceDate?, confidenceTier }
 */
export function bulkWriteProvenance(records) {
  const db = getDb();
  const tx = db.transaction(() => {
    for (const r of records) {
      writeProvenance(
        r.entityType,
        r.entityKey,
        r.fieldPath,
        r.value,
        r.sourceType,
        r.sourceUrl ?? null,
        r.sourceDate ?? null,
        r.confidenceTier,
      );
    }
  });
  tx();
}

/**
 * Mark a specific field as stale.
 */
export function markStale(entityType, entityKey, fieldPath) {
  stmtMarkStale().run({ entityType, entityKey, fieldPath });
}

/**
 * Scan all provenance records and mark stale ones based on STALENESS_THRESHOLDS.
 *
 * A record is stale when:
 *   (today - source_date) > threshold for its field category
 *
 * Records whose field_path doesn't match any prefix in FIELD_STALENESS_MAP
 * are skipped (not marked stale — no false positives).
 *
 * Returns { checked, markedStale } counts for logging.
 */
export function runStalenessCheck() {
  const db = getDb();
  const now = Date.now();
  const rows = stmtAllProvenance().all();

  let checked = 0;
  let markedStale = 0;

  const staleIds = [];
  const freshIds = [];

  for (const row of rows) {
    // Find the staleness category for this field_path via prefix match
    const category = resolveStalenessCategory(row.field_path);
    if (!category) continue; // unmapped field — skip

    const thresholdDays = STALENESS_THRESHOLDS[category];
    if (thresholdDays == null) continue;

    checked++;

    if (!row.source_date) {
      // No source date → can't determine staleness, leave as-is
      continue;
    }

    const sourceMs = new Date(row.source_date).getTime();
    const ageDays = (now - sourceMs) / (1000 * 60 * 60 * 24);
    const isStale = ageDays > thresholdDays ? 1 : 0;

    if (isStale !== row.is_stale) {
      if (isStale) {
        staleIds.push(row.id);
        markedStale++;
      } else {
        freshIds.push(row.id);
      }
    }
  }

  // Batch update in a transaction
  if (staleIds.length > 0 || freshIds.length > 0) {
    const markStaleStmt = db.prepare(`UPDATE field_provenance SET is_stale = 1 WHERE id = ?`);
    const markFreshStmt = db.prepare(`UPDATE field_provenance SET is_stale = 0 WHERE id = ?`);

    const tx = db.transaction(() => {
      for (const id of staleIds) markStaleStmt.run(id);
      for (const id of freshIds) markFreshStmt.run(id);
    });
    tx();
  }

  return { checked, markedStale };
}

/**
 * Get all provenance records for a given entity (e.g., a bank).
 * Used by the AI route to inject confidence context into meeting prep prompts.
 */
export function getProvenanceForEntity(entityType, entityKey) {
  return stmtBankProvenance().all({ entityType, entityKey });
}

// ── Internal helpers ──

/**
 * Resolve a field_path to its staleness category using FIELD_STALENESS_MAP prefix matching.
 * Returns the category string or null if no prefix matches.
 */
function resolveStalenessCategory(fieldPath) {
  for (const [prefix, category] of Object.entries(FIELD_STALENESS_MAP)) {
    if (fieldPath.startsWith(prefix)) return category;
  }
  return null;
}
