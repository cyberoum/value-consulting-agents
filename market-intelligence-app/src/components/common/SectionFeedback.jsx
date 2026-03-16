import { ThumbsUp, ThumbsDown } from 'lucide-react';

export default function SectionFeedback({ sectionId, getFeedback, setFeedbackFor }) {
  const current = getFeedback(sectionId);

  return (
    <div className="flex items-center gap-0.5 ml-2" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setFeedbackFor(sectionId, 'up')}
        className={`p-1 rounded transition-colors ${
          current === 'up'
            ? 'text-success bg-success-subtle'
            : 'text-fg-disabled hover:text-success hover:bg-success-subtle/50'
        }`}
        title="This data is useful"
      >
        <ThumbsUp size={11} />
      </button>
      <button
        onClick={() => setFeedbackFor(sectionId, 'down')}
        className={`p-1 rounded transition-colors ${
          current === 'down'
            ? 'text-danger bg-danger-subtle'
            : 'text-fg-disabled hover:text-danger hover:bg-danger-subtle/50'
        }`}
        title="This data needs improvement"
      >
        <ThumbsDown size={11} />
      </button>
    </div>
  );
}
