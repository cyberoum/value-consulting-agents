import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Zap, Target, Users, Shield, TrendingUp, FileText, Clock, Plus } from 'lucide-react';
import { BANK_DATA, QUAL_DATA, QUAL_FRAMEWORK, CX_DATA, COMP_DATA, VALUE_SELLING, SOURCES, GROUP_RELATIONSHIPS, calcScore, scoreColor, scoreBg, scoreLabel, dataConfidence, parseBankKey, getMarketForCountry } from '../data/utils';
import Card from '../components/common/Card';
import TabBar from '../components/common/TabBar';
import Section from '../components/common/Section';
import { ScoreBadge, ConfidenceBadge, PriorityBadge, FavoriteButton } from '../components/common/Badge';
import SectionFeedback from '../components/common/SectionFeedback';
import SourceBadge from '../components/common/SourceBadge';
import RadarChart from '../components/charts/RadarChart';
import ScoreGauge from '../components/charts/ScoreGauge';
import BriefingModal from '../components/bank/BriefingModal';
import QuickPrepModal from '../components/bank/QuickPrepModal';
import ScoreExplainer from '../components/bank/ScoreExplainer';
import ExportBar from '../components/bank/ExportBar';
import SelectableItem from '../components/bank/SelectableItem';
import { useFavorites } from '../context/FavoritesContext';
import useFeedback from '../hooks/useFeedback';
import FreshnessBadge, { SectionFreshnessBar } from '../components/common/FreshnessBadge';
import FlagOutdated from '../components/common/FlagOutdated';
import { BANK_METADATA, bankFreshness } from '../data/metadata';
import { getIntelForBank, getPendingCount } from '../data/userIntel';
import IntelPanel from '../components/intel/IntelPanel';
import IntelFeed from '../components/intel/IntelFeed';
import LiveRatingBadge, { LiveRatingsCard } from '../components/live/LiveRatingBadge';
import LiveNewsFeed, { NewsSignalBadge } from '../components/live/LiveNewsFeed';
import LiveStockTicker, { LiveStockCard } from '../components/live/LiveStockTicker';
import AiInsightsCard, { AiSignalBadge } from '../components/live/AiInsightsCard';
import { getPipelineStatus } from '../data/liveDataProvider';
import RoiPanel from '../components/bank/RoiPanel';
import BattleCardsPanel from '../components/bank/BattleCardsPanel';
import DiscoveryPanel from '../components/bank/DiscoveryPanel';

export default function BankPage() {
  const { bankKey } = useParams();
  const navigate = useNavigate();
  const key = decodeURIComponent(bankKey);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [quickPrepOpen, setQuickPrepOpen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);
  const [intelRefresh, setIntelRefresh] = useState(0);
  const data = BANK_DATA[key];
  const { bankName, country } = parseBankKey(key);
  const marketKey = getMarketForCountry(country);
  const score = calcScore(key);
  const q = data?.backbase_qualification;
  const qd = QUAL_DATA[key];
  const cx = CX_DATA[key];
  const comp = COMP_DATA[key];
  const vs = VALUE_SELLING[key];
  const grp = GROUP_RELATIONSHIPS[key];
  const sources = SOURCES[key] || [];
  const conf = dataConfidence(key);
  const meta = BANK_METADATA[key];
  const freshness = bankFreshness(key);
  const pipelineActive = getPipelineStatus().isPopulated;
  const intelEntries = getIntelForBank(key);
  const pendingIntel = getPendingCount(key);
  const refreshIntel = useCallback(() => setIntelRefresh(n => n + 1), []);
  const { toggle: toggleFav, isFavorite } = useFavorites();
  const { getFeedback, setFeedbackFor } = useFeedback();

  if (!data) {
    return (
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-fg-muted hover:text-primary mb-4"><ArrowLeft size={16} /> Back</button>
        <p className="text-primary-700">No data available for this bank.</p>
      </div>
    );
  }

  // Build radar data from qualification dimensions
  const radarLabels = []; const radarScores = [];
  if (qd) {
    Object.entries(QUAL_FRAMEWORK.dimensions).forEach(([dim, fw]) => {
      if (qd[dim]) { radarLabels.push(fw.label); radarScores.push(qd[dim].score); }
    });
  }

  // Tab: Pursue
  const PursueTab = () => (
    <div>
      <SectionFreshnessBar date={meta?.as_of} category="Deal Intel" sourcePeriod={meta?.source_period} />
      {/* Engagement Zones */}
      {q?.engagement_banking_zones?.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-fg">Engagement Banking Zones</h3>
            <SourceBadge sourceCount={q.engagement_banking_zones.length} confidence="high" />
            <SectionFeedback sectionId={`${key}-ez`} getFeedback={getFeedback} setFeedbackFor={setFeedbackFor} />
            <FlagOutdated bankKey={key} section="engagement_zones" compact />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-5">
            {q.engagement_banking_zones.map((z, i) => (
              <SelectableItem key={i} id={`ez-${i}`} label={z.zone} category="Engagement Zones" content={`**${z.zone}** (${z.priority})\n${z.detail}`}>
                <div className="p-3 bg-primary-50 border border-primary/10 rounded-lg">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-primary">{z.zone}</span>
                    <PriorityBadge priority={z.priority} />
                  </div>
                  <p className="text-[11px] text-fg-muted leading-relaxed">{z.detail}</p>
                </div>
              </SelectableItem>
            ))}
          </div>
        </>
      )}
      {/* Landing Zones */}
      {data.backbase_landing_zones?.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-fg">Landing Zones</h3>
            <SourceBadge sourceCount={data.backbase_landing_zones.length} confidence="high" />
            <SectionFeedback sectionId={`${key}-lz`} getFeedback={getFeedback} setFeedbackFor={setFeedbackFor} />
          </div>
          <div className="space-y-2 mb-5">
            {data.backbase_landing_zones.map((lz, i) => (
              <SelectableItem key={i} id={`lz-${i}`} label={lz.zone} category="Landing Zones" content={`**${lz.zone}** — Fit: ${lz.fit_score}/10\n${lz.rationale}${lz.entry_strategy ? '\nEntry: ' + lz.entry_strategy : ''}`}>
                <div className="p-3 bg-surface border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-fg">{lz.zone}</span>
                    <span className="text-sm font-black" style={{ color: scoreColor(lz.fit_score) }}>{lz.fit_score}/10</span>
                  </div>
                  <p className="text-xs text-fg-muted mb-1">{lz.rationale}</p>
                  {lz.entry_strategy && <p className="text-xs text-primary-700 italic">Entry: {lz.entry_strategy}</p>}
                </div>
              </SelectableItem>
            ))}
          </div>
        </>
      )}
      {/* Signals */}
      {data.signals?.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-fg">Signals</h3>
            <SourceBadge sourceCount={data.signals.length} confidence="medium" />
            <SectionFeedback sectionId={`${key}-sig`} getFeedback={getFeedback} setFeedbackFor={setFeedbackFor} />
          </div>
          <div className="space-y-1.5 mb-5">
            {data.signals.map((s, i) => (
              <SelectableItem key={i} id={`sig-${i}`} label={s.signal} category="Signals" content={`**${s.signal}**\n${s.implication}`}>
                <div className="p-3 bg-primary-50 border-l-3 border-primary rounded-r-lg">
                  <div className="font-bold text-xs text-primary">{s.signal}</div>
                  <div className="text-[11px] text-fg-muted mt-0.5">{s.implication}</div>
                </div>
              </SelectableItem>
            ))}
          </div>
        </>
      )}
      {/* Recommended Approach */}
      {data.recommended_approach && (
        <Section title="Recommended Approach" color="#1F3D99">
          <p className="text-sm text-fg-subtle leading-relaxed">{data.recommended_approach}</p>
        </Section>
      )}
    </div>
  );

  // Tab: Win
  const WinTab = () => (
    <div>
      <SectionFreshnessBar date={meta?.as_of} category="Value Selling" sourcePeriod={meta?.source_period} />
      {vs && (
        <>
          {vs.value_hypothesis && (
            <SelectableItem id="vh" label="Value Hypothesis" category="Value Selling" content={`**Value Hypothesis:** ${vs.value_hypothesis.one_liner}\n- IF: ${vs.value_hypothesis.if_condition}\n- THEN: ${vs.value_hypothesis.then_outcome}\n- BY: ${vs.value_hypothesis.by_deploying}\n- RESULT: ${vs.value_hypothesis.resulting_in}`}>
              <div className="p-4 bg-primary-900 rounded-xl mb-5 text-white">
                <div className="flex items-center gap-2">
                  <div className="text-[10px] uppercase tracking-wider text-white/60 mb-1">Value Hypothesis</div>
                  <SectionFeedback sectionId={`${key}-vh`} getFeedback={getFeedback} setFeedbackFor={setFeedbackFor} />
                </div>
                <p className="text-sm font-semibold leading-relaxed mb-3">"{vs.value_hypothesis.one_liner}"</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div><span className="font-bold text-primary-200">IF:</span> {vs.value_hypothesis.if_condition}</div>
                  <div><span className="font-bold text-primary-200">THEN:</span> {vs.value_hypothesis.then_outcome}</div>
                  <div><span className="font-bold text-primary-200">BY:</span> {vs.value_hypothesis.by_deploying}</div>
                  <div><span className="font-bold text-primary-200">RESULT:</span> {vs.value_hypothesis.resulting_in}</div>
                </div>
              </div>
            </SelectableItem>
          )}
          {vs.discovery_questions?.length > 0 && (
            <Section title="Discovery Questions">
              <div className="space-y-1.5">
                {vs.discovery_questions.map((dq, i) => (
                  <div key={i} className="p-2 bg-surface-2 rounded text-xs text-fg-subtle italic">"{dq}"</div>
                ))}
              </div>
            </Section>
          )}
          {vs.product_mapping?.length > 0 && (
            <Section title="Product Mapping">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-surface-2 text-fg-muted"><th className="px-3 py-2 text-left">Zone</th><th className="px-3 py-2">Products</th><th className="px-3 py-2">Timeline</th><th className="px-3 py-2">Users</th></tr></thead>
                  <tbody>
                    {vs.product_mapping.map((pm, i) => (
                      <tr key={i} className="border-t border-border"><td className="px-3 py-2 font-semibold text-primary">{pm.zone}</td><td className="px-3 py-2 text-center">{pm.products.join(', ')}</td><td className="px-3 py-2 text-center">{pm.timeline}</td><td className="px-3 py-2 text-center">{pm.users}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
          {vs.reference_customers?.length > 0 && (
            <Section title="Reference Customers" defaultOpen={false}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {vs.reference_customers.map((r, i) => (
                  <div key={i} className="p-3 bg-success-subtle rounded-lg">
                    <div className="font-bold text-sm text-success">{r.name} <span className="text-xs font-normal text-fg-muted">({r.region})</span></div>
                    <p className="text-xs text-fg-subtle mt-1">{r.relevance}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
      {/* Competition */}
      {comp && (
        <Section title="Competitive Landscape">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div><div className="text-[10px] font-bold text-fg-muted uppercase mb-1">Core Banking</div><div className="text-xs text-fg">{comp.core_banking}</div></div>
            <div><div className="text-[10px] font-bold text-fg-muted uppercase mb-1">Digital Platform</div><div className="text-xs text-fg">{comp.digital_platform}</div></div>
          </div>
          {comp.key_vendors?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">{comp.key_vendors.map((v, i) => <span key={i} className="text-[10px] bg-surface-3 px-2 py-0.5 rounded">{v}</span>)}</div>
          )}
          {comp.vendor_risk && <p className="text-xs text-warning italic mt-2">{comp.vendor_risk}</p>}
        </Section>
      )}
    </div>
  );

  // Tab: CX
  const CxTab = () => (
    <div>
      <SectionFreshnessBar date={meta?.as_of} category="CX & Ratings" sourcePeriod="App Store / Play Store" />
      {cx && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <SourceBadge sourceCount={cx.app_rating_ios ? 2 : 0} confidence={cx.app_rating_ios ? 'high' : 'low'} />
            <SectionFeedback sectionId={`${key}-cx`} getFeedback={getFeedback} setFeedbackFor={setFeedbackFor} />
            <FlagOutdated bankKey={key} section="cx" compact />
          </div>
          <div className="flex gap-3 flex-wrap mb-4">
            {cx.app_store_url ? (
              <a href={cx.app_store_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-surface border border-border rounded-lg text-center hover:border-primary/40 hover:shadow-sm transition-all group">
                <div className="text-xl font-black text-primary">{cx.app_rating_ios}</div>
                <div className="text-[9px] text-fg-muted group-hover:text-primary transition-colors">iOS ↗</div>
              </a>
            ) : (
              <div className="p-3 bg-surface border border-border rounded-lg text-center"><div className="text-xl font-black text-primary">{cx.app_rating_ios}</div><div className="text-[9px] text-fg-muted">iOS</div></div>
            )}
            {cx.play_store_url ? (
              <a href={cx.play_store_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-surface border border-border rounded-lg text-center hover:border-primary/40 hover:shadow-sm transition-all group">
                <div className="text-xl font-black text-primary">{cx.app_rating_android}</div>
                <div className="text-[9px] text-fg-muted group-hover:text-primary transition-colors">Android ↗</div>
              </a>
            ) : (
              <div className="p-3 bg-surface border border-border rounded-lg text-center"><div className="text-xl font-black text-primary">{cx.app_rating_android}</div><div className="text-[9px] text-fg-muted">Android</div></div>
            )}
            {cx.digital_maturity && <div className="p-3 bg-surface border border-border rounded-lg text-center"><div className="text-sm font-bold text-primary-700">{cx.digital_maturity}</div><div className="text-[9px] text-fg-muted">Maturity</div></div>}
            {cx.nps_estimate && <div className="p-3 bg-surface border border-border rounded-lg text-center"><div className="text-sm font-bold text-fg">{cx.nps_estimate}</div><div className="text-[9px] text-fg-muted">NPS Est.</div></div>}
            {cx.app_name && <div className="p-3 bg-surface border border-border rounded-lg text-center"><div className="text-sm font-bold text-fg">{cx.app_name}</div><div className="text-[9px] text-fg-muted">App Name</div></div>}
          </div>
          {/* Live ratings from pipeline */}
          {pipelineActive && (
            <div className="mb-4">
              <LiveRatingsCard bankKey={key} staticAndroid={cx.app_rating_android} staticIos={cx.app_rating_ios} />
            </div>
          )}
          {data.sentiment_scores && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-fg mb-2">Sentiment Scores</h4>
              <RadarChart
                scores={Object.values(data.sentiment_scores)}
                labels={Object.keys(data.sentiment_scores).map(k => k.replace(/_/g, ' '))}
                size={220}
              />
            </div>
          )}
          {cx.cx_strengths?.length > 0 && (
            <div className="mb-3"><h4 className="text-xs font-bold text-success mb-2">CX Strengths</h4>
              <div className="space-y-1">{cx.cx_strengths.map((s, i) => <div key={i} className="text-xs text-fg-subtle bg-success-subtle px-3 py-1.5 rounded">✓ {s}</div>)}</div>
            </div>
          )}
          {cx.cx_weaknesses?.length > 0 && (
            <div className="mb-3"><h4 className="text-xs font-bold text-danger mb-2">CX Weaknesses</h4>
              <div className="space-y-1">{cx.cx_weaknesses.map((w, i) => <div key={i} className="text-xs text-fg-subtle bg-danger-subtle px-3 py-1.5 rounded">✗ {w}</div>)}</div>
            </div>
          )}
          {cx.ux_assessment && <Section title="UX Assessment" defaultOpen={false}><p className="text-sm text-fg-subtle leading-relaxed">{cx.ux_assessment}</p></Section>}
        </>
      )}
    </div>
  );

  // Tab: People
  const PeopleTab = () => (
    <div>
      <SectionFreshnessBar date={meta?.leadership_verified || meta?.as_of} category="Leadership & People" sourcePeriod="LinkedIn / Annual Report" />
      {data.key_decision_makers?.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <SourceBadge sourceCount={data.key_decision_makers.filter(p => p.linkedin).length} confidence={data.key_decision_makers.some(p => p.linkedin) ? 'high' : 'medium'} />
            <SectionFeedback sectionId={`${key}-people`} getFeedback={getFeedback} setFeedbackFor={setFeedbackFor} />
            <FlagOutdated bankKey={key} section="people" compact />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.key_decision_makers.map((p, i) => {
              const isTarget = (p.note || '').includes('🎯') || (p.note || '').includes('CRITICAL') || (p.note || '').includes('KEY');
              return (
                <SelectableItem key={i} id={`person-${i}`} label={p.name} category="Key People" content={`**${p.name}** — ${p.role}${p.note ? '\n' + p.note : ''}${p.linkedin ? '\nLinkedIn: ' + p.linkedin : ''}`}>
                  <div className={`p-3 border rounded-lg transition-all ${isTarget ? 'bg-primary-50 border-primary/30' : 'bg-surface border-border'}`}>
                    <div className="text-[10px] text-fg-muted uppercase tracking-wide">{p.role}</div>
                    <div className="font-bold text-sm text-fg mt-0.5">
                      {p.name} {isTarget && <span className="text-primary">🎯</span>}
                      {p.linkedin && <a href={p.linkedin} target="_blank" rel="noopener" className="inline-flex ml-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] font-bold text-blue-600 no-underline hover:bg-blue-100" onClick={e => e.stopPropagation()}>in</a>}
                    </div>
                    {p.note && <p className="text-[10px] text-fg-disabled mt-1 line-clamp-3 hover:line-clamp-none transition-all">{p.note}</p>}
                  </div>
                </SelectableItem>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  // Tab: Profile
  const ProfileTab = () => (
    <div>
      <SectionFreshnessBar date={meta?.as_of} category="Bank Profile" sourcePeriod={meta?.kpis_period || 'Annual Report / Public Filings'} />
      {data.pain_points?.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-fg">Pain Points</h3>
            <SourceBadge sourceCount={data.pain_points.length} confidence="medium" />
            <SectionFeedback sectionId={`${key}-pain`} getFeedback={getFeedback} setFeedbackFor={setFeedbackFor} />
            <FlagOutdated bankKey={key} section="pain_points" compact />
          </div>
          <div className="space-y-1.5 mb-5">
            {data.pain_points.map((p, i) => (
              <SelectableItem key={i} id={`pain-${i}`} label={p.title} category="Pain Points" content={`**${p.title}**\n${p.detail}`}>
                <div className="p-3 bg-danger-subtle border-l-3 border-danger rounded-r-lg">
                  <div className="font-bold text-xs text-danger">{p.title}</div>
                  <div className="text-[11px] text-fg-muted mt-0.5">{p.detail}</div>
                </div>
              </SelectableItem>
            ))}
          </div>
        </>
      )}
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
          <div className="flex items-center gap-2 mb-2"><FlagOutdated bankKey={key} section="overview" compact /></div>
          <p className="text-sm text-fg-subtle leading-relaxed">{data.overview}</p>
        </Section>
      )}
      {data.financials && (
        <Section title="Financials" defaultOpen={false}>
          <div className="flex items-center gap-2 mb-2">
            <SectionFreshnessBar date={meta?.as_of} category="Financial Data" sourcePeriod={meta?.kpis_period || 'Annual Report'} />
            <FlagOutdated bankKey={key} section="financials" compact />
          </div>
          <p className="text-sm text-fg-subtle leading-relaxed">{data.financials}</p>
        </Section>
      )}
      {data.digital_strategy && (
        <Section title="Digital Strategy" defaultOpen={false}>
          <div className="flex items-center gap-2 mb-2"><FlagOutdated bankKey={key} section="digital_strategy" compact /></div>
          <p className="text-sm text-fg-subtle leading-relaxed">{data.digital_strategy}</p>
        </Section>
      )}
      {data.strategic_initiatives && (
        <Section title="Strategic Initiatives" defaultOpen={false}>
          <div className="flex items-center gap-2 mb-2"><FlagOutdated bankKey={key} section="strategic_initiatives" compact /></div>
          <p className="text-sm text-fg-subtle leading-relaxed">{data.strategic_initiatives}</p>
        </Section>
      )}
      {/* AI Intelligence Analysis */}
      {pipelineActive && <AiInsightsCard bankKey={key} />}
      {/* Live Market Data */}
      {pipelineActive && (
        <div className="space-y-4 mb-5">
          <LiveStockCard bankKey={key} />
          <LiveNewsFeed bankKey={key} />
        </div>
      )}
      {/* Sources */}
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

  return (
    <div className="animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-fg-muted hover:text-primary mb-4 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 mb-6">
        <div className="flex items-center sm:flex-col gap-4 sm:gap-0">
          <ScoreGauge score={score} label="Fit Score" />
          <div className="text-xs font-bold mt-0 sm:mt-1" style={{ color: scoreColor(score) }}>{scoreLabel(score)}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-fg">{data.bank_name}</h2>
            <FavoriteButton active={isFavorite(key, 'bank')} onClick={() => toggleFav({ key, type: 'bank', name: data.bank_name })} />
            <ConfidenceBadge level={conf.level} />
            <FreshnessBadge date={meta?.as_of || '2026-03-10'} label={meta?.kpis_period || 'Dataset'} compact />
            {pipelineActive && <LiveStockTicker bankKey={key} />}
            {pipelineActive && <NewsSignalBadge bankKey={key} />}
            {pipelineActive && <AiSignalBadge bankKey={key} />}
            {grp && <span className="text-[9px] font-bold text-primary bg-primary-50 px-2 py-0.5 rounded">🔗 {grp.group_name}</span>}
          </div>
          <p className="text-xs text-fg-muted italic mb-3">{data.tagline}</p>
          <div className="flex gap-2 flex-wrap">
            {data.kpis?.map((k, i) => (
              <div key={i} className="bg-surface border border-border rounded-lg px-2.5 sm:px-3 py-1.5">
                <div className="text-[8px] text-fg-disabled uppercase">{k.label}</div>
                <div className="text-xs sm:text-sm font-bold text-fg">{k.value}</div>
              </div>
            ))}
          </div>
          {q && (
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 mt-3 text-xs text-fg-subtle">
              {q.deal_size && <span><strong>Deal:</strong> {q.deal_size}</span>}
              {q.sales_cycle && <span><strong>Cycle:</strong> {q.sales_cycle}</span>}
              {q.timing && <span><strong>Timing:</strong> {q.timing}</span>}
            </div>
          )}
        </div>
        {radarScores.length > 0 && (
          <div className="shrink-0 hidden md:block">
            <RadarChart scores={radarScores} labels={radarLabels} size={200} />
          </div>
        )}
      </div>

      {/* Score Explainer */}
      <ScoreExplainer bankKey={key} />

      {/* Action buttons */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setQuickPrepOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors"
        >
          <Clock size={14} /> 2-Min Prep
        </button>
        <button
          onClick={() => setBriefingOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-fg hover:bg-surface-2 transition-colors"
        >
          <FileText size={14} /> Full Briefing
        </button>
        <ExportBar bankName={data.bank_name} />
        <button
          onClick={() => setIntelOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-primary-900 text-white rounded-lg text-xs font-bold hover:bg-primary-900/90 transition-colors relative"
        >
          <Plus size={14} /> Add Intel
          {pendingIntel > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-danger text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {pendingIntel}
            </span>
          )}
        </button>
      </div>

      {/* Risk callout */}
      {q?.risk && (
        <div className="p-3 bg-danger-subtle border border-danger/20 rounded-lg mb-5">
          <span className="text-xs font-bold text-danger">⚠ Risk:</span>
          <span className="text-xs text-fg-subtle ml-1">{q.risk}</span>
        </div>
      )}

      <TabBar tabs={[
        { label: '🎯 Pursue', content: <PursueTab /> },
        { label: '🏆 Win', content: <WinTab /> },
        { label: '🔍 Discovery', content: <DiscoveryPanel bankKey={key} /> },
        { label: '💰 ROI', content: <RoiPanel bankKey={key} /> },
        { label: '🛡️ Battle Cards', content: <BattleCardsPanel bankKey={key} /> },
        { label: '📱 CX', content: <CxTab /> },
        { label: '👥 People', content: <PeopleTab /> },
        { label: '📋 Profile', content: <ProfileTab /> },
        { label: `🧠 Intel${intelEntries.length > 0 ? ` (${intelEntries.length})` : ''}`, content: (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-fg">User-Contributed Intelligence</h3>
                <p className="text-[10px] text-fg-disabled mt-0.5">Insights captured from meetings, research, and observations</p>
              </div>
              <button
                onClick={() => setIntelOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-[11px] font-bold hover:bg-primary/90 transition-colors"
              >
                <Plus size={12} /> Add
              </button>
            </div>
            {pendingIntel > 0 && (
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg mb-4 flex items-center gap-2">
                <span className="text-warning text-sm">⏳</span>
                <span className="text-xs text-warning font-bold">{pendingIntel} pending review</span>
                <span className="text-[10px] text-fg-disabled">— approve or dismiss to update bank intelligence</span>
              </div>
            )}
            <IntelFeed entries={intelEntries} onUpdate={refreshIntel} />
          </div>
        )},
      ]} />

      {/* Modals */}
      <BriefingModal bankKey={key} isOpen={briefingOpen} onClose={() => setBriefingOpen(false)} />
      <QuickPrepModal bankKey={key} isOpen={quickPrepOpen} onClose={() => setQuickPrepOpen(false)} />
      <IntelPanel
        bankKey={key}
        bankName={data.bank_name}
        isOpen={intelOpen}
        onClose={() => setIntelOpen(false)}
        onAdded={(entry) => { refreshIntel(); setIntelOpen(false); }}
      />
    </div>
  );
}
