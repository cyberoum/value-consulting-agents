import { useState } from 'react';
import { ChevronRight, ChevronDown, ChevronUp, Globe, Linkedin, Clock, List, GitBranch, Target, Mail, Copy, Check, Loader, X, Zap } from 'lucide-react';
import { generateEmailDraft } from '../../../data/api';
import StakeholderIntelView from '../../plays/StakeholderIntelView';
import SelectableItem from '../SelectableItem';
import { ROLES } from '../../../data/discoveryQuestions';
import ConfidenceTierBadge from '../../common/ConfidenceTierBadge';
import OrgChartView from './OrgChartView';
import PowerMapView from './PowerMapView';

/* ── Role category badges ── */

const CATEGORY_CONFIG = {
  'C-suite':  { label: 'C-Suite',  bg: 'bg-[#091C35]', text: 'text-white',    darkBg: 'dark:bg-white',    darkText: 'dark:text-[#091C35]' },
  'SVP':      { label: 'SVP',      bg: 'bg-indigo-600', text: 'text-white',   darkBg: 'dark:bg-indigo-500', darkText: 'dark:text-white' },
  'VP':       { label: 'VP',       bg: 'bg-blue-600',   text: 'text-white',   darkBg: 'dark:bg-blue-500',   darkText: 'dark:text-white' },
  'Director': { label: 'Director', bg: 'bg-slate-500',  text: 'text-white',   darkBg: 'dark:bg-slate-400',  darkText: 'dark:text-slate-900' },
  'Manager':  { label: 'Manager',  bg: 'bg-gray-400',   text: 'text-white',   darkBg: 'dark:bg-gray-500',   darkText: 'dark:text-white' },
};

function RoleCategoryBadge({ category }) {
  const config = CATEGORY_CONFIG[category];
  if (!config) return null;
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${config.bg} ${config.text} ${config.darkBg} ${config.darkText}`}>
      {config.label}
    </span>
  );
}

/* ── Source attribution from provenance ── */

const SOURCE_TYPE_LABELS = {
  person_research: 'AI research + news',
  linkedin: 'LinkedIn',
  manual: 'Curated data',
  annual_report: 'Annual Report',
  ir_feed: 'Investor Relations',
  press_release: 'Press Release',
};

function SourceLine({ provenance }) {
  if (!provenance) return null;
  const label = SOURCE_TYPE_LABELS[provenance.source_type] || provenance.source_type?.replace(/_/g, ' ');
  const date = provenance.source_date ? new Date(provenance.source_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null;
  return (
    <span className="text-[9px] text-fg-disabled">
      {provenance.confidence_tier === 1 ? 'Verified' : 'Sourced'} via {label}{date ? ` — ${date}` : ''}
    </span>
  );
}

/* ── Email Draft Inline ── */

function EmailDraftButton({ bankKey, person }) {
  const [open, setOpen] = useState(false);
  const [emailType, setEmailType] = useState('cold_intro');
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateEmailDraft({
        bankKey, recipientName: person.canonical_name || person.name,
        recipientRole: person.role, emailType,
      });
      setDraft(res.result);
    } catch { setDraft(null); }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) {
    return (
      <button onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-fg-muted hover:text-primary hover:bg-primary/5 transition-colors"
        title="Draft email">
        <Mail size={9} /> Email
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 bg-surface-2 rounded-lg border border-border" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold text-fg-muted uppercase">Draft Email to {person.canonical_name || person.name}</span>
        <button onClick={() => { setOpen(false); setDraft(null); }} className="text-fg-disabled hover:text-fg"><X size={12} /></button>
      </div>
      {!draft ? (
        <div className="space-y-2">
          <div className="flex gap-1 flex-wrap">
            {[['cold_intro', 'Cold Intro'], ['follow_up', 'Follow-up'], ['value_prop', 'Value Prop'], ['intro_request', 'Intro Request'], ['event_invite', 'Event Invite']].map(([k, label]) => (
              <button key={k} onClick={() => setEmailType(k)}
                className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${emailType === k ? 'bg-primary text-white' : 'bg-surface border border-border text-fg-muted hover:bg-surface-3'}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={handleGenerate} disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
            {loading ? <><Loader size={10} className="animate-spin" /> Drafting...</> : <><Mail size={10} /> Generate Draft</>}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-primary">{draft.subject}</div>
          <div className="text-[10px] text-fg leading-relaxed whitespace-pre-line bg-white dark:bg-surface p-2 rounded border border-border max-h-40 overflow-y-auto">{draft.body}</div>
          {draft.tone_notes && <div className="text-[8px] text-fg-disabled italic">{draft.tone_notes}</div>}
          <div className="flex gap-2">
            <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold bg-surface border border-border text-fg hover:bg-surface-3">
              {copied ? <><Check size={9} className="text-emerald-500" /> Copied</> : <><Copy size={9} /> Copy</>}
            </button>
            <button onClick={() => setDraft(null)} className="text-[9px] text-fg-muted hover:text-fg underline">Try different type</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Time ago helper ── */

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

/* ── Person Card (normalized) ── */

function NormalizedPersonCard({ person, provenance, bankKey }) {
  const [expanded, setExpanded] = useState(false);
  const [showIntel, setShowIntel] = useState(false);
  if (!person) return null;
  const isTarget = (person.note || '').includes('🎯') || (person.note || '').includes('CRITICAL');

  return (
    <SelectableItem
      id={`person-${person.id}`}
      label={person.canonical_name}
      category="Key People"
      content={`**${person.canonical_name}** — ${person.role}${person.note ? '\n' + person.note : ''}${person.linkedin_url ? '\nLinkedIn: ' + person.linkedin_url : ''}`}
    >
      <div className={`p-3 border rounded-lg transition-all ${isTarget ? 'bg-primary-50 border-primary/30' : 'bg-surface border-border'}`}>
        {/* Row 1: Role + category + confidence */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] text-fg-muted uppercase tracking-wide flex-1 truncate">{person.role}</span>
          <RoleCategoryBadge category={person.role_category} />
          <ConfidenceTierBadge tier={person.confidence_tier || 2} />
        </div>

        {/* Row 2: Name + LinkedIn */}
        <div className="font-bold text-sm text-fg mt-0.5">
          {person.canonical_name} {isTarget && <span className="text-primary">🎯</span>}
          {person.linkedin_url && (
            <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer"
               className="inline-flex ml-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] font-bold text-blue-600 no-underline hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
               onClick={e => e.stopPropagation()}>
              <Linkedin size={9} className="mr-0.5" /> Profile
            </a>
          )}
          {bankKey && <EmailDraftButton bankKey={bankKey} person={person} />}
          {bankKey && (
            <button onClick={(e) => { e.stopPropagation(); setShowIntel(!showIntel); }}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-fg-muted hover:text-[#0e7490] hover:bg-[#ecfeff] transition-colors"
              title="View intelligence for this person">
              <Zap size={9} /> Intel
            </button>
          )}
        </div>

        {/* Row 3: Note (truncated, expandable) */}
        {person.note && (
          <p
            className={`text-[10px] text-fg-disabled mt-1 leading-relaxed cursor-pointer ${expanded ? '' : 'line-clamp-2'}`}
            onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {person.note}
          </p>
        )}

        {/* Row 4: Aliases */}
        {person.aliases && person.aliases.length > 0 && (
          <div className="text-[9px] text-fg-disabled mt-1 italic">
            Also known as: {person.aliases.join(', ')}
          </div>
        )}

        {/* Row 5: Legacy badge / Discovery source / Verified */}
        <div className="flex items-center flex-wrap gap-2 mt-1.5">
          {person.is_legacy === 1 && !person.verified_at && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/40">
              Needs verification
            </span>
          )}
          {person.is_legacy === 0 && person.discovery_source && person.discovery_source !== 'legacy_seed' && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/40">
              Discovered via {(SOURCE_TYPE_LABELS[person.discovery_source] || person.discovery_source?.replace(/_/g, ' '))}
            </span>
          )}
          {person.verified_at && (
            <span className="flex items-center gap-0.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
              <Clock size={8} /> Verified {timeAgo(person.verified_at)}
            </span>
          )}
          <SourceLine provenance={provenance} />
        </div>
      </div>
      {/* Stakeholder Intelligence View */}
      {showIntel && bankKey && (
        <div className="mt-2">
          <StakeholderIntelView dealId={bankKey} stakeholderName={person.canonical_name} onClose={() => setShowIntel(false)} />
        </div>
      )}
    </SelectableItem>
  );
}

/* ── Group header ── */

const GROUP_ORDER = ['C-suite', 'SVP', 'VP', 'Director', 'Manager', null];

function groupPersonsByCategory(persons) {
  const groups = {};
  for (const p of persons) {
    const cat = p.role_category || 'Other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  }
  // Sort groups by defined order
  const sorted = [];
  for (const cat of GROUP_ORDER) {
    const key = cat || 'Other';
    if (groups[key]) sorted.push({ category: key, persons: groups[key] });
  }
  // Any remaining categories not in GROUP_ORDER
  for (const [key, persons] of Object.entries(groups)) {
    if (!sorted.some(g => g.category === key)) sorted.push({ category: key, persons });
  }
  return sorted;
}

/* ── Main Component ── */

export default function PeopleTab({
  bankKey,
  meetingActive = false,
  meetingContext,
  meetingTips = [],
  allPeople = [],
  topPeople = [],
  scrollToDeepDive,
  persons = [],
  personProvenance = [],
}) {
  // Build provenance lookup: canonical_name → provenance record
  const provenanceMap = {};
  if (personProvenance && personProvenance.length > 0) {
    for (const prov of personProvenance) {
      const name = prov.field_path?.replace(/^person\./, '');
      if (name) provenanceMap[name] = prov;
    }
  }

  // Use normalized persons if available, fall back to allPeople
  const safePersons = persons || [];
  const safeAllPeople = allPeople || [];
  const safeTopPeople = topPeople || [];
  const safeMeetingTips = meetingTips || [];
  const useNormalized = safePersons.length > 0;
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'org' | 'power'

  // View toggle — only shown when not in meeting mode and has normalized persons
  const ViewToggle = useNormalized && !meetingActive ? (
    <div className="flex bg-surface-2 rounded-lg p-0.5 mb-3">
      {[
        { key: 'list', icon: List, label: 'List' },
        { key: 'org', icon: GitBranch, label: 'Org Chart' },
        { key: 'power', icon: Target, label: 'Power Map' },
      ].map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => setViewMode(key)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
            viewMode === key
              ? 'bg-surface text-fg shadow-sm'
              : 'text-fg-muted hover:text-fg'
          }`}
        >
          <Icon size={11} /> {label}
        </button>
      ))}
    </div>
  ) : null;

  if (meetingActive && meetingContext?.attendees?.length > 0) {
    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {meetingContext.attendees.map((a, i) => {
            const role = a.roleKey ? ROLES[a.roleKey] : null;
            const kdmData = safeAllPeople.find(p => p.name === a.name);
            const normalizedPerson = useNormalized ? safePersons.find(p => p.canonical_name === a.name) : null;
            const prov = provenanceMap[a.name];
            return (
              <div key={i} className="p-3 bg-primary-50 border-2 border-primary/30 rounded-lg ring-1 ring-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{role?.icon || '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-primary font-bold uppercase tracking-wide">{role?.title || a.role}</span>
                      {normalizedPerson?.role_category && <RoleCategoryBadge category={normalizedPerson.role_category} />}
                      {prov && <ConfidenceTierBadge tier={prov.confidence_tier} />}
                    </div>
                    <div className="font-bold text-sm text-fg">
                      {a.name}
                      {(a.linkedin || normalizedPerson?.linkedin_url) && (
                        <a href={a.linkedin || normalizedPerson.linkedin_url} target="_blank" rel="noopener noreferrer"
                           className="inline-flex ml-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] font-bold text-blue-600 no-underline hover:bg-blue-100"
                           onClick={e => e.stopPropagation()}>in</a>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-white">In Meeting</span>
                </div>
                {(kdmData?.note || a.note || normalizedPerson?.note) && (
                  <p className="text-[10px] text-fg-muted mt-1 leading-relaxed">{normalizedPerson?.note || kdmData?.note || a.note}</p>
                )}
                {role?.objective && (
                  <p className="text-[10px] text-primary/70 italic mt-1.5">
                    <span className="font-bold not-italic">Objective:</span> {role.objective}
                  </p>
                )}
                {prov && (
                  <div className="mt-1.5"><SourceLine provenance={prov} /></div>
                )}
              </div>
            );
          })}
        </div>

        {safeMeetingTips.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">Meeting Tips</div>
            <div className="space-y-1.5">
              {safeMeetingTips.map((tipGroup, i) => (
                <div key={i}>
                  <div className="text-[10px] font-bold text-amber-800">{tipGroup.roleIcon} For {tipGroup.roleTitle}:</div>
                  <ul className="mt-0.5 space-y-0.5">
                    {tipGroup.tips.map((tip, j) => (
                      <li key={j} className="text-[10px] text-amber-900/70 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-amber-400">{tip}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.entries(meetingContext.personResearch || {}).length > 0 && (
          <div className="space-y-2 mt-2">
            {Object.entries(meetingContext.personResearch).map(([name, research]) => (
              <div key={name} className="bg-violet-50/50 border border-violet-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={12} className="text-violet-600" />
                  <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">AI Research: {name}</span>
                  {research._newsFound > 0 && (
                    <span className="text-[9px] text-violet-500">({research._newsFound} news mentions)</span>
                  )}
                </div>
                <p className="text-[11px] text-fg-subtle mb-2">{research.personSummary}</p>
                {research.likelyPriorities?.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold text-violet-600 uppercase">Likely Priorities:</div>
                    {research.likelyPriorities.slice(0, 3).map((p, i) => (
                      <div key={i} className="bg-white rounded-md p-2 border border-violet-100">
                        <div className="text-[11px] font-bold text-fg">{p.priority}</div>
                        <div className="text-[10px] text-fg-subtle">{p.detail}</div>
                      </div>
                    ))}
                  </div>
                )}
                {research.suggestedApproach && (
                  <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-md p-2">
                    <div className="text-[9px] font-bold text-emerald-700">Suggested Approach</div>
                    <div className="text-[10px] text-emerald-800">{research.suggestedApproach}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {safeAllPeople.filter(p => !meetingContext.attendees.some(a => a.name === p.name)).length > 0 && (
          <div className="mt-3">
            <div className="text-[9px] font-bold text-fg-disabled uppercase tracking-wider mb-1">Other Key People</div>
            <div className="flex flex-wrap gap-1.5">
              {safeAllPeople.filter(p => !meetingContext.attendees.some(a => a.name === p.name)).slice(0, 6).map((p, i) => (
                <span key={i} className="text-[10px] text-fg-muted bg-surface-2 px-2 py-0.5 rounded">{p.name} — {p.role}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Default mode: view toggle between List / Org Chart / Power Map ──

  if (useNormalized) {
    const groups = groupPersonsByCategory(safePersons);
    const verifiedCount = safePersons.filter(p => p.verified_at || (p.is_legacy === 0 && p.discovery_source !== 'legacy_seed')).length;
    const legacyCount = safePersons.filter(p => p.is_legacy === 1 && !p.verified_at).length;
    const discoveredCount = safePersons.filter(p => p.is_legacy === 0 && p.discovery_source && p.discovery_source !== 'legacy_seed').length;

    return (
      <div>
        {/* Data quality stats */}
        <div className="flex items-center gap-3 mb-2 text-[9px] font-bold">
          <span className="text-fg-muted">{safePersons.length} contacts</span>
          {verifiedCount > 0 && <span className="text-emerald-600 dark:text-emerald-400">{verifiedCount} verified</span>}
          {legacyCount > 0 && <span className="text-amber-600 dark:text-amber-400">{legacyCount} legacy</span>}
          {discoveredCount > 0 && <span className="text-blue-600 dark:text-blue-400">{discoveredCount} discovered</span>}
        </div>

        {ViewToggle}

        {viewMode === 'org' && <OrgChartView persons={safePersons} />}
        {viewMode === 'power' && <PowerMapView bankKey={bankKey} />}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {groups.map(({ category, persons: groupPersons }) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <RoleCategoryBadge category={category} />
                  <span className="text-[9px] text-fg-disabled">{groupPersons.length} {groupPersons.length === 1 ? 'person' : 'people'}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groupPersons.map(person => (
                    <NormalizedPersonCard
                      key={person.id}
                      person={person}
                      provenance={provenanceMap[person.canonical_name]}
                      bankKey={bankKey}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Fallback: legacy allPeople from key_decision_makers[] ──

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {safeTopPeople.map((p, i) => {
          const isTarget = (p.note || '').includes('🎯') || (p.note || '').includes('CRITICAL') || (p.note || '').includes('KEY');
          return (
            <SelectableItem key={i} id={`person-${i}`} label={p.name} category="Key People" content={`**${p.name}** — ${p.role}${p.note ? '\n' + p.note : ''}${p.linkedin ? '\nLinkedIn: ' + p.linkedin : ''}`}>
              <div className={`p-3 border rounded-lg transition-all ${isTarget ? 'bg-primary-50 border-primary/30' : 'bg-surface border-border'}`}>
                <div className="text-[10px] text-fg-muted uppercase tracking-wide">{p.role}</div>
                <div className="font-bold text-sm text-fg mt-0.5">
                  {p.name} {isTarget && <span className="text-primary">🎯</span>}
                  {p.linkedin && <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex ml-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] font-bold text-blue-600 no-underline hover:bg-blue-100" onClick={e => e.stopPropagation()}>in</a>}
                </div>
                {p.note && <p className="text-[10px] text-fg-disabled mt-1 line-clamp-2 hover:line-clamp-none transition-all">{p.note}</p>}
              </div>
            </SelectableItem>
          );
        })}
      </div>
      {safeAllPeople.length > 4 && (
        <button onClick={() => scrollToDeepDive()} className="flex items-center gap-1 mt-2 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors">
          +{safeAllPeople.length - 4} more people in Deep Dive <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}
