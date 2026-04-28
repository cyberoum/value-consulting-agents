/**
 * Source Grader — Sprint 3.1
 * ──────────────────────────
 * Deterministic, rule-based classifier that grades every signal source on
 * authority. NOT an LLM call — these are domain heuristics that need to
 * run fast (520+ signals at startup), be auditable (the AE can see WHY
 * something graded D), and be reversible (consultants can override).
 *
 * Output: { grade: 'A'|'B'|'C'|'D', publisher: string|null, is_primary: boolean, reason: string }
 *
 *   A — bank-originated / regulator-originated / AE-witnessed:
 *       • source_type ∈ {internal, manual, meeting} where AE logged it
 *       • title publisher contains bank name (own newsroom)
 *       • publisher is a regulator (FSA, ECB, EBA, FCA, Finansinspektionen, Finanstilsynet)
 *       • title contains "press release" / "official announcement"
 *
 *   B — tier-1 financial press:
 *       • Publisher matches established global/regional financial outlets
 *
 *   C — specialized trade press / aggregators (DEFAULT for news source_type):
 *       • Publisher matches fintech/banking trade outlets
 *       • Otherwise unmatched news → C
 *
 *   D — social, blogs, individuals, low-authority:
 *       • Publisher matches blog/social domains
 *       • Publisher is a person's name (e.g., "Marcus Oscarsson")
 *       • No publisher could be identified
 *
 * The grader is total — every signal gets a grade, never null. If the
 * classifier can't decide, it defaults to C with reason='unmatched_news'
 * (better than D for genuine news with unknown publisher).
 */

const TIER_B_PUBLISHERS = new Set([
  'reuters', 'bloomberg', 'bloomberg.com', 'financial times', 'ft.com',
  'wall street journal', 'wsj', 'wsj.com', 'cnbc', 'forbes', 'the economist',
  // Nordics tier-1
  'dagens næringsliv', 'dagens naeringsliv', 'helsingin sanomat',
  'børsen', 'borsen', 'di', 'dagens industri', 'svenska dagbladet',
  'aftenposten', 'expressen',
]);

const TIER_C_PUBLISHERS = new Set([
  // Fintech / banking trades
  'fintech futures', 'fintech future', 'amwatch', 'finanswatch.no', 'finanswatch.se',
  'finanswatch', 'finansavisen', 'retail banker international', 'rbi',
  'ntb kommunikasjon', 'cision news', 'cision', 'investing.com', 'marketscreener.com',
  'tradingview', 'mlex', 'banking technology', 'fintech magazine',
  'finextra', 'the banker', 'global finance', 'banking dive',
]);

// Bank-originated press release detection. Tightened in Sprint 3.1 audit fix:
// - URL match wins (the bank's own domain hosting the page)
// - "press release"/"newsroom"/"investor relations" in title also qualifies
// - bare bank-name-in-title is NOT sufficient (otherwise Reuters covering Nordea
//   would grade A, which is wrong — Reuters is B)
const TIER_A_BANK_PRESS_URL_PATTERNS = [
  /\b(?:nordea|danskebank|seb|swedbank|handelsbanken|dnb|op|aktia|sparebank|tfbank|sparnord)\.(?:com|fi|se|no|dk)\b/i,
];
const TIER_A_BANK_PRESS_TITLE_PATTERNS = [
  /\b(?:press release|official statement|investor relations|newsroom)\b/i,
];

const TIER_A_REGULATOR_PUBLISHERS = new Set([
  'finansinspektionen', 'finanstilsynet', 'finanssivalvonta', 'fme',
  'ecb', 'european central bank', 'eba', 'european banking authority',
  'fca', 'fsa', 'sec', 'cftc',
]);

const TIER_D_PUBLISHERS_PATTERN = /\b(linkedin|twitter|x\.com|facebook|reddit|medium|substack|blog|wordpress|tumblr)\b/i;

/**
 * Parse the publisher name from the trailing " - Publisher" pattern in titles.
 * Returns null if no match. Handles unicode dashes (–, —) too.
 */
export function extractPublisher(title) {
  if (!title || typeof title !== 'string') return null;
  // Match the LAST " - X" segment (publisher always comes last in our feeds)
  const m = title.match(/[\s\-–—]+([^\-–—]+)$/);
  if (!m) return null;
  const candidate = m[1].trim();
  // Heuristic: publishers are typically 2-50 chars, no trailing punct
  if (candidate.length < 2 || candidate.length > 60) return null;
  return candidate;
}

/**
 * Detect if a publisher string looks like a person's name (Firstname Lastname pattern).
 * Used for grade-D detection (personal blogs).
 */
// Words that, if present in a publisher string, disqualify person-name detection.
// "Cision News", "Reuters Times", "Daily Mirror" — none are people.
const PUBLISHING_TERMS = new Set([
  'news', 'press', 'wire', 'daily', 'times', 'post', 'journal', 'herald',
  'magazine', 'gazette', 'network', 'today', 'online', 'radio', 'tv',
  'watch', 'tribune', 'standard', 'globe', 'mirror', 'group', 'media',
  'report', 'reports', 'review', 'business', 'finance', 'financial',
  'banking', 'tech', 'monitor', 'chronicle', 'observer', 'register',
  'edge', 'world', 'weekly', 'morning', 'evening', 'view', 'voice',
]);

function looksLikePersonName(s) {
  if (!s) return false;
  // Two or three capitalized words, no domain dots, none are publishing terms
  const trimmed = s.trim();
  if (/[\.\/]/.test(trimmed)) return false; // has dot or slash → likely a domain
  const words = trimmed.split(/\s+/);
  if (words.length < 2 || words.length > 3) return false;
  if (words.some(w => PUBLISHING_TERMS.has(w.toLowerCase()))) return false;
  return words.every(w => /^[A-ZÅÄÖÆØ][a-zåäöæø]+$/.test(w));
}

/**
 * Grade one signal. Pure function — no DB access.
 *
 * @param {object} signal — { source_type, source_url, title, description }
 * @returns {{ grade: 'A'|'B'|'C'|'D', publisher: string|null, is_primary: boolean, reason: string }}
 */
export function gradeSignal(signal) {
  const sourceType = (signal?.source_type || '').toLowerCase();
  const url = (signal?.source_url || '').toLowerCase();
  const title = signal?.title || '';
  const description = signal?.description || '';
  const publisher = extractPublisher(title);
  const pubLow = (publisher || '').toLowerCase();

  // ── A: AE-witnessed / internal ────────────────────────────────────────
  if (sourceType === 'internal') return { grade: 'A', publisher, is_primary: true, reason: 'internal_source' };
  if (sourceType === 'meeting')  return { grade: 'A', publisher, is_primary: true, reason: 'ae_logged_meeting' };

  // ── D-publisher pattern (social/blog domain) — check first ────────────
  // A LinkedIn post mentioning a regulator is still LinkedIn — grade the
  // PUBLISHER, not the content.
  if (TIER_D_PUBLISHERS_PATTERN.test(url) || TIER_D_PUBLISHERS_PATTERN.test(pubLow)) {
    return { grade: 'D', publisher, is_primary: false, reason: 'social_or_blog' };
  }

  // ── Known-publisher lookups must run BEFORE person-name fallback ──────
  // Otherwise "Cision News" / "Retail Banker" etc. with capitalized two-word
  // names get misclassified as personal blogs.
  if (TIER_B_PUBLISHERS.has(pubLow)) {
    return { grade: 'B', publisher, is_primary: false, reason: 'tier1_press' };
  }
  if (TIER_C_PUBLISHERS.has(pubLow)) {
    return { grade: 'C', publisher, is_primary: false, reason: 'trade_press' };
  }

  // ── D-fallback: looks like a person's name (and didn't match anything else)
  if (looksLikePersonName(publisher)) {
    return { grade: 'D', publisher, is_primary: false, reason: 'individual_publisher' };
  }

  // ── A: regulator-originated (publisher IS the regulator) ──────────────
  if (TIER_A_REGULATOR_PUBLISHERS.has(pubLow)) {
    return { grade: 'A', publisher, is_primary: true, reason: 'regulator_publisher' };
  }

  // ── A: bank-originated press release ──────────────────────────────────
  // URL on bank's own domain → A. Title with "press release"/"newsroom" → A.
  // Bare bank-name-in-title alone is NOT sufficient (Reuters mentioning Nordea
  // is still Reuters = B).
  if (TIER_A_BANK_PRESS_URL_PATTERNS.some(p => p.test(url))) {
    return { grade: 'A', publisher, is_primary: true, reason: 'bank_press_url' };
  }
  if (TIER_A_BANK_PRESS_TITLE_PATTERNS.some(p => p.test(title))) {
    return { grade: 'A', publisher, is_primary: true, reason: 'press_release_marker' };
  }

  // ── A: manual AE submission ───────────────────────────────────────────
  if (sourceType === 'manual') {
    return { grade: 'B', publisher, is_primary: false, reason: 'manual_submission' };
  }

  // ── Fallback: news with unrecognized publisher → C ────────────────────
  if (!publisher && sourceType === 'news') {
    return { grade: 'C', publisher: null, is_primary: false, reason: 'unmatched_news' };
  }

  // Default fallback — unknown publisher, but it has SOME source. Keep as C
  // (better than D) so we don't punish unrecognized but plausibly-real sources.
  return { grade: 'C', publisher, is_primary: false, reason: 'unrecognized_publisher' };
}

/**
 * Backfill grading across every signal in the DB. Idempotent — only updates
 * rows where source_grade IS NULL or force=true.
 *
 * @returns {{ processed: number, updated: number, by_grade: object }}
 */
export function gradeAllSignals(db, options = {}) {
  const { force = false } = options;
  const where = force ? '' : 'WHERE source_grade IS NULL';
  const rows = db.prepare(`
    SELECT id, source_type, source_url, title, description
    FROM deal_signals
    ${where}
  `).all();

  if (rows.length === 0) return { processed: 0, updated: 0, by_grade: {} };

  const update = db.prepare(`
    UPDATE deal_signals
    SET source_grade = ?, is_primary_source = ?, publisher_name = ?
    WHERE id = ?
  `);

  const txn = db.transaction(() => {
    let updated = 0;
    const byGrade = { A: 0, B: 0, C: 0, D: 0 };
    for (const row of rows) {
      const r = gradeSignal(row);
      update.run(r.grade, r.is_primary ? 1 : 0, r.publisher || null, row.id);
      byGrade[r.grade] += 1;
      updated += 1;
    }
    return { processed: rows.length, updated, by_grade: byGrade };
  });
  return txn();
}

/**
 * Bucket-level summary: count of signals at each grade, with recent examples.
 */
export function getGradeBreakdown(db) {
  return db.prepare(`
    SELECT source_grade AS grade, COUNT(*) AS count
    FROM deal_signals
    WHERE COALESCE(is_demo, 0) = 0
    GROUP BY source_grade
    ORDER BY source_grade
  `).all();
}
