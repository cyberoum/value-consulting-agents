import { Bubble } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, Tooltip } from 'chart.js';
import { scoreColor } from '../../data/utils';

ChartJS.register(LinearScale, PointElement, Tooltip);

export default function BubbleChart({ items, height = 300 }) {
  // items: [{ name, score, dealValue, r }]
  const data = {
    datasets: items.map(item => ({
      label: item.name,
      data: [{ x: item.score, y: item.dealValue || item.score, r: item.r || 8 }],
      backgroundColor: scoreColor(item.score) + '40',
      borderColor: scoreColor(item.score),
      borderWidth: 2,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: Score ${ctx.raw.x}`
        }
      }
    },
    scales: {
      x: { min: 0, max: 10, title: { display: true, text: 'Fit Score', font: { size: 11 } }, grid: { color: '#E9ECEF' } },
      y: { min: 0, max: 10, title: { display: true, text: 'Opportunity', font: { size: 11 } }, grid: { color: '#E9ECEF' } },
    },
  };

  return (
    <div style={{ height }}>
      <Bubble data={data} options={options} />
    </div>
  );
}
