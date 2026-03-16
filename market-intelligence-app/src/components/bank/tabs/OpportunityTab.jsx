import { useState } from 'react';
import { Target, ChevronDown } from 'lucide-react';
import Section from '../../common/Section';
import SectionFeedback from '../../common/SectionFeedback';
import SourceBadge from '../../common/SourceBadge';
import { PriorityBadge } from '../../common/Badge';
import SelectableItem from '../SelectableItem';
import LandingZoneMatrix from '../LandingZoneMatrix';
import ModernizationPlayCards from '../ModernizationPlayCards';
import UnconsideredNeeds from '../UnconsideredNeeds';
import { scoreColor } from '../../../data/scoring';

export default function OpportunityTab({
  bankKey,
  data,
  bankName,
  vs,
  meetingActive,
  tailoredHypothesis,
  lzData,
  handleAnalyzeLandingZones,
  lzAnalyzing,
  researchAvailable,
  enrichedZones,
  prioritizedZones,
  unmatchedLandingZones,
  zoneJustifications,
  allSignals,
  prioritizedSignals,
  getFeedback,
  setFeedbackFor,
}) {
  const [showAllSignals, setShowAllSignals] = useState(false);

  return (
    <div className="space-y-3">
      {/* Value Hypothesis */}
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
                  <SectionFeedback sectionId={`${bankKey}-vh-tailored`} getFeedback={getFeedback} setFeedbackFor={setFeedbackFor} />
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
                  <SectionFeedback sectionId={`${bankKey}-vh`} getFeedback={getFeedback} setFeedbackFor={setFeedbackFor} />
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

      {/* Landing Zone Analysis */}
      <Section title="Landing Zone Analysis" defaultOpen={false} color="#3366FF">
        <LandingZoneMatrix
          matrixData={lzData}
          bankData={data}
          bankKey={bankKey}
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

      {/* Engagement Zones */}
      {(meetingActive ? prioritizedZones : enrichedZones).length > 0 && (
        <Section title={`Engagement Zones (${enrichedZones.length})`} defaultOpen={false} color="#3366FF">
          <div className="flex items-center gap-2 mb-3">
            {meetingActive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Sorted by relevance</span>}
            <SourceBadge sourceCount={enrichedZones.length} confidence="high" />
            <SectionFeedback sectionId={`${bankKey}-ez`} getFeedback={getFeedback} setFeedbackFor={setFeedbackFor} />
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

      {/* Product Mapping & References */}
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

      {/* Market Signals */}
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
}
