import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Target, Shield, AlertTriangle, TrendingUp, Users, X, Linkedin } from 'lucide-react';
import { generatePowerMap as apiGeneratePowerMap, getPowerMap as apiGetPowerMap } from '../../../data/api';

/* ── MEDDICC role colors ── */

const ROLE_COLORS = {
  economic_buyer:    { fill: '#F59E0B', label: 'Economic Buyer',    badge: 'bg-amber-500 text-white' },
  champion:          { fill: '#10B981', label: 'Champion',          badge: 'bg-emerald-500 text-white' },
  decision_criteria: { fill: '#3B82F6', label: 'Decision Criteria', badge: 'bg-blue-500 text-white' },
  decision_process:  { fill: '#6366F1', label: 'Decision Process',  badge: 'bg-indigo-500 text-white' },
  identify_pain:     { fill: '#8B5CF6', label: 'Identify Pain',     badge: 'bg-violet-500 text-white' },
  metrics:           { fill: '#0EA5E9', label: 'Metrics',           badge: 'bg-sky-500 text-white' },
  competition:       { fill: '#EF4444', label: 'Competition/Status Quo', badge: 'bg-red-500 text-white' },
};

const ENGAGEMENT_Y = { champion: 0, engaged: 0.25, neutral: 0.5, unaware: 0.75, blocker: 1 };
const ENGAGEMENT_LABELS = ['Champion', 'Engaged', 'Neutral', 'Unaware', 'Blocker'];

/* ── Time ago ── */

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/* ── 2x2 Matrix ── */

function InfluenceMatrix({ contacts, onSelectContact, selectedName }) {
  if (!contacts?.length) return null;

  const W = 100; // viewBox percentage
  const H = 100;
  const PAD = 8;

  return (
    <div className="relative border border-border rounded-lg bg-surface overflow-hidden" style={{ aspectRatio: '4/3' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {/* Grid lines */}
        <line x1={W / 2} y1={PAD} x2={W / 2} y2={H - PAD} stroke="currentColor" className="text-border" strokeWidth="0.2" strokeDasharray="1,1" />
        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="currentColor" className="text-border" strokeWidth="0.2" strokeDasharray="1,1" />

        {/* Quadrant labels */}
        <text x={W * 0.25} y={PAD + 4} textAnchor="middle" className="fill-fg-disabled" fontSize="2.5" fontWeight="700">HIGH INFLUENCE</text>
        <text x={W * 0.25} y={PAD + 6.5} textAnchor="middle" className="fill-fg-disabled" fontSize="2" fontWeight="400">ENGAGED</text>

        <text x={W * 0.75} y={PAD + 4} textAnchor="middle" className="fill-fg-disabled" fontSize="2.5" fontWeight="700">HIGH INFLUENCE</text>
        <text x={W * 0.75} y={PAD + 6.5} textAnchor="middle" className="fill-fg-disabled" fontSize="2" fontWeight="400">DISENGAGED</text>

        <text x={W * 0.25} y={H - PAD - 2} textAnchor="middle" className="fill-fg-disabled" fontSize="2.5" fontWeight="700">LOW INFLUENCE</text>
        <text x={W * 0.25} y={H - PAD + 0.5} textAnchor="middle" className="fill-fg-disabled" fontSize="2" fontWeight="400">ENGAGED</text>

        <text x={W * 0.75} y={H - PAD - 2} textAnchor="middle" className="fill-fg-disabled" fontSize="2.5" fontWeight="700">LOW INFLUENCE</text>
        <text x={W * 0.75} y={H - PAD + 0.5} textAnchor="middle" className="fill-fg-disabled" fontSize="2" fontWeight="400">DISENGAGED</text>

        {/* Contact bubbles */}
        {contacts.map((c, i) => {
          const primaryRole = c.meddicc_roles?.[0] || 'metrics';
          const color = ROLE_COLORS[primaryRole]?.fill || '#94A3B8';
          const engY = ENGAGEMENT_Y[c.engagement_status] ?? 0.5;

          // X = engagement (engaged=left, disengaged=right), Y = influence (high=top, low=bottom)
          const x = PAD + (engY * (W - PAD * 2));
          const y = PAD + 10 + ((10 - (c.influence_score || 5)) / 10) * (H - PAD * 2 - 14);
          const r = 1.5 + (c.influence_score || 5) * 0.25;
          const isSelected = selectedName === c.canonical_name;

          // Jitter to prevent overlap
          const jx = x + ((i % 3 - 1) * 3);
          const jy = y + ((i % 2) * 2);

          return (
            <g key={c.canonical_name} onClick={() => onSelectContact(isSelected ? null : c.canonical_name)} className="cursor-pointer">
              <circle cx={jx} cy={jy} r={r + 0.5} fill={isSelected ? '#3366FF' : 'transparent'} opacity="0.3" />
              <circle cx={jx} cy={jy} r={r} fill={color} opacity="0.85" stroke={isSelected ? '#3366FF' : 'white'} strokeWidth={isSelected ? 0.6 : 0.3} />
              <text x={jx} y={jy + r + 2.5} textAnchor="middle" fontSize="2" className="fill-fg-muted" fontWeight="600">
                {c.canonical_name.split(' ').pop()?.substring(0, 10)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Axis labels */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[7px] font-bold text-fg-disabled uppercase tracking-widest whitespace-nowrap">
        Influence →
      </div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-bold text-fg-disabled uppercase tracking-widest">
        ← Engaged · Disengaged →
      </div>
    </div>
  );
}

/* ── Contact detail sidebar ── */

function ContactDetail({ contact, onClose }) {
  if (!contact) return null;
  return (
    <div className="border border-border rounded-lg bg-surface p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-fg">{contact.canonical_name}</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-surface-2"><X size={12} className="text-fg-muted" /></button>
      </div>
      {/* MEDDICC role badges */}
      <div className="flex flex-wrap gap-1">
        {(contact.meddicc_roles || []).map(role => {
          const rc = ROLE_COLORS[role];
          return rc ? (
            <span key={role} className={`px-1.5 py-0.5 rounded-full text-[7px] font-bold uppercase ${rc.badge}`}>{rc.label}</span>
          ) : null;
        })}
      </div>

      {/* Influence reasoning */}
      <div className="bg-surface-2 rounded p-2">
        <div className="text-[8px] font-bold text-fg-muted uppercase tracking-wider mb-0.5">Influence: {contact.influence_score}/10</div>
        <p className="text-[9px] text-fg leading-relaxed">{contact.influence_reasoning || 'No reasoning provided'}</p>
      </div>

      {/* Engagement reasoning */}
      <div className="bg-surface-2 rounded p-2">
        <div className="text-[8px] font-bold text-fg-muted uppercase tracking-wider mb-0.5">Engagement: {contact.engagement_status}</div>
        <p className="text-[9px] text-fg leading-relaxed">{contact.engagement_reasoning || 'No reasoning provided'}</p>
      </div>

      {/* Recommended action + reasoning */}
      {contact.recommended_action && (
        <div className="bg-primary-50 dark:bg-primary/10 border border-primary/10 rounded p-2">
          <div className="text-[8px] font-bold text-primary uppercase tracking-wider mb-0.5">Recommended Action</div>
          <p className="text-[10px] text-fg leading-relaxed">{contact.recommended_action}</p>
          {contact.action_reasoning && (
            <p className="text-[9px] text-fg-muted mt-1 italic">Why: {contact.action_reasoning}</p>
          )}
        </div>
      )}

      {/* Political notes */}
      {contact.political_notes && (
        <div>
          <div className="text-[8px] font-bold text-fg-disabled uppercase tracking-wider mb-0.5">Political Dynamics</div>
          <p className="text-[9px] text-fg-muted leading-relaxed">{contact.political_notes}</p>
        </div>
      )}
    </div>
  );
}

/* ── Summary cards ── */

function SummaryCards({ result }) {
  const contacts = result.contacts || [];
  const eb = contacts.find(c => c.meddicc_roles?.includes('economic_buyer'));
  const champ = contacts.find(c => c.meddicc_roles?.includes('champion'));

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Economic Buyer */}
      <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
        <div className="text-[8px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Economic Buyer</div>
        {eb ? (
          <>
            <div className="text-[11px] font-bold text-fg">{eb.canonical_name}</div>
            <div className="text-[9px] text-fg-muted">Confidence: {result.economic_buyer_confidence || 'unknown'}</div>
          </>
        ) : (
          <div className="text-[10px] text-amber-600 italic">Not yet identified</div>
        )}
      </div>

      {/* Champion */}
      <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800">
        <div className="text-[8px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Champion</div>
        {champ ? (
          <div className="text-[11px] font-bold text-fg">{champ.canonical_name}</div>
        ) : (
          <div className="text-[10px] text-emerald-600 italic">Not yet identified</div>
        )}
      </div>

      {/* Key Risks */}
      <div className="p-2.5 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
        <div className="text-[8px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">Key Risks</div>
        {result.deal_risks?.length > 0 ? (
          <div className="space-y-0.5">
            {result.deal_risks.slice(0, 2).map((r, i) => (
              <div key={i} className="text-[9px] text-red-700 dark:text-red-300 leading-tight">• {r}</div>
            ))}
          </div>
        ) : (
          <div className="text-[10px] text-red-600 italic">None identified</div>
        )}
      </div>
    </div>
  );
}

/* ── Main Power Map View ── */

export default function PowerMapView({ bankKey }) {
  const [powerMap, setPowerMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  // Load cached power map on mount
  useEffect(() => {
    if (!bankKey) return;
    setLoading(true);
    apiGetPowerMap(bankKey)
      .then(data => {
        setPowerMap(data?.result || data || null);
        setError(null);
      })
      .catch(err => {
        // 404 = not generated yet (expected), any other error = also show generate prompt
        setPowerMap(null);
        setError(null); // Don't show error for initial load — just show generate button
      })
      .finally(() => setLoading(false));
  }, [bankKey]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const { result } = await apiGeneratePowerMap(bankKey);
      setPowerMap(result);
      setSelectedContact(null);
    } catch (err) {
      setError(err.message || 'Failed to generate power map');
    } finally {
      setGenerating(false);
    }
  };

  const selectedDetail = powerMap?.contacts?.find(c => c.canonical_name === selectedContact) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={16} className="animate-spin text-primary mr-2" />
        <span className="text-xs text-fg-muted">Loading power map...</span>
      </div>
    );
  }

  // No power map yet — show generate prompt
  if (!powerMap && !generating) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Target size={20} className="text-primary" />
        </div>
        <p className="text-sm font-bold text-fg mb-1">No MEDDICC Power Map yet</p>
        <p className="text-[11px] text-fg-muted mb-4 max-w-xs mx-auto">
          Generate an AI-powered influence and decision map based on MEDDICC methodology to identify economic buyers, champions, and deal risks.
        </p>
        <button onClick={handleGenerate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors">
          <Target size={13} /> Generate Power Map
        </button>
        {error && <p className="text-[10px] text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  // Generating state
  if (generating) {
    return (
      <div className="text-center py-8">
        <Loader2 size={20} className="animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm font-bold text-fg mb-1">Analyzing power dynamics...</p>
        <p className="text-[11px] text-fg-muted">Mapping MEDDICC roles, influence scores, and engagement levels for each contact.</p>
      </div>
    );
  }

  // Render power map
  return (
    <div className="space-y-4">
      {/* Header with regenerate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={13} className="text-primary" />
          <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider">MEDDICC Power Map</span>
          {powerMap.generated_at && (
            <span className="text-[9px] text-fg-disabled">Generated {timeAgo(powerMap.generated_at)}</span>
          )}
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-primary hover:bg-primary/5 rounded transition-colors disabled:opacity-50">
          <RefreshCw size={10} /> Regenerate
        </button>
      </div>

      {/* 2x2 Matrix + Contact Detail side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <InfluenceMatrix
            contacts={powerMap.contacts}
            onSelectContact={setSelectedContact}
            selectedName={selectedContact}
          />
        </div>
        <div>
          {selectedDetail ? (
            <ContactDetail contact={selectedDetail} onClose={() => setSelectedContact(null)} />
          ) : (
            <div className="border border-dashed border-border rounded-lg p-4 flex items-center justify-center h-full">
              <p className="text-[10px] text-fg-disabled text-center">Click a bubble on the map to see MEDDICC details</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <SummaryCards result={powerMap} />

      {/* Methodology note */}
      {powerMap.methodology_note && (
        <div className="bg-surface-2 border border-border rounded-lg p-3">
          <div className="text-[8px] font-bold text-fg-disabled uppercase tracking-wider mb-1">Analysis Methodology</div>
          <p className="text-[10px] text-fg-muted leading-relaxed">{powerMap.methodology_note}</p>
        </div>
      )}

      {/* Recommended entry sequence + reasoning */}
      {powerMap.recommended_entry_sequence?.length > 0 && (
        <div>
          <div className="text-[9px] font-bold text-fg-muted uppercase tracking-wider mb-2">Recommended Entry Sequence</div>
          <div className="space-y-1.5">
            {powerMap.recommended_entry_sequence.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[11px] text-fg leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
          {powerMap.sequence_reasoning && (
            <div className="mt-2 p-2 bg-primary-50 dark:bg-primary/5 rounded border border-primary/10">
              <div className="text-[8px] font-bold text-primary uppercase tracking-wider mb-0.5">Strategic Logic</div>
              <p className="text-[10px] text-fg leading-relaxed">{powerMap.sequence_reasoning}</p>
            </div>
          )}
        </div>
      )}

      {/* Deal risks with reasoning */}
      {powerMap.deal_risks?.length > 0 && powerMap.risk_reasoning?.length > 0 && (
        <div>
          <div className="text-[9px] font-bold text-red-600 uppercase tracking-wider mb-2">Deal Risks — Evidence</div>
          <div className="space-y-1.5">
            {powerMap.deal_risks.map((risk, i) => (
              <div key={i} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded p-2">
                <div className="text-[10px] font-bold text-red-700 dark:text-red-300">{risk}</div>
                {powerMap.risk_reasoning[i] && (
                  <p className="text-[9px] text-red-600 dark:text-red-400 mt-0.5 italic">{powerMap.risk_reasoning[i]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MEDDICC role legend */}
      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
        {Object.entries(ROLE_COLORS).map(([key, { fill, label }]) => (
          <div key={key} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: fill }} />
            <span className="text-[8px] text-fg-disabled">{label}</span>
          </div>
        ))}
      </div>

      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}
