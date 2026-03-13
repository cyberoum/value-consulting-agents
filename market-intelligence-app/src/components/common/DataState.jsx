import { AlertTriangle, RefreshCw } from 'lucide-react';

export function LoadingState({ message = 'Loading data...' }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
      <span className="text-fg-muted text-sm">{message}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="text-center py-20">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
        <AlertTriangle className="text-red-500" size={20} />
      </div>
      <p className="text-sm font-bold text-fg mb-1">Failed to load data</p>
      <p className="text-xs text-fg-muted mb-3">{error?.message || 'Unknown error'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors"
        >
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  );
}
