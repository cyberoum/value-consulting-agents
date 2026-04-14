import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Moon, Sun, Heart, BarChart3, GitCompare, X, Clock, ArrowRight, Building2, User, Globe, Map, Command, Star, Kanban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useCompare } from '../../context/CompareContext';
import { useSearch } from '../../hooks/useSearch';

const TYPE_CONFIG = {
  bank: { icon: Building2, color: 'bg-primary-50 text-primary border-primary/20', label: 'Bank' },
  person: { icon: User, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Person' },
  country: { icon: Globe, color: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Country' },
  market: { icon: Map, color: 'bg-violet-50 text-violet-600 border-violet-200', label: 'Market' },
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'bank', label: 'Banks' },
  { key: 'person', label: 'People' },
  { key: 'country', label: 'Countries' },
  { key: 'market', label: 'Markets' },
];

export default function Header() {
  const { dark, toggle } = useTheme();
  const { selected } = useCompare();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef(null);
  const resultListRef = useRef(null);

  const {
    query, setQuery, results, totalMatches,
    activeIndex, setActiveIndex, activeFilter, setActiveFilter,
    recentSearches, addRecent, clearRecent,
    handleKeyDown, search, typeCounts,
  } = useSearch();

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
      // 'd' toggles dark mode when not in input
      if (e.key === 'd' && !e.metaKey && !e.ctrlKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        toggle();
      }
      // '/' opens search when not in input
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (!searchOpen) {
      search('', 'all');
    }
  }, [searchOpen, search]);

  // Close on route change
  useEffect(() => { setSearchOpen(false); }, [location.pathname]);

  const handleSearchInput = useCallback((q) => {
    setQuery(q);
  }, [setQuery]);

  const goResult = useCallback((r) => {
    addRecent(r);
    setSearchOpen(false);
    if (r.type === 'market') navigate(`/market/${r.key}`);
    else if (r.type === 'country') navigate(`/country/${encodeURIComponent(r.name)}`);
    else if (r.type === 'bank') navigate(`/bank/${encodeURIComponent(r.key)}`);
    else if (r.type === 'person' && r.bankKey) navigate(`/bank/${encodeURIComponent(r.bankKey)}`);
  }, [navigate, addRecent]);

  const onSearchKeyDown = useCallback((e) => {
    handleKeyDown(e);
    if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      goResult(results[activeIndex]);
    }
    // Tab cycles through filter tabs
    if (e.key === 'Tab' && !e.shiftKey && query.length >= 2) {
      e.preventDefault();
      const currentIdx = FILTER_TABS.findIndex(t => t.key === activeFilter);
      const nextIdx = (currentIdx + 1) % FILTER_TABS.length;
      setActiveFilter(FILTER_TABS[nextIdx].key);
    }
  }, [handleKeyDown, activeIndex, results, goResult, activeFilter, setActiveFilter, query]);

  // Scroll active result into view
  useEffect(() => {
    if (activeIndex >= 0 && resultListRef.current) {
      const el = resultListRef.current.children[activeIndex];
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-xl overflow-hidden group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-200 shrink-0">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                <linearGradient id="nova-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4D7AFF"/>
                  <stop offset="100%" stopColor="#2244CC"/>
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="9" fill="url(#nova-bg)"/>
              {/* North star — clean 4-point star with elongated vertical axis */}
              <path d="M16 4 L17.8 13.2 L16 12 L14.2 13.2 Z" fill="white"/>
              <path d="M16 28 L14.2 18.8 L16 20 L17.8 18.8 Z" fill="white"/>
              <path d="M4 16 L13.2 14.2 L12 16 L13.2 17.8 Z" fill="white" opacity="0.7"/>
              <path d="M28 16 L18.8 17.8 L20 16 L18.8 14.2 Z" fill="white" opacity="0.7"/>
              {/* Bright core */}
              <circle cx="16" cy="16" r="2.8" fill="white"/>
            </svg>
          </div>
          <span className="hidden sm:block text-[15px] font-bold tracking-[-0.02em] text-fg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Nova</span>
        </div>

        {/* Search trigger — now the primary header element */}
        <div className="flex-1 max-w-lg mx-2 sm:mx-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-fg-muted text-xs hover:border-primary/40 hover:bg-surface transition-all focus-ring"
          >
            <Search size={14} className="shrink-0" />
            <span className="truncate">Search banks, people, vendors...</span>
            <kbd className="ml-auto text-[10px] bg-surface border border-border rounded px-1 py-0.5 font-mono hidden sm:inline">⌘K</kbd>
          </button>
        </div>

        {/* Minimal action icons — most nav moved to Sidebar */}
        <div className="flex items-center gap-1">
          {selected.length > 0 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => navigate('/compare')}
              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all relative focus-ring"
              title="Compare banks"
            >
              <GitCompare size={16} />
              <motion.span
                key={selected.length}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white rounded-full text-[10px] font-bold flex items-center justify-center"
              >
                {selected.length}
              </motion.span>
            </motion.button>
          )}
          {/* Dark mode toggle moved to Sidebar */}
        </div>
      </header>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[12vh]"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-2 sm:mx-4 overflow-hidden border border-border"
              onClick={e => e.stopPropagation()}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search size={18} className="text-fg-muted shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => handleSearchInput(e.target.value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search markets, countries, banks, people..."
                  className="flex-1 bg-transparent outline-none text-fg text-sm placeholder:text-fg-disabled"
                />
                {query && (
                  <button onClick={() => handleSearchInput('')} className="p-1 rounded hover:bg-surface-2 text-fg-disabled hover:text-fg-muted">
                    <X size={14} />
                  </button>
                )}
                <kbd className="text-[10px] bg-surface-2 border border-border rounded px-1.5 py-0.5 text-fg-muted font-mono">ESC</kbd>
              </div>

              {/* Filter tabs — shown when there are results */}
              {query.length >= 2 && (
                <div className="flex items-center gap-1 px-4 py-2 border-b border-border/50 bg-surface-2/50">
                  {FILTER_TABS.map(tab => {
                    const count = tab.key === 'all' ? totalMatches : (typeCounts[tab.key] || 0);
                    const isActive = activeFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveFilter(tab.key)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                          isActive
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-fg-muted hover:bg-surface-3'
                        } ${count === 0 && tab.key !== 'all' ? 'opacity-40' : ''}`}
                        disabled={count === 0 && tab.key !== 'all'}
                      >
                        {tab.label}
                        {count > 0 && <span className={`ml-1 ${isActive ? 'text-white/70' : 'text-fg-disabled'}`}>{count}</span>}
                      </button>
                    );
                  })}
                  <span className="ml-auto text-[9px] text-fg-disabled">Tab to cycle</span>
                </div>
              )}

              {/* Results */}
              {results.length > 0 && (
                <div ref={resultListRef} className="max-h-80 overflow-y-auto">
                  {results.map((r, i) => {
                    const config = TYPE_CONFIG[r.type] || TYPE_CONFIG.bank;
                    const Icon = config.icon;
                    const isActive = i === activeIndex;

                    return (
                      <motion.button
                        key={`${r.type}-${r.key || r.name}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        onClick={() => goResult(r)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-border/30 last:border-0 ${
                          isActive ? 'bg-primary-50 dark:bg-primary/10' : 'hover:bg-surface-2'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${config.color}`}>
                          <Icon size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-fg truncate">{r.name}</div>
                          <div className="text-[11px] text-fg-muted truncate">{r.meta}</div>
                        </div>
                        {r.score !== undefined && (
                          <span className="text-xs font-black text-primary">{r.score}</span>
                        )}
                        {isActive && (
                          <ArrowRight size={12} className="text-primary shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                  {totalMatches > 20 && (
                    <div className="px-4 py-2 text-[10px] text-fg-disabled text-center bg-surface-2/50">
                      Showing 20 of {totalMatches} results — refine your search
                    </div>
                  )}
                </div>
              )}

              {/* No results */}
              {query.length >= 2 && results.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <div className="text-fg-muted text-sm mb-1">No results for "{query}"</div>
                  <div className="text-fg-disabled text-xs">Try different keywords or check spelling</div>
                </div>
              )}

              {/* Empty state / Recent searches */}
              {query.length < 2 && (
                <div className="px-4 py-4">
                  {recentSearches.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-fg-disabled uppercase tracking-wider">Recent</span>
                        <button onClick={clearRecent} className="text-[10px] text-fg-disabled hover:text-danger">Clear</button>
                      </div>
                      <div className="space-y-0.5">
                        {recentSearches.map((r, i) => {
                          const config = TYPE_CONFIG[r.type] || TYPE_CONFIG.bank;
                          const Icon = config.icon;
                          return (
                            <button
                              key={i}
                              onClick={() => goResult(r)}
                              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-2 text-left transition-colors"
                            >
                              <Clock size={12} className="text-fg-disabled shrink-0" />
                              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${config.color}`}>
                                <Icon size={10} />
                              </div>
                              <span className="text-xs text-fg-subtle truncate">{r.name}</span>
                              <span className="text-[10px] text-fg-disabled ml-auto">{r.type}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-fg-disabled text-xs mb-3">Start typing to search across all intelligence data</div>
                      <div className="flex items-center justify-center gap-4 text-[10px] text-fg-disabled">
                        <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-2 border border-border rounded font-mono">↑↓</kbd> Navigate</span>
                        <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-2 border border-border rounded font-mono">↵</kbd> Select</span>
                        <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-2 border border-border rounded font-mono">Tab</kbd> Filter</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
