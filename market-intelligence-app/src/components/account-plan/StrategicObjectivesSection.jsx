import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Sparkles, Loader, ChevronDown, ArrowRight, FileText, Lightbulb, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStrategicObjectives, getCachedAccountPlan } from '../../data/api';

/**
 * StrategicObjectivesSection — AI-derived objectives + key initiatives.
 *
 * Each objective card expands to show:
 *   - How they'll execute it (from report or AI inference)
 *   - Backbase capability mapping
 *   - Confidence: from_report vs ai_inferred
 */

const CONFIDENCE_BADGE = {
  from_report:  { label: 'From Report',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ai_inferred:  { label: 'AI Inferred',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
  mixed:        { label: 'Mixed',        color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

function ObjectiveCard({ objective, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const initiatives = objective.key_initiatives || [];
  const confBadge = CONFIDENCE_BADGE[objective.confidence] || CONFIDENCE_BADGE.ai_inferred;

  return (
    <div className="nova-card nova-card-enter border-l-[3px] border-l-[var(--nova-core)]"
      style={{ animationDelay: `${index * 0.05}s` }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-start gap-3 text-left">
        <div className="w-6 h-6 rounded-full bg-[var(--nova-core)] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-[var(--text-primary)]">{objective.objective}</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${confBadge.color}`}>{confBadge.label}</span>
          </div>
          {objective.summary && (
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{objective.summary}</p>
          )}
          <div className="text-[10px] text-[var(--nova-core)] font-bold mt-1">
            {initiatives.length} key initiative{initiatives.length !== 1 ? 's' : ''}
          </div>
        </div>
        <ChevronDown size={14} className={`text-[var(--text-muted)] shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] space-y-3">
              {initiatives.map((init, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Lightbulb size={12} className="text-[var(--nova-accreting)] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[var(--text-primary)]">{init.name || init.initiative}</div>
                    {init.how && (
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-0.5">
                        <span className="font-bold">How: </span>{init.how}
                      </p>
                    )}
                    {init.backbase_capability && (
                      <div className="mt-1 flex items-start gap-1.5">
                        <ArrowRight size={10} className="text-[var(--nova-core)] mt-0.5 shrink-0" />
                        <div className="text-[11px]">
                          <span className="font-bold text-[var(--nova-core)]">Backbase: </span>
                          <span className="text-[var(--text-secondary)]">{init.backbase_capability}</span>
                        </div>
                      </div>
                    )}
                    {init.evidence && (
                      <p className="text-[9px] text-[var(--text-muted)] italic mt-0.5">↳ {init.evidence}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StrategicObjectivesSection({ bankKey, bankName }) {
  const qc = useQueryClient();
  const [error, setError] = useState(null);

  const { data: cached, isLoading } = useQuery({
    queryKey: ['account-plan', bankKey, 'strategic-objectives'],
    queryFn: async () => {
      try {
        const result = await getCachedAccountPlan(bankKey);
        return result?.result?.strategic_objectives || null;
      } catch (err) {
        if (err?.message?.includes('404')) return null;
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!bankKey,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateStrategicObjectives(bankKey),
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ['account-plan', bankKey] });
    },
    onError: (err) => {
      const msg = err?.message || '';
      if (msg.includes('503') || msg.includes('API_KEY')) {
        setError('ANTHROPIC_API_KEY not configured.');
      } else {
        setError(msg || 'Generation failed');
      }
    },
  });

  const objectives = cached?.objectives || [];

  if (!isLoading && objectives.length === 0) {
    return (
      <div className="nova-card text-center py-12">
        <Target size={32} className="mx-auto mb-3 text-[var(--nova-core)]" />
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">No strategic objectives analyzed yet</h3>
        <p className="text-xs text-[var(--text-muted)] mb-4 max-w-md mx-auto">
          AI will analyze {bankName}'s annual report, strategic initiatives, and pain points to derive
          concrete objectives and the key initiatives needed to execute them — with Backbase capability mapping.
        </p>
        <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[var(--nova-core)] hover:opacity-90 disabled:opacity-50">
          {generateMutation.isPending
            ? <><Loader size={12} className="animate-spin" /> Deriving initiatives…</>
            : <><Sparkles size={12} /> Analyze Strategic Objectives</>}
        </button>
        {error && <p className="text-[10px] text-[var(--nova-cooling)] mt-3">{error}</p>}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-[var(--text-muted)] text-xs">
        <Loader size={14} className="animate-spin mr-2" /> Loading objectives…
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-[var(--text-muted)]">
          {cached?._generated_at ? `Analyzed ${new Date(cached._generated_at).toLocaleDateString()}` : 'Strategic analysis'} — {objectives.length} objectives
        </span>
        <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--nova-core)] hover:opacity-70 disabled:opacity-40">
          {generateMutation.isPending ? <Loader size={10} className="animate-spin" /> : <RefreshCw size={10} />}
          Re-analyze
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-[var(--nova-cooling-light)] border border-[var(--nova-cooling)] rounded-lg text-[10px] text-[var(--nova-cooling)]">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {objectives.map((obj, i) => <ObjectiveCard key={i} objective={obj} index={i} />)}
      </div>

      {cached?.methodology_note && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          <div className="flex items-start gap-2">
            <FileText size={12} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
            <p className="text-[10px] text-[var(--text-muted)] italic leading-relaxed">{cached.methodology_note}</p>
          </div>
        </div>
      )}
    </div>
  );
}
