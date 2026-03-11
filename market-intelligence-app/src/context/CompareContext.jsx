import { createContext, useContext, useState, useCallback } from 'react';

const CompareContext = createContext();
const STORAGE_KEY = 'mi-compare-selection';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToStorage(selected) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(selected)); } catch {}
}

export function CompareProvider({ children }) {
  const [selected, setSelected] = useState(loadFromStorage);

  const toggle = useCallback((bankKey) => {
    setSelected(prev => {
      let next;
      if (prev.includes(bankKey)) {
        next = prev.filter(k => k !== bankKey);
      } else {
        if (prev.length >= 4) return prev; // max 4 (up from 3)
        next = [...prev, bankKey];
      }
      saveToStorage(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelected([]);
    saveToStorage([]);
  }, []);

  const isSelected = useCallback((bankKey) => selected.includes(bankKey), [selected]);

  return (
    <CompareContext.Provider value={{ selected, toggle, clear, isSelected }}>
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => useContext(CompareContext);
