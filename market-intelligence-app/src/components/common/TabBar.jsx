import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionErrorBoundary from './SectionErrorBoundary';

/**
 * TabBar — pill-style tabs with:
 *  • Lazy rendering: only the active tab's content is mounted
 *  • Sticky mode: tab bar sticks to top when scrolled past (pure CSS)
 *  • Badge support: tabs can show counts / status dots via `tab.badge`
 *  • Keyboard nav: ← → arrows cycle through tabs
 */
export default function TabBar({ tabs, defaultTab = 0, id = 'tab-indicator', sticky = false }) {
  const [active, setActive] = useState(defaultTab);

  // ── Keyboard navigation ──────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') setActive(prev => (prev + 1) % tabs.length);
    else if (e.key === 'ArrowLeft') setActive(prev => (prev - 1 + tabs.length) % tabs.length);
  }, [tabs.length]);

  return (
    <div>
      <div
        className={`flex gap-0.5 mb-5 bg-surface-3 rounded-lg p-1 border border-border overflow-x-auto relative scrollbar-hide
          ${sticky ? 'sticky top-[60px] z-30 shadow-[0_2px_8px_rgba(0,0,0,0.08)] backdrop-blur-sm bg-surface-3/95' : ''}`}
        role="tablist"
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={active === i}
            tabIndex={active === i ? 0 : -1}
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
            <span className="relative z-10 inline-flex items-center gap-1">
              {tab.label}
              {/* Badge: number or status dot */}
              {tab.badge != null && tab.badge !== 0 && tab.badge !== '' && (
                typeof tab.badge === 'number' ? (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black leading-none bg-primary/10 text-primary">
                    {tab.badge}
                  </span>
                ) : (
                  <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                )
              )}
            </span>
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
          <SectionErrorBoundary label={tabs[active]?.label}>
            {tabs[active]?.content}
          </SectionErrorBoundary>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
