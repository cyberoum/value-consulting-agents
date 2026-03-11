import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Moon, Sun, Heart, BarChart3, GitCompare, X, Clock, ArrowRight, Building2, User, Globe, Map, Command } from 'lucide-react';
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
    handleKeyDown, search, getTypeCounts,
  } = useSearch();

  const [typeCounts, setTypeCounts] = useState({});

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
      setTypeCounts({});
    }
  }, [searchOpen, search]);

  // Close on route change
  useEffect(() => { setSearchOpen(false); }, [location.pathname]);

  const handleSearchInput = useCallback((q) => {
    setQuery(q);
    setTypeCounts(getTypeCounts(q));
  }, [setQuery, getTypeCounts]);

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
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-extrabold text-sm group-hover:shadow-lg group-hover:shadow-primary/25 transition-shadow">MI</div>
          <span className="font-bold text-fg text-sm hidden sm:block">Market Intelligence</span>
        </div>

        {/* Search trigger */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-fg-muted text-xs hover:border-primary/40 hover:bg-surface transition-all focus-ring"
          >
            <Search size={14} className="shrink-0" />
            <span className="truncate">Search banks, people, vendors...</span>
            <kbd className="ml-auto text-[10px] bg-surface border border-border rounded px-1 py-0.5 font-mono hidden sm:inline">⌘K</kbd>
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/analytics')} className="p-2 rounded-lg hover:bg-surface-2 text-fg-muted hover:text-primary transition-all focus-ring" title="Analytics (A)">
            <BarChart3 size={16} />
          </button>
          <button onClick={() => navigate('/favorites')} className="p-2 rounded-lg hover:bg-surface-2 text-fg-muted hover:text-red-500 transition-all focus-ring" title="Favorites (F)">
            <Heart size={16} />
          </button>
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
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-surface-2 text-fg-muted transition-all focus-ring" title="Toggle dark mode (D)">
            <motion.div key={dark ? 'sun' : 'moon'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </motion.div>
          </button>
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
