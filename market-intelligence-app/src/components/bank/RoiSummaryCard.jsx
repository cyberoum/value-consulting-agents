import { useMemo, useState } from 'react';
import { DollarSign, Copy, Check, ChevronRight, TrendingUp } from 'lucide-react';
import { calculateRoi, formatEur, getConversationSummary } from '../../data/roiEngine';

const SCENARIO_LABELS = [
  { key: 'conservative', label: 'Conservative', color: '#2E7D32' },
  { key: 'base',         label: 'Base Case',    color: '#3366FF' },
  { key: 'optimistic',   label: 'Optimistic',   color: '#7C4DFF' },
];

const LEVER_COLORS = {
  cost_to_serve: '#2E7D32',
  channel_shift: '#3366FF',
  onboarding: '#E65100',
  cross_sell: '#7C4DFF',
  platform: '#1F3D99',
};

/**
 * Condensed ROI snapshot for the meeting-prep narrative.
 * Shows 3 scenarios, top 3 levers, and a copyable talk track.
 */
export default function RoiSummaryCard({ bankKey, onDeepDive }) {
  const [copied, setCopied] = useState(false);
  const roi = useMemo(() => calculateRoi(bankKey), [bankKey]);

  if (!roi || roi.levers.length === 0) {
    return (
      <div className="p-4 bg-surface-2 border border-border rounded-xl text-center">
        <DollarSign size={20} className="mx-auto text-fg-disabled mb-2" />
        <p className="text-xs text-fg-muted">Insufficient data for ROI estimation</p>
      </div>
    );
  }

  const summary = getConversationSummary(roi);
  const topLevers = roi.levers.slice(0, 3);
  const maxLeverValue = Math.max(...topLevers.map(l => l.values[2]));

  const handleCopy = () => {
    const lines = [
      `ROI Talk Track: ${roi.bankName}`,
      summary,
      '',
      `Conservative: ${formatEur(roi.totals.conservative)} | Base: ${formatEur(roi.totals.base)} | Optimistic: ${formatEur(roi.totals.optimistic)}`,
      '',
      ...topLevers.map(l => `${l.icon} ${l.name}: ${formatEur(l.values[0])} – ${formatEur(l.values[2])}`),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-gradient-to-r from-primary-50 to-violet-50 border border-primary/10 rounded-xl">
      {/* Talk Track */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp size={14} className="text-primary" />
            <span className="text-[10px] uppercase tracking-wider text-primary/60 font-bold">Conversation-Ready ROI</span>
          </div>
          <p className="text-xs text-fg-subtle leading-relaxed">{summary}</p>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-[10px] font-bold text-primary transition-colors"
        >
          {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
        </button>
      </div>

      {/* 3 Scenario Totals */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {SCENARIO_LABELS.map((sc, idx) => {
          const total = [roi.totals.conservative, roi.totals.base, roi.totals.optimistic][idx];
          return (
            <div key={sc.key} className="p-2.5 bg-white/80 rounded-lg text-center border border-white">
              <div className="text-[9px] uppercase tracking-wider font-bold mb-0.5" style={{ color: sc.color }}>
                {sc.label}
              </div>
              <div className="text-base font-black" style={{ color: sc.color }}>
                {formatEur(total)}
              </div>
              <div className="text-[8px] text-fg-disabled">/year</div>
            </div>
          );
        })}
      </div>

      {/* Top 3 Levers */}
      <div className="space-y-2 mb-3">
        {topLevers.map((lever) => {
          const pct = maxLeverValue > 0 ? (lever.values[1] / maxLeverValue) * 100 : 0;
          const leverColor = LEVER_COLORS[lever.id] || '#3366FF';
          return (
            <div key={lever.id} className="flex items-center gap-3">
              <span className="text-sm shrink-0">{lever.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-bold text-fg truncate">{lever.name}</span>
                  <span className="text-[10px] font-black shrink-0 ml-2" style={{ color: leverColor }}>
                    {formatEur(lever.values[1])}
                  </span>
                </div>
                <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: leverColor }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Dive Link */}
      {onDeepDive && (
        <button
          onClick={onDeepDive}
          className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
        >
          See Full ROI Analysis <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}
