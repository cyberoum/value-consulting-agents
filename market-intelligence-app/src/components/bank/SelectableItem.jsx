import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useExport } from '../../context/ExportContext';

export default function SelectableItem({ id, label, category, content, children }) {
  const { selectMode, toggleItem, isSelected } = useExport();
  const checked = isSelected(id);

  if (!selectMode) return children;

  return (
    <div className="relative group">
      {/* Checkbox overlay */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => toggleItem(id, { label, category, content })}
        className={`absolute -left-1 -top-1 z-10 w-5 h-5 rounded flex items-center justify-center transition-colors border ${
          checked
            ? 'bg-primary border-primary text-white'
            : 'bg-surface border-border text-transparent hover:border-primary/50'
        }`}
      >
        <Check size={12} strokeWidth={3} />
      </motion.button>

      {/* Content with selection highlight */}
      <div
        onClick={() => toggleItem(id, { label, category, content })}
        className={`cursor-pointer transition-all duration-200 rounded-lg ${
          checked ? 'ring-2 ring-primary/40 ring-offset-1' : 'hover:ring-1 hover:ring-primary/20 hover:ring-offset-1'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
