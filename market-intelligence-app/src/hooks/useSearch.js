import { useState, useRef, useCallback, useEffect } from 'react';
import { buildSearchIndex } from '../data/utils';

const RECENT_KEY = 'mi-recent-searches';
const MAX_RECENT = 8;

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeFilter, setActiveFilter] = useState('all'); // all | bank | person | country | market
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
    catch { return []; }
  });
  const indexRef = useRef(null);

  // Build or get cached search index
  const getIndex = useCallback(() => {
    if (!indexRef.current) indexRef.current = buildSearchIndex();
    return indexRef.current;
  }, []);

  // Perform search
  const search = useCallback((q, filter = 'all') => {
    setQuery(q);
    setActiveFilter(filter);
    setActiveIndex(-1);

    if (!q || q.length < 2) {
      setResults([]);
      setTotalMatches(0);
      return;
    }

    const index = getIndex();
    const words = q.toLowerCase().split(/\s+/);

    let matches = index.filter(item => {
      const hay = (item.keywords || '') + ' ' + item.name.toLowerCase() + ' ' + (item.meta || '').toLowerCase();
      return words.every(w => hay.includes(w));
    });

    // Apply type filter
    if (filter !== 'all') {
      matches = matches.filter(item => item.type === filter);
    }

    // Sort: exact name matches first, then by score (for banks), then alphabetically
    matches.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const qLow = q.toLowerCase();
      const aExact = aName.startsWith(qLow) ? 0 : 1;
      const bExact = bName.startsWith(qLow) ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      if (a.score !== undefined && b.score !== undefined) return b.score - a.score;
      return aName.localeCompare(bName);
    });

    setTotalMatches(matches.length);
    setResults(matches.slice(0, 20));
  }, [getIndex]);

  // Save to recent searches
  const addRecent = useCallback((item) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(r => !(r.name === item.name && r.type === item.type));
      const next = [{ name: item.name, type: item.type, key: item.key, bankKey: item.bankKey, meta: item.meta }, ...filtered].slice(0, MAX_RECENT);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Clear recent
  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    try { localStorage.removeItem(RECENT_KEY); } catch {}
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    const len = results.length;
    if (!len) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % len);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + len) % len);
    }
  }, [results.length]);

  // Get type counts from current unfiltered search
  const getTypeCounts = useCallback((q) => {
    if (!q || q.length < 2) return {};
    const index = getIndex();
    const words = q.toLowerCase().split(/\s+/);
    const matches = index.filter(item => {
      const hay = (item.keywords || '') + ' ' + item.name.toLowerCase() + ' ' + (item.meta || '').toLowerCase();
      return words.every(w => hay.includes(w));
    });
    const counts = {};
    matches.forEach(m => { counts[m.type] = (counts[m.type] || 0) + 1; });
    return counts;
  }, [getIndex]);

  return {
    query, setQuery: (q) => search(q, activeFilter),
    results, totalMatches, activeIndex, setActiveIndex,
    activeFilter, setActiveFilter: (f) => search(query, f),
    recentSearches, addRecent, clearRecent,
    handleKeyDown, search, getTypeCounts,
  };
}
