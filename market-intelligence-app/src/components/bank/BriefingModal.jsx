import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, FileText, Download } from 'lucide-react';
import { BANK_DATA, QUAL_DATA, QUAL_FRAMEWORK, CX_DATA, COMP_DATA, VALUE_SELLING, calcScore, scoreLabel, dataConfidence } from '../../data/utils';

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
