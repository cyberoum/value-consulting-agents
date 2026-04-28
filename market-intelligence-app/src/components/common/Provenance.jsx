/**
 * Provenance — Sprint 3.2
 * ───────────────────────
 * Universal provenance chip for any Nova-rendered claim. Pair this with
 * EVERY visible fact so the AE can see (and click through to) the source
 * authority behind every cell. The moat thesis: claims without provenance
 * are indistinguishable from prose; claims WITH provenance are not.
 *
 * Two visual modes:
 *   - mode="chip" (default): compact inline tier+grade chips, hover for details
 *   - mode="card":           expanded card with publisher + date + click-through
 *
 * Two dimensions surfaced:
 *   - tier  (1/2/3 → Verified/Inferred/Estimated): how the FACT was derived
 *   - grade (A/B/C/D): the SOURCE's authority level
 *
 * A tier-1 fact from a grade-D source is not the same as a tier-1 fact from
 * a grade-A source. Both dimensions matter; this component shows both.
 *
 * Source shape (matches what pulseGenerator + meeting_facts + deal_signals emit):
 *   {
 *     source_type:      string,    // 'meeting' | 'news' | 'internal' | 'manual' | 'meeting_fact' | ...
 *     source_url:       string?,   // click-through URL (omit if internal)
 *     source_date:      string?,   // ISO date or YYYY-MM-DD
 *     confidence_tier:  1|2|3,     // 1=Verified, 2=Inferred, 3=Estimated
 *     source_grade:     'A'|'B'|'C'|'D'?,  // auto-graded by sourceGrader.mjs (optional)
 *     publisher_name:   string?,   // parsed publisher (e.g., 'Reuters')
 *     verifier:         string?,   // 'auto' | 'ae_logged' | 'ae_confirmed'
 *     label:            string?,   // human-readable description of this source
 *     evidence_quote:   string?,   // verbatim excerpt (for meeting facts)
 *     reason:           string?,   // grader reason (e.g., 'tier1_press', 'unmatched_news')
 *   }
 */

import { useState } from 'react';
import { ExternalLink, Quote, AlertTriangle, ShieldCheck } from 'lucide-react';

const TIER_META = {
  1: { label: 'T1 Verified',  tone: 'bg-emerald-600 text-white' },
  2: { label: 'T2 Inferred',  tone: 'bg-amber-500 text-white' },
  3: { label: 'T3 Estimated', tone: 'bg-rose-400 text-white' },
};

const GRADE_META = {
  A: { label: 'A · Primary',     tone: 'bg-slate-900 text-white border-slate-900',     description: 'Bank/regulator/AE-witnessed' },
  B: { label: 'B · Tier-1 Press', tone: 'bg-blue-700 text-white border-blue-700',       description: 'Reuters / Bloomberg / FT / national press' },
  C: { label: 'C · Trade Press',  tone: 'bg-slate-200 text-slate-800 border-slate-300', description: 'Sector trades, aggregators, unprofiled news' },
  D: { label: 'D · Low Authority', tone: 'bg-rose-100 text-rose-800 border-rose-300',   description: 'Social, blogs, individual publishers' },
};

const VERIFIER_META = {
  auto:         { label: 'auto-extracted', tone: 'text-slate-500' },
  ae_logged:    { label: 'AE-logged',      tone: 'text-emerald-700' },
  ae_confirmed: { label: 'AE-confirmed',   tone: 'text-emerald-700' },
};

function shortDate(d) {
  if (!d) return null;
  const s = String(d).slice(0, 10);
  return s;
}

/**
 * Compact chip cluster: tier + grade + (optional) date. Hover surfaces full card.
 */
export function ProvenanceChip({ source, showGrade = true, showDate = true, size = 'xs' }) {
  const [hover, setHover] = useState(false);
  if (!source) return null;
  const tier = TIER_META[source.confidence_tier];
  const grade = source.source_grade && GRADE_META[source.source_grade];
  const date = showDate ? shortDate(source.source_date) : null;
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[8px]';
  const px = size === 'sm' ? 'px-1.5 py-0.5' : 'px-1 py-px';

  return (
    <span className="relative inline-flex items-center gap-1"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}>
      {tier && (
        <span className={`inline-flex items-center gap-0.5 ${px} rounded-full ${textSize} font-bold uppercase tracking-wider ${tier.tone}`}>
          {tier.label}
        </span>
      )}
      {showGrade && grade && (
        <span className={`inline-flex items-center gap-0.5 ${px} rounded ${textSize} font-bold border ${grade.tone}`}>
          {source.source_grade}
        </span>
      )}
      {date && <span className="text-[9px] text-slate-500">· {date}</span>}
      {hover && <ProvenanceHoverCard source={source} />}
    </span>
  );
}

/**
 * Detailed hover card. Shows publisher, full date, evidence quote, click-through.
 */
function ProvenanceHoverCard({ source }) {
  const tier = TIER_META[source.confidence_tier];
  const grade = source.source_grade && GRADE_META[source.source_grade];
  const verifier = source.verifier && VERIFIER_META[source.verifier];

  return (
    <div className="absolute z-50 left-0 top-full mt-1 w-72 p-2.5 bg-white border border-slate-300 rounded-lg shadow-lg text-left">
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        {tier && <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${tier.tone}`}>{tier.label}</span>}
        {grade && (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${grade.tone}`} title={grade.description}>
            {grade.label}
          </span>
        )}
        {source.source_grade === 'A' && <ShieldCheck size={11} className="text-emerald-600" />}
        {source.source_grade === 'D' && <AlertTriangle size={11} className="text-rose-600" />}
      </div>

      {source.label && (
        <div className="text-[10px] font-semibold text-slate-800 mb-1 leading-snug">{source.label}</div>
      )}

      {source.publisher_name && (
        <div className="text-[10px] text-slate-700 mb-0.5">
          <span className="text-slate-400">Publisher: </span>{source.publisher_name}
        </div>
      )}
      {source.source_type && (
        <div className="text-[10px] text-slate-700 mb-0.5">
          <span className="text-slate-400">Type: </span>{source.source_type}
        </div>
      )}
      {shortDate(source.source_date) && (
        <div className="text-[10px] text-slate-700 mb-0.5">
          <span className="text-slate-400">Date: </span>{shortDate(source.source_date)}
        </div>
      )}
      {verifier && (
        <div className={`text-[10px] mb-0.5 ${verifier.tone}`}>
          <span className="text-slate-400">Verifier: </span>{verifier.label}
        </div>
      )}
      {source.reason && (
        <div className="text-[9px] text-slate-500 italic mt-0.5">grader: {source.reason}</div>
      )}

      {source.evidence_quote && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-200">
          <div className="flex items-start gap-1">
            <Quote size={9} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <span className="text-[10px] italic text-slate-700 leading-snug">"{source.evidence_quote}"</span>
          </div>
        </div>
      )}

      {source.source_url && (
        <a href={source.source_url} target="_blank" rel="noopener noreferrer"
           className="mt-1.5 pt-1.5 border-t border-slate-200 inline-flex items-center gap-1 text-[10px] text-blue-700 hover:underline">
          <ExternalLink size={9} /> Open source
        </a>
      )}
    </div>
  );
}

/**
 * Inline list of multiple sources — used by SourceList in PulsePage.
 * Renders chips compactly, with the same hover behavior on each.
 */
export function ProvenanceList({ sources = [], maxVisible = null, showGrade = true }) {
  if (!sources.length) {
    return <div className="text-[10px] italic text-slate-500">No sources for this claim.</div>;
  }
  const visible = maxVisible ? sources.slice(0, maxVisible) : sources;
  const hidden = sources.length - visible.length;
  return (
    <ul className="space-y-1">
      {visible.map((s, i) => (
        <li key={i} className="flex items-start gap-1.5">
          <ProvenanceChip source={s} showGrade={showGrade} />
          {s.label && <span className="text-[10px] text-slate-700 leading-snug">{s.label}</span>}
        </li>
      ))}
      {hidden > 0 && (
        <li className="text-[10px] italic text-slate-500">+ {hidden} more source{hidden === 1 ? '' : 's'}</li>
      )}
    </ul>
  );
}

/**
 * Default export: ProvenanceChip (the most common usage pattern).
 */
export default ProvenanceChip;
