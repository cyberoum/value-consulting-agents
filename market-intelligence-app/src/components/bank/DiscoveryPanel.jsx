import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, Check, User, MessageCircle, Lightbulb, Target, Users } from 'lucide-react';
import { getDiscoveryQuestions, detectRelevantRoles, ROLES } from '../../data/discoveryQuestions';

// ─── Copy Button ───────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
      className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-md transition-all hover:bg-surface-3"
      style={{ color: copied ? '#059669' : '#6B7280' }}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ─── Role Selector Card ────────────────────────────────────────────

function RoleCard({ roleKey, role, kdms, isTarget, hasMatch, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-center transition-all min-w-[90px]"
      style={{
        background: active ? role.color : hasMatch ? `${role.color}10` : '#f9fafb',
        border: `2px solid ${active ? role.color : hasMatch ? `${role.color}30` : '#e5e7eb'}`,
        color: active ? '#fff' : '#374151',
      }}
    >
      {isTarget && (
        <span className="absolute -top-1.5 -right-1.5 text-xs">🎯</span>
      )}
      <span className="text-lg">{role.icon}</span>
      <span className="text-[10px] font-bold leading-tight">{role.title.split('/')[0].trim()}</span>
      {kdms.length > 0 && (
        <span
          className="text-[8px] font-medium px-1.5 py-0.5 rounded-full"
          style={{
            background: active ? 'rgba(255,255,255,0.2)' : `${role.color}15`,
            color: active ? '#fff' : role.color,
          }}
        >
          {kdms.length} contact{kdms.length !== 1 ? 's' : ''}
        </span>
      )}
    </button>
  );
}

// ─── KDM Badge ─────────────────────────────────────────────────────

function KdmBadge({ kdm, roleColor }) {
  const isTarget = kdm.note?.includes('🎯') || kdm.note?.includes('CRITICAL') || kdm.note?.includes('KEY') || kdm.note?.includes('TARGET');
  return (
    <div
      className="flex items-start gap-2 p-2.5 rounded-lg border"
      style={{
        background: isTarget ? `${roleColor}08` : '#f9fafb',
        borderColor: isTarget ? `${roleColor}30` : '#e5e7eb',
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ background: roleColor }}
      >
        {kdm.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-fg">{kdm.name}</span>
          {isTarget && <span className="text-[8px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full">TARGET</span>}
          {kdm.linkedin && (
            <a
              href={kdm.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded hover:bg-blue-100"
              onClick={e => e.stopPropagation()}
            >
              in
            </a>
          )}
        </div>
        <div className="text-[10px] text-fg-muted mt-0.5">{kdm.role}</div>
        {kdm.note && <p className="text-[9px] text-fg-disabled mt-1 line-clamp-2">{kdm.note.replace(/🎯|CRITICAL|KEY|TARGET/g, '').trim()}</p>}
      </div>
    </div>
  );
}

// ─── Question Card ─────────────────────────────────────────────────

function QuestionCard({ q, index, roleColor }) {
  const [expanded, setExpanded] = useState(false);
  const isBankSpecific = !!q.tag;

  const copyText = [
    q.question,
    q.intent ? `\nIntent: ${q.intent}` : '',
    q.tip ? `\nTip: ${q.tip}` : '',
  ].join('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-lg border border-border bg-white overflow-hidden hover:shadow-sm transition-shadow"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-3 flex items-start gap-3"
      >
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
          style={{
            background: isBankSpecific ? `${roleColor}15` : '#f3f4f6',
            color: isBankSpecific ? roleColor : '#6b7280',
          }}
        >
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              {isBankSpecific && (
                <span
                  className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1"
                  style={{ background: `${roleColor}12`, color: roleColor }}
                >
                  {q.tag}
                </span>
              )}
              <p className="text-xs text-fg leading-relaxed font-medium">{q.question}</p>
            </div>
            <span className="text-fg-disabled shrink-0 mt-1">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pl-12 space-y-2">
              {q.intent && (
                <div className="flex items-start gap-2 text-[11px]">
                  <Target size={12} className="shrink-0 mt-0.5 text-primary" />
                  <div>
                    <span className="font-bold text-fg-muted">Intent: </span>
                    <span className="text-fg-subtle">{q.intent}</span>
                  </div>
                </div>
              )}
              {q.tip && (
                <div className="flex items-start gap-2 text-[11px]">
                  <Lightbulb size={12} className="shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <span className="font-bold text-fg-muted">Tip: </span>
                    <span className="text-fg-subtle">{q.tip}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-1">
                <CopyButton text={copyText} label="Copy Question" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Phase Section ─────────────────────────────────────────────────

function PhaseSection({ phase, roleColor, startIndex }) {
  const [open, setOpen] = useState(true);

  if (phase.questions.length === 0) return null;

  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 mb-3 w-full text-left group"
      >
        <span className="text-base">{phase.icon}</span>
        <div className="flex-1">
          <span className="text-sm font-bold text-fg">{phase.label}</span>
          <span className="text-[10px] text-fg-disabled ml-2">{phase.description}</span>
        </div>
        <span className="text-[10px] font-bold text-fg-muted bg-surface-2 px-2 py-0.5 rounded-full">
          {phase.questions.length}
        </span>
        <span className="text-fg-disabled group-hover:text-fg-muted transition-colors">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 overflow-hidden"
          >
            {phase.questions.map((q, i) => (
              <QuestionCard
                key={`${phase.key}-${i}`}
                q={q}
                index={startIndex + i}
                roleColor={roleColor}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Copy All Button ───────────────────────────────────────────────

function CopyAllQuestions({ phases, roleName, bankName }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const lines = [`Discovery Questions — ${roleName} at ${bankName}\n`];
    phases.forEach(phase => {
      if (phase.questions.length === 0) return;
      lines.push(`\n## ${phase.label}\n`);
      phase.questions.forEach((q, i) => {
        lines.push(`${i + 1}. ${q.question}`);
        if (q.intent) lines.push(`   Intent: ${q.intent}`);
        if (q.tip) lines.push(`   Tip: ${q.tip}`);
        lines.push('');
      });
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-[11px] font-bold text-fg hover:bg-surface-2 transition-all"
    >
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
      {copied ? 'Copied All!' : 'Copy All Questions'}
    </button>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────

export default function DiscoveryPanel({ bankKey }) {
  const [selectedRole, setSelectedRole] = useState(null);

  // Detect relevant roles for this bank
  const relevantRoles = useMemo(() => detectRelevantRoles(bankKey), [bankKey]);

  // Auto-select first target role or first role with contacts
  const activeRoleKey = selectedRole || relevantRoles.find(r => r.isTarget)?.roleKey || relevantRoles.find(r => r.hasMatch)?.roleKey || 'ceo';

  // Get questions for active role
  const discovery = useMemo(
    () => getDiscoveryQuestions(bankKey, activeRoleKey),
    [bankKey, activeRoleKey]
  );

  if (!discovery) return null;

  const { role, phases, tips, matchedKDMs, totalQuestions } = discovery;
  const bankName = phases[2]?.label?.replace('-Specific', '') || 'Bank';

  let questionCounter = 0;

  return (
    <div>
      {/* Header Banner */}
      <div
        className="rounded-xl p-5 mb-5"
        style={{
          background: `linear-gradient(135deg, #091C35 0%, ${role.color} 100%)`,
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle size={18} className="text-white/80" />
              <h3 className="text-white font-bold text-base">
                Discovery Questions — {bankName}
              </h3>
            </div>
            <p className="text-white/60 text-xs leading-relaxed max-w-md">
              Role-based discovery questions tailored to this bank&apos;s context,
              competitive landscape, and strategic priorities.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <div className="text-xl font-black text-white">{totalQuestions}</div>
              <div className="text-[9px] text-white/50 uppercase">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-black text-white">{relevantRoles.filter(r => r.hasMatch).length}</div>
              <div className="text-[9px] text-white/50 uppercase">Roles</div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Selector */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Users size={14} className="text-fg-muted" />
          <span className="text-xs font-bold text-fg-muted uppercase tracking-wider">Select Role</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {relevantRoles.map(({ roleKey, role: r, kdms, isTarget, hasMatch }) => (
            <RoleCard
              key={roleKey}
              roleKey={roleKey}
              role={r}
              kdms={kdms}
              isTarget={isTarget}
              hasMatch={hasMatch}
              active={activeRoleKey === roleKey}
              onClick={() => setSelectedRole(roleKey)}
            />
          ))}
        </div>
      </div>

      {/* Role Objective */}
      <div
        className="flex items-start gap-3 p-3 rounded-lg mb-5"
        style={{ background: `${role.color}08`, border: `1px solid ${role.color}20` }}
      >
        <Target size={16} style={{ color: role.color }} className="shrink-0 mt-0.5" />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: role.color }}>
            Meeting Objective
          </div>
          <p className="text-xs text-fg-subtle mt-0.5">{role.objective}</p>
        </div>
      </div>

      {/* Matched Contacts */}
      {matchedKDMs.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <User size={14} className="text-fg-muted" />
            <span className="text-xs font-bold text-fg-muted">
              Known Contacts ({matchedKDMs.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {matchedKDMs.map((kdm, i) => (
              <KdmBadge key={i} kdm={kdm} roleColor={role.color} />
            ))}
          </div>
        </div>
      )}

      {/* Copy All + Info */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-fg-disabled">{totalQuestions} questions across {phases.filter(p => p.questions.length > 0).length} phases</span>
        <CopyAllQuestions phases={phases} roleName={role.title} bankName={bankName} />
      </div>

      {/* Question Phases */}
      {phases.map((phase) => {
        const startIdx = questionCounter;
        questionCounter += phase.questions.length;
        return (
          <PhaseSection
            key={phase.key}
            phase={phase}
            roleColor={role.color}
            startIndex={startIdx}
          />
        );
      })}

      {/* Meeting Prep Tips */}
      {tips.length > 0 && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className="text-amber-600" />
            <span className="text-xs font-bold text-amber-800">
              Meeting Prep Tips — {role.title}
            </span>
          </div>
          <ul className="space-y-1.5">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-900">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
