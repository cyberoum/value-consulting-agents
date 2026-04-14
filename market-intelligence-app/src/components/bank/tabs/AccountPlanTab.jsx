import { useState, useMemo } from 'react';
import {
  Target, Cpu, CalendarCheck, FileCheck, Copy, Check, Loader,
  ChevronDown, ChevronUp, AlertTriangle, ArrowRight, Zap,
} from 'lucide-react';
import { analyzeMotionsForBank } from '../../../data/salesMotions';
import { generateAccountPlan as apiGenerateAccountPlan } from '../../../data/api';
import Section from '../../common/Section';

/* ═══════════════════════════════════════════════
   Section 1: Sales Motions (instant, client-side)
   ═══════════════════════════════════════════════ */

function MotionCard({ motion, isExpanded, onToggle }) {
  const VERDICT_CONFIG = {
    primary:     { label: 'Primary Motion',  color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/40' },
    secondary:   { label: 'Secondary',       color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/40' },
    exploratory: { label: 'Exploratory',     color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', border: 'border-border' },
  };
  const vc = VERDICT_CONFIG[motion.verdict] || VERDICT_CONFIG.exploratory;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${vc.border}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-2 transition-colors">
        <span className="text-xl">{motion.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-fg truncate">{motion.label}</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${vc.color}`}>{vc.label}</span>
            <span className="text-[8px] text-fg-disabled">({motion.evidenceScore} pts)</span>
          </div>
          <div className="text-[9px] text-fg-muted mt-0.5">{motion.typical_deal_size} | {motion.typical_cycle}</div>
        </div>
        {isExpanded ? <ChevronUp size={14} className="text-fg-muted" /> : <ChevronDown size={14} className="text-fg-muted" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border space-y-3">
          <p className="text-[11px] text-fg leading-relaxed mt-3">{motion.description}</p>

          {/* Evidence from bank data — the WHY */}
          {motion.evidence?.length > 0 && (
            <div>
              <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Why This Motion Applies</div>
              {motion.evidence.map((e, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px] text-fg mb-1">
                  <Zap size={9} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>{e}</span>
                </div>
              ))}
            </div>
          )}

          {/* Qualifying questions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold text-fg-muted uppercase">Qualifying Questions</span>
              <CopyButton text={motion.qualifying_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')} label="Copy" />
            </div>
            {motion.qualifying_questions.map((q, i) => (
              <div key={i} className="text-[10px] text-fg mb-1">
                <span className="text-primary font-bold mr-1">{i + 1}.</span> {q}
              </div>
            ))}
          </div>

          {/* Products + resources */}
          <div className="flex flex-wrap gap-1.5">
            {motion.backbase_products.map((p, i) => (
              <span key={i} className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{p}</span>
            ))}
          </div>
          <div className="text-[9px] text-fg-disabled">
            Resources needed: {motion.internal_resources.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}

function SalesMotionsSection({ data }) {
  const motions = useMemo(() => analyzeMotionsForBank(data), [data]);
  const [expandedId, setExpandedId] = useState(null);

  const primary = motions.filter(m => m.verdict === 'primary');
  const secondary = motions.filter(m => m.verdict === 'secondary');
  const exploratory = motions.filter(m => m.verdict === 'exploratory');

  return (
    <Section title="Sales Motions" defaultOpen={true} color="#7C4DFF">
      {motions.length === 0 ? (
        <div className="text-center py-6 text-fg-muted">
          <Target size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">No applicable motions identified based on current bank data.</p>
          <p className="text-[9px] mt-1">Add more pain points, signals, or landing zones to improve analysis.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Primary motions — strong evidence from multiple data points */}
          {primary.length > 0 && (
            <div>
              <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                Primary — strong evidence from bank data ({primary.length})
              </div>
              <div className="space-y-2">
                {primary.map(m => (
                  <MotionCard key={m.id} motion={m} isExpanded={expandedId === m.id} onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Secondary motions — supporting evidence */}
          {secondary.length > 0 && (
            <div>
              <div className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                Secondary — supporting evidence ({secondary.length})
              </div>
              <div className="space-y-2">
                {secondary.map(m => (
                  <MotionCard key={m.id} motion={m} isExpanded={expandedId === m.id} onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Exploratory — weak signals, worth investigating */}
          {exploratory.length > 0 && (
            <details className="mt-2">
              <summary className="text-[9px] text-fg-disabled cursor-pointer hover:text-fg-muted">
                {exploratory.length} exploratory motion{exploratory.length > 1 ? 's' : ''} — weak signals, investigate further
              </summary>
              <div className="space-y-2 mt-2">
                {exploratory.map(m => (
                  <MotionCard key={m.id} motion={m} isExpanded={expandedId === m.id} onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   Section 2: Technographics (instant, from props)
   ═══════════════════════════════════════════════ */

function TechnographicsSection({ qd, comp }) {
  const techScore = qd?.technographics;
  const hasData = techScore || comp;

  if (!hasData) {
    return (
      <Section title="Technographics" defaultOpen={true} color="#0EA5E9">
        <div className="text-center py-6 text-fg-muted">
          <Cpu size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">No technographic data available.</p>
          <p className="text-[9px] mt-1">Add vendor intelligence via the Intel tab.</p>
        </div>
      </Section>
    );
  }

  const urgencyBadge = (risk) => {
    if (!risk) return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">unknown</span>;
    const r = risk.toLowerCase();
    if (r.includes('high') || r.includes('aging') || r.includes('at-risk') || r.includes('legacy'))
      return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">high</span>;
    if (r.includes('medium') || r.includes('moderate'))
      return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">medium</span>;
    return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">low</span>;
  };

  return (
    <Section title="Technographics" defaultOpen={true} color="#0EA5E9">
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg p-3 mb-3">
        <p className="text-[10px] text-blue-700 dark:text-blue-300 font-bold">
          Systems approaching renewal in the next 12-18 months represent the highest-value entry windows.
        </p>
      </div>

      {/* Tech score */}
      {techScore && (
        <div className="flex items-center gap-3 mb-3 p-2 bg-surface-2 rounded-lg">
          <div className="text-xs font-bold text-fg">Tech Maturity</div>
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${(techScore.score / 10) * 100}%` }} />
          </div>
          <span className="text-xs font-black text-fg">{techScore.score}/10</span>
        </div>
      )}
      {techScore?.note && <p className="text-[10px] text-fg-muted mb-3">{techScore.note}</p>}

      {/* Vendor table */}
      {comp && (
        <div className="space-y-2">
          {[
            { label: 'Core Banking', value: comp.core_banking, risk: comp.vendor_risk },
            { label: 'Digital Platform', value: comp.digital_platform },
          ].filter(r => r.value).map((row, i) => (
            <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg ${
              row.risk?.toLowerCase().includes('aging') || row.risk?.toLowerCase().includes('high')
                ? 'bg-red-50/50 dark:bg-red-900/5 border-l-2 border-red-400' : 'bg-surface-2'
            }`}>
              <div className="flex-1">
                <div className="text-[9px] font-bold text-fg-muted uppercase">{row.label}</div>
                <div className="text-xs font-bold text-fg">{row.value}</div>
              </div>
              {row.risk && urgencyBadge(row.risk)}
            </div>
          ))}

          {comp.key_vendors?.length > 0 && (
            <div className="mt-2">
              <div className="text-[9px] font-bold text-fg-muted uppercase mb-1">Key Vendors</div>
              <div className="flex flex-wrap gap-1.5">
                {comp.key_vendors.map((v, i) => (
                  <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-surface-2 text-fg-muted">{v}</span>
                ))}
              </div>
            </div>
          )}

          {comp.vendor_risk && (
            <div className="flex items-start gap-1.5 mt-2 text-[10px] text-amber-600 dark:text-amber-400">
              <AlertTriangle size={10} className="mt-0.5 shrink-0" />
              <span>{comp.vendor_risk}</span>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   Section 3: Mutual Close Plan (AI, on demand)
   ═══════════════════════════════════════════════ */

function ClosePlanSection({ bankKey, bankName, researchAvailable }) {
  const [form, setForm] = useState({ closeDate: '', aeOwner: '', dealSizeEstimate: '', knownStakeholders: '', openItems: '' });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const canGenerate = form.closeDate && form.aeOwner && researchAvailable;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGenerateAccountPlan({ type: 'close-plan', bankName, bankKey, inputs: form });
      setPlan(result);
    } catch (err) {
      setError(err.message || 'Failed to generate close plan');
    } finally {
      setLoading(false);
    }
  };

  const planToText = () => {
    if (!plan) return '';
    let t = `MUTUAL CLOSE PLAN — ${bankName}\n\n${plan.summary}\n\n`;
    (plan.timeline || []).forEach((p, i) => {
      t += `Phase ${i + 1}: ${p.phase} (${p.target_date})\n`;
      t += `  Owner: ${p.owner}\n`;
      (p.activities || []).forEach(a => { t += `  - ${a}\n`; });
      if (p.customer_ask) t += `  Customer ask: ${p.customer_ask}\n`;
      if (p.go_no_go) t += `  Go/No-Go: ${p.go_no_go}\n`;
      t += '\n';
    });
    if (plan.risks?.length) { t += `RISKS:\n`; plan.risks.forEach(r => { t += `- ${r}\n`; }); t += '\n'; }
    if (plan.next_immediate_action) t += `NEXT ACTION: ${plan.next_immediate_action}\n`;
    return t;
  };

  return (
    <Section title="Mutual Close Plan" defaultOpen={true} color="#3366FF">
      {!plan ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">Target Close Date *</label>
              <input type="date" value={form.closeDate} onChange={e => set('closeDate', e.target.value)}
                className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">AE Owner *</label>
              <input type="text" value={form.aeOwner} onChange={e => set('aeOwner', e.target.value)} placeholder="Name"
                className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg placeholder:text-fg-disabled focus:border-primary outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">Estimated ARR</label>
            <input type="text" value={form.dealSizeEstimate} onChange={e => set('dealSizeEstimate', e.target.value)} placeholder="e.g. EUR 500K"
              className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg placeholder:text-fg-disabled focus:border-primary outline-none" />
          </div>
          <div>
            <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">Key Stakeholders Confirmed</label>
            <textarea value={form.knownStakeholders} onChange={e => set('knownStakeholders', e.target.value)} placeholder="Names and roles..."
              rows={2} className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg placeholder:text-fg-disabled focus:border-primary outline-none resize-none" />
          </div>
          <div>
            <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">Open Items / Blockers</label>
            <textarea value={form.openItems} onChange={e => set('openItems', e.target.value)} placeholder="Known blockers..."
              rows={2} className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg placeholder:text-fg-disabled focus:border-primary outline-none resize-none" />
          </div>

          {error && (
            <div className="p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-[10px] text-red-600 dark:text-red-400">
              {error} <button onClick={handleGenerate} className="ml-2 underline font-bold">Try again</button>
            </div>
          )}

          <button onClick={handleGenerate} disabled={!canGenerate || loading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              canGenerate && !loading ? 'bg-primary text-white hover:bg-primary/90' : 'bg-surface-2 text-fg-disabled cursor-not-allowed'
            }`}>
            {loading ? <><Loader size={13} className="animate-spin" /> Generating close plan...</> : <><CalendarCheck size={13} /> Generate Close Plan</>}
          </button>
          {!researchAvailable && <p className="text-[9px] text-fg-disabled text-center">AI not available — start the API server</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Next immediate action */}
          {plan.next_immediate_action && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="text-[9px] font-bold text-primary uppercase mb-1">This Week</div>
              <p className="text-xs font-bold text-fg">{plan.next_immediate_action}</p>
            </div>
          )}

          {/* Summary */}
          <p className="text-[11px] text-fg leading-relaxed">{plan.summary}</p>

          {/* Timeline */}
          <div className="space-y-2">
            {(plan.timeline || []).map((phase, i) => (
              <div key={i} className="relative pl-6 pb-3">
                {i < (plan.timeline || []).length - 1 && <div className="absolute left-[9px] top-5 bottom-0 w-px bg-border" />}
                <div className="absolute left-0 top-0.5 w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center text-[8px] font-black text-white">{i + 1}</div>
                <div className="bg-surface-2 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-fg">{phase.phase}</span>
                    <span className="text-[9px] text-fg-muted">{phase.target_date}</span>
                  </div>
                  <div className="text-[9px] text-primary font-bold mb-1">{phase.owner}</div>
                  <ul className="space-y-0.5 mb-2">
                    {(phase.activities || []).map((a, j) => (
                      <li key={j} className="text-[10px] text-fg flex gap-1.5">
                        <ArrowRight size={8} className="text-fg-muted mt-0.5 shrink-0" /> {a}
                      </li>
                    ))}
                  </ul>
                  {phase.customer_ask && (
                    <div className="text-[9px] p-1.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded text-amber-700 dark:text-amber-300">
                      <span className="font-bold">Customer ask:</span> {phase.customer_ask}
                    </div>
                  )}
                  {phase.go_no_go && (
                    <div className="text-[9px] p-1.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded text-blue-700 dark:text-blue-300 mt-1">
                      <span className="font-bold">Go/No-Go:</span> {phase.go_no_go}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Risks */}
          {plan.risks?.length > 0 && (
            <div className="p-3 bg-red-50/50 dark:bg-red-900/5 border border-red-200 dark:border-red-800/30 rounded-lg">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-red-600 dark:text-red-400 uppercase mb-1">
                <AlertTriangle size={10} /> Risks
              </div>
              {plan.risks.map((r, i) => <p key={i} className="text-[10px] text-fg mb-0.5">- {r}</p>)}
            </div>
          )}

          <div className="flex items-center gap-2">
            <CopyButton text={planToText()} label="Copy Close Plan" />
            <button onClick={() => setPlan(null)} className="text-[10px] text-fg-muted hover:text-fg underline">Edit inputs</button>
          </div>
          <div className="text-right"><span className="text-[8px] text-fg-disabled">AI-generated</span></div>
        </div>
      )}
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   Section 4: Late-Stage Deal Entry (AI, on demand)
   ═══════════════════════════════════════════════ */

function LateStageSection({ bankKey, bankName, researchAvailable }) {
  const [form, setForm] = useState({ dealStage: 'Negotiation', closeDateEstimate: '', arrEstimate: '', competitorInvolved: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGenerateAccountPlan({ type: 'late-stage-entry', bankName, bankKey, inputs: form });
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Late-Stage Deal Entry" defaultOpen={false} color="#C62828">
      <p className="text-[10px] text-fg-muted mb-3">For when VC has not been involved in a deal but it is closing soon and needs a VC intervention.</p>

      {!result ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">Deal Stage</label>
              <select value={form.dealStage} onChange={e => set('dealStage', e.target.value)}
                className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg focus:border-primary outline-none">
                <option>Negotiation</option>
                <option>Improved Value</option>
                <option>Procurement</option>
                <option>Legal</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">Est. Close Date</label>
              <input type="date" value={form.closeDateEstimate} onChange={e => set('closeDateEstimate', e.target.value)}
                className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg focus:border-primary outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">Est. ARR</label>
              <input type="text" value={form.arrEstimate} onChange={e => set('arrEstimate', e.target.value)} placeholder="e.g. EUR 500K"
                className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg placeholder:text-fg-disabled focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">Competitor Involved</label>
              <input type="text" value={form.competitorInvolved} onChange={e => set('competitorInvolved', e.target.value)} placeholder="Optional"
                className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg placeholder:text-fg-disabled focus:border-primary outline-none" />
            </div>
          </div>

          {error && (
            <div className="p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-[10px] text-red-600">
              {error} <button onClick={handleGenerate} className="ml-2 underline font-bold">Try again</button>
            </div>
          )}

          <button onClick={handleGenerate} disabled={!researchAvailable || loading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              researchAvailable && !loading ? 'bg-[#C62828] text-white hover:bg-[#C62828]/90' : 'bg-surface-2 text-fg-disabled cursor-not-allowed'
            }`}>
            {loading ? <><Loader size={13} className="animate-spin" /> Analyzing deal...</> : <><FileCheck size={13} /> Generate Deal Entry Framing</>}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* VC Entry Point */}
          <div className="p-3 bg-surface-2 rounded-lg">
            <div className="text-[9px] font-bold text-primary uppercase mb-1">VC Entry Point</div>
            <p className="text-[11px] text-fg leading-relaxed">{result.vc_entry_point}</p>
          </div>

          {/* Deal Engineering Framing */}
          <div className="p-3 bg-surface-2 rounded-lg">
            <div className="text-[9px] font-bold text-primary uppercase mb-1">Deal Engineering Framing</div>
            <p className="text-[11px] text-fg leading-relaxed">{result.deal_engineering_framing}</p>
          </div>

          {/* 3-Option Executive Decision Paper */}
          {result.executive_decision_paper && (
            <div>
              <div className="text-[9px] font-bold text-fg-muted uppercase mb-2">Executive Decision Paper</div>
              <div className="grid grid-cols-3 gap-2">
                {['option_a', 'option_b', 'option_c'].map(key => {
                  const opt = result.executive_decision_paper[key];
                  if (!opt) return null;
                  return (
                    <div key={key} className="p-2.5 border border-border rounded-lg">
                      <div className="text-[10px] font-bold text-fg mb-1">{opt.label}</div>
                      <p className="text-[9px] text-fg-muted mb-1">{opt.description}</p>
                      <p className="text-[9px] text-primary italic">{opt.vc_angle}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deal Pricing Angle */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg">
            <div className="text-[9px] font-bold text-amber-700 dark:text-amber-300 uppercase mb-1">Deal Pricing Angle</div>
            <p className="text-[10px] text-fg">{result.deal_pricing_angle}</p>
          </div>

          {/* AE Approach Script */}
          <div className="p-3 bg-[#091C35] text-white rounded-lg">
            <div className="text-[9px] font-bold text-blue-300 uppercase mb-1">Script for AE Approach</div>
            <p className="text-[11px] text-white/90 italic leading-relaxed">&ldquo;{result.ae_approach_script}&rdquo;</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setResult(null)} className="text-[10px] text-fg-muted hover:text-fg underline">Edit inputs</button>
          </div>
          <div className="text-right"><span className="text-[8px] text-fg-disabled">AI-generated</span></div>
        </div>
      )}
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   Shared: Copy Button
   ═══════════════════════════════════════════════ */

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold text-fg-muted hover:text-fg bg-surface-2 hover:bg-surface-3 transition-colors">
      {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

/* ═══════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════ */

export default function AccountPlanTab({ bankKey, data, qd, comp, researchAvailable }) {
  const bankName = data?.bank_name || '';

  return (
    <div>
      <SalesMotionsSection data={data} />
      <TechnographicsSection qd={qd} comp={comp} />
      <ClosePlanSection bankKey={bankKey} bankName={bankName} researchAvailable={researchAvailable} />
      <LateStageSection bankKey={bankKey} bankName={bankName} researchAvailable={researchAvailable} />
    </div>
  );
}
