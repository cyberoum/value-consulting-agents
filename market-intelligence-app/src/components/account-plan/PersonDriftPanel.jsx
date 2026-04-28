/**
 * PersonDriftPanel — Sprint 2.6
 * ─────────────────────────────
 * Renders this stakeholder's stated positions across topics, observed across
 * meetings. Surfaces sentiment drift over time so an AE can see at a glance
 * whether (e.g.) a CFO's position on budget is improving, deteriorating,
 * stable, or just-emerged.
 *
 * Data source: /api/banks/:key/stakeholder-drift?view=by-person
 *   (filtered client-side to this person's row by speaker_person_id)
 *
 * Each topic row renders:
 *   - Topic label + trend chip (improving / deteriorating / mixed / stable / new)
 *   - Sentiment ladder: ordered series of sentiments with dates
 *   - Latest position text (clipped) + verbatim evidence quote on hover
 *
 * Why this is in the bidirectional cross-link family (alongside PersonSignalsPanel):
 * the AE editing a stakeholder card sees BOTH external signals about them
 * AND internal positions they've taken. Together these are the "what we
 * know about this person" view that Claude-in-a-chat can't reproduce — it
 * requires persistent state across both surfaces.
 */

import { useEffect, useState } from 'react';
import { Loader, MessageSquare, TrendingUp, TrendingDown, Minus, Sparkles, Activity } from 'lucide-react';
import { getStakeholderDrift } from '../../data/api';

const TOPIC_LABEL = {
  budget: 'Budget',
  vendors: 'Vendors',
  timeline: 'Timeline',
  politics: 'Politics',
  technical: 'Technical',
  blockers: 'Blockers',
  other: 'Other',
};

const TREND_META = {
  improving:     { label: 'improving',     Icon: TrendingUp,   tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  deteriorating: { label: 'deteriorating', Icon: TrendingDown, tone: 'text-rose-700 bg-rose-50 border-rose-200' },
  mixed:         { label: 'mixed',         Icon: Activity,     tone: 'text-amber-700 bg-amber-50 border-amber-200' },
  stable:        { label: 'stable',        Icon: Minus,        tone: 'text-slate-700 bg-slate-50 border-slate-200' },
  single_point:  { label: 'new',           Icon: Sparkles,     tone: 'text-blue-700 bg-blue-50 border-blue-200' },
};

const SENTIMENT_DOT = {
  positive: 'bg-emerald-500',
  neutral:  'bg-slate-400',
  mixed:    'bg-amber-500',
  negative: 'bg-rose-500',
};

function SentimentLadder({ series }) {
  // Compact horizontal ladder: dot per observation, line connecting them, date below.
  return (
    <div className="flex items-center gap-1 mt-1">
      {series.map((s, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex flex-col items-center" title={`${s.sentiment} on ${s.meeting_date}\n${s.position}`}>
            <span className={`block w-2 h-2 rounded-full ${SENTIMENT_DOT[s.sentiment] || 'bg-slate-300'}`} />
            <span className="text-[8px] text-[var(--text-muted)] mt-0.5 leading-none">
              {String(s.meeting_date).slice(5)}
            </span>
          </div>
          {i < series.length - 1 && <span className="block w-3 h-px bg-slate-300" />}
        </div>
      ))}
    </div>
  );
}

export default function PersonDriftPanel({ bankKey, personId, personName }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bankKey || !personId) return;
    setLoading(true);
    getStakeholderDrift(bankKey, { view: 'by-person' })
      .then((res) => {
        const me = (res?.data || []).find(p => p.speaker_person_id === personId);
        setTopics(me?.topics || []);
      })
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  }, [bankKey, personId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
        <Loader size={10} className="animate-spin" /> Loading positions…
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="flex items-start gap-2">
        <MessageSquare size={12} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
        <div className="text-[10px] text-[var(--text-muted)] italic">
          No attributed positions for {personName} yet. Positions are extracted from meeting notes;
          adding more meetings or attributing existing facts will populate this view.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
          <MessageSquare size={11} /> Positions Across Meetings
        </div>
        <span className="text-[9px] text-[var(--text-muted)]">{topics.length} topic{topics.length === 1 ? '' : 's'}</span>
      </div>

      <div className="space-y-1.5">
        {topics.map((t, idx) => {
          const meta = TREND_META[t.trend] || TREND_META.single_point;
          const TrendIcon = meta.Icon;
          return (
            <div key={idx} className="p-2 rounded border border-[var(--border-subtle)] bg-white">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-[var(--text-primary)]">{TOPIC_LABEL[t.topic] || t.topic}</span>
                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${meta.tone}`}>
                  <TrendIcon size={9} /> {meta.label}
                  {t.n_facts > 1 && <span className="opacity-70">· n={t.n_facts}</span>}
                </span>
              </div>

              <SentimentLadder series={t.series} />

              <div className="mt-1.5 text-[10px] text-[var(--text-secondary)] leading-snug" title={t.series[t.series.length - 1]?.evidence_quote || ''}>
                "{t.latest_position}"
              </div>
              <div className="text-[9px] text-[var(--text-muted)] mt-0.5 italic">
                Latest: {t.latest_sentiment} on {t.last_seen}
                {t.series[t.series.length - 1]?.evidence_quote && (
                  <span className="ml-1">· hover for verbatim quote</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
