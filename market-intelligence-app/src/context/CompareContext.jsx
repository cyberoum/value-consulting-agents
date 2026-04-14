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

  const [limitReached, setLimitReached] = useState(false);

  const toggle = useCallback((bankKey) => {
    setSelected(prev => {
      if (prev.includes(bankKey)) {
        setLimitReached(false);
        const next = prev.filter(k => k !== bankKey);
        saveToStorage(next);
        return next;
      }
      if (prev.length >= 4) {
        setLimitReached(true);
        setTimeout(() => setLimitReached(false), 3000); // Auto-dismiss after 3s
        return prev;
      }
      setLimitReached(false);
      const next = [...prev, bankKey];
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
    <CompareContext.Provider value={{ selected, toggle, clear, isSelected, limitReached }}>
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => useContext(CompareContext);
