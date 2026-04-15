import { Building2, DollarSign, Smartphone, Briefcase, TrendingUp, Shield } from 'lucide-react';
import Section from '../common/Section';

/**
 * BusinessOverviewSection — read-only composition of existing bank data.
 * Feeds from:
 *   - banks.data: overview, strategic_initiatives, kpis, operational_profile
 *   - cx.data: digital_maturity, app ratings
 *   - competition.data: core_banking, digital_platform, vendor_risk, key_vendors
 *
 * Zero AI cost — renders instantly from data already in the page context.
 */
export default function BusinessOverviewSection({ bank, cx, competition, qualification }) {
  const data = bank?.data || bank || {};
  const kpis = data.kpis || [];
  const strategicInitiatives = data.strategic_initiatives;
  const operationalProfile = data.operational_profile || {};

  return (
    <div className="space-y-4">
      {/* Strategic Pillars (from annual report overview) */}
      {data.overview && (
        <div className="nova-card">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={14} className="text-[var(--nova-core)]" />
            <span className="nova-label">Strategic Context</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{data.overview}</p>
        </div>
      )}

      {/* Financial KPIs (3-column grid) */}
      {kpis.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-[var(--nova-core)]" />
            <span className="nova-label">Financial Overview</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {kpis.map((k, i) => (
              <div key={i} className="nova-card-nested nova-card-enter"
                style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">{k.label}</div>
                <div className="text-sm font-black text-[var(--text-primary)]">{k.value}</div>
                {k.sub && <div className="text-[9px] text-[var(--text-muted)]">{k.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operational Profile */}
      {Object.keys(operationalProfile).length > 0 && (
        <Section title="Operational Profile" defaultOpen={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {Object.entries(operationalProfile).map(([k, v]) => (
              <div key={k} className="flex items-start gap-2 py-1">
                <span className="text-[var(--text-muted)] uppercase text-[9px] tracking-wider shrink-0 w-32">
                  {k.replace(/_/g, ' ')}:
                </span>
                <span className="text-[var(--text-primary)]">{typeof v === 'string' ? v : JSON.stringify(v)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Digital Maturity */}
      {(cx?.digital_maturity || cx?.app_rating_ios || cx?.app_rating_android) && (
        <Section title="Digital Maturity" defaultOpen={true}>
          <div className="flex flex-wrap gap-3">
            {cx.digital_maturity && (
              <div className="flex-1 min-w-[180px] nova-card-nested">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone size={12} className="text-[var(--nova-core)]" />
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Maturity Level</span>
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)]">{cx.digital_maturity}</div>
              </div>
            )}
            {cx.app_rating_ios != null && (
              <div className="flex-1 min-w-[180px] nova-card-nested">
                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">iOS App Rating</div>
                <div className="text-sm font-bold text-[var(--text-primary)]">⭐ {cx.app_rating_ios}/5</div>
              </div>
            )}
            {cx.app_rating_android != null && (
              <div className="flex-1 min-w-[180px] nova-card-nested">
                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Android Rating</div>
                <div className="text-sm font-bold text-[var(--text-primary)]">⭐ {cx.app_rating_android}/5</div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Competition Landscape */}
      {competition && (
        <Section title="Technology Stack" defaultOpen={false}>
          <div className="space-y-2">
            {competition.core_banking && (
              <div className="flex items-center gap-2">
                <Shield size={12} className="text-[var(--text-muted)]" />
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider w-28">Core Banking:</span>
                <span className="text-xs font-bold text-[var(--text-primary)]">{competition.core_banking}</span>
              </div>
            )}
            {competition.digital_platform && (
              <div className="flex items-center gap-2">
                <Smartphone size={12} className="text-[var(--text-muted)]" />
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider w-28">Digital Platform:</span>
                <span className="text-xs font-bold text-[var(--text-primary)]">{competition.digital_platform}</span>
              </div>
            )}
            {competition.data?.vendor_risk && (
              <div className="flex items-center gap-2">
                <TrendingUp size={12} className="text-[var(--nova-accreting)]" />
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider w-28">Vendor Risk:</span>
                <span className="text-xs text-[var(--nova-accreting)]">{competition.data.vendor_risk}</span>
              </div>
            )}
            {competition.data?.key_vendors?.length > 0 && (
              <div className="flex items-start gap-2">
                <Building2 size={12} className="text-[var(--text-muted)] mt-0.5" />
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider w-28 shrink-0 mt-0.5">Key Vendors:</span>
                <div className="flex flex-wrap gap-1">
                  {competition.data.key_vendors.map((v, i) => (
                    <span key={i} className="text-[9px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded">{v}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Strategic Initiatives (raw text from annual report) */}
      {strategicInitiatives && (
        <Section title="Strategic Initiatives (from Annual Report)" defaultOpen={false}>
          <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
            {typeof strategicInitiatives === 'string' ? strategicInitiatives : JSON.stringify(strategicInitiatives, null, 2)}
          </div>
        </Section>
      )}

      {/* Empty-state fallback */}
      {!data.overview && kpis.length === 0 && !strategicInitiatives && (
        <div className="nova-card text-center py-8">
          <Building2 size={28} className="mx-auto mb-2 text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-muted)]">Business overview not yet available. Run the bank profiling pipeline to enrich.</p>
        </div>
      )}
    </div>
  );
}
