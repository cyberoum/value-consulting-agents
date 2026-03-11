export function ScoreBadge({ score }) {
  const color = score >= 8 ? '#3366FF' : score >= 6 ? '#1F3D99' : score >= 4 ? '#F57F17' : '#FF7262';
  const bg = score >= 8 ? '#EBF0FF' : score >= 6 ? '#F0F4FA' : score >= 4 ? '#FFF8E1' : '#FFF0EE';
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg font-extrabold text-sm" style={{ color, background: bg }}>
      {score}
    </span>
  );
}

export function ConfidenceBadge({ level }) {
  const styles = {
    deep: { bg: '#E8F5E9', color: '#2E7D32', icon: '🟢', label: 'Deep' },
    standard: { bg: '#FFF8E1', color: '#F57F17', icon: '🟡', label: 'Standard' },
    preliminary: { bg: '#FFF0EE', color: '#FF7262', icon: '🔴', label: 'Preliminary' },
  };
  const s = styles[level] || styles.preliminary;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: s.bg, color: s.color }}>
      {s.icon} {s.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const colors = { HIGH: 'bg-primary text-white', MEDIUM: 'bg-primary-700/10 text-primary-700', LOW: 'bg-gray-100 text-gray-500' };
  return <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${colors[priority] || colors.LOW}`}>{priority}</span>;
}

export function FavoriteButton({ active, onClick }) {
  return (
    <button onClick={onClick} className={`p-1 rounded transition-colors ${active ? 'text-red-500' : 'text-fg-disabled hover:text-red-400'}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
