import { useState, useCallback } from 'react';

const STORAGE_KEY = 'mi-score-overrides';

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveOverrides(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Hook for managing user score overrides.
 * Stores per-bank, per-dimension score overrides in localStorage.
 *
 * Shape: { [bankKey]: { [dimension]: { score: number, note: string } } }
 */
export default function useScoreOverrides() {
  const [overrides, setOverrides] = useState(loadOverrides);

  const setOverride = useCallback((bankKey, dimension, score, note) => {
    setOverrides(prev => {
      const next = {
        ...prev,
        [bankKey]: {
          ...(prev[bankKey] || {}),
          [dimension]: { score: Math.min(10, Math.max(0, score)), note, updatedAt: new Date().toISOString() },
        },
      };
      saveOverrides(next);
      return next;
    });
  }, []);

  const clearOverride = useCallback((bankKey, dimension) => {
    setOverrides(prev => {
      const next = { ...prev };
      if (next[bankKey]) {
        delete next[bankKey][dimension];
        if (Object.keys(next[bankKey]).length === 0) delete next[bankKey];
      }
      saveOverrides(next);
      return next;
    });
  }, []);

  const clearAllForBank = useCallback((bankKey) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[bankKey];
      saveOverrides(next);
      return next;
    });
  }, []);

  const getOverride = useCallback((bankKey, dimension) => {
    return overrides[bankKey]?.[dimension] || null;
  }, [overrides]);

  const getOverridesForBank = useCallback((bankKey) => {
    return overrides[bankKey] || {};
  }, [overrides]);

  const hasOverrides = useCallback((bankKey) => {
    return Object.keys(overrides[bankKey] || {}).length > 0;
  }, [overrides]);

  return { overrides, setOverride, clearOverride, clearAllForBank, getOverride, getOverridesForBank, hasOverrides };
}

/**
 * Calculate score with overrides applied
 */
export function calcScoreWithOverrides(bankKey, qualData, framework, overrides) {
  const qd = qualData[bankKey];
  if (!qd) return 0;
  const fw = framework.dimensions;
  const bankOverrides = overrides[bankKey] || {};
  let w = 0;
  Object.keys(fw).forEach(dim => {
    const override = bankOverrides[dim];
    const score = override ? override.score : (qd[dim]?.score || 0);
    w += score * fw[dim].weight;
  });
  if (qd.power_map?.activated) w += 1.0;
  if (qd.partner_access?.backbase_access) w += 0.5;
  return Math.round(Math.min(w, 10) * 10) / 10;
}
