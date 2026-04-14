import { useState, useEffect } from 'react';
import { Loader, Plus, Filter } from 'lucide-react';
import { getSignals, updateSignal, getSignalSummary } from '../../data/api';
import { SIGNAL_CATALOGUE } from '../../data/intelligenceLayer';
import SignalCard from './SignalCard';
import SignalBadge from './SignalBadge';

export default function SignalFeed({ dealId }) {
  const [signals, setSignals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);

  const fetchData = async () => {
    try {
      const [sigs, sum] = await Promise.all([
        getSignals(dealId, activeFilter ? { category: activeFilter } : {}),
        getSignalSummary(dealId),
      ]);
      setSignals(sigs);
      setSummary(sum);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [dealId, activeFilter]);

  const handleAcknowledge = async (signalId) => {
    await updateSignal(dealId, signalId, { acknowledged: true });
    fetchData();
  };

  if (loading) {
    return <div className="flex items-center gap-2 py-6 justify-center text-slate-400 text-xs"><Loader size={14} className="animate-spin" /> Loading signals...</div>;
  }

  return (
    <div>
      {/* Summary + filters */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Signals</span>
        {summary && <SignalBadge count={summary.unacknowledged} />}
        <div className="flex-1" />
        {Object.entries(SIGNAL_CATALOGUE).map(([key, cat]) => (
          <button key={key} onClick={() => setActiveFilter(activeFilter === key ? null : key)}
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-colors ${
              activeFilter === key
                ? 'bg-[var(--color-il-accent)] text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Signal list */}
      {signals.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-[var(--il-radius)] border border-slate-100">
          <Filter size={20} className="mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-bold text-slate-400">No signals detected yet</p>
          <p className="text-[10px] text-slate-300 mt-0.5">Signals will appear as deal activity occurs, or add one manually.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {signals.map(sig => (
            <SignalCard key={sig.id} signal={sig} onAcknowledge={handleAcknowledge} />
          ))}
        </div>
      )}
    </div>
  );
}
