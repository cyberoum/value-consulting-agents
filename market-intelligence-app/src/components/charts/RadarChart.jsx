import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

export default function RadarChart({ scores, labels, size = 220 }) {
  const data = {
    labels,
    datasets: [{
      data: scores,
      backgroundColor: 'rgba(51, 102, 255, 0.15)',
      borderColor: '#3366FF',
      borderWidth: 2,
      pointBackgroundColor: '#3366FF',
      pointRadius: 3,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      r: {
        min: 0, max: 10,
        ticks: { stepSize: 2, font: { size: 9 }, color: '#868E96', backdropColor: 'transparent' },
        pointLabels: { font: { size: 10, weight: '600' }, color: '#495057' },
        grid: { color: '#E9ECEF' },
        angleLines: { color: '#E9ECEF' },
      }
    }
  };

  return (
    <div style={{ width: size, height: size }}>
      <Radar data={data} options={options} />
    </div>
  );
}
