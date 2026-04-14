/**
 * UnifiedBadge — single badge component replacing 7+ patterns across Nova.
 *
 * Variants:
 *   score    — score badge with dynamic color (green/blue/amber/red)
 *   status   — status pill (active, stale, new, verified, legacy)
 *   label    — neutral info label
 *   count    — number count
 *   dot      — small status dot
 *
 * Usage:
 *   <UnifiedBadge variant="score" value={8.2} />
 *   <UnifiedBadge variant="status" status="verified" />
 *   <UnifiedBadge variant="label">C-Suite</UnifiedBadge>
 *   <UnifiedBadge variant="count" value={14} />
 *   <UnifiedBadge variant="dot" color="success" />
 */

import { scoreColor } from '../../data/scoring';

const STATUS_CONFIG = {
  verified: { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', label: 'Verified' },
  legacy: { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', label: 'Legacy' },
  stale: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', label: 'Stale' },
  new: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', label: 'New' },
  active: { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', label: 'Active' },
  hot: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', label: 'HOT' },
  warm: { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', label: 'WARM' },
  high: { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', label: 'High' },
  medium: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', label: 'Medium' },
  low: { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', label: 'Low' },
};

const DOT_COLORS = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  primary: 'bg-primary',
  muted: 'bg-fg-muted',
};

export default function UnifiedBadge({ variant = 'label', value, status, color, children, className = '' }) {
  // Score badge — dynamic color based on score value
  if (variant === 'score') {
    const sc = typeof value === 'number' ? value : parseFloat(value) || 0;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black text-white ${className}`}
            style={{ backgroundColor: scoreColor(sc) }}>
        {sc.toFixed(1)}
      </span>
    );
  }

  // Status badge — predefined status styles
  if (variant === 'status') {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${cfg.bg} ${cfg.text} ${className}`}>
        {children || cfg.label}
      </span>
    );
  }

  // Count badge — small number pill
  if (variant === 'count') {
    return (
      <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black bg-primary/10 text-primary ${className}`}>
        {value}
      </span>
    );
  }

  // Dot badge — tiny status indicator
  if (variant === 'dot') {
    return <span className={`inline-block w-2 h-2 rounded-full ${DOT_COLORS[color] || DOT_COLORS.primary} ${className}`} />;
  }

  // Label badge — neutral info pill (default)
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-surface-2 text-fg-muted ${className}`}>
      {children}
    </span>
  );
}
