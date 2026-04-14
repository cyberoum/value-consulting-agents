import { PLAY_TYPES } from '../../data/intelligenceLayer';

export default function PlayCard({ play, onClick }) {
  const pt = PLAY_TYPES[play.play_type] || {};
  const isActive = play.status === 'active';
  const isCompleted = play.status === 'completed';

  return (
    <button onClick={onClick}
      className={`flex flex-col items-center p-3 min-w-[120px] rounded-[var(--il-radius)] border-t-[3px] bg-white shadow-[var(--color-il-card-shadow)] hover:shadow-[var(--color-il-card-shadow-hover)] transition-all text-center
        ${isActive ? 'border-t-[var(--color-il-accent)]' : isCompleted ? 'border-t-violet-400 opacity-70' : 'border-t-slate-300 opacity-50'}`}>
      <span className="text-2xl mb-1">{pt.icon || '📋'}</span>
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{pt.label || play.play_type}</span>
      {play.output_count > 0 && (
        <span className="text-[9px] text-[var(--color-il-accent)] font-bold mt-0.5">{play.output_count} output{play.output_count > 1 ? 's' : ''}</span>
      )}
      {isCompleted && <span className="text-[8px] text-violet-500 font-bold mt-0.5">Completed</span>}
    </button>
  );
}
