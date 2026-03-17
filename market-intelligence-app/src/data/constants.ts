/**
 * Named constants extracted from scoring, ROI, and NBA engines.
 *
 * Centralising these makes business assumptions auditable and tuneable
 * without hunting through calculation logic.
 */

// ─── Scoring thresholds ─────────────────────────────────────────────
export const SCORE = {
  MAX: 10,
  POWER_MAP_BONUS: 1.0,
  PARTNER_ACCESS_BONUS: 0.5,
  /** Thresholds used by scoreColor / scoreBg / scoreLabel */
  TIER_STRONG: 8,
  TIER_GOOD: 6,
  TIER_MODERATE: 4,
} as const;

// ─── ROI calculation assumptions ────────────────────────────────────
export const ROI = {
  /** Multiplier applied to (assets × NIM) to approximate total revenue (NII + fees) */
  REVENUE_FEE_MULTIPLIER: 2.5,
  /** Annual new-customer acquisition rate (% of base) */
  ACQUISITION_RATE: 0.03,
  /** Share of new acquisitions via digital channel */
  DIGITAL_CHANNEL_SHARE: 0.6,
  /** First-year revenue recognised as fraction of full annual (conservative) */
  FIRST_YEAR_REVENUE_FACTOR: 0.5,
  /** Fraction of total tech spend addressable by engagement platform */
  ADDRESSABLE_TECH_SPEND_PCT: 0.25,
} as const;

// ─── Next Best Action engine ────────────────────────────────────────
export const NBA = {
  /** Maximum actions returned per bank */
  MAX_ACTIONS: 8,
  /** Qualification dimension score at or below which a gap-action is generated */
  QUAL_GAP_THRESHOLD: 5,
  /** iOS app rating below which a CX action is generated */
  LOW_APP_RATING: 3.5,
  /** Minimum CX weaknesses to trigger a "document weaknesses" action */
  MIN_CX_WEAKNESSES: 3,
  /** Minimum unconnected KDMs to trigger a research action */
  MIN_UNCONNECTED_KDMS: 2,
} as const;

// ─── Derived types ──────────────────────────────────────────────────
export type ScoreConstants = typeof SCORE;
export type RoiConstants = typeof ROI;
export type NbaConstants = typeof NBA;

// ─── UI display limits ──────────────────────────────────────────────
export const UI = {
  /** Max search results to display */
  SEARCH_RESULTS_LIMIT: 20,
  /** Top KDMs shown in default (non-meeting) view */
  TOP_KDMS: 4,
  /** Top signals shown in context tab */
  TOP_SIGNALS: 5,
  /** Max items shown in compact lists before "show more" */
  COMPACT_LIST_MAX: 4,
  /** Deep banks with full operational profiles */
  DEEP_BANKS: [
    'Nordea_Sweden', 'SEB_Sweden', 'DNB_Norway', 'Handelsbanken_Sweden',
    'Swedbank_Sweden', 'Danske Bank_Denmark', 'OP Financial Group_Finland', 'TF Bank_Sweden',
  ],
} as const;

// ─── API configuration ──────────────────────────────────────────────
export const API_CONFIG = {
  /** Default timeout for data reads (ms) */
  DEFAULT_TIMEOUT_MS: 15_000,
  /** Timeout for AI-powered endpoints (ms) */
  AI_TIMEOUT_MS: 150_000,
  /** Max retries for transient failures */
  MAX_RETRIES: 2,
  /** Base delay for exponential backoff (ms) */
  RETRY_BASE_MS: 1_000,
  /** Max AI requests per minute (rate limiter) */
  RATE_LIMIT_PER_MIN: 20,
} as const;

export type UiConstants = typeof UI;
export type ApiConfigConstants = typeof API_CONFIG;
