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

// ─── Currency conversion to EUR (approximate, for estimation only) ───
const FX_TO_EUR = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17,
  SEK: 0.087,
  NOK: 0.085,
  DKK: 0.134,
  CHF: 1.05,
};

// ─── Industry benchmarks (European banking, documented sources) ───
export const BENCHMARKS = {
  // Cost structure
  avg_cost_per_fte_eur: 95_000,              // Fully-loaded FTE cost (salary+benefits+infra)
  avg_branch_interaction_cost_eur: 8.50,     // Per-interaction cost: branch/call center
  avg_digital_interaction_cost_eur: 0.50,    // Per-interaction cost: digital self-service
  interaction_delta_eur: 8.00,               // Savings per interaction shifted to digital

  // Revenue proxies
  avg_revenue_per_retail_customer_eur: 380,  // European bank avg annual revenue per retail customer
  avg_revenue_per_product_eur: 130,          // Revenue per product-holding per year
  avg_products_per_customer: 2.3,            // Current product density (European avg)

  // Operating model
  net_interest_margin: 0.015,                // 1.5% NIM for European banks
  tech_spend_pct_revenue: 0.12,             // Tech = ~12% of revenue
  digital_adoption_current: 0.65,            // 65% customers use digital today
  annual_interactions_per_customer: 30,      // Non-digital interactions per year (branch + call center)

  // ─── Addressability — what % of the base is actually impacted by an engagement platform ───
  addressable_fte_pct: 0.15,                 // ~15% of FTEs are front-office/customer-facing roles impacted
  addressable_customer_pct: 0.25,            // ~25% of customer base is "active digital" addressable
  addressable_interaction_pct: 0.20,         // ~20% of non-digital interactions are realistically shiftable

  // ─── Improvement factors [conservative, base, optimistic] ───
  cost_to_serve:       { factors: [0.05, 0.10, 0.18], label: 'Cost-to-Serve Reduction' },
  channel_shift:       { factors: [0.08, 0.15, 0.25], label: 'Digital Channel Shift' },
  onboarding_lift:     { factors: [0.10, 0.20, 0.35], label: 'Onboarding Conversion Lift' },
  cross_sell:          { factors: [0.10, 0.20, 0.35], label: 'Cross-Sell Revenue Uplift' },
  platform_savings:    { factors: [0.05, 0.10, 0.18], label: 'Platform Consolidation' },

  // Source documentation
  sources: {
    cost_per_fte: 'McKinsey Global Banking Annual Review 2024',
    interaction_cost: 'BCG Banking Efficiency Benchmarks 2024',
    revenue_per_customer: 'EBA Risk Dashboard / ECB Banking Statistics',
    tech_spend: 'Celent IT Spending in Banking 2024',
    improvement_factors: 'Backbase Customer Reference Data (anonymized)',
  }
};

// ─── KPI Parsing ─────────────────────────────────────────────────────

/**
 * Parse a KPI value string into a numeric value in EUR
 * Examples: "€570B" → 570e9, "$340B" → 312.8e9, "~28,000" → 28000, "~46%" → 0.46
 */
export function parseKpiValue(str) {
  if (!str || typeof str !== 'string') return null;

  const clean = str.replace(/,/g, '').replace(/~/g, '').replace(/\+/g, '').trim();

  // Detect percentage
  if (clean.endsWith('%')) {
    const num = parseFloat(clean);
    return isNaN(num) ? null : { value: num / 100, isPercent: true, raw: str };
  }

  // Detect currency
  let currency = 'EUR';
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
export function extractMetrics(bankKey) {
  const bd = BANK_DATA[bankKey];
  if (!bd) return null;

  const kpis = bd.kpis || [];
  const metrics = {
    bankName: bd.bank_name,
    country: bd.country,
    totalAssets: null,      // EUR
    employees: null,        // count
    customers: null,        // count
    costIncomeRatio: null,  // decimal
    roe: null,              // decimal
    cet1: null,             // decimal
    techSpend: null,        // EUR
    marketShare: null,      // decimal
    digitalUsers: null,     // count
    _sources: {},           // track which values are from data vs benchmark
  };

  kpis.forEach(kpi => {
    const label = (kpi.label || '').toLowerCase();
    const parsed = parseKpiValue(kpi.value);
    if (!parsed) return;

    if (label.includes('total assets') || label.includes('assets')) {
      metrics.totalAssets = parsed.eurValue || parsed.value;
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

  // Estimate revenue from total assets × NIM (if no revenue KPI)
  if (metrics.totalAssets) {
    metrics.estimatedRevenue = metrics.totalAssets * BENCHMARKS.net_interest_margin * 2.5; // NII + fees multiplier
    metrics._sources.estimatedRevenue = 'calculated (assets × NIM × 2.5 fee multiplier)';
  }

  // Estimate tech spend
  if (metrics.estimatedRevenue) {
    metrics.techSpend = metrics.estimatedRevenue * BENCHMARKS.tech_spend_pct_revenue;
    metrics._sources.techSpend = 'calculated (revenue × 12% tech spend ratio)';
  }

  // Check overview text for explicit tech spend
  const overviewText = (bd.overview || '') + ' ' + (bd.digital_strategy || '');
  const techMatch = overviewText.match(/(?:technology|tech)\s+spend[s]?\s+(?:of\s+)?(?:exceeds?\s+)?([€$][\d.,]+\s*[BMK])/i);
  if (techMatch) {
    const parsed = parseKpiValue(techMatch[1]);
    if (parsed) {
      metrics.techSpend = parsed.eurValue || parsed.value;
      metrics._sources.techSpend = 'bank_data (from overview)';
    }
  }

  // Estimate employee cost base
  if (metrics.employees) {
    metrics.totalEmployeeCost = metrics.employees * BENCHMARKS.avg_cost_per_fte_eur;
    metrics._sources.totalEmployeeCost = 'calculated (FTE × €95K avg)';
  }

  // Estimate customer revenue
  if (metrics.customers) {
    metrics.totalCustomerRevenue = metrics.customers * BENCHMARKS.avg_revenue_per_retail_customer_eur;
    metrics._sources.totalCustomerRevenue = 'calculated (customers × €380 avg revenue)';
  }

  // Non-digital interactions estimate (branch + call center per year)
  if (metrics.customers) {
    metrics.nonDigitalInteractions = metrics.customers * BENCHMARKS.annual_interactions_per_customer;
    metrics.shiftableInteractions = metrics.nonDigitalInteractions * BENCHMARKS.addressable_interaction_pct;
    metrics._sources.nonDigitalInteractions = 'calculated (customers × 30 non-digital interactions/yr)';
  }

  return metrics;
}

// ─── Value Lever Calculations ────────────────────────────────────────

/**
 * Calculate all ROI value levers for a bank
 * Returns { levers: [...], totals: {conservative, base, optimistic}, metrics, assumptions }
 */
export function calculateRoi(bankKey) {
  const metrics = extractMetrics(bankKey);
  if (!metrics) return null;

  const vs = VALUE_SELLING[bankKey];
  const bd = BANK_DATA[bankKey];
  const q = bd?.backbase_qualification;

  const levers = [];
  const assumptions = [];

  // ─── Lever 1: Cost-to-Serve Reduction ───
  // Only ~15% of FTEs are front-office/customer-facing roles addressable by engagement platform
  if (metrics.totalEmployeeCost) {
    const addressableCost = metrics.totalEmployeeCost * BENCHMARKS.addressable_fte_pct;
    const addressableFTEs = Math.round(metrics.employees * BENCHMARKS.addressable_fte_pct);
    const f = BENCHMARKS.cost_to_serve.factors;
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
      metric: `${formatNumber(addressableFTEs)} addressable FTEs (15% of ${formatNumber(metrics.employees)}) × €95K avg cost`,
      source: metrics._sources.employees === 'bank_data' ? 'Annual Report' : 'Estimate',
      methodology: `Addressable FTE cost (${formatNumber(addressableFTEs)} × €95K) × ${f.map(x => Math.round(x*100)+'%').join(' / ')} efficiency`,
    });
    assumptions.push({
      assumption: `15% of FTEs are front-office/customer-facing roles addressable by engagement platform`,
      source: BENCHMARKS.sources.cost_per_fte,
      confidence: 'Medium',
    });
  }

  // ─── Lever 2: Digital Channel Shift ───
  // Only 20% of non-digital interactions are realistically shiftable via engagement platform
  if (metrics.shiftableInteractions) {
    const savingsPerShift = BENCHMARKS.interaction_delta_eur;
    const f = BENCHMARKS.channel_shift.factors;
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
      source: BENCHMARKS.sources.interaction_cost,
      confidence: 'Medium',
    });
  }

  // ─── Lever 3: Onboarding Conversion Improvement ───
  if (metrics.customers) {
    // 3% annual new customer acquisition; only digital channel (60%) is addressable
    const annualNewCustomers = Math.round(metrics.customers * 0.03 * 0.6);
    const f = BENCHMARKS.onboarding_lift.factors;
    // Better onboarding = more customers from same marketing spend
    // Use first-year partial revenue (50% of annual) to be conservative
    const firstYearRevenue = BENCHMARKS.avg_revenue_per_retail_customer_eur * 0.5;

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
  // Only 25% of customers are "active digital" addressable for cross-sell
  if (metrics.customers) {
    const f = BENCHMARKS.cross_sell.factors;
    const revenuePerProduct = BENCHMARKS.avg_revenue_per_product_eur;

    levers.push({
      id: 'cross_sell',
      name: 'Cross-Sell & Engagement Revenue',
      icon: '📈',
      description: 'Increase products-per-customer for active digital users through personalized engagement',
      talkingPoint: `Adding ${f[0]} products per active digital customer (${formatNumber(Math.round(metrics.customers * BENCHMARKS.addressable_customer_pct))} of ${formatNumber(metrics.customers)}) generates €${formatMillions(metrics.customers * BENCHMARKS.addressable_customer_pct * f[0] * revenuePerProduct)}/year`,
      values: [
        Math.round(metrics.customers * BENCHMARKS.addressable_customer_pct * f[0] * revenuePerProduct),
        Math.round(metrics.customers * BENCHMARKS.addressable_customer_pct * f[1] * revenuePerProduct),
        Math.round(metrics.customers * BENCHMARKS.addressable_customer_pct * f[2] * revenuePerProduct),
      ],
      metric: `${formatNumber(Math.round(metrics.customers * BENCHMARKS.addressable_customer_pct))} active digital customers (25% of ${formatNumber(metrics.customers)}) × +${f.join('/')} products`,
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
    const f = BENCHMARKS.platform_savings.factors;
    // Only a portion of tech spend is addressable (engagement layer ~20-30%)
    const addressableTechSpend = metrics.techSpend * 0.25;

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
  const totals = {
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
  // Parse deal size to get midpoint for ROI calc
  let estimatedDealCost = null;
  if (q?.deal_size) {
    const dealParts = q.deal_size.match(/[€$]?([\d.]+)[-–]?[€$]?([\d.]+)?\s*[MBK]/gi);
    if (dealParts) {
      const parsed = dealParts.map(p => parseKpiValue(p.trim()));
      const values = parsed.filter(Boolean).map(p => p.eurValue || p.value);
      if (values.length > 0) {
        estimatedDealCost = values.reduce((a, b) => a + b, 0) / values.length;
      }
    }
  }

  // Simple payback calculation
  let payback = null;
  if (estimatedDealCost && totals.base > 0) {
    payback = {
      conservative: Math.round(estimatedDealCost / totals.conservative * 10) / 10,
      base: Math.round(estimatedDealCost / totals.base * 10) / 10,
      optimistic: Math.round(estimatedDealCost / totals.optimistic * 10) / 10,
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

export function formatNumber(n) {
  if (n == null) return '—';
  return n.toLocaleString('en-US');
}

export function formatMillions(n) {
  if (n == null) return '—';
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toFixed(0);
}

export function formatEur(n) {
  if (n == null) return '—';
  return `€${formatMillions(n)}`;
}

/**
 * Get the "conversation-ready" one-liner for a bank's ROI
 * e.g., "Based on Nordea's 9.3M customers and 28K employees, a conservative estimate
 *         shows €X-YM in annual value from digital engagement."
 */
export function getConversationSummary(roi) {
  if (!roi) return null;
  const m = roi.metrics;
  const t = roi.totals;

  const parts = [];
  if (m.customers) parts.push(`${formatNumber(m.customers)} customers`);
  if (m.employees) parts.push(`${formatNumber(m.employees)} employees`);
  if (m.totalAssets) parts.push(`€${formatMillions(m.totalAssets)} in assets`);

  const metricsStr = parts.length > 0 ? parts.join(', ') : 'available data';

  return `Based on ${m.bankName}'s ${metricsStr}, a digital engagement platform could deliver ${formatEur(t.conservative)}–${formatEur(t.optimistic)} in annual value. The base case projects ${formatEur(t.base)}/year.`;
}
