import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, FileText, Download, Printer } from 'lucide-react';
import { BANK_DATA, QUAL_DATA, QUAL_FRAMEWORK, CX_DATA, COMP_DATA, VALUE_SELLING, calcScore, scoreLabel, dataConfidence } from '../../data/utils';
import { calculateRoi, formatEur } from '../../data/roiEngine';

export default function BriefingModal({ bankKey, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  const bd = BANK_DATA[bankKey];
  const qd = QUAL_DATA[bankKey];
  const cx = CX_DATA[bankKey];
  const comp = COMP_DATA[bankKey];
  const vs = VALUE_SELLING[bankKey];
  const score = calcScore(bankKey);
  const conf = dataConfidence(bankKey);
  const dims = QUAL_FRAMEWORK.dimensions;

  const briefing = generateBriefing({ bd, qd, cx, comp, vs, score, conf, dims, bankKey });

  const handleCopy = () => {
    navigator.clipboard.writeText(briefing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([briefing], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bd?.bank_name || bankKey}_Briefing.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePdfExport = () => {
    const roi = calculateRoi(bankKey);
    const html = generatePrintableHtml({ bd, qd, cx, comp, vs, score, conf, dims, bankKey, roi });
    const win = window.open('', '_blank');
    if (!win) {
      // Popup blocked — fall back to download as HTML file
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), {
        href: url, download: `${bd?.bank_name || bankKey}_Briefing.html`,
      });
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    // Safe: html is generated internally from trusted bank data, not user input
    win.document.write(html); // eslint-disable-line no-restricted-syntax
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-border flex flex-col mx-2 sm:mx-0"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <FileText size={20} className="text-primary shrink-0" />
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-fg truncate">{bd?.bank_name} — Meeting Briefing</h3>
                <p className="text-xs text-fg-muted">Auto-generated from intelligence data</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-fg-muted"><X size={18} /></button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            <pre className="whitespace-pre-wrap text-[11px] sm:text-xs text-fg font-mono leading-relaxed">{briefing}</pre>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-surface-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-semibold text-fg hover:bg-surface-3 transition-colors"
            >
              <Download size={14} />
              Download .md
            </button>
            <button
              onClick={handlePdfExport}
              className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg text-sm font-semibold hover:bg-primary-900/90 transition-colors"
            >
              <Printer size={14} />
              Print / PDF
            </button>
          </div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>,
    document.body
  );
}

function generateBriefing({ bd, qd, cx, comp, vs, score, conf, dims, bankKey }) {
  const lines = [];
  const add = (s = '') => lines.push(s);

  add(`# ${bd?.bank_name} — Meeting Briefing`);
  add(`**Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  add(`**Data Confidence:** ${conf.label}`);
  add();

  // Executive Summary
  add(`## Executive Summary`);
  add(`- **Fit Score:** ${score}/10 (${scoreLabel(score)})`);
  add(`- **Country:** ${bd?.country}`);
  add(`- **Type:** ${bd?.backbase_qualification?.bank_type || 'N/A'}`);
  if (bd?.overview) add(`- **Overview:** ${bd.overview}`);
  add();

  // Key Financials
  add(`## Key Financials`);
  const op = bd?.operational_profile;
  if (op) {
    if (op.total_assets) add(`- **Total Assets:** ${op.total_assets}`);
    if (op.total_customers) add(`- **Customers:** ${op.total_customers}`);
    if (op.employees) add(`- **Employees:** ${op.employees}`);
    if (op.roe) add(`- **ROE:** ${op.roe}`);
    if (op.cost_income_ratio) add(`- **Cost/Income Ratio:** ${op.cost_income_ratio}`);
  }
  add();

  // Deal Intel
  add(`## Deal Intelligence`);
  const q = bd?.backbase_qualification;
  if (q) {
    if (q.deal_size) add(`- **Deal Size:** ${q.deal_size}`);
    if (q.sales_cycle) add(`- **Sales Cycle:** ${q.sales_cycle}`);
    if (q.timing) add(`- **Timing:** ${q.timing}`);
    if (q.risk) add(`- **Risk:** ${q.risk}`);
  }
  add();

  // Value Hypothesis
  if (vs?.value_hypothesis) {
    add(`## Value Hypothesis`);
    if (vs.value_hypothesis.one_liner) add(`> "${vs.value_hypothesis.one_liner}"`);
    add();
    if (vs.value_hypothesis.if_condition) add(`**IF:** ${vs.value_hypothesis.if_condition}`);
    if (vs.value_hypothesis.then_outcome) add(`**THEN:** ${vs.value_hypothesis.then_outcome}`);
    if (vs.value_hypothesis.by_deploying) add(`**BY:** ${vs.value_hypothesis.by_deploying}`);
    if (vs.value_hypothesis.resulting_in) add(`**RESULT:** ${vs.value_hypothesis.resulting_in}`);
    add();
  }

  // Key Decision Makers
  if (bd?.key_decision_makers?.length > 0) {
    add(`## Key Decision Makers`);
    bd.key_decision_makers.forEach(dm => {
      if (dm.name && !dm.name.startsWith('(')) {
        add(`- **${dm.name}** — ${dm.role}`);
        if (dm.note) add(`  ${dm.note}`);
      }
    });
    add();
  }

  // Discovery Questions
  if (vs?.discovery_questions?.length > 0) {
    add(`## Discovery Questions`);
    vs.discovery_questions.forEach((q, i) => {
      add(`${i + 1}. ${q}`);
    });
    add();
  }

  // CX Snapshot
  if (cx) {
    add(`## CX Snapshot`);
    add(`- **iOS App Rating:** ${cx.app_rating_ios || 'N/A'}`);
    add(`- **Android App Rating:** ${cx.app_rating_android || 'N/A'}`);
    add(`- **Digital Maturity:** ${cx.digital_maturity || 'N/A'}`);
    if (cx.cx_strengths?.length > 0) {
      add(`- **Strengths:** ${cx.cx_strengths.slice(0, 3).join(', ')}`);
    }
    if (cx.cx_weaknesses?.length > 0) {
      add(`- **Weaknesses:** ${cx.cx_weaknesses.slice(0, 3).join(', ')}`);
    }
    add();
  }

  // Competition
  if (comp) {
    add(`## Competitive Landscape`);
    if (comp.core_banking) add(`- **Core Banking:** ${comp.core_banking}`);
    if (comp.digital_platform) add(`- **Digital Platform:** ${comp.digital_platform}`);
    if (comp.key_vendors?.length > 0) {
      add(`- **Key Vendors:** ${comp.key_vendors.join(', ')}`);
    }
    if (comp.vendor_risk) add(`- **Vendor Risk:** ${comp.vendor_risk}`);
    add();
  }

  // Landing Zones (from bank data)
  if (bd?.backbase_landing_zones?.length > 0) {
    add(`## Landing Zones`);
    bd.backbase_landing_zones.forEach(lz => {
      add(`- **${lz.zone}** — Fit: ${lz.fit_score}/10`);
      if (lz.rationale) add(`  ${lz.rationale}`);
      if (lz.entry_strategy) add(`  *Entry:* ${lz.entry_strategy}`);
    });
    add();
  } else if (vs?.landing_zones?.length > 0) {
    add(`## Recommended Landing Zones`);
    vs.landing_zones.forEach(lz => {
      add(`- **${lz.zone}** (${lz.priority || 'N/A'}) — ${lz.products?.join(', ') || 'TBD'}`);
      if (lz.rationale) add(`  ${lz.rationale}`);
    });
    add();
  }

  // Engagement Zones
  if (q?.engagement_banking_zones?.length > 0) {
    add(`## Engagement Banking Zones`);
    q.engagement_banking_zones.forEach(z => {
      add(`- **${z.zone}** [${z.priority}] — ${z.detail}`);
    });
    add();
  }

  // Pain Points
  if (bd?.pain_points?.length > 0) {
    add(`## Pain Points`);
    bd.pain_points.forEach(p => {
      add(`- **${p.title}:** ${p.detail}`);
    });
    add();
  }

  // Signals
  if (bd?.signals?.length > 0) {
    add(`## Buying Signals`);
    bd.signals.forEach(s => {
      add(`- **${s.signal}** — ${s.implication}`);
    });
    add();
  }

  // Recommended Approach
  if (bd?.recommended_approach) {
    add(`## Recommended Approach`);
    add(bd.recommended_approach);
    add();
  }

  // Qualification Dimensions
  if (qd) {
    add(`## Score Breakdown (${score}/10)`);
    Object.entries(dims).forEach(([dim, config]) => {
      if (qd[dim]) {
        add(`- **${config.label}** (${Math.round(config.weight * 100)}%): ${qd[dim].score}/10 — ${qd[dim].note}`);
      }
    });
    add();
  }

  add(`---`);
  add(`*Confidential — Backbase Market Intelligence*`);

  return lines.join('\n');
}

function generatePrintableHtml({ bd, qd, cx, comp, vs, score, conf, dims, bankKey, roi }) {
  const name = bd?.bank_name || bankKey;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const q = bd?.backbase_qualification;

  const s = (label, content) => content ? `<div class="section"><h2>${label}</h2>${content}</div>` : '';
  const row = (k, v) => v ? `<tr><td class="label">${k}</td><td>${v}</td></tr>` : '';

  // KPIs table
  const kpiRows = [
    row('Total Assets', bd?.operational_profile?.total_assets),
    row('Customers', bd?.operational_profile?.total_customers),
    row('Employees', bd?.operational_profile?.employees),
    row('ROE', bd?.operational_profile?.roe),
    row('Cost/Income', bd?.operational_profile?.cost_income_ratio),
  ].filter(Boolean).join('');

  // Deal intel
  const dealRows = [
    row('Deal Size', q?.deal_size),
    row('Sales Cycle', q?.sales_cycle),
    row('Timing', q?.timing),
    row('Risk', q?.risk),
  ].filter(Boolean).join('');

  // Value hypothesis
  const vhSection = vs?.value_hypothesis ? `
    <div class="highlight">
      <p class="hypothesis">"${vs.value_hypothesis.one_liner}"</p>
      <table class="compact">
        ${row('IF', vs.value_hypothesis.if_condition)}
        ${row('THEN', vs.value_hypothesis.then_outcome)}
        ${row('BY', vs.value_hypothesis.by_deploying)}
        ${row('RESULT', vs.value_hypothesis.resulting_in)}
      </table>
    </div>` : '';

  // People
  const people = (bd?.key_decision_makers || [])
    .filter(p => p.name && !p.name.startsWith('('))
    .map(p => `<li><strong>${p.name}</strong> — ${p.role}${p.note ? `<br><small>${p.note}</small>` : ''}</li>`)
    .join('');

  // ROI
  const roiSection = roi?.levers?.length > 0 ? `
    <div class="section">
      <h2>ROI Estimate (Annual Value)</h2>
      <table>
        <tr><th>Scenario</th><th>Value</th></tr>
        <tr><td>Conservative</td><td>${formatEur(roi.totals.conservative)}</td></tr>
        <tr class="highlight-row"><td>Base Case</td><td><strong>${formatEur(roi.totals.base)}</strong></td></tr>
        <tr><td>Optimistic</td><td>${formatEur(roi.totals.optimistic)}</td></tr>
      </table>
      <h3>Value Levers</h3>
      <table>
        <tr><th>Lever</th><th>Conservative</th><th>Base</th><th>Optimistic</th></tr>
        ${roi.levers.map(l => `<tr><td>${l.name}</td><td>${formatEur(l.values[0])}</td><td>${formatEur(l.values[1])}</td><td>${formatEur(l.values[2])}</td></tr>`).join('')}
      </table>
    </div>` : '';

  // Score breakdown
  const scoreRows = qd ? Object.entries(dims).map(([dim, config]) => {
    if (!qd[dim]) return '';
    return `<tr><td>${config.label}</td><td>${qd[dim].score}/10</td><td>${Math.round(config.weight * 100)}%</td><td>${qd[dim].note}</td></tr>`;
  }).filter(Boolean).join('') : '';

  // Signals
  const signals = (bd?.signals || []).map(sig =>
    `<li><strong>${sig.signal}</strong> — ${sig.implication}</li>`
  ).join('');

  // Landing zones
  const lz = (bd?.backbase_landing_zones || []).map(z =>
    `<li><strong>${z.zone}</strong> (${z.fit_score}/10) — ${z.rationale}</li>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${name} — Meeting Briefing</title>
<style>
  @page { margin: 1.5cm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.5; padding: 20px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #3366FF; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 22px; color: #091C35; margin: 0; }
  .header .meta { text-align: right; font-size: 10px; color: #666; }
  .score-badge { display: inline-block; background: #3366FF; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 800; }
  .section { margin-bottom: 14px; page-break-inside: avoid; }
  .section h2 { font-size: 13px; color: #3366FF; border-bottom: 1px solid #e0e0e0; padding-bottom: 3px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .section h3 { font-size: 11px; color: #091C35; margin: 8px 0 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; }
  th, td { padding: 4px 8px; text-align: left; border-bottom: 1px solid #f0f0f0; }
  th { background: #f8f9fa; font-weight: 700; color: #333; }
  td.label { font-weight: 600; width: 140px; color: #555; }
  .highlight { background: #091C35; color: white; padding: 12px; border-radius: 8px; margin: 8px 0; }
  .highlight .label { color: #99b3ff; }
  .highlight td { border-color: rgba(255,255,255,0.1); }
  .hypothesis { font-size: 12px; font-style: italic; margin-bottom: 8px; color: #99ccff; }
  .compact td { padding: 2px 8px; }
  .highlight-row td { background: #EBF0FF; font-weight: 700; }
  ul { padding-left: 16px; margin: 4px 0; }
  li { margin: 2px 0; }
  small { color: #888; font-size: 9px; }
  .footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 9px; color: #999; text-align: center; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${name}</h1>
      <div style="color:#666;font-size:10px;margin-top:2px">${bd?.country || ''} &bull; ${bd?.tagline || ''}</div>
    </div>
    <div class="meta">
      <span class="score-badge">${score}/10</span>
      <div style="margin-top:4px">${conf.label} Confidence</div>
      <div>${date}</div>
    </div>
  </div>

  <div class="two-col">
    ${s('Key Financials', kpiRows ? `<table>${kpiRows}</table>` : '')}
    ${s('Deal Intelligence', dealRows ? `<table>${dealRows}</table>` : '')}
  </div>

  ${vs?.value_hypothesis ? s('Value Hypothesis', vhSection) : ''}
  ${roiSection}
  ${people ? s('Key Decision Makers', `<ul>${people}</ul>`) : ''}
  ${signals ? s('Buying Signals', `<ul>${signals}</ul>`) : ''}
  ${lz ? s('Landing Zones', `<ul>${lz}</ul>`) : ''}

  ${cx ? s('CX Snapshot', `<table>
    ${row('iOS Rating', cx.app_rating_ios)}
    ${row('Android Rating', cx.app_rating_android)}
    ${row('Digital Maturity', cx.digital_maturity)}
    ${cx.cx_strengths?.length ? row('Strengths', cx.cx_strengths.join(', ')) : ''}
    ${cx.cx_weaknesses?.length ? row('Weaknesses', cx.cx_weaknesses.join(', ')) : ''}
  </table>`) : ''}

  ${comp ? s('Competitive Landscape', `<table>
    ${row('Core Banking', comp.core_banking)}
    ${row('Digital Platform', comp.digital_platform)}
    ${comp.key_vendors?.length ? row('Key Vendors', comp.key_vendors.join(', ')) : ''}
    ${comp.vendor_risk ? row('Vendor Risk', comp.vendor_risk) : ''}
  </table>`) : ''}

  ${scoreRows ? s('Score Breakdown', `<table><tr><th>Dimension</th><th>Score</th><th>Weight</th><th>Notes</th></tr>${scoreRows}</table>`) : ''}

  ${bd?.pain_points?.length ? s('Pain Points', `<ul>${bd.pain_points.map(p => `<li><strong>${p.title}</strong> — ${p.detail}</li>`).join('')}</ul>`) : ''}

  ${bd?.recommended_approach ? s('Recommended Approach', `<p>${bd.recommended_approach}</p>`) : ''}

  <div class="footer">
    Confidential &mdash; Backbase Market Intelligence &bull; Generated ${date}
  </div>

  <button class="no-print" onclick="window.print()" style="position:fixed;bottom:20px;right:20px;padding:10px 24px;background:#3366FF;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(51,102,255,0.3)">
    Print / Save as PDF
  </button>
</body>
</html>`;
}
