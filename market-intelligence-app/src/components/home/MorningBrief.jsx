import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, Clock, CheckCircle, ArrowRight, Loader, Zap, BarChart3, Mail, FileText, ArrowUpRight, RefreshCw } from 'lucide-react';
import { getMorningBrief, updateBankStatus } from '../../data/api';

const ACTION_ICONS = {
  email: Mail,
  meeting_prep: FileText,
  update_brief: RefreshCw,
  stage_change: ArrowUpRight,
  view_bank: ArrowRight,
  research: ArrowRight,
};

function ActionButtons({ actions, bankKey, navigate }) {
  if (!actions || actions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {actions.slice(0, 3).map((action, i) => {
        const Icon = ACTION_ICONS[action.type] || ArrowRight;
        const handleClick = (e) => {
          e.stopPropagation();
          if (action.type === 'email' && action.target) {
            navigate(`/bank/${encodeURIComponent(bankKey)}?tab=3`); // People tab
          } else if (action.type === 'meeting_prep') {
            navigate(`/bank/${encodeURIComponent(bankKey)}`);
          } else if (action.type === 'update_brief') {
            navigate(`/bank/${encodeURIComponent(bankKey)}`);
          } else if (action.type === 'stage_change') {
            updateBankStatus(bankKey, { status: action.newStage }).catch(() => {});
          } else if (action.type === 'view_bank' || action.type === 'research') {
            navigate(`/bank/${encodeURIComponent(bankKey)}`);
          }
        };
        return (
          <button key={i} onClick={handleClick}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold bg-white/80 dark:bg-white/10 text-fg-muted hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all">
            <Icon size={8} />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

const STAGE_CONFIG = {
  prospecting: { label: 'Prospecting', color: 'bg-gray-400' },
  discovery: { label: 'Discovery', color: 'bg-blue-500' },
  discovery_deep: { label: 'Deep Discovery', color: 'bg-indigo-500' },
  qualification: { label: 'Qualification', color: 'bg-violet-500' },
  won: { label: 'Won', color: 'bg-emerald-500' },
  lost: { label: 'Lost', color: 'bg-red-500' },
};

export default function MorningBrief() {
  const navigate = useNavigate();
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMorningBrief()
      .then(data => { setBrief(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-fg-muted text-xs">
        <Loader size={14} className="animate-spin" /> Loading your morning brief...
      </div>
    );
  }

  if (!brief) {
    // API unreachable — show fallback greeting instead of nothing
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return (
      <div className="mb-6">
        <h2 className="text-lg font-black text-fg">{greeting}.</h2>
        <p className="text-[10px] text-fg-muted mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg">
          <p className="text-[10px] text-amber-700 dark:text-amber-300">
            <span className="font-bold">API server not running.</span> Start it with: <code className="text-[9px] bg-white dark:bg-surface px-1.5 py-0.5 rounded">node scripts/apiProxy.mjs</code>
          </p>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-4 mb-6">
      {/* Greeting */}
      <div>
        <h2 className="text-lg font-black text-fg">{greeting}.</h2>
        <p className="text-[10px] text-fg-muted mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          {' \u00b7 '}{brief.totalBanks} banks tracked
        </p>
      </div>

      {/* Pipeline mini-bar */}
      <div className="flex items-center gap-2 flex-wrap p-2.5 bg-surface border border-border rounded-lg">
        <BarChart3 size={12} className="text-fg-muted" />
        {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
          const count = brief.pipeline[stage] || 0;
          if (count === 0) return null;
          return (
            <div key={stage} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${config.color}`} />
              <span className="text-[9px] text-fg-muted">{count} {config.label}</span>
            </div>
          );
        })}
      </div>

      {/* Priorities */}
      {brief.priorities.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={12} className="text-amber-500" />
            <span className="text-[10px] font-bold text-fg uppercase tracking-wider">Action needed</span>
          </div>
          <div className="space-y-1.5">
            {brief.priorities.map((p, i) => (
              <div key={i} onClick={() => navigate('/bank/' + encodeURIComponent(p.bankKey))}
                className="w-full p-2.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg text-left hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-fg">{p.bankName} <span className="text-fg-muted font-normal">({p.score}/10)</span></div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-300">{p.description}</div>
                    {p.implication && <div className="text-[9px] text-amber-600/80 dark:text-amber-400/80 italic mt-0.5">{p.implication}</div>}
                  </div>
                  <ArrowRight size={12} className="text-fg-muted shrink-0" />
                </div>
                <ActionButtons actions={p.actions} bankKey={p.bankKey} navigate={navigate} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stale deals */}
      {brief.staleDeals.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={12} className="text-red-500" />
            <span className="text-[10px] font-bold text-fg uppercase tracking-wider">Stale deals — re-engage</span>
          </div>
          <div className="space-y-1.5">
            {brief.staleDeals.map((d, i) => (
              <div key={i} onClick={() => navigate('/bank/' + encodeURIComponent(d.bankKey))}
                className="w-full p-2.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg text-left hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-fg">{d.bankName} <span className="text-fg-muted font-normal">({d.score}/10)</span></div>
                    <div className="text-[10px] text-red-600 dark:text-red-400">{d.reason}</div>
                  </div>
                  <span className="text-[9px] font-bold text-red-500 shrink-0">{d.daysSinceContact}d</span>
                </div>
                <ActionButtons actions={d.actions} bankKey={d.bankKey} navigate={navigate} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent signals */}
      {brief.recentSignals.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={12} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-fg uppercase tracking-wider">Fresh signals this week</span>
          </div>
          <div className="space-y-1">
            {brief.recentSignals.map((s, i) => (
              <div key={i} onClick={() => navigate('/bank/' + encodeURIComponent(s.bankKey))}
                className="w-full p-2 rounded-lg text-left hover:bg-surface-2 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[10px] font-bold text-primary shrink-0">{s.bankName}</span>
                  <span className="text-[10px] text-fg-muted truncate">{s.title}</span>
                </div>
                <ActionButtons actions={s.actions} bankKey={s.bankKey} navigate={navigate} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outstanding commitments */}
      {brief.upcomingActions.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle size={12} className="text-blue-500" />
            <span className="text-[10px] font-bold text-fg uppercase tracking-wider">Open commitments</span>
          </div>
          <div className="space-y-1">
            {brief.upcomingActions.map((a, i) => (
              <button key={i} onClick={() => navigate('/bank/' + encodeURIComponent(a.bankKey) + '?tab=4')}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-surface-2 transition-colors">
                <span className="text-[10px] font-bold text-fg">{a.bankName}</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400">{a.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {brief.priorities.length === 0 && brief.staleDeals.length === 0 && brief.recentSignals.length === 0 && brief.upcomingActions.length === 0 && (
        <div className="text-center py-6 text-fg-muted">
          <CheckCircle size={20} className="mx-auto mb-2 text-emerald-500" />
          <p className="text-xs font-bold">All clear today.</p>
          <p className="text-[10px]">No urgent actions or new signals.</p>
        </div>
      )}
    </div>
  );
}
