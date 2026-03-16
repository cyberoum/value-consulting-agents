import { ExternalLink } from 'lucide-react';
import Section from '../../common/Section';
import FlagOutdated from '../../common/FlagOutdated';
import { SectionFreshnessBar } from '../../common/FreshnessBadge';
import AiInsightsCard from '../../live/AiInsightsCard';
import LiveNewsFeed from '../../live/LiveNewsFeed';
import LiveStockTicker, { LiveStockCard } from '../../live/LiveStockTicker';

export default function ProfileTab({ bankKey, data, meta, aiAnalysis, sources }) {
  return (
    <div>
      <SectionFreshnessBar date={meta?.as_of} category="Bank Profile" sourcePeriod={meta?.kpis_period || 'Annual Report / Public Filings'} />
      {data.points_of_interest?.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-fg mb-3">Points of Interest</h3>
          <div className="space-y-2 mb-5">
            {data.points_of_interest.map((poi, i) => (
              <Section key={i} title={poi.title} defaultOpen={false} color="#3366FF">
                <p className="text-xs text-fg-subtle leading-relaxed">{poi.insight}</p>
              </Section>
            ))}
          </div>
        </>
      )}
      {data.overview && (
        <Section title="Overview" defaultOpen={false}>
          <div className="flex items-center gap-2 mb-2"><FlagOutdated bankKey={bankKey} section="overview" compact /></div>
          <p className="text-sm text-fg-subtle leading-relaxed">{data.overview}</p>
        </Section>
      )}
      {data.financials && (
        <Section title="Financials" defaultOpen={false}>
          <div className="flex items-center gap-2 mb-2">
            <SectionFreshnessBar date={meta?.as_of} category="Financial Data" sourcePeriod={meta?.kpis_period || 'Annual Report'} />
            <FlagOutdated bankKey={bankKey} section="financials" compact />
          </div>
          <p className="text-sm text-fg-subtle leading-relaxed">{data.financials}</p>
        </Section>
      )}
      {data.digital_strategy && (
        <Section title="Digital Strategy" defaultOpen={false}>
          <div className="flex items-center gap-2 mb-2"><FlagOutdated bankKey={bankKey} section="digital_strategy" compact /></div>
          <p className="text-sm text-fg-subtle leading-relaxed">{data.digital_strategy}</p>
        </Section>
      )}
      {data.strategic_initiatives && (
        <Section title="Strategic Initiatives" defaultOpen={false}>
          <div className="flex items-center gap-2 mb-2"><FlagOutdated bankKey={bankKey} section="strategic_initiatives" compact /></div>
          <p className="text-sm text-fg-subtle leading-relaxed">{data.strategic_initiatives}</p>
        </Section>
      )}
      {aiAnalysis && <AiInsightsCard aiAnalysis={aiAnalysis} />}
      <div className="space-y-4 mb-5">
        <LiveStockCard bankData={data} />
        <LiveNewsFeed bankData={data} />
      </div>
      {sources.length > 0 && (
        <div className="mt-5 p-4 bg-surface-2 border border-border rounded-xl">
          <div className="text-xs font-bold text-fg mb-2">📎 Sources & References</div>
          <div className="flex flex-wrap gap-2">
            {sources.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener" className="text-[11px] text-primary hover:underline flex items-center gap-1">
                {s.label} <ExternalLink size={10} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
