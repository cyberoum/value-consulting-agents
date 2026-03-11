import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const defaultFilters = {
  minScore: 0, maxScore: 10, confidence: 'all', hasPowerMap: false,
  dealSize: 'all', hasValueSelling: false, sortBy: 'score'
};

export default function FilterPanel({ onFilter, initialFilters = {} }) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({ ...defaultFilters, ...initialFilters });

  const update = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilter(next);
  };

  const activeCount =
    (filters.minScore > 0 ? 1 : 0) +
    (filters.maxScore < 10 ? 1 : 0) +
    (filters.confidence !== 'all' ? 1 : 0) +
    (filters.hasPowerMap ? 1 : 0) +
    (filters.dealSize !== 'all' ? 1 : 0) +
    (filters.hasValueSelling ? 1 : 0) +
    (filters.sortBy !== 'score' ? 1 : 0);

  return (
    <div className="mb-4">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-fg-muted hover:text-primary hover:border-primary/40 transition-colors">
        <SlidersHorizontal size={14} />
        Filters
        {activeCount > 0 && <span className="bg-primary text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">{activeCount}</span>}
      </button>
      {open && (
        <div className="mt-2 p-4 bg-surface border border-border rounded-xl animate-fade-in-up">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Score range */}
            <div>
              <label className="text-[10px] font-bold text-fg-muted uppercase tracking-wide block mb-1">Min Score</label>
              <input type="range" min="0" max="10" step="0.5" value={filters.minScore} onChange={e => update('minScore', +e.target.value)} className="w-28 accent-primary" />
              <span className="text-xs font-bold text-primary ml-2">{filters.minScore}</span>
            </div>
            <div>
              <label className="text-[10px] font-bold text-fg-muted uppercase tracking-wide block mb-1">Max Score</label>
              <input type="range" min="0" max="10" step="0.5" value={filters.maxScore} onChange={e => update('maxScore', +e.target.value)} className="w-28 accent-primary" />
              <span className="text-xs font-bold text-primary ml-2">{filters.maxScore}</span>
            </div>

            {/* Confidence */}
            <div>
              <label className="text-[10px] font-bold text-fg-muted uppercase tracking-wide block mb-1">Confidence</label>
              <select value={filters.confidence} onChange={e => update('confidence', e.target.value)} className="text-xs bg-surface-2 border border-border rounded px-2 py-1 text-fg">
                <option value="all">All</option>
                <option value="deep">Deep only</option>
                <option value="standard">Standard+</option>
              </select>
            </div>

            {/* Deal Size */}
            <div>
              <label className="text-[10px] font-bold text-fg-muted uppercase tracking-wide block mb-1">Deal Size</label>
              <select value={filters.dealSize} onChange={e => update('dealSize', e.target.value)} className="text-xs bg-surface-2 border border-border rounded px-2 py-1 text-fg">
                <option value="all">All</option>
                <option value="large">€10M+ (Large)</option>
                <option value="medium">€3-10M (Medium)</option>
                <option value="small">Under €3M (Small)</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-[10px] font-bold text-fg-muted uppercase tracking-wide block mb-1">Sort By</label>
              <select value={filters.sortBy} onChange={e => update('sortBy', e.target.value)} className="text-xs bg-surface-2 border border-border rounded px-2 py-1 text-fg">
                <option value="score">Fit Score</option>
                <option value="name">Name (A-Z)</option>
                <option value="confidence">Data Confidence</option>
              </select>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs text-fg-subtle cursor-pointer">
                <input type="checkbox" checked={filters.hasPowerMap} onChange={e => update('hasPowerMap', e.target.checked)} className="accent-primary" />
                Power Map Only
              </label>
              <label className="flex items-center gap-2 text-xs text-fg-subtle cursor-pointer">
                <input type="checkbox" checked={filters.hasValueSelling} onChange={e => update('hasValueSelling', e.target.checked)} className="accent-primary" />
                Value Selling Ready
              </label>
            </div>

            {activeCount > 0 && (
              <button onClick={() => { setFilters({ ...defaultFilters }); onFilter({ ...defaultFilters }); }} className="flex items-center gap-1 text-xs text-danger hover:underline">
                <X size={12} /> Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
