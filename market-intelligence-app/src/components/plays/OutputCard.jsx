import { useState } from 'react';
import { Copy, Check, User, Clock } from 'lucide-react';
import { OUTPUT_TYPES } from '../../data/intelligenceLayer';
import OutputFeedbackButtons from './OutputFeedbackButtons';

const TIER_BADGE = {
  verified: { label: 'Verified', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inferred: { label: 'Inferred', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  stale: { label: 'Stale', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function OutputCard({ output, playId, onFeedbackUpdated }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(output.feedback);
  const ot = OUTPUT_TYPES[output.output_type] || {};
  const tier = TIER_BADGE[output.confidence_tier] || TIER_BADGE.inferred;

  const handleCopy = () => {
    navigator.clipboard.writeText(output.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-[var(--il-radius)] border border-slate-100 shadow-[var(--color-il-card-shadow)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
        <span className="text-sm">{ot.icon || '📄'}</span>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex-1">{ot.label || output.output_type}</span>
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${tier.bg}`}>{tier.label}</span>
        {output.stakeholder_id && (
          <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">
            <User size={8} /> {output.stakeholder_id}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-3 py-3">
        <h4 className="text-xs font-bold text-slate-800 mb-1.5">{output.title}</h4>
        <div className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
          {output.content}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100 bg-slate-50/50">
        <OutputFeedbackButtons
          playId={playId}
          outputId={output.id}
          currentFeedback={feedback}
          onUpdated={(fb) => { setFeedback(fb); onFeedbackUpdated?.(output.id, fb); }}
        />
        <div className="flex-1" />
        <button onClick={handleCopy}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-400 hover:text-[var(--color-il-accent)] bg-white border border-slate-100 hover:border-slate-200 transition-colors">
          {copied ? <><Check size={8} /> Copied</> : <><Copy size={8} /> Copy</>}
        </button>
        <span className="text-[8px] text-slate-300"><Clock size={8} className="inline" /> {new Date(output.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
