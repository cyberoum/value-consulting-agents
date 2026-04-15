import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Database, Shield, CreditCard, Banknote, Brain, Globe, Smartphone, Fingerprint, TrendingUp, BarChart3, Wallet, ArrowRightLeft, Layers, Search } from 'lucide-react';
import VendorDetailCard from './VendorDetailCard';

// Map category IDs to lucide icons and default colors
const CATEGORY_META = {
  cbs:                   { icon: Database,       color: '#6366F1' },
  engagement_banking:    { icon: Layers,         color: '#0E7490' },
  payments:              { icon: Banknote,        color: '#059669' },
  cards:                 { icon: CreditCard,      color: '#D97706' },
  aml_compliance:        { icon: Shield,          color: '#DC2626' },
  crm:                   { icon: Search,          color: '#2563EB' },
  wealth_management:     { icon: Wallet,          color: '#7C3AED' },
  lending_platforms:     { icon: Banknote,        color: '#0D9488' },
  ai_ml:                 { icon: Brain,           color: '#8B5CF6' },
  open_banking:          { icon: ArrowRightLeft,  color: '#0891B2' },
  channels:              { icon: Smartphone,      color: '#EA580C' },
  identity_verification: { icon: Fingerprint,     color: '#4F46E5' },
  trading:               { icon: TrendingUp,      color: '#16A34A' },
  data_analytics:        { icon: BarChart3,       color: '#64748B' },
};

const PRESENCE_DOT = {
  strong: 'bg-[var(--nova-radiant)]',
  moderate: 'bg-[var(--nova-accreting)]',
  emerging: 'bg-[var(--nova-dormant)]',
  exiting: 'bg-[var(--nova-cooling)]',
};

const MATURITY_BADGE = {
  emerging: 'bg-slate-100 text-slate-600',
  growing: 'bg-amber-50 text-amber-700',
  mature: 'bg-blue-50 text-blue-700',
  advanced: 'bg-emerald-50 text-emerald-700',
};

function CategoryCard({ category, isExpanded, onToggle, index }) {
  const meta = CATEGORY_META[category.id] || { icon: Globe, color: '#64748B' };
  const Icon = meta.icon;
  const vendors = category.vendors || [];
  const preview = vendors.slice(0, 4);
  const remaining = vendors.length - preview.length;

  return (
    <div
      className={`nova-card-enter rounded-[var(--il-radius)] border-l-[4px] bg-white overflow-hidden transition-shadow ${
        isExpanded ? 'shadow-[var(--color-il-card-shadow-hover)] col-span-full' : 'shadow-[var(--color-il-card-shadow)] hover:shadow-[var(--color-il-card-shadow-hover)]'
      }`}
      style={{ borderLeftColor: meta.color, animationDelay: `${index * 0.05}s` }}
    >
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-[var(--bg-secondary)] transition-colors"
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: meta.color + '15' }}>
          <Icon size={14} style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-[var(--text-primary)]">{category.name}</div>
          {!isExpanded && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {preview.map((v, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[9px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRESENCE_DOT[v.presence] || PRESENCE_DOT.emerging}`} />
                  {v.name}
                </span>
              ))}
              {remaining > 0 && (
                <span className="text-[9px] text-[var(--text-muted)] font-bold">+{remaining}</span>
              )}
            </div>
          )}
        </div>
        <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }}>
          {vendors.length}
        </span>
        <ChevronDown
          size={14}
          className={`text-[var(--text-muted)] transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-[var(--border-subtle)]">
              {category.description && (
                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed pt-2">{category.description}</p>
              )}
              {vendors.map((v, i) => (
                <VendorDetailCard key={i} vendor={v} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FintechLandscapeGrid({ data, countryName }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!data) {
    return (
      <div className="nova-card text-center py-10">
        <Globe size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
        <p className="text-sm font-bold text-[var(--text-secondary)]">Fintech landscape not yet available for {countryName}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Click "Enrich with AI" to generate market intelligence.</p>
      </div>
    );
  }

  const categories = data.categories || [];
  const totalVendors = categories.reduce((sum, c) => sum + (c.vendors?.length || 0), 0);
  const maturityBadge = MATURITY_BADGE[data.maturity_level] || MATURITY_BADGE.emerging;

  return (
    <div>
      {/* Summary header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Fintech Landscape</h3>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${maturityBadge}`}>
          {data.maturity_level?.charAt(0).toUpperCase() + data.maturity_level?.slice(1)} Market
        </span>
        <span className="text-[9px] text-[var(--text-muted)]">{totalVendors} vendors across {categories.length} categories</span>
        <div className="flex-1" />
        {/* Presence legend */}
        <div className="flex items-center gap-3">
          {[
            { label: 'Strong', dot: PRESENCE_DOT.strong },
            { label: 'Moderate', dot: PRESENCE_DOT.moderate },
            { label: 'Emerging', dot: PRESENCE_DOT.emerging },
          ].map(l => (
            <span key={l.label} className="inline-flex items-center gap-1 text-[8px] text-[var(--text-muted)]">
              <span className={`w-1.5 h-1.5 rounded-full ${l.dot}`} /> {l.label}
            </span>
          ))}
        </div>
      </div>

      {data.summary && (
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-4">{data.summary}</p>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat, i) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            index={i}
            isExpanded={expandedId === cat.id}
            onToggle={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
          />
        ))}
      </div>
    </div>
  );
}
