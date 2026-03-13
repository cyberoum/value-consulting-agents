import { Newspaper, ExternalLink, Zap, RefreshCw } from 'lucide-react';

const SIGNAL_LABELS = {
  transformation: { label: 'Digital Transform', color: '#3366FF' },
  leadership: { label: 'Leadership', color: '#7C4DFF' },
  investment: { label: 'Investment', color: '#2E7D32' },
  partnership: { label: 'Partnership', color: '#00838F' },
  competition: { label: 'Competition', color: '#E65100' },
  acquisition: { label: 'M&A', color: '#C62828' },
  regulation: { label: 'Regulation', color: '#6A1B9A' },
  product: { label: 'Product Launch', color: '#1565C0' },
  financial: { label: 'Financials', color: '#33691E' },
  cloud: { label: 'Cloud/Tech', color: '#00695C' },
};

/**
 * Live news feed for a bank's profile page.
 * Shows recent articles with signal tags and relevance scores.
 */
export default function LiveNewsFeed({ bankData }) {
  const news = bankData?.live_news;
  if (!news || news.articleCount === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-primary" />
          <span className="text-xs font-bold text-primary">Live News Feed</span>
          <span className="text-[9px] bg-primary-50 text-primary font-bold px-1.5 py-0.5 rounded-full">
            {news.articleCount} articles
          </span>
        </div>
        {news.fetchedAt && (
          <span className="text-[9px] text-fg-disabled flex items-center gap-1">
            <RefreshCw size={8} />
            {getTimeAgo(news.fetchedAt)}
          </span>
        )}
      </div>

      {/* Signal summary */}
      {news.topSignals.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {news.topSignals.map(signal => {
            const s = SIGNAL_LABELS[signal];
            return s ? (
              <span
                key={signal}
                className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                style={{ color: s.color, borderColor: s.color + '40', backgroundColor: s.color + '10' }}
              >
                <Zap size={7} className="inline mr-0.5" />
                {s.label}
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* Articles */}
      <div className="space-y-2">
        {news.articles.slice(0, 6).map((article, i) => (
          <NewsArticleCard key={i} article={article} />
        ))}
      </div>
    </div>
  );
}

function NewsArticleCard({ article }) {
  const hasSignals = article.signals?.length > 0;

  return (
    <div className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
      hasSignals ? 'bg-primary-50/50 border-primary/10' : 'bg-surface-2 border-border'
    }`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-fg hover:text-primary transition-colors line-clamp-2 leading-snug"
          >
            {article.title}
            <ExternalLink size={9} className="inline ml-1 opacity-40" />
          </a>
          <div className="flex items-center gap-2 mt-1.5">
            {article.source && (
              <span className="text-[9px] text-fg-disabled">{article.source}</span>
            )}
            {article.publishedAt && (
              <span className="text-[9px] text-fg-disabled">{getTimeAgo(article.publishedAt)}</span>
            )}
            {article.relevanceScore > 0 && (
              <span className="text-[9px] font-bold text-primary">
                {'⚡'.repeat(Math.min(article.relevanceScore, 3))}
              </span>
            )}
          </div>
          {/* Signal tags */}
          {hasSignals && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {article.signals.map(signal => {
                const s = SIGNAL_LABELS[signal];
                return s ? (
                  <span
                    key={signal}
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                    style={{ color: s.color, backgroundColor: s.color + '15' }}
                  >
                    {s.label}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact news badge for bank card headers
 */
export function NewsSignalBadge({ bankData }) {
  const news = bankData?.live_news;
  if (!news || news.signalCount === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-primary-50 text-primary rounded-full">
      <Zap size={8} />
      {news.signalCount} signals
    </span>
  );
}

// ── Helpers ──

function getTimeAgo(isoStr) {
  const now = new Date();
  const then = new Date(isoStr);
  const mins = Math.floor((now - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
