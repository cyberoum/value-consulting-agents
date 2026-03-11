import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Info, Zap, Users } from 'lucide-react';
import { QUAL_FRAMEWORK, QUAL_DATA, calcScore, scoreColor, scoreLabel } from '../../data/utils';

export default function ScoreExplainer({ bankKey }) {
  const [open, setOpen] = useState(false);
  const qd = QUAL_DATA[bankKey];
  const score = calcScore(bankKey);

  if (!qd) return null;

  const fw = QUAL_FRAMEWORK.dimensions;
  const dimensions = [];
  let weightedTotal = 0;

  Object.entries(fw).forEach(([dim, config]) => {
    if (qd[dim]) {
      const weighted = Math.round(qd[dim].score * config.weight * 100) / 100;
      weightedTotal += weighted;
      dimensions.push({
        key: dim,
        label: config.label,
        desc: config.desc,
        weight: config.weight,
        rawScore: qd[dim].score,
        weighted,
        note: qd[dim].note,
      });
    }
  });

  // Bonuses
  const bonuses = [];
  if (qd.power_map?.activated) {
    bonuses.push({ label: 'Power Map Activated', value: 1.0, icon: Users, note: 'Known contacts with access to decision makers' });
  }
  if (qd.partner_access?.backbase_access) {
    bonuses.push({ label: 'Partner Access', value: 0.5, icon: Zap, note: 'Backbase has existing partner relationship' });
  }

  const totalBeforeCap = weightedTotal + bonuses.reduce((s, b) => s + b.value, 0);

  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <Info size={14} />
        <span>Why {score}/10?</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={12} className="text-primary/60" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-3 bg-surface border border-border rounded-xl overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 bg-surface-2 border-b border-border flex items-center justify-between">
                <div className="text-xs font-bold text-fg">Score Breakdown</div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-fg-muted">Weighted Total</span>
                  <span className="text-lg font-black" style={{ color: scoreColor(score) }}>{score}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ color: scoreColor(score), background: score >= 8 ? '#EBF0FF' : score >= 6 ? '#F0F4FA' : score >= 4 ? '#FFF8E1' : '#FFF0EE' }}>
                    {scoreLabel(score)}
                  </span>
                </div>
              </div>

              {/* Dimension rows */}
              <div className="divide-y divide-border">
                {dimensions.map((d, i) => (
                  <motion.div
                    key={d.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.25 }}
                    className="px-4 py-3 hover:bg-surface-2/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-fg truncate">{d.label}</span>
                        <span className="text-[9px] text-fg-disabled shrink-0">({Math.round(d.weight * 100)}%)</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-bold" style={{ color: scoreColor(d.rawScore) }}>{d.rawScore}/10</span>
                        <span className="text-[10px] text-fg-muted">× {d.weight}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/5 rounded text-primary">= {d.weighted.toFixed(2)}</span>
                      </div>
                    </div>
                    {/* Score bar */}
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden mb-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.rawScore * 10}%` }}
                        transition={{ delay: 0.1 + 0.05 * i, duration: 0.5, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: scoreColor(d.rawScore) }}
                      />
                    </div>
                    {/* Note */}
                    <p className="text-[10px] text-fg-muted leading-relaxed">{d.note}</p>
                  </motion.div>
                ))}
              </div>

              {/* Bonuses */}
              {bonuses.length > 0 && (
                <div className="border-t border-border bg-success-subtle/30">
                  <div className="px-4 py-2 text-[10px] font-bold text-success uppercase tracking-wider">Bonuses</div>
                  {bonuses.map((b, i) => (
                    <div key={i} className="px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <b.icon size={12} className="text-success" />
                        <span className="text-xs text-fg">{b.label}</span>
                        <span className="text-[10px] text-fg-muted">— {b.note}</span>
                      </div>
                      <span className="text-xs font-bold text-success">+{b.value.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total row */}
              <div className="px-4 py-3 bg-surface-2 border-t border-border flex items-center justify-between">
                <div className="text-xs text-fg-muted">
                  Weighted sum: {weightedTotal.toFixed(2)}
                  {bonuses.length > 0 && <> + {bonuses.reduce((s, b) => s + b.value, 0).toFixed(1)} bonus</>}
                  {totalBeforeCap > 10 && <span className="text-warning"> (capped at 10)</span>}
                </div>
                <div className="text-sm font-black" style={{ color: scoreColor(score) }}>{score}/10</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
