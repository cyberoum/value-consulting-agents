import { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, ChevronDown, ChevronUp, X, Plus, Search, Sparkles, HelpCircle, Target, Eye, EyeOff, Loader2, Globe, Lightbulb, AlertTriangle, MessageSquare, ArrowRight, Tag, Zap } from 'lucide-react';
import { ROLES } from '../../data/discoveryQuestions';
import { getRoleForKDM } from '../../utils/meetingTailoring';
import { researchPerson as apiResearchPerson, enrichContext as apiEnrichContext, checkResearchStatus } from '../../data/api';

// ── Knowledge Level Toggle ──────────────────────────────────────────

const KNOWLEDGE_LEVELS = [
  { key: 'unknown', label: "Don't know", icon: <EyeOff size={11} />, color: 'bg-surface-2 text-fg-muted border-border' },
  { key: 'partial', label: 'Some idea', icon: <Eye size={11} />, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'known',   label: 'I know',    icon: <Target size={11} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

function KnowledgeToggle({ label, helpText, value, onChange }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider">{label}</span>
        {helpText && (
          <span className="group relative">
            <HelpCircle size={10} className="text-fg-disabled cursor-help" />
            <span className="absolute left-0 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-primary-900 text-white text-[10px] rounded-lg shadow-lg z-50 leading-relaxed">
              {helpText}
            </span>
          </span>
        )}
      </div>
      <div className="flex gap-1">
        {KNOWLEDGE_LEVELS.map(level => (
          <button
            key={level.key}
            onClick={() => onChange(level.key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
              value === level.key
                ? level.color + ' ring-1 ring-offset-1 ring-primary/20'
                : 'bg-surface border-border text-fg-disabled hover:bg-surface-2'
            }`}
          >
            {level.icon} {level.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Person Chip ─────────────────────────────────────────────────────

function PersonChip({ person, onRemove, onResearch, isResearching }) {
  const role = person.roleKey ? ROLES[person.roleKey] : null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
      person.isKDM
        ? 'bg-primary-50 border-primary/20 text-primary'
        : person.research
          ? 'bg-violet-50 border-violet-200 text-violet-700'
          : 'bg-amber-50 border-amber-200 text-amber-700'
    }`}>
      {isResearching ? (
        <Loader2 size={10} className="animate-spin" />
      ) : (
        <span>{role?.icon || '👤'}</span>
      )}
      <span className="max-w-[120px] truncate">{person.name}</span>
      <span className="text-[9px] font-normal opacity-60">{role?.title || person.customRole || 'Custom'}</span>
      {!person.isKDM && !person.research && !isResearching && onResearch && (
        <button
          onClick={(e) => { e.stopPropagation(); onResearch(person); }}
          className="ml-0.5 text-violet-500 hover:text-violet-700 transition-colors"
          title="Research this person"
        >
          <Globe size={10} />
        </button>
      )}
      {person.research && (
        <span className="text-[8px] text-emerald-600" title="Research complete">✓</span>
      )}
      <button onClick={onRemove} className="ml-0.5 hover:text-danger transition-colors">
        <X size={10} />
      </button>
    </span>
  );
}

// ── Research Result Card ────────────────────────────────────────────

function PersonResearchCard({ research, personName }) {
  const [expanded, setExpanded] = useState(false);

  if (!research) return null;

  return (
    <div className="bg-violet-50/50 border border-violet-200 rounded-lg p-3 space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 text-left"
      >
        <Globe size={12} className="text-violet-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">
            Research: {personName}
            {research._newsFound > 0 && (
              <span className="ml-1 text-[9px] font-normal text-violet-500">
                ({research._newsFound} news mentions found)
              </span>
            )}
          </div>
          <div className="text-[11px] text-fg-subtle line-clamp-2">{research.personSummary}</div>
        </div>
        {expanded ? <ChevronUp size={12} className="text-violet-400" /> : <ChevronDown size={12} className="text-violet-400" />}
      </button>

      {expanded && (
        <div className="space-y-3 pt-2 border-t border-violet-200">
          {/* Priorities */}
          {research.likelyPriorities?.length > 0 && (
            <div>
              <div className="text-[9px] font-bold text-violet-600 uppercase tracking-wider mb-1">Likely Priorities</div>
              <div className="space-y-1.5">
                {research.likelyPriorities.map((p, i) => (
                  <div key={i} className="bg-white rounded-md p-2 border border-violet-100">
                    <div className="text-[11px] font-bold text-fg">{p.priority}</div>
                    <div className="text-[10px] text-fg-subtle">{p.detail}</div>
                    {p.relevanceToBackbase && (
                      <div className="text-[9px] text-primary mt-0.5 italic">{p.relevanceToBackbase}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Topics */}
          {research.conversationTopics?.length > 0 && (
            <div>
              <div className="text-[9px] font-bold text-violet-600 uppercase tracking-wider mb-1">Conversation Starters</div>
              <div className="space-y-1.5">
                {research.conversationTopics.map((t, i) => (
                  <div key={i} className="bg-white rounded-md p-2 border border-violet-100">
                    <div className="text-[11px] font-bold text-fg flex items-center gap-1">
                      <MessageSquare size={9} className="text-violet-500" />
                      {t.topic}
                    </div>
                    <div className="text-[10px] text-fg-subtle italic">"{t.opener}"</div>
                    <div className="text-[9px] text-fg-disabled">Intent: {t.intent}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Watch-outs */}
          {research.watchOuts?.length > 0 && (
            <div>
              <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-1">Watch Out</div>
              {research.watchOuts.map((w, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px] text-amber-700">
                  <AlertTriangle size={9} className="shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Suggested Approach */}
          {research.suggestedApproach && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2">
              <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Suggested Approach</div>
              <div className="text-[10px] text-emerald-800">{research.suggestedApproach}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Context Enrichment Results ──────────────────────────────────────

function ContextEnrichmentCard({ enrichment }) {
  const [expanded, setExpanded] = useState(true);

  if (!enrichment) return null;

  const hasScope = enrichment.scopeEnrichment?.relatedAreas?.length > 0;
  const hasPain = enrichment.painPointEnrichment?.relatedPainPoints?.length > 0;

  return (
    <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border border-emerald-200 rounded-lg p-3 space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 text-left"
      >
        <Lightbulb size={12} className="text-emerald-600 shrink-0" />
        <div className="flex-1">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">AI-Enriched Context</div>
          <div className="text-[11px] text-fg-subtle">{enrichment.keyInsight}</div>
        </div>
        {expanded ? <ChevronUp size={12} className="text-emerald-400" /> : <ChevronDown size={12} className="text-emerald-400" />}
      </button>

      {expanded && (
        <div className="space-y-3 pt-2 border-t border-emerald-200">
          {/* Scope Enrichment */}
          {hasScope && (
            <div>
              <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                Related Scope Areas You May Not Have Considered
              </div>
              {enrichment.scopeEnrichment.validation && (
                <div className="text-[10px] text-fg-subtle mb-1.5 italic">{enrichment.scopeEnrichment.validation}</div>
              )}
              <div className="space-y-1.5">
                {enrichment.scopeEnrichment.relatedAreas.map((a, i) => (
                  <div key={i} className="bg-white rounded-md p-2 border border-emerald-100">
                    <div className="text-[11px] font-bold text-fg flex items-center gap-1">
                      <ArrowRight size={9} className="text-emerald-500" />
                      {a.area}
                    </div>
                    <div className="text-[10px] text-fg-subtle">{a.connection}</div>
                    {a.question && (
                      <div className="text-[10px] text-primary mt-0.5 italic">Ask: "{a.question}"</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pain Point Enrichment */}
          {hasPain && (
            <div>
              <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                Related Pain Points to Explore
              </div>
              {enrichment.painPointEnrichment.validation && (
                <div className="text-[10px] text-fg-subtle mb-1.5 italic">{enrichment.painPointEnrichment.validation}</div>
              )}
              <div className="space-y-1.5">
                {enrichment.painPointEnrichment.relatedPainPoints.map((p, i) => (
                  <div key={i} className="bg-white rounded-md p-2 border border-emerald-100">
                    <div className="text-[11px] font-bold text-fg flex items-center gap-1">
                      <AlertTriangle size={9} className="text-amber-500" />
                      {p.painPoint}
                    </div>
                    <div className="text-[10px] text-fg-subtle">{p.connection}</div>
                    {p.evidence && (
                      <div className="text-[9px] text-fg-disabled">{p.evidence}</div>
                    )}
                    {p.question && (
                      <div className="text-[10px] text-primary mt-0.5 italic">Ask: "{p.question}"</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Strategy */}
          {enrichment.conversationStrategy && (
            <div className="bg-emerald-100/50 border border-emerald-200 rounded-md p-2">
              <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Meeting Strategy</div>
              <div className="text-[10px] text-emerald-800">{enrichment.conversationStrategy}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────

/**
 * MeetingContextBar — interactive panel where the consultant sets up meeting context.
 *
 * Props:
 * - kdms: Array of key decision makers from bank data
 * - meetingContext: { attendees, scopeKnown, painPointKnown, scopeText, painText, personResearch, contextEnrichment }
 * - onContextChange: (newContext) => void
 * - bankName: string — name of the bank (for research queries)
 * - bankKey: string — key of the bank
 */
export default function MeetingContextBar({ kdms = [], meetingContext, onContextChange, onCascade, cascadeStatus, bankName, bankKey }) {
  const [expanded, setExpanded] = useState(() => (meetingContext?.attendees || []).length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [customRoleText, setCustomRoleText] = useState('');
  const [researchingPerson, setResearchingPerson] = useState(null); // name of person being researched
  const [enrichingContext, setEnrichingContext] = useState(false);
  const [researchAvailable, setResearchAvailable] = useState(null);
  const [topicInput, setTopicInput] = useState('');
  // Derive cascade running state from parent cascadeStatus
  const cascadeRunning = cascadeStatus && Object.values(cascadeStatus).some(s => s === 'running');

  const {
    attendees = [],
    scopeKnown = 'unknown',
    painPointKnown = 'unknown',
    scopeText = '',
    painText = '',
    personResearch = {},  // { [personName]: researchResult }
    contextEnrichment = null,
    topics = [],
    meetingPrepBrief = null,
  } = meetingContext || {};

  const isActive = attendees.length > 0;

  // Check research availability on mount
  useEffect(() => {
    checkResearchStatus()
      .then(r => setResearchAvailable(r.available))
      .catch(() => setResearchAvailable(false));
  }, []);

  // KDMs enriched with role matching
  const enrichedKDMs = useMemo(() => {
    return kdms.map(kdm => ({
      ...kdm,
      roleKey: getRoleForKDM(kdm),
      isSelected: attendees.some(a => a.name === kdm.name && a.isKDM),
    }));
  }, [kdms, attendees]);

  // Filter KDMs by search
  const filteredKDMs = useMemo(() => {
    if (!searchQuery.trim()) return enrichedKDMs;
    const q = searchQuery.toLowerCase();
    return enrichedKDMs.filter(k =>
      k.name.toLowerCase().includes(q) ||
      k.role.toLowerCase().includes(q) ||
      (k.roleKey && ROLES[k.roleKey]?.title.toLowerCase().includes(q))
    );
  }, [enrichedKDMs, searchQuery]);

  // ── Event Handlers ──

  const addAttendee = (kdm) => {
    if (attendees.some(a => a.name === kdm.name)) return;
    onContextChange({
      ...meetingContext,
      attendees: [...attendees, {
        name: kdm.name,
        role: kdm.role,
        roleKey: kdm.roleKey || getRoleForKDM(kdm),
        note: kdm.note,
        linkedin: kdm.linkedin,
        isKDM: true,
      }],
    });
  };

  const removeAttendee = (name) => {
    const newResearch = { ...personResearch };
    delete newResearch[name];
    onContextChange({
      ...meetingContext,
      attendees: attendees.filter(a => a.name !== name),
      personResearch: newResearch,
    });
  };

  const addCustomPerson = () => {
    if (!customName.trim()) return;
    const roleStr = customRole === 'Other'
      ? customRoleText.trim() || 'Custom Role'
      : customRole || 'Unknown Role';
    const fakeKDM = { role: roleStr };
    const newAttendee = {
      name: customName.trim(),
      role: roleStr,
      roleKey: getRoleForKDM(fakeKDM),
      customRole: customRole === 'Other' ? customRoleText.trim() : '',
      isKDM: false,
    };
    onContextChange({
      ...meetingContext,
      attendees: [...attendees, newAttendee],
    });
    setCustomName('');
    setCustomRole('');
    setCustomRoleText('');
    setShowCustomInput(false);

    // Auto-trigger research for custom persons
    if (researchAvailable && bankName) {
      triggerPersonResearch(newAttendee);
    }
  };

  const triggerPersonResearch = useCallback(async (person) => {
    if (!bankName) return;
    setResearchingPerson(person.name);
    try {
      const { result } = await apiResearchPerson({
        name: person.name,
        role: person.role,
        customRole: person.customRole,
        bankName,
      });
      // Update the person's research in meeting context
      onContextChange(prev => ({
        ...prev,
        personResearch: { ...prev.personResearch, [person.name]: result },
        attendees: prev.attendees.map(a =>
          a.name === person.name ? { ...a, research: result } : a
        ),
      }));
    } catch (err) {
      console.error('Person research failed:', err);
    } finally {
      setResearchingPerson(null);
    }
  }, [bankName, onContextChange]);

  const triggerContextEnrichment = useCallback(async () => {
    if (!bankName || (!scopeText && !painText)) return;
    setEnrichingContext(true);
    try {
      const { result } = await apiEnrichContext({
        bankName,
        scopeText,
        painText,
        attendeeRoles: attendees.map(a => a.role),
      });
      onContextChange(prev => ({
        ...prev,
        contextEnrichment: result,
      }));
    } catch (err) {
      console.error('Context enrichment failed:', err);
    } finally {
      setEnrichingContext(false);
    }
  }, [bankName, scopeText, painText, attendees, onContextChange]);

  // ── Topic Management ──

  const addTopic = (text) => {
    const cleaned = text.trim().replace(/,$/,'').trim();
    if (!cleaned || topics.some(t => t.toLowerCase() === cleaned.toLowerCase())) return;
    onContextChange(prev => ({ ...prev, topics: [...(prev.topics || []), cleaned] }));
  };

  const removeTopic = (topic) => {
    onContextChange(prev => ({ ...prev, topics: (prev.topics || []).filter(t => t !== topic) }));
  };

  const handleTopicKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTopic(topicInput);
      setTopicInput('');
    } else if (e.key === 'Backspace' && !topicInput && topics.length > 0) {
      removeTopic(topics[topics.length - 1]);
    }
  };

  // ── Generate AI Meeting Brief ──

  // Cascade trigger — delegates to parent BankPage for full cascade orchestration
  const triggerCascade = useCallback(() => {
    if (!bankName || !bankKey || topics.length === 0) return;
    if (onCascade) {
      // Delegate to parent cascade handler (Meeting Prep → Storyline → LZ → VH in parallel)
      onCascade({
        attendees: attendees.map(a => ({
          name: a.name,
          role: a.role,
          customRole: a.customRole,
          isKDM: a.isKDM,
        })),
        topics,
        scopeKnown,
        painPointKnown,
        scopeText,
        painText,
      });
    }
  }, [bankName, bankKey, attendees, topics, scopeKnown, painPointKnown, scopeText, painText, onCascade]);

  const resetContext = () => {
    onContextChange({
      attendees: [], scopeKnown: 'unknown', painPointKnown: 'unknown',
      scopeText: '', painText: '', personResearch: {}, contextEnrichment: null,
      topics: [], meetingPrepBrief: null,
    });
    setExpanded(false);
  };

  // ── Collapsed View ──

  if (!expanded) {
    return (
      <div className={`mb-5 rounded-xl border transition-all ${
        isActive
          ? 'bg-gradient-to-r from-primary-50 to-violet-50 border-primary/20'
          : 'bg-surface-2 border-border hover:border-primary/20'
      }`}>
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isActive ? 'bg-primary text-white' : 'bg-surface border border-border text-fg-muted'
          }`}>
            {isActive ? <Sparkles size={14} /> : <Users size={14} />}
          </div>
          <div className="flex-1 min-w-0">
            {isActive ? (
              <>
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Meeting Tailored</div>
                <div className="text-xs text-fg-subtle truncate">
                  {attendees.map(a => a.name).join(', ')}
                  {topics.length > 0 && (
                    <span className="text-indigo-500 ml-2">
                      | Topics: {topics.join(', ')}
                    </span>
                  )}
                  <span className="text-fg-disabled ml-2">
                    | Scope: {scopeKnown} | Pain: {painPointKnown}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-xs font-bold text-fg">Who are you meeting?</div>
                <div className="text-[10px] text-fg-disabled">Select attendees to tailor this brief to your meeting</div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isActive && (
              <span
                onClick={(e) => { e.stopPropagation(); resetContext(); }}
                className="text-[10px] font-bold text-danger hover:text-danger/80 cursor-pointer"
              >
                Reset
              </span>
            )}
            <ChevronDown size={14} className="text-fg-muted" />
          </div>
        </button>
      </div>
    );
  }

  // ── Expanded View ──

  return (
    <div className="mb-5 rounded-xl border border-primary/20 bg-gradient-to-br from-primary-50/50 to-violet-50/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <Users size={13} className="text-white" />
          </div>
          <div>
            <div className="text-xs font-black text-fg">Meeting Setup</div>
            <div className="text-[10px] text-fg-disabled">Select who you're meeting and what you know</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <button onClick={resetContext} className="text-[10px] font-bold text-danger hover:text-danger/80 px-2 py-1 rounded">
              Reset
            </button>
          )}
          <button onClick={() => setExpanded(false)} className="p-1 hover:bg-white/50 rounded transition-colors">
            <ChevronUp size={14} className="text-fg-muted" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Selected attendees */}
        {attendees.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-2">Meeting With</div>
            <div className="flex flex-wrap gap-1.5">
              {attendees.map(a => (
                <PersonChip
                  key={a.name}
                  person={a}
                  onRemove={() => removeAttendee(a.name)}
                  onResearch={researchAvailable ? triggerPersonResearch : null}
                  isResearching={researchingPerson === a.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Person research results */}
        {Object.keys(personResearch).length > 0 && (
          <div className="space-y-2">
            {Object.entries(personResearch).map(([name, research]) => (
              <PersonResearchCard key={name} personName={name} research={research} />
            ))}
          </div>
        )}

        {/* Research in progress indicator */}
        {researchingPerson && (
          <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg">
            <Loader2 size={12} className="animate-spin text-violet-600" />
            <span className="text-[11px] text-violet-700">
              Researching {researchingPerson}... Searching news & generating intelligence brief
            </span>
          </div>
        )}

        {/* KDM selector */}
        <div>
          <div className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-2">
            {attendees.length > 0 ? 'Add More People' : 'Select Attendees'}
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-disabled" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or role..."
              className="w-full pl-7 pr-3 py-2 text-xs bg-white border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40"
            />
          </div>

          {/* KDM grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
            {filteredKDMs.map((kdm, i) => {
              const role = kdm.roleKey ? ROLES[kdm.roleKey] : null;
              const isTarget = (kdm.note || '').includes('🎯') || (kdm.note || '').includes('CRITICAL') || (kdm.note || '').includes('KEY') || (kdm.note || '').includes('TARGET');
              return (
                <button
                  key={i}
                  onClick={() => kdm.isSelected ? removeAttendee(kdm.name) : addAttendee(kdm)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                    kdm.isSelected
                      ? 'bg-primary-50 border-primary/30 ring-1 ring-primary/20'
                      : isTarget
                        ? 'bg-white border-primary/10 hover:border-primary/30'
                        : 'bg-white border-border hover:border-primary/20'
                  }`}
                >
                  <span className="text-sm shrink-0">{role?.icon || '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-fg truncate">
                      {kdm.name} {isTarget && <span className="text-primary">🎯</span>}
                    </div>
                    <div className="text-[9px] text-fg-disabled truncate">{kdm.role}</div>
                  </div>
                  {kdm.isSelected && (
                    <span className="text-[9px] font-bold text-primary">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Add custom person */}
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
            >
              <Plus size={10} /> Add someone not in the list
            </button>
          ) : (
            <div className="mt-2 p-3 bg-white border border-border rounded-lg space-y-2">
              <div className="text-[10px] font-bold text-fg-muted uppercase tracking-wider">Custom Attendee</div>
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Full name (e.g., John Smith)"
                className="w-full px-2.5 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <select
                  value={customRole}
                  onChange={e => { setCustomRole(e.target.value); if (e.target.value !== 'Other') setCustomRoleText(''); }}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="">Select role...</option>
                  {Object.entries(ROLES).map(([key, role]) => (
                    <option key={key} value={role.aliases[0]}>{role.icon} {role.title}</option>
                  ))}
                  <option value="Other">✏️ Other (type custom role)</option>
                </select>
              </div>
              {/* Custom role text input — appears when "Other" is selected */}
              {customRole === 'Other' && (
                <input
                  type="text"
                  value={customRoleText}
                  onChange={e => setCustomRoleText(e.target.value)}
                  placeholder="Type the role (e.g., Head of AI, VP Strategy, Director of Payments...)"
                  className="w-full px-2.5 py-1.5 text-xs border border-violet-200 rounded-lg bg-violet-50/50 focus:outline-none focus:ring-1 focus:ring-violet-300 placeholder:text-violet-300"
                  autoFocus
                />
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={addCustomPerson}
                  disabled={!customName.trim()}
                  className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  {researchAvailable ? 'Add & Research' : 'Add'}
                </button>
                <button
                  onClick={() => { setShowCustomInput(false); setCustomName(''); setCustomRole(''); setCustomRoleText(''); }}
                  className="px-3 py-1.5 text-[10px] font-bold text-fg-muted hover:text-fg transition-colors"
                >
                  Cancel
                </button>
                {researchAvailable && (
                  <span className="text-[9px] text-violet-500 flex items-center gap-1">
                    <Globe size={8} /> AI will research this person
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Knowledge level toggles + text areas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-primary/10">
          {/* Scope */}
          <div>
            <KnowledgeToggle
              label="Scope"
              helpText="Do you know what areas/products the bank wants to discuss? Known = specific zones identified. Unknown = first exploratory meeting."
              value={scopeKnown}
              onChange={(v) => onContextChange({ ...meetingContext, scopeKnown: v })}
            />
            {(scopeKnown === 'partial' || scopeKnown === 'known') && (
              <textarea
                value={scopeText}
                onChange={e => onContextChange({ ...meetingContext, scopeText: e.target.value })}
                placeholder={scopeKnown === 'known'
                  ? "What's the scope? (e.g., Digital onboarding for retail, mobile app modernization...)"
                  : "What do you have an idea about? (e.g., They mentioned digital channels, not sure about specific areas...)"
                }
                rows={2}
                className="mt-2 w-full px-2.5 py-2 text-[11px] bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-300 placeholder:text-emerald-300 resize-none leading-relaxed"
              />
            )}
          </div>

          {/* Pain Points */}
          <div>
            <KnowledgeToggle
              label="Pain Points"
              helpText="Do you know what problems the bank is facing? Known = specific pain points identified. Unknown = need to discover."
              value={painPointKnown}
              onChange={(v) => onContextChange({ ...meetingContext, painPointKnown: v })}
            />
            {(painPointKnown === 'partial' || painPointKnown === 'known') && (
              <textarea
                value={painText}
                onChange={e => onContextChange({ ...meetingContext, painText: e.target.value })}
                placeholder={painPointKnown === 'known'
                  ? "What are the pain points? (e.g., High customer acquisition cost, slow time-to-market, fragmented platform...)"
                  : "What do you have an idea about? (e.g., They seem frustrated with their current vendor, mention cost a lot...)"
                }
                rows={2}
                className="mt-2 w-full px-2.5 py-2 text-[11px] bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-300 placeholder:text-emerald-300 resize-none leading-relaxed"
              />
            )}
          </div>
        </div>

        {/* ── Topics Tag Input ── */}
        <div className="pt-2 border-t border-primary/10">
          <div className="flex items-center gap-1.5 mb-2">
            <Tag size={10} className="text-indigo-500" />
            <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider">Meeting Topics</span>
            <span className="text-[9px] text-fg-disabled">(What do they care about?)</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white border border-indigo-200 rounded-lg min-h-[36px] focus-within:ring-1 focus-within:ring-indigo-300 focus-within:border-indigo-400 transition-all">
            {topics.map(topic => (
              <span
                key={topic}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200"
              >
                {topic}
                <button onClick={() => removeTopic(topic)} className="hover:text-danger transition-colors">
                  <X size={9} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              onKeyDown={handleTopicKeyDown}
              onBlur={() => { if (topicInput.trim()) { addTopic(topicInput); setTopicInput(''); } }}
              placeholder={topics.length === 0 ? 'Type a topic and press Enter (e.g., AI, SME, Payments, Onboarding...)' : 'Add another...'}
              className="flex-1 min-w-[120px] px-1 py-0.5 text-xs bg-transparent border-none outline-none placeholder:text-indigo-300"
            />
          </div>
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['AI', 'SME', 'Retail', 'Onboarding', 'Mobile', 'Payments', 'Lending', 'Wealth'].filter(s => !topics.some(t => t.toLowerCase() === s.toLowerCase())).slice(0, 4).map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => addTopic(suggestion)}
                  className="text-[9px] text-indigo-400 hover:text-indigo-600 border border-dashed border-indigo-200 hover:border-indigo-400 px-1.5 py-0.5 rounded-full transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          )}
          {topics.length === 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="text-[9px] text-fg-disabled mr-1">Suggestions:</span>
              {['AI', 'SME', 'Retail', 'Onboarding', 'Mobile', 'Payments', 'Lending', 'Wealth'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => addTopic(suggestion)}
                  className="text-[9px] text-indigo-400 hover:text-indigo-600 border border-dashed border-indigo-200 hover:border-indigo-400 px-1.5 py-0.5 rounded-full transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Enrich button — appears when there's text to enrich */}
        {researchAvailable && (scopeText.trim() || painText.trim()) && (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={triggerContextEnrichment}
              disabled={enrichingContext}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {enrichingContext ? (
                <><Loader2 size={10} className="animate-spin" /> Researching...</>
              ) : (
                <><Sparkles size={10} /> Enrich with AI</>
              )}
            </button>
            <span className="text-[9px] text-fg-disabled">
              AI will search for related topics & suggest pain points you may not have considered
            </span>
          </div>
        )}

        {/* Context enrichment results */}
        {contextEnrichment && (
          <ContextEnrichmentCard enrichment={contextEnrichment} />
        )}

        {/* Enrichment in progress */}
        {enrichingContext && !contextEnrichment && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <Loader2 size={12} className="animate-spin text-emerald-600" />
            <span className="text-[11px] text-emerald-700">
              Researching scope & pain points... Searching news, analyzing industry trends
            </span>
          </div>
        )}

        {/* ── Prepare Full Meeting Intelligence (Cascade) ── */}
        {researchAvailable && attendees.length > 0 && topics.length > 0 && (
          <div className="pt-2 border-t border-indigo-200">
            <button
              onClick={triggerCascade}
              disabled={cascadeRunning}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white text-sm font-black rounded-xl hover:from-primary/90 hover:to-indigo-700 transition-all disabled:opacity-60 shadow-lg shadow-primary/20"
            >
              {cascadeRunning ? (
                <><Loader2 size={16} className="animate-spin" /> Preparing Meeting Intelligence...</>
              ) : (
                <><Zap size={16} /> Prepare Full Meeting Intelligence</>
              )}
            </button>
            <div className="text-center text-[9px] text-fg-disabled mt-1.5">
              {cascadeRunning
                ? 'Generating meeting brief, storyline, landing zones, and value hypothesis...'
                : `${attendees.length} attendee${attendees.length > 1 ? 's' : ''} × ${topics.length} topic${topics.length > 1 ? 's' : ''} → brief, storyline, zones & hypothesis`
              }
            </div>
            {meetingPrepBrief && !cascadeRunning && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-emerald-600 font-bold text-[11px]">✓ Meeting intelligence ready</span>
                <span className="text-[9px] text-emerald-500">Page tailored to your meeting context</span>
              </div>
            )}
          </div>
        )}

        {/* Apply / summary */}
        {isActive && (
          <div className="flex items-center gap-3 pt-3 border-t border-primary/10">
            <Sparkles size={14} className="text-primary shrink-0" />
            <div className="flex-1 text-[11px] text-fg-subtle leading-relaxed">
              <span className="font-bold text-primary">Brief tailored for:</span>{' '}
              {attendees.map(a => a.name).join(', ')}.
              {' '}Zones, questions, and ROI framing adjusted to match their roles.
              {Object.keys(personResearch).length > 0 && (
                <span className="text-violet-600"> + AI research on {Object.keys(personResearch).length} person(s).</span>
              )}
              {contextEnrichment && (
                <span className="text-emerald-600"> + AI-enriched context.</span>
              )}
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shrink-0"
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
