import { useState } from 'react';
import { Sparkles, Loader, AlertTriangle, Target, Zap, Shield, TrendingUp, Compass, ArrowRight, RefreshCw } from 'lucide-react';
import { generateStrategicSnapshot, getCachedAccountPlan } from '../../data/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * AccountSnapshotSection — the strategic hero of the account plan.
 *
 * Six cards (2x3 grid):
 *   1. Strategic Initiatives Summary  (what the bank is driving)
 *   2. Partner Plan                    (our GTM approach for this account)
 *   3. Responsive Measures             (what we do WHEN the bank acts)
 *   4. Proactive Measures              (what we initiate to move the deal)
 *   5. Potential Risks                 (what could derail us)
 *   6. Backbase Position               (where we fit, where we don't)
 * Plus: Next Steps (full-width bottom row)
 *
 * Caching: reads from account_plans table via getCachedAccountPlan.
 * Generation: POST /api/banks/:key/strategic-snapshot triggers AI regen.
 */

const CARDS = [
  { key: 'strategic_initiatives_summary', label: 'Strategic Initiatives', icon: Target,     color: '#6366F1', borderColor: 'border-l-indigo-500' },
  { key: 'partner_plan',                   label: 'Partner Plan',          icon: Compass,    color: '#0E7490', borderColor: 'border-l-cyan-700' },
  { key: 'responsive_measures',            label: 'Responsive Measures',   icon: Shield,     color: '#059669', borderColor: 'border-l-emerald-600' },
  { key: 'proactive_measures',             label: 'Proactive Measures',    icon: Zap,        color: '#D97706', borderColor: 'border-l-amber-600' },
  { key: 'potential_risks',                label: 'Potential Risks',       icon: AlertTriangle, color: '#DC2626', borderColor: 'border-l-red-600' },
  { key: 'backbase_position',              label: 'Backbase Position',     icon: TrendingUp, color: '#7C3AED', borderColor: 'border-l-violet-600' },
];

function SnapshotCard({ card, content }) {
  const Icon = card.icon;
  const items = Array.isArray(content) ? content : (content ? [content] : []);
  return (
    <div className={`nova-card nova-card-enter border-l-[3px] ${card.borderColor} overflow-hidden`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: card.color + '15' }}>
          <Icon size={12} style={{ color: card.color }} />
        </div>
        <span className="nova-label">{card.label}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-[10px] text-[var(--text-muted)] italic">Not yet generated</p>
      ) : items.length === 1 && typeof items[0] === 'string' ? (
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{items[0]}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-[var(--text-secondary)] leading-relaxed">
              <span className="text-[var(--text-muted)] shrink-0">•</span>
              <span>{typeof it === 'string' ? it : (it.text || JSON.stringify(it))}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AccountSnapshotSection({ bankKey, bankName }) {
  const qc = useQueryClient();
  const [genError, setGenError] = useState(null);

  // Fetch cached plan; 404 is fine (just means "not generated yet")
  const { data: cached, isLoading } = useQuery({
    queryKey: ['account-plan', bankKey, 'strategic-snapshot'],
    queryFn: async () => {
      try {
        const result = await getCachedAccountPlan(bankKey);
        return result?.result?.strategic_snapshot || null;
      } catch (err) {
        if (err?.message?.includes('404')) return null;
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!bankKey,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateStrategicSnapshot(bankKey),
    onSuccess: () => {
      setGenError(null);
      qc.invalidateQueries({ queryKey: ['account-plan', bankKey] });
    },
    onError: (err) => {
      const msg = err?.message || '';
      if (msg.includes('503') || msg.includes('API_KEY')) {
        setGenError('ANTHROPIC_API_KEY not configured. Set it in .env and restart the API.');
      } else {
        setGenError(msg || 'Generation failed');
      }
    },
  });

  const hasSnapshot = cached && Object.keys(cached).some(k => cached[k]);

  // ── Empty state: no snapshot yet, show CTA ──
  if (!isLoading && !hasSnapshot) {
    return (
      <div className="nova-card text-center py-12">
        <Sparkles size={32} className="mx-auto mb-3 text-[var(--nova-core)]" />
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
          No strategic snapshot yet for {bankName}
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-4 max-w-md mx-auto">
          Generate an AI-powered strategic snapshot covering initiatives, partner plan, risks, and Backbase positioning for this account.
        </p>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[var(--nova-core)] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {generateMutation.isPending ? (
            <><Loader size={12} className="animate-spin" /> Analyzing account…</>
          ) : (
            <><Sparkles size={12} /> Generate Strategic Snapshot</>
          )}
        </button>
        {genError && (
          <p className="text-[10px] text-[var(--nova-cooling)] mt-3">{genError}</p>
        )}
      </div>
    );
  }

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-[var(--text-muted)] text-xs">
        <Loader size={14} className="animate-spin mr-2" /> Loading snapshot…
      </div>
    );
  }

  // ── Loaded snapshot with 6 cards + next steps ──
  const nextSteps = cached.next_steps;
  return (
    <div>
      {/* Refresh control */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-[var(--text-muted)]">
          {cached._generated_at ? `Generated ${new Date(cached._generated_at).toLocaleDateString()}` : 'Strategic analysis'}
        </span>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--nova-core)] hover:opacity-70 disabled:opacity-40"
        >
          {generateMutation.isPending ? <Loader size={10} className="animate-spin" /> : <RefreshCw size={10} />}
          Regenerate
        </button>
      </div>

      {genError && (
        <div className="mb-3 p-2 bg-[var(--nova-cooling-light)] border border-[var(--nova-cooling)] rounded-lg text-[10px] text-[var(--nova-cooling)]">
          {genError}
        </div>
      )}

      {/* 6-card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {CARDS.map(card => (
          <SnapshotCard key={card.key} card={card} content={cached[card.key]} />
        ))}
      </div>

      {/* Next Steps (full-width emphasized card) */}
      {nextSteps && (
        <div className="mt-4 p-4 rounded-[var(--il-radius)] bg-gradient-to-r from-[var(--nova-core-light)] to-[var(--bg-surface)] border border-[var(--nova-core)]">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight size={14} className="text-[var(--nova-core)]" />
            <span className="nova-label" style={{ color: 'var(--nova-core)' }}>Next Steps</span>
          </div>
          {Array.isArray(nextSteps) ? (
            <ol className="space-y-2">
              {nextSteps.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-primary)]">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--nova-core)] text-white text-[9px] font-black shrink-0 mt-0.5">{i + 1}</span>
                  <span className="leading-relaxed">{typeof s === 'string' ? s : (s.action || s.text || JSON.stringify(s))}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-[var(--text-primary)] leading-relaxed">{nextSteps}</p>
          )}
        </div>
      )}
    </div>
  );
}
