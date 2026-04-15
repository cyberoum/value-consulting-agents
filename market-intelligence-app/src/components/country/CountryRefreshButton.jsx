import { useState } from 'react';
import { Sparkles, Loader, Clock, AlertCircle } from 'lucide-react';
import { refreshCountryIntelligence } from '../../data/api';

function timeAgo(isoStr) {
  if (!isoStr) return null;
  const diff = Date.now() - new Date(isoStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CountryRefreshButton({ countryName, data, onRefreshed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  // Determine freshness from any section's last_refreshed
  const lastRefreshed = data?.fintech_landscape?.last_refreshed
    || data?.regulatory_environment?.last_refreshed
    || data?.market_news?.last_refreshed
    || data?.customer_needs?.last_refreshed;

  const hasData = !!(data?.fintech_landscape || data?.regulatory_environment || data?.market_news || data?.customer_needs);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    setProgress('Analyzing market intelligence...');
    try {
      await refreshCountryIntelligence(countryName, {
        sections: ['fintech_landscape', 'regulatory_environment', 'market_news', 'customer_needs'],
      });
      setProgress('');
      onRefreshed?.();
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('503') || msg.includes('API_KEY') || msg.includes('not configured')) {
        setError('API key not configured. Set ANTHROPIC_API_KEY in .env.');
      } else {
        setError(`Refresh failed: ${msg || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Last refreshed indicator */}
      {hasData && lastRefreshed && !loading && (
        <span className="inline-flex items-center gap-1 text-[9px] text-[var(--text-muted)]">
          <Clock size={10} />
          {timeAgo(lastRefreshed)}
        </span>
      )}

      {/* Loading state */}
      {loading && (
        <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--nova-core)] font-bold">
          <Loader size={12} className="animate-spin" />
          {progress}
        </span>
      )}

      {/* Error */}
      {error && !loading && (
        <span className="inline-flex items-center gap-1 text-[9px] text-[var(--nova-cooling)]">
          <AlertCircle size={10} />
          {error}
        </span>
      )}

      {/* Button */}
      <button
        onClick={handleRefresh}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
          hasData
            ? 'text-[var(--nova-core)] bg-[var(--nova-core-light)] hover:bg-[var(--nova-core)] hover:text-white disabled:opacity-50'
            : 'text-white bg-[var(--nova-core)] hover:opacity-90 disabled:opacity-50'
        }`}
      >
        {loading ? <Loader size={11} className="animate-spin" /> : <Sparkles size={11} />}
        {hasData ? 'Refresh' : 'Enrich with AI'}
      </button>
    </div>
  );
}
