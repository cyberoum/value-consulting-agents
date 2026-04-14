import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { SIGNAL_CATALOGUE, SIGNAL_SEVERITY } from '../../data/intelligenceLayer';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}M AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  return `${days}D AGO`;
}

const SEVERITY_COLORS = {
  info: { dot: 'bg-gray-400', border: 'border-l-gray-300' },
  attention: { dot: 'bg-amber-500', border: 'border-l-amber-400' },
  urgent: { dot: 'bg-red-500', border: 'border-l-red-500' },
};

export default function SignalCard({ signal, onAcknowledge }) {
  const sev = SEVERITY_COLORS[signal.severity] || SEVERITY_COLORS.info;
  const cat = SIGNAL_CATALOGUE[signal.signal_category];
  const isAcked = !!signal.acknowledged_at;

  return (
    <div className={`bg-white rounded-[var(--il-radius)] border-l-[3px] ${sev.border} p-3 shadow-[var(--color-il-card-shadow)] hover:shadow-[var(--color-il-card-shadow-hover)] transition-shadow ${isAcked ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-2.5">
        <div className={`w-2 h-2 rounded-full ${sev.dot} mt-1.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-bold text-[var(--color-il-info)] uppercase tracking-wider">{timeAgo(signal.detected_at)}</span>
            {cat && <span className="text-[9px]">{cat.icon}</span>}
            {signal.severity === 'urgent' && <AlertTriangle size={10} className="text-red-500" />}
          </div>
          <div className="text-xs font-bold text-slate-900 leading-snug">{signal.title}</div>
          {signal.description && <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{signal.description}</div>}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9px] font-semibold text-[var(--color-il-accent)]">{signal.signal_event?.replace(/([A-Z])/g, ' $1').trim()}</span>
            {!isAcked && onAcknowledge && (
              <button onClick={() => onAcknowledge(signal.id)}
                className="text-[9px] font-bold text-slate-400 hover:text-[var(--color-il-accent)] transition-colors">
                Acknowledge
              </button>
            )}
            {isAcked && <CheckCircle size={10} className="text-emerald-400" />}
          </div>
        </div>
      </div>
    </div>
  );
}
