/**
 * Unified Button component — enforces visual hierarchy across Nova.
 *
 * Three variants:
 *   primary  — filled blue, for THE main action on each screen
 *   secondary — outlined, for supporting actions
 *   ghost    — text-only, for tertiary/inline actions
 *
 * Two sizes:
 *   default — standard buttons
 *   sm      — compact for inline/toolbar use
 *
 * Usage:
 *   <Button variant="primary" onClick={...}>Prepare for Meeting</Button>
 *   <Button variant="secondary" icon={FileText}>Executive Brief</Button>
 *   <Button variant="ghost" size="sm" icon={Copy}>Copy</Button>
 */

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow',
  secondary: 'bg-surface border border-border text-fg hover:bg-surface-2 hover:border-primary/30',
  ghost: 'text-fg-muted hover:text-fg hover:bg-surface-2',
  danger: 'bg-danger text-white hover:bg-danger/90',
  dark: 'bg-primary-900 text-white hover:bg-primary-900/90',
};

const SIZES = {
  default: 'px-4 py-2 text-xs gap-2',
  sm: 'px-2.5 py-1.5 text-[11px] gap-1.5',
  xs: 'px-2 py-1 text-[10px] gap-1',
};

export default function Button({
  children,
  variant = 'secondary',
  size = 'default',
  icon: Icon,
  iconSize,
  onClick,
  disabled = false,
  className = '',
  ...props
}) {
  const iSize = iconSize || (size === 'xs' ? 10 : size === 'sm' ? 12 : 14);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-bold rounded-lg transition-all
        ${VARIANTS[variant] || VARIANTS.secondary}
        ${SIZES[size] || SIZES.default}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}`}
      {...props}
    >
      {Icon && <Icon size={iSize} />}
      {children}
    </button>
  );
}
