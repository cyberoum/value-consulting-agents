/**
 * ZoneDetailPopup — Explains WHY a landing zone cell scores high or low.
 * Renders inline below the matrix grid when a cell is clicked.
 */
import { motion } from 'framer-motion';
import { X, Newspaper, FileText, TrendingUp, AlertTriangle } from 'lucide-react';

const LOB_LABELS = {
  retail: 'Retail',
  small_business: 'Small Business',
  commercial: 'Commercial',
  wealth: 'Private Banking / Wealth',
};

const JOURNEY_LABELS = {
  onboarding: 'Onboarding',
  servicing: 'Servicing',
  lending: 'Lending',
  loan_origination: 'Loan Origination',
  investing: 'Investing',
};

const PLAY_INFO = {
  replatform: {
    label: 'Replatform',
    desc: 'Replace legacy digital channels with a modern Backbase engagement layer.',
    color: '#C62828',
    bg: '#FDECEA',
  },
  add_new_journeys: {
    label: 'Add New Journeys',
    desc: 'Add new digital journeys on top of the existing platform.',
    color: '#2E7D32',
    bg: '#E8F5E9',
  },
  unified_channel: {
    label: 'Unified Channel Architecture',
    desc: 'Consolidate multiple channel solutions into one unified platform.',
    color: '#1565C0',
    bg: '#E3F2FD',
  },
};

function scoreColor(score) {
  if (score >= 8) return '#1B5E20';
  if (score >= 6) return '#4CAF50';
  if (score >= 4) return '#F57F17';
  if (score >= 2) return '#FF9800';
  if (score >= 1) return '#F44336';
  return '#9E9E9E';
}

const SOURCE_ICONS = {
  news: Newspaper,
  annual_report: FileText,
  signal: TrendingUp,
  pain_point: AlertTriangle,
  engagement_zone: TrendingUp,
  existing_data: FileText,
};

export default function ZoneDetailPopup({ lob, journey, cell, onClose }) {
  if (!cell) return null;

  const play = cell.play ? PLAY_INFO[cell.play] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2 }}
      className="bg-surface border border-border rounded-xl shadow-xl p-5 mt-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-sm font-black text-fg">
            {LOB_LABELS[lob]} &mdash; {JOURNEY_LABELS[journey]}
          </h4>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-2xl font-black" style={{ color: scoreColor(cell.score) }}>
              {cell.score}/10
            </span>
            {play && (
              <span
                className="text-[9px] font-bold px-2 py-1 rounded-full"
                style={{ color: play.color, backgroundColor: play.bg }}
              >
                {play.label}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors text-fg-muted"
        >
          <X size={16} />
        </button>
      </div>

      {/* Current State */}
      {cell.currentState && cell.currentState !== 'Unknown' && (
        <div className="mb-3">
          <div className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-1">
            Current State
          </div>
          <p className="text-xs text-fg leading-relaxed">{cell.currentState}</p>
        </div>
      )}

      {/* Why This Score (Rationale) */}
      {cell.rationale && (
        <div className="mb-3">
          <div className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-1">
            Why This Score
          </div>
          <p className="text-xs text-fg leading-relaxed">{cell.rationale}</p>
        </div>
      )}

      {/* Play Explanation */}
      {play && (
        <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: play.bg }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: play.color }}>
            Recommended Play: {play.label}
          </div>
          <p className="text-xs text-fg-muted">{play.desc}</p>
        </div>
      )}

      {/* Evidence Sources */}
      {cell.evidence?.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-1.5">
            Supporting Evidence
          </div>
          <div className="space-y-1.5">
            {cell.evidence.map((e, i) => {
              const Icon = SOURCE_ICONS[e.source] || FileText;
              return (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <Icon size={11} className="text-fg-disabled shrink-0 mt-0.5" />
                  <div>
                    <span className="text-fg">{e.title}</span>
                    {e.source && (
                      <span className="text-fg-muted ml-1">
                        ({e.source.replace(/_/g, ' ')})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
