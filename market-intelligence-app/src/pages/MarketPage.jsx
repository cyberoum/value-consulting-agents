import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMarket, useMarketBanks } from '../hooks/useData';
import { calcScoreFromData, scoreColor } from '../data/scoring';
import { LoadingState, ErrorState } from '../components/common/DataState';
import Card from '../components/common/Card';
import TabBar from '../components/common/TabBar';
import Section from '../components/common/Section';
import BarChart from '../components/charts/BarChart';

export default function MarketPage() {
  const { marketKey } = useParams();
  const navigate = useNavigate();
  const { data: marketData, isLoading, error } = useMarket(marketKey);
  const { data: marketBanks } = useMarketBanks(marketKey);

  if (isLoading) return <LoadingState message="Loading market..." />;
  if (error) return <ErrorState message={error.message} />;

  const meta = marketData;
  const data = marketData?.data;

  if (!meta || !data) {
    return (
      <div>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-fg-muted hover:text-primary mb-4"><ArrowLeft size={16} /> Back</button>
        <p className="text-primary-700">Data for this market is being researched.</p>
      </div>
    );
  }

  // Compute scores and filter top banks
  const banks = (marketBanks || []).map(b => ({
    ...b,
    name: b.bank_name,
    score: calcScoreFromData(b.qualification),
    qualification: b.data?.backbase_qualification || null,
  })).filter(b => b.score >= 5).sort((a, b) => b.score - a.score).slice(0, 10);

  const OpportunitiesTab = () => (
    <div>
      {banks.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-fg mb-3">🎯 Top Opportunities — {meta.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
            {banks.map(b => (
              <div key={b.key} onClick={() => navigate(`/bank/${encodeURIComponent(b.key)}`)}
                className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg cursor-pointer hover:border-primary/40 transition-all">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0"
                  style={{ color: scoreColor(b.score), background: scoreColor(b.score) + '12' }}>{b.score}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-fg truncate">{b.name}</div>
                  <div className="text-[10px] font-semibold truncate" style={{ color: scoreColor(b.score) }}>{b.qualification?.label || ''}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-semibold text-primary-700">{b.qualification?.deal_size || ''}</div>
                  <div className="text-[9px] text-fg-disabled">{b.country}</div>
                </div>
              </div>
            ))}
          </div>
          <h3 className="text-sm font-bold text-fg mb-3">Score Distribution</h3>
          <div className="bg-surface border border-border rounded-xl p-4 mb-6">
            <BarChart items={banks.map(b => ({ name: b.name, score: b.score }))} height={banks.length * 32 + 40} />
          </div>
        </>
      )}
      <h3 className="text-sm font-bold text-fg mb-3">Market Opportunities</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {data.key_opportunities.map((o, i) => (
          <div key={i} className="p-4 bg-primary-700/5 border border-primary-700/10 rounded-lg">
            <div className="font-bold text-sm text-primary-700 mb-1">{o.title}</div>
            <div className="text-xs text-fg-muted leading-relaxed">{o.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const OverviewTab = () => (
    <div>
      <div className="p-4 bg-surface border border-border rounded-xl mb-4">
        <p className="text-sm text-fg-subtle leading-relaxed">{data.market_overview.split('\n').map((p, i) => <span key={i}>{p}<br /><br /></span>)}</p>
      </div>
      {data.banking_landscape && <Section title="Banking Landscape"><p className="text-sm text-fg-subtle leading-relaxed">{data.banking_landscape}</p></Section>}
      {data.digital_maturity && <Section title="Digital Maturity" defaultOpen={false}><p className="text-sm text-fg-subtle leading-relaxed">{data.digital_maturity}</p></Section>}
    </div>
  );

  const DeepDiveTab = () => (
    <div>
      {data.regulations && <Section title="Regulatory Environment"><p className="text-sm text-fg-subtle leading-relaxed">{data.regulations}</p></Section>}
      {data.consumer_behavior && <Section title="Consumer Behavior" defaultOpen={false}><p className="text-sm text-fg-subtle leading-relaxed">{data.consumer_behavior}</p></Section>}
      {data.competitive_landscape && (
        <>
          <h3 className="text-sm font-bold text-fg mb-3">Vendor Competitive Landscape</h3>
          <div className="p-4 bg-primary-50 border border-primary/20 rounded-xl">
            <p className="text-xs text-fg-subtle leading-relaxed">{data.competitive_landscape}</p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-fg-muted hover:text-primary mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Markets
      </button>

      <div className="mb-5">
        <div className="text-3xl mb-1">{meta.emoji}</div>
        <h2 className="text-2xl font-black text-fg">{meta.name} Banking Market</h2>
        <p className="text-fg-muted text-xs mt-1">{data.market_overview.split('.').slice(0, 2).join('.')}.</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-5">
        {data.kpis.map((k, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg px-2.5 sm:px-3 py-2">
            <div className="text-[8px] sm:text-[9px] text-fg-disabled uppercase tracking-wide">{k.label}</div>
            <div className="text-base sm:text-lg font-bold text-primary">{k.value}</div>
            {k.sub && <div className="text-[9px] sm:text-[10px] text-fg-disabled">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Countries */}
      <h3 className="text-sm font-bold text-fg mb-2">Countries</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
        {data.countries.map(co => (
          <Card key={co.name} hover onClick={() => navigate(`/country/${encodeURIComponent(co.name)}`)}>
            <div className="font-bold text-sm text-fg">{co.name}</div>
            <div className="text-[10px] text-fg-muted mt-1 line-clamp-2">{co.headline}</div>
            <div className="text-primary text-[10px] font-semibold mt-2">Explore →</div>
          </Card>
        ))}
      </div>

      <TabBar tabs={[
        { label: '🎯 Opportunities', content: <OpportunitiesTab /> },
        { label: '📊 Overview', content: <OverviewTab /> },
        { label: '🔍 Deep Dive', content: <DeepDiveTab /> },
      ]} />
    </div>
  );
}
