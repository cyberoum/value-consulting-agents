import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Zap, Target, FileText, Clock, Plus, LayoutDashboard, ChevronRight, ChevronDown, AlertTriangle, Newspaper, Swords, Globe, Presentation } from 'lucide-react';
import { useBank, useAiAnalysis } from '../hooks/useData';
import { QUAL_FRAMEWORK, calcScoreFromData, scoreColor, scoreLabel, parseBankKey, dataConfidenceFromData } from '../data/scoring';
import { getMarketForCountry } from '../data/utils';
import { LoadingState, ErrorState } from '../components/common/DataState';
import TabBar from '../components/common/TabBar';
import Section from '../components/common/Section';
import { ConfidenceBadge, PriorityBadge, FavoriteButton } from '../components/common/Badge';
import SectionFeedback from '../components/common/SectionFeedback';
import SourceBadge from '../components/common/SourceBadge';
import RadarChart from '../components/charts/RadarChart';
import ScoreGauge from '../components/charts/ScoreGauge';
import BriefingModal from '../components/bank/BriefingModal';
import QuickPrepModal from '../components/bank/QuickPrepModal';
import ScoreExplainer from '../components/bank/ScoreExplainer';
import ExportBar from '../components/bank/ExportBar';
import SelectableItem from '../components/bank/SelectableItem';
import RoiSummaryCard from '../components/bank/RoiSummaryCard';
import { useFavorites } from '../context/FavoritesContext';
import useFeedback from '../hooks/useFeedback';
import FreshnessBadge, { SectionFreshnessBar } from '../components/common/FreshnessBadge';
import FlagOutdated from '../components/common/FlagOutdated';
import { BANK_METADATA, bankFreshness } from '../data/metadata';
import { getIntelForBank, getPendingCount } from '../data/userIntel';
import IntelPanel from '../components/intel/IntelPanel';
import IntelFeed from '../components/intel/IntelFeed';
import { LiveRatingsCard } from '../components/live/LiveRatingBadge';
import LiveNewsFeed, { NewsSignalBadge } from '../components/live/LiveNewsFeed';
import LiveStockTicker, { LiveStockCard } from '../components/live/LiveStockTicker';
import AiInsightsCard, { AiSignalBadge } from '../components/live/AiInsightsCard';
import RoiPanel from '../components/bank/RoiPanel';
import BattleCardsPanel from '../components/bank/BattleCardsPanel';
import DiscoveryPanel from '../components/bank/DiscoveryPanel';
import NextBestActionPanel from '../components/bank/NextBestActionPanel';
import AiAnalysisPanel from '../components/bank/AiAnalysisPanel';
import { matchZonesToLandingZones } from '../utils/zoneMatching';
import MeetingContextBar from '../components/bank/MeetingContextBar';
import MeetingPrepBrief from '../components/bank/MeetingPrepBrief';
import LandingZoneMatrix from '../components/bank/LandingZoneMatrix';
import ModernizationPlayCards from '../components/bank/ModernizationPlayCards';
import UnconsideredNeeds from '../components/bank/UnconsideredNeeds';
import DiscoveryStoryline from '../components/bank/DiscoveryStoryline';
import CascadeProgressBar from '../components/bank/CascadeProgressBar';
import { useLandingZoneMatrix, useDiscoveryStoryline } from '../hooks/useData';
import { analyzeLandingZones as apiAnalyzeLandingZones, generateDiscoveryStoryline as apiGenerateDiscoveryStoryline, generateMeetingPrep as apiGenerateMeetingPrep, generateValueHypothesis as apiGenerateValueHypothesis } from '../data/api';
import { buildZoneJustifications } from '../utils/zoneJustification';
import { ROLES } from '../data/discoveryQuestions';
import {
  getRoleForKDM,
  scoreZoneRelevance,
  scoreSignalRelevance,
  getTailoredQuestions,
  getAggregatedTips,
  getRoiFraming,
  getRecommendedPhases,
} from '../utils/meetingTailoring';

export default function BankPage() {
  const { bankKey } = useParams();
  const navigate = useNavigate();
  const key = decodeURIComponent(bankKey);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [quickPrepOpen, setQuickPrepOpen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);
  const [intelRefresh, setIntelRefresh] = useState(0);
  const [showAllSignals, setShowAllSignals] = useState(false);
  const [meetingContext, setMeetingContext] = useState({
    attendees: [], scopeKnown: 'unknown', painPointKnown: 'unknown',
    scopeText: '', painText: '', personResearch: {}, contextEnrichment: null,
    topics: [], meetingPrepBrief: null,
  });
  const deepDiveRef = useRef(null);

  // Reset meeting context when navigating to a different bank
  useEffect(() => {
    setMeetingContext({
      attendees: [], scopeKnown: 'unknown', painPointKnown: 'unknown',
      scopeText: '', painText: '', personResearch: {}, contextEnrichment: null,
      topics: [], meetingPrepBrief: null,
    });
    setShowAllSignals(false);
  }, [key]);

  // Functional updater support for setMeetingContext (used by research callbacks)
  const handleContextChange = useCallback((update) => {
    if (typeof update === 'function') {
      setMeetingContext(prev => update(prev));
    } else {
      setMeetingContext(update);
    }
  }, []);

  // Fetch bank data from API
  const { data: bankProfile, isLoading, error } = useBank(key);
  // Fetch AI analysis (separate table, separate query)
  const { data: aiAnalysesRaw } = useAiAnalysis(key);
  const aiAnalysis = aiAnalysesRaw?.[0]?.result || null;

  // Derive all data from API response
  const data = bankProfile?.data || null;
  const { bankName, country } = parseBankKey(key);
  const marketKey = getMarketForCountry(country);
  const qd = bankProfile?.qualification || null;
  const score = calcScoreFromData(qd);
  const q = data?.backbase_qualification;
  const cx = bankProfile?.cx || null;
  const comp = bankProfile?.competition || null;
  const vs = bankProfile?.value_selling || null;
  const grp = bankProfile?.relationship || null;
  const sources = bankProfile?.sources || [];
  const conf = dataConfidenceFromData(key, data);
  const meta = BANK_METADATA[key];
  const freshness = bankFreshness(key);
  const hasLiveData = !!(data?.live_stock || data?.live_news || cx?.live_ratings || aiAnalysis);
  const intelEntries = getIntelForBank(key);
  const pendingIntel = getPendingCount(key);
  const refreshIntel = useCallback(() => setIntelRefresh(n => n + 1), []);
  const { toggle: toggleFav, isFavorite } = useFavorites();
  const { getFeedback, setFeedbackFor } = useFeedback();

  // Landing Zone Matrix (4×5 grid — separate table)
  const { data: lzData, refetch: refetchLz } = useLandingZoneMatrix(key);
  const [lzAnalyzing, setLzAnalyzing] = useState(false);
  const researchAvailable = !!data; // simplified check; actual API key check via 503 response

  const handleAnalyzeLandingZones = useCallback(async () => {
    setLzAnalyzing(true);
    try {
      await apiAnalyzeLandingZones({ bankName: data?.bank_name || bankName, bankKey: key });
      await refetchLz();
    } catch (err) {
      console.error('Landing zone analysis failed:', err);
    } finally {
      setLzAnalyzing(false);
    }
  }, [key, data?.bank_name, bankName, refetchLz]);

  // Discovery Storyline (7-act narrative — separate table)
  const { data: storylineData, refetch: refetchStoryline } = useDiscoveryStoryline(key);
  const [storylineGenerating, setStorylineGenerating] = useState(false);
  const [storylineError, setStorylineError] = useState(null);

  const handleGenerateStoryline = useCallback(async () => {
    setStorylineGenerating(true);
    setStorylineError(null);
    try {
      await apiGenerateDiscoveryStoryline({ bankName: data?.bank_name || bankName, bankKey: key });
      await refetchStoryline();
    } catch (genErr) {
      console.error('Discovery storyline generation failed:', genErr);
      const msg = genErr?.message || '';
      if (msg.includes('503') || msg.includes('API_KEY') || msg.includes('not configured')) {
        setStorylineError('ANTHROPIC_API_KEY not configured. Create a .env file with your API key and restart the server.');
      } else {
        setStorylineError(`Generation failed: ${msg || 'Unknown error'}`);
      }
    } finally {
      setStorylineGenerating(false);
    }
  }, [key, data?.bank_name, bankName, refetchStoryline]);

  // ── Cascade: Full Meeting Intelligence ──
  const [cascadeStatus, setCascadeStatus] = useState({
    meetingPrep: 'idle', storyline: 'idle', landingZones: 'idle', valueHypothesis: 'idle',
  });
  const [tailoredHypothesis, setTailoredHypothesis] = useState(null);

  // Reset cascade state on bank change
  useEffect(() => {
    setCascadeStatus({ meetingPrep: 'idle', storyline: 'idle', landingZones: 'idle', valueHypothesis: 'idle' });
    setTailoredHypothesis(null);
  }, [key]);

  const handleCascade = useCallback(async (meetingCtx) => {
    const bName = data?.bank_name || bankName;
    // Phase 1: Meeting Prep (runs first — we need its summary for Phase 2)
    setCascadeStatus({ meetingPrep: 'running', storyline: 'idle', landingZones: 'idle', valueHypothesis: 'idle' });

    let meetingPrepResult;
    try {
      const { result } = await apiGenerateMeetingPrep({
        bankName: bName, bankKey: key,
        attendees: meetingCtx.attendees, topics: meetingCtx.topics,
        scopeKnown: meetingCtx.scopeKnown, painPointKnown: meetingCtx.painPointKnown,
        scopeText: meetingCtx.scopeText, painText: meetingCtx.painText,
      });
      meetingPrepResult = result;
      handleContextChange(prev => ({ ...prev, meetingPrepBrief: result }));
      setCascadeStatus(prev => ({ ...prev, meetingPrep: 'done' }));
    } catch (err) {
      console.error('Cascade: meeting prep failed:', err);
      setCascadeStatus(prev => ({ ...prev, meetingPrep: 'error' }));
      return; // Abort cascade if Phase 1 fails
    }

    // Phase 2: Parallel — Storyline + Landing Zones + Value Hypothesis
    const payload = {
      ...meetingCtx,
      meetingPrepSummary: meetingPrepResult?.personIntelligence?.summary || '',
    };
    setCascadeStatus(prev => ({ ...prev, storyline: 'running', landingZones: 'running', valueHypothesis: 'running' }));

    const [sResult, lzResult, vhResult] = await Promise.allSettled([
      apiGenerateDiscoveryStoryline({ bankName: bName, bankKey: key, meetingContext: payload }),
      apiAnalyzeLandingZones({ bankName: bName, bankKey: key, meetingContext: payload }),
      apiGenerateValueHypothesis({ bankName: bName, bankKey: key, meetingContext: payload }),
    ]);

    // Handle storyline result
    if (sResult.status === 'fulfilled') {
      await refetchStoryline();
      setCascadeStatus(prev => ({ ...prev, storyline: 'done' }));
    } else {
      console.error('Cascade: storyline failed:', sResult.reason);
      setCascadeStatus(prev => ({ ...prev, storyline: 'error' }));
    }

    // Handle landing zone result
    if (lzResult.status === 'fulfilled') {
      await refetchLz();
      setCascadeStatus(prev => ({ ...prev, landingZones: 'done' }));
    } else {
      console.error('Cascade: landing zones failed:', lzResult.reason);
      setCascadeStatus(prev => ({ ...prev, landingZones: 'error' }));
    }

    // Handle value hypothesis result
    if (vhResult.status === 'fulfilled') {
      setTailoredHypothesis(vhResult.value?.result || null);
      setCascadeStatus(prev => ({ ...prev, valueHypothesis: 'done' }));
    } else {
      console.error('Cascade: value hypothesis failed:', vhResult.reason);
      setCascadeStatus(prev => ({ ...prev, valueHypothesis: 'error' }));
    }
  }, [key, data?.bank_name, bankName, handleContextChange, refetchStoryline, refetchLz]);

  // Zone matching — link engagement zones to landing zones
  const enrichedZones = useMemo(() => {
    if (!q?.engagement_banking_zones || !data?.backbase_landing_zones) return [];
    return matchZonesToLandingZones(q.engagement_banking_zones, data.backbase_landing_zones);
  }, [q?.engagement_banking_zones, data?.backbase_landing_zones]);

  // Unmatched landing zones (not linked to any engagement zone)
  const matchedLzNames = useMemo(() => {
    const names = new Set();
    enrichedZones.forEach(ez => ez.matchedLandingZones?.forEach(lz => names.add(lz.zone)));
    return names;
  }, [enrichedZones]);
  const unmatchedLandingZones = useMemo(() => {
    return (data?.backbase_landing_zones || []).filter(lz => !matchedLzNames.has(lz.zone));
  }, [data?.backbase_landing_zones, matchedLzNames]);

  // ── Meeting Tailoring ──────────────────────────────────────────────
  const meetingActive = meetingContext.attendees.length > 0;
  const meetingRoleKeys = useMemo(() => {
    return [...new Set(meetingContext.attendees.map(a => a.roleKey).filter(Boolean))];
  }, [meetingContext.attendees]);

  // Prioritize zones by meeting relevance
  const prioritizedZones = useMemo(() => {
    if (!meetingActive || enrichedZones.length === 0) return enrichedZones;
    return [...enrichedZones].sort((a, b) => {
      const scoreA = scoreZoneRelevance(a.zone, meetingRoleKeys);
      const scoreB = scoreZoneRelevance(b.zone, meetingRoleKeys);
      return scoreB - scoreA;
    }).map(ez => ({
      ...ez,
      meetingRelevance: scoreZoneRelevance(ez.zone, meetingRoleKeys),
    }));
  }, [enrichedZones, meetingActive, meetingRoleKeys]);

  // Prioritize signals by meeting relevance
  const prioritizedSignals = useMemo(() => {
    const signals = data?.signals || [];
    if (!meetingActive || signals.length === 0) return null;
    return [...signals].sort((a, b) => {
      return scoreSignalRelevance(b, meetingRoleKeys) - scoreSignalRelevance(a, meetingRoleKeys);
    });
  }, [data?.signals, meetingActive, meetingRoleKeys]);

  // Tailored discovery questions
  const tailoredQuestions = useMemo(() => {
    if (!meetingActive) return null;
    return getTailoredQuestions(key, meetingRoleKeys, meetingContext.scopeKnown, meetingContext.painPointKnown);
  }, [key, meetingActive, meetingRoleKeys, meetingContext.scopeKnown, meetingContext.painPointKnown]);

  // Meeting tips
  const meetingTips = useMemo(() => {
    if (!meetingActive) return [];
    return getAggregatedTips(meetingRoleKeys);
  }, [meetingActive, meetingRoleKeys]);

  // ROI framing for the audience
  const roiFraming = useMemo(() => {
    if (!meetingActive) return null;
    return getRoiFraming(meetingRoleKeys);
  }, [meetingActive, meetingRoleKeys]);

  // Zone Justifications — evidence trails linking engagement zones to storyline + matrix + meeting prep
  const zoneJustifications = useMemo(() => {
    if (enrichedZones.length === 0) return new Map();
    return buildZoneJustifications(enrichedZones, storylineData, lzData, meetingContext.meetingPrepBrief);
  }, [enrichedZones, storylineData, lzData, meetingContext.meetingPrepBrief]);

  // Scroll to Deep Dive and activate a specific tab
  const scrollToDeepDive = useCallback((tabIndex) => {
    deepDiveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (isLoading) {
    return (
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-fg-muted hover:text-primary mb-4"><ArrowLeft size={16} /> Back</button>
        <LoadingState message="Loading bank profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-fg-muted hover:text-primary mb-4"><ArrowLeft size={16} /> Back</button>
        <ErrorState message={error.message} />
      </div>
    );
  }

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

  // Top KDMs for § 1
  const topPeople = (data.key_decision_makers || []).slice(0, 4);
  const allPeople = data.key_decision_makers || [];

  // Signals for § 2
  const allSignals = data.signals || [];
  const visibleSignals = showAllSignals ? allSignals : allSignals.slice(0, 4);

  // Discovery questions for § 4
  const discoveryQuestions = (vs?.discovery_questions || []).slice(0, 5);

  // Pain points for § 5
  const topPainPoints = (data.pain_points || []).slice(0, 2);

  // Live news for § 5 — live_news is {articles: [...], topSignals, ...}
  const liveNews = (data.live_news?.articles || []).slice(0, 2);

  // ─── Deep Dive: CX Tab ────────────────────────────────────────────
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
          </div>
          <div className="mb-4">
            <LiveRatingsCard bankData={data} cxData={cx} staticAndroid={cx.app_rating_android} staticIos={cx.app_rating_ios} />
          </div>
          {data.sentiment_scores && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-fg mb-2">Sentiment Scores</h4>
              <RadarChart scores={Object.values(data.sentiment_scores)} labels={Object.keys(data.sentiment_scores).map(k => k.replace(/_/g, ' '))} size={220} />
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

  // ─── Deep Dive: Profile Tab ────────────────────────────────────────
  const ProfileTab = () => (
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

  // ─── Tab: People ──────────────────────────────────────────────────
  const PeopleTab = () => (
    <div>
      {meetingActive ? (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {meetingContext.attendees.map((a, i) => {
              const role = a.roleKey ? ROLES[a.roleKey] : null;
              const kdmData = allPeople.find(p => p.name === a.name);
              return (
                <div key={i} className="p-3 bg-primary-50 border-2 border-primary/30 rounded-lg ring-1 ring-primary/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{role?.icon || '👤'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-primary font-bold uppercase tracking-wide">{role?.title || a.role}</div>
                      <div className="font-bold text-sm text-fg">
                        {a.name}
                        {a.linkedin && <a href={a.linkedin} target="_blank" rel="noopener" className="inline-flex ml-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] font-bold text-blue-600 no-underline hover:bg-blue-100" onClick={e => e.stopPropagation()}>in</a>}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-white">In Meeting</span>
                  </div>
                  {(kdmData?.note || a.note) && (
                    <p className="text-[10px] text-fg-muted mt-1 leading-relaxed">{kdmData?.note || a.note}</p>
                  )}
                  {role?.objective && (
                    <p className="text-[10px] text-primary/70 italic mt-1.5">
                      <span className="font-bold not-italic">Objective:</span> {role.objective}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {meetingTips.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">Meeting Tips</div>
              <div className="space-y-1.5">
                {meetingTips.map((tipGroup, i) => (
                  <div key={i}>
                    <div className="text-[10px] font-bold text-amber-800">{tipGroup.roleIcon} For {tipGroup.roleTitle}:</div>
                    <ul className="mt-0.5 space-y-0.5">
                      {tipGroup.tips.map((tip, j) => (
                        <li key={j} className="text-[10px] text-amber-900/70 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-amber-400">{tip}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.entries(meetingContext.personResearch || {}).length > 0 && (
            <div className="space-y-2 mt-2">
              {Object.entries(meetingContext.personResearch).map(([name, research]) => (
                <div key={name} className="bg-violet-50/50 border border-violet-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe size={12} className="text-violet-600" />
                    <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">AI Research: {name}</span>
                    {research._newsFound > 0 && (
                      <span className="text-[9px] text-violet-500">({research._newsFound} news mentions)</span>
                    )}
                  </div>
                  <p className="text-[11px] text-fg-subtle mb-2">{research.personSummary}</p>
                  {research.likelyPriorities?.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-violet-600 uppercase">Likely Priorities:</div>
                      {research.likelyPriorities.slice(0, 3).map((p, i) => (
                        <div key={i} className="bg-white rounded-md p-2 border border-violet-100">
                          <div className="text-[11px] font-bold text-fg">{p.priority}</div>
                          <div className="text-[10px] text-fg-subtle">{p.detail}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {research.suggestedApproach && (
                    <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-md p-2">
                      <div className="text-[9px] font-bold text-emerald-700">Suggested Approach</div>
                      <div className="text-[10px] text-emerald-800">{research.suggestedApproach}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {allPeople.filter(p => !meetingContext.attendees.some(a => a.name === p.name)).length > 0 && (
            <div className="mt-3">
              <div className="text-[9px] font-bold text-fg-disabled uppercase tracking-wider mb-1">Other Key People</div>
              <div className="flex flex-wrap gap-1.5">
                {allPeople.filter(p => !meetingContext.attendees.some(a => a.name === p.name)).slice(0, 6).map((p, i) => (
                  <span key={i} className="text-[10px] text-fg-muted bg-surface-2 px-2 py-0.5 rounded">{p.name} — {p.role}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {topPeople.map((p, i) => {
              const isTarget = (p.note || '').includes('🎯') || (p.note || '').includes('CRITICAL') || (p.note || '').includes('KEY');
              return (
                <SelectableItem key={i} id={`person-${i}`} label={p.name} category="Key People" content={`**${p.name}** — ${p.role}${p.note ? '\n' + p.note : ''}${p.linkedin ? '\nLinkedIn: ' + p.linkedin : ''}`}>
                  <div className={`p-3 border rounded-lg transition-all ${isTarget ? 'bg-primary-50 border-primary/30' : 'bg-surface border-border'}`}>
                    <div className="text-[10px] text-fg-muted uppercase tracking-wide">{p.role}</div>
                    <div className="font-bold text-sm text-fg mt-0.5">
                      {p.name} {isTarget && <span className="text-primary">🎯</span>}
                      {p.linkedin && <a href={p.linkedin} target="_blank" rel="noopener" className="inline-flex ml-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] font-bold text-blue-600 no-underline hover:bg-blue-100" onClick={e => e.stopPropagation()}>in</a>}
                    </div>
                    {p.note && <p className="text-[10px] text-fg-disabled mt-1 line-clamp-2 hover:line-clamp-none transition-all">{p.note}</p>}
                  </div>
                </SelectableItem>
              );
            })}
          </div>
          {allPeople.length > 4 && (
            <button onClick={() => scrollToDeepDive()} className="flex items-center gap-1 mt-2 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors">
              +{allPeople.length - 4} more people in Deep Dive <ChevronRight size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  // ─── Tab: Opportunity ────────────────────────────────────────────
  const OpportunityTab = () => (
    <div className="space-y-3">
      {/* Value Hypothesis — expanded by default */}
      {(tailoredHypothesis || vs?.value_hypothesis) && (
        <Section title="Value Hypothesis" defaultOpen={true} color="#3366FF">
          {tailoredHypothesis && (
            <SelectableItem id="vh-tailored" label="Meeting Value Hypothesis" category="Meeting Intelligence" content={`**Meeting-Tailored Hypothesis:** ${tailoredHypothesis.one_liner}\n- IF: ${tailoredHypothesis.if_condition}\n- THEN: ${tailoredHypothesis.then_outcome}\n- BY: ${tailoredHypothesis.by_deploying}\n- RESULT: ${tailoredHypothesis.resulting_in}`}>
              <div className="p-4 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 rounded-xl mb-3 text-white ring-2 ring-primary/30">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-[10px] uppercase tracking-wider text-white/60">Value Hypothesis</div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">Meeting-Specific</span>
                  {tailoredHypothesis.tailored_for && (
                    <span className="text-[9px] text-white/50">for {tailoredHypothesis.tailored_for}</span>
                  )}
                  <SectionFeedback sectionId={`${key}-vh-tailored`} getFeedback={getFeedback} setFeedbackFor={setFeedbackFor} />
                </div>
                <p className="text-sm font-semibold leading-relaxed mb-3">"{tailoredHypothesis.one_liner}"</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div><span className="font-bold text-emerald-300">IF:</span> {tailoredHypothesis.if_condition}</div>
                  <div><span className="font-bold text-emerald-300">THEN:</span> {tailoredHypothesis.then_outcome}</div>
                  <div><span className="font-bold text-emerald-300">BY:</span> {tailoredHypothesis.by_deploying}</div>
                  <div><span className="font-bold text-emerald-300">RESULT:</span> {tailoredHypothesis.resulting_in}</div>
                </div>
              </div>
            </SelectableItem>
          )}
          {vs?.value_hypothesis && (
            <SelectableItem id="vh" label="Value Hypothesis" category="Value Selling" content={`**Value Hypothesis:** ${vs.value_hypothesis.one_liner}\n- IF: ${vs.value_hypothesis.if_condition}\n- THEN: ${vs.value_hypothesis.then_outcome}\n- BY: ${vs.value_hypothesis.by_deploying}\n- RESULT: ${vs.value_hypothesis.resulting_in}`}>
              <div className={`p-4 bg-primary-900 rounded-xl text-white ${tailoredHypothesis ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="text-[10px] uppercase tracking-wider text-white/60 mb-1">
                    {tailoredHypothesis ? 'Original Hypothesis' : 'Value Hypothesis'}
                  </div>
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
        </Section>
      )}

      {/* Landing Zone Analysis — collapsed */}
      <Section title="Landing Zone Analysis" defaultOpen={false} color="#3366FF">
        <LandingZoneMatrix
          matrixData={lzData}
          bankData={data}
          bankKey={key}
          bankName={data?.bank_name || bankName}
          onAnalyze={handleAnalyzeLandingZones}
          isAnalyzing={lzAnalyzing}
          researchAvailable={researchAvailable}
        />
        {lzData?.plays && (
          <div className="mt-4">
            <ModernizationPlayCards plays={lzData.plays} />
          </div>
        )}
        {lzData?.unconsidered?.length > 0 && (
          <div className="mt-4">
            <UnconsideredNeeds needs={lzData.unconsidered} />
          </div>
        )}
      </Section>

      {/* Engagement Zones — collapsed */}
      {(meetingActive ? prioritizedZones : enrichedZones).length > 0 && (
        <Section title={`Engagement Zones (${enrichedZones.length})`} defaultOpen={false} color="#3366FF">
          <div className="flex items-center gap-2 mb-3">
            {meetingActive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Sorted by relevance</span>}
            <SourceBadge sourceCount={enrichedZones.length} confidence="high" />
            <SectionFeedback sectionId={`${key}-ez`} getFeedback={getFeedback} setFeedbackFor={setFeedbackFor} />
          </div>
          <div className="space-y-3">
            {(meetingActive ? prioritizedZones : enrichedZones).map((ez, i) => {
              const isHighRelevance = meetingActive && ez.meetingRelevance >= 0.3;
              const isLowRelevance = meetingActive && ez.meetingRelevance < 0.15;
              return (
              <SelectableItem key={i} id={`ez-${i}`} label={ez.zone} category="Engagement Zones" content={`**${ez.zone}** (${ez.priority})\n${ez.detail}${ez.matchedLandingZones?.map(lz => `\n\nLanding: ${lz.zone} (${lz.fit_score}/10)\n${lz.rationale}${lz.entry_strategy ? '\nEntry: ' + lz.entry_strategy : ''}`).join('') || ''}`}>
                <div className={`p-4 rounded-xl border transition-all ${
                  isHighRelevance
                    ? 'bg-primary-50 border-primary/20 ring-1 ring-primary/10'
                    : isLowRelevance
                      ? 'bg-surface-2 border-border opacity-70'
                      : 'bg-primary-50 border-primary/10'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-primary shrink-0" />
                      <span className="font-bold text-sm text-primary">{ez.zone}</span>
                      {isHighRelevance && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Relevant for this meeting</span>
                      )}
                    </div>
                    <PriorityBadge priority={ez.priority} />
                  </div>
                  <p className="text-xs text-fg-muted leading-relaxed mb-3">{ez.detail}</p>

                  {ez.matchedLandingZones?.length > 0 && (
                    <div className="space-y-2 ml-1">
                      {ez.matchedLandingZones.map((lz, j) => (
                        <div key={j} className="p-3 bg-white/70 border border-primary/5 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-primary/50 uppercase">Landing Zone</span>
                              <span className="font-bold text-xs text-fg">{lz.zone}</span>
                            </div>
                            <span className="text-xs font-black" style={{ color: scoreColor(lz.fit_score) }}>{lz.fit_score}/10</span>
                          </div>
                          <p className="text-[11px] text-fg-muted leading-relaxed">{lz.rationale}</p>
                          {lz.entry_strategy && (
                            <p className="text-[11px] text-primary-700 italic mt-1">
                              <span className="font-bold not-italic">Entry:</span> {lz.entry_strategy}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {zoneJustifications.get(ez.zone)?.evidenceSources?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-primary/10">
                      <div className="text-[9px] font-bold text-fg-disabled uppercase tracking-wider mb-1.5">Evidence Trail</div>
                      <div className="flex flex-wrap gap-1.5">
                        {zoneJustifications.get(ez.zone).evidenceSources.map((src, si) => (
                          <div key={si} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] ${
                            src.type === 'storyline' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            src.type === 'matrix' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <span className="font-bold">
                              {src.type === 'storyline' ? '📖' : src.type === 'matrix' ? '📊' : '⚠️'}
                            </span>
                            <span className="font-semibold">{src.label}</span>
                            {src.detail && (
                              <span className="text-[9px] opacity-70 max-w-[180px] truncate" title={src.detail}>— {src.detail}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SelectableItem>
              );
            })}
          </div>

          {unmatchedLandingZones.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-[10px] font-bold text-fg-disabled uppercase tracking-wider">Additional Landing Zones</div>
              {unmatchedLandingZones.map((lz, i) => (
                <div key={i} className="p-3 bg-surface border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-fg">{lz.zone}</span>
                    <span className="text-xs font-black" style={{ color: scoreColor(lz.fit_score) }}>{lz.fit_score}/10</span>
                  </div>
                  <p className="text-[11px] text-fg-muted">{lz.rationale}</p>
                  {lz.entry_strategy && <p className="text-[11px] text-primary-700 italic mt-1">Entry: {lz.entry_strategy}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Product Mapping & References — collapsed */}
      {(vs?.product_mapping?.length > 0 || vs?.reference_customers?.length > 0) && (
        <Section title="Product Mapping & References" defaultOpen={false} color="#3366FF">
          {vs?.product_mapping?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold text-fg mb-2">Product Mapping</h4>
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
            </div>
          )}
          {vs?.reference_customers?.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-fg mb-2">Reference Customers</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {vs.reference_customers.slice(0, 3).map((r, i) => (
                  <div key={i} className="p-2.5 bg-success-subtle rounded-lg">
                    <div className="font-bold text-xs text-success">{r.name} <span className="text-[10px] font-normal text-fg-muted">({r.region})</span></div>
                    <p className="text-[10px] text-fg-subtle mt-0.5 line-clamp-2">{r.relevance}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Market Signals — collapsed */}
      {allSignals.length > 0 && (
        <Section title={`Market Signals (${allSignals.length})`} defaultOpen={false} color="#3366FF">
          {(() => {
            const displaySignals = meetingActive && prioritizedSignals ? prioritizedSignals : allSignals;
            const visibleSigs = showAllSignals ? displaySignals : displaySignals.slice(0, 4);
            return (
              <div>
                {meetingActive && <div className="mb-2"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Ranked for audience</span></div>}
                <div className="space-y-1.5">
                  {visibleSigs.map((s, i) => (
                    <SelectableItem key={i} id={`sig-${i}`} label={s.signal} category="Signals" content={`**${s.signal}**\n${s.implication}`}>
                      <div className="p-3 bg-primary-50 border-l-3 border-primary rounded-r-lg">
                        <div className="font-bold text-xs text-primary">{s.signal}</div>
                        <div className="text-[11px] text-fg-muted mt-0.5">{s.implication}</div>
                      </div>
                    </SelectableItem>
                  ))}
                </div>
                {displaySignals.length > 4 && (
                  <button onClick={() => setShowAllSignals(!showAllSignals)} className="flex items-center gap-1 mt-2 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors">
                    {showAllSignals ? 'Show less' : `+${displaySignals.length - 4} more signals`}
                    <ChevronDown size={12} className={`transition-transform ${showAllSignals ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            );
          })()}
        </Section>
      )}
    </div>
  );

  // ─── Tab: Value ──────────────────────────────────────────────────
  const ValueTab = () => (
    <div>
      {meetingActive && roiFraming && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">How to Frame ROI</span>
            <span className="text-[9px] text-amber-600">for {meetingContext.attendees.map(a => ROLES[a.roleKey]?.title || a.role).join(' + ')}</span>
          </div>
          <p className="text-[11px] text-amber-900/80 leading-relaxed">{roiFraming}</p>
        </div>
      )}
      <RoiSummaryCard bankKey={key} onDeepDive={() => scrollToDeepDive()} />
    </div>
  );

  // ─── Tab: Discovery Questions ────────────────────────────────────
  const DiscoveryQuestionsTab = () => (
    <div>
      {meetingActive && tailoredQuestions ? (
        <>
          {tailoredQuestions.hint && (
            <div className="p-2.5 bg-primary-50 border border-primary/10 rounded-lg mb-3">
              <p className="text-[11px] text-primary/80 leading-relaxed">
                <span className="font-bold">Strategy:</span> {tailoredQuestions.hint}
              </p>
            </div>
          )}
          <div className="space-y-2 mb-3">
            {tailoredQuestions.questions.map((tq, i) => {
              const role = ROLES[tq.roleKey];
              return (
                <div key={i} className="p-3 bg-surface-2 border border-border rounded-lg">
                  <div className="flex items-start gap-2.5">
                    <span className="text-[10px] font-black text-primary bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{role?.icon || '❓'}</span>
                        <span className="text-[9px] font-bold text-fg-disabled uppercase">{tq.phaseLabel}</span>
                        {tq.tag && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{tq.tag}</span>}
                      </div>
                      <p className="text-xs text-fg leading-relaxed font-medium">"{tq.question}"</p>
                      {tq.intent && <p className="text-[10px] text-fg-muted mt-1 italic">Intent: {tq.intent}</p>}
                      {tq.tip && <p className="text-[10px] text-primary/60 mt-0.5">Tip: {tq.tip}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : discoveryQuestions.length > 0 ? (
        <div className="space-y-1.5 mb-3">
          {discoveryQuestions.map((dq, i) => (
            <div key={i} className="flex gap-2.5 p-2.5 bg-surface-2 rounded-lg">
              <span className="text-[10px] font-black text-primary bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-xs text-fg-subtle italic leading-relaxed">"{dq}"</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Full Discovery Playbook — merged from Deep Dive */}
      <div className="mt-4 pt-4 border-t border-border">
        <h4 className="text-sm font-bold text-fg mb-3">Full Discovery Playbook</h4>
        <DiscoveryPanel bankKey={key} />
      </div>
    </div>
  );

  // ─── Tab: Context ────────────────────────────────────────────────
  const ContextTab = () => (
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

      {liveNews.length > 0 && (
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

      {topPainPoints.length > 0 && (
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

      {data.recommended_approach && (
        <div className="p-3 bg-primary-50 border border-primary/10 rounded-lg sm:col-span-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Target size={12} className="text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase">Recommended Approach</span>
          </div>
          <p className="text-xs text-fg-subtle leading-relaxed">{data.recommended_approach}</p>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════
  //  RENDER — Guided Meeting Prep Flow
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="animate-fade-in-up">

      {/* ── COMPACT HEADER ─────────────────────────────────────────── */}
      {/* Row 1: Identity + Actions */}
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => navigate(-1)} className="p-1 text-fg-muted hover:text-primary transition-colors shrink-0">
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-lg font-black text-fg truncate min-w-0 flex-1">{data.bank_name}</h2>
        <span className="px-2 py-0.5 rounded-full text-xs font-black text-white shrink-0"
              style={{ backgroundColor: scoreColor(score) }}>
          {score}/10
        </span>
        <FavoriteButton active={isFavorite(key, 'bank')} onClick={() => toggleFav({ key, type: 'bank', name: data.bank_name })} />
        {/* Utility icon buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => setQuickPrepOpen(true)} title="2-Min Prep" className="p-2 rounded-lg hover:bg-surface-2 text-fg-muted transition-colors">
            <Clock size={15} />
          </button>
          <button onClick={() => setBriefingOpen(true)} title="Full Briefing" className="p-2 rounded-lg hover:bg-surface-2 text-fg-muted transition-colors">
            <FileText size={15} />
          </button>
          <ExportBar bankName={data.bank_name} />
          <button
            onClick={async () => {
              const { generateDiscoveryPresentation } = await import('../utils/generateDiscoveryPresentation');
              generateDiscoveryPresentation({
                bankName: data.bank_name,
                storyline: storylineData?.storyline || null,
                meetingBrief: meetingContext.meetingPrepBrief,
                attendees: meetingContext.attendees,
                topics: meetingContext.topics,
              });
            }}
            title="Discovery Meeting Presentation"
            className={`p-2 rounded-lg transition-colors ${storylineData || meetingContext.meetingPrepBrief ? 'text-primary hover:bg-primary/10' : 'text-fg-muted hover:bg-surface-2 opacity-40'}`}
            disabled={!storylineData && !meetingContext.meetingPrepBrief}
          >
            <Presentation size={15} />
          </button>
          <button
            onClick={async () => {
              const { generateAssessmentHtml } = await import('../utils/generateAssessmentHtml');
              generateAssessmentHtml({ bankKey: key, bankData: data, qualData: qd, cxData: cx, compData: comp, valueSelling: vs, score });
            }}
            title="Export Dashboard"
            className="p-2 rounded-lg hover:bg-surface-2 text-fg-muted transition-colors"
          >
            <LayoutDashboard size={15} />
          </button>
          <button onClick={() => setIntelOpen(true)} title="Add Intel" className="p-2 rounded-lg hover:bg-surface-2 text-fg-muted transition-colors relative">
            <Plus size={15} />
            {pendingIntel > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">{pendingIntel}</span>
            )}
          </button>
        </div>
      </div>
      {/* Row 2: Metadata badges */}
      <div className="flex items-center gap-2 flex-wrap mb-3 pl-8">
        <ConfidenceBadge level={conf.level} />
        <FreshnessBadge date={meta?.as_of || '2026-03-10'} label={meta?.kpis_period || 'Dataset'} compact />
        <LiveStockTicker bankData={data} />
        <NewsSignalBadge bankData={data} />
        {aiAnalysis && <AiSignalBadge aiAnalysis={aiAnalysis} />}
        {grp && <span className="text-[9px] font-bold text-primary bg-primary-50 px-2 py-0.5 rounded shrink-0">🔗 {grp.group_name}</span>}
      </div>

      {/* ── BANK SNAPSHOT — collapsed by default ───────────────────── */}
      <Section title="Bank Snapshot" defaultOpen={false}>
        <p className="text-xs text-fg-muted italic mb-3">{data.tagline}</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex gap-2 flex-wrap mb-3">
              {data.kpis?.map((k, i) => (
                <div key={i} className="bg-surface border border-border rounded-lg px-2.5 sm:px-3 py-1.5">
                  <div className="text-[8px] text-fg-disabled uppercase">{k.label}</div>
                  <div className="text-xs sm:text-sm font-bold text-fg">{k.value}</div>
                </div>
              ))}
            </div>
            {q && (
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-xs text-fg-subtle">
                {q.deal_size && <span><strong>Deal:</strong> {q.deal_size}</span>}
                {q.sales_cycle && <span><strong>Cycle:</strong> {q.sales_cycle}</span>}
                {q.timing && <span><strong>Timing:</strong> {q.timing}</span>}
              </div>
            )}
          </div>
          {radarScores.length > 0 && (
            <div className="shrink-0">
              <RadarChart scores={radarScores} labels={radarLabels} size={200} />
            </div>
          )}
        </div>
        <div className="mt-3">
          <ScoreExplainer bankKey={key} />
        </div>
      </Section>

      {/* ── STEP 1: Meeting Setup ──────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-2 mt-4">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
          meetingActive ? 'bg-emerald-500 text-white' : 'bg-primary text-white'
        }`}>
          {meetingActive ? '✓' : '1'}
        </span>
        <span className="text-xs font-bold text-fg">
          {meetingActive ? 'Meeting configured' : 'Set up your meeting'}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <MeetingContextBar
        kdms={data.key_decision_makers || []}
        meetingContext={meetingContext}
        onContextChange={handleContextChange}
        onCascade={handleCascade}
        cascadeStatus={cascadeStatus}
        bankName={data.bank_name || parseBankKey(key).bank}
        bankKey={key}
      />

      {/* Cascade Progress Bar */}
      {Object.values(cascadeStatus).some(s => s !== 'idle') && (
        <CascadeProgressBar status={cascadeStatus} />
      )}

      {/* ── STEP 2: AI Outputs ─────────────────────────────────────── */}
      {(meetingContext.meetingPrepBrief || storylineData) && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-black shrink-0">2</span>
            <span className="text-xs font-bold text-fg">Review AI Brief</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {meetingContext.meetingPrepBrief && (
            <MeetingPrepBrief
              brief={meetingContext.meetingPrepBrief}
              bankName={data.bank_name || parseBankKey(key).bank}
              onClear={() => handleContextChange(prev => ({ ...prev, meetingPrepBrief: null }))}
            />
          )}

          <DiscoveryStoryline
            storyline={storylineData}
            bankName={data?.bank_name || parseBankKey(key).bank}
            onGenerate={handleGenerateStoryline}
            isGenerating={storylineGenerating}
            researchAvailable={researchAvailable}
            error={storylineError}
          />
        </div>
      )}

      {/* Show DiscoveryStoryline standalone if no AI brief but no storyline data yet */}
      {!meetingContext.meetingPrepBrief && !storylineData && (
        <DiscoveryStoryline
          storyline={storylineData}
          bankName={data?.bank_name || parseBankKey(key).bank}
          onGenerate={handleGenerateStoryline}
          isGenerating={storylineGenerating}
          researchAvailable={researchAvailable}
          error={storylineError}
        />
      )}

      {/* ── STEP 3: Review Intelligence (Tabbed Content) ───────────── */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-black shrink-0">
            {meetingContext.meetingPrepBrief || storylineData ? '3' : '2'}
          </span>
          <span className="text-xs font-bold text-fg">Review Intelligence</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <TabBar id="main-tabs" tabs={[
          { label: '👥 People',      content: <PeopleTab /> },
          { label: '🎯 Opportunity', content: <OpportunityTab /> },
          { label: '💰 Value',       content: <ValueTab /> },
          { label: '🔍 Discovery',   content: <DiscoveryQuestionsTab /> },
          { label: '📋 Context',     content: <ContextTab /> },
        ]} />
      </div>

      {/* ── DEEP DIVE — Power User Tabs ────────────────────────────── */}
      <div ref={deepDiveRef} id="deep-dive" className="mt-6 pt-6 border-t-2 border-primary/10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold text-fg-disabled uppercase tracking-widest">Deep Dive</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <TabBar id="deep-dive-tabs" tabs={[
          { label: '📱 CX', content: <CxTab /> },
          { label: '🛡️ Battle Cards', content: <BattleCardsPanel bankKey={key} /> },
          { label: '💰 Full ROI', content: <RoiPanel bankKey={key} /> },
          { label: '💡 Actions', content: <NextBestActionPanel bankKey={key} /> },
          { label: '🤖 AI Analysis', content: <AiAnalysisPanel bankKey={key} /> },
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
      </div>

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
