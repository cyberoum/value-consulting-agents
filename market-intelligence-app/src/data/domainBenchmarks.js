/**
 * Domain Benchmarks — Structured data extracted from knowledge/domains/
 *
 * These provide region-specific and domain-specific reference points
 * that supplement the generic European BENCHMARKS in roiEngine.js.
 *
 * Sources documented per entry.
 */

// ─── Retail Banking Benchmarks ───────────────────────────────────────
export const RETAIL_BENCHMARKS = {
  digital_adoption: {
    poor: 0.20, average: 0.30, good: 0.50, best: 0.60,
    label: 'Digital Active Rate',
    source: 'Backbase Consulting Playbook (15+ banks)',
  },
  mobile_adoption: {
    poor: 0.30, average: 0.45, good: 0.63, best: 0.75,
    label: 'Mobile Adoption',
    source: 'Backbase Consulting Playbook',
  },
  digital_sales_rate: {
    poor: 0, average: 0.10, good: 0.30, best: 0.50,
    label: 'Digital Sales Rate',
    source: 'Backbase Consulting Playbook',
  },
  self_service_rate: {
    poor: 0.40, average: 0.58, good: 0.78, best: 0.90,
    label: 'Self-Service Rate',
    source: 'Backbase Consulting Playbook',
  },
  digital_onboarding_leakage: {
    poor: 0.90, average: 0.80, good: 0.60, best: 0.50,
    label: 'Digital Onboarding Leakage',
    note: 'Lower is better',
    source: 'Backbase Consulting Playbook (10+ banks)',
  },
  cross_sell_ratio: {
    poor: 1.2, average: 1.35, good: 1.75, best: 2.0,
    label: 'Products per Customer',
    source: 'Backbase Consulting Playbook',
  },
  customer_retention: {
    poor: 0.70, average: 0.78, good: 0.90, best: 0.95,
    label: 'Customer Retention',
    source: 'Backbase Consulting Playbook',
  },
  stp_rate: {
    poor: 0.50, average: 0.60, good: 0.78, best: 0.90,
    label: 'STP Rate',
    source: 'Backbase Consulting Playbook (8+ banks)',
  },
  cost_to_serve_ratio: {
    poor: '1:5', average: '1:10', good: '1:20', best: '1:40+',
    label: 'Cost-to-Serve (Digital vs Branch)',
    source: 'BCG Banking Efficiency 2024',
  },
};

// ─── Regional Transaction Costs ──────────────────────────────────────
export const REGIONAL_COSTS = {
  EMEA: {
    branch_interaction: 8.50,
    digital_interaction: 0.50,
    call_center_interaction: 6.00,
    fte_cost: 95_000,
    source: 'BCG Banking Efficiency Benchmarks 2024',
  },
  LATAM: {
    branch_interaction: 4.50,
    digital_interaction: 0.33,
    call_center_interaction: 3.50,
    whatsapp_interaction: 1.50,
    fte_cost: 35_000,
    source: 'Banesco Bolivia Value Assessment 2025',
  },
  NAM: {
    branch_interaction: 12.00,
    digital_interaction: 0.60,
    call_center_interaction: 8.00,
    fte_cost: 120_000,
    savings_per_digital_shift: 5.18,
    source: 'UFCU/BECU Cost-Benefit Analysis 2022-2025',
  },
  APAC: {
    branch_interaction: 5.00,
    digital_interaction: 0.35,
    call_center_interaction: 4.00,
    fte_cost: 45_000,
    source: 'MyState Journey Assessment 2025',
  },
  Africa: {
    branch_interaction: 3.00,
    digital_interaction: 0.25,
    call_center_interaction: 2.50,
    fte_cost: 15_000,
    source: 'I&M Kenya Business Questionnaire 2025',
  },
};

// ─── Wealth Management Benchmarks ────────────────────────────────────
export const WEALTH_BENCHMARKS = {
  digital_active_rate: {
    poor: 0.20, average: 0.30, good: 0.50, best: 0.60,
    label: 'Digital Active Rate',
    source: 'Backbase WM Engagements',
  },
  aum_per_advisor: {
    poor: 30e6, average: 52.5e6, good: 112.5e6, best: 150e6,
    label: 'AUM per Advisor ($)',
    source: 'Industry Benchmarks',
  },
  admin_time_pct: {
    poor: 0.60, average: 0.55, good: 0.45, best: 0.40,
    label: 'Admin Time %',
    note: 'Lower is better',
    source: 'Goodbody/HNB Discovery',
  },
  onboarding_days: {
    poor: 30, average: 22, good: 10, best: 5,
    label: 'Onboarding Time (days)',
    note: 'Lower is better',
    source: 'Goodbody Ireland Data',
  },
  client_retention: {
    poor: 0.85, average: 0.89, good: 0.94, best: 0.96,
    label: 'Client Retention',
    source: 'Backbase Analysis',
  },
  rm_time_savings: {
    conservative: 15_000, moderate: 22_500, aggressive: 30_000,
    label: 'Annual RM Time Savings ($)',
    source: 'NAM Wealth Engagements',
  },
  revenue_per_client: {
    mass_affluent: 1_702,
    hnw: 5_388,
    blended: 3_500,
    label: 'Revenue per Client (EUR)',
    source: 'Goodbody Segments',
  },
};

// ─── Backbase Impact Benchmarks (validated from engagements) ─────────
export const BACKBASE_IMPACT = {
  onboarding: {
    revenue_uplift: { conservative: 0.10, moderate: 0.15, aggressive: 0.20 },
    cost_avoidance: { conservative: 0.40, moderate: 0.45, aggressive: 0.50 },
    source: 'MyState Journey Assessment 2025',
  },
  servicing: {
    revenue_uplift: { conservative: 0.05, moderate: 0.08, aggressive: 0.10 },
    cost_avoidance: { conservative: 0.20, moderate: 0.25, aggressive: 0.30 },
    source: 'MyState Journey Assessment 2025',
  },
  wealth_rm: {
    admin_reduction: { conservative: 0.30, moderate: 0.40, aggressive: 0.50 },
    prospecting_uplift: { conservative: 0.15, moderate: 0.25, aggressive: 0.40 },
    onboarding_effort: { conservative: 0.30, moderate: 0.40, aggressive: 0.50 },
    source: 'HNB Assessment Report Dec 2025',
  },
  credit_union: {
    digital_abandonment_improvement: { conservative: 0.10, moderate: 0.20, aggressive: 0.30 },
    products_per_member_lift: { conservative: 0.2, moderate: 0.4, aggressive: 0.6 },
    source: 'BECU/WSFS Engagements 2025',
  },
};

// ─── Reference Bank Data Points ──────────────────────────────────────
export const REFERENCE_BANKS = [
  { name: 'BECU', region: 'NAM', members: 1_500_000, assets: 29.4e9, digital_rate: 0.68, nps: 67, products_per: 2.3, source: 'BECU 2025-2026' },
  { name: 'WSFS Bank', region: 'NAM', customers: null, digital_rate: 0.64, abandonment: 0.91, products_per: 1.5, attrition: 0.21, source: 'WSFS 2025' },
  { name: 'Sandy Spring', region: 'NAM', retention: 0.96, products_per: 1.95, source: 'Sandy Spring 2025' },
  { name: 'I&M Kenya', region: 'Africa', customers: 461_253, digital_rate: 0.96, nps: 75, products_per: 1.9, churn: 0.013, source: 'I&M Kenya 2025' },
  { name: 'Credins Bank', region: 'EMEA', customers: 397_989, digital_rate: 0.07, churn: 0.135, source: 'Credins 2025' },
  { name: 'Tangerine', region: 'NAM', customers: 2_000_000, aum: 7.3e9, advisors: 200, fee_rate: 0.0077, source: 'Tangerine 2025' },
  { name: 'Banco Pichincha', region: 'LATAM', digital_rate: 0.49, funded_rate: 1.0, source: 'Backbase Playbook' },
  { name: 'CIH Morocco', region: 'EMEA', products_per: 3.2, source: 'Backbase Playbook' },
];

/**
 * Get the region for a country name
 */
export function getRegionForCountry(country) {
  const REGION_MAP = {
    // Nordics
    Sweden: 'EMEA', Norway: 'EMEA', Denmark: 'EMEA', Finland: 'EMEA', Iceland: 'EMEA',
    // Western Europe
    Netherlands: 'EMEA', Germany: 'EMEA', France: 'EMEA', Belgium: 'EMEA', Luxembourg: 'EMEA',
    Switzerland: 'EMEA', Austria: 'EMEA', Ireland: 'EMEA',
    // UK
    'United Kingdom': 'EMEA', UK: 'EMEA',
    // Southern Europe
    Spain: 'EMEA', Portugal: 'EMEA', Italy: 'EMEA', Greece: 'EMEA',
    // Eastern Europe
    Poland: 'EMEA', Czech: 'EMEA', Romania: 'EMEA', Hungary: 'EMEA', Albania: 'EMEA',
    // Middle East
    UAE: 'EMEA', 'Saudi Arabia': 'EMEA', Kuwait: 'EMEA', Bahrain: 'EMEA', Qatar: 'EMEA',
    // Africa
    Kenya: 'Africa', Uganda: 'Africa', Tanzania: 'Africa', Rwanda: 'Africa',
    Morocco: 'EMEA', 'South Africa': 'Africa',
    // LATAM
    Brazil: 'LATAM', Colombia: 'LATAM', Mexico: 'LATAM', Chile: 'LATAM',
    Ecuador: 'LATAM', Bolivia: 'LATAM', 'Costa Rica': 'LATAM', Peru: 'LATAM',
    // NAM
    USA: 'NAM', Canada: 'NAM', 'United States': 'NAM',
    // APAC
    Australia: 'APAC', 'New Zealand': 'APAC', Philippines: 'APAC',
    'Sri Lanka': 'APAC', India: 'APAC', Singapore: 'APAC', Indonesia: 'APAC',
  };
  return REGION_MAP[country] || 'EMEA';
}

/**
 * Get regional cost benchmarks for a country
 */
export function getRegionalCosts(country) {
  const region = getRegionForCountry(country);
  return REGIONAL_COSTS[region] || REGIONAL_COSTS.EMEA;
}

/**
 * Get a benchmark comparison for a bank's metric vs industry range
 * Returns: { position: 'poor'|'average'|'good'|'best', percentile, label }
 */
export function benchmarkPosition(value, benchmark) {
  if (value == null || !benchmark) return null;
  if (value >= benchmark.best) return { position: 'best', percentile: 90, label: 'Best-in-Class' };
  if (value >= benchmark.good) return { position: 'good', percentile: 70, label: 'Good' };
  if (value >= benchmark.average) return { position: 'average', percentile: 50, label: 'Average' };
  return { position: 'poor', percentile: 25, label: 'Below Average' };
}
