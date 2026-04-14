/**
 * IntelligenceOnboarding — first-time walkthrough for Intelligence Layer features.
 * Shows 4 steps explaining Plays, Signals, Deal Health, and Feedback Loop.
 * Remembers completion in localStorage.
 */
import { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Zap, AlertTriangle, TrendingUp, MessageSquare } from 'lucide-react';

const STORAGE_KEY = 'nova-intel-onboarding-seen';

const STEPS = [
  {
    icon: Zap,
    title: 'Deal Plays',
    description: 'Plays are named intelligence workflows for each stage of your deal. Activate a Discovery Play to generate stakeholder briefs and targeted questions. As the deal progresses, activate Value, Competitive, and Proposal plays — each builds on the last.',
    tip: 'Start with a Discovery Play for every new prospect.',
  },
  {
    icon: AlertTriangle,
    title: 'Deal Signals',
    description: 'Signals are deal-relevant events that trigger updates. When a stakeholder changes role, a competitor wins a peer deal, or a meeting gets cancelled — Nova detects it and routes it to your active plays.',
    tip: 'Add signals manually or they\'ll appear automatically as the pipeline runs.',
  },
  {
    icon: TrendingUp,
    title: 'Deal Health',
    description: 'The Deal Twin scores your deal across 6 dimensions: stakeholder alignment, strategic fit, competitive position, momentum, value clarity, and information completeness. The score improves as you generate plays and log meetings.',
    tip: 'Click "Recalculate" after major deal events to update the score.',
  },
  {
    icon: MessageSquare,
    title: 'Feedback Loop',
    description: 'After each meeting, Nova asks what outputs you used and how they landed. This feedback makes future generations smarter — talking points that "landed" get reinforced, ones that "missed" get adjusted.',
    tip: 'Spend 2 minutes on post-meeting feedback — it compounds.',
  },
];

export default function IntelligenceOnboarding() {
  const [seen] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  });
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(seen);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* silent */ }
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="mb-4 bg-white rounded-[var(--il-radius)] border border-[var(--color-il-accent-border)] shadow-[var(--color-il-card-shadow)] overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div className="h-full bg-[var(--color-il-accent)] transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-il-accent-light)] flex items-center justify-center shrink-0">
            <Icon size={16} className="text-[var(--color-il-accent)]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-slate-800">{current.title}</h4>
              <button onClick={handleDismiss} className="text-slate-300 hover:text-slate-500"><X size={14} /></button>
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed mb-2">{current.description}</p>
            <p className="text-[9px] text-[var(--color-il-accent)] font-bold italic">{current.tip}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-[var(--color-il-accent)]' : 'bg-slate-200'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                className="flex items-center gap-0.5 text-[9px] font-bold text-slate-400 hover:text-slate-600">
                <ArrowLeft size={10} /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(step + 1)}
                className="flex items-center gap-0.5 px-2.5 py-1 rounded text-[9px] font-bold text-white bg-[var(--color-il-accent)] hover:opacity-90">
                Next <ArrowRight size={10} />
              </button>
            ) : (
              <button onClick={handleDismiss}
                className="flex items-center gap-0.5 px-2.5 py-1 rounded text-[9px] font-bold text-white bg-[var(--color-il-accent)] hover:opacity-90">
                Got it!
              </button>
            )}
            <button onClick={handleDismiss} className="text-[9px] text-slate-300 hover:text-slate-500">Skip</button>
          </div>
        </div>
      </div>
    </div>
  );
}
