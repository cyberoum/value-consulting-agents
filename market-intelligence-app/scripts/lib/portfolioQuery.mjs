/**
 * Portfolio Query Library — Sprint 5.1
 * ────────────────────────────────────
 * Composable predicate-based queries over the bank portfolio. Answers
 * questions like:
 *   - "Which banks have a high-confidence pattern on blockers in the last 60d?"
 *   - "Which banks have a deteriorating CFO drift on budget?"
 *   - "Which Swedish banks have an A-grade signal in regulatory category?"
 *   - "Which banks have a pulse engagement_score that DROPPED >1.0 between Q1 and Q2?"
 *
 * Why this is the right structure (not NL→SQL):
 *   1. Deterministic — same filter produces same result, always
 *   2. Composable — AND/OR predicates combine without LLM judgment
 *   3. Auditable — every result row carries the predicates that matched it
 *   4. Already grounded — predicates query persistent state we already trust
 * NL→SQL is a candidate Sprint 6 wrapper, not the foundation.
 *
 * Filter shape (recursive):
 *   {
 *     op: 'and' | 'or',
 *     predicates: [
 *       { type: 'has_pattern',          op: 'gte', grade: 'B', topic?: '…', confidence?: 'high', within_days?: 60 },
 *       { type: 'has_drift_trend',      trend: 'deteriorating', topic?: '…' },
 *       { type: 'has_signal',           grade?: 'A', category?: 'regulatory', within_days?: 30, severity?: 'urgent' },
 *       { type: 'pulse_score_change',   section: 'engagement_trend', op: 'lte', value: -1.0, from?: '2026-Q1', to?: '2026-Q2' },
 *       { type: 'has_meeting_fact',     topic?: '…', sentiment?: 'negative', confidence_tier?: 1 },
 *       { type: 'country',              equals: 'Sweden' },
 *       { type: 'tier',                 equals: 'tier-1' },  // bank.tier
 *     ],
 *     children?: [<filter>]   // nested AND/OR groups
 *   }
 *
 * Returns: array of { bank_key, bank_name, country, matched_predicates: [...] }
 * sorted by match-density (banks matching more predicates first).
 */

const TIER_GRADE_RANK = { A: 4, B: 3, C: 2, D: 1 };
const TIER_CONF_RANK = { high: 3, medium: 2, low: 1 };

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// ──────────────────────────────────────────────────────────────────────
// Predicate evaluators — each returns an array of bank_keys that match
// ──────────────────────────────────────────────────────────────────────

const PREDICATES = {
  /**
   * has_pattern — banks with a corroborated pattern matching constraints.
   * Args: { grade?: 'A'|'B'|'C'|'D', op?: 'eq'|'gte', topic?, confidence?, type?, within_days? }
   */
  has_pattern(db, args = {}) {
    const where = ['1=1'];
    const params = [];
    if (args.topic) { where.push('pm.topic = ?'); params.push(args.topic); }
    if (args.confidence) { where.push('pm.confidence = ?'); params.push(args.confidence); }
    if (args.type) { where.push('pm.pattern_type = ?'); params.push(args.type); }
    if (args.within_days) {
      where.push('pm.detected_at >= ?');
      params.push(daysAgoISO(args.within_days));
    }
    if (args.grade) {
      const op = args.op || 'eq';
      const minRank = TIER_GRADE_RANK[args.grade] || 0;
      const allowedGrades = Object.entries(TIER_GRADE_RANK)
        .filter(([g, r]) => op === 'gte' ? r >= minRank : r === minRank)
        .map(([g]) => g);
      if (allowedGrades.length === 0) return new Set();
      where.push(`ds.source_grade IN (${allowedGrades.map(() => '?').join(',')})`);
      params.push(...allowedGrades);
    }
    const rows = db.prepare(`
      SELECT DISTINCT pm.bank_key
      FROM pattern_matches pm
      LEFT JOIN deal_signals ds ON ds.id = pm.external_signal_id
      WHERE ${where.join(' AND ')}
    `).all(...params);
    return new Set(rows.map(r => r.bank_key));
  },

  /**
   * has_drift_trend — banks with a stakeholder drift cell matching constraints.
   * Args: { trend: 'improving'|'deteriorating'|'mixed', topic?, min_facts? }
   * Computes drift inline (mirrors stakeholderDrift logic).
   */
  has_drift_trend(db, args = {}) {
    const where = ['mf.speaker_person_id IS NOT NULL'];
    const params = [];
    if (args.topic) { where.push('mf.topic = ?'); params.push(args.topic); }
    const rows = db.prepare(`
      SELECT mf.bank_key, mf.speaker_person_id, mf.topic,
             GROUP_CONCAT(mf.sentiment, '|') AS sentiments,
             GROUP_CONCAT(mf.meeting_date, '|') AS dates,
             COUNT(*) AS n
      FROM meeting_facts mf
      WHERE ${where.join(' AND ')}
      GROUP BY mf.bank_key, mf.speaker_person_id, mf.topic
      HAVING COUNT(*) >= ?
    `).all(...params, args.min_facts || 2);

    const RANK = { negative: -1, mixed: 0, neutral: 0, positive: 1 };
    const matches = new Set();
    for (const r of rows) {
      const sentiments = r.sentiments.split('|');
      const dates = r.dates.split('|');
      const paired = sentiments.map((s, i) => ({ s, d: dates[i] }))
        .sort((a, b) => a.d.localeCompare(b.d));
      const first = RANK[paired[0].s] ?? 0;
      const last = RANK[paired[paired.length - 1].s] ?? 0;
      const trend = last > first ? 'improving' : last < first ? 'deteriorating' : 'stable';
      if (trend === args.trend) matches.add(r.bank_key);
    }
    return matches;
  },

  /**
   * has_signal — banks with a deal_signal matching constraints.
   * Args: { grade?, op?, category?, severity?, within_days? }
   */
  has_signal(db, args = {}) {
    const where = ['COALESCE(is_demo, 0) = 0'];
    const params = [];
    if (args.category) { where.push('signal_category = ?'); params.push(args.category); }
    if (args.severity) { where.push('severity = ?'); params.push(args.severity); }
    if (args.within_days) {
      where.push('detected_at >= ?');
      params.push(daysAgoISO(args.within_days));
    }
    if (args.grade) {
      const op = args.op || 'eq';
      const minRank = TIER_GRADE_RANK[args.grade] || 0;
      const allowed = Object.entries(TIER_GRADE_RANK)
        .filter(([g, r]) => op === 'gte' ? r >= minRank : r === minRank).map(([g]) => g);
      if (allowed.length === 0) return new Set();
      where.push(`source_grade IN (${allowed.map(() => '?').join(',')})`);
      params.push(...allowed);
    }
    const rows = db.prepare(`
      SELECT DISTINCT deal_id AS bank_key FROM deal_signals WHERE ${where.join(' AND ')}
    `).all(...params);
    return new Set(rows.map(r => r.bank_key));
  },

  /**
   * pulse_score_change — banks where a pulse section's engagement score
   * changed by op-and-amount between two periods.
   * Args: { section: 'engagement_trend', op: 'gte'|'lte', value: number, from: '2026-Q1', to: '2026-Q2' }
   */
  pulse_score_change(db, args = {}) {
    const section = args.section || 'engagement_trend';
    const from = args.from || '2026-Q1';
    const to = args.to || '2026-Q2';
    const op = args.op || 'gte';
    const threshold = args.value ?? 0;

    const rows = db.prepare(`
      SELECT account_id AS bank_key, period_id, payload_json
      FROM pulses
      WHERE period_id IN (?, ?)
    `).all(from, to);

    const byBank = new Map();
    for (const row of rows) {
      let payload;
      try { payload = JSON.parse(row.payload_json); } catch { continue; }
      const score = payload?.sections?.[section]?.data?.score;
      if (typeof score !== 'number') continue;
      if (!byBank.has(row.bank_key)) byBank.set(row.bank_key, {});
      byBank.get(row.bank_key)[row.period_id] = score;
    }
    const matches = new Set();
    for (const [bank, scores] of byBank.entries()) {
      const fromScore = scores[from];
      const toScore = scores[to];
      if (typeof fromScore !== 'number' || typeof toScore !== 'number') continue;
      const delta = toScore - fromScore;
      const passes = op === 'gte' ? delta >= threshold
                   : op === 'lte' ? delta <= threshold
                   : op === 'gt'  ? delta >  threshold
                   : op === 'lt'  ? delta <  threshold
                   : Math.abs(delta - threshold) < 0.001;
      if (passes) matches.add(bank);
    }
    return matches;
  },

  /**
   * has_meeting_fact — banks with at least one meeting_fact matching constraints.
   */
  has_meeting_fact(db, args = {}) {
    const where = ['1=1'];
    const params = [];
    if (args.topic) { where.push('topic = ?'); params.push(args.topic); }
    if (args.sentiment) { where.push('sentiment = ?'); params.push(args.sentiment); }
    if (args.confidence_tier) { where.push('confidence_tier = ?'); params.push(args.confidence_tier); }
    if (args.within_days) { where.push('meeting_date >= ?'); params.push(daysAgoISO(args.within_days).slice(0, 10)); }
    const rows = db.prepare(`
      SELECT DISTINCT bank_key FROM meeting_facts WHERE ${where.join(' AND ')}
    `).all(...params);
    return new Set(rows.map(r => r.bank_key));
  },

  /**
   * country — banks in a given country.
   */
  country(db, args = {}) {
    if (!args.equals) return new Set();
    const rows = db.prepare(`SELECT key FROM banks WHERE country = ? OR country LIKE ?`)
      .all(args.equals, `${args.equals}%`);
    return new Set(rows.map(r => r.key));
  },

  /**
   * qualification_score — banks whose computed qualification score passes
   * a threshold. Score is computed inline from qualification.data JSON
   * using the same weighted formula as calcBankScore() in routes/data.mjs.
   * Args: { op: 'gte'|'lte', value: number }
   */
  qualification_score(db, args = {}) {
    const op = args.op || 'gte';
    const threshold = args.value ?? 0;
    const WEIGHTS = {
      firmographics: 0.10, technographics: 0.15, decision_process: 0.10,
      landing_zones: 0.20, pain_push: 0.20, power_map: 0.15, partner_access: 0.10,
    };
    const rows = db.prepare(`SELECT bank_key, data FROM qualification`).all();
    const matches = new Set();
    for (const row of rows) {
      let qual;
      try { qual = JSON.parse(row.data || '{}'); } catch { continue; }
      let w = 0;
      for (const [dim, weight] of Object.entries(WEIGHTS)) {
        const d = qual[dim];
        if (d && typeof d.score === 'number') w += d.score * weight;
      }
      if (qual.power_map?.activated) w += 1.0;
      if (qual.partner_access?.backbase_access) w += 0.5;
      const score = Math.min(w, 10);
      const passes = op === 'gte' ? score >= threshold
                   : op === 'lte' ? score <= threshold
                   : op === 'gt'  ? score >  threshold
                   : op === 'lt'  ? score <  threshold
                   : Math.abs(score - threshold) < 0.01;
      if (passes) matches.add(row.bank_key);
    }
    return matches;
  },
};

// ──────────────────────────────────────────────────────────────────────
// Filter evaluator — recursive
// ──────────────────────────────────────────────────────────────────────

/**
 * Evaluate one predicate or filter group. Returns a Set of bank_keys.
 */
function evaluate(db, node, allBanks) {
  if (!node) return new Set(allBanks);

  // Leaf predicate
  if (node.type) {
    const fn = PREDICATES[node.type];
    if (!fn) {
      console.warn(`[portfolioQuery] Unknown predicate type: ${node.type}`);
      return new Set();
    }
    return fn(db, node);
  }

  // Filter group — combine children with op
  const op = node.op || 'and';
  const children = (node.predicates || []).map(p => evaluate(db, p, allBanks))
    .concat((node.children || []).map(c => evaluate(db, c, allBanks)));
  if (children.length === 0) return new Set(allBanks);

  if (op === 'or') {
    const result = new Set();
    for (const set of children) for (const x of set) result.add(x);
    return result;
  }
  // 'and' (default)
  return children.reduce((acc, set) => {
    if (acc === null) return new Set(set);
    return new Set([...acc].filter(x => set.has(x)));
  }, null);
}

/**
 * Run a portfolio query. Returns matched banks with per-predicate trace
 * so the UI can show WHY each bank matched.
 *
 * @param {Database} db
 * @param {object} filter — see top-of-file shape
 * @returns {Array<{bank_key, bank_name, country, tier, matched_predicates}>}
 */
export function runPortfolioQuery(db, filter) {
  const allBanks = db.prepare(`SELECT key, bank_name, country FROM banks`).all();
  const allKeys = allBanks.map(b => b.key);

  // Top-level evaluation gives the matching bank_keys
  const matched = evaluate(db, filter, allKeys);

  // For each matched bank, compute which leaf predicates matched it (trace)
  const leafPredicates = collectLeafPredicates(filter);
  const perBankMatches = new Map();
  for (const leaf of leafPredicates) {
    const set = PREDICATES[leaf.type]?.(db, leaf) || new Set();
    for (const bank of set) {
      if (!perBankMatches.has(bank)) perBankMatches.set(bank, []);
      perBankMatches.get(bank).push(leaf);
    }
  }

  // Assemble results, sorted by predicate density desc
  const banksByKey = new Map(allBanks.map(b => [b.key, b]));
  const out = [];
  for (const bankKey of matched) {
    const meta = banksByKey.get(bankKey);
    if (!meta) continue;
    out.push({
      bank_key: bankKey,
      bank_name: meta.bank_name,
      country: meta.country,
      matched_predicates: perBankMatches.get(bankKey) || [],
    });
  }
  out.sort((a, b) => b.matched_predicates.length - a.matched_predicates.length || a.bank_name.localeCompare(b.bank_name));
  return out;
}

function collectLeafPredicates(node, out = []) {
  if (!node) return out;
  if (node.type) { out.push(node); return out; }
  for (const p of (node.predicates || [])) collectLeafPredicates(p, out);
  for (const c of (node.children || [])) collectLeafPredicates(c, out);
  return out;
}

/**
 * Pre-built example queries — useful for the UI's quick-pick menu and for
 * seeding saved-views in development.
 */
export const EXAMPLE_QUERIES = {
  high_grade_blockers_recent: {
    name: 'High-grade blocker signals (last 30d)',
    filter: {
      op: 'and',
      predicates: [
        { type: 'has_pattern', grade: 'B', op: 'gte', topic: 'blockers', within_days: 30 },
      ],
    },
  },
  deteriorating_budget: {
    name: 'Stakeholders deteriorating on budget',
    filter: {
      op: 'and',
      predicates: [
        { type: 'has_drift_trend', trend: 'deteriorating', topic: 'budget' },
      ],
    },
  },
  swedish_with_urgent_signal: {
    name: 'Swedish banks with urgent signals (last 60d)',
    filter: {
      op: 'and',
      predicates: [
        { type: 'country', equals: 'Sweden' },
        { type: 'has_signal', severity: 'urgent', within_days: 60 },
      ],
    },
  },
  pulse_score_dropped: {
    name: 'Engagement score dropped Q1 → Q2',
    filter: {
      op: 'and',
      predicates: [
        { type: 'pulse_score_change', section: 'engagement_trend', op: 'lt', value: 0, from: '2026-Q1', to: '2026-Q2' },
      ],
    },
  },
  attributed_negative_recent: {
    name: 'Attributed negative meeting facts (last 30d)',
    filter: {
      op: 'and',
      predicates: [
        { type: 'has_meeting_fact', sentiment: 'negative', confidence_tier: 1, within_days: 30 },
      ],
    },
  },
};
