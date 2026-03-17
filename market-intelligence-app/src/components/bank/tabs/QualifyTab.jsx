import { lazy, Suspense } from 'react';
import { Plus } from 'lucide-react';
import Section from '../../common/Section';
import { LoadingState } from '../../common/DataState';
import ScoreExplainer from '../ScoreExplainer';
import RadarChart from '../../charts/RadarChart';
import DiscoveryPanel from '../DiscoveryPanel';
import IntelFeed from '../../intel/IntelFeed';
import { QUAL_FRAMEWORK } from '../../../data/scoring';
import { ROLES } from '../../../data/discoveryQuestions';

const NextBestActionPanel = lazy(() => import('../NextBestActionPanel'));
const AiAnalysisPanel = lazy(() => import('../AiAnalysisPanel'));

/**
 * QualifyTab — "Help me close this opportunity"
 *
 * Combines: Qualification scorecard + Next Actions + Discovery checklist + Intel + AI Analysis
 * Replaces: Bank Snapshot radar + Deep Dive Actions + Deep Dive AI Analysis + Deep Dive Intel
 */
export default function QualifyTab({
  bankKey, data, qd, q, radarScores, radarLabels,
  meetingActive, tailoredQuestions, discoveryQuestions,
  intelEntries, pendingIntel, onAddIntel, refreshIntel,
}) {
  return (
    <div className="space-y-4">

      {/* ── SECTION 1: Qualification Scorecard ─────────────────────── */}
      <div>
        <div className="text-[10px] font-bold text-fg-disabled uppercase tracking-widest mb-2">Qualification Scorecard</div>
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-surface-2 border border-border rounded-lg">
          {radarScores?.length > 0 && (
            <div className="shrink-0 flex items-center justify-center">
              <RadarChart scores={radarScores} labels={radarLabels} size={180} />
            </div>
          )}
          <div className="flex-1">
            <ScoreExplainer bankKey={bankKey} />
            {q && (
              <div className="flex flex-wrap gap-2 mt-3 text-xs text-fg-subtle">
                {q.deal_size && <span className="px-2 py-1 bg-surface border border-border rounded-lg"><strong>Deal:</strong> {q.deal_size}</span>}
                {q.sales_cycle && <span className="px-2 py-1 bg-surface border border-border rounded-lg"><strong>Cycle:</strong> {q.sales_cycle}</span>}
                {q.timing && <span className="px-2 py-1 bg-surface border border-border rounded-lg"><strong>Timing:</strong> {q.timing}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Next Best Actions — PROMOTED from deep dive ── */}
      <div>
        <div className="text-[10px] font-bold text-fg-disabled uppercase tracking-widest mb-2">Next Best Actions</div>
        <Suspense fallback={<LoadingState message="Loading actions..." />}>
          <NextBestActionPanel bankKey={bankKey} />
        </Suspense>
      </div>

      {/* ── SECTION 3: Discovery Playbook ──────────────────────────── */}
      <Section title="Discovery Playbook" defaultOpen={false}>
        <DiscoveryPanel bankKey={bankKey} />
      </Section>

      {/* ── SECTION 4: AI Deep Analysis ────────────────────────────── */}
      <Section title="AI Analysis" defaultOpen={false}>
        <Suspense fallback={<LoadingState message="Loading AI analysis..." />}>
          <AiAnalysisPanel bankKey={bankKey} />
        </Suspense>
      </Section>

      {/* ── SECTION 5: Intel Capture ───────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold text-fg-disabled uppercase tracking-widest">
            Intelligence Captured{intelEntries.length > 0 ? ` (${intelEntries.length})` : ''}
          </div>
          <button
            onClick={onAddIntel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-[11px] font-bold hover:bg-primary/90 transition-colors"
          >
            <Plus size={12} /> Add Intel
          </button>
        </div>
        {pendingIntel > 0 && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg mb-3 flex items-center gap-2">
            <span className="text-warning text-sm">⏳</span>
            <span className="text-xs text-warning font-bold">{pendingIntel} pending review</span>
            <span className="text-[10px] text-fg-disabled">— approve or dismiss to update bank intelligence</span>
          </div>
        )}
        <IntelFeed entries={intelEntries} onUpdate={refreshIntel} />
        {intelEntries.length === 0 && (
          <p className="text-xs text-fg-disabled italic text-center py-4">No intelligence captured yet. Use "Add Intel" after meetings to log insights.</p>
        )}
      </div>
    </div>
  );
}
