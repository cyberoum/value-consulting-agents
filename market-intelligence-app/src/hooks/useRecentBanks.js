import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'nova-recent-banks';
const MAX_RECENT = 6;

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function save(banks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(banks));
}

export function useRecentBanks() {
  const [recent, setRecent] = useState(load);

  const trackVisit = useCallback((bankKey, bankName, country, score) => {
    setRecent(prev => {
      const filtered = prev.filter(b => b.key !== bankKey);
      const updated = [{ key: bankKey, name: bankName, country, score, visitedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      save(updated);
      return updated;
    });
  }, []);

  return { recent, trackVisit };
}
