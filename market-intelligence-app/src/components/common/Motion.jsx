import { motion, AnimatePresence } from 'framer-motion';

// Fade in up — default page entrance
export function FadeInUp({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered children — wraps a list of items
export function StaggerContainer({ children, className = '', staggerDelay = 0.06 }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger child item — use inside StaggerContainer
export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.97 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale on hover — wrap interactive cards
export function HoverScale({ children, className = '', scale = 1.02 }) {
  return (
    <motion.div
      whileHover={{ scale, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Slide in from side
export function SlideIn({ children, direction = 'left', className = '' }) {
  const x = direction === 'left' ? -30 : 30;
  return (
    <motion.div
      initial={{ opacity: 0, x }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animate presence wrapper for modals/overlays
export function AnimatedOverlay({ isOpen, children, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center pt-[15vh]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Animated counter — counts from 0 to target value
export function CountUp({ value, className = '', duration = 1.2, decimals = 0 }) {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return <span className={className}>{value}</span>;

  const nodeRef = { current: null };

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {typeof value === 'string' && value.includes('.') ? value : value}
      </motion.span>
    </motion.span>
  );
}

// Scale bounce entrance
export function ScaleBounce({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated progress bar
export function AnimatedBar({ width, color = '#3366FF', height = 'h-3', delay = 0, className = '' }) {
  return (
    <div className={`${height} bg-surface-2 rounded-full overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`h-full rounded-full`}
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

// Flip card entrance
export function FlipIn({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateX: -15, y: 20 }}
      animate={{ opacity: 1, rotateX: 0, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ perspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Collapsible section animation
export function Collapsible({ isOpen, children }) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Page transition wrapper
export function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { AnimatePresence };
