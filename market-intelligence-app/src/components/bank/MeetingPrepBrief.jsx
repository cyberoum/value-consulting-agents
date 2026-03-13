import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Copy, Check, User, Lightbulb, AlertTriangle, MessageSquare, TrendingUp, Eye, Zap, ArrowRight, Target } from 'lucide-react';

// ── Markdown Export ──

function briefToMarkdown(brief, bankName) {
  const lines = [`# Meeting Prep Brief — ${bankName}`, ''];

  // Person Intelligence
  if (brief.personIntelligence) {
    const pi = brief.personIntelligence;
    lines.push('## 👤 Person Intelligence', '', pi.summary || '', '');
    if (pi.priorities?.length) {
      lines.push('### Likely Priorities');
      pi.priorities.forEach(p => lines.push(`- **${p.priority || p}**${p.detail ? `: ${p.detail}` : ''}`));
      lines.push('');
    }
    if (pi.approach) lines.push(`**Suggested Approach:** ${pi.approach}`, '');
  }

  // Topic Insights
  if (brief.topicInsights?.length) {
    lines.push('## 💡 Topic Insights', '');
    brief.topicInsights.forEach(t => {
      lines.push(`### ${t.topic}`);
      if (t.bankCurrentState) lines.push(`**Bank Current State:** ${t.bankCurrentState}`);
      if (t.painPoints?.length) {
        lines.push('**Pain Points:**');
        t.painPoints.forEach(p => lines.push(`- ${p}`));
      }
      if (t.backbaseOffering) lines.push(`**Backbase Offering:** ${t.backbaseOffering}`);
      if (t.talkingPoints?.length) {
        lines.push('**Talking Points:**');
        t.talkingPoints.forEach(p => lines.push(`- ${p}`));
      }
      if (t.openingQuestion) lines.push(`**Opening Question:** ${t.openingQuestion}`);
      lines.push('');
    });
  }

  // Dark Zones
  if (brief.darkZones?.length) {
    lines.push('## 🔍 Dark Zones (Blind Spots)', '');
    brief.darkZones.forEach(d => {
      lines.push(`### ${d.zone}`);
      if (d.insight) lines.push(d.insight);
      if (d.provocation) lines.push(`**Provocative Question:** ${d.provocation}`);
      if (d.backbaseSolution) lines.push(`**Backbase Solution:** ${d.backbaseSolution}`);
      lines.push('');
    });
  }

  // Conversation Flow
  if (brief.conversationFlow) {
    const cf = brief.conversationFlow;
    lines.push('## 🗣️ Conversation Flow', '');
    if (cf.opening) lines.push(`**Opening:** ${cf.opening}`, '');
    if (cf.middleSequence?.length) {
      lines.push('**Sequence:**');
      cf.middleSequence.forEach((s, i) => lines.push(`${i + 1}. ${typeof s === 'string' ? s : `**${s.phase || ''}** — ${s.objective || ''}`}`));
      lines.push('');
    }
    if (cf.closing) lines.push(`**Closing:** ${cf.closing}`, '');
  }

  // Quick Value
  if (brief.quickValueEstimate) {
    const qv = brief.quickValueEstimate;
    lines.push('## 💰 Quick Value Estimate', '');
    if (qv.narrative) lines.push(qv.narrative);
    if (qv.suggestedMetric) lines.push(`**Anchor Metric:** ${qv.suggestedMetric}`);
    lines.push('');
  }

  // Watch-Outs
  if (brief.watchOuts?.length) {
    lines.push('## ⚠️ Watch-Outs', '');
    brief.watchOuts.forEach(w => lines.push(`- ${w}`));
    lines.push('');
  }

  return lines.join('\n');
}

// ── Section Components ──

function SectionHeader({ icon: Icon, title, color, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border rounded-xl overflow-hidden ${color}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
      >
        <Icon size={14} className="shrink-0" />
        <span className="flex-1 text-xs font-black uppercase tracking-wider">{title}</span>
        {children && (
          <span className="text-[10px] font-bold opacity-60 mr-2">{children}</span>
        )}
        {open ? <ChevronUp size={12} className="opacity-50" /> : <ChevronDown size={12} className="opacity-50" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Content injected by parent */}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──

/**
 * MeetingPrepBrief — renders the AI-generated meeting preparation brief.
 *
 * Props:
 * - brief: The structured brief JSON from meetingPrepAgent
 * - bankName: Bank name for header
 * - onClear: () => void — clears the brief
 */
export default function MeetingPrepBrief({ brief, bankName, onClear }) {
  const [copied, setCopied] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    person: true,
    topics: true,
    darkZones: true,
    flow: true,
    value: true,
    watchOuts: true,
  });

  if (!brief) return null;

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTopic = (idx) => {
    setExpandedTopics(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyBrief = async () => {
    try {
      const md = briefToMarkdown(brief, bankName);
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/30 to-violet-50/30 overflow-hidden shadow-lg shadow-indigo-100/50">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Zap size={16} />
          </div>
          <div>
            <div className="text-sm font-black tracking-wide">AI Meeting Brief</div>
            <div className="text-[10px] text-white/70">{bankName} — Generated {new Date().toLocaleDateString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyBrief}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold transition-colors"
          >
            {copied ? <><Check size={10} /> Copied!</> : <><Copy size={10} /> Copy Brief</>}
          </button>
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Dismiss brief"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* ── Person Intelligence ── */}
        {brief.personIntelligence && (
          <div className="border border-violet-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('person')}
              className="w-full flex items-center gap-2 px-4 py-3 bg-violet-50 text-left hover:bg-violet-100/70 transition-colors"
            >
              <User size={14} className="text-violet-600 shrink-0" />
              <span className="flex-1 text-xs font-black text-violet-700 uppercase tracking-wider">Person Intelligence</span>
              {expandedSections.person ? <ChevronUp size={12} className="text-violet-400" /> : <ChevronDown size={12} className="text-violet-400" />}
            </button>
            {expandedSections.person && (
              <div className="px-4 pb-4 pt-3 space-y-3 bg-white">
                <p className="text-[11px] text-fg-subtle leading-relaxed">{brief.personIntelligence.summary}</p>

                {brief.personIntelligence.priorities?.length > 0 && (
                  <div>
                    <div className="text-[9px] font-bold text-violet-600 uppercase tracking-wider mb-1.5">Likely Priorities</div>
                    <div className="flex flex-wrap gap-1.5">
                      {brief.personIntelligence.priorities.map((p, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700 border border-violet-200"
                          title={typeof p === 'string' ? p : p.detail}
                        >
                          {typeof p === 'string' ? p : p.priority}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {brief.personIntelligence.approach && (
                  <div className="bg-violet-50 border border-violet-100 rounded-lg p-3">
                    <div className="text-[9px] font-bold text-violet-600 uppercase tracking-wider mb-0.5">Approach</div>
                    <p className="text-[11px] text-violet-800 leading-relaxed">{brief.personIntelligence.approach}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Topic Insights ── */}
        {brief.topicInsights?.length > 0 && (
          <div className="border border-primary/20 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('topics')}
              className="w-full flex items-center gap-2 px-4 py-3 bg-primary-50 text-left hover:bg-primary-100/50 transition-colors"
            >
              <Lightbulb size={14} className="text-primary shrink-0" />
              <span className="flex-1 text-xs font-black text-primary uppercase tracking-wider">Topic Insights</span>
              <span className="text-[10px] font-bold text-primary/60 mr-2">{brief.topicInsights.length} topics</span>
              {expandedSections.topics ? <ChevronUp size={12} className="text-primary/40" /> : <ChevronDown size={12} className="text-primary/40" />}
            </button>
            {expandedSections.topics && (
              <div className="px-4 pb-4 pt-3 space-y-3 bg-white">
                {brief.topicInsights.map((topic, idx) => {
                  const isOpen = expandedTopics[idx] !== false; // default open
                  return (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleTopic(idx)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 text-left hover:bg-gray-100 transition-colors"
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[9px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="flex-1 text-[11px] font-black text-fg">{topic.topic}</span>
                        {isOpen ? <ChevronUp size={10} className="text-fg-disabled" /> : <ChevronDown size={10} className="text-fg-disabled" />}
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 pt-2 space-y-2.5">
                          {/* Bank Current State */}
                          {topic.bankCurrentState && (
                            <div>
                              <div className="text-[9px] font-bold text-fg-muted uppercase tracking-wider mb-0.5">Bank Current State</div>
                              <p className="text-[11px] text-fg-subtle leading-relaxed">{topic.bankCurrentState}</p>
                            </div>
                          )}

                          {/* Pain Points */}
                          {topic.painPoints?.length > 0 && (
                            <div>
                              <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-1">Pain Points</div>
                              <div className="space-y-1">
                                {topic.painPoints.map((p, i) => (
                                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-fg-subtle">
                                    <AlertTriangle size={9} className="text-amber-500 shrink-0 mt-0.5" />
                                    <span>{p}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Backbase Offering */}
                          {topic.backbaseOffering && (
                            <div className="bg-primary-50 border border-primary/10 rounded-lg p-2.5">
                              <div className="text-[9px] font-bold text-primary uppercase tracking-wider mb-0.5">Backbase Offering</div>
                              <p className="text-[10px] text-primary/80 leading-relaxed">{topic.backbaseOffering}</p>
                            </div>
                          )}

                          {/* Talking Points */}
                          {topic.talkingPoints?.length > 0 && (
                            <div>
                              <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Talking Points</div>
                              <div className="space-y-1">
                                {topic.talkingPoints.map((p, i) => (
                                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-fg-subtle">
                                    <ArrowRight size={9} className="text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{p}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Opening Question */}
                          {topic.openingQuestion && (
                            <div className="flex items-start gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg p-2.5">
                              <MessageSquare size={10} className="text-indigo-500 shrink-0 mt-0.5" />
                              <div>
                                <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Opening Question</div>
                                <p className="text-[11px] text-indigo-800 italic leading-relaxed">"{topic.openingQuestion}"</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Dark Zones ── */}
        {brief.darkZones?.length > 0 && (
          <div className="border border-amber-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('darkZones')}
              className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-50 to-red-50 text-left hover:from-amber-100/70 hover:to-red-100/50 transition-colors"
            >
              <Eye size={14} className="text-amber-600 shrink-0" />
              <span className="flex-1 text-xs font-black text-amber-700 uppercase tracking-wider">Dark Zones — Blind Spots</span>
              <span className="text-[10px] font-bold text-amber-500 mr-2">{brief.darkZones.length} identified</span>
              {expandedSections.darkZones ? <ChevronUp size={12} className="text-amber-400" /> : <ChevronDown size={12} className="text-amber-400" />}
            </button>
            {expandedSections.darkZones && (
              <div className="px-4 pb-4 pt-3 space-y-3 bg-white">
                {brief.darkZones.map((dz, i) => (
                  <div key={i} className="border border-amber-200 rounded-lg p-3 space-y-2 bg-amber-50/30">
                    <div className="flex items-center gap-2">
                      <Target size={12} className="text-red-500 shrink-0" />
                      <span className="text-[11px] font-black text-fg">{dz.zone}</span>
                    </div>
                    {dz.insight && (
                      <p className="text-[10px] text-fg-subtle leading-relaxed">{dz.insight}</p>
                    )}
                    {dz.provocation && (
                      <div className="bg-amber-100/50 border border-amber-200 rounded-md p-2">
                        <div className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Provocative Question</div>
                        <p className="text-[10px] text-amber-800 italic">"{dz.provocation}"</p>
                      </div>
                    )}
                    {dz.backbaseSolution && (
                      <div className="bg-primary-50 border border-primary/10 rounded-md p-2">
                        <div className="text-[9px] font-bold text-primary uppercase tracking-wider mb-0.5">Backbase Solution</div>
                        <p className="text-[10px] text-primary/80">{dz.backbaseSolution}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Conversation Flow ── */}
        {brief.conversationFlow && (
          <div className="border border-emerald-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('flow')}
              className="w-full flex items-center gap-2 px-4 py-3 bg-emerald-50 text-left hover:bg-emerald-100/70 transition-colors"
            >
              <MessageSquare size={14} className="text-emerald-600 shrink-0" />
              <span className="flex-1 text-xs font-black text-emerald-700 uppercase tracking-wider">Conversation Flow</span>
              {expandedSections.flow ? <ChevronUp size={12} className="text-emerald-400" /> : <ChevronDown size={12} className="text-emerald-400" />}
            </button>
            {expandedSections.flow && (
              <div className="px-4 pb-4 pt-3 space-y-3 bg-white">
                {/* Opening */}
                {brief.conversationFlow.opening && (
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-emerald-700">1</span>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Opening</div>
                      <p className="text-[11px] text-fg-subtle leading-relaxed">{brief.conversationFlow.opening}</p>
                    </div>
                  </div>
                )}

                {/* Middle Sequence */}
                {brief.conversationFlow.middleSequence?.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-emerald-700">{i + 2}</span>
                    </div>
                    {typeof step === 'string' ? (
                      <p className="text-[11px] text-fg-subtle leading-relaxed pt-0.5">{step}</p>
                    ) : (
                      <div className="pt-0.5">
                        <div className="text-[10px] font-bold text-emerald-700">{step.phase || step.title || `Step ${i + 2}`}</div>
                        <p className="text-[11px] text-fg-subtle leading-relaxed">{step.objective || step.description || ''}</p>
                        {step.transition && <p className="text-[10px] text-fg-disabled italic mt-0.5">→ {step.transition}</p>}
                      </div>
                    )}
                  </div>
                ))}

                {/* Closing */}
                {brief.conversationFlow.closing && (
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-white">✓</span>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Closing</div>
                      <p className="text-[11px] text-fg-subtle leading-relaxed">{brief.conversationFlow.closing}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Quick Value Estimate ── */}
        {brief.quickValueEstimate && (
          <div className="border border-emerald-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('value')}
              className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 text-left hover:from-emerald-100/70 hover:to-teal-100/50 transition-colors"
            >
              <TrendingUp size={14} className="text-emerald-600 shrink-0" />
              <span className="flex-1 text-xs font-black text-emerald-700 uppercase tracking-wider">Quick Value Estimate</span>
              {expandedSections.value ? <ChevronUp size={12} className="text-emerald-400" /> : <ChevronDown size={12} className="text-emerald-400" />}
            </button>
            {expandedSections.value && (
              <div className="px-4 pb-4 pt-3 space-y-2 bg-white">
                {brief.quickValueEstimate.narrative && (
                  <p className="text-[11px] text-fg-subtle leading-relaxed">{brief.quickValueEstimate.narrative}</p>
                )}
                {brief.quickValueEstimate.suggestedMetric && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Anchor Metric</div>
                    <p className="text-[11px] text-emerald-800 font-bold">{brief.quickValueEstimate.suggestedMetric}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Watch-Outs ── */}
        {brief.watchOuts?.length > 0 && (
          <div className="border border-amber-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('watchOuts')}
              className="w-full flex items-center gap-2 px-4 py-3 bg-amber-50 text-left hover:bg-amber-100/70 transition-colors"
            >
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              <span className="flex-1 text-xs font-black text-amber-700 uppercase tracking-wider">Watch-Outs</span>
              <span className="text-[10px] font-bold text-amber-500 mr-2">{brief.watchOuts.length}</span>
              {expandedSections.watchOuts ? <ChevronUp size={12} className="text-amber-400" /> : <ChevronDown size={12} className="text-amber-400" />}
            </button>
            {expandedSections.watchOuts && (
              <div className="px-4 pb-4 pt-3 space-y-2 bg-white">
                {brief.watchOuts.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-amber-800">
                    <AlertTriangle size={10} className="text-amber-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
