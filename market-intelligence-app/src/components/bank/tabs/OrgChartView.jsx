import { useState, useMemo } from 'react';
import { Linkedin, ChevronDown, ChevronUp, AlertTriangle, Info } from 'lucide-react';
import ConfidenceTierBadge from '../../common/ConfidenceTierBadge';

/* ── LOB color mapping ── */

const LOB_COLORS = {
  'Technology':        { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200',    dark: 'dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  'Retail Banking':    { bg: 'bg-emerald-100',  text: 'text-emerald-700', border: 'border-emerald-200', dark: 'dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' },
  'Business Banking':  { bg: 'bg-violet-100',   text: 'text-violet-700',  border: 'border-violet-200',  dark: 'dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800' },
  'Wealth Management': { bg: 'bg-amber-100',    text: 'text-amber-700',   border: 'border-amber-200',   dark: 'dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
  'Finance':           { bg: 'bg-teal-100',     text: 'text-teal-700',    border: 'border-teal-200',    dark: 'dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800' },
  'Risk & Compliance': { bg: 'bg-red-100',      text: 'text-red-700',     border: 'border-red-200',     dark: 'dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' },
  'Marketing':         { bg: 'bg-pink-100',     text: 'text-pink-700',    border: 'border-pink-200',    dark: 'dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800' },
  'Operations':        { bg: 'bg-orange-100',   text: 'text-orange-700',  border: 'border-orange-200',  dark: 'dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' },
  'Human Resources':   { bg: 'bg-sky-100',      text: 'text-sky-700',     border: 'border-sky-200',     dark: 'dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800' },
};

function LobBadge({ lob }) {
  if (!lob) return null;
  const c = LOB_COLORS[lob] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', dark: 'dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' };
  return (
    <span className={`inline-flex px-1.5 py-px rounded-full text-[7px] font-bold uppercase tracking-wider border ${c.bg} ${c.text} ${c.border} ${c.dark}`}>
      {lob}
    </span>
  );
}

/* ── Compact org chart node ── */

function OrgNode({ person, isSelected, onSelect }) {
  const isTarget = (person.note || '').includes('🎯') || (person.note || '').includes('CRITICAL');

  return (
    <button
      onClick={() => onSelect(isSelected ? null : person.canonical_name)}
      className={`w-[130px] p-2 rounded-lg border text-left transition-all shrink-0 ${
        isSelected
          ? 'bg-primary-50 border-primary/40 ring-2 ring-primary/20 shadow-md'
          : isTarget
            ? 'bg-primary-50/50 border-primary/20 hover:border-primary/40'
            : 'bg-surface border-border hover:border-fg-muted/30 hover:shadow-sm'
      }`}
    >
      {/* Name */}
      <div className="text-[10px] font-bold text-fg truncate leading-tight">
        {person.canonical_name} {isTarget && <span className="text-primary">🎯</span>}
      </div>
      {/* Role — truncated */}
      <div className="text-[8px] text-fg-muted truncate mt-0.5">{person.role}</div>
      {/* Badges row */}
      <div className="flex items-center gap-1 mt-1 flex-wrap">
        <LobBadge lob={person.lob} />
        {person.linkedin_url && (
          <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer"
             className="text-blue-500 hover:text-blue-700" onClick={e => e.stopPropagation()}>
            <Linkedin size={8} />
          </a>
        )}
      </div>
    </button>
  );
}

/* ── Expanded detail card ── */

function ExpandedCard({ person }) {
  if (!person) return null;
  return (
    <div className="mt-3 p-3 bg-surface-2 border border-border rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-bold text-fg">{person.canonical_name}</span>
        <ConfidenceTierBadge tier={person.confidence_tier || 2} size="sm" />
        {person.linkedin_url && (
          <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer"
             className="inline-flex px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] font-bold text-blue-600 no-underline hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
            <Linkedin size={9} className="mr-0.5" /> LinkedIn
          </a>
        )}
      </div>
      <div className="text-[10px] text-fg-muted mb-1">{person.role}</div>
      {person.lob && <LobBadge lob={person.lob} />}
      {person.note && (
        <p className="text-[10px] text-fg-disabled mt-2 leading-relaxed">{person.note}</p>
      )}
    </div>
  );
}

/* ── LOB-to-CTO/CFO/etc parent matching ── */

const LOB_TO_CSUITE_ROLE = {
  'Technology':        ['CTO', 'CIO'],
  'Retail Banking':    ['Head of Retail', 'Head of Personal', 'CEO'],
  'Business Banking':  ['Head of Business', 'Head of SME', 'CEO'],
  'Wealth Management': ['Head of Wealth', 'Head of Asset'],
  'Finance':           ['CFO'],
  'Risk & Compliance': ['CRO', 'Chief Risk', 'Chief Compliance'],
  'Marketing':         ['CMO', 'CEO'],
  'Operations':        ['COO', 'CEO'],
  'Human Resources':   ['Chief People', 'CHRO', 'CEO'],
};

function findCsuiteParent(directorLob, csuitePersons) {
  if (!directorLob) return null;
  const candidates = LOB_TO_CSUITE_ROLE[directorLob] || [];
  for (const keyword of candidates) {
    const match = csuitePersons.find(p =>
      p.role.toLowerCase().includes(keyword.toLowerCase())
    );
    if (match) return match.canonical_name;
  }
  // Default: CEO
  const ceo = csuitePersons.find(p => /\bCEO\b/i.test(p.role));
  return ceo?.canonical_name || csuitePersons[0]?.canonical_name || null;
}

/* ── Main Org Chart ── */

export default function OrgChartView({ persons = [] }) {
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Split into tiers
  const { csuitePersons, directorPersons, csuiteMap, lobGroups } = useMemo(() => {
    const csuite = persons.filter(p => p.role_category === 'C-suite');
    const directors = persons.filter(p => p.role_category !== 'C-suite');

    // Build a map: csuite name → [directors under them]
    const map = {};
    for (const c of csuite) map[c.canonical_name] = [];

    // Assign each director to a C-suite parent based on LOB
    for (const d of directors) {
      const parentName = findCsuiteParent(d.lob, csuite);
      if (parentName && map[parentName]) {
        map[parentName].push(d);
      } else if (csuite.length > 0) {
        // Fallback to CEO or first C-suite
        const fallback = csuite.find(p => /\bCEO\b/i.test(p.role))?.canonical_name || csuite[0].canonical_name;
        if (map[fallback]) map[fallback].push(d);
      }
    }

    // Also group directors by LOB for the visual layout
    const lobs = {};
    for (const d of directors) {
      const key = d.lob || 'Other';
      if (!lobs[key]) lobs[key] = [];
      lobs[key].push(d);
    }

    return { csuitePersons: csuite, directorPersons: directors, csuiteMap: map, lobGroups: lobs };
  }, [persons]);

  const selected = persons.find(p => p.canonical_name === selectedPerson) || null;

  if (persons.length === 0) {
    return <p className="text-[11px] text-fg-muted italic py-4">No persons data available for org chart.</p>;
  }

  return (
    <div>
      {/* Disclaimer */}
      <div className="flex items-start gap-1.5 mb-4 p-2.5 bg-surface-2 border border-border rounded-lg">
        <Info size={11} className="text-fg-disabled shrink-0 mt-0.5" />
        <p className="text-[9px] text-fg-disabled leading-relaxed">
          <span className="font-bold">Inferred organization</span> — reporting lines are based on role and LOB inference, not confirmed structure. Click any node for details.
        </p>
      </div>

      {/* C-Suite row */}
      <div className="mb-2">
        <div className="text-[8px] font-bold text-fg-disabled uppercase tracking-widest mb-2 text-center">Leadership Team</div>
        <div className="flex flex-wrap justify-center gap-2">
          {csuitePersons.map(person => (
            <OrgNode
              key={person.id}
              person={person}
              isSelected={selectedPerson === person.canonical_name}
              onSelect={setSelectedPerson}
            />
          ))}
        </div>
      </div>

      {/* SVG connector — simple vertical line from C-suite row to Director section */}
      {directorPersons.length > 0 && (
        <div className="flex justify-center my-1">
          <svg width="2" height="20" className="text-border">
            <line x1="1" y1="0" x2="1" y2="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,2" />
          </svg>
        </div>
      )}

      {/* Director groups by LOB */}
      {Object.entries(lobGroups).length > 0 && (
        <div className="space-y-3">
          {Object.entries(lobGroups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([lob, lobPersons]) => (
            <div key={lob}>
              {/* LOB header with horizontal line */}
              <div className="flex items-center gap-2 mb-2">
                <LobBadge lob={lob === 'Other' ? null : lob} />
                {lob === 'Other' && <span className="text-[8px] font-bold text-fg-disabled uppercase">Unassigned</span>}
                <span className="text-[8px] text-fg-disabled">{lobPersons.length}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              {/* Director nodes in a row */}
              <div className="flex flex-wrap gap-2 pl-4">
                {lobPersons.map(person => (
                  <OrgNode
                    key={person.id}
                    person={person}
                    isSelected={selectedPerson === person.canonical_name}
                    onSelect={setSelectedPerson}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded detail card for selected person */}
      <ExpandedCard person={selected} />
    </div>
  );
}
