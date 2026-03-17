import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, Plus, LayoutDashboard, Presentation } from 'lucide-react';
import { useBank, useAiAnalysis } from '../hooks/useData';
import { QUAL_FRAMEWORK, calcScoreFromData, scoreColor, parseBankKey, dataConfidenceFromData } from '../data/scoring';
import { getMarketForCountry } from '../data/utils';
import { LoadingState, ErrorState } from '../components/common/DataState';
import TabBar from '../components/common/TabBar';
import { ConfidenceBadge, FavoriteButton } from '../components/common/Badge';
import BriefingModal from '../components/bank/BriefingModal';
import QuickPrepModal from '../components/bank/QuickPrepModal';
import ExportBar from '../components/bank/ExportBar';
import { useFavorites } from '../context/FavoritesContext';
import useFeedback from '../hooks/useFeedback';
import FreshnessBadge from '../components/common/FreshnessBadge';
import { BANK_METADATA, bankFreshness } from '../data/metadata';
import { getIntelForBank, getPendingCount } from '../data/userIntel';
import IntelPanel from '../components/intel/IntelPanel';
import { NewsSignalBadge } from '../components/live/LiveNewsFeed';
import LiveStockTicker from '../components/live/LiveStockTicker';
import { AiSignalBadge } from '../components/live/AiInsightsCard';
import { matchZonesToLandingZones } from '../utils/zoneMatching';
import MeetingContextBar from '../components/bank/MeetingContextBar';
import MeetingPrepBrief from '../components/bank/MeetingPrepBrief';
import DiscoveryStoryline from '../components/bank/DiscoveryStoryline';
import CascadeProgressBar from '../components/bank/CascadeProgressBar';
import { PrepareTab, PositionTab, QualifyTab } from '../components/bank/tabs';
import { MeetingProvider, useMeeting } from '../context/MeetingContext';
import { useLandingZoneMatrix, useDiscoveryStoryline } from '../hooks/useData';
import { analyzeLandingZones as apiAnalyzeLandingZones, generateDiscoveryStoryline as apiGenerateDiscoveryStoryline, generateMeetingPrep as apiGenerateMeetingPrep, generateValueHypothesis as apiGenerateValueHypothesis } from '../data/api';
import { buildZoneJustifications } from '../utils/zoneJustification';
import {
  scoreZoneRelevance,
  scoreSignalRelevance,
  getTailoredQuestions,
  getAggregatedTips,
  getRoiFraming,
} from '../utils/meetingTailoring';

export default function BankPage() {
  const { bankKey } = useParams();
  const key = decodeURIComponent(bankKey);

  return (
    <MeetingProvider bankKey={key}>
      <BankPageContent bankKey={key} />
    </MeetingProvider>
  );
}

function BankPageContent({ bankKey: key }) {
  const navigate = useNavigate();
  const { meetingContext, updateContext: handleContextChange, meetingActive, meetingRoleKeys } = useMeeting();
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [quickPrepOpen, setQuickPrepOpen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);
  const [intelRefresh, setIntelRefresh] = useState(0);
  const deepDiveRef = useRef(null);

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
  // meetingActive and meetingRoleKeys are provided by useMeeting() hook

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

  // Derived data for tab components
  const allSignals = data.signals || [];
  const topPainPoints = (data.pain_points || []).slice(0, 2);
  const liveNews = (data.live_news?.articles || []).slice(0, 2);
  const discoveryQuestions = (vs?.discovery_questions || []).slice(0, 5);

  // ═══════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="animate-fade-in-up">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      {/* Row 1: Back + Identity + Score */}
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
      </div>

      {/* Row 2: Metadata badges */}
      <div className="flex items-center gap-2 flex-wrap mb-2 pl-8">
        <ConfidenceBadge level={conf.level} />
        <FreshnessBadge date={meta?.as_of || '2026-03-10'} label={meta?.kpis_period || 'Dataset'} compact />
        <LiveStockTicker bankData={data} />
        <NewsSignalBadge bankData={data} />
        {aiAnalysis && <AiSignalBadge aiAnalysis={aiAnalysis} />}
        {grp && <span className="text-[9px] font-bold text-primary bg-primary-50 px-2 py-0.5 rounded shrink-0">🔗 {grp.group_name}</span>}
      </div>

      {/* Row 3: Action buttons — labeled, grouped by function */}
      <div className="flex items-center gap-1.5 flex-wrap pl-8 mb-3">
        {/* Prep actions */}
        <button onClick={() => setQuickPrepOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-primary/5 text-primary hover:bg-primary/10 transition-colors border border-primary/10">
          <Clock size={12} /> 2-Min Prep
        </button>
        <button onClick={() => setBriefingOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-primary/5 text-primary hover:bg-primary/10 transition-colors border border-primary/10">
          <FileText size={12} /> Full Briefing
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Export actions */}
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
          disabled={!storylineData && !meetingContext.meetingPrepBrief}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors border
            ${storylineData || meetingContext.meetingPrepBrief
              ? 'bg-violet-50 text-violet-600 hover:bg-violet-100 border-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800'
              : 'bg-surface-2 text-fg-disabled border-border opacity-50 cursor-not-allowed'}`}
        >
          <Presentation size={12} /> Presentation
        </button>
        <button
          onClick={async () => {
            const { generateAssessmentHtml } = await import('../utils/generateAssessmentHtml');
            generateAssessmentHtml({ bankKey: key, bankData: data, qualData: qd, cxData: cx, compData: comp, valueSelling: vs, score });
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-surface-2 text-fg-muted hover:bg-surface-3 transition-colors border border-border"
        >
          <LayoutDashboard size={12} /> Dashboard
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Intel */}
        <button onClick={() => setIntelOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-surface-2 text-fg-muted hover:bg-surface-3 transition-colors border border-border relative">
          <Plus size={12} /> Add Intel
          {pendingIntel > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-danger text-white">{pendingIntel}</span>
          )}
        </button>
      </div>

      {/* ── INLINE KPIs — always visible ────────────────────────────── */}
      {data.kpis?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap pl-8 mb-3">
          {data.kpis.slice(0, 5).map((k, i) => (
            <span key={i} className="text-[9px] text-fg-muted bg-surface-2 border border-border rounded px-2 py-0.5">
              <span className="text-fg-disabled">{k.label}:</span> <strong className="text-fg">{k.value}</strong>
            </span>
          ))}
        </div>
      )}

      {/* ── MEETING SETUP — compact bar ─────────────────────────────── */}
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

      {/* ── AI Outputs (Meeting Prep + Storyline) ───────────────────── */}
      {(meetingContext.meetingPrepBrief || storylineData) && (
        <div className="mt-3">
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

      {/* ═══════════════════════════════════════════════════════════════
       *  MAIN INTELLIGENCE — 3 Task-Based Tabs
       *  Prepare (get ready) → Position (sell) → Qualify (close)
       * ═══════════════════════════════════════════════════════════════ */}
      <div className="mt-4">
        <TabBar id="phase-tabs" sticky tabs={[
          {
            label: '🎯 Prepare',
            badge: meetingActive ? 'dot' : null,
            content: (
              <PrepareTab
                bankKey={key} data={data} meta={meta} aiAnalysis={aiAnalysis} sources={sources}
                q={q} comp={comp} liveNews={liveNews} topPainPoints={topPainPoints}
                meetingActive={meetingActive} meetingContext={meetingContext} meetingTips={meetingTips}
                allPeople={allPeople} topPeople={topPeople}
                tailoredQuestions={tailoredQuestions} discoveryQuestions={discoveryQuestions}
                cx={cx}
              />
            ),
          },
          {
            label: '⚡ Position',
            badge: allSignals.length || null,
            content: (
              <PositionTab
                bankKey={key} data={data} bankName={bankName} vs={vs}
                meetingActive={meetingActive} meetingContext={meetingContext}
                tailoredHypothesis={tailoredHypothesis} lzData={lzData}
                handleAnalyzeLandingZones={handleAnalyzeLandingZones} lzAnalyzing={lzAnalyzing}
                researchAvailable={researchAvailable} enrichedZones={enrichedZones}
                prioritizedZones={prioritizedZones} unmatchedLandingZones={unmatchedLandingZones}
                zoneJustifications={zoneJustifications} allSignals={allSignals}
                prioritizedSignals={prioritizedSignals} getFeedback={getFeedback}
                setFeedbackFor={setFeedbackFor} roiFraming={roiFraming} comp={comp}
              />
            ),
          },
          {
            label: '✅ Qualify',
            badge: intelEntries.length || null,
            content: (
              <QualifyTab
                bankKey={key} data={data} qd={qd} q={q}
                radarScores={radarScores} radarLabels={radarLabels}
                meetingActive={meetingActive} tailoredQuestions={tailoredQuestions}
                discoveryQuestions={discoveryQuestions}
                intelEntries={intelEntries} pendingIntel={pendingIntel}
                onAddIntel={() => setIntelOpen(true)} refreshIntel={refreshIntel}
              />
            ),
          },
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
