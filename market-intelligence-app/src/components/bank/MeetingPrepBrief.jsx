import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, X, Copy, Check, User, Lightbulb,
  AlertTriangle, MessageSquare, TrendingUp, Eye, Zap, ArrowRight,
  Target, Maximize2, Minimize2, Layers, Shield, Briefcase,
  Building2, Compass, Loader2, MapPin, Swords,
  ClipboardList, Send, Calendar, UserPlus, Flag, Star, ThumbsUp,
} from 'lucide-react';
import { generateEngagementPlan as apiGenerateEngagementPlan, submitBriefFeedback as apiSubmitFeedback, generateMeetingDeck as apiGenerateMeetingDeck } from '../../data/api';
import ConfidenceTierBadge from '../common/ConfidenceTierBadge';

// ─── Meeting Deck HTML builder ──────────────────────────

function buildDeckHtml(bankName, slides) {
  const slideHtml = slides.map((s, i) => `
    <div class="slide">
      <div class="slide-number">${i + 1} / ${slides.length}</div>
      <h2>${s.title}</h2>
      ${s.subtitle ? `<p class="subtitle">${s.subtitle}</p>` : ''}
      <ul>${(s.bullets || []).map(b => `<li>${b}</li>`).join('')}</ul>
      ${s.speaker_notes ? `<div class="notes"><strong>Speaker notes:</strong> ${s.speaker_notes}</div>` : ''}
    </div>
  `).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Meeting Deck - ${bankName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#091C35;color:white;overflow-x:hidden}
.slide{min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:8vh 10vw;position:relative}
.slide:nth-child(odd){background:#091C35}
.slide:nth-child(even){background:#0D2847}
.slide-number{position:absolute;top:30px;right:40px;font-size:12px;color:rgba(255,255,255,0.3)}
h2{font-size:clamp(28px,4vw,48px);font-weight:900;margin-bottom:20px;color:white}
.subtitle{font-size:16px;color:#69FEFF;margin-bottom:30px;font-weight:600}
ul{list-style:none;padding:0}
li{font-size:18px;line-height:1.8;padding:8px 0;padding-left:24px;position:relative;color:rgba(255,255,255,0.85)}
li:before{content:'';position:absolute;left:0;top:16px;width:8px;height:8px;border-radius:50%;background:#3366FF}
.notes{margin-top:40px;padding:16px;background:rgba(255,255,255,0.05);border-radius:8px;font-size:13px;color:rgba(255,255,255,0.5);border-left:3px solid #3366FF}
.cover{text-align:center;background:linear-gradient(135deg,#091C35 0%,#0D2847 50%,#091C35 100%)}
.cover h1{font-size:clamp(36px,5vw,64px);font-weight:900;margin-bottom:12px}
.cover .brand{font-size:14px;letter-spacing:3px;color:#3366FF;text-transform:uppercase;margin-bottom:40px}
@media print{.slide{page-break-after:always;min-height:auto;padding:2cm}.notes{display:none}}
</style></head><body>
<div class="slide cover">
  <div class="brand">Backbase</div>
  <h1>${bankName}</h1>
  <p style="color:rgba(255,255,255,0.5);font-size:14px">${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
</div>
${slideHtml}
<div class="slide" style="text-align:center">
  <h2 style="color:#3366FF">Thank You</h2>
  <p style="color:rgba(255,255,255,0.5);margin-top:20px;font-size:16px">Backbase — Engagement Banking Platform</p>
</div>
</body></html>`;
}

// ─── Markdown helpers ────────────────────────────────────

function briefToMarkdown(brief, bankName) {
  const lines = [`# Meeting Prep Brief — ${bankName}`, ''];
  // Strategic Priorities at the top
  if (brief.strategicPriorities?.length) {
    lines.push('## Strategic Priorities for This Meeting', '');
    brief.strategicPriorities.forEach(sp => {
      lines.push(`- **${sp.area}**${sp.inferred ? ' *(inferred)*' : ''} — ${sp.whyItMatters} — ${sp.backbaseAngle} — Hook: "${sp.conversationHook}"`);
    });
    if (brief.budgetUnlock) {
      lines.push('', `> 💰 **Budget Unlock:** ${brief.budgetUnlock}`);
    }
    lines.push('');
  }
  if (brief.personIntelligence) {
    const pi = brief.personIntelligence;
    lines.push('## Priorities', '');
    if (pi.priorities?.length) {
      pi.priorities.forEach(p => lines.push(`- **${typeof p === 'string' ? p : p.priority}**${typeof p !== 'string' && p.detail ? `: ${p.detail}` : ''}`));
      lines.push('');
    }
    lines.push('## Stakeholder Intel', '', pi.summary || '', '');
    if (pi.approach) lines.push(`**Approach:** ${pi.approach}`, '');
  }
  if (brief.topicInsights?.length) {
    lines.push('## Bank Context', '');
    brief.topicInsights.forEach(t => {
      lines.push(`### ${t.topic}`);
      if (t.bankCurrentState) lines.push(`**Current State:** ${t.bankCurrentState}`);
      if (t.painPoints?.length) { lines.push('**Pain Points:**'); t.painPoints.forEach(p => lines.push(`- ${p}`)); }
      lines.push('');
    });
  }
  if (brief.conversationFlow) {
    const cf = brief.conversationFlow;
    lines.push('## Meeting Guide', '');
    if (cf.opening) lines.push(`**Opening:** ${cf.opening}`, '');
    if (cf.middleSequence?.length) {
      lines.push('**Sequence:**');
      cf.middleSequence.forEach((s, i) => lines.push(`${i + 1}. ${typeof s === 'string' ? s : `**${s.phase || ''}** — ${s.objective || ''}`}`));
      lines.push('');
    }
    if (cf.closing) lines.push(`**Closing:** ${cf.closing}`, '');
  }
  if (brief.darkZones?.length) {
    lines.push('## Competitive Intel', '');
    brief.darkZones.forEach(d => {
      lines.push(`### ${d.zone}`);
      if (d.provocation) lines.push(`**Question:** ${d.provocation}`);
      if (d.backbaseSolution) lines.push(`**Our Angle:** ${d.backbaseSolution}`);
      lines.push('');
    });
  }
  if (brief.topicInsights?.length) {
    const offerings = brief.topicInsights.filter(t => t.backbaseOffering);
    if (offerings.length) {
      offerings.forEach(t => {
        lines.push(`### ${t.topic}`);
        lines.push(`**Backbase Offering:** ${t.backbaseOffering}`);
        if (t.talkingPoints?.length) { lines.push('**Talking Points:**'); t.talkingPoints.forEach(p => lines.push(`- ${p}`)); }
        lines.push('');
      });
    }
  }
  // Competitive context (Why Backbase)
  if (brief.competitiveContext?.competitors?.length) {
    lines.push('## Why Backbase (Competitive)', '');
    brief.competitiveContext.competitors.forEach(c => {
      lines.push(`### vs. ${c.name}`);
      if (c.leadsWiths) lines.push(`**They Lead With:** ${c.leadsWiths}`);
      if (c.backbaseWins) lines.push(`**Backbase Wins:** ${c.backbaseWins}`);
      if (c.differentiator) lines.push(`**Your Line:** "${c.differentiator}"`);
      lines.push('');
    });
    if (brief.competitiveContext.regionalDynamics) {
      lines.push(`**Regional Dynamics:** ${brief.competitiveContext.regionalDynamics}`, '');
    }
  }
  if (brief.quickValueEstimate || brief.watchOuts?.length) {
    lines.push('## Engagement Plan', '');
    if (brief.quickValueEstimate?.narrative) lines.push(brief.quickValueEstimate.narrative, '');
    if (brief.quickValueEstimate?.suggestedMetric) lines.push(`**Anchor Metric:** ${brief.quickValueEstimate.suggestedMetric}`, '');
    if (brief.watchOuts?.length) { lines.push('**Watch-Outs:**'); brief.watchOuts.forEach(w => lines.push(`- ${w}`)); lines.push(''); }
  }
  return lines.join('\n');
}

function engagementPlanToMarkdown(plan, bankName) {
  const lines = [`# Engagement Plan — ${bankName}`, '', `_Generated ${new Date().toLocaleDateString()}_`, ''];
  if (plan.outcomeSummary) {
    lines.push('## Meeting Outcome', '', plan.outcomeSummary, '');
  }
  if (plan.followUpActions?.length) {
    lines.push('## Follow-Up Actions', '');
    plan.followUpActions.forEach((a, i) => {
      lines.push(`${i + 1}. **${a.action}**`);
      lines.push(`   - Owner: ${a.owner} | Deadline: ${a.deadline} | Priority: ${a.priority}`);
    });
    lines.push('');
  }
  if (plan.nextMeetingAgenda) {
    const nma = plan.nextMeetingAgenda;
    lines.push('## Next Meeting', '');
    if (nma.suggestedTiming) lines.push(`**Timing:** ${nma.suggestedTiming}`);
    if (nma.agendaItems?.length) {
      lines.push('**Agenda:**');
      nma.agendaItems.forEach(item => lines.push(`- ${item}`));
    }
    if (nma.attendeeSuggestion) lines.push(`**Attendees:** ${nma.attendeeSuggestion}`);
    lines.push('');
  }
  if (plan.internalAction) {
    lines.push('## Internal Action', '');
    lines.push(`**Loop in:** ${plan.internalAction.whoToLoopIn}`);
    lines.push(`**Reason:** ${plan.internalAction.reason}`, '');
  }
  if (plan.riskOrWatchOut) {
    lines.push('## ⚠️ Risk / Watch-Out', '', plan.riskOrWatchOut, '');
  }
  return lines.join('\n');
}

function sectionToMarkdown(key, brief, bankName) {
  switch (key) {
    case 'priorities': {
      const pi = brief.personIntelligence;
      if (!pi?.priorities?.length) return '';
      const lines = [`# Priorities — ${bankName}`, ''];
      pi.priorities.forEach(p => lines.push(`- **${typeof p === 'string' ? p : p.priority}**${typeof p !== 'string' && p.detail ? `: ${p.detail}` : ''}`));
      return lines.join('\n');
    }
    case 'stakeholder': {
      const pi = brief.personIntelligence;
      if (!pi) return '';
      const lines = [`# Stakeholder Intel — ${bankName}`, '', pi.summary || ''];
      if (pi.approach) lines.push('', `**Approach:** ${pi.approach}`);
      return lines.join('\n');
    }
    case 'context': {
      if (!brief.topicInsights?.length) return '';
      const lines = [`# Bank Context — ${bankName}`, ''];
      brief.topicInsights.forEach(t => {
        lines.push(`## ${t.topic}`);
        if (t.bankCurrentState) lines.push(`**Current State:** ${t.bankCurrentState}`);
        if (t.painPoints?.length) { lines.push('**Pain Points:**'); t.painPoints.forEach(p => lines.push(`- ${p}`)); }
        lines.push('');
      });
      return lines.join('\n');
    }
    case 'guide': {
      const cf = brief.conversationFlow;
      if (!cf) return '';
      const lines = [`# Meeting Guide — ${bankName}`, ''];
      if (cf.opening) lines.push(`**Opening:** ${cf.opening}`, '');
      if (cf.middleSequence?.length) {
        cf.middleSequence.forEach((s, i) => lines.push(`${i + 1}. ${typeof s === 'string' ? s : `**${s.phase || ''}** — ${s.objective || ''}`}`));
        lines.push('');
      }
      if (cf.closing) lines.push(`**Closing:** ${cf.closing}`);
      return lines.join('\n');
    }
    case 'competitive': {
      const lines = [`# Competitive Intel — ${bankName}`, ''];
      // Why Backbase competitor cards
      if (brief.competitiveContext?.competitors?.length) {
        lines.push('## Why Backbase', '');
        brief.competitiveContext.competitors.forEach(c => {
          lines.push(`### vs. ${c.name}`);
          if (c.leadsWiths) lines.push(`**They Lead With:** ${c.leadsWiths}`);
          if (c.backbaseWins) lines.push(`**Backbase Wins:** ${c.backbaseWins}`);
          if (c.differentiator) lines.push(`**Your Line:** "${c.differentiator}"`);
          lines.push('');
        });
        if (brief.competitiveContext.regionalDynamics) {
          lines.push(`**Regional Dynamics:** ${brief.competitiveContext.regionalDynamics}`, '');
        }
      }
      if (brief.darkZones?.length) {
        lines.push('## Blind Spots', '');
        brief.darkZones.forEach(d => {
          lines.push(`### ${d.zone}`);
          if (d.insight) lines.push(d.insight);
          if (d.provocation) lines.push(`**Question:** ${d.provocation}`);
          if (d.backbaseSolution) lines.push(`**Our Angle:** ${d.backbaseSolution}`);
          lines.push('');
        });
      }
      const offerings = brief.topicInsights?.filter(t => t.backbaseOffering) || [];
      if (offerings.length) {
        lines.push('## Backbase Positioning', '');
        offerings.forEach(t => {
          lines.push(`### ${t.topic}`);
          lines.push(`**Backbase Offering:** ${t.backbaseOffering}`);
          if (t.talkingPoints?.length) t.talkingPoints.forEach(p => lines.push(`- ${p}`));
          lines.push('');
        });
      }
      return lines.join('\n');
    }
    case 'engagement': {
      const lines = [`# Engagement Plan — ${bankName}`, ''];
      if (brief.quickValueEstimate?.narrative) lines.push(brief.quickValueEstimate.narrative, '');
      if (brief.quickValueEstimate?.suggestedMetric) lines.push(`**Anchor Metric:** ${brief.quickValueEstimate.suggestedMetric}`, '');
      if (brief.watchOuts?.length) { lines.push('**Watch-Outs:**'); brief.watchOuts.forEach(w => lines.push(`- ${w}`)); }
      return lines.join('\n');
    }
    default: return '';
  }
}

// ─── Reusable copy button ────────────────────────────────

function CopyButton({ getText, label = 'Copy', size = 'sm' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { console.error('Copy failed:', err); }
  };
  const cls = size === 'sm'
    ? 'px-2 py-1 text-[9px]'
    : 'px-3 py-1.5 text-[10px]';
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1 ${cls} rounded-md font-bold transition-colors
        ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white/80 hover:bg-white text-fg-muted hover:text-fg border border-gray-200'}`}
    >
      {copied ? <><Check size={9} /> Copied</> : <><Copy size={9} /> {label}</>}
    </button>
  );
}

// ─── Loading skeleton for progressive display ────────────

function SectionSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 rounded-full bg-gray-200" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  );
}

// ─── Strategic Priorities Bar (appears at TOP of brief) ──

function strategicPrioritiesToMarkdown(priorities, bankName) {
  if (!priorities?.length) return '';
  const lines = [`# Strategic Priorities for This Meeting — ${bankName}`, ''];
  priorities.forEach(sp => {
    lines.push(`- **${sp.area}**${sp.inferred ? ' *(inferred)*' : ''} — ${sp.whyItMatters} — ${sp.backbaseAngle} — Hook: "${sp.conversationHook}"`);
  });
  return lines.join('\n');
}

function StrategicPrioritiesBar({ priorities, bankName, budgetUnlock }) {
  if (!priorities?.length) return null;
  return (
    <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">
              Strategic Priorities for This Meeting
            </span>
            <span className="text-[9px] text-indigo-400 font-bold">{priorities.length} priorities</span>
          </div>
          <CopyButton
            getText={() => strategicPrioritiesToMarkdown(priorities, bankName)}
            label="Copy"
          />
        </div>
        <div className="space-y-2.5">
          {priorities.map((sp, i) => (
            <div key={i} className="bg-white border border-indigo-100 rounded-lg p-3 shadow-sm">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  {/* Priority area + confidence badge + inferred tag */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-black text-fg">{sp.area}</span>
                    {sp.confidence && <ConfidenceTierBadge tier={sp.confidence} />}
                    {sp.inferred && !sp.confidence && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-600 border border-amber-200 uppercase tracking-wider">
                        inferred
                      </span>
                    )}
                  </div>
                  {/* Why it matters */}
                  <p className="text-[10px] text-fg-subtle leading-relaxed mb-1">
                    <span className="font-bold text-indigo-600">Why: </span>{sp.whyItMatters}
                  </p>
                  {/* Backbase angle */}
                  <p className="text-[10px] text-fg-subtle leading-relaxed mb-1.5">
                    <span className="font-bold text-primary">Backbase: </span>{sp.backbaseAngle}
                  </p>
                  {/* Conversation hook */}
                  <div className="flex items-start gap-1.5 bg-indigo-50 border border-indigo-100 rounded-md px-2.5 py-1.5">
                    <MessageSquare size={9} className="text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-indigo-800 italic leading-relaxed">"{sp.conversationHook}"</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Budget Unlock Note — shown when AI & Ops personas are in the meeting */}
        {budgetUnlock && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <span className="text-amber-500 shrink-0 mt-0.5">💰</span>
            <div>
              <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider">Budget Unlock</span>
              <p className="text-[10px] text-amber-800 leading-relaxed mt-0.5">{budgetUnlock}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab definitions ─────────────────────────────────────

const TABS = [
  { key: 'priorities',   label: 'Priorities',      icon: Target,       color: 'violet' },
  { key: 'stakeholder',  label: 'Stakeholder',     icon: User,         color: 'indigo' },
  { key: 'context',      label: 'Bank Context',    icon: Building2,    color: 'blue' },
  { key: 'guide',        label: 'Meeting Guide',   icon: Compass,      color: 'emerald' },
  { key: 'competitive',  label: 'Competitive',     icon: Shield,       color: 'amber' },
  { key: 'engagement',   label: 'Engagement Plan', icon: Briefcase,    color: 'teal' },
];

const TAB_COLORS = {
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  active: 'bg-violet-600',  badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700',  active: 'bg-indigo-600',  badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    active: 'bg-blue-600',    badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', active: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   active: 'bg-amber-600',   badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  teal:    { bg: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-700',    active: 'bg-teal-600',    badge: 'bg-teal-100 text-teal-700 border-teal-200' },
};

// ─── Quick View card (the "live in meeting" view) ────────

function QuickView({ brief, bankName }) {
  // Gather top 3 opening questions from topic insights
  const questions = (brief.topicInsights || [])
    .filter(t => t.openingQuestion)
    .slice(0, 3)
    .map(t => t.openingQuestion);
  // Get opening line from conversation flow
  const opening = brief.conversationFlow?.opening;
  // Quick approach summary
  const approach = brief.personIntelligence?.approach;

  return (
    <div className="space-y-3">
      {/* Approach summary */}
      {approach && (
        <div className="bg-violet-50 border border-violet-100 rounded-lg p-2.5">
          <div className="text-[9px] font-bold text-violet-600 uppercase tracking-wider mb-0.5">Approach</div>
          <p className="text-[11px] text-violet-800 leading-relaxed">{approach}</p>
        </div>
      )}

      {/* Opening line */}
      {opening && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
          <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Opening Line</div>
          <p className="text-[11px] text-emerald-800 italic leading-relaxed">"{opening}"</p>
        </div>
      )}

      {/* Top discovery questions */}
      {questions.length > 0 && (
        <div>
          <div className="text-[9px] font-bold text-primary uppercase tracking-wider mb-1.5">Key Discovery Questions</div>
          <div className="space-y-1.5">
            {questions.map((q, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-fg-subtle">
                <MessageSquare size={10} className="text-indigo-500 shrink-0 mt-0.5" />
                <span className="italic leading-relaxed">"{q}"</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anchor metric */}
      {brief.quickValueEstimate?.suggestedMetric && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-2.5">
          <div className="text-[9px] font-bold text-teal-600 uppercase tracking-wider mb-0.5">Value Anchor</div>
          <p className="text-[11px] text-teal-800 font-bold">{brief.quickValueEstimate.suggestedMetric}</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab content panels ──────────────────────────────────

function PrioritiesPanel({ brief }) {
  const pi = brief.personIntelligence;
  if (!pi?.priorities?.length) return <p className="text-[11px] text-fg-muted italic">No priorities data available yet.</p>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {pi.priorities.map((p, i) => {
          const label = typeof p === 'string' ? p : p.priority;
          const detail = typeof p !== 'string' ? p.detail : null;
          return (
            <div key={i} className="flex-1 min-w-[140px] bg-violet-50 border border-violet-200 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-[11px] font-black text-violet-800">{label}</span>
              </div>
              {detail && <p className="text-[10px] text-violet-600 leading-relaxed">{detail}</p>}
            </div>
          );
        })}
      </div>

      {/* Also surface pain points from topics as secondary priorities */}
      {brief.topicInsights?.some(t => t.painPoints?.length > 0) && (
        <div className="mt-2">
          <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-1.5">Key Pain Points</div>
          <div className="space-y-1">
            {brief.topicInsights.flatMap(t => (t.painPoints || []).map(p => ({ topic: t.topic, pain: p })))
              .slice(0, 6)
              .map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px] text-fg-subtle">
                  <AlertTriangle size={9} className="text-amber-500 shrink-0 mt-0.5" />
                  <span><span className="font-bold text-fg-muted">{item.topic}:</span> {item.pain}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StakeholderPanel({ brief }) {
  const pi = brief.personIntelligence;
  if (!pi) return <p className="text-[11px] text-fg-muted italic">No stakeholder intelligence available yet.</p>;
  return (
    <div className="space-y-3">
      {pi.summary && <p className="text-[11px] text-fg-subtle leading-relaxed">{pi.summary}</p>}
      {pi.approach && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
          <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Recommended Approach</div>
          <p className="text-[11px] text-indigo-800 leading-relaxed">{pi.approach}</p>
        </div>
      )}
    </div>
  );
}

function BankContextPanel({ brief }) {
  if (!brief.topicInsights?.length) return <p className="text-[11px] text-fg-muted italic">No bank context available yet.</p>;
  return (
    <div className="space-y-3">
      {brief.topicInsights.map((topic, idx) => (
        <div key={idx} className="border border-blue-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-blue-50 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">{idx + 1}</span>
            <span className="text-[11px] font-black text-blue-800">{topic.topic}</span>
          </div>
          <div className="px-3 py-2.5 space-y-2">
            {topic.bankCurrentState && (
              <div>
                <div className="text-[9px] font-bold text-fg-muted uppercase tracking-wider mb-0.5">Current State</div>
                <p className="text-[11px] text-fg-subtle leading-relaxed">{topic.bankCurrentState}</p>
              </div>
            )}
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
            {topic.openingQuestion && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                <div className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Discovery Question</div>
                <p className="text-[10px] text-blue-800 italic">"{topic.openingQuestion}"</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MeetingGuidePanel({ brief }) {
  const cf = brief.conversationFlow;
  if (!cf) return <p className="text-[11px] text-fg-muted italic">No conversation flow available yet.</p>;
  return (
    <div className="space-y-3">
      {/* Opening */}
      {cf.opening && (
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-emerald-700">1</span>
          </div>
          <div className="pt-0.5">
            <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Opening</div>
            <p className="text-[11px] text-fg-subtle leading-relaxed">{cf.opening}</p>
          </div>
        </div>
      )}

      {/* Middle Sequence */}
      {cf.middleSequence?.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-emerald-700">{i + 2}</span>
          </div>
          {typeof step === 'string' ? (
            <p className="text-[11px] text-fg-subtle leading-relaxed pt-1">{step}</p>
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
      {cf.closing && (
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <Check size={12} className="text-white" />
          </div>
          <div className="pt-0.5">
            <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Closing</div>
            <p className="text-[11px] text-fg-subtle leading-relaxed">{cf.closing}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── "Why Backbase" Competitive Context Block ────────────

function CompetitiveContextBlock({ competitors, regionalDynamics }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-red-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-50 to-amber-50 text-left hover:from-red-100/70 hover:to-amber-100/50 transition-colors"
      >
        <Swords size={13} className="text-red-600 shrink-0" />
        <span className="flex-1 text-xs font-black text-red-700 uppercase tracking-wider">Why Backbase</span>
        <span className="text-[10px] font-bold text-red-400 mr-2">{competitors.length} competitor{competitors.length > 1 ? 's' : ''}</span>
        {expanded ? <ChevronUp size={12} className="text-red-400" /> : <ChevronDown size={12} className="text-red-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-3 bg-white">
          {competitors.map((comp, i) => (
            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-[11px] font-black text-fg">vs. {comp.name}</span>
              </div>
              <div className="px-3 py-2.5 space-y-2">
                {/* What they lead with */}
                {comp.leadsWiths && (
                  <div>
                    <div className="text-[9px] font-bold text-red-600 uppercase tracking-wider mb-0.5">They Lead With</div>
                    <p className="text-[10px] text-fg-subtle leading-relaxed">{comp.leadsWiths}</p>
                  </div>
                )}
                {/* Where Backbase wins */}
                {comp.backbaseWins && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2">
                    <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Where Backbase Wins</div>
                    <p className="text-[10px] text-emerald-800 leading-relaxed">{comp.backbaseWins}</p>
                  </div>
                )}
                {/* One-sentence differentiator */}
                {comp.differentiator && (
                  <div className="bg-primary-50 border border-primary/10 rounded-md p-2">
                    <div className="text-[9px] font-bold text-primary uppercase tracking-wider mb-0.5">Your Line</div>
                    <p className="text-[10px] text-primary/90 font-bold italic">"{comp.differentiator}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Regional dynamics */}
          {regionalDynamics && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin size={10} className="text-blue-600" />
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Regional Dynamics</span>
              </div>
              <p className="text-[10px] text-blue-800 leading-relaxed">{regionalDynamics}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompetitivePanel({ brief }) {
  const hasDarkZones = brief.darkZones?.length > 0;
  const offerings = (brief.topicInsights || []).filter(t => t.backbaseOffering);
  const cc = brief.competitiveContext;
  const hasCompetitorCards = cc?.competitors?.length > 0;
  const hasRegional = !!cc?.regionalDynamics;
  if (!hasDarkZones && !offerings.length && !hasCompetitorCards && !hasRegional) {
    return <p className="text-[11px] text-fg-muted italic">No competitive intelligence available yet.</p>;
  }

  return (
    <div className="space-y-4">
      {/* "Why Backbase" — Competitor Cards */}
      {hasCompetitorCards && (
        <CompetitiveContextBlock competitors={cc.competitors} regionalDynamics={cc.regionalDynamics} />
      )}

      {/* Regional dynamics (shown separately if no competitor cards but region exists) */}
      {!hasCompetitorCards && hasRegional && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin size={10} className="text-blue-600" />
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Regional Dynamics</span>
          </div>
          <p className="text-[10px] text-blue-800 leading-relaxed">{cc.regionalDynamics}</p>
        </div>
      )}

      {/* Dark Zones */}
      {hasDarkZones && (
        <div>
          <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-2">Blind Spots to Exploit</div>
          <div className="space-y-2">
            {brief.darkZones.map((dz, i) => (
              <div key={i} className="border border-amber-200 rounded-lg p-3 space-y-2 bg-amber-50/30">
                <div className="flex items-center gap-2">
                  <Eye size={12} className="text-amber-600 shrink-0" />
                  <span className="text-[11px] font-black text-fg">{dz.zone}</span>
                </div>
                {dz.insight && <p className="text-[10px] text-fg-subtle leading-relaxed">{dz.insight}</p>}
                {dz.provocation && (
                  <div className="bg-amber-100/50 border border-amber-200 rounded-md p-2">
                    <div className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Provocative Question</div>
                    <p className="text-[10px] text-amber-800 italic">"{dz.provocation}"</p>
                  </div>
                )}
                {dz.backbaseSolution && (
                  <div className="bg-primary-50 border border-primary/10 rounded-md p-2">
                    <div className="text-[9px] font-bold text-primary uppercase tracking-wider mb-0.5">Our Angle</div>
                    <p className="text-[10px] text-primary/80">{dz.backbaseSolution}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backbase Offerings & Talking Points */}
      {offerings.length > 0 && (
        <div>
          <div className="text-[9px] font-bold text-primary uppercase tracking-wider mb-2">Backbase Positioning</div>
          <div className="space-y-2">
            {offerings.map((t, i) => (
              <div key={i} className="bg-primary-50 border border-primary/10 rounded-lg p-3 space-y-1.5">
                <div className="text-[10px] font-bold text-primary">{t.topic}</div>
                <p className="text-[10px] text-primary/80 leading-relaxed">{t.backbaseOffering}</p>
                {t.talkingPoints?.length > 0 && (
                  <div className="space-y-1 mt-1">
                    {t.talkingPoints.map((tp, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-[10px] text-fg-subtle">
                        <ArrowRight size={9} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{tp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EngagementPlanPanel({ brief }) {
  const hasValue = brief.quickValueEstimate;
  const hasWatchOuts = brief.watchOuts?.length > 0;
  if (!hasValue && !hasWatchOuts) return <p className="text-[11px] text-fg-muted italic">No engagement plan data available yet.</p>;

  return (
    <div className="space-y-3">
      {hasValue && (
        <>
          {brief.quickValueEstimate.narrative && (
            <p className="text-[11px] text-fg-subtle leading-relaxed">{brief.quickValueEstimate.narrative}</p>
          )}
          {brief.quickValueEstimate.suggestedMetric && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
              <div className="text-[9px] font-bold text-teal-600 uppercase tracking-wider mb-0.5">Anchor Metric</div>
              <p className="text-[11px] text-teal-800 font-bold">{brief.quickValueEstimate.suggestedMetric}</p>
            </div>
          )}
        </>
      )}
      {hasWatchOuts && (
        <div>
          <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-1.5">Watch-Outs</div>
          <div className="space-y-1.5">
            {brief.watchOuts.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-amber-800">
                <AlertTriangle size={10} className="text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const PANEL_MAP = {
  priorities: PrioritiesPanel,
  stakeholder: StakeholderPanel,
  context: BankContextPanel,
  guide: MeetingGuidePanel,
  competitive: CompetitivePanel,
  engagement: EngagementPlanPanel,
};

// ─── Determine which tabs have data ──────────────────────

function tabHasData(key, brief) {
  switch (key) {
    case 'priorities': return brief.personIntelligence?.priorities?.length > 0;
    case 'stakeholder': return !!brief.personIntelligence;
    case 'context': return brief.topicInsights?.length > 0;
    case 'guide': return !!brief.conversationFlow;
    case 'competitive': return brief.darkZones?.length > 0 || brief.topicInsights?.some(t => t.backbaseOffering) || brief.competitiveContext?.competitors?.length > 0;
    case 'engagement': return !!brief.quickValueEstimate || brief.watchOuts?.length > 0;
    default: return false;
  }
}

// ─── Engagement Plan (Post-Meeting) ─────────────────────

const OUTCOME_OPTIONS = [
  { value: 'positive', label: 'Positive', emoji: '🟢', desc: 'Strong interest, clear next steps' },
  { value: 'neutral', label: 'Neutral', emoji: '🟡', desc: 'Informational, no clear commitment' },
  { value: 'need_followup', label: 'Need follow-up', emoji: '🟠', desc: 'Interest but unresolved questions' },
  { value: 'no_interest', label: 'No interest', emoji: '🔴', desc: 'Did not engage on our topics' },
];

function EngagementPlanForm({ brief, bankName, attendees, onGenerate, isGenerating }) {
  const [outcome, setOutcome] = useState('');
  const [resonated, setResonated] = useState([]);
  const [clientAskedFor, setClientAskedFor] = useState('');
  const [agreedNextStep, setAgreedNextStep] = useState('');

  const priorities = brief?.strategicPriorities || [];

  const toggleResonated = (area) => {
    setResonated(prev => prev.includes(area) ? prev.filter(p => p !== area) : [...prev, area]);
  };

  const canSubmit = outcome && !isGenerating;

  return (
    <div className="space-y-4">
      {/* Outcome */}
      <div>
        <label className="block text-[10px] font-black text-fg uppercase tracking-wider mb-2">
          What was the outcome?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {OUTCOME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setOutcome(opt.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all text-[11px]
                ${outcome === opt.value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border hover:border-primary/30 hover:bg-surface-2'
                }`}
            >
              <span className="text-base">{opt.emoji}</span>
              <div>
                <div className="font-bold text-fg">{opt.label}</div>
                <div className="text-[9px] text-fg-muted">{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* What resonated */}
      {priorities.length > 0 && (
        <div>
          <label className="block text-[10px] font-black text-fg uppercase tracking-wider mb-2">
            What topics resonated? <span className="text-fg-muted font-normal normal-case">(select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {priorities.map((sp, i) => (
              <button
                key={i}
                onClick={() => toggleResonated(sp.area)}
                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all
                  ${resonated.includes(sp.area)
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-border text-fg-muted hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
              >
                {resonated.includes(sp.area) && <Check size={9} className="inline mr-1" />}
                {sp.area}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Client asked for */}
      <div>
        <label className="block text-[10px] font-black text-fg uppercase tracking-wider mb-1.5">
          What did the client ask for?
        </label>
        <textarea
          value={clientAskedFor}
          onChange={e => setClientAskedFor(e.target.value)}
          placeholder="e.g., 'Demo of digital onboarding', 'Reference customer in DACH region', 'Pricing for 3 verticals'..."
          rows={2}
          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none placeholder:text-fg-disabled"
        />
      </div>

      {/* Agreed next step */}
      <div>
        <label className="block text-[10px] font-black text-fg uppercase tracking-wider mb-1.5">
          Agreed next step
        </label>
        <textarea
          value={agreedNextStep}
          onChange={e => setAgreedNextStep(e.target.value)}
          placeholder="e.g., 'Follow-up meeting in 2 weeks with CTO', 'Send business case template', 'Schedule POC workshop'..."
          rows={2}
          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none placeholder:text-fg-disabled"
        />
      </div>

      {/* Submit */}
      <button
        onClick={() => onGenerate({ outcome, resonatedPriorities: resonated, clientAskedFor, agreedNextStep })}
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-default"
      >
        {isGenerating
          ? <><Loader2 size={14} className="animate-spin" /> Generating engagement plan...</>
          : <><Send size={14} /> Generate Engagement Plan</>
        }
      </button>
    </div>
  );
}

function EngagementPlanOutput({ plan, bankName }) {
  const [copied, setCopied] = useState(false);

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(engagementPlanToMarkdown(plan, bankName));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-4">
      {/* Header + Copy */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center">
            <ClipboardList size={12} className="text-white" />
          </div>
          <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Engagement Plan</span>
        </div>
        <button
          onClick={copyPlan}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100 transition-colors"
        >
          {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy for Salesforce / Slack</>}
        </button>
      </div>

      {/* Outcome Summary */}
      {plan.outcomeSummary && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-1.5">Meeting Outcome</div>
          <p className="text-[11px] text-fg leading-relaxed">{plan.outcomeSummary}</p>
        </div>
      )}

      {/* Follow-Up Actions */}
      {plan.followUpActions?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-2">Follow-Up Actions</div>
          <div className="space-y-2">
            {plan.followUpActions.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-gray-50 rounded-lg p-2.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5 ${a.priority === 'high' ? 'bg-red-500' : 'bg-amber-500'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-fg">{a.action}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                      <User size={8} /> {a.owner}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-700">
                      <Calendar size={8} /> {a.deadline}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Meeting Agenda */}
      {plan.nextMeetingAgenda && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-2">Recommended Next Meeting</div>
          {plan.nextMeetingAgenda.suggestedTiming && (
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar size={10} className="text-primary" />
              <span className="text-[10px] font-bold text-primary">{plan.nextMeetingAgenda.suggestedTiming}</span>
            </div>
          )}
          {plan.nextMeetingAgenda.agendaItems?.length > 0 && (
            <ul className="space-y-1 mb-2">
              {plan.nextMeetingAgenda.agendaItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[10px] text-fg">
                  <ArrowRight size={9} className="text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {plan.nextMeetingAgenda.attendeeSuggestion && (
            <div className="flex items-start gap-1.5 bg-blue-50 border border-blue-100 rounded px-2 py-1.5 mt-1">
              <UserPlus size={9} className="text-blue-500 shrink-0 mt-0.5" />
              <span className="text-[9px] text-blue-700">{plan.nextMeetingAgenda.attendeeSuggestion}</span>
            </div>
          )}
        </div>
      )}

      {/* Internal Action */}
      {plan.internalAction && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1.5">Internal: Who to Loop In</div>
          <p className="text-[11px] font-bold text-fg">{plan.internalAction.whoToLoopIn}</p>
          <p className="text-[10px] text-fg-subtle mt-0.5">{plan.internalAction.reason}</p>
        </div>
      )}

      {/* Risk / Watch-Out */}
      {plan.riskOrWatchOut && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Flag size={10} className="text-amber-600" />
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Risk / Watch-Out</span>
          </div>
          <p className="text-[10px] text-amber-800 leading-relaxed">{plan.riskOrWatchOut}</p>
        </div>
      )}
    </div>
  );
}

// ─── Brief Feedback (Post-Meeting Quality Tracking) ─────

const FEEDBACK_SECTIONS = [
  { key: 'priorities', label: 'Priorities' },
  { key: 'stakeholder', label: 'Stakeholder Intel' },
  { key: 'context', label: 'Bank Context' },
  { key: 'guide', label: 'Meeting Guide' },
  { key: 'competitive', label: 'Competitive' },
  { key: 'none', label: 'None' },
];

function BriefFeedbackForm({ bankKey, bankName, attendees, onSubmitted }) {
  const [sectionsUsed, setSectionsUsed] = useState([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleSection = (key) => {
    if (key === 'none') {
      setSectionsUsed(prev => prev.includes('none') ? [] : ['none']);
      return;
    }
    setSectionsUsed(prev => {
      const without = prev.filter(s => s !== 'none');
      return without.includes(key) ? without.filter(s => s !== key) : [...without, key];
    });
  };

  const handleSubmit = async () => {
    if (rating === 0 || sectionsUsed.length === 0) return;
    setSubmitting(true);
    try {
      const persona = attendees?.[0]?.role || attendees?.[0]?.customRole || null;
      await apiSubmitFeedback({
        bankKey,
        bankName,
        persona,
        sectionsUsed,
        accuracyRating: rating,
        comment: comment.trim() || null,
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      console.error('Feedback submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 py-3 text-emerald-600">
        <ThumbsUp size={14} />
        <span className="text-[11px] font-bold">Thanks for your feedback! This helps us improve the AI briefs.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Star size={12} className="text-amber-500" />
        <span className="text-[10px] font-black text-fg uppercase tracking-wider">Rate This Brief</span>
        <span className="text-[9px] text-fg-muted font-normal normal-case">— helps us improve accuracy</span>
      </div>

      {/* Sections used */}
      <div>
        <label className="block text-[9px] font-bold text-fg-muted uppercase tracking-wider mb-1.5">
          Which sections did you actually use?
        </label>
        <div className="flex flex-wrap gap-1.5">
          {FEEDBACK_SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => toggleSection(s.key)}
              className={`px-2 py-1 rounded-md border text-[9px] font-semibold transition-all
                ${sectionsUsed.includes(s.key)
                  ? s.key === 'none'
                    ? 'border-red-300 bg-red-50 text-red-600'
                    : 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-border text-fg-muted hover:border-primary/30'
                }`}
            >
              {sectionsUsed.includes(s.key) && s.key !== 'none' && <Check size={8} className="inline mr-0.5" />}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Star rating */}
      <div>
        <label className="block text-[9px] font-bold text-fg-muted uppercase tracking-wider mb-1.5">
          How accurate was the AI content?
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                size={18}
                className={`transition-colors ${
                  n <= (hoverRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          <span className="text-[9px] text-fg-muted ml-2">
            {rating === 1 && 'Mostly inaccurate'}
            {rating === 2 && 'Somewhat inaccurate'}
            {rating === 3 && 'Mixed — some good, some off'}
            {rating === 4 && 'Mostly accurate'}
            {rating === 5 && 'Spot on'}
          </span>
        </div>
      </div>

      {/* Optional comment */}
      <div>
        <label className="block text-[9px] font-bold text-fg-muted uppercase tracking-wider mb-1">
          What was missing or wrong? <span className="font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="e.g., 'Competitive intel was outdated', 'Missing recent acquisition news', 'Stakeholder priorities were wrong'..."
          rows={2}
          className="w-full px-2.5 py-1.5 text-[10px] border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-300/50 resize-none placeholder:text-fg-disabled"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={rating === 0 || sectionsUsed.length === 0 || submitting}
        className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white text-[10px] font-bold rounded-lg shadow-sm hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-default"
      >
        {submitting ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
        Submit Feedback
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

/**
 * MeetingPrepBrief — AI-generated meeting preparation brief.
 *
 * Three view modes:
 *   • quick  — Collapsed card showing priorities + top questions (live-in-meeting view)
 *   • tabbed — 6 navigable tabs with per-section copy buttons (default when expanded)
 *   • full   — All sections expanded vertically
 *
 * Props:
 * - brief: The structured brief JSON from meetingPrepAgent
 * - bankName: Bank name for header
 * - onClear: () => void — clears the brief
 * - cascadeStatus: Optional { meetingPrep, storyline, ... } for progressive loading
 * - attendees: Meeting attendees array (for engagement plan)
 */
export default function MeetingPrepBrief({ brief, bankName, bankKey, onClear, cascadeStatus, attendees = [] }) {
  const [viewMode, setViewMode] = useState('quick'); // 'quick' | 'tabbed' | 'full'
  const [activeTab, setActiveTab] = useState('priorities');
  const [copiedAll, setCopiedAll] = useState(false);
  // Engagement Plan (post-meeting) state
  const [engagementPlanMode, setEngagementPlanMode] = useState('idle'); // 'idle' | 'form' | 'generating' | 'done'
  const [engagementPlan, setEngagementPlan] = useState(null);
  // Brief Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  if (!brief) return null;

  const isLoading = cascadeStatus?.meetingPrep === 'running';

  const handleGenerateEngagementPlan = async ({ outcome, resonatedPriorities, clientAskedFor, agreedNextStep }) => {
    setEngagementPlanMode('generating');
    try {
      const { result } = await apiGenerateEngagementPlan({
        bankName,
        originalBrief: brief,
        outcome,
        resonatedPriorities,
        clientAskedFor,
        agreedNextStep,
        attendees,
      });
      setEngagementPlan(result);
      setEngagementPlanMode('done');
      setShowFeedback(true); // Auto-show feedback after engagement plan
    } catch (err) {
      console.error('Engagement plan generation failed:', err);
      setEngagementPlanMode('form'); // Back to form so they can retry
    }
  };

  const copyFullBrief = async () => {
    try {
      await navigator.clipboard.writeText(briefToMarkdown(brief, bankName));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) { console.error('Copy failed:', err); }
  };

  // Count tabs with data for the badge
  const tabsWithData = TABS.filter(t => tabHasData(t.key, brief)).length;

  return (
    <div className="mb-6 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/30 to-violet-50/30 overflow-hidden shadow-lg shadow-indigo-100/50">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Zap size={14} />
          </div>
          <div>
            <div className="text-xs font-black tracking-wide">AI Meeting Brief</div>
            <div className="text-[10px] text-white/70">{bankName} — {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View mode toggles */}
          <div className="flex items-center bg-white/10 rounded-lg p-0.5 mr-1">
            <button
              onClick={() => setViewMode('quick')}
              className={`px-2 py-1 rounded-md text-[9px] font-bold transition-colors ${viewMode === 'quick' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/80'}`}
              title="Quick View — priorities & key questions"
            >
              <Minimize2 size={10} />
            </button>
            <button
              onClick={() => setViewMode('tabbed')}
              className={`px-2 py-1 rounded-md text-[9px] font-bold transition-colors ${viewMode === 'tabbed' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/80'}`}
              title="Tabbed View — navigate sections"
            >
              <Layers size={10} />
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`px-2 py-1 rounded-md text-[9px] font-bold transition-colors ${viewMode === 'full' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/80'}`}
              title="Full Brief — all sections expanded"
            >
              <Maximize2 size={10} />
            </button>
          </div>

          {/* Copy full brief */}
          <button
            onClick={copyFullBrief}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold transition-colors"
          >
            {copiedAll ? <><Check size={10} /> Copied</> : <><Copy size={10} /> All</>}
          </button>

          {/* Dismiss */}
          <button onClick={onClear} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Dismiss brief">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── Loading state ── */}
      {isLoading && (
        <div className="px-5 py-4 flex items-center gap-3">
          <Loader2 size={16} className="text-primary animate-spin" />
          <span className="text-[11px] text-fg-muted">Generating meeting brief...</span>
        </div>
      )}

      {/* ── Strategic Priorities (always visible at top, all view modes) ── */}
      {!isLoading && brief.strategicPriorities?.length > 0 && (
        <StrategicPrioritiesBar priorities={brief.strategicPriorities} bankName={bankName} budgetUnlock={brief.budgetUnlock} />
      )}

      {/* ── Quick View ── */}
      {viewMode === 'quick' && !isLoading && (
        <div className="px-5 py-4">
          <QuickView brief={brief} bankName={bankName} />
          <button
            onClick={() => setViewMode('tabbed')}
            className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <Layers size={10} />
            View full brief ({tabsWithData} sections)
          </button>
        </div>
      )}

      {/* ── Tabbed View ── */}
      {viewMode === 'tabbed' && !isLoading && (
        <div>
          {/* Tab bar */}
          <div className="flex overflow-x-auto border-b border-indigo-100 bg-white/50 px-2 pt-2 gap-1 scrollbar-hide">
            {TABS.map(tab => {
              const hasData = tabHasData(tab.key, brief);
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              const colors = TAB_COLORS[tab.color];

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[10px] font-bold transition-all whitespace-nowrap border border-b-0
                    ${isActive
                      ? `${colors.bg} ${colors.border} ${colors.text}`
                      : hasData
                        ? 'border-transparent text-fg-muted hover:text-fg hover:bg-gray-50'
                        : 'border-transparent text-fg-disabled opacity-50 cursor-default'
                    }`}
                  disabled={!hasData}
                >
                  <Icon size={11} />
                  {tab.label}
                  {!hasData && <Loader2 size={8} className="animate-spin ml-0.5 opacity-50" />}
                </button>
              );
            })}
          </div>

          {/* Active tab content */}
          <div className="px-5 py-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {/* Section header + copy */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const tab = TABS.find(t => t.key === activeTab);
                      const Icon = tab.icon;
                      const colors = TAB_COLORS[tab.color];
                      return (
                        <>
                          <div className={`w-6 h-6 rounded-md ${colors.bg} ${colors.text} flex items-center justify-center`}>
                            <Icon size={12} />
                          </div>
                          <span className={`text-xs font-black ${colors.text} uppercase tracking-wider`}>{tab.label}</span>
                        </>
                      );
                    })()}
                  </div>
                  {tabHasData(activeTab, brief) && (
                    <CopyButton
                      getText={() => sectionToMarkdown(activeTab, brief, bankName)}
                      label="Copy section"
                    />
                  )}
                </div>

                {/* Content */}
                {tabHasData(activeTab, brief) ? (
                  (() => { const Panel = PANEL_MAP[activeTab]; return <Panel brief={brief} />; })()
                ) : (
                  <SectionSkeleton />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Full View (all sections expanded) ── */}
      {viewMode === 'full' && !isLoading && (
        <div className="px-5 py-4 space-y-5">
          {TABS.map(tab => {
            const hasData = tabHasData(tab.key, brief);
            const Icon = tab.icon;
            const colors = TAB_COLORS[tab.color];
            const Panel = PANEL_MAP[tab.key];

            return (
              <div key={tab.key} className={`border ${colors.border} rounded-xl overflow-hidden`}>
                {/* Section header */}
                <div className={`flex items-center justify-between px-4 py-2.5 ${colors.bg}`}>
                  <div className="flex items-center gap-2">
                    <Icon size={13} className={colors.text} />
                    <span className={`text-xs font-black ${colors.text} uppercase tracking-wider`}>{tab.label}</span>
                  </div>
                  {hasData && (
                    <CopyButton
                      getText={() => sectionToMarkdown(tab.key, brief, bankName)}
                      label="Copy"
                    />
                  )}
                </div>
                {/* Section content */}
                <div className="px-4 py-3 bg-white">
                  {hasData ? <Panel brief={brief} /> : <SectionSkeleton />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Action Buttons ── */}
      {!isLoading && brief.strategicPriorities?.length > 0 && (
        <div className="border-t border-indigo-100">
          {engagementPlanMode === 'idle' && (
            <div className="px-5 py-4 space-y-2">
              <button
                onClick={async () => {
                  const btn = event.currentTarget;
                  btn.disabled = true;
                  btn.textContent = 'Generating deck...';
                  try {
                    const res = await apiGenerateMeetingDeck({ bankKey, attendees, topics: brief.strategicPriorities?.map(sp => sp.area) || [] });
                    const slides = res.result?.slides || [];
                    const html = buildDeckHtml(bankName, slides);
                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                    setTimeout(() => URL.revokeObjectURL(url), 5000);
                  } catch (err) { alert('Deck generation failed: ' + err.message); }
                  btn.disabled = false;
                  btn.textContent = '';
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl text-violet-700 text-xs font-black hover:border-violet-300 hover:shadow-sm transition-all group"
              >
                <Layers size={14} className="group-hover:scale-110 transition-transform" />
                Generate Meeting Deck
                <span className="text-[9px] font-normal text-violet-500 ml-1">(5-slide client deck)</span>
              </button>
              <button
                onClick={() => setEngagementPlanMode('form')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-black hover:border-emerald-300 hover:shadow-sm transition-all group"
              >
                <ClipboardList size={14} className="group-hover:scale-110 transition-transform" />
                Generate Engagement Plan
                <span className="text-[9px] font-normal text-emerald-500 ml-1">(post-meeting)</span>
              </button>
            </div>
          )}

          {(engagementPlanMode === 'form' || engagementPlanMode === 'generating') && (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center">
                    <ClipboardList size={12} className="text-white" />
                  </div>
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Post-Meeting Debrief</span>
                </div>
                <button
                  onClick={() => { setEngagementPlanMode('idle'); }}
                  className="text-fg-muted hover:text-fg p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <EngagementPlanForm
                brief={brief}
                bankName={bankName}
                attendees={attendees}
                onGenerate={handleGenerateEngagementPlan}
                isGenerating={engagementPlanMode === 'generating'}
              />
            </div>
          )}

          {engagementPlanMode === 'done' && engagementPlan && (
            <div className="px-5 py-4">
              <EngagementPlanOutput plan={engagementPlan} bankName={bankName} />
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => { setEngagementPlanMode('form'); setEngagementPlan(null); }}
                  className="px-3 py-1.5 text-[10px] font-bold text-fg-muted hover:text-fg border border-border rounded-lg hover:bg-surface-2 transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Brief Feedback (Post-Meeting Quality Tracking) ── */}
      {!isLoading && brief.strategicPriorities?.length > 0 && !feedbackSubmitted && (
        <div className="border-t border-gray-100">
          {!showFeedback && engagementPlanMode !== 'generating' ? (
            <button
              onClick={() => setShowFeedback(true)}
              className="w-full px-5 py-3 flex items-center justify-center gap-2 text-[10px] font-bold text-fg-muted hover:text-amber-600 hover:bg-amber-50/50 transition-colors"
            >
              <Star size={11} /> Rate this brief — help us improve accuracy
            </button>
          ) : showFeedback ? (
            <div className="px-5 py-4">
              <BriefFeedbackForm
                bankKey={bankKey}
                bankName={bankName}
                attendees={attendees}
                onSubmitted={() => setFeedbackSubmitted(true)}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
