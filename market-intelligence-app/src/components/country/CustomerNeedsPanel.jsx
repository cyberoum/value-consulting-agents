import { Users, AlertTriangle, TrendingUp, TrendingDown, Minus, Smartphone } from 'lucide-react';

const SEGMENT_BADGE = {
  retail: 'bg-blue-50 text-blue-700',
  sme: 'bg-amber-50 text-amber-700',
  corporate: 'bg-violet-50 text-violet-700',
  wealth: 'bg-emerald-50 text-emerald-700',
};

const GAP_SEVERITY = {
  high: { label: 'High Gap', color: 'bg-[var(--nova-cooling-light)] text-[var(--nova-cooling)] border-[var(--nova-cooling)]' },
  medium: { label: 'Medium', color: 'bg-[var(--nova-accreting-light)] text-[var(--nova-accreting)] border-[var(--nova-accreting)]' },
  low: { label: 'Low', color: 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border-default)]' },
};

const PREVALENCE_BAR = {
  widespread: { width: '90%', label: 'Widespread' },
  common: { width: '60%', label: 'Common' },
  niche: { width: '30%', label: 'Niche' },
};

const TREND_ICON = {
  accelerating: { icon: TrendingUp, color: 'text-[var(--nova-radiant)]' },
  steady: { icon: Minus, color: 'text-[var(--text-muted)]' },
  slowing: { icon: TrendingDown, color: 'text-[var(--nova-cooling)]' },
};

function AdoptionBar({ label, value }) {
  const pct = parseInt(value) || 0;
  const color = pct >= 80 ? 'bg-[var(--nova-radiant)]' : pct >= 50 ? 'bg-[var(--nova-accreting)]' : 'bg-[var(--nova-dormant)]';
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-[var(--text-secondary)] w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-[var(--text-primary)] w-10 text-right">{value}</span>
    </div>
  );
}

export default function CustomerNeedsPanel({ data, countryName }) {
  if (!data) {
    return (
      <div className="nova-card text-center py-10">
        <Users size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
        <p className="text-sm font-bold text-[var(--text-secondary)]">Customer needs data not yet available for {countryName}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Click "Enrich with AI" to generate customer intelligence.</p>
      </div>
    );
  }

  const adoption = data.digital_adoption || {};
  const unmetNeeds = data.unmet_needs || [];
  const painPoints = data.customer_pain_points || [];
  const shifts = data.behavioral_shifts || [];

  return (
    <div className="space-y-5">
      {/* Summary */}
      {data.summary && (
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{data.summary}</p>
      )}

      {/* Digital Adoption Metrics */}
      {Object.keys(adoption).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={14} className="text-[var(--nova-core)]" />
            <h4 className="nova-label">Digital Adoption</h4>
          </div>
          <div className="nova-card-nested space-y-2 p-3">
            {adoption.mobile_banking_penetration && <AdoptionBar label="Mobile Banking" value={adoption.mobile_banking_penetration} />}
            {adoption.online_banking_penetration && <AdoptionBar label="Online Banking" value={adoption.online_banking_penetration} />}
            {adoption.contactless_payments && <AdoptionBar label="Contactless Payments" value={adoption.contactless_payments} />}
            {adoption.open_banking_usage && <AdoptionBar label="Open Banking Usage" value={adoption.open_banking_usage} />}
          </div>
        </div>
      )}

      {/* Unmet Needs */}
      {unmetNeeds.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-[var(--nova-accreting)]" />
            <h4 className="nova-label">Unmet Needs & Opportunities</h4>
          </div>
          <div className="space-y-2">
            {unmetNeeds.map((need, i) => {
              const seg = SEGMENT_BADGE[need.segment] || SEGMENT_BADGE.retail;
              const gap = GAP_SEVERITY[need.gap_severity] || GAP_SEVERITY.low;
              return (
                <div key={i} className="nova-card-enter p-3 bg-white rounded-[var(--il-radius)] border border-[var(--border-subtle)]"
                  style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${seg}`}>{need.segment}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${gap.color}`}>{gap.label}</span>
                  </div>
                  <div className="text-xs font-bold text-[var(--text-primary)] mb-0.5">{need.need}</div>
                  {need.opportunity && (
                    <p className="text-[10px] text-[var(--nova-core)] font-medium">Opportunity: {need.opportunity}</p>
                  )}
                  {need.evidence && (
                    <p className="text-[10px] text-[var(--text-muted)] italic mt-0.5">{need.evidence}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pain Points */}
      {painPoints.length > 0 && (
        <div>
          <h4 className="nova-label mb-2">Customer Pain Points</h4>
          <div className="space-y-1.5">
            {painPoints.map((pp, i) => {
              const prev = PREVALENCE_BAR[pp.prevalence] || PREVALENCE_BAR.common;
              return (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-[var(--bg-secondary)] rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-[var(--text-primary)]">{pp.pain}</div>
                    <div className="flex gap-1 mt-0.5">
                      {(pp.affected_segments || []).map((s, j) => (
                        <span key={j} className={`text-[7px] font-bold px-1 py-0.5 rounded ${SEGMENT_BADGE[s] || ''}`}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="w-20 shrink-0">
                    <div className="h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--nova-cooling)] rounded-full" style={{ width: prev.width }} />
                    </div>
                    <div className="text-[8px] text-[var(--text-muted)] text-right mt-0.5">{prev.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Behavioral Shifts */}
      {shifts.length > 0 && (
        <div>
          <h4 className="nova-label mb-2">Behavioral Shifts</h4>
          <div className="space-y-1.5">
            {shifts.map((s, i) => {
              const trend = TREND_ICON[s.trend_direction] || TREND_ICON.steady;
              const TIcon = trend.icon;
              return (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-[var(--border-subtle)]">
                  <TIcon size={14} className={`${trend.color} mt-0.5 shrink-0`} />
                  <div>
                    <div className="text-[11px] font-bold text-[var(--text-primary)]">{s.shift}</div>
                    {s.implication && (
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{s.implication}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
