import { useNavigate } from 'react-router-dom';
import { GitCompare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompare } from '../../context/CompareContext';
import { BANK_DATA } from '../../data/utils';

export default function CompareBar() {
  const { selected, clear, limitReached } = useCompare();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {selected.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-primary-900 text-white rounded-xl px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 shadow-2xl max-w-[95vw]"
        >
          <GitCompare size={16} />
          <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">{selected.length} bank{selected.length > 1 ? 's' : ''}</span>
          <div className="flex gap-1 overflow-hidden">
            {selected.map(k => (
              <motion.span
                key={k}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="text-xs bg-white/20 px-2 py-0.5 rounded"
              >
                {BANK_DATA[k]?.bank_name || k.split('_')[0]}
              </motion.span>
            ))}
          </div>
          {selected.length >= 2 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => navigate('/compare')}
              className="px-3 py-1 bg-primary rounded-md text-xs font-bold hover:bg-primary-400 transition-colors"
            >
              Compare
            </motion.button>
          )}
          {limitReached && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-amber-300 font-bold">
              Max 4 banks
            </motion.span>
          )}
          <button onClick={clear} className="p-1 hover:bg-white/20 rounded transition-colors"><X size={14} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
