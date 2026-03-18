/**
 * Change Writer — Layer 3
 *
 * Records field-level changes to entity_history when pipeline runs detect
 * significant differences from the last known value.
 *
 * Change types tracked:
 *   - Stock price moves > 10%
 *   - App rating drops (any decrease)
 *   - High-impact signals (relevance_score >= 8)
 *
 * Also provides formatChangesForPrompt() to produce human-readable summaries
 * for injection into the meeting prep agent context.
 */
import crypto from 'node:crypto';
import { getDb } from '../db.mjs';

// ── Prepared statements (lazily initialized) ──

let _stmtInsert = null;
let _stmtGetChanges = null;

function stmtInsert() {
  if (!_stmtInsert) {
    _stmtInsert = getDb().prepare(`
      INSERT INTO entity_history (id, entity_type, entity_key, field_path, old_value, new_value, changed_at, source, pipeline_run_id)
      VALUES (@id, @entityType, @entityKey, @fieldPath, @oldValue, @newValue, datetime('now'), @source, @pipelineRunId)
    `);
  }
  return _stmtInsert;
}

function stmtGetChanges() {
  if (!_stmtGetChanges) {
    _stmtGetChanges = getDb().prepare(`
      SELECT * FROM entity_history
      WHERE entity_key = ?
      AND (? IS NULL OR changed_at >= ?)
      ORDER BY changed_at DESC
      LIMIT ?
    `);
  }
  return _stmtGetChanges;
}

// ── Public API ──

/**
 * Record a single change to entity_history.
 */
export function recordChange({ entityType, entityKey, fieldPath, oldValue, newValue, source, pipelineRunId }) {
  stmtInsert().run({
    id: crypto.randomUUID(),
    entityType,
    entityKey,
    fieldPath,
    oldValue: oldValue != null ? String(oldValue) : null,
    newValue: String(newValue),
    source: source || null,
    pipelineRunId: pipelineRunId || null,
  });
}

/**
 * Record multiple changes in a single transaction.
 */
export function bulkRecordChanges(changes) {
  const db = getDb();
  const tx = db.transaction(() => {
    for (const c of changes) {
      recordChange(c);
    }
  });
  tx();
}

/**
 * Get recent changes for a bank (or any entity_key).
 *
 * @param {string} entityKey — bank_key to query
 * @param {Object} options
 * @param {string} options.since — ISO date string, only changes after this date
 * @param {number} options.limit — max results (default 20)
 * @returns {Array} entity_history rows
 */
export function getChangesForBank(entityKey, { since = null, limit = 20 } = {}) {
  return stmtGetChanges().all(entityKey, since, since, limit);
}

// ── Change detection helpers (used by pipeline) ──

/**
 * Detect stock price change > threshold%.
 * Reads current value from field_provenance, compares with new value.
 * Returns change record if threshold exceeded, null otherwise.
 */
export function detectStockPriceChange(bankKey, newPrice, { threshold = 0.10, pipelineRunId = null } = {}) {
  if (newPrice == null) return null;

  const db = getDb();
  const row = db.prepare(
    "SELECT value FROM field_provenance WHERE entity_type = 'bank' AND entity_key = ? AND field_path = 'live_stock.price'"
  ).get(bankKey);

  if (!row) return null; // no prior value — first run, no change to record

  const oldPrice = parseFloat(row.value);
  if (isNaN(oldPrice) || oldPrice === 0) return null;

  const pctChange = Math.abs(newPrice - oldPrice) / oldPrice;
  if (pctChange <= threshold) return null;

  return {
    entityType: 'bank',
    entityKey: bankKey,
    fieldPath: 'live_stock.price',
    oldValue: row.value,
    newValue: String(newPrice),
    source: 'pipeline_yahoo_finance',
    pipelineRunId,
  };
}

/**
 * Detect app rating drop (any decrease).
 * Returns array of change records (0-2 items for ios/android).
 */
export function detectAppRatingChanges(bankKey, ratingsData, { pipelineRunId = null } = {}) {
  const db = getDb();
  const changes = [];

  for (const [platform, fieldPath] of [['ios', 'app_rating_ios'], ['android', 'app_rating_android']]) {
    const newRating = ratingsData?.[platform]?.rating;
    if (newRating == null) continue;

    const row = db.prepare(
      `SELECT value FROM field_provenance WHERE entity_type = 'bank' AND entity_key = ? AND field_path = ?`
    ).get(bankKey, fieldPath);

    if (!row) continue;

    const oldRating = parseFloat(row.value);
    if (isNaN(oldRating)) continue;

    // Only record drops, not increases
    if (newRating < oldRating) {
      changes.push({
        entityType: 'bank',
        entityKey: bankKey,
        fieldPath,
        oldValue: row.value,
        newValue: String(newRating),
        source: platform === 'ios' ? 'pipeline_app_store' : 'pipeline_google_play',
        pipelineRunId,
      });
    }
  }

  return changes;
}

// ── Prompt formatter ──

const FIELD_LABELS = {
  'live_stock.price': 'Stock price',
  'live_stock.marketCap': 'Market cap',
  'app_rating_ios': 'iOS app rating',
  'app_rating_android': 'Android app rating',
  'signals.high_impact': 'High-impact signal',
};

/**
 * Format change records into a human-readable prompt block.
 * Produces output like:
 *
 *   RECENT ACCOUNT CHANGES (last 30 days):
 *   - Stock price dropped 13.8% (€11.42 → €9.85) — 2 days ago
 *   - Android app rating fell (4.5 → 4.2) — 2 days ago
 *   - High-impact signal: [title] — 5 days ago
 */
export function formatChangesForPrompt(changes) {
  if (!changes || changes.length === 0) return '';

  const now = Date.now();

  const lines = changes.map(c => {
    const label = FIELD_LABELS[c.field_path] || c.field_path;
    const ago = formatTimeAgo(c.changed_at, now);

    // Stock price — show percentage
    if (c.field_path === 'live_stock.price' && c.old_value && c.new_value) {
      const oldP = parseFloat(c.old_value);
      const newP = parseFloat(c.new_value);
      if (!isNaN(oldP) && !isNaN(newP) && oldP > 0) {
        const pct = ((newP - oldP) / oldP * 100).toFixed(1);
        const direction = newP > oldP ? 'rose' : 'dropped';
        return `- ${label} ${direction} ${Math.abs(pct)}% (${c.old_value} → ${c.new_value}) — ${ago}`;
      }
    }

    // App rating — show direction
    if (c.field_path.startsWith('app_rating_') && c.old_value && c.new_value) {
      return `- ${label} fell (${c.old_value} → ${c.new_value}) — ${ago}`;
    }

    // High-impact signal — show title
    if (c.field_path === 'signals.high_impact') {
      const title = c.new_value.length > 80 ? c.new_value.slice(0, 77) + '...' : c.new_value;
      return `- ${label}: ${title} — ${ago}`;
    }

    // Generic fallback
    if (c.old_value) {
      return `- ${label} changed (${c.old_value} → ${c.new_value}) — ${ago}`;
    }
    return `- ${label}: ${c.new_value} — ${ago}`;
  });

  return [
    'RECENT ACCOUNT CHANGES (last 30 days):',
    ...lines,
    '',
    'Reference these changes in the brief when relevant. A stock drop or rating decline may indicate urgency or risk.',
  ].join('\n');
}

// ── Internal helpers ──

function formatTimeAgo(isoDate, nowMs) {
  if (!isoDate) return 'recently';
  const diffMs = nowMs - new Date(isoDate).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
