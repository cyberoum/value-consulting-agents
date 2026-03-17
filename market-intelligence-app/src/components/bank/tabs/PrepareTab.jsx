import { AlertTriangle, Swords, Zap, Newspaper, Target, ExternalLink, User, Lightbulb } from 'lucide-react';
import Section from '../../common/Section';
import { SectionFreshnessBar } from '../../common/FreshnessBadge';
import AiInsightsCard from '../../live/AiInsightsCard';
import LiveNewsFeed from '../../live/LiveNewsFeed';
import { LiveStockCard } from '../../live/LiveStockTicker';
import { ROLES } from '../../../data/discoveryQuestions';

/**
 * PrepareTab — "Get me ready for this meeting"
 *
 * Combines:  Bank context + People intel + Pain points + Opening questions + CX snapshot
 * Replaces:  ProfileTab + PeopleTab + parts of DiscoveryQuestionsTab + parts of CxTab
 */
export default function PrepareTab({
  bankKey, data, meta, aiAnalysis, sources, q, comp, liveNews, topPainPoints,
  meetingActive, meetingContext, meetingTips, allPeople, topPeople,
  tailoredQuestions, discoveryQuestions,
  cx,
}) {
  const attendees = meetingContext?.attendees || [];
  const personResearch = meetingContext?.personResearch || {};

  return (
    <div className="space-y-4">

      {/* ── SECTION 1: Bank at a Glance ────────────────────────────── */}
      <div>
        <div className="text-[10px] font-bold text-fg-disabled uppercase tracking-widest mb-2">Bank at a Glance</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Risk */}
          {q?.risk && (
            <div className="p-3 bg-danger-subtle border border-danger/20 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={12} className="text-danger" />
                <span className="text-[10px] font-bold text-danger uppercase">Risk</span>
              </div>
              <p className="text-xs text-fg-subtle">{q.risk}</p>
            </div>
          )}

          {/* Competition */}
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

          {/* AI Intelligence */}
          {aiAnalysis?.signals?.length > 0 && (
            <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg dark:bg-violet-900/20 dark:border-violet-800">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={12} className="text-violet-600" />
                <span className="text-[10px] font-bold text-violet-700 uppercase dark:text-violet-400">AI Intelligence</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-800 dark:text-violet-300">{aiAnalysis.signals.length} signals</span>
              </div>
              <p className="text-xs text-fg-subtle">{aiAnalysis.signals[0]?.signal}</p>
              {aiAnalysis.signals[0]?.implication && (
                <p className="text-[10px] text-fg-disabled mt-0.5">{aiAnalysis.signals[0].implication}</p>
              )}
            </div>
          )}

          {/* Latest News */}
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

          {/* Pain Points */}
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

          {/* CX Snapshot — inline (no separate tab needed) */}
          {cx && (
            <div className="p-3 bg-surface border border-border rounded-lg">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold text-fg-muted uppercase">📱 CX Snapshot</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-fg-subtle">
                {cx.ios_rating && <span>iOS: <strong className="text-fg">{cx.ios_rating}</strong>★</span>}
                {cx.android_rating && <span>Android: <strong className="text-fg">{cx.android_rating}</strong>★</span>}
                {cx.digital_maturity && <span>Maturity: <strong className="text-fg">{cx.digital_maturity}</strong></span>}
              </div>
              {cx.cx_weaknesses?.length > 0 && (
                <p className="text-[10px] text-danger mt-1">⚠ {cx.cx_weaknesses[0]}</p>
              )}
            </div>
          )}
        </div>

        {/* Recommended approach — full width */}
        {data?.recommended_approach && (
          <div className="p-3 bg-primary-50 border border-primary/10 rounded-lg mt-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Target size={12} className="text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase">Recommended Approach</span>
            </div>
            <p className="text-xs text-fg-subtle leading-relaxed">{data.recommended_approach}</p>
          </div>
        )}
      </div>

      {/* ── SECTION 2: Who You're Meeting ──────────────────────────── */}
      <div>
        <div className="text-[10px] font-bold text-fg-disabled uppercase tracking-widest mb-2">
          {meetingActive ? `Meeting Attendees (${attendees.length})` : `Key Decision Makers (${topPeople.length})`}
        </div>

        {meetingActive ? (
          <div className="space-y-2">
            {attendees.map((person, i) => {
              const research = personResearch[person.name];
              return (
                <div key={i} className="p-3 bg-primary-50 border border-primary/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={12} className="text-primary" />
                    <span className="text-xs font-bold text-fg">{person.name}</span>
                    <span className="text-[9px] text-fg-muted">{person.role}</span>
                    {person.linkedin && (
                      <a href={person.linkedin} target="_blank" rel="noopener" className="text-primary"><ExternalLink size={10} /></a>
                    )}
                  </div>
                  {person.note && <p className="text-[10px] text-fg-muted mb-1">{person.note}</p>}
                  {research?.summary && (
                    <p className="text-[10px] text-fg-subtle italic">{research.summary}</p>
                  )}
                  {research?.likely_priorities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {research.likely_priorities.slice(0, 3).map((p, j) => (
                        <span key={j} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Meeting tips */}
            {meetingTips?.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-800">
                <div className="text-[10px] font-bold text-amber-700 uppercase mb-1 dark:text-amber-400">Meeting Tips</div>
                <ul className="space-y-0.5">
                  {meetingTips.slice(0, 4).map((tip, i) => (
                    <li key={i} className="text-[10px] text-amber-900/80 dark:text-amber-300">• {typeof tip === 'string' ? tip : tip.tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {topPeople.map((p, i) => (
              <div key={i} className="p-2.5 bg-surface-2 border border-border rounded-lg">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{p.icon || '👤'}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-fg truncate">{p.name}</div>
                    <div className="text-[10px] text-fg-muted truncate">{p.role || p.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 3: Your Opening — Questions + Talking Points ───── */}
      <div>
        <div className="text-[10px] font-bold text-fg-disabled uppercase tracking-widest mb-2">
          <Lightbulb size={10} className="inline mr-1" />
          {meetingActive ? 'Your Opening Questions' : 'Discovery Questions'}
        </div>

        {meetingActive && tailoredQuestions?.questions?.length > 0 ? (
          <>
            {tailoredQuestions.hint && (
              <div className="p-2.5 bg-primary-50 border border-primary/10 rounded-lg mb-2">
                <p className="text-[10px] text-primary/80"><strong>Strategy:</strong> {tailoredQuestions.hint}</p>
              </div>
            )}
            <div className="space-y-1.5">
              {tailoredQuestions.questions.slice(0, 5).map((tq, i) => {
                const role = ROLES[tq.roleKey];
                return (
                  <div key={i} className="p-2.5 bg-surface-2 border border-border rounded-lg flex items-start gap-2">
                    <span className="text-[10px] font-black text-primary bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-xs">{role?.icon || '❓'}</span>
                        <span className="text-[8px] font-bold text-fg-disabled uppercase">{tq.phaseLabel}</span>
                      </div>
                      <p className="text-xs text-fg font-medium">"{tq.question}"</p>
                      {tq.tip && <p className="text-[10px] text-primary/60 mt-0.5">💡 {tq.tip}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : discoveryQuestions?.length > 0 ? (
          <div className="space-y-1.5">
            {discoveryQuestions.slice(0, 5).map((dq, i) => (
              <div key={i} className="p-2.5 bg-surface-2 border border-border rounded-lg flex items-start gap-2">
                <span className="text-[10px] font-black text-primary bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-xs text-fg">"{typeof dq === 'string' ? dq : dq.question}"</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-fg-disabled italic">Configure meeting attendees to generate tailored questions.</p>
        )}
      </div>

      {/* ── SECTION 4: Deep Profile (collapsible) ─────────────────── */}
      <Section title="Full Bank Profile" defaultOpen={false}>
        <SectionFreshnessBar date={meta?.as_of} category="Bank Profile" sourcePeriod={meta?.kpis_period || 'Annual Report / Public Filings'} />
        {data?.points_of_interest?.length > 0 && (
          <>
            <h3 className="text-sm font-bold text-fg mb-3 mt-3">Points of Interest</h3>
            <div className="space-y-2 mb-3">
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
            <p className="text-sm text-fg-subtle leading-relaxed">{data.overview}</p>
          </Section>
        )}
        {data?.financials && (
          <Section title="Financials" defaultOpen={false}>
            <p className="text-sm text-fg-subtle leading-relaxed">{data.financials}</p>
          </Section>
        )}
        {data?.digital_strategy && (
          <Section title="Digital Strategy" defaultOpen={false}>
            <p className="text-sm text-fg-subtle leading-relaxed">{data.digital_strategy}</p>
          </Section>
        )}
        {data?.strategic_initiatives && (
          <Section title="Strategic Initiatives" defaultOpen={false}>
            <p className="text-sm text-fg-subtle leading-relaxed">{data.strategic_initiatives}</p>
          </Section>
        )}
        {aiAnalysis && <AiInsightsCard aiAnalysis={aiAnalysis} />}
        <LiveStockCard bankData={data} />
        <LiveNewsFeed bankData={data} />
        {sources?.length > 0 && (
          <div className="mt-4 p-3 bg-surface-2 border border-border rounded-xl">
            <div className="text-xs font-bold text-fg mb-2">Sources</div>
            <div className="flex flex-wrap gap-2">
              {sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener" className="text-[11px] text-primary hover:underline flex items-center gap-1">
                  {s.label} <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
