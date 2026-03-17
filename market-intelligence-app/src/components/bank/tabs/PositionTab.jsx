import { lazy, Suspense } from 'react';
import Section from '../../common/Section';
import { LoadingState } from '../../common/DataState';
import RoiSummaryCard from '../RoiSummaryCard';
import { ROLES } from '../../../data/discoveryQuestions';
import OpportunityTab from './OpportunityTab';
import ConsultingKnowledgeTab from './ConsultingKnowledgeTab';

const BattleCardsPanel = lazy(() => import('../BattleCardsPanel'));

/**
 * PositionTab — "Help me position Backbase"
 *
 * Combines: Value Hypothesis + Landing Zones + Battle Cards + ROI + Consulting Knowledge
 * Replaces: OpportunityTab + ValueTab + Deep Dive Battle Cards + ConsultingKnowledgeTab
 */
export default function PositionTab({
  bankKey, data, bankName, vs, meetingActive, meetingContext,
  tailoredHypothesis, lzData, handleAnalyzeLandingZones, lzAnalyzing, researchAvailable,
  enrichedZones, prioritizedZones, unmatchedLandingZones, zoneJustifications,
  allSignals, prioritizedSignals, getFeedback, setFeedbackFor,
  roiFraming, comp,
}) {
  return (
    <div className="space-y-4">

      {/* ── SECTION 1: Opportunity Analysis (full OpportunityTab) ──── */}
      <OpportunityTab
        bankKey={bankKey} data={data} bankName={bankName} vs={vs}
        meetingActive={meetingActive} tailoredHypothesis={tailoredHypothesis}
        lzData={lzData} handleAnalyzeLandingZones={handleAnalyzeLandingZones}
        lzAnalyzing={lzAnalyzing} researchAvailable={researchAvailable}
        enrichedZones={enrichedZones} prioritizedZones={prioritizedZones}
        unmatchedLandingZones={unmatchedLandingZones} zoneJustifications={zoneJustifications}
        allSignals={allSignals} prioritizedSignals={prioritizedSignals}
        getFeedback={getFeedback} setFeedbackFor={setFeedbackFor}
      />

      {/* ── SECTION 2: Battle Cards — PROMOTED from deep dive ──────── */}
      <div>
        <div className="text-[10px] font-bold text-fg-disabled uppercase tracking-widest mb-2">Objection Handling</div>
        <Suspense fallback={<LoadingState message="Loading battle cards..." />}>
          <BattleCardsPanel bankKey={bankKey} />
        </Suspense>
      </div>

      {/* ── SECTION 3: ROI Sound Bites ─────────────────────────────── */}
      <div>
        <div className="text-[10px] font-bold text-fg-disabled uppercase tracking-widest mb-2">Value & ROI</div>
        {meetingActive && roiFraming && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3 dark:bg-amber-900/20 dark:border-amber-800">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider dark:text-amber-400">How to Frame ROI</span>
              <span className="text-[9px] text-amber-600 dark:text-amber-500">
                for {meetingContext?.attendees?.map(a => ROLES[a.roleKey]?.title || a.role).join(' + ')}
              </span>
            </div>
            <p className="text-[11px] text-amber-900/80 leading-relaxed dark:text-amber-300">{roiFraming}</p>
          </div>
        )}
        <RoiSummaryCard bankKey={bankKey} />
      </div>

      {/* ── SECTION 4: Domain Knowledge (collapsible) ──────────────── */}
      <Section title="Consulting Knowledge & Product Mapping" defaultOpen={false}>
        <ConsultingKnowledgeTab bankData={data} />
      </Section>
    </div>
  );
}
