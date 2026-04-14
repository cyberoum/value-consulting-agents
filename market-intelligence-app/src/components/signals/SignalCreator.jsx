import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { createSignal } from '../../data/api';
import { SIGNAL_CATALOGUE, SIGNAL_SEVERITY } from '../../data/intelligenceLayer';

export default function SignalCreator({ dealId, onCreated, onClose }) {
  const [form, setForm] = useState({
    signal_category: 'stakeholder',
    signal_event: '',
    title: '',
    description: '',
    severity: 'info',
    source_url: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const cat = SIGNAL_CATALOGUE[form.signal_category];
  const events = cat ? Object.entries(cat.events) : [];

  const handleSubmit = async () => {
    if (!form.title || !form.signal_event) return;
    setSaving(true);
    try {
      await createSignal(dealId, form);
      onCreated?.();
      onClose?.();
    } catch { /* silent */ }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-[var(--il-radius)] border border-slate-200 p-4 shadow-[var(--color-il-card-shadow)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-700">Add Signal</span>
        {onClose && <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>}
      </div>

      <div className="space-y-2.5">
        {/* Category */}
        <div className="flex gap-1 flex-wrap">
          {Object.entries(SIGNAL_CATALOGUE).map(([key, c]) => (
            <button key={key} onClick={() => { set('signal_category', key); set('signal_event', ''); }}
              className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${
                form.signal_category === key ? 'bg-[var(--color-il-accent)] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Event type */}
        <select value={form.signal_event} onChange={e => set('signal_event', e.target.value)}
          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-[var(--color-il-accent)]">
          <option value="">Select event type...</option>
          {events.map(([key, desc]) => <option key={key} value={key}>{key.replace(/([A-Z])/g, ' $1').trim()} — {desc}</option>)}
        </select>

        {/* Title */}
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Signal headline..."
          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-[var(--color-il-accent)]" />

        {/* Description */}
        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Details (optional)..." rows={2}
          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-[var(--color-il-accent)] resize-none" />

        {/* Severity */}
        <div className="flex gap-1">
          {Object.entries(SIGNAL_SEVERITY).map(([key, sev]) => (
            <button key={key} onClick={() => set('severity', key)}
              className={`flex-1 px-2 py-1.5 rounded text-[9px] font-bold transition-colors ${
                form.severity === key ? `text-white` : 'bg-slate-50 text-slate-400'
              }`}
              style={form.severity === key ? { backgroundColor: sev.color } : {}}>
              {sev.label}
            </button>
          ))}
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!form.title || !form.signal_event || saving}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-[var(--color-il-accent)] hover:opacity-90 disabled:opacity-50 transition-opacity">
          <Send size={12} /> {saving ? 'Saving...' : 'Add Signal'}
        </button>
      </div>
    </div>
  );
}
