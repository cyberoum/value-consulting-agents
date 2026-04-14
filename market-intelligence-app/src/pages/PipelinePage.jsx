import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, Settings, ChevronDown, Loader } from 'lucide-react';
import { getMorningBrief, getPipelineSettings, updateBankStatus } from '../data/api';
import { useBanks } from '../hooks/useData';
import { calcScoreFromData, scoreColor } from '../data/scoring';
import { LoadingState } from '../components/common/DataState';

const STAGES = [
  { key: 'prospect', label: 'Prospect', color: '#6B7280', bg: 'bg-gray-50 dark:bg-gray-900/20', border: 'border-gray-200 dark:border-gray-700' },
  { key: 'discovery', label: 'Discovery', color: '#3B82F6', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800/40' },
  { key: 'qualification', label: 'Qualification', color: '#7C3AED', bg: 'bg-violet-50 dark:bg-violet-900/10', border: 'border-violet-200 dark:border-violet-800/40' },
  { key: 'proof_of_value', label: 'Proof of Value', color: '#2563EB', bg: 'bg-indigo-50 dark:bg-indigo-900/10', border: 'border-indigo-200 dark:border-indigo-800/40' },
  { key: 'negotiation', label: 'Negotiation', color: '#D97706', bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800/40' },
  { key: 'won', label: 'Won', color: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800/40' },
  { key: 'lost', label: 'Lost', color: '#EF4444', bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-800/40' },
];

const STAGE_KEYS = STAGES.map(s => s.key);

function StageMover({ currentStage, bankKey, onMove }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMove = async (newStage) => {
    setLoading(true);
    await onMove(bankKey, newStage);
    setLoading(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-0.5 text-[8px] font-bold text-fg-muted hover:text-primary transition-colors">
        {loading ? <Loader size={8} className="animate-spin" /> : <>Move <ChevronDown size={8} /></>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
            {STAGES.filter(s => s.key !== currentStage).map(s => (
              <button key={s.key} onClick={() => handleMove(s.key)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] text-fg hover:bg-surface-2 transition-colors">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DealCard({ bank, stage, onClick, onMove }) {
  const dealSize = bank.deal_size || '';

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', bank.key);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.4';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className="w-full text-left p-2.5 bg-surface border border-border rounded-lg hover:shadow-md hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold text-fg truncate">{bank.bank_name}</span>
        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white shrink-0"
              style={{ backgroundColor: scoreColor(bank.score) }}>{bank.score}</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] text-fg-muted">{bank.country}</div>
          {dealSize && <div className="text-[9px] text-primary font-bold mt-0.5">{dealSize}</div>}
        </div>
        <StageMover currentStage={stage} bankKey={bank.key} onMove={onMove} />
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const navigate = useNavigate();
  const { data: allBanksRaw, isLoading } = useBanks();
  const [bankStatuses, setBankStatuses] = useState({});
  const [brief, setBrief] = useState(null);
  const [showDisqualified, setShowDisqualified] = useState(false);
  const [showWatching, setShowWatching] = useState(false);

  useEffect(() => {
    getMorningBrief().then(setBrief).catch(() => {});
    getPipelineSettings().then(data => {
      const map = {};
      data.forEach(b => { map[b.key] = { status: b.status || 'prospect', deal_size: b.deal_size }; });
      setBankStatuses(map);
    }).catch(() => {});
  }, []);

  const allBanks = useMemo(() =>
    (allBanksRaw || []).map(b => ({
      ...b,
      score: Math.round(calcScoreFromData(b.qualification) * 10) / 10,
      deal_size: b.data?.backbase_qualification?.deal_size || b.qualification?.deal_size || '',
    }))
    .filter(b => b.score > 3) // Exclude banks that don't qualify from the pipeline view
    .sort((a, b) => b.score - a.score),
  [allBanksRaw]);

  const handleMoveBank = async (bankKey, newStage) => {
    try {
      await updateBankStatus(bankKey, { status: newStage, excluded: newStage === 'disqualified' || newStage === 'lost' });
      setBankStatuses(prev => ({ ...prev, [bankKey]: { ...prev[bankKey], status: newStage } }));
    } catch (err) {
      alert('Failed to move: ' + err.message);
    }
  };

  const banksByStage = useMemo(() => {
    const stages = {};
    STAGES.forEach(s => { stages[s.key] = []; });

    for (const bank of allBanks) {
      const bs = bankStatuses[bank.key];
      const status = bs?.status || 'prospect';

      if (status === 'disqualified' && !showDisqualified) continue;
      if (status === 'watching' && !showWatching) continue;

      // Use stored status as the stage
      if (stages[status]) {
        stages[status].push(bank);
      } else {
        // Fallback: banks without explicit status go to prospect
        stages['prospect'].push(bank);
      }
    }
    return stages;
  }, [allBanks, bankStatuses, showDisqualified, showWatching]);

  if (isLoading) return <LoadingState message="Loading pipeline..." />;

  const totalActive = STAGES.filter(s => !['disqualified', 'watching', 'lost'].includes(s.key))
    .reduce((sum, s) => sum + (banksByStage[s.key]?.length || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-black text-fg">Deal Pipeline</h1>
          <p className="text-[10px] text-fg-muted">{totalActive} active deals · Click "Move" on any card to change stage</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowWatching(!showWatching)}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${
              showWatching ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-surface border border-border text-fg-disabled'
            }`}>
            Watching
          </button>
          <button onClick={() => setShowDisqualified(!showDisqualified)}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${
              showDisqualified ? 'bg-surface-2 text-fg-muted border border-border' : 'bg-surface border border-border text-fg-disabled'
            }`}>
            DQ'd
          </button>
          <button onClick={() => navigate('/settings')}
            className="p-1.5 rounded-lg hover:bg-surface-2 text-fg-muted transition-colors" title="Manage banks">
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.filter(s => {
          if (s.key === 'disqualified') return showDisqualified;
          if (s.key === 'watching') return showWatching;
          return true;
        }).map(stage => {
          const banks = banksByStage[stage.key] || [];
          return (
            <div key={stage.key}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-primary/40'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-primary/40'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-2', 'ring-primary/40');
                const bankKey = e.dataTransfer.getData('text/plain');
                if (bankKey) handleMoveBank(bankKey, stage.key);
              }}
              className={`min-w-[180px] flex-1 rounded-xl p-3 ${stage.bg} border ${stage.border} transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-[10px] font-bold text-fg uppercase tracking-wider">{stage.label}</span>
                </div>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-black/20 text-fg-muted">{banks.length}</span>
              </div>
              <div className="space-y-2">
                {banks.map(bank => (
                  <DealCard key={bank.key} bank={bank} stage={stage.key}
                    onClick={() => navigate('/bank/' + encodeURIComponent(bank.key))}
                    onMove={handleMoveBank} />
                ))}
                {banks.length === 0 && (
                  <div className="text-center py-4 text-[9px] text-fg-disabled italic">No deals</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline summary */}
      {brief?.pipeline && (
        <div className="mt-4 p-3 bg-surface border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={12} className="text-primary" />
            <span className="text-[10px] font-bold text-fg uppercase">Pipeline Summary</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
            {STAGES.map(s => (
              <div key={s.key} className="text-center">
                <div className="text-lg font-black" style={{ color: s.color }}>{(banksByStage[s.key] || []).length}</div>
                <div className="text-[8px] text-fg-muted uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
