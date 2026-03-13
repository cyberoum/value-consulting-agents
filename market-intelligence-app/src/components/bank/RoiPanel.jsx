import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, DollarSign, AlertTriangle, Info, ChevronDown, ChevronUp, Copy, Check, Zap, FileSpreadsheet } from 'lucide-react';
import { calculateRoi, formatEur, formatNumber, formatMillions, getConversationSummary, BENCHMARKS } from '../../data/roiEngine';
import { getRegionalCosts, getRegionForCountry, RETAIL_BENCHMARKS, BACKBASE_IMPACT, REFERENCE_BANKS } from '../../data/domainBenchmarks';
import { BANK_DATA } from '../../data/banks';
import { AnimatedBar } from '../common/Motion';

const SCENARIO_CONFIG = [
  { key: 'conservative', label: 'Conservative', sub: 'P25 — Defensible floor', color: '#2E7D32', bg: '#E8F5E9', border: '#2E7D32' },
  { key: 'base',         label: 'Base Case',    sub: 'P50 — Most likely',      color: '#3366FF', bg: '#EBF0FF', border: '#3366FF' },
  { key: 'optimistic',   label: 'Optimistic',   sub: 'P75 — Full realization',  color: '#7C4DFF', bg: '#F3EEFF', border: '#7C4DFF' },
];

const LEVER_COLORS = {
  cost_to_serve: '#2E7D32',
  channel_shift: '#3366FF',
  onboarding: '#E65100',
  cross_sell: '#7C4DFF',
  platform: '#1F3D99',
};

export default function RoiPanel({ bankKey }) {
  const [activeScenario, setActiveScenario] = useState(1); // 0=conservative, 1=base, 2=optimistic
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showMethodology, setShowMethodology] = useState(null); // lever id
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const roi = useMemo(() => calculateRoi(bankKey), [bankKey]);

  if (!roi || roi.levers.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign size={40} className="mx-auto text-fg-disabled mb-3" />
        <p className="text-sm text-fg-muted font-bold">Insufficient data for ROI estimation</p>
        <p className="text-xs text-fg-disabled mt-1">
          This bank needs KPIs (customers, employees, assets) to calculate value levers
        </p>
      </div>
    );
  }

  const scenario = SCENARIO_CONFIG[activeScenario];
  const activeTotal = [roi.totals.conservative, roi.totals.base, roi.totals.optimistic][activeScenario];
  const maxLeverValue = Math.max(...roi.levers.map(l => l.values[2])); // max across optimistic
  const conversationSummary = getConversationSummary(roi);

  const handleCopy = () => {
    const lines = [
      `ROI Summary: ${roi.bankName}`,
      `─────────────────────────────`,
      conversationSummary,
      '',
      `Annual Value Potential:`,
      `  Conservative: ${formatEur(roi.totals.conservative)}`,
      `  Base Case:    ${formatEur(roi.totals.base)}`,
      `  Optimistic:   ${formatEur(roi.totals.optimistic)}`,
      '',
      `Value Levers:`,
      ...roi.levers.map(l => `  ${l.icon} ${l.name}: ${formatEur(l.values[0])} – ${formatEur(l.values[2])}`),
      '',
      `Key Assumptions:`,
      ...roi.assumptions.map(a => `  • ${a.assumption} (${a.source})`),
      '',
      roi.dealContext.valueHypothesis ? `Value Hypothesis: "${roi.dealContext.valueHypothesis}"` : '',
      '',
      `⚠ These are high-level estimates for conversation purposes.`,
      `   All numbers should be validated with client-specific data.`,
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Conversation-Ready Banner */}
      <div className="p-4 bg-primary-900 rounded-xl mb-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-primary-200" />
              <span className="text-[10px] uppercase tracking-wider text-white/60 font-bold">Conversation-Ready ROI</span>
            </div>
            <p className="text-sm leading-relaxed">{conversationSummary}</p>
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors"
          >
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
          <button
            onClick={async () => {
              setExporting(true);
              const { generateRoiExcel } = await import('../../utils/generateRoiExcel');
              generateRoiExcel({ roi, bankData: BANK_DATA[bankKey], bankKey });
              setExporting(false);
            }}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors"
          >
            <FileSpreadsheet size={12} /> {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
        {roi.dealContext.valueHypothesis && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <span className="text-[10px] text-white/50 uppercase">Value Hypothesis:</span>
            <p className="text-xs text-primary-200 italic mt-0.5">"{roi.dealContext.valueHypothesis}"</p>
          </div>
        )}
      </div>

      {/* Scenario Selector Cards */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {SCENARIO_CONFIG.map((sc, idx) => {
          const total = [roi.totals.conservative, roi.totals.base, roi.totals.optimistic][idx];
          const isActive = idx === activeScenario;
          return (
            <motion.button
              key={sc.key}
              onClick={() => setActiveScenario(idx)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                isActive
                  ? 'shadow-lg scale-[1.02]'
                  : 'border-border bg-surface hover:border-border hover:bg-surface-2 opacity-70'
              }`}
              style={isActive ? { borderColor: sc.border, backgroundColor: sc.bg } : {}}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-[9px] uppercase tracking-wider font-bold mb-1" style={{ color: isActive ? sc.color : undefined }}>
                {sc.label}
              </div>
              <div className="text-lg sm:text-xl font-black" style={{ color: isActive ? sc.color : undefined }}>
                {formatEur(total)}
              </div>
              <div className="text-[9px] text-fg-disabled mt-0.5">{sc.sub}</div>
              {roi.payback && (
                <div className="text-[9px] mt-1.5 font-bold" style={{ color: isActive ? sc.color : 'var(--fg-muted)' }}>
                  ~{[roi.payback.conservative, roi.payback.base, roi.payback.optimistic][idx]} yr payback
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Annual Value Label */}
      <div className="text-center mb-4">
        <span className="text-[10px] uppercase tracking-wider text-fg-disabled font-bold">
          Estimated Annual Value — {scenario.label}
        </span>
      </div>

      {/* Value Lever Breakdown */}
      <div className="space-y-3 mb-6">
        {roi.levers.map((lever, i) => {
          const value = lever.values[activeScenario];
          const pct = maxLeverValue > 0 ? (value / maxLeverValue) * 100 : 0;
          const leverColor = LEVER_COLORS[lever.id] || '#3366FF';
          const isExpanded = showMethodology === lever.id;

          return (
            <motion.div
              key={lever.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div
                className="p-3 bg-surface border border-border rounded-xl hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => setShowMethodology(isExpanded ? null : lever.id)}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{lever.icon}</span>
                      <span className="text-xs font-bold text-fg">{lever.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                        lever.source.includes('Annual') ? 'bg-success-subtle text-success' : 'bg-warning/10 text-warning'
                      }`}>
                        {lever.source.includes('Annual') ? '📊 Data' : '📐 Benchmark'}
                      </span>
                    </div>
                    <p className="text-[10px] text-fg-disabled mt-0.5 line-clamp-1">{lever.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black" style={{ color: leverColor }}>{formatEur(value)}</div>
                    <div className="text-[9px] text-fg-disabled">/year</div>
                  </div>
                </div>

                {/* Animated bar */}
                <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                  <AnimatedBar width={pct} color={leverColor} height="100%" delay={i * 0.1} />
                </div>

                {/* Range indicator */}
                <div className="flex justify-between mt-1.5 text-[8px] text-fg-disabled">
                  <span>{formatEur(lever.values[0])}</span>
                  <span className="flex items-center gap-1">
                    {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    <span>Range: {formatEur(lever.values[0])} – {formatEur(lever.values[2])}</span>
                  </span>
                  <span>{formatEur(lever.values[2])}</span>
                </div>

                {/* Expanded methodology */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-border space-y-2">
                        <div className="text-[10px]">
                          <span className="font-bold text-fg-muted">Metric: </span>
                          <span className="text-fg-subtle">{lever.metric}</span>
                        </div>
                        <div className="text-[10px]">
                          <span className="font-bold text-fg-muted">Methodology: </span>
                          <span className="text-fg-subtle">{lever.methodology}</span>
                        </div>
                        {lever.talkingPoint && (
                          <div className="p-2 bg-primary-50 rounded-lg">
                            <span className="text-[10px] font-bold text-primary">💬 Talking Point: </span>
                            <span className="text-[10px] text-primary-700">{lever.talkingPoint}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Stacked total bar */}
      <div className="p-4 bg-surface border border-border rounded-xl mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-fg">Value Composition</span>
          <span className="text-sm font-black" style={{ color: scenario.color }}>
            {formatEur(activeTotal)} / year
          </span>
        </div>
        <div className="h-6 bg-surface-2 rounded-full overflow-hidden flex">
          {roi.levers.map((lever, i) => {
            const value = lever.values[activeScenario];
            const pct = activeTotal > 0 ? (value / activeTotal) * 100 : 0;
            return (
              <motion.div
                key={lever.id}
                className="h-full relative group"
                style={{ width: `${pct}%`, backgroundColor: LEVER_COLORS[lever.id] || '#3366FF' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                {pct > 12 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
                    {Math.round(pct)}%
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {roi.levers.map(lever => (
            <div key={lever.id} className="flex items-center gap-1.5 text-[9px] text-fg-muted">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LEVER_COLORS[lever.id] }} />
              {lever.name}
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics Used */}
      <div className="p-4 bg-surface border border-border rounded-xl mb-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-primary" />
          <span className="text-xs font-bold text-fg">Bank Metrics Used</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {roi.metrics.totalAssets && (
            <MetricChip
              label="Total Assets"
              value={`€${formatMillions(roi.metrics.totalAssets)}`}
              source={roi.metrics._sources.totalAssets}
            />
          )}
          {roi.metrics.employees && (
            <MetricChip
              label="Employees"
              value={formatNumber(roi.metrics.employees)}
              source={roi.metrics._sources.employees}
            />
          )}
          {roi.metrics.customers && (
            <MetricChip
              label="Customers"
              value={formatNumber(roi.metrics.customers)}
              source={roi.metrics._sources.customers}
            />
          )}
          {roi.metrics.costIncomeRatio && (
            <MetricChip
              label="Cost/Income"
              value={`${Math.round(roi.metrics.costIncomeRatio * 100)}%`}
              source={roi.metrics._sources.costIncomeRatio}
            />
          )}
          {roi.metrics.estimatedRevenue && (
            <MetricChip
              label="Est. Revenue"
              value={`€${formatMillions(roi.metrics.estimatedRevenue)}`}
              source={roi.metrics._sources.estimatedRevenue}
            />
          )}
          {roi.metrics.techSpend && (
            <MetricChip
              label="Tech Spend"
              value={`€${formatMillions(roi.metrics.techSpend)}`}
              source={roi.metrics._sources.techSpend}
            />
          )}
        </div>
      </div>

      {/* Deal Context */}
      {(roi.dealContext.dealSize || roi.dealContext.resultingIn) && (
        <div className="p-4 bg-primary-50 border border-primary/10 rounded-xl mb-5">
          <div className="text-[10px] uppercase tracking-wider text-primary/60 font-bold mb-2">Deal Context</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {roi.dealContext.dealSize && (
              <div><span className="font-bold text-primary">Deal Size:</span> <span className="text-fg-subtle">{roi.dealContext.dealSize}</span></div>
            )}
            {roi.dealContext.salesCycle && (
              <div><span className="font-bold text-primary">Sales Cycle:</span> <span className="text-fg-subtle">{roi.dealContext.salesCycle}</span></div>
            )}
            {roi.dealContext.timing && (
              <div className="sm:col-span-2"><span className="font-bold text-primary">Timing:</span> <span className="text-fg-subtle">{roi.dealContext.timing}</span></div>
            )}
            {roi.dealContext.resultingIn && (
              <div className="sm:col-span-2">
                <span className="font-bold text-primary">Projected Impact:</span>
                <span className="text-fg-subtle ml-1">{roi.dealContext.resultingIn}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Benchmark Context */}
      <BenchmarkContext bankKey={bankKey} />

      {/* Assumptions & Disclaimers */}
      <button
        onClick={() => setShowAssumptions(!showAssumptions)}
        className="flex items-center gap-2 w-full p-3 bg-surface-2 border border-border rounded-xl text-xs font-bold text-fg-muted hover:text-fg transition-colors mb-3"
      >
        <AlertTriangle size={14} />
        <span>Assumptions & Methodology ({roi.assumptions.length})</span>
        <span className="ml-auto">{showAssumptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
      </button>

      <AnimatePresence>
        {showAssumptions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-surface-2 border border-border rounded-xl mb-4">
              <div className="space-y-2">
                {roi.assumptions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px]">
                    <Info size={10} className="text-fg-disabled mt-0.5 shrink-0" />
                    <div>
                      <span className="text-fg-subtle">{a.assumption}</span>
                      <span className="text-fg-disabled ml-1">— {a.source}</span>
                      <span className={`ml-1.5 px-1 py-0.5 rounded text-[8px] font-bold ${
                        a.confidence === 'High' ? 'bg-success-subtle text-success' :
                        a.confidence === 'Medium' ? 'bg-warning/10 text-warning' :
                        'bg-danger-subtle text-danger'
                      }`}>
                        {a.confidence}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                <div className="flex items-center gap-2 text-[10px] text-warning font-bold mb-1">
                  <AlertTriangle size={10} />
                  Important Disclaimer
                </div>
                <p className="text-[10px] text-fg-disabled leading-relaxed">
                  These are high-level estimates for pre-meeting conversation purposes only. They are based on
                  publicly available annual report metrics and industry benchmarks. Actual ROI requires client-specific
                  data validation, detailed process analysis, and implementation scoping. All numbers should be treated
                  as directional indicators, not commitments.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BenchmarkContext({ bankKey }) {
  const [open, setOpen] = useState(false);
  const bd = BANK_DATA[bankKey];
  if (!bd) return null;

  const region = getRegionForCountry(bd.country);
  const costs = getRegionalCosts(bd.country);
  const relevantRefs = REFERENCE_BANKS.filter(r => r.region === region).slice(0, 3);
  const impact = BACKBASE_IMPACT.onboarding;

  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full p-3 bg-primary-50 border border-primary/10 rounded-xl text-xs font-bold text-primary hover:bg-primary-50/80 transition-colors"
      >
        <TrendingUp size={14} />
        <span>Industry Benchmarks — {region} Region</span>
        <span className="ml-auto text-[9px] text-primary/60">{costs.source}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-primary-50/50 border border-primary/10 border-t-0 rounded-b-xl space-y-4">
              {/* Regional Costs */}
              <div>
                <div className="text-[10px] font-bold text-primary uppercase mb-2">Transaction Costs ({region})</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 bg-surface rounded-lg">
                    <div className="text-[8px] text-fg-disabled">Branch</div>
                    <div className="text-xs font-bold text-fg">${costs.branch_interaction}</div>
                  </div>
                  <div className="p-2 bg-surface rounded-lg">
                    <div className="text-[8px] text-fg-disabled">Digital</div>
                    <div className="text-xs font-bold text-success">${costs.digital_interaction}</div>
                  </div>
                  <div className="p-2 bg-surface rounded-lg">
                    <div className="text-[8px] text-fg-disabled">Call Center</div>
                    <div className="text-xs font-bold text-fg">${costs.call_center_interaction}</div>
                  </div>
                  <div className="p-2 bg-surface rounded-lg">
                    <div className="text-[8px] text-fg-disabled">FTE Cost</div>
                    <div className="text-xs font-bold text-fg">${(costs.fte_cost / 1000).toFixed(0)}K</div>
                  </div>
                </div>
              </div>

              {/* Backbase Impact */}
              <div>
                <div className="text-[10px] font-bold text-primary uppercase mb-2">Validated Backbase Impact</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-surface rounded-lg">
                    <div className="text-[8px] text-fg-disabled">Onboarding Revenue Uplift</div>
                    <div className="text-xs font-bold text-success">{Math.round(impact.revenue_uplift.conservative * 100)}–{Math.round(impact.revenue_uplift.aggressive * 100)}%</div>
                  </div>
                  <div className="p-2 bg-surface rounded-lg">
                    <div className="text-[8px] text-fg-disabled">Onboarding Cost Avoidance</div>
                    <div className="text-xs font-bold text-success">{Math.round(impact.cost_avoidance.conservative * 100)}–{Math.round(impact.cost_avoidance.aggressive * 100)}%</div>
                  </div>
                  <div className="p-2 bg-surface rounded-lg">
                    <div className="text-[8px] text-fg-disabled">Servicing Revenue Uplift</div>
                    <div className="text-xs font-bold text-fg">{Math.round(BACKBASE_IMPACT.servicing.revenue_uplift.conservative * 100)}–{Math.round(BACKBASE_IMPACT.servicing.revenue_uplift.aggressive * 100)}%</div>
                  </div>
                  <div className="p-2 bg-surface rounded-lg">
                    <div className="text-[8px] text-fg-disabled">Servicing Cost Avoidance</div>
                    <div className="text-xs font-bold text-fg">{Math.round(BACKBASE_IMPACT.servicing.cost_avoidance.conservative * 100)}–{Math.round(BACKBASE_IMPACT.servicing.cost_avoidance.aggressive * 100)}%</div>
                  </div>
                </div>
                <div className="text-[8px] text-fg-disabled mt-1">{impact.source}</div>
              </div>

              {/* Reference Banks */}
              {relevantRefs.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-primary uppercase mb-2">Reference Banks ({region})</div>
                  <div className="space-y-1">
                    {relevantRefs.map((ref, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-surface rounded-lg text-[10px]">
                        <span className="font-bold text-fg">{ref.name}</span>
                        {ref.digital_rate != null && <span className="text-fg-muted">Digital: {Math.round(ref.digital_rate * 100)}%</span>}
                        {ref.products_per != null && <span className="text-fg-muted">Products/Cust: {ref.products_per}</span>}
                        {ref.nps != null && <span className="text-fg-muted">NPS: {ref.nps}</span>}
                        <span className="ml-auto text-fg-disabled">{ref.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Industry Ranges */}
              <div>
                <div className="text-[10px] font-bold text-primary uppercase mb-2">Industry Benchmark Ranges</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { ...RETAIL_BENCHMARKS.digital_adoption, fmt: v => Math.round(v * 100) + '%' },
                    { ...RETAIL_BENCHMARKS.self_service_rate, fmt: v => Math.round(v * 100) + '%' },
                    { ...RETAIL_BENCHMARKS.cross_sell_ratio, fmt: v => v.toFixed(1) },
                    { ...RETAIL_BENCHMARKS.stp_rate, fmt: v => Math.round(v * 100) + '%' },
                  ].map((b, i) => (
                    <div key={i} className="p-2 bg-surface rounded-lg">
                      <div className="text-[8px] text-fg-disabled">{b.label}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] text-danger">{b.fmt(b.poor)}</span>
                        <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden flex">
                          <div className="h-full bg-danger/40" style={{ width: '25%' }} />
                          <div className="h-full bg-warning/40" style={{ width: '25%' }} />
                          <div className="h-full bg-success/40" style={{ width: '25%' }} />
                          <div className="h-full bg-primary/40" style={{ width: '25%' }} />
                        </div>
                        <span className="text-[9px] text-primary">{b.fmt(b.best)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricChip({ label, value, source }) {
  const isFromData = source === 'bank_data' || source?.includes('bank_data');
  return (
    <div className="p-2 bg-surface-2 rounded-lg">
      <div className="text-[8px] text-fg-disabled uppercase">{label}</div>
      <div className="text-xs font-bold text-fg">{value}</div>
      <div className={`text-[7px] font-bold mt-0.5 ${isFromData ? 'text-success' : 'text-warning'}`}>
        {isFromData ? '📊 From Data' : '📐 Estimated'}
      </div>
    </div>
  );
}
