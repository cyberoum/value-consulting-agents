/**
 * StakeholderIntelView — shows all play outputs targeting a specific person.
 * Filters play_outputs where stakeholder_id matches, grouped by play type.
 */
import { useState, useEffect } from 'react';
import { X, Loader, Zap } from 'lucide-react';
import { getPlays, getPlayOutputs } from '../../data/api';
import { PLAY_TYPES, OUTPUT_TYPES } from '../../data/intelligenceLayer';
import OutputCard from './OutputCard';

export default function StakeholderIntelView({ dealId, stakeholderName, onClose }) {
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const plays = await getPlays(dealId);
        const allOutputs = [];
        for (const play of plays) {
          const playOutputs = await getPlayOutputs(play.id);
          playOutputs
            .filter(o => o.stakeholder_id === stakeholderName || (o.content || '').includes(stakeholderName))
            .forEach(o => allOutputs.push({ ...o, play_type: play.play_type, play_id: play.id }));
        }
        setOutputs(allOutputs);
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [dealId, stakeholderName]);

  // Group by play type
  const grouped = {};
  outputs.forEach(o => {
    const key = o.play_type || 'other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(o);
  });

  return (
    <div className="bg-white rounded-[var(--il-radius)] border border-slate-200 shadow-[var(--color-il-card-shadow)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--color-il-accent-light)] border-b border-[var(--color-il-accent-border)]">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-[var(--color-il-accent)]" />
          <span className="text-xs font-bold text-[var(--color-il-accent)]">Intelligence for {stakeholderName}</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
      </div>

      <div className="p-4 max-h-[60vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center gap-2 py-6 justify-center text-slate-400 text-xs"><Loader size={14} className="animate-spin" /> Searching outputs...</div>
        ) : outputs.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-slate-400">No intelligence outputs found for {stakeholderName}.</p>
            <p className="text-[10px] text-slate-300 mt-1">Generate play outputs that target this stakeholder to see them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([playType, typeOutputs]) => {
              const pt = PLAY_TYPES[playType] || {};
              return (
                <div key={playType}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{pt.icon || '📋'}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{pt.label || playType}</span>
                    <span className="text-[9px] text-slate-300">{typeOutputs.length} output{typeOutputs.length > 1 ? 's' : ''}</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    {typeOutputs.map(output => (
                      <OutputCard key={output.id} output={output} playId={output.play_id} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
