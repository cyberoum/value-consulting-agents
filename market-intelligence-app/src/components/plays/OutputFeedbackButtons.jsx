import { useState } from 'react';
import { Check, Circle, X, Minus } from 'lucide-react';
import { updatePlayOutput } from '../../data/api';

const FEEDBACK_OPTIONS = [
  { key: 'landed', label: 'Landed', icon: Check, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { key: 'partially_landed', label: 'Partial', icon: Circle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { key: 'missed', label: 'Missed', icon: X, color: 'text-red-600 bg-red-50 border-red-200' },
  { key: 'not_used', label: 'Not Used', icon: Minus, color: 'text-slate-400 bg-slate-50 border-slate-200' },
];

export default function OutputFeedbackButtons({ playId, outputId, currentFeedback, onUpdated }) {
  const [saving, setSaving] = useState(false);

  const handleFeedback = async (feedbackType) => {
    setSaving(true);
    try {
      await updatePlayOutput(playId, outputId, { feedback: feedbackType });
      onUpdated?.(feedbackType);
    } catch { /* silent */ }
    setSaving(false);
  };

  return (
    <div className="flex gap-1">
      {FEEDBACK_OPTIONS.map(opt => {
        const Icon = opt.icon;
        const isActive = currentFeedback === opt.key;
        return (
          <button key={opt.key} onClick={() => handleFeedback(opt.key)} disabled={saving}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[8px] font-bold transition-all ${
              isActive ? opt.color : 'text-slate-300 bg-white border-slate-100 hover:border-slate-200'
            }`}>
            <Icon size={8} /> {opt.label}
          </button>
        );
      })}
    </div>
  );
}
