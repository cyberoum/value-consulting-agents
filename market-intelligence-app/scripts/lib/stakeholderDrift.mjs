/**
 * Stakeholder Drift Analyzer — Sprint 2.3
 * ───────────────────────────────────────
 * Given meeting_facts rows, compute per-stakeholder sentiment drift over time
 * for each topic they've been quoted on. This is the data layer behind the
 * "sentiment-drift" view that surfaces:
 *
 *   "Anna Lindgren (CFO) on budget: negative (Mar 13) → neutral (Apr 6)
 *    → positive (Apr 20) — trend: improving (3 meetings, T1)"
 *
 * Why structural (no LLM here): the inputs are already-validated facts. The
 * drift computation is pure aggregation + ordering. Putting an LLM in this
 * loop would re-introduce the hallucination risk we just spent Sprint 2.2
 * eliminating.
 *
 * Trend semantics:
 *   - improving:    last sentiment is more-positive than first
 *   - deteriorating last sentiment is more-negative than first
 *   - stable:       sentiments unchanged across all data points
 *   - mixed:        non-monotone (e.g., +→−→+) — flagged for manual review
 *   - single_point: only 1 fact — no trend computable
 */

const SENTIMENT_RANK = { negative: -1, mixed: 0, neutral: 0, positive: 1 };

/**
 * Compute drift series for one (person, topic) cell.
 * Facts must already be sorted by meeting_date ASC.
 */
function computeTrend(facts) {
  if (facts.length === 0) return { trend: 'no_data', delta: 0 };
  if (facts.length === 1) return { trend: 'single_point', delta: 0 };

  const first = SENTIMENT_RANK[facts[0].sentiment] ?? 0;
  const last = SENTIMENT_RANK[facts[facts.length - 1].sentiment] ?? 0;
  const delta = last - first;

  // Monotonicity check across the series
  let increasing = true, decreasing = true, allEqual = true;
  for (let i = 1; i < facts.length; i++) {
    const prev = SENTIMENT_RANK[facts[i - 1].sentiment] ?? 0;
    const cur = SENTIMENT_RANK[facts[i].sentiment] ?? 0;
    if (cur < prev) increasing = false;
    if (cur > prev) decreasing = false;
    if (cur !== prev) allEqual = false;
  }

  if (allEqual) return { trend: 'stable', delta: 0 };
  if (increasing && delta > 0) return { trend: 'improving', delta };
  if (decreasing && delta < 0) return { trend: 'deteriorating', delta };
  return { trend: 'mixed', delta }; // non-monotone change
}

/**
 * Get drift series for every (stakeholder, topic) pair at a bank.
 * Returns array of drift cells, sorted by stakeholder influence then by topic activity.
 *
 * @param {Database} db - better-sqlite3 instance
 * @param {string} bankKey - e.g. "Nordea_Sweden"
 * @param {object} options - { minFacts: 1, includeUnattributed: false }
 * @returns {Array<DriftCell>}
 *
 * DriftCell shape:
 * {
 *   speaker_person_id: string|null,
 *   speaker_name: string,
 *   speaker_role: string|null,
 *   topic: 'budget'|'vendors'|...,
 *   n_facts: number,
 *   first_seen: ISO date,
 *   last_seen: ISO date,
 *   trend: 'improving'|'deteriorating'|'stable'|'mixed'|'single_point',
 *   delta: number,
 *   confidence_tier: 1|2,    // 1 if speaker matched persons, else 2
 *   series: [{ meeting_date, sentiment, position, evidence_quote, meeting_id }, ...]
 * }
 */
export function getStakeholderDrift(db, bankKey, options = {}) {
  const { minFacts = 1, includeUnattributed = false } = options;

  // Pull all facts for this bank, joined with persons for role resolution.
  const facts = db.prepare(`
    SELECT
      mf.id, mf.meeting_id, mf.bank_key, mf.speaker_person_id, mf.speaker_name,
      mf.topic, mf.position, mf.sentiment, mf.evidence_quote, mf.meeting_date,
      mf.confidence_tier,
      p.role AS person_role,
      p.canonical_name AS canonical_name,
      p.influence_score AS influence_score
    FROM meeting_facts mf
    LEFT JOIN persons p ON p.id = mf.speaker_person_id
    WHERE mf.bank_key = ?
    ORDER BY mf.meeting_date ASC
  `).all(bankKey);

  // Group by (speaker_key, topic). Speaker key is person_id when matched, else
  // a normalized name string. Unattributed (null name) goes into a synthetic
  // "(unattributed)" bucket only if includeUnattributed=true.
  const cells = new Map();
  for (const f of facts) {
    const speakerKey = f.speaker_person_id
      || (f.speaker_name ? `name:${f.speaker_name.toLowerCase().trim()}` : null);
    if (!speakerKey && !includeUnattributed) continue;

    const cellKey = `${speakerKey || '__unattributed__'}::${f.topic}`;
    if (!cells.has(cellKey)) {
      cells.set(cellKey, {
        speaker_person_id: f.speaker_person_id || null,
        speaker_name: f.canonical_name || f.speaker_name || '(unattributed)',
        speaker_role: f.person_role || null,
        influence_score: f.influence_score || 0,
        topic: f.topic,
        confidence_tier: f.speaker_person_id ? 1 : 2,
        series: [],
      });
    }
    const cell = cells.get(cellKey);
    cell.series.push({
      meeting_id: f.meeting_id,
      meeting_date: f.meeting_date,
      sentiment: f.sentiment,
      position: f.position,
      evidence_quote: f.evidence_quote,
    });
  }

  // Finalize each cell with trend + summary stats
  const out = [];
  for (const cell of cells.values()) {
    if (cell.series.length < minFacts) continue;
    cell.series.sort((a, b) => a.meeting_date.localeCompare(b.meeting_date));
    const { trend, delta } = computeTrend(cell.series);
    out.push({
      ...cell,
      n_facts: cell.series.length,
      first_seen: cell.series[0].meeting_date,
      last_seen: cell.series[cell.series.length - 1].meeting_date,
      trend,
      delta,
    });
  }

  // Sort: T1 (matched) first, then by influence desc, then by n_facts desc
  out.sort((a, b) => {
    if (a.confidence_tier !== b.confidence_tier) return a.confidence_tier - b.confidence_tier;
    if ((b.influence_score || 0) !== (a.influence_score || 0)) {
      return (b.influence_score || 0) - (a.influence_score || 0);
    }
    return b.n_facts - a.n_facts;
  });

  return out;
}

/**
 * Roll up drift cells into a per-stakeholder summary (how this person's
 * positions are evolving across all topics they speak on).
 *
 * Useful for the PersonIntelCard panel: "Anna Lindgren — improving on budget,
 * stable on vendors, deteriorating on timeline (5 facts across 3 meetings)".
 */
export function getDriftByStakeholder(db, bankKey, options = {}) {
  const cells = getStakeholderDrift(db, bankKey, options);
  const byPerson = new Map();
  for (const c of cells) {
    const key = c.speaker_person_id || `name:${c.speaker_name.toLowerCase()}`;
    if (!byPerson.has(key)) {
      byPerson.set(key, {
        speaker_person_id: c.speaker_person_id,
        speaker_name: c.speaker_name,
        speaker_role: c.speaker_role,
        confidence_tier: c.confidence_tier,
        influence_score: c.influence_score,
        topics: [],
        total_facts: 0,
        last_seen: c.last_seen,
      });
    }
    const ps = byPerson.get(key);
    ps.topics.push({
      topic: c.topic,
      trend: c.trend,
      n_facts: c.n_facts,
      first_seen: c.first_seen,
      last_seen: c.last_seen,
      latest_sentiment: c.series[c.series.length - 1].sentiment,
      latest_position: c.series[c.series.length - 1].position,
      series: c.series,
    });
    ps.total_facts += c.n_facts;
    if (c.last_seen > ps.last_seen) ps.last_seen = c.last_seen;
  }
  return Array.from(byPerson.values());
}

/**
 * Bank-level "what's changing" rollup — used by Pulse engagement_trend
 * (Sprint 2.5) and the diff-first change feed (Sprint 4).
 *
 * Returns: { improving: [...], deteriorating: [...], new_positions: [...] }
 *   - improving:      cells with trend='improving' (sorted by influence)
 *   - deteriorating:  cells with trend='deteriorating' (sorted by influence)
 *   - new_positions:  cells whose first_seen is within `recencyDays` and have only 1 fact
 */
export function getBankDriftRollup(db, bankKey, options = {}) {
  const { recencyDays = 60 } = options;
  const cells = getStakeholderDrift(db, bankKey, options);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - recencyDays);
  const cutoffISO = cutoff.toISOString().slice(0, 10);

  return {
    improving: cells.filter(c => c.trend === 'improving'),
    deteriorating: cells.filter(c => c.trend === 'deteriorating'),
    mixed: cells.filter(c => c.trend === 'mixed'),
    new_positions: cells.filter(c => c.trend === 'single_point' && c.first_seen >= cutoffISO),
    stable: cells.filter(c => c.trend === 'stable'),
    counts: {
      total_cells: cells.length,
      stakeholders: new Set(cells.map(c => c.speaker_person_id || c.speaker_name)).size,
    },
  };
}
