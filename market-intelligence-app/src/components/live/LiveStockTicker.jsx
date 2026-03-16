import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

/**
 * Compact stock ticker badge for bank headers.
 * Reads from bankData.live_stock (populated by pipeline → SQLite).
 */
export default function LiveStockTicker({ bankData }) {
  const stock = bankData?.live_stock;
  if (!stock || !stock.price) return null;

  const isUp = stock.dayChangePercent > 0;
  const isDown = stock.dayChangePercent < 0;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const color = isUp ? 'text-success' : isDown ? 'text-danger' : 'text-fg-muted';

  const hasChange = stock.dayChangePercent != null;

  return (
    <div className="inline-flex items-center gap-1.5 text-[10px] bg-surface-2 border border-border rounded-full px-2 py-0.5">
      <span className="font-mono font-bold text-fg-muted">{stock.ticker}</span>
      <span className="font-bold text-fg">{stock.currency} {stock.price.toFixed(2)}</span>
      {hasChange && (
        <span className={`flex items-center gap-0.5 ${color}`}>
          <Icon size={9} />
          <span className="font-bold">{isUp ? '+' : ''}{stock.dayChangePercent.toFixed(2)}%</span>
        </span>
      )}
    </div>
  );
}

/**
 * Full stock data card for the Profile tab.
 */
export function LiveStockCard({ bankData }) {
  const stock = bankData?.live_stock;
  if (!stock || !stock.price) return null;

  const isUp = stock.dayChangePercent > 0;
  const isDown = stock.dayChangePercent < 0;
  const color = isUp ? 'text-success' : isDown ? 'text-danger' : 'text-fg-muted';
  const bgColor = isUp ? 'from-success/5 to-green-50' : isDown ? 'from-danger/5 to-red-50' : 'from-surface-2 to-surface-3';
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  // 52-week range position (0-100%)
  const rangePosition = stock.fiftyTwoWeekLow && stock.fiftyTwoWeekHigh
    ? ((stock.price - stock.fiftyTwoWeekLow) / (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow)) * 100
    : null;

  return (
    <div className={`p-4 bg-gradient-to-r ${bgColor} border border-border rounded-xl`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">📈</span>
          <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider">Live Market Data</span>
        </div>
        {stock.fetchedAt && (
          <span className="text-[9px] text-fg-disabled flex items-center gap-1">
            <RefreshCw size={8} />
            {getTimeAgo(stock.fetchedAt)}
          </span>
        )}
      </div>

      {/* Price + Change */}
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono text-[10px] text-fg-disabled">{stock.ticker}</span>
        <span className="text-2xl font-black text-fg">{stock.currency} {stock.price.toFixed(2)}</span>
        {stock.dayChangePercent != null && (
          <span className={`flex items-center gap-1 ${color}`}>
            <Icon size={14} />
            <span className="text-sm font-bold">
              {isUp ? '+' : ''}{stock.dayChange?.toFixed(2)} ({isUp ? '+' : ''}{stock.dayChangePercent.toFixed(2)}%)
            </span>
          </span>
        )}
      </div>

      {/* 52-Week Range */}
      {rangePosition !== null && (
        <div className="mb-3">
          <div className="text-[9px] font-bold text-fg-disabled uppercase mb-1">52-Week Range</div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-fg-disabled font-mono">{stock.fiftyTwoWeekLow?.toFixed(2)}</span>
            <div className="flex-1 h-1.5 bg-surface-3 rounded-full relative">
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full"
                style={{ width: `${rangePosition}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white shadow-sm"
                style={{ left: `${rangePosition}%`, marginLeft: '-5px' }}
              />
            </div>
            <span className="text-fg-disabled font-mono">{stock.fiftyTwoWeekHigh?.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Fundamentals */}
      <div className="grid grid-cols-3 gap-3">
        {stock.marketCapFormatted && (
          <FundamentalItem label="Market Cap" value={stock.marketCapFormatted} />
        )}
        {stock.peRatio && (
          <FundamentalItem label="P/E Ratio" value={stock.peRatio.toFixed(1)} />
        )}
        {stock.dividendYield && (
          <FundamentalItem label="Dividend Yield" value={`${(stock.dividendYield * 100).toFixed(2)}%`} />
        )}
        {stock.exchange && (
          <FundamentalItem label="Exchange" value={stock.exchange} />
        )}
      </div>
    </div>
  );
}

function FundamentalItem({ label, value }) {
  return (
    <div>
      <div className="text-[8px] font-bold text-fg-disabled uppercase">{label}</div>
      <div className="text-xs font-bold text-fg">{value}</div>
    </div>
  );
}

function getTimeAgo(isoStr) {
  const now = new Date();
  const then = new Date(isoStr);
  const mins = Math.floor((now - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
