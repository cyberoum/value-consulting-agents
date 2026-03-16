/**
 * ModernizationPlayCards — Three horizontal cards showing Modernization Plays.
 * Each play card lists the zones mapped to it, with score chips and a narrative.
 *
 * Plays:
 *   1. Replatform — Replace legacy digital channels
 *   2. Add New Journeys — Add new digital journeys on existing platform
 *   3. Unified Channel Architecture — Consolidate fragmented solutions
 */
import { motion } from 'framer-motion';
import { RefreshCw, PlusCircle, Merge } from 'lucide-react';

const LOB_LABELS = {
  retail: 'Retail',
  small_business: 'Small Biz',
  commercial: 'Commercial',
  wealth: 'Wealth',
};

const JOURNEY_LABELS = {
  onboarding: 'Onboarding',
  servicing: 'Servicing',
  lending: 'Lending',
  loan_origination: 'Loan Orig.',
  investing: 'Investing',
};

function scoreColor(score) {
  if (score >= 8) return '#1B5E20';
  if (score >= 6) return '#4CAF50';
  if (score >= 4) return '#F57F17';
  return '#FF9800';
}

const PLAY_CONFIG = [
  {
    key: 'replatform',
    label: 'Play 1: Replatform',
    icon: RefreshCw,
    color: '#C62828',
    bgLight: '#FDECEA',
    borderColor: '#EF9A9A',
    desc: 'Replace legacy digital channels with a modern Backbase engagement layer.',
  },
  {
    key: 'add_new_journeys',
    label: 'Play 2: Add New Journeys',
    icon: PlusCircle,
    color: '#2E7D32',
    bgLight: '#E8F5E9',
    borderColor: '#A5D6A7',
    desc: 'Add new digital journeys on top of the existing platform without full replacement.',
  },
  {
    key: 'unified_channel',
    label: 'Play 3: Unified Channel',
    icon: Merge,
    color: '#1565C0',
    bgLight: '#E3F2FD',
    borderColor: '#90CAF9',
    desc: 'Consolidate multiple channel solutions into one unified Backbase platform.',
  },
];

export default function ModernizationPlayCards({ plays }) {
  if (!plays?.length) return null;

  return (
    <div>
      <h4 className="text-sm font-bold text-fg mb-3 flex items-center gap-2">
        <RefreshCw size={14} className="text-primary" />
        Modernization Plays
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PLAY_CONFIG.map((config, i) => {
          const play = plays.find(p => p.play === config.key);
          const Icon = config.icon;
          const zoneCount = play?.zones?.length || 0;

          return (
            <motion.div
              key={config.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl border"
              style={{ borderColor: config.borderColor, backgroundColor: config.bgLight }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color: config.color }} />
                <span className="text-xs font-black" style={{ color: config.color }}>
                  {config.label}
                </span>
              </div>
              <p className="text-[10px] text-fg-muted mb-3 leading-relaxed">{config.desc}</p>

              {zoneCount > 0 ? (
                <>
                  <div className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-1.5">
                    {zoneCount} Zone{zoneCount !== 1 ? 's' : ''}
                  </div>
                  <div className="space-y-1">
                    {play.zones.map((z, j) => (
                      <div key={j} className="flex items-center justify-between text-[11px]">
                        <span className="text-fg">
                          {LOB_LABELS[z.lob]} / {JOURNEY_LABELS[z.journey]}
                        </span>
                        <span className="font-bold text-[10px]" style={{ color: scoreColor(z.score) }}>
                          {z.score}
                        </span>
                      </div>
                    ))}
                  </div>
                  {play.narrative && (
                    <p className="text-[10px] text-fg-muted mt-2 italic leading-relaxed">
                      {play.narrative}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-fg-disabled italic">No zones mapped to this play</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
