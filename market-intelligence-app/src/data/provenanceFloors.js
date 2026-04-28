/**
 * Provenance Floor Config — Sprint 3.5
 * ────────────────────────────────────
 * Centralized policy for which surfaces refuse to render claims below a
 * given confidence-tier or source-grade floor.
 *
 * The default floor is "show all but mark clearly." High-stakes surfaces
 * (battle cards, exec briefs, account plans) ratchet up — they hide D-grade
 * or T3-only claims by default, with an opt-in toggle to show them.
 *
 * USAGE in a component:
 *   import { passesFloor, getFloor } from '../data/provenanceFloors';
 *   const floor = getFloor('battle_card');
 *   const visible = sources.filter(s => passesFloor(s, floor));
 *
 * Tier semantics (see Provenance.jsx):
 *   1 = Verified  (highest)
 *   2 = Inferred
 *   3 = Estimated (lowest)
 *
 * Grade semantics:
 *   A = Primary (highest)
 *   B = Tier-1 press
 *   C = Trade press
 *   D = Low authority (lowest)
 */

const TIER_RANK = { 1: 3, 2: 2, 3: 1 }; // higher number = higher confidence
const GRADE_RANK = { A: 4, B: 3, C: 2, D: 1 };

/**
 * Surface floors. min_tier and min_grade can each be null (no floor on that dimension).
 *
 * pulse:           show everything, lint warnings already surface gaps
 * person_intel:    show everything, AE editing context needs full picture
 * patterns_panel:  show medium+ confidence; low is too noisy here
 * battle_card:     T1 verified facts only, A or B grade — high-stakes prospect-facing
 * exec_brief:      T1 or T2, A or B grade — what gets exported to leadership
 * account_plan:    T1 or T2, A or B grade — same standard as exec_brief
 * meeting_brief:   T1, T2, or T3 — but warn on T3
 * exploratory:     show all (T3 + D ok) — research mode, anything goes
 */
export const PROVENANCE_FLOORS = {
  pulse:          { min_tier: null, min_grade: null, allow_override: true,  warn_below: { tier: 3, grade: 'D' } },
  person_intel:   { min_tier: null, min_grade: null, allow_override: true,  warn_below: null },
  patterns_panel: { min_tier: 2,    min_grade: null, allow_override: true,  warn_below: null },
  battle_card:    { min_tier: 1,    min_grade: 'B',  allow_override: false, warn_below: null },
  exec_brief:     { min_tier: 2,    min_grade: 'B',  allow_override: true,  warn_below: { tier: 2, grade: 'B' } },
  account_plan:   { min_tier: 2,    min_grade: 'B',  allow_override: true,  warn_below: { tier: 2, grade: 'B' } },
  meeting_brief:  { min_tier: 3,    min_grade: 'C',  allow_override: true,  warn_below: { tier: 3, grade: 'D' } },
  exploratory:    { min_tier: null, min_grade: null, allow_override: true,  warn_below: null },
};

export function getFloor(surface) {
  return PROVENANCE_FLOORS[surface] || PROVENANCE_FLOORS.exploratory;
}

/**
 * Test whether a single source passes the floor.
 * A source with no tier/grade information is treated as failing on that dimension.
 */
export function passesFloor(source, floor) {
  if (!source) return false;
  if (!floor) return true;
  if (floor.min_tier != null) {
    const sourceTierRank = TIER_RANK[source.confidence_tier] || 0;
    const floorTierRank = TIER_RANK[floor.min_tier] || 0;
    if (sourceTierRank < floorTierRank) return false;
  }
  if (floor.min_grade != null) {
    const sourceGradeRank = GRADE_RANK[source.source_grade] || 0;
    const floorGradeRank = GRADE_RANK[floor.min_grade] || 0;
    if (sourceGradeRank < floorGradeRank) return false;
  }
  return true;
}

/**
 * Test whether a source warrants a warning even if it passes the floor.
 * Used to flag "barely-passing" sources visually.
 */
export function warrantsWarning(source, floor) {
  if (!source || !floor || !floor.warn_below) return false;
  const w = floor.warn_below;
  if (w.tier && (TIER_RANK[source.confidence_tier] || 0) < (TIER_RANK[w.tier] || 0)) return true;
  if (w.grade && (GRADE_RANK[source.source_grade] || 0) <= (GRADE_RANK[w.grade] || 0)) return true;
  return false;
}

/**
 * Filter a source list, returning { kept, hidden, warnings }.
 * Used by surfaces that want to render kept sources + show "N hidden below floor" footer.
 */
export function applyFloor(sources, surface) {
  const floor = getFloor(surface);
  const kept = [];
  const hidden = [];
  const warnings = [];
  for (const s of sources || []) {
    if (passesFloor(s, floor)) {
      kept.push(s);
      if (warrantsWarning(s, floor)) warnings.push(s);
    } else {
      hidden.push(s);
    }
  }
  return { kept, hidden, warnings, floor };
}
