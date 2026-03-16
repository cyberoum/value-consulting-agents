/**
 * UnconsideredNeeds — Blind spots and unknown strengths panel.
 *
 * Shows two types of needs from the Value Consulting framework:
 *   - Unconsidered: Bank shows no awareness, but Backbase has strong capability
 *   - Unknown Strength: Backbase has unique differentiation the bank doesn't know about
 */
import { motion } from 'framer-motion';
import { EyeOff, Lightbulb } from 'lucide-react';

export default function UnconsideredNeeds({ needs }) {
  if (!needs?.length) return null;

  const unconsidered = needs.filter(n => n.category === 'unconsidered');
  const unknownStrengths = needs.filter(n => n.category === 'unknown_strength');

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-fg flex items-center gap-2">
        <EyeOff size={14} className="text-amber-600" />
        Unconsidered Needs &amp; Unknown Strengths
      </h4>

      {/* Blind Spots */}
      {unconsidered.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            Blind Spots ({unconsidered.length})
          </div>
          {unconsidered.map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 bg-amber-50 border border-amber-200/50 rounded-lg"
            >
              <p className="text-xs font-bold text-fg mb-1">{n.need}</p>
              {n.evidence && (
                <p className="text-[11px] text-fg-muted leading-relaxed">{n.evidence}</p>
              )}
              {n.backbaseCapability && (
                <p className="text-[10px] text-primary mt-1.5">
                  <span className="font-bold">Backbase:</span> {n.backbaseCapability}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Unknown Strengths */}
      {unknownStrengths.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
            <Lightbulb size={10} />
            Unknown Strengths ({unknownStrengths.length})
          </div>
          {unknownStrengths.map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.1 }}
              className="p-3 bg-primary/5 border border-primary/10 rounded-lg"
            >
              <p className="text-xs font-bold text-fg mb-1">{n.need}</p>
              {n.backbaseCapability && (
                <p className="text-[11px] text-fg-muted leading-relaxed">{n.backbaseCapability}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
