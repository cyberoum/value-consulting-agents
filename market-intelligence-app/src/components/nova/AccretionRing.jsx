/**
 * AccretionRing — Nova's signature visual element.
 *
 * Concentric SVG circles that fill from center outward based on a value (0-1).
 * The center dot glows when the value exceeds 0.7.
 * Inspired by the accretion disk around a white dwarf.
 *
 * Props:
 *   value     — 0 to 1 (completion / health percentage)
 *   size      — pixel size of the SVG (default 48)
 *   showGlow  — boolean, show the breathing glow on the core (default: auto based on value)
 *   label     — optional text rendered in the center (e.g., score number)
 *   className — additional CSS classes
 */

export default function AccretionRing({ value = 0, size = 48, showGlow, label, className = '' }) {
  const v = Math.max(0, Math.min(1, value));
  const autoGlow = showGlow !== undefined ? showGlow : v >= 0.7;

  // Ring calculations
  const cx = size / 2;
  const cy = size / 2;

  // Three concentric rings with different radii
  const outerR = size * 0.44;
  const midR = size * 0.32;
  const innerR = size * 0.20;
  const coreR = size * 0.08;

  const outerCirc = 2 * Math.PI * outerR;
  const midCirc = 2 * Math.PI * midR;
  const innerCirc = 2 * Math.PI * innerR;

  // Fill amounts — outer fills first, then mid, then inner
  const outerFill = Math.min(1, v / 0.4) * 0.4 + 0.6; // Always at least 60% visible
  const midFill = Math.min(1, Math.max(0, (v - 0.2) / 0.4));
  const innerFill = Math.min(1, Math.max(0, (v - 0.5) / 0.5));

  // Color temperature based on value
  const ringColor = v >= 0.7 ? 'var(--nova-ignited)' : v >= 0.4 ? 'var(--nova-accreting)' : 'var(--nova-dormant)';
  const coreColor = v >= 0.7 ? 'var(--nova-ignited)' : v >= 0.4 ? 'var(--nova-accreting)' : 'var(--nova-dormant)';
  const glowColor = v >= 0.7 ? 'var(--nova-ignited-glow)' : 'var(--nova-accreting-glow)';

  const strokeW = Math.max(1.5, size * 0.04);

  return (
    <div className={`inline-flex items-center justify-center relative ${className}`} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {/* Background rings (dormant track) */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="var(--nova-dormant)" strokeWidth={strokeW} opacity={0.15} />
        <circle cx={cx} cy={cy} r={midR} fill="none" stroke="var(--nova-dormant)" strokeWidth={strokeW} opacity={0.15} />
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="var(--nova-dormant)" strokeWidth={strokeW} opacity={0.15} />

        {/* Filled rings — animate with nova-ring-fill class */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={ringColor} strokeWidth={strokeW}
          strokeDasharray={outerCirc}
          strokeDashoffset={outerCirc * (1 - outerFill)}
          strokeLinecap="round"
          className="nova-ring-fill"
          transform={`rotate(-90 ${cx} ${cy})`} />

        <circle cx={cx} cy={cy} r={midR} fill="none" stroke={ringColor} strokeWidth={strokeW}
          strokeDasharray={midCirc}
          strokeDashoffset={midCirc * (1 - midFill)}
          strokeLinecap="round"
          className="nova-ring-fill"
          opacity={midFill > 0 ? 1 : 0}
          transform={`rotate(-90 ${cx} ${cy})`} />

        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke={ringColor} strokeWidth={strokeW}
          strokeDasharray={innerCirc}
          strokeDashoffset={innerCirc * (1 - innerFill)}
          strokeLinecap="round"
          className="nova-ring-fill"
          opacity={innerFill > 0 ? 1 : 0}
          transform={`rotate(-90 ${cx} ${cy})`} />

        {/* Core dot — glows when ignited */}
        <circle cx={cx} cy={cy} r={coreR} fill={coreColor}
          opacity={v >= 0.3 ? 0.6 : 0.2}
          className={autoGlow ? 'nova-core-glow' : ''} />

        {/* Glow halo behind core (radial gradient effect) */}
        {autoGlow && (
          <circle cx={cx} cy={cy} r={coreR * 2.5} fill={coreColor}
            opacity={0.08}
            className="nova-core-glow" />
        )}
      </svg>

      {/* Center label (e.g., score number) */}
      {label && (
        <span className="absolute inset-0 flex items-center justify-center"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: size * 0.22,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
          {label}
        </span>
      )}
    </div>
  );
}
