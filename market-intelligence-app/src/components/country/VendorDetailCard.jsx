import { Star } from 'lucide-react';

const PRESENCE_DOT = {
  strong: 'bg-[var(--nova-radiant)]',
  moderate: 'bg-[var(--nova-accreting)]',
  emerging: 'bg-[var(--nova-dormant)]',
  exiting: 'bg-[var(--nova-cooling)]',
};

const PRESENCE_LABEL = {
  strong: { text: 'Strong', color: 'text-[var(--nova-radiant)]' },
  moderate: { text: 'Moderate', color: 'text-[var(--nova-accreting)]' },
  emerging: { text: 'Emerging', color: 'text-[var(--nova-dormant)]' },
  exiting: { text: 'Exiting', color: 'text-[var(--nova-cooling)]' },
};

const THREAT_BADGE = {
  high: 'bg-[var(--nova-cooling-light)] text-[var(--nova-cooling)] border-[var(--nova-cooling)]',
  medium: 'bg-[var(--nova-accreting-light)] text-[var(--nova-accreting)] border-[var(--nova-accreting)]',
  low: 'bg-[var(--nova-radiant-light)] text-[var(--nova-radiant)] border-[var(--nova-radiant)]',
};

const TYPE_BADGE = {
  global: 'bg-blue-50 text-blue-700',
  regional: 'bg-violet-50 text-violet-700',
  local: 'bg-slate-100 text-slate-600',
  neobank: 'bg-emerald-50 text-emerald-700',
};

export default function VendorDetailCard({ vendor }) {
  const isBackbase = vendor.name.toLowerCase().includes('backbase');
  const pres = PRESENCE_LABEL[vendor.presence] || PRESENCE_LABEL.emerging;
  const threat = THREAT_BADGE[vendor.threat_level] || THREAT_BADGE.low;
  const typeBadge = TYPE_BADGE[vendor.type] || TYPE_BADGE.local;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
      isBackbase
        ? 'border-[var(--nova-ignited)] bg-[var(--nova-ignited-light)] nova-glow-ignited'
        : 'border-[var(--border-subtle)] bg-white hover:border-[var(--border-default)]'
    }`}>
      {/* Presence dot */}
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <div className={`w-2.5 h-2.5 rounded-full ${PRESENCE_DOT[vendor.presence] || PRESENCE_DOT.emerging}`} />
        <span className={`text-[8px] font-bold ${pres.color}`}>{pres.text}</span>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {isBackbase && <Star size={12} className="text-[var(--nova-ignited)] fill-[var(--nova-ignited)]" />}
          <span className="text-xs font-bold text-[var(--text-primary)]">{vendor.name}</span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${typeBadge}`}>{vendor.type}</span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${threat}`}>
            {vendor.threat_level} threat
          </span>
        </div>
        {vendor.notes && (
          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">{vendor.notes}</p>
        )}
        {vendor.notable_clients?.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Clients:</span>
            {vendor.notable_clients.map((c, i) => (
              <span key={i} className="text-[9px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded">{c}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
