import { useState, useCallback } from 'react';
import { searchAll } from '../data/api';

const RECENT_KEY = 'mi-recent-searches';
const MAX_RECENT = 8;

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeFilter, setActiveFilter] = useState('all');
  const [typeCounts, setTypeCounts] = useState({});
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
    catch { return []; }
  });

  // Perform search via API
  const search = useCallback(async (q, filter = 'all') => {
    setQuery(q);
    setActiveFilter(filter);
    setActiveIndex(-1);

    if (!q || q.length < 2) {
      setResults([]);
      setTotalMatches(0);
      setTypeCounts({});
      return;
    }

    try {
      const data = await searchAll(q);
      const allResults = data.results || [];
      const counts = data.counts || {};
      setTypeCounts(counts);

      // Apply type filter client-side
      let filtered = filter !== 'all'
        ? allResults.filter(item => item.type === filter)
        : allResults;

      // Sort: exact name matches first, then by score, then alphabetically
      const qLow = q.toLowerCase();
      filtered.sort((a, b) => {
        const aExact = a.name.toLowerCase().startsWith(qLow) ? 0 : 1;
        const bExact = b.name.toLowerCase().startsWith(qLow) ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        if (a.score !== undefined && b.score !== undefined) return b.score - a.score;
        return a.name.localeCompare(b.name);
      });

      setTotalMatches(filtered.length);
      setResults(filtered.slice(0, 20));
    } catch {
      setResults([]);
      setTotalMatches(0);
      setTypeCounts({});
    }
  }, []);

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

  // getTypeCounts kept for backward compat — returns current counts
  const getTypeCounts = useCallback(() => typeCounts, [typeCounts]);

  return {
    query, setQuery: (q) => search(q, activeFilter),
    results, totalMatches, activeIndex, setActiveIndex,
    activeFilter, setActiveFilter: (f) => search(query, f),
    recentSearches, addRecent, clearRecent,
    handleKeyDown, search, getTypeCounts, typeCounts,
  };
}
