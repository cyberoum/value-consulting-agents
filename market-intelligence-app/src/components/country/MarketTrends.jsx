import { useState } from 'react';
import { TrendingUp, ArrowRightLeft, FileText, Zap, Users, Leaf, Filter, Calendar, ExternalLink } from 'lucide-react';

const TREND_CATEGORIES = {
  digital_transformation: { label: 'Digital', icon: Zap, color: '#0E7490' },
  m_and_a: { label: 'M&A', icon: ArrowRightLeft, color: '#7C3AED' },
  regulation: { label: 'Regulation', icon: FileText, color: '#DC2626' },
  fintech: { label: 'Fintech', icon: TrendingUp, color: '#059669' },
  consumer: { label: 'Consumer', icon: Users, color: '#2563EB' },
  sustainability: { label: 'ESG', icon: Leaf, color: '#16A34A' },
};

const IMPACT_BADGE = {
  high: 'bg-[var(--nova-cooling-light)] text-[var(--nova-cooling)]',
  medium: 'bg-[var(--nova-accreting-light)] text-[var(--nova-accreting)]',
  low: 'bg-[var(--bg-secondary)] text-[var(--text-muted)]',
};

const DEAL_TYPE_ICON = {
  acquisition: '🤝',
  partnership: '🔗',
  funding: '💰',
  divestment: '📤',
};

export default function MarketTrends({ data, countryName }) {
  const [activeFilter, setActiveFilter] = useState(null);

  if (!data) {
    return (
      <div className="nova-card text-center py-10">
        <TrendingUp size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
        <p className="text-sm font-bold text-[var(--text-secondary)]">Market trends not yet available for {countryName}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Click "Enrich with AI" to generate market intelligence.</p>
      </div>
    );
  }

  const trends = (data.trends || []).filter(t => !activeFilter || t.category === activeFilter);
  const deals = data.recent_deals || [];
  const dtScore = data.digital_transformation_score;

  return (
    <div className="space-y-5">
      {/* Digital Transformation Score */}
      {dtScore != null && (
        <div className="flex items-center gap-3 p-3 bg-white rounded-[var(--il-radius)] border border-[var(--border-subtle)] shadow-[var(--color-il-card-shadow)]">
          <div className={`text-2xl font-black ${dtScore >= 7 ? 'text-[var(--nova-radiant)]' : dtScore >= 4 ? 'text-[var(--nova-accreting)]' : 'text-[var(--nova-cooling)]'}`}>
            {dtScore}/10
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)]">Digital Transformation Score</div>
            <div className="text-[10px] text-[var(--text-muted)]">Overall market digital maturity assessment</div>
          </div>
        </div>
      )}

      {/* Trends Section */}
      <div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <h4 className="nova-label">Market Trends</h4>
          <div className="flex-1" />
          {Object.entries(TREND_CATEGORIES).map(([key, cat]) => {
            const Icon = cat.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(activeFilter === key ? null : key)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold transition-colors ${
                  activeFilter === key
                    ? 'text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
                style={activeFilter === key ? { backgroundColor: cat.color } : {}}
              >
                <Icon size={10} /> {cat.label}
              </button>
            );
          })}
        </div>

        {trends.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] italic text-center py-4">No trends matching filter</p>
        ) : (
          <div className="space-y-2">
            {trends.map((t, i) => {
              const cat = TREND_CATEGORIES[t.category] || TREND_CATEGORIES.fintech;
              const CatIcon = cat.icon;
              const impact = IMPACT_BADGE[t.impact] || IMPACT_BADGE.low;
              return (
                <div key={i} className="nova-card-enter p-3 bg-white rounded-[var(--il-radius)] border border-[var(--border-subtle)] shadow-[var(--color-il-card-shadow)] hover:shadow-[var(--color-il-card-shadow-hover)] transition-shadow"
                  style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + '15' }}>
                      <CatIcon size={12} style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-[var(--text-primary)]">{t.title}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${impact}`}>{t.impact}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">{t.summary}</p>
                      {t.date && (
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar size={8} className="text-[var(--text-muted)]" />
                          <span className="text-[9px] text-[var(--text-muted)]">{t.date}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Deals */}
      {deals.length > 0 && (
        <div>
          <h4 className="nova-label mb-2">Recent Deals & Transactions</h4>
          <div className="space-y-2">
            {deals.map((d, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-white rounded-[var(--il-radius)] border border-[var(--border-subtle)]">
                <span className="text-lg shrink-0">{DEAL_TYPE_ICON[d.type] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{d.parties?.join(' + ')}</span>
                    <span className="text-[8px] font-bold text-[var(--text-muted)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded uppercase">{d.type}</span>
                    {d.value && <span className="text-[9px] font-bold text-[var(--nova-core)]">{d.value}</span>}
                  </div>
                  {d.significance && <p className="text-[10px] text-[var(--text-secondary)]">{d.significance}</p>}
                  {d.date && <span className="text-[9px] text-[var(--text-muted)]">{d.date}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
