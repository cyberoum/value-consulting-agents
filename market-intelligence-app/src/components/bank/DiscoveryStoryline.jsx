import { useState, Fragment } from 'react';
import {
  ChevronDown, ChevronUp, X, Copy, Check,
  TrendingUp, Building2, Users, Swords, Sparkles, Award, Handshake,
  BookOpen, ArrowRight, Quote, DollarSign, Clock, AlertTriangle, Loader2,
} from 'lucide-react';

// ═══════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════

const ACT_CONFIG = {
  market_context:        { icon: TrendingUp, color: 'blue',    label: 'Act 1', title: 'The World is Changing' },
  your_reality:          { icon: Building2,  color: 'red',     label: 'Act 2', title: 'Your Reality' },
  customer_lens:         { icon: Users,      color: 'violet',  label: 'Act 3', title: 'Your Customers Expect More' },
  competitive_landscape: { icon: Swords,     color: 'amber',   label: 'Act 4', title: 'The Race' },
  art_of_possible:       { icon: Sparkles,   color: 'primary', label: 'Act 5', title: 'The Art of the Possible' },
  proof_points:          { icon: Award,      color: 'emerald', label: 'Act 6', title: "We've Done This Before" },
  call_to_action:        { icon: Handshake,  color: 'indigo',  label: 'Act 7', title: "Let's Explore Together" },
};

const SOURCE_BADGES = {
  thought_leadership: { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200',    label: 'Thought Leadership' },
  bank_data:          { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200',     label: 'Bank Data' },
  news:               { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'News' },
  case_study:         { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Case Study' },
};

const COLOR_MAP = {
  blue:    { border: 'border-blue-200',    bg: 'bg-blue-50',    headerText: 'text-blue-700',    chevron: 'text-blue-400',    accent: 'text-blue-600' },
  red:     { border: 'border-red-200',     bg: 'bg-red-50',     headerText: 'text-red-700',     chevron: 'text-red-400',     accent: 'text-red-600' },
  violet:  { border: 'border-violet-200',  bg: 'bg-violet-50',  headerText: 'text-violet-700',  chevron: 'text-violet-400',  accent: 'text-violet-600' },
  amber:   { border: 'border-amber-200',   bg: 'bg-amber-50',   headerText: 'text-amber-700',   chevron: 'text-amber-400',   accent: 'text-amber-600' },
  primary: { border: 'border-primary/20',  bg: 'bg-primary-50', headerText: 'text-primary',     chevron: 'text-primary/40',  accent: 'text-primary' },
  emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50', headerText: 'text-emerald-700', chevron: 'text-emerald-400', accent: 'text-emerald-600' },
  indigo:  { border: 'border-indigo-200',  bg: 'bg-indigo-50',  headerText: 'text-indigo-700',  chevron: 'text-indigo-400',  accent: 'text-indigo-600' },
};

// ═══════════════════════════════════════════════════
// MARKDOWN EXPORT
// ═══════════════════════════════════════════════════

function storylineToMarkdown(storyline, bankName) {
  const lines = [`# Discovery Storyline — ${bankName}`, ''];

  if (storyline.executiveSummary) {
    lines.push('## Executive Summary', '', storyline.executiveSummary, '');
  }
  if (storyline.bankSpecificHook) {
    lines.push('> **Opening Hook:** ' + storyline.bankSpecificHook, '');
  }

  if (storyline.acts?.length) {
    storyline.acts.forEach((act) => {
      const cfg = ACT_CONFIG[act.id] || {};
      lines.push(`## ${cfg.label || ''}: ${act.title || cfg.title || 'Untitled'}`, '');
      if (act.subtitle) lines.push(`*${act.subtitle}*`, '');
      if (act.narrative) lines.push(act.narrative, '');

      if (act.keyPoints?.length) {
        lines.push('### Key Points');
        act.keyPoints.forEach(kp => {
          const src = kp.source ? ` *(${kp.sourceType || 'source'}: ${kp.source})*` : '';
          lines.push(`- ${kp.point}${src}`);
        });
        lines.push('');
      }

      if (act.talkingPoints?.length) {
        lines.push('### Talking Points');
        act.talkingPoints.forEach(tp => lines.push(`- ${tp}`));
        lines.push('');
      }
    });
  }

  if (storyline.illustrativeRoi) {
    const roi = storyline.illustrativeRoi;
    lines.push('## Illustrative ROI', '');
    if (roi.headline) lines.push(`**${roi.headline}**`, '');
    if (roi.comparison) lines.push(roi.comparison, '');
    if (roi.levers?.length) {
      lines.push('| Lever | Range | Confidence | Basis |');
      lines.push('|-------|-------|------------|-------|');
      roi.levers.forEach(l => {
        lines.push(`| ${l.lever} | ${l.range} | ${l.confidence || '-'} | ${l.basis || '-'} |`);
      });
      lines.push('');
    }
    if (roi.caveats?.length) {
      lines.push('**Caveats:**');
      roi.caveats.forEach(c => lines.push(`- ${c}`));
      lines.push('');
    }
  }

  if (storyline.nextSteps) {
    const ns = storyline.nextSteps;
    lines.push('## Next Steps', '');
    if (ns.proposedApproach) lines.push(`**Approach:** ${ns.proposedApproach}`, '');
    if (ns.quickWins?.length) {
      lines.push('**Quick Wins:**');
      ns.quickWins.forEach(qw => lines.push(`- ${qw}`));
      lines.push('');
    }
    if (ns.timeline) lines.push(`**Timeline:** ${ns.timeline}`, '');
    if (ns.workshop) lines.push(`**Workshop:** ${ns.workshop}`, '');
  }

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════

function SourceBadge({ sourceType }) {
  const cfg = SOURCE_BADGES[sourceType] || SOURCE_BADGES.bank_data;
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
      {cfg.label}
    </span>
  );
}

function ActSection({ act, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = ACT_CONFIG[act.id] || {};
  const colors = COLOR_MAP[cfg.color] || COLOR_MAP.blue;
  const Icon = cfg.icon || BookOpen;

  return (
    <div className={`border ${colors.border} rounded-xl overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-4 py-3 ${colors.bg} text-left hover:brightness-95 transition-all`}
      >
        <div className={`w-6 h-6 rounded-full bg-white/60 flex items-center justify-center shrink-0`}>
          <Icon size={12} className={colors.accent} />
        </div>
        <span className={`text-[9px] font-bold ${colors.accent} opacity-70 uppercase`}>{cfg.label}</span>
        <span className={`flex-1 text-xs font-black ${colors.headerText} uppercase tracking-wider`}>
          {act.title || cfg.title}
        </span>
        {open ? <ChevronUp size={12} className={colors.chevron} /> : <ChevronDown size={12} className={colors.chevron} />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 space-y-3 bg-white">
          {/* Subtitle */}
          {act.subtitle && (
            <p className="text-[10px] italic text-fg-subtle/70">{act.subtitle}</p>
          )}

          {/* Narrative */}
          {act.narrative && (
            <p className="text-[11px] text-fg-subtle leading-relaxed whitespace-pre-line">
              {act.narrative}
            </p>
          )}

          {/* Key Points */}
          {act.keyPoints?.length > 0 && (
            <div className="space-y-1.5">
              <div className={`text-[9px] font-bold ${colors.accent} uppercase tracking-wider`}>Key Points</div>
              {act.keyPoints.map((kp, i) => (
                <div key={i} className="flex items-start gap-2 pl-1">
                  <ArrowRight size={9} className={`${colors.accent} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-fg leading-snug">{kp.point}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {kp.sourceType && <SourceBadge sourceType={kp.sourceType} />}
                      {kp.source && (
                        <span className="text-[8px] text-fg-subtle/60 truncate">{kp.source}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Talking Points */}
          {act.talkingPoints?.length > 0 && (
            <div className={`${colors.bg} border ${colors.border} rounded-lg p-3 space-y-1.5`}>
              <div className={`text-[9px] font-bold ${colors.accent} uppercase tracking-wider`}>Talking Points</div>
              {act.talkingPoints.map((tp, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Quote size={9} className={`${colors.accent} shrink-0 mt-0.5 opacity-60`} />
                  <span className="text-[11px] text-fg-subtle leading-snug">{tp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RoiPanel({ roi }) {
  if (!roi) return null;

  return (
    <div className="border border-emerald-200 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-50/50 to-green-50/30">
      <div className="px-4 py-3 bg-emerald-100/50 border-b border-emerald-200 flex items-center gap-2">
        <DollarSign size={14} className="text-emerald-600" />
        <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Illustrative ROI</span>
      </div>
      <div className="px-4 py-3 space-y-3">
        {/* Headline */}
        {roi.headline && (
          <div className="text-center py-2">
            <div className="text-lg font-black text-emerald-700">{roi.headline}</div>
            {roi.comparison && (
              <p className="text-[10px] text-emerald-600/70 mt-0.5">{roi.comparison}</p>
            )}
          </div>
        )}

        {/* Levers */}
        {roi.levers?.length > 0 && (
          <div className="space-y-1">
            {roi.levers.map((lever, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-emerald-100">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-fg truncate">{lever.lever}</div>
                  <div className="text-[10px] text-fg-subtle">{lever.range}</div>
                </div>
                {lever.confidence && (
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                    lever.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' :
                    lever.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {lever.confidence}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Caveats */}
        {roi.caveats?.length > 0 && (
          <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle size={10} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              {roi.caveats.map((c, i) => (
                <p key={i} className="text-[9px] text-amber-700">{c}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NextStepsPanel({ nextSteps }) {
  if (!nextSteps) return null;

  return (
    <div className="border border-indigo-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200 flex items-center gap-2">
        <Handshake size={14} className="text-indigo-600" />
        <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">Proposed Next Steps</span>
      </div>
      <div className="px-4 py-3 space-y-3 bg-white">
        {nextSteps.proposedApproach && (
          <div>
            <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Approach</div>
            <p className="text-[11px] text-fg leading-relaxed">{nextSteps.proposedApproach}</p>
          </div>
        )}

        {nextSteps.quickWins?.length > 0 && (
          <div>
            <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Quick Wins</div>
            <div className="space-y-1">
              {nextSteps.quickWins.map((qw, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Sparkles size={9} className="text-indigo-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-fg-subtle leading-snug">{qw}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {nextSteps.timeline && (
            <div className="flex-1 bg-indigo-50 border border-indigo-100 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-0.5">
                <Clock size={9} className="text-indigo-500" />
                <span className="text-[8px] font-bold text-indigo-600 uppercase">Timeline</span>
              </div>
              <p className="text-[10px] text-indigo-700">{nextSteps.timeline}</p>
            </div>
          )}
          {nextSteps.workshop && (
            <div className="flex-1 bg-violet-50 border border-violet-100 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-0.5">
                <Users size={9} className="text-violet-500" />
                <span className="text-[8px] font-bold text-violet-600 uppercase">Workshop</span>
              </div>
              <p className="text-[10px] text-violet-700">{nextSteps.workshop}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

/**
 * DiscoveryStoryline — 7-Act persuasive narrative for first discovery meeting.
 *
 * Props:
 * - storyline:        Cached storyline data from API (or null)
 * - bankName:         Bank display name
 * - onGenerate:       () => Promise<void> — triggers AI generation
 * - isGenerating:     boolean — loading state
 * - researchAvailable: boolean — whether ANTHROPIC_API_KEY is set
 */
export default function DiscoveryStoryline({ storyline, bankName, onGenerate, isGenerating, researchAvailable, error }) {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Parse the storyline from the API response
  const data = storyline?.storyline || null;

  // ── EMPTY STATE: no storyline yet ──
  if (!data && !isGenerating) {
    return (
      <div className="mb-6 rounded-xl border-2 border-dashed border-teal-200 bg-gradient-to-br from-teal-50/30 to-cyan-50/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <BookOpen size={18} className="text-teal-600" />
            </div>
            <div>
              <div className="text-sm font-black text-teal-800 tracking-wide">Discovery Meeting Storyline</div>
              <div className="text-[10px] text-teal-600/70">
                Generate a 7-act persuasive narrative with market context, pain points, case studies & illustrative ROI
              </div>
            </div>
          </div>
          {researchAvailable ? (
            <button
              onClick={onGenerate}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg text-xs font-bold hover:shadow-lg hover:shadow-teal-200 transition-all active:scale-95"
            >
              <Sparkles size={12} />
              Generate Storyline
            </button>
          ) : (
            <div className="text-[10px] text-fg-subtle italic">Set ANTHROPIC_API_KEY to enable</div>
          )}
        </div>
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-sm">⚠</span>
              <span className="text-[11px] font-bold text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── LOADING STATE ──
  if (isGenerating) {
    return (
      <div className="mb-6 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/30 to-cyan-50/20 p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <Loader2 size={18} className="text-teal-600 animate-spin" />
            </div>
            <div className="absolute -inset-1 rounded-full border-2 border-teal-300/40 animate-ping" />
          </div>
          <div>
            <div className="text-sm font-black text-teal-800 tracking-wide">Building Discovery Storyline...</div>
            <div className="text-[10px] text-teal-600/70">
              Researching {bankName}, analyzing market trends, matching case studies & building ROI narrative
            </div>
            <div className="flex items-center gap-3 mt-2">
              {['Market Research', 'Pain Analysis', 'Case Matching', 'ROI Modeling', 'Narrative'].map((step, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                  <span className="text-[8px] text-teal-500 font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── DISMISSED STATE ──
  if (dismissed) {
    return (
      <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-teal-600" />
            <span className="text-xs font-bold text-teal-700">Discovery Storyline</span>
            <span className="text-[9px] text-teal-500">
              {data.generatedAt ? `Generated ${new Date(data.generatedAt).toLocaleDateString()}` : 'Available'}
            </span>
          </div>
          <button
            onClick={() => setDismissed(false)}
            className="text-[10px] font-bold text-teal-600 hover:text-teal-800 transition-colors"
          >
            Show
          </button>
        </div>
      </div>
    );
  }

  // ── COPY HANDLER ──
  const copyStoryline = async () => {
    try {
      const md = storylineToMarkdown(data, bankName);
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (copyErr) {
      console.error('Failed to copy storyline:', copyErr);
    }
  };

  const acts = data.acts || [];
  const metaInfo = data._meta || {};

  return (
    <div className="mb-6 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/20 to-cyan-50/10 overflow-hidden shadow-lg shadow-teal-100/50">
      {/* ══════════════════════════════════════
          GRADIENT HEADER
         ══════════════════════════════════════ */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <BookOpen size={16} />
          </div>
          <div>
            <div className="text-sm font-black tracking-wide">Discovery Storyline</div>
            <div className="text-[10px] text-white/70">
              {bankName}
              {data.generatedAt && ` — ${new Date(data.generatedAt).toLocaleDateString()}`}
              {metaInfo.newsArticles > 0 && ` — ${metaInfo.newsArticles} sources`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onGenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold transition-colors"
            title="Regenerate storyline"
          >
            <Sparkles size={10} />
            Regenerate
          </button>
          <button
            onClick={copyStoryline}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold transition-colors"
          >
            {copied ? <><Check size={10} /> Copied!</> : <><Copy size={10} /> Copy</>}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Minimize"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* ══════════════════════════════════════
            EXECUTIVE SUMMARY BANNER
           ══════════════════════════════════════ */}
        {data.executiveSummary && (
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4">
            <div className="text-[9px] font-bold text-teal-600 uppercase tracking-wider mb-1">Executive Summary</div>
            <p className="text-[12px] text-teal-900 leading-relaxed font-medium">{data.executiveSummary}</p>
          </div>
        )}

        {/* ══════════════════════════════════════
            BANK-SPECIFIC HOOK
           ══════════════════════════════════════ */}
        {data.bankSpecificHook && (
          <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <Quote size={12} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">Opening Hook</div>
              <p className="text-[11px] text-amber-800 leading-relaxed italic">{data.bankSpecificHook}</p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            7 ACT SECTIONS
           ══════════════════════════════════════ */}
        {acts.map((act, i) => (
          <ActSection
            key={act.id || i}
            act={act}
            defaultOpen={i < 2}
          />
        ))}

        {/* ══════════════════════════════════════
            ILLUSTRATIVE ROI PANEL
           ══════════════════════════════════════ */}
        <RoiPanel roi={data.illustrativeRoi} />

        {/* ══════════════════════════════════════
            NEXT STEPS PANEL
           ══════════════════════════════════════ */}
        <NextStepsPanel nextSteps={data.nextSteps} />

        {/* ══════════════════════════════════════
            META FOOTER
           ══════════════════════════════════════ */}
        {metaInfo.source && (
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-teal-100">
            {metaInfo.durationMs && (
              <span className="text-[8px] text-fg-subtle/50">
                Generated in {(metaInfo.durationMs / 1000).toFixed(1)}s
              </span>
            )}
            {metaInfo.lobsAnalyzed?.length > 0 && (
              <span className="text-[8px] text-fg-subtle/50">
                LOBs: {metaInfo.lobsAnalyzed.join(', ')}
              </span>
            )}
            {metaInfo.caseStudiesMatched > 0 && (
              <span className="text-[8px] text-fg-subtle/50">
                {metaInfo.caseStudiesMatched} case studies matched
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
