import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ChevronRight, CheckCircle } from 'lucide-react';
import { getNextBestActions } from '../../data/nextBestAction';

export default function NextBestActionPanel({ bankKey }) {
  const actions = useMemo(() => getNextBestActions(bankKey), [bankKey]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`mi-nba-dismissed-${bankKey}`)) || [];
    } catch { return []; }
  });

  const dismiss = (title) => {
    const next = [...dismissed, title];
    setDismissed(next);
    localStorage.setItem(`mi-nba-dismissed-${bankKey}`, JSON.stringify(next));
  };

  const visibleActions = actions.filter(a => !dismissed.includes(a.title));

  if (visibleActions.length === 0) {
    return (
      <div className="text-center py-8">
        <Lightbulb size={32} className="mx-auto text-fg-disabled mb-2" />
        <p className="text-sm text-fg-muted">No pending actions</p>
        {dismissed.length > 0 && (
          <button
            onClick={() => { setDismissed([]); localStorage.removeItem(`mi-nba-dismissed-${bankKey}`); }}
            className="text-xs text-primary hover:underline mt-2"
          >
            Show {dismissed.length} dismissed
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={16} className="text-primary" />
        <h3 className="text-sm font-bold text-fg">Next Best Actions</h3>
        <span className="text-[9px] text-fg-disabled">{visibleActions.length} recommendations</span>
      </div>

      <div className="space-y-2">
        {visibleActions.map((action, i) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="group p-3 bg-surface border border-border rounded-xl hover:border-primary/20 transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Type icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                style={{ backgroundColor: action.type.color + '15' }}
              >
                {action.type.icon}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                    style={{ color: action.urgency.color, backgroundColor: action.urgency.bg }}
                  >
                    {action.urgency.label}
                  </span>
                  <span className="text-[8px] font-bold text-fg-disabled uppercase">{action.type.label}</span>
                </div>

                {/* Title */}
                <p className="text-xs font-bold text-fg leading-snug mb-1">{action.title}</p>

                {/* Detail */}
                <p className="text-[10px] text-fg-muted leading-relaxed">{action.detail}</p>

                {/* Evidence */}
                <div className="flex items-center gap-1 mt-1.5 text-[9px] text-fg-disabled">
                  <ChevronRight size={8} />
                  <span>Based on: {action.evidence}</span>
                </div>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => dismiss(action.title)}
                className="p-1 rounded text-fg-disabled hover:text-success opacity-0 group-hover:opacity-100 transition-all shrink-0"
                title="Mark as done"
              >
                <CheckCircle size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {dismissed.length > 0 && (
        <div className="mt-3 text-center">
          <button
            onClick={() => { setDismissed([]); localStorage.removeItem(`mi-nba-dismissed-${bankKey}`); }}
            className="text-[10px] text-fg-disabled hover:text-primary transition-colors"
          >
            Show {dismissed.length} completed action{dismissed.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
