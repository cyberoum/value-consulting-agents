import { createContext, useContext, useState, useCallback } from 'react';

const ExportContext = createContext(null);

export function ExportProvider({ children }) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Map()); // Map<id, { label, category, content }>

  const toggleSelectMode = useCallback(() => {
    setSelectMode(prev => {
      if (prev) setSelected(new Map()); // clear selections when exiting
      return !prev;
    });
  }, []);

  const toggleItem = useCallback((id, item) => {
    setSelected(prev => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, item);
      }
      return next;
    });
  }, []);

  const isSelected = useCallback((id) => selected.has(id), [selected]);

  const clearAll = useCallback(() => setSelected(new Map()), []);

  const generateMarkdown = useCallback((bankName) => {
    if (selected.size === 0) return '';

    // Group by category
    const groups = {};
    selected.forEach((item) => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    let md = `# ${bankName} — Selected Intelligence\n\n`;
    md += `*Exported ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • ${selected.size} items selected*\n\n---\n\n`;

    Object.entries(groups).forEach(([category, items]) => {
      md += `## ${category}\n\n`;
      items.forEach(item => {
        md += `### ${item.label}\n`;
        md += `${item.content}\n\n`;
      });
    });

    md += `---\n*Nova by Backbase • Confidential*\n`;
    return md;
  }, [selected]);

  return (
    <ExportContext.Provider value={{
      selectMode, toggleSelectMode,
      selected, toggleItem, isSelected,
      clearAll, generateMarkdown,
      count: selected.size,
    }}>
      {children}
    </ExportContext.Provider>
  );
}

export function useExport() {
  const ctx = useContext(ExportContext);
  if (!ctx) throw new Error('useExport must be used within ExportProvider');
  return ctx;
}
