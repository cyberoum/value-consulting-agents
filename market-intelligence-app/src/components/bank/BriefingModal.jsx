import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, Check, FileText, Download, Printer, Loader, Sparkles,
  Building2, DollarSign, Users, TrendingUp, Clock,
  AlertTriangle, Target, Zap, Star, Shield, Smartphone,
  BarChart3, MessageCircle, ArrowRight, Layers, Eye,
} from 'lucide-react';
import { generateExecutiveBrief as apiGenerateExecutiveBrief } from '../../data/api';
import { BANK_DATA, QUAL_DATA, QUAL_FRAMEWORK, CX_DATA, COMP_DATA, VALUE_SELLING, calcScore, scoreLabel, scoreColor, dataConfidence } from '../../data/utils';
import { calculateRoi, formatEur } from '../../data/roiEngine';

/* ───────── Small reusable pieces ───────── */

const SectionHeader = ({ icon: Icon, label, color = 'text-primary' }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon size={14} className={color} />
    <span className="text-[10px] font-black uppercase tracking-wider text-fg-muted">{label}</span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

const MetricCard = ({ label, value, sub, accent }) => (
  <div className="bg-surface-2 rounded-lg p-3 min-w-0">
    <div className="text-[9px] font-bold text-fg-muted uppercase tracking-wider mb-1">{label}</div>
    <div className={`text-sm font-black ${accent || 'text-fg'} truncate`}>{value || '—'}</div>
    {sub && <div className="text-[9px] text-fg-muted mt-0.5 truncate">{sub}</div>}
  </div>
);

const PersonCard = ({ name, role, note }) => (
  <div className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-surface-2 transition-colors">
    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
      {name.split(' ').map(w => w[0]).join('').slice(0, 2)}
    </div>
    <div className="min-w-0">
      <div className="text-xs font-bold text-fg truncate">{name}</div>
      <div className="text-[10px] text-fg-muted truncate">{role}</div>
      {note && <div className="text-[9px] text-fg-disabled mt-0.5 line-clamp-2">{note}</div>}
    </div>
  </div>
);

const ScoreBar = ({ label, score: val, weight, note }) => {
  const pct = Math.round((val / 10) * 100);
  const color = val >= 7 ? 'bg-emerald-500' : val >= 4 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="mb-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-fg">{label}</span>
        <span className="text-[9px] text-fg-muted">{val}/10 · {weight}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {note && <div className="text-[9px] text-fg-muted mt-0.5">{note}</div>}
    </div>
  );
};

const Chip = ({ children, color = 'bg-surface-2 text-fg-muted' }) => (
  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${color}`}>{children}</span>
);

/* ───────── Animated section wrapper ───────── */
const FadeIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.25 }}
  >
    {children}
  </motion.div>
);

/* ───────── Visual Content Renderer ───────── */
function BriefingContent({ bd, qd, cx, comp, vs, score, conf, dims, bankKey }) {
  const q = bd?.backbase_qualification;
  const op = bd?.operational_profile;
  const people = (bd?.key_decision_makers || []).filter(dm => dm.name && !dm.name.startsWith('('));
  const questions = vs?.discovery_questions || [];
  const signals = bd?.signals || [];
  const painPoints = bd?.pain_points || [];
  const landingZones = bd?.backbase_landing_zones || vs?.landing_zones || [];
  const engZones = q?.engagement_banking_zones || [];

  let delay = 0;
  const next = () => { delay += 0.06; return delay; };

  return (
    <div className="space-y-5">
      {/* ── Overview ── */}
      {bd?.overview && (
        <FadeIn delay={next()}>
          <p className="text-xs text-fg leading-relaxed">{bd.overview}</p>
        </FadeIn>
      )}

      {/* ── Key Financials ── */}
      {op && (
        <FadeIn delay={next()}>
          <SectionHeader icon={Building2} label="Key Financials" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <MetricCard label="Total Assets" value={op.total_assets} />
            <MetricCard label="Customers" value={op.total_customers} />
            <MetricCard label="Employees" value={op.employees} />
            <MetricCard label="ROE" value={op.roe} accent={parseFloat(op.roe) > 10 ? 'text-emerald-600' : ''} />
            <MetricCard label="Cost / Income" value={op.cost_income_ratio} accent={parseFloat(op.cost_income_ratio) > 60 ? 'text-amber-600' : 'text-emerald-600'} />
            {op.revenue && <MetricCard label="Revenue" value={op.revenue} />}
          </div>
        </FadeIn>
      )}

      {/* ── Deal Intelligence ── */}
      {q && (
        <FadeIn delay={next()}>
          <SectionHeader icon={DollarSign} label="Deal Intelligence" />
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Deal Size" value={q.deal_size} accent="text-primary" />
            <MetricCard label="Sales Cycle" value={q.sales_cycle} />
            <MetricCard label="Timing" value={q.timing}
              accent={q.timing?.toLowerCase().includes('urgent') || q.timing?.toLowerCase().includes('now') ? 'text-emerald-600' : ''} />
            <MetricCard label="Risk Level" value={q.risk}
              accent={q.risk?.toLowerCase().includes('high') ? 'text-red-500' : q.risk?.toLowerCase().includes('low') ? 'text-emerald-600' : 'text-amber-600'} />
          </div>
        </FadeIn>
      )}

      {/* ── Value Hypothesis ── */}
      {vs?.value_hypothesis && (
        <FadeIn delay={next()}>
          <SectionHeader icon={Target} label="Value Hypothesis" />
          <div className="bg-[#091C35] rounded-xl p-4 text-white">
            {vs.value_hypothesis.one_liner && (
              <p className="text-sm font-semibold italic text-blue-200 mb-3 leading-relaxed">
                &ldquo;{vs.value_hypothesis.one_liner}&rdquo;
              </p>
            )}
            <div className="space-y-2">
              {vs.value_hypothesis.if_condition && (
                <div className="flex gap-2">
                  <span className="text-[9px] font-black text-blue-400 uppercase w-14 shrink-0 pt-0.5">IF</span>
                  <span className="text-[11px] text-white/90">{vs.value_hypothesis.if_condition}</span>
                </div>
              )}
              {vs.value_hypothesis.then_outcome && (
                <div className="flex gap-2">
                  <span className="text-[9px] font-black text-emerald-400 uppercase w-14 shrink-0 pt-0.5">THEN</span>
                  <span className="text-[11px] text-white/90">{vs.value_hypothesis.then_outcome}</span>
                </div>
              )}
              {vs.value_hypothesis.by_deploying && (
                <div className="flex gap-2">
                  <span className="text-[9px] font-black text-amber-400 uppercase w-14 shrink-0 pt-0.5">BY</span>
                  <span className="text-[11px] text-white/90">{vs.value_hypothesis.by_deploying}</span>
                </div>
              )}
              {vs.value_hypothesis.resulting_in && (
                <div className="flex gap-2">
                  <span className="text-[9px] font-black text-violet-400 uppercase w-14 shrink-0 pt-0.5">RESULT</span>
                  <span className="text-[11px] text-white/90">{vs.value_hypothesis.resulting_in}</span>
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      )}

      {/* ── Key Decision Makers ── */}
      {people.length > 0 && (
        <FadeIn delay={next()}>
          <SectionHeader icon={Users} label={`Key Decision Makers (${people.length})`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {people.map((dm, i) => (
              <PersonCard key={i} name={dm.name} role={dm.role} note={dm.note} />
            ))}
          </div>
        </FadeIn>
      )}

      {/* ── Discovery Questions ── */}
      {questions.length > 0 && (
        <FadeIn delay={next()}>
          <SectionHeader icon={MessageCircle} label="Discovery Questions" />
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[11px] text-fg leading-relaxed italic">&ldquo;{q}&rdquo;</span>
              </div>
            ))}
          </div>
        </FadeIn>
      )}

      {/* ── CX Snapshot ── */}
      {cx && (
        <FadeIn delay={next()}>
          <SectionHeader icon={Smartphone} label="CX Snapshot" />
          <div className="flex flex-wrap gap-3 mb-2">
            {cx.app_rating_ios && (
              <div className="flex items-center gap-1.5 bg-surface-2 rounded-lg px-3 py-2">
                <span className="text-[9px] font-bold text-fg-muted">iOS</span>
                <Star size={10} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-black text-fg">{cx.app_rating_ios}</span>
              </div>
            )}
            {cx.app_rating_android && (
              <div className="flex items-center gap-1.5 bg-surface-2 rounded-lg px-3 py-2">
                <span className="text-[9px] font-bold text-fg-muted">Android</span>
                <Star size={10} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-black text-fg">{cx.app_rating_android}</span>
              </div>
            )}
            {cx.digital_maturity && (
              <div className="flex items-center gap-1.5 bg-surface-2 rounded-lg px-3 py-2">
                <span className="text-[9px] font-bold text-fg-muted">Maturity</span>
                <span className="text-xs font-black text-fg">{cx.digital_maturity}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(cx.cx_strengths || []).slice(0, 4).map((s, i) => (
              <Chip key={`s${i}`} color="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">&#10003; {s}</Chip>
            ))}
            {(cx.cx_weaknesses || []).slice(0, 4).map((w, i) => (
              <Chip key={`w${i}`} color="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300">&#10007; {w}</Chip>
            ))}
          </div>
        </FadeIn>
      )}

      {/* ── Competitive Landscape ── */}
      {comp && (
        <FadeIn delay={next()}>
          <SectionHeader icon={Shield} label="Competitive Landscape" />
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Core Banking" value={comp.core_banking} />
            <MetricCard label="Digital Platform" value={comp.digital_platform} />
          </div>
          {comp.key_vendors?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {comp.key_vendors.map((v, i) => <Chip key={i}>{v}</Chip>)}
            </div>
          )}
          {comp.vendor_risk && (
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-600 dark:text-amber-400">
              <AlertTriangle size={10} />
              <span className="font-bold">Vendor Risk:</span> {comp.vendor_risk}
            </div>
          )}
        </FadeIn>
      )}

      {/* ── Landing Zones ── */}
      {landingZones.length > 0 && (
        <FadeIn delay={next()}>
          <SectionHeader icon={Layers} label="Landing Zones" />
          <div className="space-y-2">
            {landingZones.map((lz, i) => (
              <div key={i} className="flex items-start gap-3 bg-surface-2 rounded-lg p-3">
                {lz.fit_score != null && (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
                       style={{ backgroundColor: scoreColor(lz.fit_score || 0) }}>
                    {lz.fit_score}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-fg">{lz.zone}</div>
                  {lz.rationale && <div className="text-[10px] text-fg-muted mt-0.5">{lz.rationale}</div>}
                  {lz.entry_strategy && (
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-primary">
                      <ArrowRight size={8} /> {lz.entry_strategy}
                    </div>
                  )}
                  {lz.products?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lz.products.map((p, j) => <Chip key={j}>{p}</Chip>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      )}

      {/* ── Engagement Banking Zones ── */}
      {engZones.length > 0 && (
        <FadeIn delay={next()}>
          <SectionHeader icon={Zap} label="Engagement Banking Zones" />
          <div className="space-y-1.5">
            {engZones.map((z, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Chip color={z.priority === 'P1' ? 'bg-primary text-white' : z.priority === 'P2' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-surface-2 text-fg-muted'}>
                  {z.priority}
                </Chip>
                <div>
                  <span className="font-bold text-fg">{z.zone}</span>
                  <span className="text-fg-muted"> — {z.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      )}

      {/* ── Signals ── */}
      {signals.length > 0 && (
        <FadeIn delay={next()}>
          <SectionHeader icon={TrendingUp} label="Buying Signals" color="text-emerald-500" />
          <div className="space-y-2">
            {signals.map((s, i) => (
              <div key={i} className="flex gap-2 items-start text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <span className="font-bold text-fg">{s.signal}</span>
                  <span className="text-fg-muted"> — {s.implication}</span>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      )}

      {/* ── Pain Points ── */}
      {painPoints.length > 0 && (
        <FadeIn delay={next()}>
          <SectionHeader icon={AlertTriangle} label="Pain Points" color="text-amber-500" />
          <div className="space-y-2">
            {painPoints.map((p, i) => (
              <div key={i} className="flex gap-2 items-start text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <span className="font-bold text-fg">{p.title}</span>
                  <span className="text-fg-muted"> — {p.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      )}

      {/* ── Score Breakdown ── */}
      {qd && (
        <FadeIn delay={next()}>
          <SectionHeader icon={BarChart3} label={`Score Breakdown (${score}/10)`} />
          <div>
            {Object.entries(dims).map(([dim, config]) => {
              if (!qd[dim]) return null;
              return (
                <ScoreBar
                  key={dim}
                  label={config.label}
                  score={qd[dim].score}
                  weight={Math.round(config.weight * 100)}
                  note={qd[dim].note}
                />
              );
            })}
          </div>
        </FadeIn>
      )}

      {/* ── Recommended Approach ── */}
      {bd?.recommended_approach && (
        <FadeIn delay={next()}>
          <SectionHeader icon={Eye} label="Recommended Approach" />
          <div className="bg-primary-50 dark:bg-primary/10 rounded-lg p-3">
            <p className="text-[11px] text-fg leading-relaxed">{bd.recommended_approach}</p>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

/* ───────── Main Modal ───────── */

/* ───────── AI Brief Renderer ───────── */
function AiBriefContent({ brief }) {
  if (!brief) return null;
  // Parse ## headings into sections
  const sections = brief.split(/^## /m).filter(Boolean).map(s => {
    const lines = s.split('\n');
    const title = lines[0].trim();
    const body = lines.slice(1).join('\n').trim();
    return { title, body };
  });

  return (
    <div className="space-y-4">
      {sections.map((s, i) => (
        <FadeIn key={i} delay={i * 0.08}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs font-black text-fg uppercase tracking-wider">{s.title}</span>
            </div>
            <div className="text-[11px] text-fg leading-relaxed whitespace-pre-line">{s.body}</div>
          </div>
        </FadeIn>
      ))}
      <div className="text-right pt-2 border-t border-border">
        <span className="text-[8px] text-fg-disabled flex items-center justify-end gap-1">
          <Sparkles size={8} /> AI-synthesized by Claude
        </span>
      </div>
    </div>
  );
}

export default function BriefingModal({ bankKey, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'markdown' | 'ai'
  const [aiBrief, setAiBrief] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

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
    const textToCopy = viewMode === 'ai' && aiBrief ? aiBrief : briefing;
    navigator.clipboard.writeText(textToCopy);
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
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const handleGenerateAiBrief = async () => {
    if (aiBrief) { setViewMode('ai'); return; } // Already generated — just switch view
    setViewMode('ai');
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await apiGenerateExecutiveBrief({ bankKey });
      setAiBrief(result.brief);
    } catch (err) {
      setAiError(err.message || 'Failed to generate AI brief');
    } finally {
      setAiLoading(false);
    }
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
          className="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-border flex flex-col mx-2 sm:mx-0"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="bg-[#091C35] text-white px-5 sm:px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Executive Brief</span>
              </div>
              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex bg-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('visual')}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-colors ${
                      viewMode === 'visual' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    Visual
                  </button>
                  <button
                    onClick={() => setViewMode('markdown')}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-colors ${
                      viewMode === 'markdown' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    Markdown
                  </button>
                  <button
                    onClick={handleGenerateAiBrief}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-colors flex items-center gap-1 ${
                      viewMode === 'ai' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    <Sparkles size={8} /> AI Brief
                  </button>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg sm:text-xl font-black truncate">{bd?.bank_name}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-sm font-black shrink-0"
                    style={{ backgroundColor: scoreColor(score), color: 'white' }}>
                {score}/10
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-white/50">
              <span>{bd?.country}</span>
              <span>·</span>
              <span>{bd?.tagline || bd?.backbase_qualification?.bank_type || ''}</span>
              <span>·</span>
              <span>{conf.label} Confidence</span>
              <span>·</span>
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
            {viewMode === 'visual' ? (
              <BriefingContent bd={bd} qd={qd} cx={cx} comp={comp} vs={vs} score={score} conf={conf} dims={dims} bankKey={bankKey} />
            ) : viewMode === 'ai' ? (
              aiLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-fg-muted">
                  <Loader size={20} className="animate-spin mb-3 text-primary" />
                  <p className="text-xs font-bold">Generating AI executive brief...</p>
                  <p className="text-[9px] mt-1">Claude is synthesizing a consultant-quality narrative</p>
                </div>
              ) : aiError ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <AlertTriangle size={20} className="text-red-500 mb-3" />
                  <p className="text-xs text-red-600 dark:text-red-400 font-bold">{aiError}</p>
                  <button onClick={handleGenerateAiBrief} className="mt-3 text-[10px] text-primary font-bold hover:underline">Try again</button>
                </div>
              ) : aiBrief ? (
                <AiBriefContent brief={aiBrief} />
              ) : null
            ) : (
              <pre className="whitespace-pre-wrap text-[11px] text-fg font-mono leading-relaxed">{briefing}</pre>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center gap-2 sm:gap-3 px-5 sm:px-6 py-3 border-t border-border bg-surface-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-fg hover:bg-surface-3 transition-colors"
            >
              <Download size={13} />
              Download
            </button>
            <button
              onClick={handlePdfExport}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#091C35] text-white rounded-lg text-xs font-bold hover:bg-[#091C35]/90 transition-colors"
            >
              <Printer size={13} />
              Print / PDF
            </button>
          </div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════════
   Markdown generator — used for Copy / Download (unchanged)
   ═══════════════════════════════════════════════════════════════ */

function generateBriefing({ bd, qd, cx, comp, vs, score, conf, dims, bankKey }) {
  const lines = [];
  const add = (s = '') => lines.push(s);

  add(`# ${bd?.bank_name} — Meeting Briefing`);
  add(`**Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  add(`**Data Confidence:** ${conf.label}`);
  add();

  add(`## Executive Summary`);
  add(`- **Fit Score:** ${score}/10 (${scoreLabel(score)})`);
  add(`- **Country:** ${bd?.country}`);
  add(`- **Type:** ${bd?.backbase_qualification?.bank_type || 'N/A'}`);
  if (bd?.overview) add(`- **Overview:** ${bd.overview}`);
  add();

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

  add(`## Deal Intelligence`);
  const q = bd?.backbase_qualification;
  if (q) {
    if (q.deal_size) add(`- **Deal Size:** ${q.deal_size}`);
    if (q.sales_cycle) add(`- **Sales Cycle:** ${q.sales_cycle}`);
    if (q.timing) add(`- **Timing:** ${q.timing}`);
    if (q.risk) add(`- **Risk:** ${q.risk}`);
  }
  add();

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

  if (vs?.discovery_questions?.length > 0) {
    add(`## Discovery Questions`);
    vs.discovery_questions.forEach((q, i) => {
      add(`${i + 1}. ${q}`);
    });
    add();
  }

  if (cx) {
    add(`## CX Snapshot`);
    add(`- **iOS App Rating:** ${cx.app_rating_ios || 'N/A'}`);
    add(`- **Android App Rating:** ${cx.app_rating_android || 'N/A'}`);
    add(`- **Digital Maturity:** ${cx.digital_maturity || 'N/A'}`);
    if (cx.cx_strengths?.length > 0) add(`- **Strengths:** ${cx.cx_strengths.slice(0, 3).join(', ')}`);
    if (cx.cx_weaknesses?.length > 0) add(`- **Weaknesses:** ${cx.cx_weaknesses.slice(0, 3).join(', ')}`);
    add();
  }

  if (comp) {
    add(`## Competitive Landscape`);
    if (comp.core_banking) add(`- **Core Banking:** ${comp.core_banking}`);
    if (comp.digital_platform) add(`- **Digital Platform:** ${comp.digital_platform}`);
    if (comp.key_vendors?.length > 0) add(`- **Key Vendors:** ${comp.key_vendors.join(', ')}`);
    if (comp.vendor_risk) add(`- **Vendor Risk:** ${comp.vendor_risk}`);
    add();
  }

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

  if (q?.engagement_banking_zones?.length > 0) {
    add(`## Engagement Banking Zones`);
    q.engagement_banking_zones.forEach(z => {
      add(`- **${z.zone}** [${z.priority}] — ${z.detail}`);
    });
    add();
  }

  if (bd?.pain_points?.length > 0) {
    add(`## Pain Points`);
    bd.pain_points.forEach(p => add(`- **${p.title}:** ${p.detail}`));
    add();
  }

  if (bd?.signals?.length > 0) {
    add(`## Buying Signals`);
    bd.signals.forEach(s => add(`- **${s.signal}** — ${s.implication}`));
    add();
  }

  if (bd?.recommended_approach) {
    add(`## Recommended Approach`);
    add(bd.recommended_approach);
    add();
  }

  if (qd) {
    add(`## Score Breakdown (${score}/10)`);
    Object.entries(dims).forEach(([dim, config]) => {
      if (qd[dim]) add(`- **${config.label}** (${Math.round(config.weight * 100)}%): ${qd[dim].score}/10 — ${qd[dim].note}`);
    });
    add();
  }

  add(`---`);
  add(`*Confidential — Nova by Backbase*`);

  return lines.join('\n');
}

/* ═══════════════════════════════════════════════════════════════
   Print / PDF HTML generator (unchanged)
   ═══════════════════════════════════════════════════════════════ */

function generatePrintableHtml({ bd, qd, cx, comp, vs, score, conf, dims, bankKey, roi }) {
  const name = bd?.bank_name || bankKey;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const q = bd?.backbase_qualification;

  const s = (label, content) => content ? `<div class="section"><h2>${label}</h2>${content}</div>` : '';
  const row = (k, v) => v ? `<tr><td class="label">${k}</td><td>${v}</td></tr>` : '';

  const kpiRows = [
    row('Total Assets', bd?.operational_profile?.total_assets),
    row('Customers', bd?.operational_profile?.total_customers),
    row('Employees', bd?.operational_profile?.employees),
    row('ROE', bd?.operational_profile?.roe),
    row('Cost/Income', bd?.operational_profile?.cost_income_ratio),
  ].filter(Boolean).join('');

  const dealRows = [
    row('Deal Size', q?.deal_size),
    row('Sales Cycle', q?.sales_cycle),
    row('Timing', q?.timing),
    row('Risk', q?.risk),
  ].filter(Boolean).join('');

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

  const people = (bd?.key_decision_makers || [])
    .filter(p => p.name && !p.name.startsWith('('))
    .map(p => `<li><strong>${p.name}</strong> — ${p.role}${p.note ? `<br><small>${p.note}</small>` : ''}</li>`)
    .join('');

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

  const scoreRows = qd ? Object.entries(dims).map(([dim, config]) => {
    if (!qd[dim]) return '';
    return `<tr><td>${config.label}</td><td>${qd[dim].score}/10</td><td>${Math.round(config.weight * 100)}%</td><td>${qd[dim].note}</td></tr>`;
  }).filter(Boolean).join('') : '';

  const signals = (bd?.signals || []).map(sig =>
    `<li><strong>${sig.signal}</strong> — ${sig.implication}</li>`
  ).join('');

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
    Confidential &mdash; Nova by Backbase &bull; Generated ${date}
  </div>

  <button class="no-print" onclick="window.print()" style="position:fixed;bottom:20px;right:20px;padding:10px 24px;background:#3366FF;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(51,102,255,0.3)">
    Print / Save as PDF
  </button>
</body>
</html>`;
}
