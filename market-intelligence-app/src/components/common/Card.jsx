import { motion } from 'framer-motion';

export default function Card({ children, className = '', onClick, hover = false }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover || onClick ? { scale: 1.015, y: -2 } : {}}
      whileTap={hover || onClick ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`bg-surface border border-border rounded-xl p-5 transition-colors duration-200
        ${hover ? 'cursor-pointer hover:border-primary/40 hover:shadow-md' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}`}
    >
      {children}
    </motion.div>
  );
}
