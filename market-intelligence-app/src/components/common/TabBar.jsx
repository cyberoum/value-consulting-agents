import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TabBar({ tabs, defaultTab = 0, id = 'tab-indicator' }) {
  const [active, setActive] = useState(defaultTab);

  return (
    <div>
      <div className="flex gap-0.5 mb-5 bg-surface-3 rounded-lg p-1 border border-border overflow-x-auto relative scrollbar-hide">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`flex-1 min-w-0 px-3 sm:px-4 py-2 rounded-md text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap relative z-10
              ${active === i ? 'text-primary' : 'text-fg-muted hover:text-fg'}`}
          >
            {active === i && (
              <motion.div
                layoutId={id}
                className="absolute inset-0 bg-surface rounded-md shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tabs[active]?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
