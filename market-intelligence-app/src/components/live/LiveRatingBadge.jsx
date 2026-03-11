import { getLiveAppRating, getRatingDelta } from '../../data/liveDataProvider';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

/**
 * Shows live app ratings with delta vs static data.
 * Compact inline badge for bank headers.
 */
export default function LiveRatingBadge({ bankKey, staticAndroid, staticIos }) {
  const live = getLiveAppRating(bankKey);
  if (!live || (!live.android && !live.ios)) return null;

  const delta = getRatingDelta(bankKey, staticAndroid, staticIos);

  return (
    <div className="flex items-center gap-2">
      {live.ios && (
        <RatingPill
          label=""
          rating={live.ios}
          delta={delta?.ios}
          reviews={live.iosReviews}
        />
      )}
      {live.android && (
        <RatingPill
          label="▶"
          rating={live.android}
          delta={delta?.android}
          reviews={live.androidReviews}
        />
      )}
      {live.fetchedAt && (
        <span className="text-[8px] text-fg-disabled flex items-center gap-0.5">
          <RefreshCw size={7} />
          {getTimeAgo(live.fetchedAt)}
        </span>
      )}
    </div>
  );
}

function RatingPill({ label, rating, delta, reviews }) {
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor = delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-fg-disabled';

  return (
    <span className="inline-flex items-center gap-1 text-[10px] bg-surface-2 border border-border rounded-full px-2 py-0.5">
      <span className="text-[9px] opacity-60">{label}</span>
      <span className="font-bold text-fg">{rating?.toFixed(1)}</span>
      {delta !== null && delta !== 0 && (
        <span className={`flex items-center gap-0.5 ${deltaColor}`}>
          <DeltaIcon size={8} />
          <span className="text-[8px] font-bold">{delta > 0 ? '+' : ''}{delta.toFixed(1)}</span>
        </span>
      )}
      {reviews && (
        <span className="text-[8px] text-fg-disabled">({formatReviews(reviews)})</span>
      )}
    </span>
  );
}

/**
 * Full-width live ratings card for CX tab
 */
export function LiveRatingsCard({ bankKey, staticAndroid, staticIos }) {
  const live = getLiveAppRating(bankKey);
  if (!live || (!live.android && !live.ios)) return null;

  const delta = getRatingDelta(bankKey, staticAndroid, staticIos);

  return (
    <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary/20 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw size={12} className="text-primary" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Live App Ratings</span>
        {live.fetchedAt && (
          <span className="text-[9px] text-fg-disabled ml-auto">Updated {getTimeAgo(live.fetchedAt)}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {live.ios && (
          <RatingCard
            platform="iOS App Store"
            icon=""
            rating={live.ios}
            reviews={live.iosReviews}
            staticRating={staticIos}
            delta={delta?.ios}
          />
        )}
        {live.android && (
          <RatingCard
            platform="Google Play"
            icon="▶"
            rating={live.android}
            reviews={live.androidReviews}
            staticRating={staticAndroid}
            delta={delta?.android}
          />
        )}
      </div>
    </div>
  );
}

function RatingCard({ platform, icon, rating, reviews, staticRating, delta }) {
  const deltaColor = delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-fg-muted';
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  return (
    <div className="bg-white/80 rounded-lg p-3 border border-white">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] font-bold text-fg-muted">{platform}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-fg">{rating?.toFixed(1)}</span>
        {delta !== null && delta !== 0 && (
          <span className={`flex items-center gap-0.5 ${deltaColor}`}>
            <DeltaIcon size={12} />
            <span className="text-xs font-bold">{delta > 0 ? '+' : ''}{delta.toFixed(1)}</span>
          </span>
        )}
      </div>
      {reviews && (
        <div className="text-[10px] text-fg-disabled mt-0.5">{formatReviews(reviews)} reviews</div>
      )}
      {staticRating && (
        <div className="text-[9px] text-fg-disabled mt-1">
          Static data: {staticRating} {delta ? `(${delta > 0 ? 'improved' : 'declined'})` : '(unchanged)'}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──

function formatReviews(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toLocaleString();
}

function getTimeAgo(isoStr) {
  const now = new Date();
  const then = new Date(isoStr);
  const mins = Math.floor((now - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
