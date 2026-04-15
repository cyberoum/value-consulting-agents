import { useState, useEffect } from 'react';
import { X, Loader, Save } from 'lucide-react';
import { createPerson, updatePerson } from '../../data/api';
import { ROLE_CATEGORY_META, SUPPORT_STATUSES, SUPPORT_META, RELATIONSHIP_TYPES } from './constants';

const EMPTY = {
  canonical_name: '',
  role: '',
  role_category: 'Other',
  lob: '',
  linkedin_url: '',
  support_status: 'neutral',
  relationship_type: '',
  note: '',
};

/**
 * PersonFormModal — add or edit a person on the stakeholder map.
 * - Add mode: all fields empty, calls createPerson on save
 * - Edit mode: pre-fills from person prop, calls updatePerson on save
 */
export default function PersonFormModal({ bankKey, person, onSaved, onClose }) {
  const isEdit = !!person?.id;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEdit) {
      setForm({
        canonical_name: person.canonical_name || '',
        role: person.role || '',
        role_category: person.role_category || 'Other',
        lob: person.lob || '',
        linkedin_url: person.linkedin_url || '',
        support_status: person.support_status || 'neutral',
        relationship_type: person.relationship_type || '',
        note: person.note || '',
      });
    }
  }, [isEdit, person]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.canonical_name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updatePerson(bankKey, person.id, form);
      } else {
        await createPerson(bankKey, form);
      }
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white rounded-[var(--il-radius)] shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            {isEdit ? `Edit ${form.canonical_name || 'Person'}` : 'Add Stakeholder'}
          </h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-3">
          <div>
            <label className="nova-label block mb-1">Full Name *</label>
            <input value={form.canonical_name} onChange={e => set('canonical_name', e.target.value)}
              placeholder="Jane Smith"
              className="w-full text-xs bg-white border border-[var(--border-default)] rounded-lg px-3 py-2 focus:border-[var(--nova-core)] outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="nova-label block mb-1">Role / Title</label>
              <input value={form.role} onChange={e => set('role', e.target.value)}
                placeholder="Chief Digital Officer"
                className="w-full text-xs bg-white border border-[var(--border-default)] rounded-lg px-3 py-2 focus:border-[var(--nova-core)] outline-none" />
            </div>
            <div>
              <label className="nova-label block mb-1">Seniority</label>
              <select value={form.role_category} onChange={e => set('role_category', e.target.value)}
                className="w-full text-xs bg-white border border-[var(--border-default)] rounded-lg px-3 py-2 focus:border-[var(--nova-core)] outline-none">
                {Object.keys(ROLE_CATEGORY_META).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="nova-label block mb-1">Line of Business (LOB)</label>
            <input value={form.lob} onChange={e => set('lob', e.target.value)}
              placeholder="Retail Banking, Wealth, Technology…"
              className="w-full text-xs bg-white border border-[var(--border-default)] rounded-lg px-3 py-2 focus:border-[var(--nova-core)] outline-none" />
          </div>

          <div>
            <label className="nova-label block mb-1">LinkedIn URL</label>
            <input value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/in/…"
              className="w-full text-xs bg-white border border-[var(--border-default)] rounded-lg px-3 py-2 focus:border-[var(--nova-core)] outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="nova-label block mb-1">Support Status</label>
              <select value={form.support_status} onChange={e => set('support_status', e.target.value)}
                className="w-full text-xs bg-white border border-[var(--border-default)] rounded-lg px-3 py-2 focus:border-[var(--nova-core)] outline-none">
                {SUPPORT_STATUSES.map(s => (
                  <option key={s} value={s}>{SUPPORT_META[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="nova-label block mb-1">Relationship Type</label>
              <select value={form.relationship_type} onChange={e => set('relationship_type', e.target.value)}
                className="w-full text-xs bg-white border border-[var(--border-default)] rounded-lg px-3 py-2 focus:border-[var(--nova-core)] outline-none">
                <option value="">—</option>
                {Object.entries(RELATIONSHIP_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="nova-label block mb-1">Notes</label>
            <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2}
              placeholder="Known priorities, recent activity, political notes…"
              className="w-full text-xs bg-white border border-[var(--border-default)] rounded-lg px-3 py-2 focus:border-[var(--nova-core)] outline-none resize-none" />
          </div>

          {error && (
            <div className="p-2 bg-[var(--nova-cooling-light)] border border-[var(--nova-cooling)] rounded text-[10px] text-[var(--nova-cooling)]">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)]">
          <button onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:bg-white">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !form.canonical_name.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[var(--nova-core)] hover:opacity-90 disabled:opacity-50">
            {saving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
            {isEdit ? 'Save Changes' : 'Add Person'}
          </button>
        </div>
      </div>
    </div>
  );
}
