import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Globe, Building2, Users, DollarSign, Clock, Shield, Layers, Flag, AlertTriangle, CheckCircle, BarChart3, PieChart, Target, Zap } from 'lucide-react';
import { BANK_DATA, QUAL_DATA, CX_DATA, COMP_DATA, VALUE_SELLING, MARKETS_META, MARKET_DATA, COUNTRY_DATA, calcScore, scoreColor, scoreLabel, dataConfidence, getBanksForMarket } from '../data/utils';
import { DATASET_DATE, DATASET_LABEL, DATASET_VERSION, BANK_METADATA, calcFreshness, bankFreshness, getFlags } from '../data/metadata';
import { SOURCES as SOURCE_DATA } from '../data/sources';
import PipelineStatus from '../components/live/PipelineStatus';
import PipelineChart from '../components/charts/PipelineChart';
import BubbleChart from '../components/charts/BubbleChart';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FadeInUp, StaggerContainer, StaggerItem, AnimatedBar } from '../components/common/Motion';

ChartJS.register(ArcElement, Tooltip, Legend);

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'pipeline', label: 'Pipeline', icon: Target },
  { key: 'cx', label: 'CX & Ratings', icon: PieChart },
  { key: 'competition', label: 'Competition', icon: Shield },
  { key: 'health', label: 'Data Health', icon: AlertTriangle },
];

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const analytics = useMemo(() => {
    const bankKeys = Object.keys(BANK_DATA);
    const scores = bankKeys.map(k => ({ key: k, score: calcScore(k), bank: BANK_DATA[k] }));
    scores.sort((a, b) => b.score - a.score);

    const top10 = scores.slice(0, 10);

    // Score distribution
    const distribution = { strong: 0, good: 0, moderate: 0, low: 0 };
    scores.forEach(({ score }) => {
      if (score >= 8) distribution.strong++;
      else if (score >= 6) distribution.good++;
      else if (score >= 4) distribution.moderate++;
      else distribution.low++;
    });

    // Data confidence
    const confidence = { deep: 0, standard: 0, preliminary: 0 };
    bankKeys.forEach(k => {
      const dc = dataConfidence(k);
      confidence[dc.level]++;
    });

    // Market summary
    const marketSummary = Object.entries(MARKETS_META)
      .filter(([, m]) => m.hasData)
      .map(([key, m]) => {
        const banks = getBanksForMarket(key);
        const avgScore = banks.length > 0
          ? Math.round(banks.reduce((s, b) => s + b.score, 0) / banks.length * 10) / 10
          : 0;
        const md = MARKET_DATA[key];
        return { key, name: m.name, bankCount: banks.length, countryCount: m.countries.length, avgScore, topBank: banks[0], totalPipeline: md?.total_pipeline || 'N/A' };
      })
      .sort((a, b) => b.avgScore - a.avgScore);

    // CX leaders
    const cxLeaders = Object.entries(CX_DATA)
      .map(([key, cx]) => ({
        key, bankName: BANK_DATA[key]?.bank_name || key, country: BANK_DATA[key]?.country || '',
        iosRating: cx.app_rating_ios || 0, androidRating: cx.app_rating_android || 0,
        avgRating: ((cx.app_rating_ios || 0) + (cx.app_rating_android || 0)) / 2,
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10);

    const vsCount = Object.keys(VALUE_SELLING).length;

    // Product fit
    const productFit = {};
    bankKeys.forEach(k => {
      const bd = BANK_DATA[k];
      const products = bd?.backbase_qualification?.product_fit;
      if (products) {
        Object.entries(products).forEach(([prod, val]) => {
          if (!productFit[prod]) productFit[prod] = { high: 0, medium: 0, low: 0, total: 0 };
          productFit[prod].total++;
          if (typeof val === 'string') {
            const v = val.toLowerCase();
            if (v.includes('high') || v.includes('strong')) productFit[prod].high++;
            else if (v.includes('medium') || v.includes('moderate')) productFit[prod].medium++;
            else productFit[prod].low++;
          }
        });
      }
    });

    // Pipeline
    const pipeline = [
      { label: 'Total Profiled', value: bankKeys.length, count: bankKeys.length, color: '#ADB5BD' },
      { label: 'Qualified (4+)', value: scores.filter(s => s.score >= 4).length, count: scores.filter(s => s.score >= 4).length, color: '#F57F17' },
      { label: 'Good Fit (6+)', value: scores.filter(s => s.score >= 6).length, count: scores.filter(s => s.score >= 6).length, color: '#1F3D99' },
      { label: 'Strong Fit (8+)', value: scores.filter(s => s.score >= 8).length, count: scores.filter(s => s.score >= 8).length, color: '#3366FF' },
      { label: 'Value Selling Ready', value: vsCount, count: vsCount, color: '#2E7D32' },
    ];

    // Pipeline value
    const parseDealRange = (str) => {
      if (!str) return { min: 0, max: 0 };
      const rangeM = str.match(/€([\d.]+)-([\d.]+)M/);
      if (rangeM) return { min: parseFloat(rangeM[1]), max: parseFloat(rangeM[2]) };
      const singleM = str.match(/€([\d.]+)M/);
      if (singleM) return { min: parseFloat(singleM[1]), max: parseFloat(singleM[1]) * 1.5 };
      const kToM = str.match(/€([\d.]+)K-([\d.]+)M/);
      if (kToM) return { min: parseFloat(kToM[1]) / 1000, max: parseFloat(kToM[2]) };
      const kMatch = str.match(/€([\d.]+)K/);
      if (kMatch) return { min: parseFloat(kMatch[1]) / 1000, max: parseFloat(kMatch[1]) / 1000 };
      return { min: 0, max: 0 };
    };

    let totalPipelineMin = 0, totalPipelineMax = 0;
    const dealByTiming = { 'Now / Urgent': { min: 0, max: 0, banks: [] }, 'Near-term (6-12mo)': { min: 0, max: 0, banks: [] }, 'Medium-term (1-2yr)': { min: 0, max: 0, banks: [] }, 'Long-term / Unknown': { min: 0, max: 0, banks: [] } };
    const dealByMarket = {};

    // Bubble chart items
    const bubbleItems = [];

    scores.filter(s => s.score >= 4).forEach(({ key, score, bank }) => {
      const q = bank?.backbase_qualification;
      const ds = q?.deal_size || '';
      const { min: minVal, max: maxVal } = parseDealRange(ds);
      totalPipelineMin += minVal;
      totalPipelineMax += maxVal;

      // Bubble chart
      if (minVal > 0) {
        bubbleItems.push({ name: bank?.bank_name || key, score, dealValue: (minVal + maxVal) / 2, r: Math.max(6, Math.min(minVal * 2, 20)) });
      }

      const timing = (q?.timing || '').toLowerCase();
      let bucket = 'Long-term / Unknown';
      if (timing.includes('excellent') || timing.includes('now') || timing.includes('urgent') || timing.includes('immediate')) bucket = 'Now / Urgent';
      else if (timing.includes('good') || timing.includes('6') || timing.includes('12') || timing.includes('near')) bucket = 'Near-term (6-12mo)';
      else if (timing.includes('medium') || timing.includes('2025') || timing.includes('2026') || timing.includes('1-2')) bucket = 'Medium-term (1-2yr)';
      dealByTiming[bucket].min += minVal;
      dealByTiming[bucket].max += maxVal;
      dealByTiming[bucket].banks.push(bank?.bank_name);

      const country = bank?.country;
      const marketKey = Object.entries(MARKETS_META).find(([, m]) => m.countries.includes(country))?.[0] || 'other';
      const marketName = MARKETS_META[marketKey]?.name || 'Other';
      if (!dealByMarket[marketName]) dealByMarket[marketName] = { min: 0, max: 0, count: 0 };
      dealByMarket[marketName].min += minVal;
      dealByMarket[marketName].max += maxVal;
      dealByMarket[marketName].count++;
    });

    // Competitor frequency
    const competitorFrequency = {};
    bankKeys.forEach(k => {
      const comp = COMP_DATA[k];
      if (comp?.key_vendors) {
        comp.key_vendors.forEach(v => {
          const name = v.trim();
          if (!competitorFrequency[name]) competitorFrequency[name] = { count: 0, banks: [] };
          competitorFrequency[name].count++;
          competitorFrequency[name].banks.push(BANK_DATA[k]?.bank_name || k);
        });
      }
    });

    // Data health
    const dataHealth = { fresh: 0, recent: 0, aging: 0, stale: 0, unknown: 0 };
    const bankFreshnessDetails = bankKeys.map(k => {
      const f = bankFreshness(k);
      dataHealth[f.level]++;
      return { key: k, name: BANK_DATA[k]?.bank_name || k, freshness: f };
    });
    const hasMetadata = bankKeys.filter(k => BANK_METADATA[k]).length;
    const hasSources = bankKeys.filter(k => SOURCE_DATA[k]?.length > 0).length;
    const hasCX = Object.keys(CX_DATA).length;
    const hasComp = Object.keys(COMP_DATA).length;
    const hasVS = Object.keys(VALUE_SELLING).length;
    const flagCount = Object.keys(getFlags()).length;
    const staleBanks = bankFreshnessDetails.filter(b => b.freshness.level === 'aging' || b.freshness.level === 'stale');

    return { scores, top10, distribution, confidence, marketSummary, cxLeaders, vsCount, productFit, pipeline, totalBanks: bankKeys.length, totalPipelineMin, totalPipelineMax, dealByTiming, dealByMarket, competitorFrequency, dataHealth, bankFreshnessDetails, hasMetadata, hasSources, hasCX, hasComp, hasVS, flagCount, staleBanks, bubbleItems };
  }, []);

  const stats = [
    { label: 'Total Banks', value: analytics.totalBanks, icon: Building2, color: '#3366FF' },
    { label: 'Markets', value: analytics.marketSummary.length, icon: Globe, color: '#7C4DFF' },
    { label: 'Avg Fit Score', value: (analytics.scores.reduce((s, b) => s + b.score, 0) / analytics.scores.length).toFixed(1), icon: TrendingUp, color: '#2E7D32' },
    { label: 'Value Selling Ready', value: analytics.vsCount, icon: Users, color: '#E65100' },
  ];

  return (
    <div className="animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-fg-muted hover:text-primary mb-4 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-fg">Analytics Dashboard</h1>
          <p className="text-sm text-fg-muted">Aggregate intelligence across all markets and banks</p>
        </div>
      </div>

      {/* Stats Banner — animated cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-surface border border-border rounded-xl p-4 text-center hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: s.color + '15' }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div className="text-2xl font-black text-fg">{s.value}</div>
            <div className="text-[10px] text-fg-muted uppercase tracking-wider font-semibold">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-surface-2 text-fg-muted hover:text-fg hover:bg-surface-3'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab analytics={analytics} navigate={navigate} />}
      {activeTab === 'pipeline' && <PipelineTab analytics={analytics} navigate={navigate} />}
      {activeTab === 'cx' && <CxTab analytics={analytics} navigate={navigate} />}
      {activeTab === 'competition' && <CompetitionTab analytics={analytics} navigate={navigate} />}
      {activeTab === 'health' && <HealthTab analytics={analytics} navigate={navigate} />}
    </div>
  );
}

// ── Overview Tab ──
function OverviewTab({ analytics, navigate }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution — Doughnut */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-fg mb-4">Score Distribution</h3>
          <div className="flex items-center gap-6">
            <div className="w-40 h-40 shrink-0">
              <Doughnut
                data={{
                  labels: ['Strong (8+)', 'Good (6-8)', 'Moderate (4-6)', 'Low (<4)'],
                  datasets: [{
                    data: [analytics.distribution.strong, analytics.distribution.good, analytics.distribution.moderate, analytics.distribution.low],
                    backgroundColor: ['#3366FF', '#1F3D99', '#F57F17', '#FF7262'],
                    borderWidth: 0,
                    cutout: '65%',
                  }],
                }}
                options={{
                  responsive: true, maintainAspectRatio: true,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="space-y-2 flex-1">
              {[
                { label: 'Strong Fit (8-10)', count: analytics.distribution.strong, color: '#3366FF' },
                { label: 'Good Fit (6-8)', count: analytics.distribution.good, color: '#1F3D99' },
                { label: 'Moderate (4-6)', count: analytics.distribution.moderate, color: '#F57F17' },
                { label: 'Low Fit (<4)', count: analytics.distribution.low, color: '#FF7262' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-fg-subtle flex-1">{d.label}</span>
                  <span className="text-xs font-bold text-fg">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Confidence — Doughnut */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-fg mb-4">Data Confidence</h3>
          <div className="flex items-center gap-6">
            <div className="w-40 h-40 shrink-0">
              <Doughnut
                data={{
                  labels: ['Deep', 'Standard', 'Preliminary'],
                  datasets: [{
                    data: [analytics.confidence.deep, analytics.confidence.standard, analytics.confidence.preliminary],
                    backgroundColor: ['#2E7D32', '#F57F17', '#FF7262'],
                    borderWidth: 0,
                    cutout: '65%',
                  }],
                }}
                options={{
                  responsive: true, maintainAspectRatio: true,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="space-y-3 flex-1">
              {[
                { label: 'Deep Intelligence', count: analytics.confidence.deep, color: '#2E7D32', desc: 'Full profiles with operational data' },
                { label: 'Standard Coverage', count: analytics.confidence.standard, color: '#F57F17', desc: 'Core qualification + CX data' },
                { label: 'Preliminary', count: analytics.confidence.preliminary, color: '#FF7262', desc: 'Basic market intelligence' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px]" style={{ backgroundColor: d.color }}>{d.count}</div>
                  <div>
                    <div className="text-xs font-semibold text-fg">{d.label}</div>
                    <div className="text-[10px] text-fg-muted">{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top 10 Banks */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold text-fg mb-4">Top 10 Banks by Fit Score</h3>
        <div className="space-y-1">
          {analytics.top10.map((b, i) => (
            <motion.div
              key={b.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/bank/${b.key}`)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-2 cursor-pointer transition-all group"
            >
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-fg truncate group-hover:text-primary transition-colors">{b.bank?.bank_name}</div>
                <div className="text-[10px] text-fg-muted">{b.bank?.country}</div>
              </div>
              <div className="text-right mr-2">
                <span className="text-lg font-black" style={{ color: scoreColor(b.score) }}>{b.score}</span>
                <div className="text-[9px] text-fg-muted">{scoreLabel(b.score)}</div>
              </div>
              <div className="w-20 h-2 bg-surface-2 rounded-full overflow-hidden hidden sm:block">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${b.score * 10}%` }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: scoreColor(b.score) }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Market Rankings + Opportunity Bubble */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-fg mb-4">Markets by Average Fit Score</h3>
          <div className="space-y-2">
            {analytics.marketSummary.map((m, i) => (
              <div
                key={m.key}
                onClick={() => navigate(`/market/${m.key}`)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-2 cursor-pointer transition-all group"
              >
                <span className="w-6 h-6 rounded-full bg-surface-2 text-fg-muted text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-fg group-hover:text-primary transition-colors">{m.name}</div>
                  <div className="text-[10px] text-fg-muted">{m.bankCount} banks • {m.countryCount} countries</div>
                </div>
                <span className="text-lg font-bold" style={{ color: scoreColor(m.avgScore) }}>{m.avgScore}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunity Bubble Chart */}
        {analytics.bubbleItems.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-fg mb-2">Opportunity Map</h3>
            <p className="text-[10px] text-fg-muted mb-3">Score vs deal value — bubble size = deal magnitude</p>
            <BubbleChart items={analytics.bubbleItems} height={280} onBankClick={(key) => navigate(`/bank/${key}`)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pipeline Tab ──
function PipelineTab({ analytics, navigate }) {
  return (
    <div className="space-y-6">
      {/* Pipeline Funnel */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold text-fg mb-4">Pipeline Funnel</h3>
        <PipelineChart stages={analytics.pipeline} />
      </div>

      {/* Product Fit Heatmap */}
      {Object.keys(analytics.productFit).length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-fg mb-4">Product Fit Coverage</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-2 text-left text-fg-muted">Product</th>
                  <th className="p-2 text-center text-fg-muted">High Fit</th>
                  <th className="p-2 text-center text-fg-muted">Medium Fit</th>
                  <th className="p-2 text-center text-fg-muted">Low Fit</th>
                  <th className="p-2 text-center text-fg-muted">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics.productFit)
                  .sort(([, a], [, b]) => b.high - a.high)
                  .map(([prod, data]) => {
                    const pct = data.total > 0 ? Math.round(data.high / data.total * 100) : 0;
                    return (
                      <tr key={prod} className="border-b border-border/50 hover-row">
                        <td className="p-2.5 font-semibold text-fg capitalize">{prod.replace(/_/g, ' ')}</td>
                        <td className="p-2 text-center">
                          <span className="inline-block w-8 h-6 rounded text-white text-[10px] font-bold leading-6" style={{ backgroundColor: data.high > 0 ? '#2E7D32' : '#e5e7eb' }}>
                            {data.high}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span className="inline-block w-8 h-6 rounded text-white text-[10px] font-bold leading-6" style={{ backgroundColor: data.medium > 0 ? '#F57F17' : '#e5e7eb' }}>
                            {data.medium}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span className="inline-block w-8 h-6 rounded text-white text-[10px] font-bold leading-6" style={{ backgroundColor: data.low > 0 ? '#FF7262' : '#e5e7eb' }}>
                            {data.low}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-fg-muted">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pipeline Value */}
      {analytics.totalPipelineMin > 0 && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-primary" />
            <h3 className="text-lg font-bold text-fg">Pipeline Value (Qualified Banks)</h3>
          </div>

          {/* Value cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Conservative', value: analytics.totalPipelineMin, accent: false },
              { label: 'Mid-Range', value: (analytics.totalPipelineMin + analytics.totalPipelineMax) / 2, accent: true },
              { label: 'Optimistic', value: analytics.totalPipelineMax, accent: false },
            ].map(v => (
              <motion.div
                key={v.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-center p-4 rounded-xl ${
                  v.accent
                    ? 'bg-primary/10 border-2 border-primary/30'
                    : 'bg-primary-50 dark:bg-primary/10'
                }`}
              >
                <div className="text-2xl font-black text-primary">€{v.value.toFixed(1)}M</div>
                <div className="text-[10px] text-fg-muted uppercase font-semibold">{v.label}</div>
              </motion.div>
            ))}
          </div>

          {/* By Timing */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-fg-muted" />
              <h4 className="text-sm font-bold text-fg">By Timing</h4>
            </div>
            <div className="space-y-2">
              {Object.entries(analytics.dealByTiming)
                .filter(([, d]) => d.banks.length > 0)
                .sort(([, a], [, b]) => b.min - a.min)
                .map(([label, d], i) => {
                  const pct = analytics.totalPipelineMax > 0 ? (d.max / analytics.totalPipelineMax * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-fg-subtle">{label}</span>
                        <span className="font-bold text-fg">€{d.min.toFixed(1)}-{d.max.toFixed(1)}M <span className="text-fg-muted font-normal">({d.banks.length} banks)</span></span>
                      </div>
                      <AnimatedBar width={pct} delay={0.1 + i * 0.1} />
                      <div className="text-[10px] text-fg-disabled mt-0.5">{d.banks.join(', ')}</div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* By Market */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={14} className="text-fg-muted" />
              <h4 className="text-sm font-bold text-fg">By Market</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(analytics.dealByMarket)
                .sort(([, a], [, b]) => b.max - a.max)
                .map(([market, d]) => (
                  <motion.div key={market} whileHover={{ scale: 1.02 }} className="p-3 bg-surface-2 rounded-lg">
                    <div className="text-sm font-bold text-fg">{market}</div>
                    <div className="text-lg font-black text-primary">€{d.min.toFixed(1)}-{d.max.toFixed(1)}M</div>
                    <div className="text-[10px] text-fg-muted">{d.count} qualified bank{d.count !== 1 ? 's' : ''}</div>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CX Tab ──
function CxTab({ analytics, navigate }) {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold text-fg mb-4">CX Leaders (App Ratings)</h3>
        <div className="space-y-1">
          {analytics.cxLeaders.map((b, i) => (
            <motion.div
              key={b.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/bank/${b.key}`)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-2 cursor-pointer transition-all group"
            >
              <span className="w-6 h-6 rounded-full bg-surface-2 text-fg-muted text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-fg group-hover:text-primary transition-colors">{b.bankName}</div>
                <div className="text-[10px] text-fg-muted">{b.country}</div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center">
                  <div className="text-[9px] text-fg-disabled">iOS</div>
                  <div className={`font-bold ${b.iosRating >= 4.5 ? 'text-success' : b.iosRating >= 4.0 ? 'text-primary' : 'text-danger'}`}>{b.iosRating}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-fg-disabled">Android</div>
                  <div className={`font-bold ${b.androidRating >= 4.5 ? 'text-success' : b.androidRating >= 4.0 ? 'text-primary' : 'text-danger'}`}>{b.androidRating}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-fg-disabled">Avg</div>
                  <div className="font-black text-primary">{b.avgRating.toFixed(1)}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Competition Tab ──
function CompetitionTab({ analytics, navigate }) {
  return (
    <div className="space-y-6">
      {Object.keys(analytics.competitorFrequency).length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-primary-700" />
            <h3 className="text-lg font-bold text-fg">Competitor Landscape</h3>
          </div>
          <p className="text-xs text-fg-muted mb-4">Vendors deployed across profiled banks — sorted by frequency</p>
          <div className="space-y-3">
            {Object.entries(analytics.competitorFrequency)
              .sort(([, a], [, b]) => b.count - a.count)
              .slice(0, 15)
              .map(([vendor, info], i) => {
                const pct = (info.count / analytics.totalBanks * 100);
                return (
                  <div key={vendor}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-fg">{vendor}</span>
                      <span className="text-fg-muted">{info.count} bank{info.count !== 1 ? 's' : ''} ({pct.toFixed(0)}%)</span>
                    </div>
                    <AnimatedBar width={pct} color="#1F3D99" height="h-2.5" delay={0.05 + i * 0.03} />
                    <div className="text-[10px] text-fg-disabled mt-0.5">{info.banks.join(', ')}</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Data Health Tab ──
function HealthTab({ analytics, navigate }) {
  return (
    <div className="space-y-6">
      {/* Live Data Pipeline */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
        <PipelineStatus />
      </div>

      {/* Data Health */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={18} className="text-fg-muted" />
          <h3 className="text-lg font-bold text-fg">Data Health</h3>
        </div>
        <p className="text-xs text-fg-muted mb-5">Dataset: {DATASET_LABEL} • Version {DATASET_VERSION} • Compiled {new Date(DATASET_DATE).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        {/* Freshness grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Fresh (<90d)', count: analytics.dataHealth.fresh, color: '#2E7D32', bg: '#E8F5E9', icon: CheckCircle },
            { label: 'Recent (3-6mo)', count: analytics.dataHealth.recent, color: '#F57F17', bg: '#FFF8E1', icon: Clock },
            { label: 'Aging (6-12mo)', count: analytics.dataHealth.aging, color: '#E65100', bg: '#FFF3E0', icon: AlertTriangle },
            { label: 'Stale (12mo+)', count: analytics.dataHealth.stale + analytics.dataHealth.unknown, color: '#C62828', bg: '#FFEBEE', icon: AlertTriangle },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="p-3 rounded-lg text-center"
              style={{ backgroundColor: s.bg }}
            >
              <s.icon size={16} className="mx-auto mb-1" style={{ color: s.color }} />
              <div className="text-xl font-black" style={{ color: s.color }}>{s.count}</div>
              <div className="text-[10px] text-fg-muted">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Coverage stats */}
        <div className="mb-5">
          <h4 className="text-sm font-bold text-fg mb-3">Intelligence Coverage</h4>
          <div className="space-y-2">
            {[
              { label: 'Full Bank Profiles', value: analytics.totalBanks, total: analytics.totalBanks },
              { label: 'Timestamped Metadata', value: analytics.hasMetadata, total: analytics.totalBanks },
              { label: 'Source References', value: analytics.hasSources, total: analytics.totalBanks },
              { label: 'CX Data (App Ratings)', value: analytics.hasCX, total: analytics.totalBanks },
              { label: 'Competition Data', value: analytics.hasComp, total: analytics.totalBanks },
              { label: 'Value Selling Hypotheses', value: analytics.hasVS, total: analytics.totalBanks },
            ].map((c, i) => {
              const pct = (c.value / c.total * 100);
              const color = pct >= 80 ? '#2E7D32' : pct >= 50 ? '#F57F17' : '#C62828';
              return (
                <div key={c.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-fg-subtle">{c.label}</span>
                    <span className="font-bold" style={{ color }}>{c.value}/{c.total} ({pct.toFixed(0)}%)</span>
                  </div>
                  <AnimatedBar width={pct} color={color} height="h-2" delay={0.05 + i * 0.05} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Flagged */}
        {analytics.flagCount > 0 && (
          <div className="p-3 bg-danger-subtle border border-danger/10 rounded-lg mb-5">
            <div className="flex items-center gap-2 text-danger text-xs font-bold mb-1">
              <Flag size={12} />
              {analytics.flagCount} section{analytics.flagCount !== 1 ? 's' : ''} flagged as potentially outdated
            </div>
            <p className="text-[10px] text-fg-muted">Users have flagged sections that may need verification.</p>
          </div>
        )}

        {/* Stale banks */}
        {analytics.staleBanks.length > 0 && (
          <div className="p-3 bg-surface-2 rounded-lg">
            <h4 className="text-xs font-bold text-fg mb-2">Banks Needing Data Refresh</h4>
            <div className="flex flex-wrap gap-1">
              {analytics.staleBanks.map(b => (
                <span
                  key={b.key}
                  onClick={() => navigate(`/bank/${encodeURIComponent(b.key)}`)}
                  className="text-[10px] px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity font-semibold"
                  style={{ backgroundColor: b.freshness.bg, color: b.freshness.color }}
                >
                  {b.name} • {b.freshness.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
