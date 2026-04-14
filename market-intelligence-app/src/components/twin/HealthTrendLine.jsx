import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js';
import { getDealTwinHistory } from '../../data/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

export default function HealthTrendLine({ dealId }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getDealTwinHistory(dealId).then(setHistory).catch(() => {});
  }, [dealId]);

  if (history.length < 2) {
    return <div className="text-[9px] text-slate-300 italic text-center py-2">Not enough history for trend</div>;
  }

  const sorted = [...history].sort((a, b) => new Date(a.snapshot_date) - new Date(b.snapshot_date));

  const data = {
    labels: sorted.map(h => new Date(h.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      data: sorted.map(h => h.deal_health_score),
      borderColor: '#0e7490',
      backgroundColor: 'rgba(14, 116, 144, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: '#0e7490',
      borderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8' } },
      y: { min: 0, max: 100, grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 }, color: '#94a3b8', stepSize: 25 } },
    },
  };

  return (
    <div>
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Health Trend</div>
      <div style={{ height: 80 }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
