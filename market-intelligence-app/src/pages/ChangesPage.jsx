/**
 * ChangesPage — Sprint 4.3 / 4.4
 * ──────────────────────────────
 * Portfolio-wide change feed. The intended "open Nova at 8am, see what
 * matters across my book" surface. Defaults to 7-day lookback, sorted by
 * significance, filtered to events ≥ 5/10 (consequential only).
 *
 * Reachable at /changes. The plan is for this to become a sibling of /
 * (HomePage) in the nav — possibly the new default landing — once the
 * change feed has a few more sprint cycles of usage and tuning.
 */

import ChangeFeed from '../components/common/ChangeFeed';

export default function ChangesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Portfolio Change Feed</h1>
        <p className="text-[12px] text-slate-600 mt-1">
          What changed across your accounts since you last looked. Defaults to consequential events
          (significance ≥ 5/10) over the last 7 days. Adjust filters above the feed.
        </p>
      </div>
      <ChangeFeed />
    </div>
  );
}
