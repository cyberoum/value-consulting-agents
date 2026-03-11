import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { scoreColor } from '../../data/utils';

ChartJS.register(ArcElement, Tooltip);

export default function ScoreGauge({ score, max = 10, size = 120, label }) {
  const pct = Math.min(score / max, 1);
  const color = scoreColor(score);
  const remaining = max - score;

  const data = {
    datasets: [{
      data: [score, remaining],
      backgroundColor: [color, '#E9ECEF'],
      borderWidth: 0,
      cutout: '78%',
    }],
  };

  const options = {
    responsive: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    rotation: -90,
    circumference: 180,
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 10 }}>
        <Doughnut data={data} options={options} width={size} height={size / 2 + 10} />
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="text-2xl font-black" style={{ color }}>{score}</span>
        </div>
      </div>
      {label && <div className="text-xs text-fg-muted mt-1 font-semibold uppercase tracking-wide">{label}</div>}
    </div>
  );
}
