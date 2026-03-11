import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { scoreColor } from '../../data/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function BarChart({ items, height = 200 }) {
  // items: [{ name, score }]
  const data = {
    labels: items.map(i => i.name),
    datasets: [{
      data: items.map(i => i.score),
      backgroundColor: items.map(i => scoreColor(i.score) + '33'),
      borderColor: items.map(i => scoreColor(i.score)),
      borderWidth: 2,
      borderRadius: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { min: 0, max: 10, grid: { color: '#E9ECEF' }, ticks: { font: { size: 10 } } },
      y: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' } } },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
}
