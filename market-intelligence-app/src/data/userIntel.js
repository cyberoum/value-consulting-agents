// User Intelligence Storage Layer
// Persists user-contributed intel to localStorage under 'mi-user-intel'
// Each entry is timestamped, categorized, and linked to a bank

const STORAGE_KEY = 'mi-user-intel';

// Intel categories — each maps to specific data fields it can update
export const INTEL_CATEGORIES = {
  signal: {
    label: 'Signal / News',
    icon: '📡',
    description: 'Market signal, news event, or announcement',
    fields: ['signal', 'implication'],
    dataTarget: 'signals',
    color: '#3366FF',
  },
  pain_point: {
    label: 'Pain Point',
    icon: '🔥',
    description: 'Business problem or frustration observed',
    fields: ['title', 'detail'],
    dataTarget: 'pain_points',
    color: '#C62828',
  },
  leadership: {
    label: 'Leadership Update',
    icon: '👤',
    description: 'New hire, departure, role change, or org restructure',
    fields: ['name', 'role', 'change', 'implication'],
    dataTarget: 'key_decision_makers',
    color: '#1565C0',
  },
  meeting_note: {
    label: 'Meeting Note',
    icon: '📝',
    description: 'Summary from a call, meeting, or conversation',
    fields: ['summary', 'attendees', 'key_takeaways', 'next_steps'],
    dataTarget: null, // Multi-field — AI processes into multiple targets
    color: '#6A1B9A',
  },
  cx_insight: {
    label: 'CX / App Insight',
    icon: '📱',
    description: 'App review trend, UX observation, or digital channel update',
    fields: ['observation', 'source'],
    dataTarget: 'cx',
    color: '#00838F',
  },
  competition: {
    label: 'Competition Intel',
    icon: '⚔️',
    description: 'Vendor win/loss, tech stack change, or competitive move',
    fields: ['vendor', 'change', 'implication'],
    dataTarget: 'competition',
    color: '#E65100',
  },
  strategy: {
    label: 'Strategy Update',
    icon: '🎯',
    description: 'Strategic initiative, budget change, or transformation update',
    fields: ['update', 'source', 'impact'],
    dataTarget: 'strategy',
    color: '#2E7D32',
  },
  qualification: {
    label: 'Deal / Qualification',
    icon: '💰',
    description: 'Deal size update, timing change, budget signal, or risk factor',
    fields: ['update', 'dimension', 'score_suggestion'],
    dataTarget: 'qualification',
    color: '#F57F17',
  },
};

export const CONFIDENCE_LEVELS = {
  confirmed: { label: 'Confirmed', color: '#2E7D32', bg: '#E8F5E9', icon: '✓' },
  likely: { label: 'Likely', color: '#F57F17', bg: '#FFF8E1', icon: '~' },
  unverified: { label: 'Unverified', color: '#C62828', bg: '#FFEBEE', icon: '?' },
};

// ── CRUD Operations ──

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** Add a new intel entry */
export function addIntel({ bankKey, category, content, source, confidence = 'likely', structured = null }) {
  const entries = getAll();
  const entry = {
    id: `intel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    bankKey,
    category,
    content,       // Raw text input
    source,        // Where this intel came from
    confidence,
    structured,    // AI-structured fields (null until processed)
    status: 'pending', // pending | approved | dismissed
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  entries.unshift(entry); // newest first
  saveAll(entries);
  return entry;
}

/** Get all intel for a specific bank */
export function getIntelForBank(bankKey) {
  return getAll().filter(e => e.bankKey === bankKey);
}

/** Get intel by category across all banks */
export function getIntelByCategory(category) {
  return getAll().filter(e => e.category === category);
}

/** Get pending (unreviewed) intel count */
export function getPendingCount(bankKey) {
  const entries = bankKey ? getIntelForBank(bankKey) : getAll();
  return entries.filter(e => e.status === 'pending').length;
}

/** Get all intel count */
export function getTotalIntelCount() {
  return getAll().length;
}

/** Update an intel entry (e.g., approve, edit, add structured data) */
export function updateIntel(id, updates) {
  const entries = getAll();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], ...updates, updatedAt: new Date().toISOString() };
  saveAll(entries);
  return entries[idx];
}

/** Approve an intel entry — marks it as reviewed and accepted */
export function approveIntel(id) {
  return updateIntel(id, { status: 'approved' });
}

/** Dismiss an intel entry — marks it as reviewed but rejected */
export function dismissIntel(id) {
  return updateIntel(id, { status: 'dismissed' });
}

/** Delete an intel entry permanently */
export function deleteIntel(id) {
  const entries = getAll().filter(e => e.id !== id);
  saveAll(entries);
}

/** Get approved intel for a bank, grouped by data target */
export function getApprovedIntelByTarget(bankKey) {
  const approved = getIntelForBank(bankKey).filter(e => e.status === 'approved');
  const grouped = {};
  approved.forEach(entry => {
    const target = INTEL_CATEGORIES[entry.category]?.dataTarget || 'general';
    if (!grouped[target]) grouped[target] = [];
    grouped[target].push(entry);
  });
  return grouped;
}

/** Export all intel as a downloadable JSON file */
export function exportIntel() {
  const all = getAll();
  const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nova-intel-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return all.length;
}

/** Import intel from a JSON file, deduplicating by id */
export function importIntel(jsonString) {
  try {
    const incoming = JSON.parse(jsonString);
    if (!Array.isArray(incoming)) return { imported: 0, skipped: 0, error: 'Invalid format — expected an array' };
    const existing = getAll();
    const existingIds = new Set(existing.map(e => e.id));
    const newEntries = incoming.filter(e => e.id && !existingIds.has(e.id));
    saveAll([...newEntries, ...existing]);
    return { imported: newEntries.length, skipped: incoming.length - newEntries.length, error: null };
  } catch (err) {
    return { imported: 0, skipped: 0, error: err.message };
  }
}

/** Get recent intel across all banks (for dashboard) */
export function getRecentIntel(limit = 10) {
  return getAll().slice(0, limit);
}

/** Get intel stats for analytics */
export function getIntelStats() {
  const all = getAll();
  const byStatus = { pending: 0, approved: 0, dismissed: 0 };
  const byCategory = {};
  const byBank = {};

  all.forEach(e => {
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    byBank[e.bankKey] = (byBank[e.bankKey] || 0) + 1;
  });

  return { total: all.length, byStatus, byCategory, byBank };
}
