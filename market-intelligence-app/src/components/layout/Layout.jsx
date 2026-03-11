import { Outlet } from 'react-router-dom';
import Header from './Header';
import CompareBar from '../common/CompareBar';
import { DATASET_DATE, DATASET_LABEL, DATASET_VERSION, calcFreshness, getAllFlagCount } from '../../data/metadata';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { Clock, Flag } from 'lucide-react';

export default function Layout() {
  useKeyboardShortcuts();
  const freshness = calcFreshness(DATASET_DATE);
  const flagCount = getAllFlagCount();

  return (
    <div className="min-h-screen bg-surface-2 text-fg">
      <Header />
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>
      <footer className="border-t border-border px-3 sm:px-4 py-3 text-[10px] sm:text-xs text-fg-disabled no-print">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-1">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span>Backbase Market Intelligence • Confidential</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-border transition-smooth" style={{ backgroundColor: freshness.bg, color: freshness.color }}>
              <Clock size={9} />
              Data: {DATASET_LABEL} • {freshness.label}
            </span>
            {flagCount > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-danger/20 bg-danger-subtle text-danger font-bold">
                <Flag size={9} />
                {flagCount} flagged
              </span>
            )}
          </div>
          <span>v{DATASET_VERSION} • &copy; 2026 Backbase</span>
        </div>
      </footer>
      <CompareBar />
    </div>
  );
}
