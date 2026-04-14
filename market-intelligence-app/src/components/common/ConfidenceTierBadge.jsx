import { AlertTriangle } from 'lucide-react';

/**
 * ConfidenceTierBadge — Displays a small inline badge indicating data confidence level.
 *
 * Props:
 * - tier: 'verified' | 'inferred' | 'estimated' | 1 | 2 | 3 (numeric tiers also accepted)
 * - stale: boolean (optional) — adds ⚠️ warning icon
 * - size: 'sm' | 'xs' (default: 'xs')
 */

const TIER_CONFIG = {
  verified:  { label: '✓ verified',  bg: 'bg-emerald-600', text: 'text-white', darkBg: 'dark:bg-emerald-500', darkText: 'dark:text-white' },
  inferred:  { label: 'inferred',    bg: 'bg-orange-500',  text: 'text-white', darkBg: 'dark:bg-orange-400',  darkText: 'dark:text-white' },
  estimated: { label: '~ estimated', bg: 'bg-red-400',     text: 'text-white', darkBg: 'dark:bg-red-500',     darkText: 'dark:text-white' },
};

// Map numeric tiers to string keys
const TIER_MAP = { 1: 'verified', 2: 'inferred', 3: 'estimated' };

export default function ConfidenceTierBadge({ tier, stale = false, size = 'xs' }) {
  // Normalize tier input
  const tierKey = typeof tier === 'number' ? TIER_MAP[tier] : tier;
  const config = TIER_CONFIG[tierKey];
  if (!config) return null;

  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[8px]';
  const px = size === 'sm' ? 'px-1.5 py-0.5' : 'px-1 py-px';

  return (
    <span className={`inline-flex items-center gap-0.5 ${px} rounded-full ${textSize} font-bold uppercase tracking-wider ${config.bg} ${config.text} ${config.darkBg} ${config.darkText}`}>
      {stale && <AlertTriangle size={7} className="shrink-0" />}
      {config.label}
    </span>
  );
}
