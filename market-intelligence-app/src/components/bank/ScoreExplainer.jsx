import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Info, Zap, Users, Pencil, X, RotateCcw } from 'lucide-react';
import { QUAL_FRAMEWORK, QUAL_DATA, scoreColor, scoreLabel } from '../../data/utils';
import useScoreOverrides, { calcScoreWithOverrides } from '../../hooks/useScoreOverrides';

export default function ScoreExplainer({ bankKey }) {
  const [open, setOpen] = useState(false);
  const [editingDim, setEditingDim] = useState(null);
  const { getOverride, setOverride, clearOverride, hasOverrides, clearAllForBank, overrides } = useScoreOverrides();

  const qd = QUAL_DATA[bankKey];
  const score = calcScoreWithOverrides(bankKey, QUAL_DATA, QUAL_FRAMEWORK, overrides);
  const originalScore = (() => {
    if (!qd) return 0;
    const fw = QUAL_FRAMEWORK.dimensions;
    let w = 0;
    Object.keys(fw).forEach(dim => { if (qd[dim]) w += qd[dim].score * fw[dim].weight; });
    if (qd.power_map?.activated) w += 1.0;
    if (qd.partner_access?.backbase_access) w += 0.5;
    return Math.round(Math.min(w, 10) * 10) / 10;
  })();

  if (!qd) return null;

  const fw = QUAL_FRAMEWORK.dimensions;
  const dimensions = [];
  let weightedTotal = 0;

  Object.entries(fw).forEach(([dim, config]) => {
    if (qd[dim]) {
      const override = getOverride(bankKey, dim);
      const rawScore = override ? override.score : qd[dim].score;
      const weighted = Math.round(rawScore * config.weight * 100) / 100;
      weightedTotal += weighted;
      dimensions.push({
        key: dim,
        label: config.label,
        desc: config.desc,
        weight: config.weight,
        rawScore,
        originalScore: qd[dim].score,
        isOverridden: !!override,
        overrideNote: override?.note,
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
  const scoreChanged = hasOverrides(bankKey);

  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <Info size={14} />
        <span>Why {score}/10?</span>
        {scoreChanged && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning font-bold">
            Edited (was {originalScore})
          </span>
        )}
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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-fg">Score Breakdown</span>
                  <span className="text-[9px] text-fg-disabled">(click scores to edit)</span>
                </div>
                <div className="flex items-center gap-2">
                  {scoreChanged && (
                    <button
                      onClick={() => clearAllForBank(bankKey)}
                      className="flex items-center gap-1 text-[9px] text-warning hover:text-danger transition-colors px-1.5 py-0.5 rounded bg-warning/5 hover:bg-danger/5"
                    >
                      <RotateCcw size={9} /> Reset All
                    </button>
                  )}
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
                    className={`px-4 py-3 transition-colors ${d.isOverridden ? 'bg-warning/5' : 'hover:bg-surface-2/50'}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-fg truncate">{d.label}</span>
                        <span className="text-[9px] text-fg-disabled shrink-0">({Math.round(d.weight * 100)}%)</span>
                        {d.isOverridden && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-warning/10 text-warning font-bold">
                            was {d.originalScore}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {editingDim === d.key ? (
                          <ScoreEditor
                            initialScore={d.rawScore}
                            onSave={(score, note) => {
                              setOverride(bankKey, d.key, score, note);
                              setEditingDim(null);
                            }}
                            onCancel={() => setEditingDim(null)}
                          />
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingDim(d.key)}
                              className="flex items-center gap-1 text-xs font-mono font-bold hover:bg-primary/5 px-1.5 py-0.5 rounded transition-colors group/score"
                              style={{ color: scoreColor(d.rawScore) }}
                              title="Click to edit score"
                            >
                              {d.rawScore}/10
                              <Pencil size={9} className="opacity-0 group-hover/score:opacity-60 transition-opacity" />
                            </button>
                            {d.isOverridden && (
                              <button
                                onClick={() => clearOverride(bankKey, d.key)}
                                className="p-0.5 text-fg-disabled hover:text-danger transition-colors"
                                title="Reset to original"
                              >
                                <X size={10} />
                              </button>
                            )}
                            <span className="text-[10px] text-fg-muted">× {d.weight}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/5 rounded text-primary">= {d.weighted.toFixed(2)}</span>
                          </>
                        )}
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
                    {d.overrideNote && (
                      <p className="text-[10px] text-warning mt-0.5 italic">Override note: {d.overrideNote}</p>
                    )}
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

function ScoreEditor({ initialScore, onSave, onCancel }) {
  const [score, setScore] = useState(initialScore);
  const [note, setNote] = useState('');

  return (
    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={score}
        onChange={e => setScore(Number(e.target.value))}
        className="w-16 h-1.5 accent-primary"
      />
      <span className="text-xs font-mono font-bold w-6 text-center" style={{ color: scoreColor(score) }}>{score}</span>
      <input
        type="text"
        placeholder="Note..."
        value={note}
        onChange={e => setNote(e.target.value)}
        className="text-[10px] border border-border rounded px-1.5 py-0.5 w-24 bg-surface text-fg focus:border-primary outline-none"
        onKeyDown={e => { if (e.key === 'Enter') onSave(score, note); if (e.key === 'Escape') onCancel(); }}
        autoFocus
      />
      <button onClick={() => onSave(score, note)} className="text-[9px] font-bold text-primary hover:text-primary/80 px-1">Save</button>
      <button onClick={onCancel} className="text-[9px] text-fg-disabled hover:text-fg px-1">Cancel</button>
    </div>
  );
}
