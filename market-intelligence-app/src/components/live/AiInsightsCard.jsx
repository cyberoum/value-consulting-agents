import { getAiAnalysis, getAiSignals, getAiSuggestedActions } from '../../data/liveDataProvider';
import { Cpu, Zap, Target, ArrowRight, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const URGENCY_CONFIG = {
  high: { color: 'text-danger', bg: 'bg-danger-subtle', border: 'border-danger/20', icon: AlertTriangle, label: 'High Urgency' },
  medium: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Info, label: 'Medium' },
  low: { color: 'text-success', bg: 'bg-success-subtle', border: 'border-success/20', icon: CheckCircle, label: 'Low' },
};

const SIGNAL_TYPE_LABELS = {
  transformation: { label: 'Digital Transform', color: '#3366FF' },
  leadership: { label: 'Leadership', color: '#7C4DFF' },
  investment: { label: 'Investment', color: '#2E7D32' },
  partnership: { label: 'Partnership', color: '#00838F' },
  competition: { label: 'Competition', color: '#E65100' },
  regulation: { label: 'Regulation', color: '#6A1B9A' },
  product: { label: 'Product Launch', color: '#1565C0' },
  financial: { label: 'Financials', color: '#33691E' },
};

/**
 * AI Insights Card — shows Claude's analysis of a bank's news
 * Renders signals, relevance assessment, and suggested actions
 */
export default function AiInsightsCard({ bankKey }) {
  const analysis = getAiAnalysis(bankKey);
  if (!analysis || analysis.error) return null;

  const signals = analysis.signals || [];
  const actions = analysis.suggestedActions || [];
  const relevance = analysis.backbaseRelevance || 'medium';

  const relevanceConfig = {
    high: { bg: 'from-violet-50 to-purple-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
    medium: { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
    low: { bg: 'from-slate-50 to-gray-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600' },
  };

  const rc = relevanceConfig[relevance] || relevanceConfig.medium;

  return (
    <div className={`p-4 bg-gradient-to-r ${rc.bg} border ${rc.border} rounded-xl`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-violet-600" />
          <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">AI Intelligence Analysis</span>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${rc.badge}`}>
          {relevance.toUpperCase()} RELEVANCE
        </span>
      </div>

      {/* Summary */}
      {analysis.summary && (
        <p className="text-xs text-fg-muted mb-3 leading-relaxed">{analysis.summary}</p>
      )}

      {/* Relevance Reason */}
      {analysis.relevanceReason && (
        <div className="text-[10px] text-fg-disabled mb-3 italic">
          💡 {analysis.relevanceReason}
        </div>
      )}

      {/* Signals */}
      {signals.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="text-[9px] font-bold text-fg-disabled uppercase tracking-wider">Detected Signals</div>
          {signals.map((signal, i) => {
            const urgency = URGENCY_CONFIG[signal.urgency] || URGENCY_CONFIG.low;
            const typeConfig = SIGNAL_TYPE_LABELS[signal.type] || { label: signal.type, color: '#666' };
            const UrgencyIcon = urgency.icon;

            return (
              <div key={i} className={`p-2.5 rounded-lg border ${urgency.bg} ${urgency.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                    style={{ color: typeConfig.color, backgroundColor: typeConfig.color + '15' }}
                  >
                    {typeConfig.label}
                  </span>
                  <span className={`flex items-center gap-0.5 text-[8px] font-bold ${urgency.color}`}>
                    <UrgencyIcon size={8} />
                    {urgency.label}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-fg leading-snug">{signal.signal}</p>
                {signal.implication && (
                  <p className="text-[10px] text-fg-muted mt-1 leading-snug">
                    <ArrowRight size={8} className="inline mr-0.5" />
                    {signal.implication}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Suggested Actions */}
      {actions.length > 0 && (
        <div>
          <div className="text-[9px] font-bold text-fg-disabled uppercase tracking-wider mb-1.5">Suggested Actions</div>
          <div className="space-y-1">
            {actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px] text-fg-muted">
                <Target size={10} className="text-violet-500 mt-0.5 shrink-0" />
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {analysis.analyzedAt && (
        <div className="text-[8px] text-fg-disabled mt-3 text-right">
          🤖 Analyzed by Claude · {new Date(analysis.analyzedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}

/**
 * Compact AI signal badge for bank card headers
 */
export function AiSignalBadge({ bankKey }) {
  const analysis = getAiAnalysis(bankKey);
  if (!analysis || analysis.error) return null;

  const relevance = analysis.backbaseRelevance;
  const signalCount = analysis.signals?.length || 0;
  if (signalCount === 0) return null;

  const colors = {
    high: 'bg-violet-100 text-violet-700 border-violet-200',
    medium: 'bg-blue-50 text-blue-600 border-blue-200',
    low: 'bg-slate-50 text-slate-500 border-slate-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${colors[relevance] || colors.medium}`}>
      <Cpu size={8} />
      {signalCount} AI signals
    </span>
  );
}
