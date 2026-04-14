import { useState } from 'react';
import { X, Loader, Zap } from 'lucide-react';
import { createPlay } from '../../data/api';
import { PLAY_TYPES } from '../../data/intelligenceLayer';

export default function PlayActivator({ dealId, existingTypes = [], onCreated, onClose }) {
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!selected) return;
    setCreating(true);
    try {
      await createPlay(dealId, { play_type: selected });
      onCreated?.();
    } catch { /* silent */ }
    setCreating(false);
  };

  return (
    <div className="mt-3 bg-white rounded-[var(--il-radius)] border border-slate-200 p-4 shadow-[var(--color-il-card-shadow)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-700">Activate a Play</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        {Object.entries(PLAY_TYPES).map(([key, pt]) => {
          const isExisting = existingTypes.includes(key);
          const isSelected = selected === key;
          return (
            <button key={key}
              onClick={() => !isExisting && setSelected(key)}
              disabled={isExisting}
              className={`text-left p-3 rounded-lg border-2 transition-all ${
                isExisting ? 'border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed'
                : isSelected ? 'border-[var(--color-il-accent)] bg-[var(--color-il-accent-light)]'
                : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{pt.icon}</span>
                <span className="text-xs font-bold text-slate-700">{pt.label}</span>
                {isExisting && <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Active</span>}
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">{pt.description}</p>
            </button>
          );
        })}
      </div>

      <button onClick={handleCreate} disabled={!selected || creating}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-[var(--color-il-accent)] hover:opacity-90 disabled:opacity-50 transition-opacity">
        {creating ? <Loader size={12} className="animate-spin" /> : <Zap size={12} />}
        {creating ? 'Activating...' : selected ? `Activate ${PLAY_TYPES[selected]?.label}` : 'Select a play type'}
      </button>
    </div>
  );
}
