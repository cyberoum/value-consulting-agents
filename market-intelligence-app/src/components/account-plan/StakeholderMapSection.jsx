import { useState, useMemo } from 'react';
import { Plus, Users, Loader, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { updatePersonPosition } from '../../data/api';
import EditableInfluenceMatrix from './EditableInfluenceMatrix';
import PersonIntelCard from './PersonIntelCard';
import PersonFormModal from './PersonFormModal';
import { MEDDICC_ROLES, ENGAGEMENT_META, SUPPORT_META } from './constants';

/**
 * StakeholderMapSection — composition of:
 *   - Summary cards (Economic Buyer / Champion / Blocker count)
 *   - 2x2 editable matrix (drag bubbles to reposition)
 *   - Person intel sidecar (opens on bubble click)
 *   - Add Person modal
 *   - List View (collapsible alternative layout)
 *
 * Data flow:
 *   persons[] passed in as prop from parent (fetched via useBank).
 *   Any mutation (drag, edit, add, delete) invalidates the parent query so
 *   the whole bank response (including persons) refetches.
 */

function SummaryCard({ label, value, color, subtitle }) {
  return (
    <div className="nova-card-nested flex-1 min-w-[140px]">
      <div className="nova-label mb-1">{label}</div>
      <div className="text-lg font-black" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
      {subtitle && <div className="text-[9px] text-[var(--text-muted)] truncate" title={subtitle}>{subtitle}</div>}
    </div>
  );
}

export default function StakeholderMapSection({ bankKey, persons = [], onBankInvalidate }) {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const selected = useMemo(
    () => persons.find(p => p.id === selectedId) || null,
    [persons, selectedId]
  );

  const invalidate = () => {
    onBankInvalidate?.();
    qc.invalidateQueries({ queryKey: ['bank', bankKey] });
  };

  // Drag-and-drop mutation with optimistic update
  const positionMutation = useMutation({
    mutationFn: ({ personId, data }) => updatePersonPosition(bankKey, personId, data),
    onSuccess: () => invalidate(),
  });

  const handleMove = (personId, { influence_score, engagement_status }) => {
    positionMutation.mutate({ personId, data: { influence_score, engagement_status } });
  };

  // Summary computations
  const economicBuyer = persons.find(p =>
    Array.isArray(p.meddicc_roles) && p.meddicc_roles.includes('economic_buyer')
  );
  const champion = persons.find(p =>
    Array.isArray(p.meddicc_roles) && p.meddicc_roles.includes('champion')
  ) || persons.find(p => p.support_status === 'champion');
  const blockers = persons.filter(p => p.support_status === 'blocker' || p.engagement_status === 'blocker');

  return (
    <div className="space-y-4">
      {/* Header + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Users size={14} className="text-[var(--nova-core)]" />
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Stakeholder Map</h3>
        <span className="text-[10px] text-[var(--text-muted)]">{persons.length} people</span>
        <div className="flex-1" />
        <button onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-[var(--nova-core)] hover:opacity-90">
          <Plus size={11} /> Add Person
        </button>
      </div>

      {/* Summary cards */}
      {persons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <SummaryCard
            label="Economic Buyer"
            value={economicBuyer ? economicBuyer.canonical_name.split(' ').slice(-1)[0] : '—'}
            subtitle={economicBuyer?.role}
            color="var(--nova-accreting)"
          />
          <SummaryCard
            label="Champion"
            value={champion ? champion.canonical_name.split(' ').slice(-1)[0] : '—'}
            subtitle={champion?.role}
            color="var(--nova-radiant)"
          />
          <SummaryCard
            label="Blockers"
            value={blockers.length}
            subtitle={blockers.length > 0 ? blockers.map(b => b.canonical_name).join(', ') : 'None identified'}
            color={blockers.length > 0 ? 'var(--nova-cooling)' : 'var(--text-muted)'}
          />
        </div>
      )}

      {/* Matrix */}
      <div className="nova-card">
        <EditableInfluenceMatrix
          persons={persons}
          selectedId={selectedId}
          onMove={handleMove}
          onSelect={p => setSelectedId(p.id)}
        />
      </div>

      {/* Compact list view (for quick editing without dragging) */}
      {persons.length > 0 && (
        <details className="nova-card">
          <summary className="cursor-pointer flex items-center gap-2 font-bold text-xs text-[var(--text-primary)] hover:text-[var(--nova-core)]">
            List View ({persons.length} stakeholders)
          </summary>
          <div className="mt-3 space-y-1">
            {persons.map(p => {
              const eng = ENGAGEMENT_META[p.engagement_status || 'neutral'];
              const sup = SUPPORT_META[p.support_status || 'neutral'];
              const meddicc = Array.isArray(p.meddicc_roles) ? p.meddicc_roles : [];
              return (
                <button key={p.id} onClick={() => setSelectedId(p.id)}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-[var(--bg-secondary)] text-left transition-colors">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
                    style={{ backgroundColor: eng.color }}>
                    {p.canonical_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[var(--text-primary)] truncate">{p.canonical_name}</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">{p.role}</div>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${sup.bg}`}>{sup.label}</span>
                  <span className="text-[9px] font-bold text-[var(--text-muted)]">Inf {p.influence_score ?? '—'}</span>
                  {meddicc.length > 0 && (
                    <div className="flex gap-0.5">
                      {meddicc.slice(0, 3).map(r => {
                        const m = MEDDICC_ROLES[r];
                        if (!m) return null;
                        return (
                          <span key={r} className="inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-black text-white"
                            style={{ backgroundColor: m.color }} title={m.label}>
                            {m.short}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </details>
      )}

      {/* Intel sidecar */}
      {selected && (
        <PersonIntelCard
          bankKey={bankKey}
          person={selected}
          onClose={() => setSelectedId(null)}
          onChanged={invalidate}
        />
      )}

      {/* Add Person modal */}
      {showAddModal && (
        <PersonFormModal
          bankKey={bankKey}
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); invalidate(); }}
        />
      )}
    </div>
  );
}
