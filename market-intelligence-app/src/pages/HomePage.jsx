import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMarkets, useStats } from '../hooks/useData';
import { LoadingState, ErrorState } from '../components/common/DataState';
import StatBanner from '../components/common/StatBanner';
import Card from '../components/common/Card';
import { FadeInUp, StaggerContainer, StaggerItem } from '../components/common/Motion';

export default function HomePage() {
  const { data: markets, isLoading: marketsLoading, error: marketsError } = useMarkets();
  const { data: stats, isLoading: statsLoading } = useStats();

  if (marketsLoading) return <LoadingState message="Loading markets..." />;
  if (marketsError) return <ErrorState message={marketsError.message} />;

  const totalBanks = stats?.totalBanks || 0;
  const totalCountries = stats?.totalCountries || 0;
  const totalMarkets = stats?.totalMarkets || 0;
  const avgScore = stats?.avgScore || 0;

  const mvpMarkets = ['nordics', 'benelux', 'dach', 'uk_ireland', 'iberia'];
  const marketEntries = (markets || []).map(m => [m.key, m]);
  const mvp = marketEntries.filter(([k]) => mvpMarkets.includes(k));
  const other = marketEntries.filter(([k]) => !mvpMarkets.includes(k));

  return (
    <div>
      <FadeInUp>
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-fg">
            Market Intelligence<br />Command Center
          </h1>
          <p className="text-fg-muted text-xs sm:text-sm mt-2 max-w-md mx-auto">Banking market intelligence for Backbase value consulting</p>
          <div className="text-[10px] text-fg-disabled mt-1">Data as of March 2026 • Nordics MVP</div>
        </div>
      </FadeInUp>

      <FadeInUp delay={0.1}>
        <StatBanner stats={[
          { value: totalMarkets, label: 'Markets' },
          { value: totalCountries, label: 'Countries' },
          { value: totalBanks, label: 'Banks Profiled' },
          { value: avgScore, label: 'Avg Fit Score' },
        ]} />
      </FadeInUp>

      <FadeInUp delay={0.2}>
        <h3 className="text-xs font-bold text-fg uppercase tracking-wider mb-3">Priority Markets</h3>
      </FadeInUp>
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {mvp.map(([key, m]) => (
          <StaggerItem key={key}>
            <MarketCard marketKey={key} meta={m} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      <details className="mb-6">
        <summary className="text-xs text-fg-muted cursor-pointer hover:text-primary transition-colors">Other Markets</summary>
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-3">
          {other.map(([key, m]) => (
            <StaggerItem key={key}>
              <MarketCard marketKey={key} meta={m} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </details>
    </div>
  );
}

function MarketCard({ marketKey, meta }) {
  const md = meta.data;
  const kpis = md?.kpis?.slice(0, 2) || [];
  const hasData = meta.has_data;

  const cardContent = (
    <Card hover={hasData} className={`relative ${!hasData ? 'opacity-40' : ''}`}>
      {hasData && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />}
      <div className="text-2xl mb-2">{meta.emoji}</div>
      <div className="font-bold text-fg text-sm mb-1">{meta.name}</div>
      <div className="flex gap-3 mb-2">
        <span className="text-xl font-black text-primary">{meta.countries.length}</span>
        <span className="text-[10px] text-fg-muted leading-tight">countries<br />{meta.countries.slice(0, 3).join(', ')}{meta.countries.length > 3 ? '...' : ''}</span>
      </div>
      {kpis.length > 0 && (
        <div className="flex gap-1.5">
          {kpis.map((k, i) => (
            <div key={i} className="flex-1 px-2 py-1 bg-surface-3 rounded text-center">
              <div className="text-[8px] text-fg-disabled uppercase">{k.label}</div>
              <div className="text-xs font-bold text-fg">{k.value}</div>
            </div>
          ))}
        </div>
      )}
      {!hasData ? <div className="text-[10px] text-fg-disabled italic mt-2">Coming soon</div>
        : <div className="text-primary text-[11px] font-semibold mt-2">Explore →</div>}
    </Card>
  );

  if (hasData) {
    return <Link to={`/market/${marketKey}`} className="block no-underline">{cardContent}</Link>;
  }
  return cardContent;
}
