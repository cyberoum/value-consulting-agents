/**
 * CascadeProgressBar — 4-step horizontal progress stepper
 *
 * Shows cascade status as the "Prepare Full Meeting Intelligence" button
 * triggers Meeting Prep → Storyline + Landing Zones + Value Hypothesis.
 *
 * Each step can be: idle | running | done | error
 */
import { motion } from 'framer-motion';
import { Zap, BookOpen, Grid3X3, Lightbulb, Loader2, Check, AlertTriangle } from 'lucide-react';

const STEPS = [
  { key: 'meetingPrep', label: 'Meeting Brief', icon: Zap },
  { key: 'storyline', label: 'Storyline', icon: BookOpen },
  { key: 'landingZones', label: 'Landing Zones', icon: Grid3X3 },
  { key: 'valueHypothesis', label: 'Hypothesis', icon: Lightbulb },
];

const STATUS_STYLES = {
  idle: { bg: 'bg-gray-100', text: 'text-gray-400', border: 'border-gray-200' },
  running: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  done: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  error: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
};

function StepIcon({ status, Icon }) {
  if (status === 'running') return <Loader2 size={12} className="animate-spin" />;
  if (status === 'done') return <Check size={12} />;
  if (status === 'error') return <AlertTriangle size={12} />;
  return <Icon size={12} />;
}

export default function CascadeProgressBar({ status }) {
  if (!status) return null;

  const allIdle = Object.values(status).every(s => s === 'idle');
  const allDone = Object.values(status).every(s => s === 'done' || s === 'error');
  if (allIdle) return null;

  const doneCount = Object.values(status).filter(s => s === 'done').length;
  const totalSteps = STEPS.length;
  const progressPct = (doneCount / totalSteps) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mb-4 p-3 bg-white border border-primary/10 rounded-xl shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
          {allDone ? 'Meeting Intelligence Ready' : 'Preparing Meeting Intelligence...'}
        </span>
        <span className="text-[10px] text-fg-muted">
          {doneCount}/{totalSteps} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const s = status[step.key] || 'idle';
          const styles = STATUS_STYLES[s];

          return (
            <div key={step.key} className="flex items-center gap-1.5 flex-1">
              {i > 0 && (
                <div className={`w-4 h-px ${s === 'done' ? 'bg-emerald-300' : 'bg-gray-200'}`} />
              )}
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all ${styles.bg} ${styles.text} ${styles.border}`}
              >
                <StepIcon status={s} Icon={step.icon} />
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
