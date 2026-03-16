import Section from '../../common/Section';
import SectionFeedback from '../../common/SectionFeedback';
import SourceBadge from '../../common/SourceBadge';
import FlagOutdated from '../../common/FlagOutdated';
import { SectionFreshnessBar } from '../../common/FreshnessBadge';
import RadarChart from '../../charts/RadarChart';
import { LiveRatingsCard } from '../../live/LiveRatingBadge';

export default function CxTab({ bankKey, data, cx, meta, getFeedback, setFeedbackFor }) {
  return (
    <div>
      <SectionFreshnessBar date={meta?.as_of} category="CX & Ratings" sourcePeriod="App Store / Play Store" />
      {cx && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <SourceBadge sourceCount={cx.app_rating_ios ? 2 : 0} confidence={cx.app_rating_ios ? 'high' : 'low'} />
            <SectionFeedback sectionId={`${bankKey}-cx`} getFeedback={getFeedback} setFeedbackFor={setFeedbackFor} />
            <FlagOutdated bankKey={bankKey} section="cx" compact />
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
}
