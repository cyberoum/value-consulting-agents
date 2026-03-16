import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, X, Download, Copy, Trash2 } from 'lucide-react';
import { useExport } from '../../context/ExportContext';

export default function ExportBar({ bankName }) {
  const { selectMode, toggleSelectMode, count, clearAll, generateMarkdown } = useExport();

  const handleCopy = () => {
    const md = generateMarkdown(bankName);
    navigator.clipboard.writeText(md);
  };

  const handleDownload = () => {
    const md = generateMarkdown(bankName);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bankName.replace(/\s+/g, '_')}_selected_intel.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggleSelectMode}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
          selectMode
            ? 'bg-primary text-white'
            : 'bg-surface border border-border text-fg hover:bg-surface-2'
        }`}
      >
        <CheckSquare size={14} />
        {selectMode ? 'Exit Select' : 'Pick & Export'}
      </button>

      {/* Floating export bar */}
      <AnimatePresence>
        {selectMode && count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary-900 text-white rounded-2xl shadow-2xl px-4 sm:px-5 py-3 flex items-center gap-3 sm:gap-4 max-w-[95vw]"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white text-primary-900 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center">{count}</span>
              <span className="text-xs font-semibold whitespace-nowrap">
                item{count > 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="h-5 w-px bg-white/20" />

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Copy to clipboard"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Download .md"
              >
                <Download size={14} />
              </button>
              <button
                onClick={clearAll}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                title="Clear selection"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
