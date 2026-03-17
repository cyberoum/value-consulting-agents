import { ExternalLink, AlertTriangle, Swords, Zap, Newspaper, Target } from 'lucide-react';
import Section from '../../common/Section';
import FlagOutdated from '../../common/FlagOutdated';
import { SectionFreshnessBar } from '../../common/FreshnessBadge';
import AiInsightsCard from '../../live/AiInsightsCard';
import LiveNewsFeed from '../../live/LiveNewsFeed';
import LiveStockTicker, { LiveStockCard } from '../../live/LiveStockTicker';

/**
 * ProfileTab — merged Profile + Context (formerly two separate tabs).
 * Quick Context grid at top, then deep profile sections below.
 *
 * Props added from old ContextTab: q, comp, liveNews, topPainPoints
 */
export default function ProfileTab({ bankKey, data, meta, aiAnalysis, sources, q, comp, liveNews, topPainPoints }) {
  const hasContext = q?.risk || comp || (aiAnalysis?.signals?.length > 0) || (liveNews?.length > 0) || (topPainPoints?.length > 0) || data?.recommended_approach;

  return (
    <div>
      {/* ── Quick Context (formerly ContextTab) ─────────────────── */}
      {hasContext && (
        <div className="mb-5">
          <div className="text-[10px] font-bold text-fg-disabled uppercase tracking-widest mb-2">Quick Context</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q?.risk && (
              <div className="p-3 bg-danger-subtle border border-danger/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle size={12} className="text-danger" />
                  <span className="text-[10px] font-bold text-danger uppercase">Risk</span>
                </div>
                <p className="text-xs text-fg-subtle">{q.risk}</p>
              </div>
            )}

            {comp && (
              <div className="p-3 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <Swords size={12} className="text-fg-muted" />
                  <span className="text-[10px] font-bold text-fg-muted uppercase">Competition</span>
                </div>
                <div className="text-xs text-fg-subtle space-y-0.5">
                  {comp.core_banking && <div><span className="font-bold text-fg-muted">Core:</span> {comp.core_banking}</div>}
                  {comp.digital_platform && <div><span className="font-bold text-fg-muted">Digital:</span> {comp.digital_platform}</div>}
                </div>
                {comp.vendor_risk && <p className="text-[10px] text-warning italic mt-1">{comp.vendor_risk}</p>}
              </div>
            )}

            {aiAnalysis && aiAnalysis.signals?.length > 0 && (
              <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap size={12} className="text-violet-600" />
                  <span className="text-[10px] font-bold text-violet-700 uppercase">AI Intelligence</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600">{aiAnalysis.signals.length} signals</span>
                </div>
                <p className="text-xs text-fg-subtle">{aiAnalysis.signals[0]?.signal}</p>
                {aiAnalysis.signals[0]?.implication && (
                  <p className="text-[10px] text-fg-disabled mt-0.5">{aiAnalysis.signals[0].implication}</p>
                )}
              </div>
            )}

            {liveNews?.length > 0 && (
              <div className="p-3 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <Newspaper size={12} className="text-fg-muted" />
                  <span className="text-[10px] font-bold text-fg-muted uppercase">Latest News</span>
                </div>
                <div className="space-y-1">
                  {liveNews.map((article, i) => (
                    <a key={i} href={article.link} target="_blank" rel="noopener" className="block text-xs text-primary hover:underline truncate">
                      {article.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {topPainPoints?.length > 0 && (
              <div className="p-3 bg-danger-subtle/50 border border-danger/10 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={12} className="text-danger" />
                  <span className="text-[10px] font-bold text-danger uppercase">Key Pain Points</span>
                </div>
                <div className="space-y-1">
                  {topPainPoints.map((p, i) => (
                    <div key={i}>
                      <div className="text-xs font-bold text-fg">{p.title}</div>
                      <div className="text-[10px] text-fg-muted line-clamp-1">{p.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data?.recommended_approach && (
              <div className="p-3 bg-primary-50 border border-primary/10 rounded-lg sm:col-span-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={12} className="text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase">Recommended Approach</span>
                </div>
                <p className="text-xs text-fg-subtle leading-relaxed">{data.recommended_approach}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Deep Profile ───────────────────────────────────────── */}
      <SectionFreshnessBar date={meta?.as_of} category="Bank Profile" sourcePeriod={meta?.kpis_period || 'Annual Report / Public Filings'} />
      {data?.points_of_interest?.length > 0 && (
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
      {data?.overview && (
        <Section title="Overview" defaultOpen={false}>
          <div className="flex items-center gap-2 mb-2"><FlagOutdated bankKey={bankKey} section="overview" compact /></div>
          <p className="text-sm text-fg-subtle leading-relaxed">{data.overview}</p>
        </Section>
      )}
      {data?.financials && (
        <Section title="Financials" defaultOpen={false}>
          <div className="flex items-center gap-2 mb-2">
            <SectionFreshnessBar date={meta?.as_of} category="Financial Data" sourcePeriod={meta?.kpis_period || 'Annual Report'} />
            <FlagOutdated bankKey={bankKey} section="financials" compact />
          </div>
          <p className="text-sm text-fg-subtle leading-relaxed">{data.financials}</p>
        </Section>
      )}
      {data?.digital_strategy && (
        <Section title="Digital Strategy" defaultOpen={false}>
          <div className="flex items-center gap-2 mb-2"><FlagOutdated bankKey={bankKey} section="digital_strategy" compact /></div>
          <p className="text-sm text-fg-subtle leading-relaxed">{data.digital_strategy}</p>
        </Section>
      )}
      {data?.strategic_initiatives && (
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
      {sources?.length > 0 && (
        <div className="mt-5 p-4 bg-surface-2 border border-border rounded-xl">
          <div className="text-xs font-bold text-fg mb-2">Sources & References</div>
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
