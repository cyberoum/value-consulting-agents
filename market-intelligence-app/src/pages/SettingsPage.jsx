import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Search, Loader, Eye, EyeOff, Target, XCircle, Clock, ArrowRight } from 'lucide-react';
import { getPipelineSettings, updateBankStatus } from '../data/api';
import { scoreColor } from '../data/scoring';

const STATUS_CONFIG = {
  prospect:     { label: 'Prospect',     icon: Target,   color: 'text-primary',         bg: 'bg-primary/10',     description: 'In pipeline — actively tracked' },
  active_deal:  { label: 'Active Deal',  icon: Target,   color: 'text-emerald-600',     bg: 'bg-emerald-100',    description: 'Active deal in progress' },
  watching:     { label: 'Watching',     icon: Eye,      color: 'text-amber-600',       bg: 'bg-amber-100',      description: 'Monitoring — not actively pursuing' },
  disqualified: { label: 'Disqualified', icon: XCircle,  color: 'text-fg-disabled',     bg: 'bg-surface-2',      description: 'Not a fit — hidden from active views' },
};

const DISQUALIFY_REASONS = [
  'Score too low',
  'No budget identified',
  'Competitor entrenched',
  'Subsidiary — decisions at group HQ',
  'Too small for Backbase',
  'Already a customer',
  'Other',
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [disqualifyModal, setDisqualifyModal] = useState(null); // bankKey or null
  const [disqualifyReason, setDisqualifyReason] = useState('');

  useEffect(() => {
    getPipelineSettings()
      .then(data => { setBanks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleStatusChange = async (bankKey, newStatus, reason) => {
    setUpdating(bankKey);
    try {
      const excluded = newStatus === 'disqualified';
      await updateBankStatus(bankKey, { excluded, status: newStatus, disqualify_reason: reason || null });
      setBanks(prev => prev.map(b => b.key === bankKey ? { ...b, status: newStatus, excluded, disqualify_reason: reason || null } : b));
    } catch (err) {
      alert('Failed: ' + err.message);
    }
    setUpdating(null);
    setDisqualifyModal(null);
  };

  const countries = useMemo(() => [...new Set(banks.map(b => b.country))].sort(), [banks]);

  const filtered = useMemo(() => {
    return banks.filter(b => {
      if (search && !b.bank_name.toLowerCase().includes(search.toLowerCase()) && !b.country.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== 'all' && b.status !== filterStatus) return false;
      if (filterCountry !== 'all' && b.country !== filterCountry) return false;
      return true;
    });
  }, [banks, search, filterStatus, filterCountry]);

  const statusCounts = useMemo(() => {
    const counts = { all: banks.length };
    banks.forEach(b => { counts[b.status] = (counts[b.status] || 0) + 1; });
    return counts;
  }, [banks]);

  if (loading) {
    return <div className="flex items-center gap-2 py-12 justify-center text-fg-muted text-xs"><Loader size={14} className="animate-spin" /> Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Settings size={20} className="text-fg-muted" />
        <div>
          <h1 className="text-lg font-black text-fg">Bank Pipeline Management</h1>
          <p className="text-[10px] text-fg-muted">Manage which banks are active prospects, being watched, or disqualified</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {[
          { key: 'all', label: 'All' },
          { key: 'prospect', label: 'Prospects' },
          { key: 'active_deal', label: 'Active Deals' },
          { key: 'watching', label: 'Watching' },
          { key: 'disqualified', label: 'Disqualified' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
              filterStatus === tab.key ? 'bg-primary text-white' : 'bg-surface border border-border text-fg-muted hover:bg-surface-2'
            }`}>
            {tab.label} <span className="ml-1 opacity-60">{statusCounts[tab.key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Search + country filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg">
          <Search size={14} className="text-fg-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter banks..." className="flex-1 text-xs bg-transparent text-fg placeholder:text-fg-disabled outline-none" />
        </div>
        <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
          className="text-xs bg-surface border border-border rounded-lg px-3 py-1.5 text-fg outline-none">
          <option value="all">All countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Bank list */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="divide-y divide-border max-h-[65vh] overflow-y-auto">
          {filtered.map(bank => {
            const cfg = STATUS_CONFIG[bank.status] || STATUS_CONFIG.prospect;
            const Icon = cfg.icon;
            return (
              <div key={bank.key} className={`flex items-center gap-3 px-4 py-3 transition-colors ${bank.status === 'disqualified' ? 'opacity-50' : ''}`}>
                {/* Bank info */}
                <button onClick={() => navigate(`/bank/${encodeURIComponent(bank.key)}`)} className="flex-1 min-w-0 text-left hover:text-primary transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-fg truncate">{bank.bank_name}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: scoreColor(bank.score) }}>{bank.score}</span>
                  </div>
                  <div className="text-[9px] text-fg-muted">{bank.country}{bank.deal_size ? ' · ' + bank.deal_size : ''}</div>
                  {bank.disqualify_reason && bank.status === 'disqualified' && (
                    <div className="text-[8px] text-fg-disabled italic mt-0.5">{bank.disqualify_reason}</div>
                  )}
                </button>

                {/* Status badge */}
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${cfg.bg} ${cfg.color}`}>
                  <Icon size={9} /> {cfg.label}
                </span>

                {/* Status actions */}
                <div className="flex gap-1 shrink-0">
                  {bank.status !== 'prospect' && (
                    <button onClick={() => handleStatusChange(bank.key, 'prospect')}
                      disabled={updating === bank.key}
                      className="px-2 py-1 rounded text-[9px] font-bold text-primary hover:bg-primary/5 transition-colors"
                      title="Mark as prospect">
                      {updating === bank.key ? <Loader size={10} className="animate-spin" /> : 'Prospect'}
                    </button>
                  )}
                  {bank.status !== 'watching' && bank.status !== 'disqualified' && (
                    <button onClick={() => handleStatusChange(bank.key, 'watching')}
                      disabled={updating === bank.key}
                      className="px-2 py-1 rounded text-[9px] font-bold text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Move to watching">
                      Watch
                    </button>
                  )}
                  {bank.status !== 'disqualified' && (
                    <button onClick={() => { setDisqualifyModal(bank.key); setDisqualifyReason(''); }}
                      disabled={updating === bank.key}
                      className="px-2 py-1 rounded text-[9px] font-bold text-fg-disabled hover:bg-surface-2 transition-colors"
                      title="Disqualify">
                      DQ
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-fg-muted text-xs">No banks match your filters</div>
          )}
        </div>
      </div>

      {/* Disqualify modal */}
      {disqualifyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDisqualifyModal(null)}>
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-sm p-5 border border-border" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-fg mb-3">Disqualify {banks.find(b => b.key === disqualifyModal)?.bank_name}?</h3>
            <p className="text-[10px] text-fg-muted mb-3">This bank will be hidden from active views and excluded from pipeline runs.</p>
            <div className="space-y-1.5 mb-3">
              {DISQUALIFY_REASONS.map(reason => (
                <button key={reason} onClick={() => setDisqualifyReason(reason)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    disqualifyReason === reason ? 'bg-primary/10 text-primary font-bold border border-primary/20' : 'bg-surface-2 text-fg-muted hover:bg-surface-3'
                  }`}>
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDisqualifyModal(null)} className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-surface border border-border text-fg hover:bg-surface-2">Cancel</button>
              <button onClick={() => handleStatusChange(disqualifyModal, 'disqualified', disqualifyReason)}
                disabled={!disqualifyReason}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">
                Disqualify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
