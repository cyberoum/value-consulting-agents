/**
 * ROI Engine — High-level value metrics calculated from annual report data
 *
 * Philosophy: Conservative, defensible, conversation-ready numbers.
 * Every number traces to either bank KPIs or documented industry benchmarks.
 *
 * Scenarios: Conservative (P25) / Base (P50) / Optimistic (P75)
 */

import { BANK_DATA } from './banks';
import { VALUE_SELLING } from './valueSelling';
import { getRegionalCosts, getRegionForCountry } from './domainBenchmarks';
import { ROI } from './constants';

// ─── Types ──────────────────────────────────────────────────────────

type Currency = 'EUR' | 'USD' | 'GBP' | 'SEK' | 'NOK' | 'DKK' | 'CHF';

export interface ParsedKpiPercent {
  value: number;
  isPercent: true;
  raw: string;
}

export interface ParsedKpiValue {
  value: number;
  eurValue: number;
  currency: Currency;
  multiplier: number;
  isPercent: false;
  raw: string;
}

export type ParsedKpi = ParsedKpiPercent | ParsedKpiValue;

interface ImprovementFactor {
  factors: [number, number, number];
  label: string;
}

export interface Benchmarks {
  avg_cost_per_fte_eur: number;
  avg_branch_interaction_cost_eur: number;
  avg_digital_interaction_cost_eur: number;
  interaction_delta_eur: number;
  avg_revenue_per_retail_customer_eur: number;
  avg_revenue_per_product_eur: number;
  avg_products_per_customer: number;
  net_interest_margin: number;
  tech_spend_pct_revenue: number;
  digital_adoption_current: number;
  annual_interactions_per_customer: number;
  addressable_fte_pct: number;
  addressable_customer_pct: number;
  addressable_interaction_pct: number;
  cost_to_serve: ImprovementFactor;
  channel_shift: ImprovementFactor;
  onboarding_lift: ImprovementFactor;
  cross_sell: ImprovementFactor;
  platform_savings: ImprovementFactor;
  sources: Record<string, string>;
  _region?: string;
  _regionalSource?: string;
}

export interface RoiTotals {
  conservative: number;
  base: number;
  optimistic: number;
}

export interface RoiLever {
  id: string;
  name: string;
  icon: string;
  description: string;
  talkingPoint: string | null;
  values: [number, number, number];
  metric: string;
  source: string;
  methodology: string;
}

export interface RoiResult {
  bankKey: string;
  bankName: string;
  metrics: Record<string, unknown>;
  levers: RoiLever[];
  totals: RoiTotals;
  payback: { conservative: number | null; base: number; optimistic: number | null } | null;
  dealContext: Record<string, string | null>;
  assumptions: Array<{ assumption: string; source: string; confidence: string }>;
  generatedAt: string;
}

// ─── Currency conversion to EUR (approximate, for estimation only) ───
const FX_TO_EUR: Record<Currency, number> = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17,
  SEK: 0.087,
  NOK: 0.085,
  DKK: 0.134,
  CHF: 1.05,
};

// ─── Industry benchmarks (European banking, documented sources) ───
export const BENCHMARKS: Benchmarks = {
  // Cost structure
  avg_cost_per_fte_eur: 95_000,
  avg_branch_interaction_cost_eur: 8.50,
  avg_digital_interaction_cost_eur: 0.50,
  interaction_delta_eur: 8.00,

  // Revenue proxies
  avg_revenue_per_retail_customer_eur: 380,
  avg_revenue_per_product_eur: 130,
  avg_products_per_customer: 2.3,

  // Operating model
  net_interest_margin: 0.015,
  tech_spend_pct_revenue: 0.12,
  digital_adoption_current: 0.65,
  annual_interactions_per_customer: 30,

  // Addressability
  addressable_fte_pct: 0.15,
  addressable_customer_pct: 0.25,
  addressable_interaction_pct: 0.20,

  // Improvement factors [conservative, base, optimistic]
  cost_to_serve:    { factors: [0.05, 0.10, 0.18], label: 'Cost-to-Serve Reduction' },
  channel_shift:    { factors: [0.08, 0.15, 0.25], label: 'Digital Channel Shift' },
  onboarding_lift:  { factors: [0.10, 0.20, 0.35], label: 'Onboarding Conversion Lift' },
  cross_sell:       { factors: [0.10, 0.20, 0.35], label: 'Cross-Sell Revenue Uplift' },
  platform_savings: { factors: [0.05, 0.10, 0.18], label: 'Platform Consolidation' },

  sources: {
    cost_per_fte: 'McKinsey Global Banking Annual Review 2024',
    interaction_cost: 'BCG Banking Efficiency Benchmarks 2024',
    revenue_per_customer: 'EBA Risk Dashboard / ECB Banking Statistics',
    tech_spend: 'Celent IT Spending in Banking 2024',
    improvement_factors: 'Backbase Customer Reference Data (anonymized)',
  }
};

/**
 * Get region-aware benchmarks for a bank's country.
 * Overlays real regional costs from domainBenchmarks onto the default BENCHMARKS.
 */
export function getBenchmarks(country: string): Benchmarks {
  const region = getRegionForCountry(country);
  const rc = getRegionalCosts(country);
  return {
    ...BENCHMARKS,
    avg_cost_per_fte_eur: rc.fte_cost,
    avg_branch_interaction_cost_eur: rc.branch_interaction,
    avg_digital_interaction_cost_eur: rc.digital_interaction,
    interaction_delta_eur: rc.branch_interaction - rc.digital_interaction,
    _region: region,
    _regionalSource: rc.source,
  };
}

// ─── KPI Parsing ─────────────────────────────────────────────────────

/**
 * Parse a KPI value string into a numeric value in EUR
 * Examples: "€570B" → 570e9, "$340B" → 312.8e9, "~28,000" → 28000, "~46%" → 0.46
 */
export function parseKpiValue(str: string | null | undefined): ParsedKpi | null {
  if (!str || typeof str !== 'string') return null;

  const clean = str.replace(/,/g, '').replace(/~/g, '').replace(/\+/g, '').trim();

  // Detect percentage
  if (clean.endsWith('%')) {
    const num = parseFloat(clean);
    return isNaN(num) ? null : { value: num / 100, isPercent: true, raw: str };
  }

  // Detect currency
  let currency: Currency = 'EUR';
  let numStr = clean;
  if (clean.startsWith('€')) { currency = 'EUR'; numStr = clean.slice(1); }
  else if (clean.startsWith('$')) { currency = 'USD'; numStr = clean.slice(1); }
  else if (clean.startsWith('£')) { currency = 'GBP'; numStr = clean.slice(1); }
  else if (clean.startsWith('SEK')) { currency = 'SEK'; numStr = clean.slice(3).trim(); }
  else if (clean.startsWith('NOK')) { currency = 'NOK'; numStr = clean.slice(3).trim(); }
  else if (clean.startsWith('DKK')) { currency = 'DKK'; numStr = clean.slice(3).trim(); }
  else if (clean.startsWith('CHF')) { currency = 'CHF'; numStr = clean.slice(3).trim(); }

  // Detect multiplier suffix
  let multiplier = 1;
  const lastChar = numStr.slice(-1).toUpperCase();
  if (lastChar === 'B') { multiplier = 1e9; numStr = numStr.slice(0, -1); }
  else if (lastChar === 'M') { multiplier = 1e6; numStr = numStr.slice(0, -1); }
  else if (lastChar === 'K') { multiplier = 1e3; numStr = numStr.slice(0, -1); }

  const num = parseFloat(numStr);
  if (isNaN(num)) return null;

  const rawValue = num * multiplier;
  const eurValue = rawValue * (FX_TO_EUR[currency] || 1);

  return { value: rawValue, eurValue, currency, multiplier, isPercent: false, raw: str };
}

/**
 * Extract structured financial metrics from a bank's KPIs array
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractMetrics(bankKey: string, benchmarksOverride?: Benchmarks): any {
  const bd = (BANK_DATA as Record<string, any>)[bankKey];
  if (!bd) return null;
  const B = benchmarksOverride || BENCHMARKS;

  const kpis: Array<{ label?: string; value?: string }> = bd.kpis || [];
  const metrics: Record<string, any> = {
    bankName: bd.bank_name,
    country: bd.country,
    totalAssets: null,
    employees: null,
    customers: null,
    costIncomeRatio: null,
    roe: null,
    cet1: null,
    techSpend: null,
    marketShare: null,
    digitalUsers: null,
    _sources: {},
  };

  kpis.forEach(kpi => {
    const label = (kpi.label || '').toLowerCase();
    const parsed = parseKpiValue(kpi.value);
    if (!parsed) return;

    if (label.includes('total assets') || label.includes('assets')) {
      metrics.totalAssets = !parsed.isPercent ? (parsed.eurValue || parsed.value) : null;
      metrics._sources.totalAssets = 'bank_data';
    }
    else if (label.includes('employees') || label.includes('staff')) {
      metrics.employees = parsed.value;
      metrics._sources.employees = 'bank_data';
    }
    else if (label.includes('customer') && !label.includes('digital')) {
      metrics.customers = parsed.value;
      metrics._sources.customers = 'bank_data';
    }
    else if (label.includes('digital user')) {
      metrics.digitalUsers = parsed.value;
      metrics._sources.digitalUsers = 'bank_data';
    }
    else if (label.includes('cost') && label.includes('income')) {
      metrics.costIncomeRatio = parsed.isPercent ? parsed.value : null;
      metrics._sources.costIncomeRatio = 'bank_data';
    }
    else if (label === 'roe' || label.includes('return on equity')) {
      metrics.roe = parsed.isPercent ? parsed.value : null;
      metrics._sources.roe = 'bank_data';
    }
    else if (label.includes('cet1')) {
      metrics.cet1 = parsed.isPercent ? parsed.value : null;
      metrics._sources.cet1 = 'bank_data';
    }
    else if (label.includes('market share')) {
      metrics.marketShare = parsed.isPercent ? parsed.value : null;
      metrics._sources.marketShare = 'bank_data';
    }
  });

  // ─── Derived / estimated metrics ───
  if (metrics.totalAssets) {
    metrics.estimatedRevenue = metrics.totalAssets * B.net_interest_margin * ROI.REVENUE_FEE_MULTIPLIER;
    metrics._sources.estimatedRevenue = 'calculated (assets × NIM × 2.5 fee multiplier)';
  }

  if (metrics.estimatedRevenue) {
    metrics.techSpend = metrics.estimatedRevenue * B.tech_spend_pct_revenue;
    metrics._sources.techSpend = 'calculated (revenue × 12% tech spend ratio)';
  }

  const overviewText = (bd.overview || '') + ' ' + (bd.digital_strategy || '');
  const techMatch = overviewText.match(/(?:technology|tech)\s+spend[s]?\s+(?:of\s+)?(?:exceeds?\s+)?([€$][\d.,]+\s*[BMK])/i);
  if (techMatch) {
    const parsed = parseKpiValue(techMatch[1]);
    if (parsed && !parsed.isPercent) {
      metrics.techSpend = parsed.eurValue || parsed.value;
      metrics._sources.techSpend = 'bank_data (from overview)';
    }
  }

  if (metrics.employees) {
    metrics.totalEmployeeCost = metrics.employees * B.avg_cost_per_fte_eur;
    metrics._sources.totalEmployeeCost = `calculated (FTE × €${formatNumber(B.avg_cost_per_fte_eur)} avg${B._region ? ' — ' + B._region : ''})`;
  }

  if (metrics.customers) {
    metrics.totalCustomerRevenue = metrics.customers * B.avg_revenue_per_retail_customer_eur;
    metrics._sources.totalCustomerRevenue = 'calculated (customers × €380 avg revenue)';
  }

  if (metrics.customers) {
    metrics.nonDigitalInteractions = metrics.customers * B.annual_interactions_per_customer;
    metrics.shiftableInteractions = metrics.nonDigitalInteractions * B.addressable_interaction_pct;
    metrics._sources.nonDigitalInteractions = 'calculated (customers × 30 non-digital interactions/yr)';
  }

  return metrics;
}

// ─── Value Lever Calculations ────────────────────────────────────────

/**
 * Calculate all ROI value levers for a bank
 */
export function calculateRoi(bankKey: string): RoiResult | null {
  const bd = (BANK_DATA as Record<string, any>)[bankKey];
  if (!bd) return null;
  const B = getBenchmarks(bd.country);
  const metrics = extractMetrics(bankKey, B);
  if (!metrics) return null;

  const vs = (VALUE_SELLING as Record<string, any>)[bankKey];
  const q = bd?.backbase_qualification;

  const levers: RoiLever[] = [];
  const assumptions: Array<{ assumption: string; source: string; confidence: string }> = [];

  if (B._region) {
    assumptions.push({
      assumption: `Using ${B._region} regional cost benchmarks (FTE: €${formatNumber(B.avg_cost_per_fte_eur)}, Branch: €${B.avg_branch_interaction_cost_eur}, Digital: €${B.avg_digital_interaction_cost_eur})`,
      source: B._regionalSource || 'domainBenchmarks.js',
      confidence: 'High',
    });
  }

  // ─── Lever 1: Cost-to-Serve Reduction ───
  if (metrics.totalEmployeeCost) {
    const addressableCost = metrics.totalEmployeeCost * B.addressable_fte_pct;
    const addressableFTEs = Math.round(metrics.employees * B.addressable_fte_pct);
    const f = B.cost_to_serve.factors;
    levers.push({
      id: 'cost_to_serve',
      name: 'Cost-to-Serve Reduction',
      icon: '💰',
      description: 'Reduce front-office operational cost through digital self-service and process automation',
      talkingPoint: metrics.employees
        ? `With ~${formatNumber(addressableFTEs)} front-office FTEs (of ${formatNumber(metrics.employees)} total), a ${Math.round(f[0]*100)}% efficiency gain saves €${formatMillions(addressableCost * f[0])}/year`
        : null,
      values: [
        Math.round(addressableCost * f[0]),
        Math.round(addressableCost * f[1]),
        Math.round(addressableCost * f[2]),
      ],
      metric: `${formatNumber(addressableFTEs)} addressable FTEs (15% of ${formatNumber(metrics.employees)}) × €${formatNumber(B.avg_cost_per_fte_eur)} avg cost`,
      source: metrics._sources.employees === 'bank_data' ? 'Annual Report' : 'Estimate',
      methodology: `Addressable FTE cost (${formatNumber(addressableFTEs)} × €${formatNumber(B.avg_cost_per_fte_eur)}) × ${f.map(x => Math.round(x*100)+'%').join(' / ')} efficiency`,
    });
    assumptions.push({
      assumption: `15% of FTEs are front-office/customer-facing roles addressable by engagement platform`,
      source: B._regionalSource || BENCHMARKS.sources.cost_per_fte,
      confidence: 'Medium',
    });
  }

  // ─── Lever 2: Digital Channel Shift ───
  if (metrics.shiftableInteractions) {
    const savingsPerShift = B.interaction_delta_eur;
    const f = B.channel_shift.factors;
    const shiftable = metrics.shiftableInteractions;

    levers.push({
      id: 'channel_shift',
      name: 'Digital Channel Migration',
      icon: '📱',
      description: 'Shift addressable branch/call center interactions to digital self-service',
      talkingPoint: metrics.customers
        ? `Shifting ${Math.round(f[0]*100)}% of ${formatMillions(shiftable)} addressable interactions to digital saves €${formatMillions(shiftable * f[0] * savingsPerShift)}/year`
        : null,
      values: [
        Math.round(shiftable * f[0] * savingsPerShift),
        Math.round(shiftable * f[1] * savingsPerShift),
        Math.round(shiftable * f[2] * savingsPerShift),
      ],
      metric: `${formatMillions(shiftable)} shiftable interactions (20% of ${formatMillions(metrics.nonDigitalInteractions)}) × €${savingsPerShift}`,
      source: metrics._sources.customers === 'bank_data' ? 'Annual Report' : 'Estimate',
      methodology: `Shiftable interactions × ${f.map(x => Math.round(x*100)+'%').join(' / ')} shift rate × €${savingsPerShift} cost delta`,
    });
    assumptions.push({
      assumption: `20% of non-digital interactions are shiftable; cost delta: €${savingsPerShift} per interaction`,
      source: B._regionalSource || BENCHMARKS.sources.interaction_cost,
      confidence: 'Medium',
    });
  }

  // ─── Lever 3: Onboarding Conversion Improvement ───
  if (metrics.customers) {
    const annualNewCustomers = Math.round(metrics.customers * ROI.ACQUISITION_RATE * ROI.DIGITAL_CHANNEL_SHARE);
    const f = B.onboarding_lift.factors;
    const firstYearRevenue = B.avg_revenue_per_retail_customer_eur * ROI.FIRST_YEAR_REVENUE_FACTOR;

    levers.push({
      id: 'onboarding',
      name: 'Onboarding & Acquisition',
      icon: '🚀',
      description: 'Improve digital onboarding conversion rates and reduce application drop-off',
      talkingPoint: `A ${Math.round(f[0]*100)}% lift in digital onboarding conversion across ${formatNumber(annualNewCustomers)} digital acquisitions adds €${formatMillions(annualNewCustomers * f[0] * firstYearRevenue)}/year`,
      values: [
        Math.round(annualNewCustomers * f[0] * firstYearRevenue),
        Math.round(annualNewCustomers * f[1] * firstYearRevenue),
        Math.round(annualNewCustomers * f[2] * firstYearRevenue),
      ],
      metric: `${formatNumber(annualNewCustomers)} digital acquisitions/yr × €${firstYearRevenue.toFixed(0)} first-year revenue`,
      source: 'Calculated (3% acquisition rate × 60% digital channel)',
      methodology: `Digital new customers × conversion lift × €${firstYearRevenue.toFixed(0)} first-year revenue`,
    });
    assumptions.push({
      assumption: `Annual digital acquisition: 3% of base × 60% digital channel`,
      source: 'European banking industry average (ECB/EBA)',
      confidence: 'Medium',
    });
  }

  // ─── Lever 4: Cross-Sell Revenue Uplift ───
  if (metrics.customers) {
    const f = B.cross_sell.factors;
    const revenuePerProduct = B.avg_revenue_per_product_eur;

    levers.push({
      id: 'cross_sell',
      name: 'Cross-Sell & Engagement Revenue',
      icon: '📈',
      description: 'Increase products-per-customer for active digital users through personalized engagement',
      talkingPoint: `Adding ${f[0]} products per active digital customer (${formatNumber(Math.round(metrics.customers * B.addressable_customer_pct))} of ${formatNumber(metrics.customers)}) generates €${formatMillions(metrics.customers * B.addressable_customer_pct * f[0] * revenuePerProduct)}/year`,
      values: [
        Math.round(metrics.customers * B.addressable_customer_pct * f[0] * revenuePerProduct),
        Math.round(metrics.customers * B.addressable_customer_pct * f[1] * revenuePerProduct),
        Math.round(metrics.customers * B.addressable_customer_pct * f[2] * revenuePerProduct),
      ],
      metric: `${formatNumber(Math.round(metrics.customers * B.addressable_customer_pct))} active digital customers (25% of ${formatNumber(metrics.customers)}) × +${f.join('/')} products`,
      source: metrics._sources.customers === 'bank_data' ? 'Annual Report' : 'Estimate',
      methodology: `Addressable customers × additional products × €${revenuePerProduct} revenue per product`,
    });
    assumptions.push({
      assumption: `Revenue per additional product holding: €${revenuePerProduct}/year`,
      source: BENCHMARKS.sources.revenue_per_customer,
      confidence: 'Medium',
    });
  }

  // ─── Lever 5: Platform Consolidation ───
  if (metrics.techSpend) {
    const f = B.platform_savings.factors;
    const addressableTechSpend = metrics.techSpend * ROI.ADDRESSABLE_TECH_SPEND_PCT;

    levers.push({
      id: 'platform',
      name: 'Platform Consolidation',
      icon: '🔧',
      description: 'Reduce multi-system maintenance costs by consolidating to a unified engagement platform',
      talkingPoint: `Consolidating engagement platforms from an addressable €${formatMillions(addressableTechSpend)} tech spend saves €${formatMillions(addressableTechSpend * f[0])}/year`,
      values: [
        Math.round(addressableTechSpend * f[0]),
        Math.round(addressableTechSpend * f[1]),
        Math.round(addressableTechSpend * f[2]),
      ],
      metric: `€${formatMillions(metrics.techSpend)} total tech spend × 25% addressable × savings rate`,
      source: metrics._sources.techSpend?.includes('bank_data') ? 'Annual Report' : 'Estimated (12% of revenue)',
      methodology: `Addressable tech spend × ${f.map(x => Math.round(x*100)+'%').join(' / ')} consolidation savings`,
    });
    assumptions.push({
      assumption: `25% of total tech spend is addressable by engagement platform`,
      source: BENCHMARKS.sources.tech_spend,
      confidence: 'Low-Medium',
    });
  }

  // ─── Totals ───
  for (const lever of levers) {
    lever.values = lever.values.map(v => {
      if (!Number.isFinite(v) || v < 0) return 0;
      return v;
    }) as [number, number, number];
    if (lever.values[0] > lever.values[1]) lever.values[0] = lever.values[1];
    if (lever.values[1] > lever.values[2]) lever.values[2] = lever.values[1];
  }

  const totals: RoiTotals = {
    conservative: levers.reduce((sum, l) => sum + l.values[0], 0),
    base: levers.reduce((sum, l) => sum + l.values[1], 0),
    optimistic: levers.reduce((sum, l) => sum + l.values[2], 0),
  };

  // ─── Deal context ───
  const dealContext = {
    dealSize: q?.deal_size || null,
    salesCycle: q?.sales_cycle || null,
    timing: q?.timing || null,
    valueHypothesis: vs?.value_hypothesis?.one_liner || null,
    resultingIn: vs?.value_hypothesis?.resulting_in || null,
  };

  // ─── ROI ratio (value / estimated deal cost) ───
  let estimatedDealCost: number | null = null;
  if (q?.deal_size) {
    const dealParts = q.deal_size.match(/[€$]?([\d.]+)[-–]?[€$]?([\d.]+)?\s*[MBK]/gi);
    if (dealParts) {
      const parsed = dealParts.map((p: string) => parseKpiValue(p.trim()));
      const values = parsed.filter(Boolean).map((p: ParsedKpi) => !p.isPercent ? (p.eurValue || p.value) : 0);
      if (values.length > 0) {
        estimatedDealCost = values.reduce((a: number, b: number) => a + b, 0) / values.length;
      }
    }
  }

  let payback: { conservative: number | null; base: number; optimistic: number | null } | null = null;
  if (estimatedDealCost && estimatedDealCost > 0 && totals.base > 0) {
    payback = {
      conservative: totals.conservative > 0 ? Math.round(estimatedDealCost / totals.conservative * 10) / 10 : null,
      base: Math.round(estimatedDealCost / totals.base * 10) / 10,
      optimistic: totals.optimistic > 0 ? Math.round(estimatedDealCost / totals.optimistic * 10) / 10 : null,
    };
  }

  return {
    bankKey,
    bankName: metrics.bankName,
    metrics,
    levers,
    totals,
    payback,
    dealContext,
    assumptions,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Formatting Helpers ──────────────────────────────────────────────

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US');
}

export function formatMillions(n: number | null | undefined): string {
  if (n == null) return '—';
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toFixed(0);
}

export function formatEur(n: number | null | undefined): string {
  if (n == null) return '—';
  return `€${formatMillions(n)}`;
}

/**
 * Get the "conversation-ready" one-liner for a bank's ROI
 */
export function getConversationSummary(roi: RoiResult | null): string | null {
  if (!roi) return null;
  const m = roi.metrics as Record<string, any>;
  const t = roi.totals;

  const parts: string[] = [];
  if (m.customers) parts.push(`${formatNumber(m.customers)} customers`);
  if (m.employees) parts.push(`${formatNumber(m.employees)} employees`);
  if (m.totalAssets) parts.push(`€${formatMillions(m.totalAssets)} in assets`);

  const metricsStr = parts.length > 0 ? parts.join(', ') : 'available data';

  return `Based on ${m.bankName}'s ${metricsStr}, a digital engagement platform could deliver ${formatEur(t.conservative)}–${formatEur(t.optimistic)} in annual value. The base case projects ${formatEur(t.base)}/year.`;
}
