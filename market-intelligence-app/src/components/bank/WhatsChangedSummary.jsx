/**
 * WhatsChangedSummary — evolved version of WhatsChangedCard.
 * Shows signal summary when deal signals exist, falls back to
 * the pipeline-detected changes (WhatsChangedCard behavior) otherwise.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Zap, RefreshCw } from 'lucide-react';
import { getSignalSummary } from '../../data/api';
import { SIGNAL_CATALOGUE } from '../../data/intelligenceLayer';

export default function WhatsChangedSummary({ bankKey }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getSignalSummary(bankKey).then(setSummary).catch(() => {});
  }, [bankKey]);

  if (!summary || summary.total === 0) return null; // No signals — let parent render original WhatsChangedCard

  const { unacknowledged, by_category, recent, plays_with_stale_outputs } = summary;
  if (unacknowledged === 0 && plays_with_stale_outputs === 0) return null;

  const categoryEntries = Object.entries(by_category || {}).filter(([, c]) => c > 0);

  return (
    <div className="p-3 bg-[var(--color-il-accent-light)] border border-[var(--color-il-accent-border)] rounded-[var(--il-radius)] mb-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Zap size={12} className="text-[var(--color-il-accent)]" />
        <span className="text-[10px] font-bold text-[var(--color-il-accent)]">Since your last visit</span>
      </div>

      {/* Signal count by category */}
      {categoryEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {categoryEntries.map(([cat, count]) => {
            const cfg = SIGNAL_CATALOGUE[cat];
            return (
              <span key={cat} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/80 text-slate-600">
                {cfg?.icon} {count} {cfg?.label || cat}
              </span>
            );
          })}
        </div>
      )}

      {/* Most important signal */}
      {recent?.[0] && (
        <div className="text-[10px] text-slate-600 mb-1.5">
          <span className="font-bold">{recent[0].title}</span>
        </div>
      )}

      {/* Stale outputs */}
      {plays_with_stale_outputs > 0 && (
        <div className="flex items-center gap-1 text-[9px] text-amber-600">
          <RefreshCw size={9} />
          <span className="font-bold">{plays_with_stale_outputs} play output{plays_with_stale_outputs > 1 ? 's' : ''} need refreshing</span>
        </div>
      )}
    </div>
  );
}
