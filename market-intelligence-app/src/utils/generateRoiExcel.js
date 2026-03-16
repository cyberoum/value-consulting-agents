/**
 * ROI Excel Export — Generates a multi-sheet Excel workbook from ROI data
 * Uses SheetJS (xlsx) for browser-side Excel generation.
 *
 * Accepts pre-computed data instead of importing static stores.
 */
import * as XLSX from 'xlsx';
import { getRegionForCountry, getRegionalCosts, BACKBASE_IMPACT, REFERENCE_BANKS } from '../data/domainBenchmarks';

function formatEur(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function formatNumber(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}

function autoWidth(data) {
  if (!data || !data.length) return [];
  return data[0].map((_, colIdx) => {
    const maxLen = data.reduce((max, row) => {
      const val = row[colIdx];
      const len = val != null ? String(val).length : 0;
      return Math.max(max, len);
    }, 10);
    return { wch: Math.min(maxLen + 2, 50) };
  });
}

/**
 * Generate ROI Excel workbook.
 * @param {object} params
 * @param {object} params.roi - Pre-computed ROI result (from calculateRoi or /api/banks/:key/roi)
 * @param {object} params.bankData - Bank data object (BANK_DATA shape)
 * @param {string} [params.bankKey] - Bank key (for filename)
 */
export function generateRoiExcel({ roi, bankData, bankKey }) {
  if (!roi) return null;

  const bd = bankData || {};
  const region = getRegionForCountry(bd.country);
  const rc = getRegionalCosts(bd.country);
  const wb = XLSX.utils.book_new();
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // ─── Sheet 1: Executive Summary ───
  const summaryData = [
    ['ROI ESTIMATE — ' + roi.bankName],
    ['Generated', today],
    ['Region', region],
    ['Data Confidence', roi.metrics?._sources?.customers === 'bank_data' ? 'Annual Report Data' : 'Estimated'],
    [],
    ['', 'Conservative (P25)', 'Base (P50)', 'Optimistic (P75)'],
    ['Annual Value', formatEur(roi.totals.conservative), formatEur(roi.totals.base), formatEur(roi.totals.optimistic)],
  ];
  if (roi.payback) {
    summaryData.push(['Payback (years)', `~${roi.payback.conservative} yr`, `~${roi.payback.base} yr`, `~${roi.payback.optimistic} yr`]);
  }
  summaryData.push(
    [],
    ['Value Hypothesis'],
    [roi.dealContext?.valueHypothesis || 'N/A'],
    [],
    ['Deal Context'],
    ['Deal Size', roi.dealContext?.dealSize || 'N/A'],
    ['Sales Cycle', roi.dealContext?.salesCycle || 'N/A'],
    ['Timing', roi.dealContext?.timing || 'N/A'],
    [],
    ['DISCLAIMER: These are high-level estimates for pre-meeting preparation.'],
    ['Numbers should be validated through proper discovery.'],
  );
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Executive Summary');

  // ─── Sheet 2: Value Levers ───
  const leverRows = [
    ['Value Lever', 'Description', 'Conservative', 'Base', 'Optimistic', 'Methodology', 'Source'],
  ];
  (roi.levers || []).forEach(l => {
    leverRows.push([
      l.name,
      l.description,
      l.values[0],
      l.values[1],
      l.values[2],
      l.methodology,
      l.source,
    ]);
  });
  leverRows.push([]);
  leverRows.push([
    'TOTAL',
    '',
    roi.totals.conservative,
    roi.totals.base,
    roi.totals.optimistic,
    '',
    '',
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet(leverRows);
  ws2['!cols'] = autoWidth(leverRows);
  for (let r = 1; r <= (roi.levers || []).length + 1; r++) {
    ['C', 'D', 'E'].forEach(col => {
      const cell = ws2[`${col}${r + 1}`];
      if (cell && typeof cell.v === 'number') {
        cell.z = '€#,##0';
      }
    });
  }
  XLSX.utils.book_append_sheet(wb, ws2, 'Value Levers');

  // ─── Sheet 3: Assumptions ───
  const assumptionRows = [
    ['Assumption', 'Source', 'Confidence'],
    ...(roi.assumptions || []).map(a => [a.assumption, a.source, a.confidence]),
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(assumptionRows);
  ws3['!cols'] = autoWidth(assumptionRows);
  XLSX.utils.book_append_sheet(wb, ws3, 'Assumptions');

  // ─── Sheet 4: Bank Metrics ───
  const m = roi.metrics || {};
  const metricRows = [
    ['Metric', 'Value', 'Source'],
    ['Bank Name', m.bankName, 'bank_data'],
    ['Country', m.country, 'bank_data'],
    ['Total Assets', m.totalAssets ? formatEur(m.totalAssets) : 'N/A', m._sources?.totalAssets || 'N/A'],
    ['Employees', m.employees ? formatNumber(m.employees) : 'N/A', m._sources?.employees || 'N/A'],
    ['Customers', m.customers ? formatNumber(m.customers) : 'N/A', m._sources?.customers || 'N/A'],
    ['Cost/Income Ratio', m.costIncomeRatio ? `${Math.round(m.costIncomeRatio * 100)}%` : 'N/A', m._sources?.costIncomeRatio || 'N/A'],
    ['ROE', m.roe ? `${Math.round(m.roe * 100)}%` : 'N/A', m._sources?.roe || 'N/A'],
    ['Estimated Revenue', m.estimatedRevenue ? formatEur(m.estimatedRevenue) : 'N/A', m._sources?.estimatedRevenue || 'N/A'],
    ['Tech Spend', m.techSpend ? formatEur(m.techSpend) : 'N/A', m._sources?.techSpend || 'N/A'],
    ['Employee Cost Base', m.totalEmployeeCost ? formatEur(m.totalEmployeeCost) : 'N/A', m._sources?.totalEmployeeCost || 'N/A'],
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(metricRows);
  ws4['!cols'] = [{ wch: 22 }, { wch: 25 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, ws4, 'Bank Metrics');

  // ─── Sheet 5: Benchmark Context ───
  const benchRows = [
    ['REGIONAL COST BENCHMARKS — ' + region],
    [],
    ['Parameter', 'Value', 'Source'],
    ['Branch Interaction Cost', `€${rc.branch_interaction}`, rc.source],
    ['Digital Interaction Cost', `€${rc.digital_interaction}`, rc.source],
    ['Call Center Cost', `€${rc.call_center_interaction || 'N/A'}`, rc.source],
    ['FTE Cost (Annual)', `€${formatNumber(rc.fte_cost)}`, rc.source],
    ['Savings per Digital Shift', `€${(rc.branch_interaction - rc.digital_interaction).toFixed(2)}`, 'Calculated'],
    [],
    ['BACKBASE IMPACT BENCHMARKS (Validated)'],
    [],
    ['Area', 'Conservative', 'Moderate', 'Aggressive', 'Source'],
    ['Onboarding Revenue Uplift', `${BACKBASE_IMPACT.onboarding.revenue_uplift.conservative * 100}%`, `${BACKBASE_IMPACT.onboarding.revenue_uplift.moderate * 100}%`, `${BACKBASE_IMPACT.onboarding.revenue_uplift.aggressive * 100}%`, BACKBASE_IMPACT.onboarding.source],
    ['Onboarding Cost Avoidance', `${BACKBASE_IMPACT.onboarding.cost_avoidance.conservative * 100}%`, `${BACKBASE_IMPACT.onboarding.cost_avoidance.moderate * 100}%`, `${BACKBASE_IMPACT.onboarding.cost_avoidance.aggressive * 100}%`, BACKBASE_IMPACT.onboarding.source],
    ['Servicing Revenue Uplift', `${BACKBASE_IMPACT.servicing.revenue_uplift.conservative * 100}%`, `${BACKBASE_IMPACT.servicing.revenue_uplift.moderate * 100}%`, `${BACKBASE_IMPACT.servicing.revenue_uplift.aggressive * 100}%`, BACKBASE_IMPACT.servicing.source],
    ['Servicing Cost Avoidance', `${BACKBASE_IMPACT.servicing.cost_avoidance.conservative * 100}%`, `${BACKBASE_IMPACT.servicing.cost_avoidance.moderate * 100}%`, `${BACKBASE_IMPACT.servicing.cost_avoidance.aggressive * 100}%`, BACKBASE_IMPACT.servicing.source],
    [],
    ['REFERENCE BANKS — ' + region],
    [],
    ['Bank', 'Key Metric', 'Source'],
    ...REFERENCE_BANKS.filter(rb => rb.region === region).map(rb => [
      rb.name,
      rb.digital_rate ? `Digital: ${Math.round(rb.digital_rate * 100)}%` : rb.products_per ? `Products/Cust: ${rb.products_per}` : 'N/A',
      rb.source,
    ]),
  ];
  const ws5 = XLSX.utils.aoa_to_sheet(benchRows);
  ws5['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws5, 'Benchmark Context');

  // ─── Download ───
  const bankName = roi.bankName || bd.bank_name || bankKey || 'Bank';
  const fileName = `${bankName.replace(/[^a-zA-Z0-9]/g, '_')}_ROI_Model_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}
