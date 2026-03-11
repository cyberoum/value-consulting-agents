import { useState } from 'react';
import { Check, X, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { INTEL_CATEGORIES, CONFIDENCE_LEVELS, approveIntel, dismissIntel, deleteIntel } from '../../data/userIntel';

export default function IntelFeed({ entries, onUpdate }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="text-3xl mb-2">📭</div>
        <p className="text-sm text-fg-muted">No intelligence captured yet</p>
        <p className="text-[10px] text-fg-disabled mt-1">Use the "Add Intel" button to start contributing</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(entry => (
        <IntelEntry key={entry.id} entry={entry} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

function IntelEntry({ entry, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const cat = INTEL_CATEGORIES[entry.category];
  const conf = CONFIDENCE_LEVELS[entry.confidence];

  const handleApprove = (e) => {
    e.stopPropagation();
    approveIntel(entry.id);
    onUpdate?.();
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    dismissIntel(entry.id);
    onUpdate?.();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteIntel(entry.id);
    onUpdate?.();
  };

  const statusStyles = {
    pending: 'border-l-warning bg-warning/5',
    approved: 'border-l-success bg-success-subtle',
    dismissed: 'border-l-fg-disabled bg-surface-2 opacity-60',
  };

  const timeAgo = getTimeAgo(entry.createdAt);

  return (
    <div
      className={`border-l-3 rounded-r-lg border border-border p-3 cursor-pointer hover:shadow-sm transition-all ${statusStyles[entry.status]}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        <span className="text-sm shrink-0 mt-0.5">{cat?.icon || '📋'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold" style={{ color: cat?.color }}>{cat?.label}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: conf?.bg, color: conf?.color }}>
              {conf?.label}
            </span>
            {entry.status === 'approved' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-success-subtle text-success">✓ Approved</span>
            )}
            {entry.status === 'dismissed' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-surface-3 text-fg-disabled">Dismissed</span>
            )}
            {entry.status === 'pending' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-warning/10 text-warning">Pending Review</span>
            )}
          </div>
          <p className="text-[11px] text-fg-muted mt-1 line-clamp-2">{entry.content}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[9px] text-fg-disabled flex items-center gap-1">
              <Clock size={8} /> {timeAgo}
            </span>
            {entry.source && (
              <span className="text-[9px] text-fg-disabled">📎 {entry.source}</span>
            )}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          {entry.status === 'pending' && (
            <>
              <button onClick={handleApprove} className="p-1 rounded hover:bg-success-subtle text-fg-disabled hover:text-success transition-colors" title="Approve">
                <Check size={14} />
              </button>
              <button onClick={handleDismiss} className="p-1 rounded hover:bg-danger-subtle text-fg-disabled hover:text-danger transition-colors" title="Dismiss">
                <X size={14} />
              </button>
            </>
          )}
          <button onClick={handleDelete} className="p-1 rounded hover:bg-danger-subtle text-fg-disabled hover:text-danger transition-colors" title="Delete">
            <Trash2 size={12} />
          </button>
          {expanded ? <ChevronUp size={12} className="text-fg-disabled" /> : <ChevronDown size={12} className="text-fg-disabled" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && entry.structured && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-[9px] font-bold text-fg-disabled uppercase mb-2">Structured Analysis</div>
          <StructuredPreview category={entry.category} structured={entry.structured} />
        </div>
      )}
    </div>
  );
}

function StructuredPreview({ category, structured }) {
  if (!structured) return null;

  // Show key fields based on category
  const fields = getPreviewFields(category, structured);

  return (
    <div className="space-y-1">
      {fields.map(({ label, value, color }, i) => (
        <div key={i} className="flex gap-2 text-[10px]">
          <span className="text-fg-disabled font-bold min-w-[80px]">{label}:</span>
          <span className="text-fg-muted" style={color ? { color } : {}}>{value}</span>
        </div>
      ))}
      {/* Meeting note extracted insights */}
      {category === 'meeting_note' && structured.extractedInsights?.length > 0 && (
        <div className="mt-2">
          <span className="text-[9px] font-bold text-primary">
            ✨ {structured.extractedInsights.length} insights extracted
          </span>
        </div>
      )}
    </div>
  );
}

function getPreviewFields(category, data) {
  switch (category) {
    case 'signal':
      return [
        { label: 'Signal', value: data.signal },
        { label: 'Implication', value: data.implication },
        { label: 'Urgency', value: data.urgency, color: data.urgency === 'high' ? '#C62828' : data.urgency === 'medium' ? '#F57F17' : '#666' },
      ];
    case 'pain_point':
      return [
        { label: 'Title', value: data.title },
        { label: 'Severity', value: data.severity },
        { label: 'BB Relevance', value: data.backbaseRelevance },
      ];
    case 'leadership':
      return [
        { label: 'Person', value: data.name },
        { label: 'Role', value: data.role },
        { label: 'Change', value: data.changeType },
        { label: 'Power Map', value: data.powerMapImpact },
      ];
    case 'competition':
      return [
        { label: 'Vendors', value: data.vendorsMentioned?.join(', ') || 'None detected' },
        { label: 'Risk', value: data.riskLevel },
        ...(data.isWin ? [{ label: 'Status', value: 'Vendor Win', color: '#2E7D32' }] : []),
        ...(data.isLoss ? [{ label: 'Status', value: 'Vendor Loss', color: '#C62828' }] : []),
        ...(data.isThreat ? [{ label: 'Status', value: 'Active Evaluation', color: '#F57F17' }] : []),
      ];
    case 'strategy':
      return [
        { label: 'Themes', value: data.themes?.join(', ') || 'None detected' },
        { label: 'Timeframe', value: data.timeframe || 'Not specified' },
        ...(data.investmentSignal ? [{ label: 'Signal', value: '💰 Investment', color: '#2E7D32' }] : []),
      ];
    case 'qualification':
      return [
        { label: 'Dimension', value: data.dimension?.replace(/_/g, ' ') },
        { label: 'Direction', value: data.scoreDirection === 'up' ? '↑ Positive' : data.scoreDirection === 'down' ? '↓ Negative' : '— Neutral' },
        { label: 'Score Impact', value: data.scoreSuggestion },
      ];
    default:
      return [{ label: 'Summary', value: data.summary || JSON.stringify(data).substring(0, 100) }];
  }
}

function getTimeAgo(isoStr) {
  const now = new Date();
  const then = new Date(isoStr);
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
