/**
 * Shared MEDDICC + stakeholder map constants for the Strategic Account Plan.
 * Extracted from PowerMapView.jsx so they can be reused across editable map
 * components, person intel cards, and the person form modal.
 */

// ── MEDDICC Role Definitions ──────────────────────────────────
// Each role maps to a color for quick visual identification on the matrix.
export const MEDDICC_ROLES = {
  economic_buyer:    { label: 'Economic Buyer',    short: 'EB',  color: '#D97706', icon: '💰' },
  champion:          { label: 'Champion',           short: 'Ch',  color: '#059669', icon: '⭐' },
  decision_criteria: { label: 'Decision Criteria',  short: 'DC',  color: '#2563EB', icon: '📋' },
  decision_process:  { label: 'Decision Process',   short: 'DP',  color: '#4F46E5', icon: '🔄' },
  identify_pain:     { label: 'Identify Pain',      short: 'IP',  color: '#7C3AED', icon: '⚡' },
  metrics:           { label: 'Metrics',             short: 'M',   color: '#0891B2', icon: '📊' },
  competition:       { label: 'Competition',        short: 'C',   color: '#DC2626', icon: '⚔️' },
};

// ── Engagement Status ─────────────────────────────────────────
// Mapped to the X-axis of the 2x2 influence/engagement matrix.
// Order matters — left (champion) to right (blocker).
export const ENGAGEMENT_STATUSES = ['champion', 'engaged', 'neutral', 'unaware', 'blocker'];

export const ENGAGEMENT_META = {
  champion:  { label: 'Champion',  color: '#059669', bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200' },
  engaged:   { label: 'Engaged',   color: '#3B82F6', bg: 'bg-blue-50',     text: 'text-blue-700',     border: 'border-blue-200' },
  neutral:   { label: 'Neutral',   color: '#64748B', bg: 'bg-slate-50',    text: 'text-slate-600',    border: 'border-slate-200' },
  unaware:   { label: 'Unaware',   color: '#A16207', bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200' },
  blocker:   { label: 'Blocker',   color: '#DC2626', bg: 'bg-red-50',      text: 'text-red-700',      border: 'border-red-200' },
};

// ── Support Status (similar to engagement but simpler — the consultant's judgment) ──
export const SUPPORT_STATUSES = ['champion', 'supporter', 'neutral', 'blocker'];

export const SUPPORT_META = {
  champion:  { label: 'Champion',  color: '#059669', bg: 'bg-emerald-100 text-emerald-800' },
  supporter: { label: 'Supporter', color: '#3B82F6', bg: 'bg-blue-100 text-blue-800' },
  neutral:   { label: 'Neutral',   color: '#64748B', bg: 'bg-slate-100 text-slate-600' },
  blocker:   { label: 'Blocker',   color: '#DC2626', bg: 'bg-red-100 text-red-800' },
};

// ── Relationship Type ─────────────────────────────────────────
export const RELATIONSHIP_TYPES = {
  executive_sponsor:  { label: 'Executive Sponsor',  description: 'Senior leader with strategic authority' },
  budget_owner:       { label: 'Budget Owner',       description: 'Controls the purchase decision & funding' },
  operational:        { label: 'Operational User',   description: 'Day-to-day user of the platform' },
  key_influencer:     { label: 'Key Influencer',     description: 'Shapes the decision without owning it' },
  business_sponsor:   { label: 'Business Sponsor',   description: 'Owns the business outcome' },
  external_ally:      { label: 'External Ally',      description: 'Outside advisor or partner pushing the deal' },
};

// ── Role Category Colors (aligned with PeopleTab.jsx) ─────────
export const ROLE_CATEGORY_META = {
  'C-suite':  { color: '#1E1B4B', bg: 'bg-indigo-950 text-white',     label: 'C-suite' },
  'SVP':      { color: '#4F46E5', bg: 'bg-indigo-600 text-white',     label: 'SVP' },
  'VP':       { color: '#3B82F6', bg: 'bg-blue-500 text-white',       label: 'VP' },
  'Director': { color: '#8B5CF6', bg: 'bg-violet-500 text-white',     label: 'Director' },
  'Manager':  { color: '#64748B', bg: 'bg-slate-500 text-white',      label: 'Manager' },
  'Other':    { color: '#94A3B8', bg: 'bg-slate-400 text-white',      label: 'Other' },
};

// ── Matrix coordinate helpers ────────────────────────────────
// Translate drop coordinates → influence_score (1-10) + engagement_status (5 buckets)
export function coordsToPosition(dropX, dropY, containerWidth, containerHeight) {
  // Left = champion (0), right = blocker (1)
  const engagementFraction = Math.max(0, Math.min(1, dropX / containerWidth));
  // Top = high influence (10), bottom = low (1)
  const influenceFraction = Math.max(0, Math.min(1, 1 - (dropY / containerHeight)));

  const buckets = [
    { max: 0.2, status: 'champion' },
    { max: 0.4, status: 'engaged' },
    { max: 0.6, status: 'neutral' },
    { max: 0.8, status: 'unaware' },
    { max: 1.01, status: 'blocker' },
  ];
  const engagement_status = buckets.find(b => engagementFraction <= b.max).status;
  const influence_score = Math.max(1, Math.min(10, Math.round(influenceFraction * 9 + 1)));

  return { engagement_status, influence_score };
}

// Reverse: given a person's score + status, compute their visual position
export function positionToCoords(influenceScore, engagementStatus, containerWidth, containerHeight) {
  const idx = ENGAGEMENT_STATUSES.indexOf(engagementStatus);
  const engagementFraction = idx >= 0 ? (idx + 0.5) / ENGAGEMENT_STATUSES.length : 0.5;
  const influenceFraction = (Math.max(1, Math.min(10, influenceScore || 5)) - 1) / 9;
  return {
    x: engagementFraction * containerWidth,
    y: (1 - influenceFraction) * containerHeight,
  };
}
