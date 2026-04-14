import { useState, useEffect } from 'react';
import { Loader, RefreshCw, AlertTriangle, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { getDealTwin, recalculateDealTwin } from '../../data/api';
import HealthTrendLine from './HealthTrendLine';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

const DIMENSIONS = [
  { key: 'stakeholder_alignment', label: 'Stakeholders', short: 'Stakeholders' },
  { key: 'strategic_fit', label: 'Strategic Fit', short: 'Strategy' },
  { key: 'competitive_position', label: 'Competitive', short: 'Competitive' },
  { key: 'momentum', label: 'Momentum', short: 'Momentum' },
  { key: 'value_clarity', label: 'Value Clarity', short: 'Value' },
  { key: 'information_completeness', label: 'Info Completeness', short: 'Intel' },
];

const TREND_ICONS = {
  improving: { icon: TrendingUp, color: 'text-emerald-500', label: 'Improving' },
  stable: { icon: Minus, color: 'text-slate-400', label: 'Stable' },
  declining: { icon: TrendingDown, color: 'text-red-500', label: 'Declining' },
};

const SEVERITY_COLORS = {
  high: 'border-l-red-500 bg-red-50',
  medium: 'border-l-amber-400 bg-amber-50',
  low: 'border-l-slate-300 bg-slate-50',
};

function ScoreDisplay({ score, trend }) {
  const t = TREND_ICONS[trend] || TREND_ICONS.stable;
  const TrendIcon = t.icon;
  const color = score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="text-center">
      <div className={`text-4xl font-black ${color}`}>{Math.round(score)}</div>
      <div className={`flex items-center justify-center gap-1 mt-1 text-xs font-bold ${t.color}`}>
        <TrendIcon size={14} /> {t.label}
      </div>
      <div className="text-[9px] text-slate-400 mt-0.5">Deal Health Score</div>
    </div>
  );
}

function DimensionBar({ label, score }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-600 w-8 text-right">{Math.round(score)}</span>
    </div>
  );
}

export default function DealHealthDashboard({ dealId }) {
  const [twin, setTwin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const fetchTwin = async () => {
    try {
      const data = await getDealTwin(dealId);
      setTwin(data);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchTwin(); }, [dealId]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const result = await recalculateDealTwin(dealId);
      setTwin(result);
    } catch { /* silent */ }
    setRecalculating(false);
  };

  if (loading) {
    return <div className="flex items-center gap-2 py-4 justify-center text-slate-400 text-xs"><Loader size={14} className="animate-spin" /> Loading deal health...</div>;
  }

  if (!twin || !twin.deal_health_score) {
    return (
      <div className="bg-white rounded-[var(--il-radius)] border border-slate-100 p-4 text-center shadow-[var(--color-il-card-shadow)]">
        <p className="text-xs text-slate-400 mb-2">No deal health calculated yet.</p>
        <button onClick={handleRecalculate} disabled={recalculating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[var(--color-il-accent)] hover:opacity-90 disabled:opacity-50">
          {recalculating ? <Loader size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {recalculating ? 'Calculating...' : 'Calculate Deal Health'}
        </button>
      </div>
    );
  }

  // Radar chart data
  const radarData = {
    labels: DIMENSIONS.map(d => d.short),
    datasets: [{
      data: DIMENSIONS.map(d => twin[d.key] || 50),
      backgroundColor: 'rgba(14, 116, 144, 0.15)',
      borderColor: '#0e7490',
      borderWidth: 2,
      pointBackgroundColor: '#0e7490',
      pointRadius: 3,
    }],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        min: 0, max: 100,
        ticks: { stepSize: 25, display: false },
        grid: { color: '#e2e8f0' },
        pointLabels: { font: { size: 10, weight: '600' }, color: '#64748b' },
      },
    },
  };

  const risks = twin.top_risks || [];
  const actions = twin.recommended_actions || [];

  return (
    <div className="bg-white rounded-[var(--il-radius)] border border-slate-100 shadow-[var(--color-il-card-shadow)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deal Health</span>
        <button onClick={handleRecalculate} disabled={recalculating}
          className="flex items-center gap-1 text-[9px] font-bold text-[var(--color-il-accent)] hover:opacity-70 disabled:opacity-40">
          {recalculating ? <Loader size={10} className="animate-spin" /> : <RefreshCw size={10} />}
          Recalculate
        </button>
      </div>

      <div className="p-4">
        {/* Score + Radar */}
        <div className="flex items-center gap-4 mb-4">
          <ScoreDisplay score={twin.deal_health_score} trend={twin.deal_health_trend} />
          <div className="flex-1" style={{ maxHeight: 160 }}>
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        {/* Dimension bars */}
        <div className="space-y-1.5 mb-4">
          {DIMENSIONS.map(d => (
            <DimensionBar key={d.key} label={d.label} score={twin[d.key] || 50} />
          ))}
        </div>

        {/* Trend line */}
        <HealthTrendLine dealId={dealId} />

        {/* Risks */}
        {risks.length > 0 && (
          <div className="mt-4">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Risks</div>
            <div className="space-y-1">
              {risks.map((risk, i) => (
                <div key={i} className={`p-2 rounded border-l-[3px] ${SEVERITY_COLORS[risk.severity] || SEVERITY_COLORS.medium}`}>
                  <div className="text-[10px] font-bold text-slate-700">{risk.risk}</div>
                  {risk.mitigation && <div className="text-[9px] text-slate-500 mt-0.5">{risk.mitigation}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {actions.length > 0 && (
          <div className="mt-4">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Recommended Actions</div>
            <div className="space-y-1">
              {actions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-[var(--color-il-accent-light)] rounded">
                  <ArrowRight size={10} className="text-[var(--color-il-accent)] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-700">{action.action}</div>
                    {action.rationale && <div className="text-[9px] text-slate-500">{action.rationale}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
