import { getPipelineStatus, getPipelineSummary, getSignalHeatmap } from '../../data/liveDataProvider';
import { RefreshCw, CheckCircle, XCircle, Clock, Zap, BarChart3, Newspaper, TrendingUp, Cpu } from 'lucide-react';

/**
 * Pipeline status dashboard for the Analytics page.
 * Shows when each fetcher last ran, success rates, and data coverage.
 */
export default function PipelineStatus() {
  const status = getPipelineStatus();
  const summary = getPipelineSummary();
  const heatmap = getSignalHeatmap();

  if (!status.isPopulated) {
    return (
      <div className="p-6 bg-surface-2 border border-dashed border-border rounded-xl text-center">
        <RefreshCw size={24} className="text-fg-disabled mx-auto mb-2" />
        <p className="text-sm font-bold text-fg-muted">Data Pipeline Not Yet Run</p>
        <p className="text-[11px] text-fg-disabled mt-1 max-w-sm mx-auto">
          Run <code className="bg-surface-3 px-1.5 py-0.5 rounded text-[10px] font-mono">npm run pipeline</code> to
          fetch live app ratings, news signals, and stock data for all banks.
        </p>
        <div className="mt-3 flex justify-center gap-2 text-[9px] text-fg-disabled">
          <span>--ratings</span>
          <span>--news</span>
          <span>--stocks</span>
          <span>--dry-run</span>
        </div>
      </div>
    );
  }

  const signalEntries = Object.entries(heatmap).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-fg">Live Data Pipeline</h3>
        </div>
        <span className="text-[9px] text-fg-disabled">
          Last run: {status.lastRun ? new Date(status.lastRun).toLocaleString() : 'Never'}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <SummaryCard
          icon={<BarChart3 size={14} />}
          label="App Ratings"
          value={summary.withRatings}
          total={summary.totalBanks}
          color="#3366FF"
        />
        <SummaryCard
          icon={<Newspaper size={14} />}
          label="News Coverage"
          value={summary.withNews}
          total={summary.totalBanks}
          color="#7C4DFF"
        />
        <SummaryCard
          icon={<TrendingUp size={14} />}
          label="Stock Data"
          value={summary.withStocks}
          total={summary.totalBanks}
          color="#2E7D32"
        />
        <SummaryCard
          icon={<Zap size={14} />}
          label="Total Signals"
          value={summary.totalSignals}
          total={summary.totalArticles}
          suffix="articles"
          color="#E65100"
        />
        <SummaryCard
          icon={<Cpu size={14} />}
          label="AI Analysis"
          value={summary.withAiAnalysis || 0}
          total={summary.totalBanks}
          color="#7C3AED"
        />
      </div>

      {/* Fetcher status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {Object.entries(status.fetchers).map(([name, f]) => (
          <FetcherCard key={name} name={name} fetcher={f} />
        ))}
      </div>

      {/* Signal heatmap */}
      {signalEntries.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-2">Signal Heatmap</div>
          <div className="flex flex-wrap gap-1.5">
            {signalEntries.map(([signal, banks]) => (
              <span
                key={signal}
                className="text-[9px] font-bold px-2 py-1 rounded-lg bg-surface-2 border border-border"
                title={`${banks.length} banks: ${banks.join(', ')}`}
              >
                <Zap size={8} className="inline mr-0.5 text-primary" />
                {signal} <span className="text-fg-disabled ml-0.5">({banks.length})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, total, suffix, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="p-3 bg-surface-2 border border-border rounded-lg">
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-black text-fg">{value}</div>
      <div className="text-[9px] text-fg-disabled">
        {suffix ? `from ${total} ${suffix}` : `of ${total} banks (${pct}%)`}
      </div>
    </div>
  );
}

function FetcherCard({ name, fetcher }) {
  const isSuccess = fetcher.status === 'success';
  const StatusIcon = isSuccess ? CheckCircle : XCircle;

  const nameLabels = {
    appRatings: 'App Ratings',
    newsSignals: 'News Signals',
    stockData: 'Stock Data',
    aiAnalysis: '🤖 AI Analysis',
  };

  return (
    <div className={`p-3 rounded-lg border ${isSuccess ? 'bg-success-subtle border-success/20' : 'bg-danger-subtle border-danger/20'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <StatusIcon size={12} className={isSuccess ? 'text-success' : 'text-danger'} />
        <span className="text-[10px] font-bold text-fg">{nameLabels[name] || name}</span>
      </div>
      {isSuccess ? (
        <div className="text-[9px] text-fg-muted space-y-0.5">
          <div>{fetcher.banksProcessed} banks processed</div>
          <div>{fetcher.banksWithData || fetcher.banksWithSignals || 0} with data</div>
          <div className="flex items-center gap-1 text-fg-disabled">
            <Clock size={7} />
            {(fetcher.durationMs / 1000).toFixed(1)}s
          </div>
        </div>
      ) : (
        <div className="text-[9px] text-danger">{fetcher.error}</div>
      )}
    </div>
  );
}
