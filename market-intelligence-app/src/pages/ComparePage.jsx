import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, X, AlertTriangle, Zap, ExternalLink, Download, Copy, Check, Radar } from 'lucide-react';
import { useCompare } from '../context/CompareContext';
import { BANK_DATA, CX_DATA, COMP_DATA, QUAL_DATA, QUAL_FRAMEWORK, VALUE_SELLING, calcScore, scoreColor, dataConfidence } from '../data/utils';
import { Radar as RadarJS } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { FadeInUp, StaggerContainer, StaggerItem } from '../components/common/Motion';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

const COMPARE_COLORS = ['#3366FF', '#7C4DFF', '#E65100', '#2E7D32'];

export default function ComparePage() {
  const { selected, toggle, clear } = useCompare();
  const navigate = useNavigate();
  const [showRadar, setShowRadar] = useState(true);
  const [copied, setCopied] = useState(false);

  if (selected.length < 2) {
    return (
      <div className="text-center py-20 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Radar size={28} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-fg mb-2">Select at least 2 banks to compare</h2>
        <p className="text-sm text-fg-muted mb-6 max-w-sm mx-auto">Go to a country page and check banks to compare them side-by-side across qualification, CX, competition, and strategy</p>
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Go Back</button>
      </div>
    );
  }

  const banks = selected.map(key => {
    const d = BANK_DATA[key];
    const cx = CX_DATA[key];
    const comp = COMP_DATA[key];
    const qd = QUAL_DATA[key];
    const vs = VALUE_SELLING[key];
    const score = calcScore(key);
    const conf = dataConfidence(key);
    return { key, d, cx, comp, qd, vs, score, conf };
  });

  const dims = Object.entries(QUAL_FRAMEWORK.dimensions);

  // Find best score for each dimension for highlighting
  const bestScores = useMemo(() => {
    const bests = { fitScore: Math.max(...banks.map(b => b.score)) };
    dims.forEach(([dim]) => {
      const scores = banks.map(b => b.qd?.[dim]?.score || 0);
      bests[dim] = Math.max(...scores);
    });
    if (banks.some(b => b.cx)) {
      bests.ios = Math.max(...banks.map(b => b.cx?.app_rating_ios || 0));
      bests.android = Math.max(...banks.map(b => b.cx?.app_rating_android || 0));
    }
    return bests;
  }, [banks, dims]);

  // Export to markdown
  const exportMarkdown = () => {
    let md = `# Bank Comparison\n\n`;
    md += `| Dimension | ${banks.map(b => b.d?.bank_name).join(' | ')} |\n`;
    md += `|-----------|${banks.map(() => '---').join('|')}|\n`;
    md += `| **Fit Score** | ${banks.map(b => b.score).join(' | ')} |\n`;
    dims.forEach(([dim, fw]) => {
      md += `| ${fw.label} | ${banks.map(b => b.qd?.[dim]?.score ? `${b.qd[dim].score}/10` : '—').join(' | ')} |\n`;
    });
    md += `| Deal Size | ${banks.map(b => b.d?.backbase_qualification?.deal_size || '—').join(' | ')} |\n`;
    md += `| iOS Rating | ${banks.map(b => b.cx?.app_rating_ios || '—').join(' | ')} |\n`;
    md += `| Android Rating | ${banks.map(b => b.cx?.app_rating_android || '—').join(' | ')} |\n`;
    md += `| Core Banking | ${banks.map(b => b.comp?.core_banking || '—').join(' | ')} |\n`;
    md += `\n*Generated from Nova by Backbase • ${new Date().toLocaleDateString('en-GB')}*\n`;

    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isBest = (value, bestValue) => value > 0 && value === bestValue;

  const SectionRow = ({ label, icon }) => (
    <tr className="border-b-2 border-primary/20 bg-primary-50 dark:bg-primary/5">
      <td colSpan={banks.length + 1} className="p-2.5 font-bold text-xs text-primary uppercase tracking-wider">
        <span className="flex items-center gap-2">{icon}{label}</span>
      </td>
    </tr>
  );

  const CellHighlight = ({ children, best }) => (
    <span className={best ? 'relative' : ''}>
      {best && <span className="absolute -inset-1 bg-success/10 rounded-md border border-success/20" />}
      <span className="relative">{children}</span>
    </span>
  );

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-fg-muted hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRadar(!showRadar)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              showRadar ? 'bg-primary/10 text-primary' : 'bg-surface-2 text-fg-muted hover:bg-surface-3'
            }`}
          >
            <Radar size={14} />
            Radar
          </button>
          <button
            onClick={exportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg transition-all"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Export'}
          </button>
          <button onClick={clear} className="text-xs text-danger hover:underline ml-2">Clear all</button>
        </div>
      </div>

      <h2 className="text-2xl font-black text-fg mb-1">Bank Comparison</h2>
      <p className="text-xs text-fg-muted mb-6">Comparing {banks.length} banks across qualification, CX, competition, and strategy</p>

      {/* Bank header cards */}
      <div className={`grid gap-3 mb-6`} style={{ gridTemplateColumns: `repeat(${banks.length}, 1fr)` }}>
        {banks.map((b, i) => (
          <motion.div
            key={b.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface border-2 rounded-xl p-4 text-center relative"
            style={{ borderColor: COMPARE_COLORS[i] + '40' }}
          >
            <button
              onClick={() => toggle(b.key)}
              className="absolute top-2 right-2 text-fg-disabled hover:text-danger transition-colors"
            >
              <X size={14} />
            </button>
            <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: COMPARE_COLORS[i] }} />
            <div className="text-sm font-bold text-fg cursor-pointer hover:text-primary" onClick={() => navigate(`/bank/${encodeURIComponent(b.key)}`)}>{b.d?.bank_name}</div>
            <div className="text-[10px] text-fg-muted">{b.d?.country}</div>
            <div className="text-3xl font-black mt-2" style={{ color: scoreColor(b.score) }}>{b.score}</div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full inline-block mt-1" style={{ backgroundColor: b.conf.bg, color: b.conf.color }}>{b.conf.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Radar chart overlay */}
      {showRadar && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-surface border border-border rounded-xl p-6 mb-6"
        >
          <h3 className="text-sm font-bold text-fg mb-4 text-center">Qualification Radar Overlay</h3>
          <div className="max-w-md mx-auto">
            <RadarOverlay banks={banks} dims={dims} colors={COMPARE_COLORS} />
          </div>
          <div className="flex items-center justify-center gap-4 mt-4">
            {banks.map((b, i) => (
              <div key={b.key} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COMPARE_COLORS[i] }} />
                <span className="text-[10px] font-semibold text-fg-muted">{b.d?.bank_name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Comparison table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs border-collapse bg-surface">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="p-3 text-left w-44 text-fg-muted sticky left-0 bg-surface z-10 text-[10px] uppercase tracking-wider">Dimension</th>
              {banks.map((b, i) => (
                <th key={b.key} className="p-3 text-center min-w-[180px]">
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COMPARE_COLORS[i] }} />
                    <span className="font-bold text-xs text-fg">{b.d?.bank_name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* SECTION: Core Scores */}
            <SectionRow label="Qualification" icon={<Zap size={12} />} />
            <tr className="border-b border-border bg-surface-2 hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface-2 z-10">Fit Score</td>
              {banks.map(b => (
                <td key={b.key} className="p-3 text-center">
                  <CellHighlight best={isBest(b.score, bestScores.fitScore)}>
                    <span className="text-2xl font-black" style={{ color: scoreColor(b.score) }}>{b.score}</span>
                  </CellHighlight>
                </td>
              ))}
            </tr>
            {dims.map(([dim, fw]) => (
              <tr key={dim} className="border-b border-border hover-row">
                <td className="p-3 text-fg-subtle font-semibold sticky left-0 bg-surface z-10">
                  {fw.label} <span className="text-fg-disabled text-[10px]">({(fw.weight * 100).toFixed(0)}%)</span>
                </td>
                {banks.map(b => {
                  const dimScore = b.qd?.[dim]?.score || 0;
                  return (
                    <td key={b.key} className="p-3 text-center">
                      {b.qd?.[dim] ? (
                        <div>
                          <CellHighlight best={isBest(dimScore, bestScores[dim])}>
                            <span className="font-bold" style={{ color: scoreColor(dimScore) }}>{dimScore}/10</span>
                          </CellHighlight>
                          <div className="text-[10px] text-fg-muted mt-0.5 max-w-[160px] mx-auto truncate">{b.qd[dim].note?.substring(0, 60)}...</div>
                        </div>
                      ) : <span className="text-fg-disabled">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* SECTION: Deal & Timing */}
            <SectionRow label="Deal Intelligence" icon={<Zap size={12} />} />
            <tr className="border-b border-border bg-surface-2 hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface-2 z-10">Deal Size</td>
              {banks.map(b => (
                <td key={b.key} className="p-3 text-center font-bold text-primary">{b.d?.backbase_qualification?.deal_size || '—'}</td>
              ))}
            </tr>
            <tr className="border-b border-border hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface z-10">Timing</td>
              {banks.map(b => (
                <td key={b.key} className="p-3 text-center text-fg-subtle">{b.d?.backbase_qualification?.timing || '—'}</td>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface-2 hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface-2 z-10">Risk</td>
              {banks.map(b => (
                <td key={b.key} className="p-3 text-center text-[11px] text-fg-subtle">{b.d?.backbase_qualification?.risk || '—'}</td>
              ))}
            </tr>
            <tr className="border-b border-border hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface z-10">Sales Cycle</td>
              {banks.map(b => (
                <td key={b.key} className="p-3 text-center text-fg-subtle">{b.d?.backbase_qualification?.sales_cycle || '—'}</td>
              ))}
            </tr>

            {/* SECTION: CX & Digital */}
            <SectionRow label="Customer Experience" icon={<ExternalLink size={12} />} />
            <tr className="border-b border-border hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface z-10">App Rating (iOS)</td>
              {banks.map(b => (
                <td key={b.key} className="p-3 text-center">
                  {b.cx ? (
                    <CellHighlight best={isBest(b.cx.app_rating_ios, bestScores.ios)}>
                      <span className={`font-bold ${b.cx.app_rating_ios >= 4.5 ? 'text-success' : b.cx.app_rating_ios >= 4.0 ? 'text-primary' : 'text-danger'}`}>
                        {b.cx.app_rating_ios}
                      </span>
                    </CellHighlight>
                  ) : '—'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface-2 hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface-2 z-10">App Rating (Android)</td>
              {banks.map(b => (
                <td key={b.key} className="p-3 text-center">
                  {b.cx ? (
                    <CellHighlight best={isBest(b.cx.app_rating_android, bestScores.android)}>
                      <span className={`font-bold ${b.cx.app_rating_android >= 4.5 ? 'text-success' : b.cx.app_rating_android >= 4.0 ? 'text-primary' : 'text-danger'}`}>
                        {b.cx.app_rating_android}
                      </span>
                    </CellHighlight>
                  ) : '—'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface z-10">Digital Maturity</td>
              {banks.map(b => (
                <td key={b.key} className="p-3 text-center font-bold">{b.cx?.digital_maturity || '—'}</td>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface-2 hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface-2 z-10">NPS Estimate</td>
              {banks.map(b => (
                <td key={b.key} className="p-3 text-center">{b.cx?.nps_estimate || '—'}</td>
              ))}
            </tr>
            <tr className="border-b border-border hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface z-10">CX Strengths</td>
              {banks.map(b => (
                <td key={b.key} className="p-3">
                  {b.cx?.cx_strengths?.length > 0 ? (
                    <div className="space-y-0.5">{b.cx.cx_strengths.slice(0, 3).map((s, i) => (
                      <div key={i} className="text-[10px] text-success bg-success-subtle px-1.5 py-0.5 rounded truncate">✓ {s}</div>
                    ))}{b.cx.cx_strengths.length > 3 && <div className="text-[9px] text-fg-disabled">+{b.cx.cx_strengths.length - 3} more</div>}</div>
                  ) : '—'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface-2 hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface-2 z-10">CX Weaknesses</td>
              {banks.map(b => (
                <td key={b.key} className="p-3">
                  {b.cx?.cx_weaknesses?.length > 0 ? (
                    <div className="space-y-0.5">{b.cx.cx_weaknesses.slice(0, 3).map((w, i) => (
                      <div key={i} className="text-[10px] text-danger bg-danger-subtle px-1.5 py-0.5 rounded truncate">✗ {w}</div>
                    ))}{b.cx.cx_weaknesses.length > 3 && <div className="text-[9px] text-fg-disabled">+{b.cx.cx_weaknesses.length - 3} more</div>}</div>
                  ) : '—'}
                </td>
              ))}
            </tr>

            {/* SECTION: Competitive Landscape */}
            <SectionRow label="Competition" icon={<AlertTriangle size={12} />} />
            <tr className="border-b border-border hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface z-10">Core Banking</td>
              {banks.map(b => (
                <td key={b.key} className="p-3 text-center text-fg-subtle">{b.comp?.core_banking || '—'}</td>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface-2 hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface-2 z-10">Digital Platform</td>
              {banks.map(b => (
                <td key={b.key} className="p-3 text-center text-fg-subtle">{b.comp?.digital_platform || '—'}</td>
              ))}
            </tr>
            <tr className="border-b border-border hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface z-10">Key Vendors</td>
              {banks.map(b => (
                <td key={b.key} className="p-3">
                  {b.comp?.key_vendors?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">{b.comp.key_vendors.map((v, i) => (
                      <span key={i} className="text-[10px] bg-surface-2 px-1.5 py-0.5 rounded text-fg-subtle">{v}</span>
                    ))}</div>
                  ) : '—'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface-2 hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface-2 z-10">Vendor Risk</td>
              {banks.map(b => (
                <td key={b.key} className="p-3 text-[11px] text-fg-subtle">{b.comp?.vendor_risk || '—'}</td>
              ))}
            </tr>

            {/* SECTION: Landing Zones */}
            <SectionRow label="Backbase Landing Zones" icon={<Zap size={12} />} />
            {(() => {
              const maxZones = Math.max(...banks.map(b => b.d?.backbase_landing_zones?.length || 0));
              return Array.from({ length: Math.min(maxZones, 4) }, (_, i) => (
                <tr key={`lz-${i}`} className={`border-b border-border hover-row ${i % 2 === 0 ? '' : 'bg-surface-2'}`}>
                  <td className={`p-3 font-bold text-fg sticky left-0 z-10 ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-2'}`}>Zone {i + 1}</td>
                  {banks.map(b => {
                    const lz = b.d?.backbase_landing_zones?.[i];
                    return (
                      <td key={b.key} className="p-3">
                        {lz ? (
                          <div>
                            <div className="text-[11px] font-bold text-fg">{lz.zone}</div>
                            <div className="text-[10px] text-fg-muted mt-0.5 max-w-[160px] truncate">{lz.rationale?.substring(0, 80)}...</div>
                            <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: scoreColor(lz.fit_score) + '20', color: scoreColor(lz.fit_score) }}>Fit: {lz.fit_score}/10</span>
                          </div>
                        ) : <span className="text-fg-disabled">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ));
            })()}

            {/* SECTION: Strategy */}
            <SectionRow label="Value & Strategy" icon={<Zap size={12} />} />
            <tr className="border-b border-border hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface z-10">Value Hypothesis</td>
              {banks.map(b => (
                <td key={b.key} className="p-3 text-[11px] text-fg-subtle italic max-w-[200px]">
                  {b.vs?.value_hypothesis?.one_liner ? `"${b.vs.value_hypothesis.one_liner.substring(0, 100)}..."` : '—'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface-2 hover-row">
              <td className="p-3 font-bold text-fg sticky left-0 bg-surface-2 z-10">Recommended Approach</td>
              {banks.map(b => (
                <td key={b.key} className="p-3 text-[11px] text-fg-subtle max-w-[200px]">{b.d?.recommended_approach?.substring(0, 120) || '—'}{b.d?.recommended_approach?.length > 120 ? '...' : ''}</td>
              ))}
            </tr>

            {/* SECTION: Operational KPIs */}
            <SectionRow label="Operational Profile" icon={<ExternalLink size={12} />} />
            {banks[0]?.d?.kpis && (
              <>
                {banks[0].d.kpis.slice(0, 6).map((kpi, i) => (
                  <tr key={`kpi-${i}`} className={`border-b border-border hover-row ${i % 2 === 0 ? '' : 'bg-surface-2'}`}>
                    <td className={`p-3 font-bold text-fg sticky left-0 z-10 ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-2'}`}>{kpi.label}</td>
                    {banks.map(b => {
                      const k = b.d?.kpis?.find(k2 => k2.label === kpi.label);
                      return <td key={b.key} className="p-3 text-center font-bold text-primary">{k?.value || '—'}</td>;
                    })}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Radar chart overlay — shows multiple banks on one radar
 */
function RadarOverlay({ banks, dims, colors }) {
  const labels = dims.map(([, fw]) => fw.label);
  const datasets = banks.map((b, i) => ({
    label: b.d?.bank_name || b.key,
    data: dims.map(([dim]) => b.qd?.[dim]?.score || 0),
    backgroundColor: colors[i] + '20',
    borderColor: colors[i],
    borderWidth: 2,
    pointBackgroundColor: colors[i],
    pointRadius: 3,
    pointHoverRadius: 5,
  }));

  const data = { labels, datasets };
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (ctx) => ctx[0]?.label,
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}/10`,
        },
      },
    },
    scales: {
      r: {
        min: 0, max: 10,
        ticks: { stepSize: 2, font: { size: 9 }, backdropColor: 'transparent' },
        pointLabels: { font: { size: 10, weight: 'bold' } },
        grid: { color: '#E9ECEF' },
        angleLines: { color: '#E9ECEF' },
      },
    },
  };

  return <RadarJS data={data} options={options} />;
}
