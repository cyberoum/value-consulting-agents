import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Loader, MessageSquare, Zap, Brain } from 'lucide-react';
import { getPlays, getPlayOutputs, submitOutputFeedback, createSignal, recalculateDealTwin } from '../../data/api';

const OUTCOMES = [
  { key: 'progressed', label: 'Progressed', icon: '✅', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { key: 'neutral', label: 'Neutral', icon: '➡️', color: 'bg-slate-50 border-slate-200 text-slate-600' },
  { key: 'setback', label: 'Setback', icon: '⚠️', color: 'bg-red-50 border-red-200 text-red-600' },
];

const FEEDBACK_OPTIONS = [
  { key: 'landed', label: 'Landed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'partially_landed', label: 'Partial', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'missed', label: 'Missed', color: 'bg-red-50 text-red-700 border-red-200' },
  { key: 'not_used', label: 'Not Used', color: 'bg-slate-50 text-slate-400 border-slate-200' },
];

export default function PostMeetingCapture({ dealId, meetingId, onComplete, onDismiss }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 state
  const [outcome, setOutcome] = useState(null);
  const [outcomeSummary, setOutcomeSummary] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  // Step 2 state
  const [availableOutputs, setAvailableOutputs] = useState([]);
  const [outputFeedback, setOutputFeedback] = useState({});

  // Step 3 state
  const [newIntelligence, setNewIntelligence] = useState('');
  const [prepRequest, setPrepRequest] = useState('');

  // Fetch available play outputs
  useEffect(() => {
    (async () => {
      try {
        const plays = await getPlays(dealId);
        const allOutputs = [];
        for (const play of plays) {
          const outputs = await getPlayOutputs(play.id);
          outputs.forEach(o => allOutputs.push({ ...o, play_type: play.play_type, play_id: play.id }));
        }
        setAvailableOutputs(allOutputs);
      } catch { /* silent */ }
    })();
  }, [dealId]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Step 2: Submit feedback for each rated output
      for (const [outputId, fb] of Object.entries(outputFeedback)) {
        if (fb) {
          const output = availableOutputs.find(o => o.id === outputId);
          if (output) {
            await submitOutputFeedback(output.play_id, outputId, {
              feedback_type: fb,
              meeting_id: meetingId,
            });
          }
        }
      }

      // Step 1: Create momentum signal from outcome
      if (outcome) {
        await createSignal(dealId, {
          signal_category: 'momentum',
          signal_event: 'MeetingCompleted',
          title: `Meeting ${outcome}: ${outcomeSummary || 'No summary'}`,
          description: nextSteps ? `Next steps: ${nextSteps}` : null,
          source_type: 'meeting',
          severity: outcome === 'setback' ? 'attention' : 'info',
        });
      }

      // Step 3: Create signal from new intelligence
      if (newIntelligence.trim()) {
        await createSignal(dealId, {
          signal_category: 'momentum',
          signal_event: 'MeetingCompleted',
          title: newIntelligence.substring(0, 100),
          description: newIntelligence,
          source_type: 'meeting',
          severity: 'info',
        });
      }

      // Trigger Deal Twin recalculation
      recalculateDealTwin(dealId).catch(() => {}); // Fire and forget

      onComplete?.();
    } catch { /* silent */ }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-[var(--il-radius)] border border-[var(--color-il-accent-border)] shadow-[var(--color-il-card-shadow)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-il-accent-light)]">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-[var(--color-il-accent)]" />
          <span className="text-xs font-bold text-[var(--color-il-accent)]">Post-Meeting Capture</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-400">Step {step} of 3</span>
          {onDismiss && <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div className="h-full bg-[var(--color-il-accent)] transition-all" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <div className="p-4">
        {/* Step 1: Outcome */}
        {step === 1 && (
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-3">How did the meeting go?</h4>
            <div className="flex gap-2 mb-3">
              {OUTCOMES.map(o => (
                <button key={o.key} onClick={() => setOutcome(o.key)}
                  className={`flex-1 p-2.5 rounded-lg border-2 text-center transition-all ${
                    outcome === o.key ? o.color + ' border-current' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}>
                  <div className="text-lg mb-0.5">{o.icon}</div>
                  <div className="text-[10px] font-bold">{o.label}</div>
                </button>
              ))}
            </div>
            <input value={outcomeSummary} onChange={e => setOutcomeSummary(e.target.value)} placeholder="Quick summary (optional)"
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-[var(--color-il-accent)] mb-2" />
            <input value={nextSteps} onChange={e => setNextSteps(e.target.value)} placeholder="Agreed next steps (optional)"
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-[var(--color-il-accent)]" />
          </div>
        )}

        {/* Step 2: Output feedback */}
        {step === 2 && (
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-3">What outputs did you use?</h4>
            {availableOutputs.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">No play outputs were available before this meeting.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableOutputs.map(output => (
                  <div key={output.id} className="p-2 bg-slate-50 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-600 mb-1">{output.title}</div>
                    <div className="flex gap-1">
                      {FEEDBACK_OPTIONS.map(fb => (
                        <button key={fb.key} onClick={() => setOutputFeedback(prev => ({ ...prev, [output.id]: fb.key }))}
                          className={`px-2 py-0.5 rounded text-[8px] font-bold border transition-colors ${
                            outputFeedback[output.id] === fb.key ? fb.color : 'bg-white border-slate-100 text-slate-300'
                          }`}>
                          {fb.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: New intelligence */}
        {step === 3 && (
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-3">What did you learn?</h4>
            <div className="space-y-2">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Most important new intelligence</label>
                <textarea value={newIntelligence} onChange={e => setNewIntelligence(e.target.value)} rows={2}
                  placeholder="What's the most important thing you learned?"
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-[var(--color-il-accent)] resize-none" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">What should Nova prepare next?</label>
                <textarea value={prepRequest} onChange={e => setPrepRequest(e.target.value)} rows={2}
                  placeholder="What do you need for the next interaction?"
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-[var(--color-il-accent)] resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-2 mt-4">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft size={12} /> Back
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[var(--color-il-accent)] hover:opacity-90 transition-opacity">
              Next <ArrowRight size={12} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[var(--color-il-accent)] hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
              {saving ? 'Saving...' : 'Complete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
