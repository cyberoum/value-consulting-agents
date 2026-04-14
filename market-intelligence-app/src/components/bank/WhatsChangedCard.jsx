import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingDown, Star, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { getRecentChanges } from '../../data/api';

/* ── Change row formatting ── */

const CHANGE_CONFIG = {
  'live_stock.price': { icon: TrendingDown, label: 'Stock price' },
  'app_rating_ios': { icon: Star, label: 'iOS app rating' },
  'app_rating_android': { icon: Star, label: 'Android app rating' },
  'signals.high_impact': { icon: Bell, label: 'High-impact signal' },
};

function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}

function describeChange(change) {
  const { field_path, old_value, new_value } = change;

  if (field_path === 'live_stock.price' && old_value && new_value) {
    const oldP = parseFloat(old_value);
    const newP = parseFloat(new_value);
    if (!isNaN(oldP) && !isNaN(newP) && oldP > 0) {
      const pct = Math.abs(((newP - oldP) / oldP) * 100).toFixed(1);
      const dir = newP > oldP ? 'rose' : 'dropped';
      return `Stock price ${dir} ${pct}% (${old_value} → ${new_value})`;
    }
  }

  if (field_path.startsWith('app_rating_') && old_value && new_value) {
    const platform = field_path === 'app_rating_ios' ? 'iOS' : 'Android';
    return `App rating fell (${old_value} → ${new_value}) on ${platform}`;
  }

  if (field_path === 'signals.high_impact') {
    const title = new_value && new_value.length > 60 ? new_value.slice(0, 57) + '...' : new_value;
    return title || 'New high-impact signal detected';
  }

  // Generic fallback
  const label = CHANGE_CONFIG[field_path]?.label || field_path;
  return old_value ? `${label} changed (${old_value} → ${new_value})` : `${label}: ${new_value}`;
}

/* ── Change Row ── */

function ChangeRow({ change }) {
  const config = CHANGE_CONFIG[change.field_path] || { icon: AlertTriangle, label: change.field_path };
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon size={13} className="text-amber-600 shrink-0 mt-0.5" />
      <span className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed flex-1">
        {describeChange(change)}
      </span>
      <span className="text-[9px] text-amber-500 dark:text-amber-400 shrink-0 whitespace-nowrap">
        {formatTimeAgo(change.changed_at)}
      </span>
    </div>
  );
}

/* ── Main Card ── */

const COLLAPSED_LIMIT = 3;

export default function WhatsChangedCard({ bankKey }) {
  const [changes, setChanges] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!bankKey) return;
    let cancelled = false;
    getRecentChanges(bankKey, { limit: 10 })
      .then(res => {
        if (!cancelled) {
          const list = res?.changes || [];
          setChanges(list.length > 0 ? list : null);
        }
      })
      .catch(() => { if (!cancelled) setChanges(null); });
    return () => { cancelled = true; };
  }, [bankKey]);

  // Return nothing if no changes — never render an empty card
  if (!changes) return null;

  const visible = expanded ? changes : changes.slice(0, COLLAPSED_LIMIT);
  const hasMore = changes.length > COLLAPSED_LIMIT;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mb-3 border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 rounded-xl px-4 py-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={13} className="text-amber-600" />
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
          What Changed
        </span>
        <span className="text-[9px] text-amber-500 dark:text-amber-500">
          {changes.length} recent {changes.length === 1 ? 'change' : 'changes'}
        </span>
      </div>

      <div className="space-y-0.5">
        {visible.map((c, i) => <ChangeRow key={c.id || i} change={c} />)}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-1.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
        >
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          {expanded ? 'Show less' : `Show all ${changes.length}`}
        </button>
      )}
    </motion.div>
  );
}
