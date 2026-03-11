import { motion } from 'framer-motion';

export default function PipelineChart({ stages }) {
  if (!stages?.length) return null;

  const maxValue = Math.max(...stages.map(s => s.value || s.count || 1));

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const pct = ((stage.value || stage.count || 0) / maxValue) * 100;
        return (
          <div key={stage.label} className="flex items-center gap-3">
            <div className="w-28 text-xs font-semibold text-fg-subtle text-right shrink-0">
              {stage.label}
            </div>
            <div className="flex-1 relative">
              <div className="h-8 bg-surface-3 rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="h-full rounded-lg flex items-center justify-end px-2"
                  style={{
                    backgroundColor: stage.color || `hsl(${220 - i * 30}, 70%, ${50 + i * 5}%)`,
                  }}
                >
                  <span className="text-[10px] font-bold text-white drop-shadow-sm">
                    {stage.displayValue || stage.value || stage.count}
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
