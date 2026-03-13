import { RefreshCw, CheckCircle, XCircle, Clock, Zap, BarChart3, Newspaper, TrendingUp, Cpu } from 'lucide-react';

/**
 * Pipeline status dashboard for the Analytics page.
 * Shows when each fetcher last ran, success rates, and data coverage.
 * Now reads from ingestionLog prop (from API) instead of liveData.json.
 */
export default function PipelineStatus({ ingestionLog = [] }) {
  // Derive pipeline status from ingestion log
  const pipelineRuns = ingestionLog.filter(l => l.source === 'pipeline' && l.action === 'complete');
  const lastRun = pipelineRuns.length > 0 ? pipelineRuns[0] : null;
  const isPopulated = !!lastRun;

  // Build summary from log entries
  const summary = { withRatings: 0, withNews: 0, withStocks: 0, withAiAnalysis: 0, totalBanks: 0, totalSignals: 0, totalArticles: 0 };
  if (lastRun?.details) {
    const stats = lastRun.details.stats || {};
    summary.withStocks = stats.stocks?.written || 0;
    summary.withNews = stats.news?.written || 0;
    summary.withRatings = stats.ratings?.written || 0;
    summary.withAiAnalysis = stats.analysis?.written || 0;
    summary.totalBanks = Math.max(
      stats.stocks?.processed || 0,
      stats.news?.processed || 0,
      stats.ratings?.processed || 0,
    );
  }

  if (!isPopulated) {
    return (
      <div className="p-6 bg-surface-2 border border-dashed border-border rounded-xl text-center">
        <RefreshCw size={24} className="text-fg-disabled mx-auto mb-2" />
        <p className="text-sm font-bold text-fg-muted">Data Pipeline Not Yet Run</p>
        <p className="text-[11px] text-fg-disabled mt-1 max-w-sm mx-auto">
          Run <code className="bg-surface-3 px-1.5 py-0.5 rounded text-[10px] font-mono">npm run refresh</code> to
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

  // Build signal heatmap from update entries in current run
  const heatmap = {};
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
          Last run: {lastRun?.created_at ? new Date(lastRun.created_at).toLocaleString() : 'Never'}
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

      {/* Last run stats */}
      {lastRun?.details?.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {Object.entries(lastRun.details.stats).map(([name, s]) => (
            <div key={name} className={`p-3 rounded-lg border ${s.errors > 0 ? 'bg-danger-subtle border-danger/20' : 'bg-success-subtle border-success/20'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle size={12} className={s.errors > 0 ? 'text-danger' : 'text-success'} />
                <span className="text-[10px] font-bold text-fg capitalize">{name}</span>
              </div>
              <div className="text-[9px] text-fg-muted space-y-0.5">
                <div>{s.written} written</div>
                <div>{s.skipped} skipped</div>
                {s.errors > 0 && <div className="text-danger">{s.errors} errors</div>}
              </div>
            </div>
          ))}
        </div>
      )}

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

