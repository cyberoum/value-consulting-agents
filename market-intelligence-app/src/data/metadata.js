// DATA_METADATA — Provenance, timestamps, and freshness tracking
// This file is the single source of truth for when data was collected and last verified.

export const DATASET_VERSION = '1.0.0';
export const DATASET_LABEL = 'Q1 2026 Intelligence Cycle';
// DATASET_DATE is derived after BANK_METADATA is defined (see bottom of file)

// Categories of time-sensitive fields and their typical shelf life (in days)
export const FIELD_SHELF_LIFE = {
  leadership:   90,   // Executive roles change quarterly
  kpis:         365,  // Financial KPIs update annually (annual reports)
  app_ratings:  90,   // App store ratings shift monthly
  deal_intel:   180,  // Deal size/timing estimates — semi-annual review
  competition:  180,  // Vendor landscape — semi-annual
  cx_data:      180,  // CX strengths/weaknesses — semi-annual
  strategy:     365,  // Strategic initiatives — annual cycle
  pain_points:  365,  // Pain points — annual
  landing_zones: 365, // Landing zone analysis — annual
  signals:      180,  // Market signals — semi-annual
};

// Per-bank metadata — when each data category was last verified
// "as_of" = the date the data was last confirmed accurate (not necessarily when it was entered)
export const BANK_METADATA = {
  "Nordea_Sweden":           { as_of: '2026-03-01', source_period: 'FY2024 Annual Report + Q1 2026 research', leadership_verified: '2026-02-15', kpis_period: 'FY2024' },
  "SEB_Sweden":              { as_of: '2026-03-01', source_period: 'FY2024 Annual Report + Q1 2026 research', leadership_verified: '2026-02-15', kpis_period: 'FY2024' },
  "DNB_Norway":              { as_of: '2026-03-01', source_period: 'FY2024 Annual Report + Q1 2026 research', leadership_verified: '2026-02-15', kpis_period: 'FY2024' },
  "Handelsbanken_Sweden":    { as_of: '2026-03-01', source_period: 'FY2024 Annual Report + Q1 2026 research', leadership_verified: '2026-02-15', kpis_period: 'FY2024' },
  "Swedbank_Sweden":         { as_of: '2026-03-01', source_period: 'FY2024 Annual Report + Q1 2026 research', leadership_verified: '2026-02-15', kpis_period: 'FY2024' },
  "Danske Bank_Denmark":     { as_of: '2026-03-01', source_period: 'FY2024 Annual Report + Q1 2026 research', leadership_verified: '2026-02-15', kpis_period: 'FY2024' },
  "OP Financial Group_Finland": { as_of: '2026-03-01', source_period: 'FY2024 Annual Report + Q1 2026 research', leadership_verified: '2026-02-15', kpis_period: 'FY2024' },
  "TF Bank_Sweden":          { as_of: '2026-03-01', source_period: 'FY2024 Annual Report + Q1 2026 research', leadership_verified: '2026-02-15', kpis_period: 'FY2024' },
  // Standard-depth banks
  "Nykredit_Denmark":        { as_of: '2026-02-20', source_period: 'Q4 2024 + press research', leadership_verified: '2026-02-20', kpis_period: 'FY2024' },
  "Jyske Bank_Denmark":      { as_of: '2026-02-20', source_period: 'Q4 2024 + press research', leadership_verified: '2026-02-20', kpis_period: 'FY2024' },
  "SpareBank 1 SR-Bank_Norway": { as_of: '2026-02-20', source_period: 'FY2024 + alliance data', leadership_verified: '2026-02-20', kpis_period: 'FY2024' },
  "Nordea Finland_Finland":  { as_of: '2026-02-20', source_period: 'Via Nordea Group data', leadership_verified: '2026-02-20', kpis_period: 'FY2024' },
  "Nordea Norway_Norway":    { as_of: '2026-02-20', source_period: 'Via Nordea Group data', leadership_verified: '2026-02-20', kpis_period: 'FY2024' },
  "Nordea Denmark_Denmark":  { as_of: '2026-02-20', source_period: 'Via Nordea Group data', leadership_verified: '2026-02-20', kpis_period: 'FY2024' },
};

// Flags — user-reported outdated sections (persisted to localStorage, shared key)
const FLAGS_KEY = 'mi-data-flags';

export function getFlags() {
  try {
    return JSON.parse(localStorage.getItem(FLAGS_KEY) || '{}');
  } catch { return {}; }
}

export function setFlag(bankKey, section, note = '') {
  const flags = getFlags();
  const id = `${bankKey}::${section}`;
  flags[id] = { flaggedAt: new Date().toISOString(), note, bankKey, section };
  localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
  return flags;
}

export function removeFlag(bankKey, section) {
  const flags = getFlags();
  delete flags[`${bankKey}::${section}`];
  localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
  return flags;
}

export function getFlagsForBank(bankKey) {
  const flags = getFlags();
  const result = {};
  Object.entries(flags).forEach(([id, data]) => {
    if (data.bankKey === bankKey) result[data.section] = data;
  });
  return result;
}

export function getAllFlagCount() {
  return Object.keys(getFlags()).length;
}

// Freshness calculation
export function calcFreshness(dateStr) {
  if (!dateStr) return { age: Infinity, level: 'unknown', label: 'Unknown', daysOld: null };
  const now = new Date();
  const then = new Date(dateStr);
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (days <= 90) return { age: days, level: 'fresh', label: `${days}d ago`, color: '#2E7D32', bg: '#E8F5E9' };
  if (days <= 180) return { age: days, level: 'recent', label: `${Math.round(days / 30)}mo ago`, color: '#F57F17', bg: '#FFF8E1' };
  if (days <= 365) return { age: days, level: 'aging', label: `${Math.round(days / 30)}mo ago`, color: '#E65100', bg: '#FFF3E0' };
  return { age: days, level: 'stale', label: `${Math.round(days / 365)}yr+ ago`, color: '#C62828', bg: '#FFEBEE' };
}

// Derive DATASET_DATE from the most recent bank's as_of date (auto-updates, never stale)
export const DATASET_DATE = Object.values(BANK_METADATA)
  .map(m => m.as_of)
  .filter(Boolean)
  .sort()
  .reverse()[0] || '2026-01-01';

// Get freshness for a specific bank
export function bankFreshness(bankKey) {
  const meta = BANK_METADATA[bankKey];
  if (!meta) return calcFreshness(DATASET_DATE); // Fall back to global dataset date
  return calcFreshness(meta.as_of);
}
