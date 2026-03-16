import { motion } from 'framer-motion';

export default function Sparkline({ values = [], color = '#3366FF', width = 80, height = 24, showDot = true }) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 2;

  const points = values.map((v, i) => ({
    x: padding + (i / (values.length - 1)) * (width - padding * 2),
    y: padding + ((max - v) / range) * (height - padding * 2),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const lastPoint = points[points.length - 1];

  return (
    <svg width={width} height={height} className="inline-block">
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      {showDot && (
        <motion.circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2.5}
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 }}
        />
      )}
    </svg>
  );
}
