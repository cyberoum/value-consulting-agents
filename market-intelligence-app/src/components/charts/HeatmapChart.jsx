import { motion } from 'framer-motion';

const fitColors = {
  high: { bg: '#E8F5E9', text: '#2E7D32', label: 'High' },
  medium: { bg: '#FFF8E1', text: '#F57F17', label: 'Med' },
  low: { bg: '#FFF0EE', text: '#FF7262', label: 'Low' },
  none: { bg: '#F8F9FA', text: '#ADB5BD', label: '—' },
};

function classifyFit(val) {
  if (!val) return 'none';
  const v = String(val).toLowerCase();
  if (v.includes('high') || v.includes('strong') || v.includes('yes')) return 'high';
  if (v.includes('medium') || v.includes('moderate') || v.includes('partial')) return 'medium';
  if (v.includes('low') || v.includes('weak') || v.includes('no')) return 'low';
  return 'none';
}

export default function HeatmapChart({ banks, products }) {
  if (!banks?.length || !products?.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left text-fg-muted font-semibold sticky left-0 bg-surface z-10">Bank</th>
            {products.map(p => (
              <th key={p} className="p-2 text-center text-fg-muted font-semibold capitalize whitespace-nowrap">
                {p.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {banks.map((bank, rowIdx) => (
            <tr key={bank.key} className="border-t border-border/30">
              <td className="p-2 font-semibold text-fg sticky left-0 bg-surface z-10 whitespace-nowrap">
                {bank.name}
              </td>
              {products.map((p, colIdx) => {
                const fit = classifyFit(bank.productFit?.[p]);
                const style = fitColors[fit];
                return (
                  <td key={p} className="p-1.5 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: rowIdx * 0.03 + colIdx * 0.02 }}
                      className="rounded-md px-2 py-1.5 text-[10px] font-bold"
                      style={{ backgroundColor: style.bg, color: style.text }}
                    >
                      {style.label}
                    </motion.div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
