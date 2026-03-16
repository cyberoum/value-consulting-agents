/**
 * HTML Assessment Dashboard Export
 * Generates a self-contained HTML file with the bank's complete intelligence profile.
 * Uses Backbase design tokens (#3366FF primary, #091C35 dark, Libre Franklin font).
 *
 * Accepts pre-computed data instead of importing static stores.
 */
import { QUAL_FRAMEWORK } from '../data/scoring';
import { getRegionForCountry, getRegionalCosts } from '../data/domainBenchmarks';

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatM(n) {
  if (n == null) return '\u2014';
  if (Math.abs(n) >= 1e9) return `\u20AC${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `\u20AC${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `\u20AC${(n / 1e3).toFixed(0)}K`;
  return `\u20AC${n.toFixed(0)}`;
}

function formatNumber(n) {
  if (n == null) return '\u2014';
  return new Intl.NumberFormat('en-US').format(n);
}

/**
 * Generate assessment HTML dashboard.
 * @param {object} params
 * @param {string} params.bankKey - Bank key
 * @param {object} params.bankData - Bank data object
 * @param {object} [params.qualData] - Qualification scoring data
 * @param {object} [params.cxData] - CX data
 * @param {object} [params.compData] - Competition data
 * @param {object} [params.valueSelling] - Value selling data
 * @param {number} [params.score] - Computed qualification score
 * @param {object} [params.roi] - Pre-computed ROI result
 * @param {Array}  [params.actions] - Next best actions array
 */
export function generateAssessmentHtml({ bankKey, bankData, qualData, cxData, compData, valueSelling, score, roi, actions }) {
  const bd = bankData;
  if (!bd) return null;

  const qd = qualData;
  const cx = cxData;
  const comp = compData;
  const vs = valueSelling;
  const region = getRegionForCountry(bd.country);
  const rc = getRegionalCosts(bd.country);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Build qualification rows
  const qualRows = qd ? Object.entries(QUAL_FRAMEWORK.dimensions).map(([dim, config]) => {
    const d = qd[dim];
    if (!d) return '';
    const pct = d.score * 10;
    const color = d.score >= 8 ? '#00B386' : d.score >= 6 ? '#3366FF' : d.score >= 4 ? '#F59E0B' : '#EF4444';
    return `<tr>
      <td style="font-weight:600">${esc(config.label)}</td>
      <td style="text-align:center;color:${color};font-weight:700">${d.score}/10</td>
      <td style="text-align:center;color:#666">${Math.round(config.weight * 100)}%</td>
      <td><div style="background:#f0f0f0;border-radius:4px;height:8px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${color};border-radius:4px"></div></div></td>
      <td style="font-size:12px;color:#666">${esc(d.note)}</td>
    </tr>`;
  }).join('') : '';

  // Build KDM rows
  const kdmRows = (bd.key_decision_makers || []).slice(0, 10).map(k =>
    `<tr><td style="font-weight:600">${esc(k.name)}</td><td>${esc(k.role)}</td><td style="font-size:12px;color:#666">${esc((k.note || '').substring(0, 120))}</td></tr>`
  ).join('');

  // Build lever rows
  const leverRows = roi ? (roi.levers || []).map(l =>
    `<tr><td>${l.icon} ${esc(l.name)}</td><td style="text-align:right">${formatM(l.values[0])}</td><td style="text-align:right;font-weight:700;color:#3366FF">${formatM(l.values[1])}</td><td style="text-align:right">${formatM(l.values[2])}</td></tr>`
  ).join('') : '';

  // Landing zones
  const lzRows = (bd.landing_zones || bd.backbase_landing_zones || []).map(lz =>
    `<tr><td style="font-weight:600">${esc(lz.zone)}</td><td style="text-align:center;color:#3366FF;font-weight:700">${lz.fit}/10</td><td style="font-size:12px">${esc((lz.entry || lz.entry_strategy || '').substring(0, 150))}</td></tr>`
  ).join('');

  // Actions
  const actionCards = (actions || []).slice(0, 5).map(a =>
    `<div style="padding:12px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
        <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${a.urgency === 'HIGH' ? '#FEE2E2' : '#FEF3C7'};color:${a.urgency === 'HIGH' ? '#DC2626' : '#D97706'};font-weight:700">${a.urgency}</span>
        <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:#EBF0FF;color:#3366FF;font-weight:600">${a.type}</span>
      </div>
      <div style="font-weight:600;font-size:14px;margin-bottom:4px">${esc(a.title)}</div>
      <div style="font-size:12px;color:#666">${esc(a.detail)}</div>
    </div>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(bd.bank_name)} \u2014 Intelligence Dashboard</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;600;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Libre Franklin',sans-serif; background:#F8FAFC; color:#1a1a2e; line-height:1.5; }
  .container { max-width:1100px; margin:0 auto; padding:32px 24px; }
  .header { background:#091C35; color:white; padding:40px 0; margin-bottom:32px; }
  .header .container { display:flex; align-items:center; gap:24px; }
  .score-circle { width:80px; height:80px; border-radius:50%; border:4px solid #3366FF; display:flex; align-items:center; justify-content:center; flex-direction:column; flex-shrink:0; }
  .score-circle .num { font-size:28px; font-weight:900; color:#3366FF; line-height:1; }
  .score-circle .lbl { font-size:9px; color:#8899aa; text-transform:uppercase; }
  h1 { font-size:32px; font-weight:900; }
  h2 { font-size:20px; font-weight:700; color:#091C35; margin:32px 0 16px; padding-bottom:8px; border-bottom:2px solid #3366FF; }
  h3 { font-size:16px; font-weight:700; color:#091C35; margin:24px 0 12px; }
  .tagline { color:#8899aa; font-size:14px; margin-top:4px; }
  .meta { display:flex; gap:16px; margin-top:8px; font-size:12px; color:#8899aa; }
  .kpi-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:12px; margin:16px 0; }
  .kpi-card { background:white; border:1px solid #e2e8f0; border-radius:8px; padding:16px; }
  .kpi-card .label { font-size:10px; text-transform:uppercase; color:#666; letter-spacing:0.5px; }
  .kpi-card .value { font-size:22px; font-weight:900; color:#091C35; margin-top:4px; }
  .kpi-card .sub { font-size:11px; color:#888; margin-top:2px; }
  .scenario-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; margin:16px 0; }
  .scenario-card { background:white; border:1px solid #e2e8f0; border-radius:12px; padding:20px; text-align:center; }
  .scenario-card.highlight { border-color:#3366FF; box-shadow:0 0 0 2px rgba(51,102,255,0.15); }
  .scenario-card .label { font-size:11px; text-transform:uppercase; color:#666; }
  .scenario-card .value { font-size:28px; font-weight:900; color:#091C35; margin:8px 0; }
  .scenario-card.highlight .value { color:#3366FF; }
  .scenario-card .payback { font-size:12px; color:#888; }
  table { width:100%; border-collapse:collapse; margin:12px 0; }
  th { background:#091C35; color:white; padding:10px 12px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; }
  td { padding:10px 12px; border-bottom:1px solid #e2e8f0; font-size:13px; }
  tr:hover { background:#f8f9fb; }
  .hypothesis { background:#091C35; color:white; padding:24px; border-radius:12px; margin:16px 0; }
  .hypothesis .label { font-size:11px; text-transform:uppercase; color:#8899aa; margin-bottom:8px; }
  .hypothesis .text { font-size:16px; font-style:italic; color:#e0e0e0; }
  .cx-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:12px 0; }
  .cx-card { background:white; border:1px solid #e2e8f0; border-radius:8px; padding:16px; }
  .cx-card .title { font-weight:700; font-size:13px; margin-bottom:8px; }
  .cx-card ul { padding-left:16px; font-size:12px; color:#555; }
  .cx-card li { margin-bottom:4px; }
  .footer { text-align:center; margin-top:48px; padding:24px; border-top:1px solid #e2e8f0; font-size:11px; color:#999; }
  .print-btn { position:fixed; bottom:20px; right:20px; background:#3366FF; color:white; border:none; padding:12px 24px; border-radius:8px; font-weight:700; cursor:pointer; font-size:14px; box-shadow:0 4px 12px rgba(51,102,255,0.3); }
  .print-btn:hover { background:#2255DD; }
  @media print {
    .print-btn { display:none; }
    .header { background:#091C35 !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body { font-size:11px; }
    .container { padding:16px; }
    @page { margin:1.5cm; size:A4; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="container">
    <div class="score-circle">
      <div class="num">${score || 0}</div>
      <div class="lbl">Fit Score</div>
    </div>
    <div>
      <h1>${esc(bd.bank_name)}</h1>
      <div class="tagline">${esc(bd.tagline)}</div>
      <div class="meta">
        <span>${esc(bd.country)}</span>
        <span>${region} Region</span>
        <span>Generated: ${today}</span>
        <span>Backbase Market Intelligence</span>
      </div>
    </div>
  </div>
</div>

<div class="container">

  <!-- KPIs -->
  <div class="kpi-grid">
    ${(bd.kpis || []).map(k => `<div class="kpi-card"><div class="label">${esc(k.label)}</div><div class="value">${esc(k.value)}</div><div class="sub">${esc(k.sub || '')}</div></div>`).join('')}
  </div>

  ${vs?.value_hypothesis?.one_liner ? `
  <div class="hypothesis">
    <div class="label">Value Hypothesis</div>
    <div class="text">"${esc(vs.value_hypothesis.one_liner)}"</div>
  </div>` : ''}

  <!-- ROI Estimate -->
  ${roi ? `
  <h2>ROI Estimate</h2>
  <div class="scenario-grid">
    <div class="scenario-card">
      <div class="label">Conservative (P25)</div>
      <div class="value">${formatM(roi.totals.conservative)}</div>
      <div class="payback">${roi.payback ? `~${roi.payback.conservative} yr payback` : 'Annual value'}</div>
    </div>
    <div class="scenario-card highlight">
      <div class="label">Base Case (P50)</div>
      <div class="value">${formatM(roi.totals.base)}</div>
      <div class="payback">${roi.payback ? `~${roi.payback.base} yr payback` : 'Annual value'}</div>
    </div>
    <div class="scenario-card">
      <div class="label">Optimistic (P75)</div>
      <div class="value">${formatM(roi.totals.optimistic)}</div>
      <div class="payback">${roi.payback ? `~${roi.payback.optimistic} yr payback` : 'Annual value'}</div>
    </div>
  </div>

  <h3>Value Levers</h3>
  <table>
    <tr><th>Lever</th><th style="text-align:right">Conservative</th><th style="text-align:right">Base</th><th style="text-align:right">Optimistic</th></tr>
    ${leverRows}
    <tr style="font-weight:700;border-top:2px solid #091C35"><td>Total Annual Value</td><td style="text-align:right">${formatM(roi.totals.conservative)}</td><td style="text-align:right;color:#3366FF">${formatM(roi.totals.base)}</td><td style="text-align:right">${formatM(roi.totals.optimistic)}</td></tr>
  </table>` : ''}

  <!-- Qualification Scorecard -->
  ${qualRows ? `
  <h2>Qualification Scorecard</h2>
  <table>
    <tr><th>Dimension</th><th style="text-align:center">Score</th><th style="text-align:center">Weight</th><th style="width:120px">Bar</th><th>Notes</th></tr>
    ${qualRows}
  </table>` : ''}

  <!-- Key Decision Makers -->
  ${kdmRows ? `
  <h2>Key Decision Makers</h2>
  <table>
    <tr><th>Name</th><th>Role</th><th>Notes</th></tr>
    ${kdmRows}
  </table>` : ''}

  <!-- Landing Zones -->
  ${lzRows ? `
  <h2>Landing Zones</h2>
  <table>
    <tr><th>Zone</th><th style="text-align:center">Fit</th><th>Entry Strategy</th></tr>
    ${lzRows}
  </table>` : ''}

  <!-- CX Snapshot -->
  ${cx ? `
  <h2>CX Snapshot</h2>
  <div class="cx-grid">
    <div class="cx-card">
      <div class="title">App Ratings</div>
      <p style="font-size:13px">iOS: ${cx.app_ratings?.ios || 'N/A'} | Android: ${cx.app_ratings?.android || 'N/A'}</p>
      ${cx.cx_strengths?.length ? `<div class="title" style="margin-top:12px">Strengths</div><ul>${cx.cx_strengths.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
    </div>
    <div class="cx-card">
      ${cx.cx_weaknesses?.length ? `<div class="title">Weaknesses</div><ul>${cx.cx_weaknesses.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
      ${cx.digital_maturity ? `<div class="title" style="margin-top:12px">Digital Maturity</div><p style="font-size:12px;color:#555">${esc(cx.digital_maturity)}</p>` : ''}
    </div>
  </div>` : ''}

  <!-- Competitive Landscape -->
  ${comp ? `
  <h2>Competitive Landscape</h2>
  <div class="kpi-grid">
    ${comp.core_banking ? `<div class="kpi-card"><div class="label">Core Banking</div><div class="value" style="font-size:16px">${esc(comp.core_banking)}</div></div>` : ''}
    ${comp.digital_platform ? `<div class="kpi-card"><div class="label">Digital Platform</div><div class="value" style="font-size:16px">${esc(comp.digital_platform)}</div></div>` : ''}
    ${comp.key_vendors?.length ? `<div class="kpi-card"><div class="label">Key Vendors</div><div class="value" style="font-size:13px">${comp.key_vendors.join(', ')}</div></div>` : ''}
    ${comp.vendor_risk ? `<div class="kpi-card"><div class="label">Vendor Risk</div><div class="value" style="font-size:13px">${esc(comp.vendor_risk)}</div></div>` : ''}
  </div>` : ''}

  <!-- Next Best Actions -->
  ${actionCards ? `
  <h2>Next Best Actions</h2>
  ${actionCards}` : ''}

  <!-- Benchmark Context -->
  <h2>Regional Benchmarks \u2014 ${region}</h2>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="label">Branch Cost</div><div class="value">$${rc.branch_interaction}</div><div class="sub">${esc(rc.source)}</div></div>
    <div class="kpi-card"><div class="label">Digital Cost</div><div class="value">$${rc.digital_interaction}</div><div class="sub">${esc(rc.source)}</div></div>
    <div class="kpi-card"><div class="label">FTE Cost</div><div class="value">$${formatNumber(rc.fte_cost)}</div><div class="sub">Annual loaded cost</div></div>
    <div class="kpi-card"><div class="label">Savings/Shift</div><div class="value">$${(rc.branch_interaction - rc.digital_interaction).toFixed(2)}</div><div class="sub">Per digital shift</div></div>
  </div>

  <div class="footer">
    <p>Backbase Market Intelligence \u2022 Confidential</p>
    <p>Generated ${today} \u2022 ${esc(bd.bank_name)} Intelligence Dashboard</p>
    <p style="margin-top:8px;font-size:10px">Disclaimer: High-level estimates for pre-meeting preparation. Numbers should be validated through discovery.</p>
  </div>
</div>

<button class="print-btn" onclick="window.print()">Print / Save as PDF</button>

</body>
</html>`;

  // Trigger download
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${bd.bank_name.replace(/[^a-zA-Z0-9]/g, '_')}_Intelligence_Dashboard_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return a.download;
}
