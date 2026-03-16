/**
 * LandingZoneMatrix — Interactive 4×5 heatmap grid.
 *
 * Displays the Landing Zone Matrix from the Value Consulting framework:
 *   Rows: 4 LOBs (Retail, Small Business, Commercial, Wealth)
 *   Cols: 5 Journeys (Onboarding, Servicing, Lending, Loan Origination, Investing)
 *
 * States:
 *   1. Empty — no analysis yet → "Analyze Landing Zones" CTA
 *   2. Loading — spinner with progress message
 *   3. Matrix — clickable heatmap cells with inline detail popup
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3X3, Loader2, RefreshCw, Brain, Clock } from 'lucide-react';
import ZoneDetailPopup from './ZoneDetailPopup';
import { scoreBankMatrix } from '../../utils/zoneMatching';

// ── Constants ──
const LOBS = ['retail', 'small_business', 'commercial', 'wealth'];
const JOURNEYS = ['onboarding', 'servicing', 'lending', 'loan_origination', 'investing'];

const LOB_LABELS = {
  retail: 'Retail',
  small_business: 'Small Business',
  commercial: 'Commercial',
  wealth: 'Wealth / PB',
};

const JOURNEY_LABELS = {
  onboarding: 'Onboarding',
  servicing: 'Servicing',
  lending: 'Lending',
  loan_origination: 'Loan Orig.',
  investing: 'Investing',
};

const PLAY_BADGES = {
  replatform: { label: 'Repl.', color: '#C62828', bg: '#FDECEA' },
  add_new_journeys: { label: 'New', color: '#2E7D32', bg: '#E8F5E9' },
  unified_channel: { label: 'Unify', color: '#1565C0', bg: '#E3F2FD' },
};

function cellColor(score) {
  if (score >= 8) return { bg: '#1B5E20', text: '#FFFFFF' };
  if (score >= 6) return { bg: '#4CAF50', text: '#FFFFFF' };
  if (score >= 4) return { bg: '#FFC107', text: '#000000' };
  if (score >= 2) return { bg: '#FF9800', text: '#000000' };
  if (score >= 1) return { bg: '#F44336', text: '#FFFFFF' };
  return { bg: '#F5F5F5', text: '#9E9E9E' };
}

function formatTimestamp(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export default function LandingZoneMatrix({
  matrixData,          // Full result from landing_zone_matrix table (or null)
  bankData,            // Full bank data object (for evidence-based fallback scoring)
  bankKey,
  bankName,
  onAnalyze,           // () => void — trigger AI analysis
  isAnalyzing,         // boolean
  researchAvailable,   // boolean — is ANTHROPIC_API_KEY set?
}) {
  const [selectedZone, setSelectedZone] = useState(null); // {lob, journey}

  // Determine which matrix to display:
  //   1. AI-generated matrix from landing_zone_matrix table (best)
  //   2. Evidence-based fallback from ALL bank intelligence (good)
  const matrix = useMemo(() => {
    if (matrixData?.matrix) return matrixData.matrix;
    if (bankData) return scoreBankMatrix(bankData);
    return null;
  }, [matrixData, bankData]);

  const isFallback = !matrixData?.matrix && !!matrix;
  const generatedAt = matrixData?.updated_at || matrixData?.created_at;

  // ── Empty state ──
  if (!matrix && !isAnalyzing) {
    return (
      <div className="p-6 text-center bg-surface border border-dashed border-border rounded-xl">
        <Grid3X3 size={36} className="mx-auto mb-3 text-fg-disabled" />
        <p className="text-sm font-bold text-fg mb-1">Landing Zone Matrix</p>
        <p className="text-xs text-fg-muted mb-4 max-w-sm mx-auto">
          AI-powered 4&times;5 grid analyzing Lines of Business and Journeys
          with Modernization Play mapping.
        </p>
        {researchAvailable ? (
          <button
            onClick={onAnalyze}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-indigo-600 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all"
          >
            <Brain size={14} />
            Analyze Landing Zones
          </button>
        ) : (
          <p className="text-[10px] text-fg-disabled">
            Set ANTHROPIC_API_KEY to enable AI analysis
          </p>
        )}
      </div>
    );
  }

  // ── Loading state ──
  if (isAnalyzing) {
    return (
      <div className="p-8 text-center bg-surface border border-primary/20 rounded-xl">
        <Loader2 size={28} className="mx-auto mb-3 text-primary animate-spin" />
        <p className="text-sm font-bold text-primary mb-1">Analyzing Landing Zones</p>
        <p className="text-xs text-fg-muted">
          Researching {bankName} via news, annual reports, and domain knowledge...
        </p>
        <p className="text-[10px] text-fg-disabled mt-2">This may take 20&ndash;40 seconds</p>
      </div>
    );
  }

  // ── Matrix view ──
  const handleCellClick = (lob, journey) => {
    if (selectedZone?.lob === lob && selectedZone?.journey === journey) {
      setSelectedZone(null); // Toggle off
    } else {
      setSelectedZone({ lob, journey });
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 size={14} className="text-primary" />
          <h4 className="text-sm font-bold text-fg">Landing Zone Matrix</h4>
          {isFallback && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
              From existing data
            </span>
          )}
          {!isFallback && generatedAt && (
            <span className="text-[9px] text-fg-muted flex items-center gap-1">
              <Clock size={9} />
              {formatTimestamp(generatedAt)}
            </span>
          )}
        </div>
        {researchAvailable && (
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={10} className={isAnalyzing ? 'animate-spin' : ''} />
            {isFallback ? 'Run AI Analysis' : 'Refresh'}
          </button>
        )}
      </div>

      {/* 4×5 Grid */}
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full border-collapse" style={{ minWidth: 520 }}>
          <thead>
            <tr>
              <th className="p-1.5 text-left text-[10px] text-fg-muted font-semibold w-24">
                LOB \ Journey
              </th>
              {JOURNEYS.map(j => (
                <th key={j} className="p-1.5 text-center text-[10px] text-fg-muted font-semibold">
                  {JOURNEY_LABELS[j]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LOBS.map((lob, rowIdx) => (
              <tr key={lob}>
                <td className="p-1.5 text-[10px] font-semibold text-fg whitespace-nowrap">
                  {LOB_LABELS[lob]}
                </td>
                {JOURNEYS.map((journey, colIdx) => {
                  const cell = matrix?.[lob]?.[journey];
                  const score = cell?.score || 0;
                  const colors = cellColor(score);
                  const play = cell?.play;
                  const isSelected = selectedZone?.lob === lob && selectedZone?.journey === journey;

                  return (
                    <td key={journey} className="p-1">
                      <motion.button
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: rowIdx * 0.04 + colIdx * 0.03,
                          duration: 0.2,
                        }}
                        onClick={() => handleCellClick(lob, journey)}
                        className={`w-full rounded-lg px-2 py-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-primary ring-offset-1 shadow-md scale-105'
                            : 'hover:ring-1 hover:ring-primary/40 hover:shadow-sm'
                        }`}
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        <div className="text-base font-black leading-none">{score}</div>
                        {play && PLAY_BADGES[play] && (
                          <div
                            className="text-[7px] mt-1 font-bold px-1.5 py-0.5 rounded mx-auto inline-block"
                            style={{
                              backgroundColor: PLAY_BADGES[play].bg,
                              color: PLAY_BADGES[play].color,
                            }}
                          >
                            {PLAY_BADGES[play].label}
                          </div>
                        )}
                      </motion.button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[9px] text-fg-muted">
        <span className="font-bold uppercase tracking-wider">Score:</span>
        {[
          { label: '8-10', bg: '#1B5E20', text: '#FFF' },
          { label: '6-7', bg: '#4CAF50', text: '#FFF' },
          { label: '4-5', bg: '#FFC107', text: '#000' },
          { label: '2-3', bg: '#FF9800', text: '#000' },
          { label: '1', bg: '#F44336', text: '#FFF' },
          { label: '0', bg: '#F5F5F5', text: '#9E9E9E' },
        ].map(item => (
          <span key={item.label} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.bg }}
            />
            {item.label}
          </span>
        ))}
        <span className="ml-2 font-bold uppercase tracking-wider">Play:</span>
        {Object.entries(PLAY_BADGES).map(([key, badge]) => (
          <span key={key} className="flex items-center gap-1">
            <span
              className="inline-block px-1 py-0.5 rounded text-[7px] font-bold"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          </span>
        ))}
      </div>

      {/* Inline Detail Popup */}
      <AnimatePresence>
        {selectedZone && matrix?.[selectedZone.lob]?.[selectedZone.journey] && (
          <ZoneDetailPopup
            lob={selectedZone.lob}
            journey={selectedZone.journey}
            cell={matrix[selectedZone.lob][selectedZone.journey]}
            onClose={() => setSelectedZone(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
