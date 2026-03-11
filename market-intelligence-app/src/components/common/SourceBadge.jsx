import { Database } from 'lucide-react';

// Shows data source count and confidence for a section
export default function SourceBadge({ sourceCount, confidence }) {
  if (!sourceCount && !confidence) return null;

  const color = confidence === 'high' ? 'text-success' :
                confidence === 'medium' ? 'text-warning' :
                'text-fg-disabled';
  const bg = confidence === 'high' ? 'bg-success-subtle' :
             confidence === 'medium' ? 'bg-warning-subtle' :
             'bg-surface-2';

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${color} ${bg}`}>
      <Database size={9} />
      {sourceCount && <span>{sourceCount} src{sourceCount > 1 ? 's' : ''}</span>}
    </span>
  );
}
