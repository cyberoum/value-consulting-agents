import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, User, Target, MessageCircle, AlertTriangle } from 'lucide-react';
import { BANK_DATA, QUAL_DATA, VALUE_SELLING, CX_DATA, calcScore, scoreColor, scoreLabel } from '../../data/utils';

export default function QuickPrepModal({ bankKey, isOpen, onClose }) {
  const bd = BANK_DATA[bankKey];
  const qd = QUAL_DATA[bankKey];
  const vs = VALUE_SELLING[bankKey];
  const cx = CX_DATA[bankKey];
  const score = calcScore(bankKey);
  const q = bd?.backbase_qualification;

  // Top 3 decision makers
  const topPeople = (bd?.key_decision_makers || [])
    .filter(dm => dm.name && !dm.name.startsWith('('))
    .slice(0, 3);

  // Top 3 discovery questions
  const topQuestions = (vs?.discovery_questions || []).slice(0, 3);

  // Key talking points
  const talkingPoints = [];
  if (vs?.value_hypothesis?.one_liner) talkingPoints.push(vs.value_hypothesis.one_liner);
  if (vs?.landing_zones?.[0]) talkingPoints.push(`Lead with ${vs.landing_zones[0].zone} — ${vs.landing_zones[0].products?.join(', ')}`);
  if (cx?.weaknesses?.[0]) talkingPoints.push(`CX gap: ${cx.weaknesses[0]}`);
  if (q?.timing) talkingPoints.push(`Timing: ${q.timing}`);

  return createPortal(
    <AnimatePresence>
      {isOpen && <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border mx-2 sm:mx-0"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-primary-900 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" />
                <h3 className="font-bold">2-Minute Prep</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded hover:bg-white/20"><X size={16} /></button>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-black">{bd?.bank_name}</span>
              <span className="text-sm px-2 py-0.5 rounded-full bg-white/20 font-bold">{score}/10</span>
            </div>
            <div className="text-xs text-white/70 mt-1">{bd?.country} • {q?.deal_size || 'N/A'} • {scoreLabel(score)}</div>
          </div>

          {/* Quick Cards */}
          <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {/* Who you're meeting */}
            {topPeople.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-surface-2 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 text-primary text-xs font-bold mb-2">
                  <User size={12} /> KEY PEOPLE
                </div>
                {topPeople.map((dm, i) => (
                  <div key={i} className="text-xs text-fg mb-1">
                    <span className="font-semibold">{dm.name}</span>
                    <span className="text-fg-muted"> — {dm.role}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Your angle */}
            {talkingPoints.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-primary-50 dark:bg-primary/10 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 text-primary text-xs font-bold mb-2">
                  <Target size={12} /> YOUR ANGLE
                </div>
                {talkingPoints.map((tp, i) => (
                  <div key={i} className="text-xs text-fg mb-1.5 flex gap-2">
                    <span className="text-primary font-bold shrink-0">•</span>
                    <span>{tp}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Questions to ask */}
            {topQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-surface-2 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 text-primary text-xs font-bold mb-2">
                  <MessageCircle size={12} /> ASK THESE
                </div>
                {topQuestions.map((q, i) => (
                  <div key={i} className="text-xs text-fg mb-1.5 italic">"{q}"</div>
                ))}
              </motion.div>
            )}

            {/* Watch out */}
            {q?.risk && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-danger-subtle rounded-lg p-3"
              >
                <div className="flex items-center gap-2 text-danger text-xs font-bold mb-1">
                  <AlertTriangle size={12} /> WATCH OUT
                </div>
                <div className="text-xs text-fg">{q.risk}</div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>,
    document.body
  );
}
