import { motion } from 'framer-motion';

export default function StatBanner({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl overflow-hidden border border-border bg-surface mb-6">
      {stats.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
          className={`py-4 sm:py-5 px-3 sm:px-4 text-center
            ${i % 2 === 0 ? 'border-r border-border' : ''}
            ${i < stats.length - 2 ? 'border-b sm:border-b-0 border-border' : ''}
            ${i < stats.length - 1 ? 'sm:border-r sm:border-border' : ''}
          `}
        >
          <div className="text-xl sm:text-2xl font-black text-primary leading-none">{s.value}</div>
          <div className="text-[9px] sm:text-[10px] text-fg-muted uppercase tracking-wider mt-1">{s.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
