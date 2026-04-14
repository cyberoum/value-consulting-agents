import { useState, useEffect, useMemo } from 'react';
import { Plus, Loader, Lightbulb, RefreshCw } from 'lucide-react';
import { getPlays, getSignalSummary } from '../../data/api';
import { PLAY_TYPES } from '../../data/intelligenceLayer';
import PlayCard from './PlayCard';
import PlayActivator from './PlayActivator';

function PlaySuggestion({ suggestion, onActivate, onDismiss }) {
  return (
    <div className="flex items-center gap-2 p-2.5 mb-2 bg-[var(--color-il-accent-light)] border border-[var(--color-il-accent-border)] rounded-[var(--il-radius)]">
      <Lightbulb size={14} className="text-[var(--color-il-accent)] shrink-0" />
      <span className="text-[10px] text-slate-600 flex-1">{suggestion.message}</span>
      {suggestion.action === 'activate' && (
        <button onClick={() => onActivate(suggestion.playType)}
          className="px-2 py-0.5 rounded text-[9px] font-bold text-white bg-[var(--color-il-accent)] hover:opacity-90">
          Activate
        </button>
      )}
      {suggestion.action === 'regenerate' && (
        <button onClick={() => onActivate(suggestion.playType)}
          className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-bold text-[var(--color-il-accent)] bg-white border border-[var(--color-il-accent-border)] hover:bg-[var(--color-il-accent-light)]">
          <RefreshCw size={8} /> Regenerate
        </button>
      )}
      <button onClick={onDismiss} className="text-[9px] text-slate-400 hover:text-slate-600">Dismiss</button>
    </div>
  );
}

export default function PlayDashboard({ dealId, onPlaySelect }) {
  const [plays, setPlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActivator, setShowActivator] = useState(false);
  const [signalSummary, setSignalSummary] = useState(null);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);

  const fetchPlays = async () => {
    try {
      const [data, sigSum] = await Promise.all([
        getPlays(dealId),
        getSignalSummary(dealId).catch(() => null),
      ]);
      setPlays(data);
      setSignalSummary(sigSum);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchPlays(); }, [dealId]);

  // Proactive play suggestion logic
  const suggestion = useMemo(() => {
    if (dismissedSuggestion) return null;
    const types = plays.map(p => p.play_type);
    const statuses = {};
    plays.forEach(p => { statuses[p.play_type] = p.status; });
    const hasCompetitiveSignals = (signalSummary?.by_category?.competitive || 0) > 0;
    const staleOutputCount = signalSummary?.plays_with_stale_outputs || 0;

    if (plays.length === 0) {
      return { message: 'Start by understanding this account — activate a Discovery Play', action: 'activate', playType: 'discovery' };
    }
    if (staleOutputCount > 0) {
      return { message: `${staleOutputCount} play(s) have stale outputs due to new signals. Regenerate to refresh intelligence.`, action: 'regenerate', playType: null };
    }
    if (statuses.discovery === 'completed' && !types.includes('value')) {
      return { message: 'Discovery complete. Build the business case — activate a Value Play', action: 'activate', playType: 'value' };
    }
    if (hasCompetitiveSignals && !types.includes('competitive')) {
      return { message: 'Competitive signals detected. Activate a Competitive Play to prepare differentiation', action: 'activate', playType: 'competitive' };
    }
    if (statuses.value === 'completed' && statuses.competitive === 'completed' && !types.includes('proposal')) {
      return { message: 'Ready to propose. Activate a Proposal Play to synthesize everything', action: 'activate', playType: 'proposal' };
    }
    return null;
  }, [plays, signalSummary, dismissedSuggestion]);

  if (loading) {
    return <div className="flex items-center gap-2 py-3 text-slate-400 text-xs"><Loader size={12} className="animate-spin" /> Loading plays...</div>;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Plays</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* Proactive suggestion */}
      {suggestion && (
        <PlaySuggestion
          suggestion={suggestion}
          onActivate={(playType) => { if (playType) setShowActivator(true); }}
          onDismiss={() => setDismissedSuggestion(true)}
        />
      )}

      {plays.length === 0 && !showActivator ? (
        <div className="bg-white rounded-[var(--il-radius)] border border-slate-100 p-4 text-center shadow-[var(--color-il-card-shadow)]">
          <p className="text-xs text-slate-400 mb-2">No plays active. Activate your first play to start generating deal intelligence.</p>
          <button onClick={() => setShowActivator(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[var(--color-il-accent)] hover:opacity-90 transition-opacity">
            <Plus size={12} /> Activate Play
          </button>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {plays.map(play => (
            <PlayCard key={play.id} play={play} onClick={() => onPlaySelect?.(play)} />
          ))}
          <button onClick={() => setShowActivator(true)}
            className="flex flex-col items-center justify-center p-3 min-w-[80px] rounded-[var(--il-radius)] border-2 border-dashed border-slate-200 text-slate-400 hover:border-[var(--color-il-accent)] hover:text-[var(--color-il-accent)] transition-colors">
            <Plus size={16} />
            <span className="text-[8px] font-bold mt-0.5">Add</span>
          </button>
        </div>
      )}

      {showActivator && (
        <PlayActivator
          dealId={dealId}
          existingTypes={plays.map(p => p.play_type)}
          onCreated={() => { setShowActivator(false); fetchPlays(); }}
          onClose={() => setShowActivator(false)}
        />
      )}
    </div>
  );
}
