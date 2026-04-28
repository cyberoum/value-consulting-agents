import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Trash2, Save, Loader, Plus, Linkedin, Tag } from 'lucide-react';
import { updatePerson, deletePerson } from '../../data/api';
import {
  MEDDICC_ROLES,
  ENGAGEMENT_STATUSES, ENGAGEMENT_META,
  SUPPORT_STATUSES, SUPPORT_META,
  RELATIONSHIP_TYPES,
  ROLE_CATEGORY_META,
} from './constants';
import PersonSignalsPanel from './PersonSignalsPanel';
import PersonDriftPanel from './PersonDriftPanel';

/**
 * PersonIntelCard — slide-in right panel showing full stakeholder intel.
 * Editable fields:
 *   - Core: name, role, LOB, linkedin_url
 *   - MEDDICC: multi-select role toggles
 *   - Support/relationship: dropdowns
 *   - Influence: slider (syncs with matrix)
 *   - Engagement: dropdown (syncs with matrix)
 *   - LinkedIn Intel: large textarea for pasted insights
 *   - Priorities / KPIs of Interest: tag inputs
 *   - Notes: existing note field
 *
 * All fields save to persons table via PUT endpoint.
 */

function TagInput({ label, tags, onChange, placeholder }) {
  const [input, setInput] = useState('');
  const list = Array.isArray(tags) ? tags : [];

  const addTag = () => {
    const v = input.trim();
    if (!v) return;
    if (list.includes(v)) { setInput(''); return; }
    onChange([...list, v]);
    setInput('');
  };

  const removeTag = (i) => {
    onChange(list.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <label className="nova-label block mb-1">{label}</label>
      <div className="flex flex-wrap gap-1 mb-1.5 min-h-[20px]">
        {list.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-[var(--nova-core-light)] text-[var(--nova-core)] text-[10px] font-bold px-2 py-0.5 rounded">
            {t}
            <button onClick={() => removeTag(i)} className="hover:opacity-70"><X size={8} /></button>
          </span>
        ))}
        {list.length === 0 && <span className="text-[10px] text-[var(--text-muted)] italic">None yet</span>}
      </div>
      <div className="flex gap-1">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder={placeholder}
          className="flex-1 text-[11px] bg-white border border-[var(--border-default)] rounded-lg px-2 py-1 focus:border-[var(--nova-core)] outline-none" />
        <button onClick={addTag}
          className="px-2 py-1 rounded-lg text-[10px] font-bold text-[var(--nova-core)] bg-[var(--nova-core-light)] hover:bg-[var(--nova-core)] hover:text-white">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

export default function PersonIntelCard({ bankKey, person, onClose, onChanged }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState(null);

  // Sync form with incoming person (including live position updates from drag)
  useEffect(() => {
    if (person) {
      setForm({
        canonical_name: person.canonical_name || '',
        role: person.role || '',
        role_category: person.role_category || 'Other',
        lob: person.lob || '',
        linkedin_url: person.linkedin_url || '',
        linkedin_intel: person.linkedin_intel || '',
        meddicc_roles: Array.isArray(person.meddicc_roles) ? person.meddicc_roles : [],
        support_status: person.support_status || 'neutral',
        relationship_type: person.relationship_type || '',
        influence_score: person.influence_score ?? 5,
        engagement_status: person.engagement_status || 'neutral',
        priorities: Array.isArray(person.priorities) ? person.priorities : [],
        kpis_of_interest: Array.isArray(person.kpis_of_interest) ? person.kpis_of_interest : [],
        note: person.note || '',
      });
    } else {
      setForm(null);
    }
  }, [person]);

  if (!person || !form) return null;

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleMeddicc = (role) => {
    const current = form.meddicc_roles || [];
    if (current.includes(role)) {
      set('meddicc_roles', current.filter(r => r !== role));
    } else {
      set('meddicc_roles', [...current, role]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updatePerson(bankKey, person.id, form);
      onChanged?.();
    } catch (err) {
      setError(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await deletePerson(bankKey, person.id);
      onChanged?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const roleCategory = ROLE_CATEGORY_META[form.role_category] || ROLE_CATEGORY_META.Other;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-40 overflow-y-auto border-l border-[var(--border-default)]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${roleCategory.bg}`}>
              {form.role_category}
            </span>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={16} />
            </button>
          </div>
          <input value={form.canonical_name} onChange={e => set('canonical_name', e.target.value)}
            className="w-full text-sm font-bold bg-transparent border-0 focus:outline-none text-[var(--text-primary)] mb-1" />
          <input value={form.role} onChange={e => set('role', e.target.value)}
            placeholder="Role / Title"
            className="w-full text-[11px] bg-transparent border-0 focus:outline-none text-[var(--text-secondary)]" />
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* LinkedIn */}
          <div>
            <label className="nova-label flex items-center gap-1 mb-1">
              <Linkedin size={10} /> LinkedIn URL
            </label>
            <div className="flex gap-1">
              <input value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/in/…"
                className="flex-1 text-[11px] bg-white border border-[var(--border-default)] rounded-lg px-2 py-1.5 focus:border-[var(--nova-core)] outline-none" />
              {form.linkedin_url && (
                <a href={form.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="px-2 py-1.5 rounded-lg text-[var(--nova-core)] bg-[var(--nova-core-light)] hover:bg-[var(--nova-core)] hover:text-white inline-flex items-center">
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          {/* LinkedIn Intel */}
          <div>
            <label className="nova-label block mb-1">LinkedIn Intel</label>
            <textarea value={form.linkedin_intel} onChange={e => set('linkedin_intel', e.target.value)}
              placeholder="Paste insights from LinkedIn profile review — recent posts, topics they engage with, publications, comments, areas of focus…"
              rows={4}
              className="w-full text-[11px] bg-white border border-[var(--border-default)] rounded-lg px-2 py-2 focus:border-[var(--nova-core)] outline-none resize-none" />
            <p className="text-[9px] text-[var(--text-muted)] italic mt-1">
              Manually collected intel. Future: auto-pull LinkedIn posts + analyze themes.
            </p>
          </div>

          {/* LOB */}
          <div>
            <label className="nova-label block mb-1">Line of Business</label>
            <input value={form.lob} onChange={e => set('lob', e.target.value)}
              placeholder="Retail, Wealth, Technology, Risk…"
              className="w-full text-[11px] bg-white border border-[var(--border-default)] rounded-lg px-2 py-1.5 focus:border-[var(--nova-core)] outline-none" />
          </div>

          {/* MEDDICC Roles */}
          <div>
            <label className="nova-label block mb-1.5">MEDDICC Roles (select all that apply)</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(MEDDICC_ROLES).map(([key, meta]) => {
                const active = form.meddicc_roles.includes(key);
                return (
                  <button key={key} onClick={() => toggleMeddicc(key)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold border transition-all ${
                      active ? 'text-white border-transparent' : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-white hover:bg-[var(--bg-secondary)]'
                    }`}
                    style={active ? { backgroundColor: meta.color } : {}}>
                    {meta.icon} {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Support + Relationship */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="nova-label block mb-1">Support Status</label>
              <select value={form.support_status} onChange={e => set('support_status', e.target.value)}
                className="w-full text-[11px] bg-white border border-[var(--border-default)] rounded-lg px-2 py-1.5 focus:border-[var(--nova-core)] outline-none">
                {SUPPORT_STATUSES.map(s => <option key={s} value={s}>{SUPPORT_META[s].label}</option>)}
              </select>
            </div>
            <div>
              <label className="nova-label block mb-1">Relationship</label>
              <select value={form.relationship_type} onChange={e => set('relationship_type', e.target.value)}
                className="w-full text-[11px] bg-white border border-[var(--border-default)] rounded-lg px-2 py-1.5 focus:border-[var(--nova-core)] outline-none">
                <option value="">—</option>
                {Object.entries(RELATIONSHIP_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Influence slider + Engagement dropdown (synced with matrix) */}
          <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <div className="nova-label mb-2">Position on Stakeholder Matrix</div>
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[var(--text-secondary)]">Influence Score</span>
                <span className="text-sm font-black text-[var(--nova-core)]">{form.influence_score}/10</span>
              </div>
              <input type="range" min="1" max="10" value={form.influence_score}
                onChange={e => set('influence_score', parseInt(e.target.value))}
                className="w-full accent-[var(--nova-core)]" />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Engagement</label>
              <select value={form.engagement_status} onChange={e => set('engagement_status', e.target.value)}
                className="w-full text-[11px] bg-white border border-[var(--border-default)] rounded-lg px-2 py-1 focus:border-[var(--nova-core)] outline-none">
                {ENGAGEMENT_STATUSES.map(s => <option key={s} value={s}>{ENGAGEMENT_META[s].label}</option>)}
              </select>
            </div>
          </div>

          {/* Priorities */}
          <TagInput label="Priorities / Interests" tags={form.priorities}
            onChange={v => set('priorities', v)}
            placeholder="e.g., Cost to serve, NPS, digital transformation…" />

          {/* KPIs */}
          <TagInput label="KPIs They Care About" tags={form.kpis_of_interest}
            onChange={v => set('kpis_of_interest', v)}
            placeholder="e.g., Cost-income ratio, ROE, CAC…" />

          {/* Signals mentioning this person — Stage 5A bidirectional cross-link */}
          {person?.id && (
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <PersonSignalsPanel
                bankKey={bankKey}
                personId={person.id}
                personName={person.canonical_name}
              />
            </div>
          )}

          {/* Sprint 2.6 — stakeholder positions across meetings (drift) */}
          {person?.id && (
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <PersonDriftPanel
                bankKey={bankKey}
                personId={person.id}
                personName={person.canonical_name}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="nova-label block mb-1">Notes</label>
            <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={3}
              placeholder="Political context, allies, blockers, recent news…"
              className="w-full text-[11px] bg-white border border-[var(--border-default)] rounded-lg px-2 py-2 focus:border-[var(--nova-core)] outline-none resize-none" />
          </div>

          {error && (
            <div className="p-2 bg-[var(--nova-cooling-light)] border border-[var(--nova-cooling)] rounded text-[10px] text-[var(--nova-cooling)]">
              {error}
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-white border-t border-[var(--border-subtle)] p-3 flex items-center gap-2">
          <button onClick={handleDelete} disabled={deleting}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-bold transition-colors ${
              confirmDelete
                ? 'bg-[var(--nova-cooling)] text-white'
                : 'text-[var(--nova-cooling)] hover:bg-[var(--nova-cooling-light)]'
            }`}>
            {deleting ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {confirmDelete ? 'Confirm Delete' : 'Delete'}
          </button>
          <div className="flex-1" />
          <button onClick={onClose}
            className="px-3 py-2 rounded-lg text-[10px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-[10px] font-bold text-white bg-[var(--nova-core)] hover:opacity-90 disabled:opacity-50">
            {saving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
