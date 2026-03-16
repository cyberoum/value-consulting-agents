import { AlertTriangle, Target, Swords, Zap, Newspaper } from 'lucide-react';

export default function ContextTab({ bankKey, data, q, comp, aiAnalysis, liveNews, topPainPoints }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {q?.risk && (
        <div className="p-3 bg-danger-subtle border border-danger/20 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={12} className="text-danger" />
            <span className="text-[10px] font-bold text-danger uppercase">Risk</span>
          </div>
          <p className="text-xs text-fg-subtle">{q.risk}</p>
        </div>
      )}

      {comp && (
        <div className="p-3 bg-surface border border-border rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Swords size={12} className="text-fg-muted" />
            <span className="text-[10px] font-bold text-fg-muted uppercase">Competition</span>
          </div>
          <div className="text-xs text-fg-subtle space-y-0.5">
            {comp.core_banking && <div><span className="font-bold text-fg-muted">Core:</span> {comp.core_banking}</div>}
            {comp.digital_platform && <div><span className="font-bold text-fg-muted">Digital:</span> {comp.digital_platform}</div>}
          </div>
          {comp.vendor_risk && <p className="text-[10px] text-warning italic mt-1">{comp.vendor_risk}</p>}
        </div>
      )}

      {aiAnalysis && aiAnalysis.signals?.length > 0 && (
        <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={12} className="text-violet-600" />
            <span className="text-[10px] font-bold text-violet-700 uppercase">AI Intelligence</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600">{aiAnalysis.signals.length} signals</span>
          </div>
          <p className="text-xs text-fg-subtle">{aiAnalysis.signals[0]?.signal}</p>
          {aiAnalysis.signals[0]?.implication && (
            <p className="text-[10px] text-fg-disabled mt-0.5">{aiAnalysis.signals[0].implication}</p>
          )}
        </div>
      )}

      {liveNews.length > 0 && (
        <div className="p-3 bg-surface border border-border rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Newspaper size={12} className="text-fg-muted" />
            <span className="text-[10px] font-bold text-fg-muted uppercase">Latest News</span>
          </div>
          <div className="space-y-1">
            {liveNews.map((article, i) => (
              <a key={i} href={article.link} target="_blank" rel="noopener" className="block text-xs text-primary hover:underline truncate">
                {article.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {topPainPoints.length > 0 && (
        <div className="p-3 bg-danger-subtle/50 border border-danger/10 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Target size={12} className="text-danger" />
            <span className="text-[10px] font-bold text-danger uppercase">Key Pain Points</span>
          </div>
          <div className="space-y-1">
            {topPainPoints.map((p, i) => (
              <div key={i}>
                <div className="text-xs font-bold text-fg">{p.title}</div>
                <div className="text-[10px] text-fg-muted line-clamp-1">{p.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recommended_approach && (
        <div className="p-3 bg-primary-50 border border-primary/10 rounded-lg sm:col-span-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Target size={12} className="text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase">Recommended Approach</span>
          </div>
          <p className="text-xs text-fg-subtle leading-relaxed">{data.recommended_approach}</p>
        </div>
      )}
    </div>
  );
}
