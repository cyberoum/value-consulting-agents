import { Clock, AlertTriangle } from 'lucide-react';
import { calcFreshness } from '../../data/metadata';

// Compact freshness badge — shows how old data is with color coding
// fresh (green) = <90d, recent (amber) = 90-180d, aging (orange) = 180-365d, stale (red) = >365d
export default function FreshnessBadge({ date, label, compact = false }) {
  const f = calcFreshness(date);
  if (f.level === 'unknown') return null;

  const isWarning = f.level === 'aging' || f.level === 'stale';
  const Icon = isWarning ? AlertTriangle : Clock;

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ backgroundColor: f.bg, color: f.color }}
        title={`Data as of: ${date}${label ? ' — ' + label : ''}`}
      >
        <Icon size={9} />
        {f.label}
      </span>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-lg border"
      style={{ backgroundColor: f.bg, color: f.color, borderColor: f.color + '30' }}
      title={`Data as of: ${date}${label ? ' — ' + label : ''}`}
    >
      <Icon size={11} />
      <span>{label || 'Data'}: {f.label}</span>
    </div>
  );
}

// Section-level freshness — shows "as of" date for a specific data category
export function SectionFreshnessBar({ date, category, sourcePeriod }) {
  const f = calcFreshness(date);
  if (f.level === 'unknown') return null;

  return (
    <div className="flex items-center gap-2 text-[9px] text-fg-disabled mb-2">
      <Clock size={10} />
      <span>
        {category && <span className="font-semibold">{category}</span>}
        {sourcePeriod && <span> • Source: {sourcePeriod}</span>}
        {date && <span> • Verified: {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
      </span>
      {(f.level === 'aging' || f.level === 'stale') && (
        <span className="font-bold px-1 py-0.5 rounded" style={{ backgroundColor: f.bg, color: f.color }}>
          <AlertTriangle size={8} className="inline mr-0.5" />
          {f.level === 'stale' ? 'STALE' : 'REVIEW'}
        </span>
      )}
    </div>
  );
}
