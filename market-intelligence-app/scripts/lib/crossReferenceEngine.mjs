/**
 * Cross-Reference Engine — Sprint 2.4
 * ───────────────────────────────────
 * Pairs internal meeting facts with external deal_signals to surface
 * "corroborated patterns" — the unit of value Claude-in-a-chat can't fake
 * because it requires persistent state across both surfaces.
 *
 * Example pattern:
 *   FACT  (Mar 13): COO Anna Lindgren said "vendor lock-in is our top risk"
 *   SIGNAL (Apr 12): Job posting for "Vendor Strategy Lead — Banking"
 *   PATTERN: corroborates / vendors / 30-day gap / high confidence
 *
 * Design choices:
 *   1. Candidate gating is structural (no LLM): we only consider (fact, signal)
 *      pairs where bank_key matches AND signal.detected_at is within
 *      ±windowDays of fact.meeting_date AND topic-affinity exists (the signal's
 *      category/keywords overlap with the fact's topic).
 *   2. The LLM only judges the relationship between candidate pairs that
 *      already passed structural gating. Output is constrained:
 *        - pattern_type ∈ {corroborates, contradicts, evolves, unrelated}
 *        - summary must reference both source items (≤140 chars)
 *        - confidence ∈ {low, medium, high}
 *      Anything labeled 'unrelated' is dropped.
 *   3. Idempotent: content_hash = sha256(fact_id|signal_id|pattern_type) means
 *      re-running can't double-insert the same pairing.
 *
 * Why it's defensible: every pattern row carries fact_id + signal_id, so the
 * UI can always show provenance — "this pattern is grounded in M-1234 and S-5678".
 */

import { callClaude, isApiKeyConfigured } from '../fetchers/claudeClient.mjs';
import { randomUUID, createHash } from 'node:crypto';

const PATTERN_TYPES = ['corroborates', 'contradicts', 'evolves', 'unrelated'];
const CONFIDENCE_LEVELS = ['low', 'medium', 'high'];

// Topic ↔ signal-category affinity. Used for structural gating before LLM call.
// Multi-mapping: a fact about 'budget' might pair with 'strategic' or 'momentum' signals.
const TOPIC_TO_SIGNAL_CATEGORIES = {
  budget:    ['strategic', 'momentum', 'internal'],
  vendors:   ['competitive', 'strategic', 'stakeholder'],
  timeline:  ['momentum', 'strategic', 'internal'],
  politics:  ['stakeholder', 'internal', 'regulatory'],
  technical: ['strategic', 'competitive', 'momentum'],
  blockers:  ['stakeholder', 'regulatory', 'competitive'],
  other:     ['strategic', 'momentum', 'stakeholder', 'competitive', 'regulatory', 'internal', 'market'],
};

// Topic ↔ keyword hints for fuzzy match against signal title/description.
const TOPIC_KEYWORDS = {
  budget:    ['budget', 'cost', 'capex', 'opex', 'investment', 'spend', 'allocation', 'funding'],
  vendors:   ['vendor', 'partner', 'rfp', 'rfi', 'procurement', 'lock-in', 'replace', 'migrat'],
  timeline:  ['timeline', 'roadmap', 'launch', 'go-live', 'milestone', 'delay', 'accelerat'],
  politics:  ['ceo', 'board', 'chair', 'appointed', 'resign', 'departure', 'committee'],
  technical: ['platform', 'architecture', 'core', 'integration', 'api', 'cloud', 'modernization', 'decoupling'],
  blockers:  ['compliance', 'regulator', 'risk', 'audit', 'security', 'incident', 'outage'],
  other:     [],
};

const SYSTEM_PROMPT = `You judge whether an internal meeting fact and an external market signal are related, and if so how.

Given:
- A fact: a stakeholder's stated position from a meeting (with verbatim evidence quote, topic, sentiment, date)
- A signal: an external event (news, job posting, competitor move) for the same bank (with title, description, date)

Decide the relationship. Output ONE JSON object:
{
  "pattern_type": "corroborates" | "contradicts" | "evolves" | "unrelated",
  "summary": "one line connecting the fact and the signal — must reference both, ≤140 chars",
  "confidence": "low" | "medium" | "high"
}

DEFINITIONS:
- corroborates: the signal is consistent with what the stakeholder said AND post-dates the fact (e.g., CFO said "we need to consolidate vendors" → 3 weeks later, RFP issued for unified platform). NEVER use "corroborates" for a signal that pre-dates the fact — the stakeholder cannot be "validated by" something that already happened before they spoke.
- contradicts: the signal moves in the opposite direction from what was said (e.g., CTO said "no near-term core replacement" → 4 weeks later, public RFP for new core).
- evolves: the situation has materially developed. Two valid sub-cases: (a) signal post-dates fact and shows the situation moved forward; (b) signal pre-dates fact and the fact is the stakeholder REACTING to that prior signal. In sub-case (b), the summary must explicitly note the stakeholder is responding to the prior event.
- unrelated: the signal isn't actually about the same thing despite surface keyword overlap.

STRICT RULES:
1. The summary MUST reference both the fact (who said what) and the signal (what happened). No prose drift.
2. **TEMPORAL DIRECTION IS GIVEN AS SIGNED gap_days.** Positive = signal after fact. Negative = signal before fact (stakeholder is reacting to it, not validated by it). Use this to pick pattern_type correctly.
3. confidence='high' requires: same topic substance + correct temporal logic + |gap_days| ≤ 60 + speaker is a named, attributed stakeholder.
4. If speaker is unattributed (marked "(unattributed)"), confidence MUST be at most "medium".
5. confidence='low' is reserved for plausible-but-thin connections — surface them but flag clearly.
6. If the connection is keyword-only ("vendor" appears in both but in unrelated contexts), return "unrelated".
7. Return ONLY the JSON object. No commentary, no markdown.`;

/**
 * For one fact, find candidate signals that pass structural gating.
 * Returns up to maxCandidates signals, sorted by recency proximity to fact.
 */
function findCandidateSignals(db, fact, options) {
  const { windowDays, maxCandidates } = options;

  // Compute window bounds around the meeting date
  const meetingDate = new Date(fact.meeting_date);
  const lo = new Date(meetingDate); lo.setDate(lo.getDate() - windowDays);
  const hi = new Date(meetingDate); hi.setDate(hi.getDate() + windowDays);
  const loISO = lo.toISOString().slice(0, 10);
  const hiISO = hi.toISOString().slice(0, 10);

  const allowedCats = TOPIC_TO_SIGNAL_CATEGORIES[fact.topic] || [];
  if (allowedCats.length === 0) return [];

  const placeholders = allowedCats.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT id, signal_category, signal_event, title, description, severity, detected_at, source_type, source_url
    FROM deal_signals
    WHERE deal_id = ?
      AND COALESCE(is_demo, 0) = 0
      AND signal_category IN (${placeholders})
      AND date(detected_at) BETWEEN date(?) AND date(?)
    ORDER BY detected_at DESC
  `).all(fact.bank_key, ...allowedCats, loISO, hiISO);

  // Keyword affinity boost — if any topic keyword appears in title/description,
  // keep at top. Otherwise keep but weight lower.
  const keywords = TOPIC_KEYWORDS[fact.topic] || [];
  const detectedYear = new Date(fact.meeting_date).getUTCFullYear();
  const scored = rows.map(s => {
    const blob = `${s.title || ''} ${s.description || ''}`.toLowerCase();
    const hits = keywords.filter(kw => blob.includes(kw)).length;
    const factDay = new Date(fact.meeting_date).getTime();
    const sigDay = new Date(s.detected_at).getTime();
    // SIGNED gap: positive = signal AFTER fact, negative = signal BEFORE fact.
    // The LLM needs this to judge corroborates vs evolves correctly (Issue 2 fix).
    const signedGapDays = Math.round((sigDay - factDay) / (1000 * 60 * 60 * 24));
    const gapDays = Math.abs(signedGapDays);
    // Year-mismatch filter (Issue 1 fix). When a signal title contains a
    // 4-digit year that disagrees with both detected_at and the fact year by
    // 1+ years, the crawler likely re-discovered an older page. Drop these —
    // detected_at is ingestion time, not event time.
    const titleYearMatch = (s.title || '').match(/\b(20\d{2})\b/);
    const sigDetectedYear = new Date(s.detected_at).getUTCFullYear();
    const yearMismatch = titleYearMatch
      && Math.abs(parseInt(titleYearMatch[1], 10) - sigDetectedYear) >= 1
      && Math.abs(parseInt(titleYearMatch[1], 10) - detectedYear) >= 1;
    return { ...s, _kw_hits: hits, _gap_days: gapDays, _signed_gap_days: signedGapDays, _year_mismatch: yearMismatch };
  }).filter(s => !s._year_mismatch);

  // Sort: keyword hits desc, then proximity asc
  scored.sort((a, b) => (b._kw_hits - a._kw_hits) || (a._gap_days - b._gap_days));
  return scored.slice(0, maxCandidates);
}

/**
 * Ask Claude to judge one (fact, signal) pair. Returns null if unrelated or if
 * the LLM response fails validation.
 */
async function judgePair(fact, signal) {
  const userMessage = `BANK: ${fact.bank_key}

FACT (from meeting on ${fact.meeting_date}):
- Speaker: ${fact.speaker_name || '(unattributed)'} ${fact.speaker_role ? `[${fact.speaker_role}]` : ''}
- Topic: ${fact.topic}
- Sentiment: ${fact.sentiment}
- Position: ${fact.position}
- Evidence (verbatim): "${fact.evidence_quote}"

EXTERNAL SIGNAL (detected ${signal.detected_at}):
- Category: ${signal.signal_category} / ${signal.signal_event}
- Source: ${signal.source_type || 'unknown'}
- Title: ${signal.title}
- Description: ${signal.description || '(no description)'}

Time gap: ${signal._signed_gap_days >= 0 ? `signal is ${signal._signed_gap_days} days AFTER the meeting` : `signal is ${Math.abs(signal._signed_gap_days)} days BEFORE the meeting (stakeholder may be reacting to it)`}.
gap_days (signed) = ${signal._signed_gap_days}

Judge the relationship. Output JSON only.`;

  let raw;
  try {
    raw = await callClaude(SYSTEM_PROMPT, userMessage, { maxTokens: 400, timeout: 30000 });
  } catch (err) {
    console.warn(`[crossReferenceEngine] Claude call failed: ${err.message}`);
    return null;
  }
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/```$/, '').trim();
  let parsed;
  try { parsed = JSON.parse(cleaned); } catch { return null; }
  if (!parsed || typeof parsed !== 'object') return null;
  if (!PATTERN_TYPES.includes(parsed.pattern_type)) return null;
  if (parsed.pattern_type === 'unrelated') return null; // drop
  if (!parsed.summary || typeof parsed.summary !== 'string' || parsed.summary.length < 10) return null;
  const confidence = CONFIDENCE_LEVELS.includes(parsed.confidence) ? parsed.confidence : 'medium';
  return { pattern_type: parsed.pattern_type, summary: parsed.summary.slice(0, 240), confidence };
}

/**
 * Build a content hash for idempotent inserts.
 */
function hashPair(factId, signalId, patternType) {
  return createHash('sha256').update(`${factId}|${signalId}|${patternType}`).digest('hex').slice(0, 32);
}

/**
 * Run the cross-reference engine for one bank. Returns { processed_facts, patterns_added, patterns_skipped }.
 *
 * @param {Database} db
 * @param {string} bankKey
 * @param {object} options
 *   windowDays:    ±days around fact.meeting_date to consider signals (default 60)
 *   maxCandidates: max signals to evaluate per fact (default 4) — caps LLM cost
 *   factsLimit:    max facts to process this run (default 50) — caps LLM cost
 *   force:         re-evaluate facts already in pattern_matches (default false)
 */
export async function runCrossReferenceForBank(db, bankKey, options = {}) {
  const { windowDays = 60, maxCandidates = 4, factsLimit = 50, force = false } = options;
  if (!isApiKeyConfigured()) {
    console.warn('[crossReferenceEngine] ANTHROPIC_API_KEY not set — skipping');
    return { processed_facts: 0, patterns_added: 0, patterns_skipped: 0, candidates_evaluated: 0 };
  }

  // Load facts for this bank. Skip facts that already have at least one pattern unless force.
  const facts = db.prepare(`
    SELECT mf.*, p.role AS speaker_role
    FROM meeting_facts mf
    LEFT JOIN persons p ON p.id = mf.speaker_person_id
    WHERE mf.bank_key = ?
      ${force ? '' : 'AND NOT EXISTS (SELECT 1 FROM pattern_matches pm WHERE pm.internal_fact_id = mf.id)'}
    ORDER BY mf.meeting_date DESC
    LIMIT ?
  `).all(bankKey, factsLimit);

  if (facts.length === 0) {
    return { processed_facts: 0, patterns_added: 0, patterns_skipped: 0, candidates_evaluated: 0 };
  }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO pattern_matches (
      id, bank_key, internal_fact_id, external_signal_id, pattern_type, summary,
      content_hash, confidence, time_gap_days, topic, fact_evidence, signal_evidence
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let added = 0;
  let skipped = 0;
  let candidates = 0;
  for (const fact of facts) {
    const signals = findCandidateSignals(db, fact, { windowDays, maxCandidates });
    candidates += signals.length;
    for (const signal of signals) {
      const judgment = await judgePair(fact, signal);
      if (!judgment) { skipped += 1; continue; }
      // Issue 3 fix: clamp confidence to ≤medium when speaker isn't attributed
      // to a known stakeholder. The LLM is also instructed to do this in the
      // system prompt; this is the belt-and-braces server-side enforcement.
      let confidence = judgment.confidence;
      if (!fact.speaker_person_id && confidence === 'high') confidence = 'medium';
      // Additional belt-and-braces: corroborates with negative gap is illegal
      // (signal pre-dates fact). Demote to 'evolves' or drop.
      let patternType = judgment.pattern_type;
      if (patternType === 'corroborates' && signal._signed_gap_days < 0) {
        patternType = 'evolves';
        confidence = confidence === 'high' ? 'medium' : confidence;
      }
      const id = randomUUID();
      const hash = hashPair(fact.id, signal.id, patternType);
      const result = insert.run(
        id, bankKey, fact.id, signal.id, patternType, judgment.summary,
        hash, confidence, signal._signed_gap_days, fact.topic,
        fact.evidence_quote, signal.title
      );
      if (result.changes > 0) added += 1; else skipped += 1; // hash collision = duplicate
    }
  }

  return { processed_facts: facts.length, patterns_added: added, patterns_skipped: skipped, candidates_evaluated: candidates };
}

/**
 * Bulk runner across every bank that has facts.
 */
export async function runCrossReferenceForAllBanks(db, options = {}) {
  const { bankFilter = null } = options;
  let sql = `SELECT DISTINCT bank_key FROM meeting_facts`;
  const params = [];
  if (bankFilter) { sql += ` WHERE bank_key LIKE ?`; params.push(`%${bankFilter}%`); }
  const banks = db.prepare(sql).all(...params).map(r => r.bank_key);

  const results = [];
  for (const bk of banks) {
    const r = await runCrossReferenceForBank(db, bk, options);
    results.push({ bank_key: bk, ...r });
  }
  return results;
}

/**
 * Read API — get all patterns for a bank with full source-trace for the UI.
 */
export function getPatternsForBank(db, bankKey, options = {}) {
  const { onlyUnacknowledged = false, minConfidence = null } = options;
  const where = ['pm.bank_key = ?'];
  const params = [bankKey];
  if (onlyUnacknowledged) where.push('pm.acknowledged_at IS NULL');
  if (minConfidence) {
    const order = { low: 0, medium: 1, high: 2 };
    const allowed = CONFIDENCE_LEVELS.filter(c => order[c] >= order[minConfidence]);
    where.push(`pm.confidence IN (${allowed.map(() => '?').join(',')})`);
    params.push(...allowed);
  }
  return db.prepare(`
    SELECT
      pm.*,
      mf.position AS fact_position,
      mf.sentiment AS fact_sentiment,
      mf.speaker_name AS fact_speaker_name,
      mf.meeting_date AS fact_meeting_date,
      ds.title AS signal_title,
      ds.description AS signal_description,
      ds.signal_category AS signal_category,
      ds.detected_at AS signal_detected_at,
      ds.source_url AS signal_source_url
    FROM pattern_matches pm
    LEFT JOIN meeting_facts mf ON mf.id = pm.internal_fact_id
    LEFT JOIN deal_signals ds ON ds.id = pm.external_signal_id
    WHERE ${where.join(' AND ')}
    ORDER BY
      CASE pm.confidence WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
      pm.detected_at DESC
  `).all(...params);
}
