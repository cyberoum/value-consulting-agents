import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown, ChevronUp, Copy, Check, AlertTriangle, Filter, Swords, Zap, Target } from 'lucide-react';
import { getBattleCards, CATEGORIES, SEVERITY } from '../../data/battleCards';

// ─── Category Filter Pill ─────────────────────────────────────────

function CategoryPill({ id, active, onClick }) {
  const cat = CATEGORIES[id];
  if (!cat) return null;
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
      style={{
        background: active ? cat.color : cat.bg,
        color: active ? '#fff' : cat.color,
        border: `1px solid ${active ? cat.color : 'transparent'}`,
      }}
    >
      {cat.icon} {cat.label}
    </button>
  );
}

// ─── Severity Badge ────────────────────────────────────────────────

function SeverityBadge({ level }) {
  const s = SEVERITY[level];
  if (!s) return null;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

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
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all hover:bg-gray-100"
      style={{ color: copied ? '#2E7D32' : '#64748B' }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ─── Objection Card ────────────────────────────────────────────────

function ObjectionCard({ card, index }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES[card.category] || {};
  const response = card.response || {};

  // Build copyable response text
  const responseText = [
    response.headline,
    '',
    ...(response.points || []).map((p, i) => `${i + 1}. ${p}`),
    '',
    'Proof Points:',
    ...(response.proofPoints || []).map(p => `• ${p}`),
    card.bankContext ? `\nBank-Specific Context:\n${card.bankContext}` : '',
  ].filter(Boolean).join('\n');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow"
      style={{ borderColor: expanded ? cat.color : '#E2E8F0' }}
    >
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        {/* Category icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
          style={{ background: cat.bg, color: cat.color }}
        >
          {cat.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <SeverityBadge level={card.severity} />
            {card.source === 'bank-specific' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                Bank-Specific
              </span>
            )}
          </div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">
            {card.objection.startsWith('"') ? (
              <span className="italic">{card.objection}</span>
            ) : (
              <>"{card.objection}"</>
            )}
          </p>
        </div>

        {/* Expand/Collapse */}
        <div className="flex-shrink-0 text-gray-400 mt-1">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded Response */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Divider */}
              <div className="border-t" style={{ borderColor: cat.bg }} />

              {/* Response Headline */}
              <div className="flex items-start justify-between">
                <div
                  className="px-3 py-2 rounded-lg text-sm font-bold flex-1"
                  style={{ background: cat.bg, color: cat.color }}
                >
                  ↳ {response.headline}
                </div>
                <CopyButton text={responseText} label="Copy All" />
              </div>

              {/* Talking Points */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Talking Points
                </h4>
                <ul className="space-y-2">
                  {(response.points || []).map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Proof Points */}
              {response.proofPoints && response.proofPoints.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Target size={12} /> Proof Points
                  </h4>
                  <ul className="space-y-1.5">
                    {response.proofPoints.map((proof, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-800 bg-green-50 rounded-lg px-3 py-2">
                        <Check size={14} className="flex-shrink-0 mt-0.5" />
                        <span>{proof}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bank-Specific Context */}
              {card.bankContext && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Zap size={12} /> Bank-Specific Intel
                  </h4>
                  <p className="text-sm text-blue-800 leading-relaxed">{card.bankContext}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Competitive Counter Card ──────────────────────────────────────

function CompetitiveCounterCard({ counter }) {
  const [expanded, setExpanded] = useState(false);

  const copyText = [
    `Competitor: ${counter.competitor}`,
    `Positioning: ${counter.positioning}`,
    '',
    'Key Points:',
    ...counter.keyPoints.map((p, i) => `${i + 1}. ${p}`),
    '',
    'Differentiators:',
    ...counter.differentiators.map(d => `✓ ${d}`),
  ].join('\n');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-orange-200 rounded-xl overflow-hidden bg-white"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-lg flex-shrink-0">
          ⚔️
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Competitive Counter</p>
          <p className="font-bold text-gray-900 text-sm">{counter.competitor}</p>
          <p className="text-xs text-gray-500 mt-0.5">{counter.positioning}</p>
        </div>
        <div className="text-gray-400">{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="border-t border-orange-100" />

              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 italic">{counter.whenMentioned}</p>
                <CopyButton text={copyText} label="Copy All" />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Response Points</h4>
                <ul className="space-y-1.5">
                  {counter.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-50 flex items-center justify-center text-xs font-bold text-orange-600 mt-0.5">{i + 1}</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Differentiators</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {counter.differentiators.map((diff, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-green-800 bg-green-50 rounded px-2.5 py-1.5">
                      <Check size={12} className="flex-shrink-0 mt-0.5" />
                      <span>{diff}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────

export default function BattleCardsPanel({ bankKey }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCompetitive, setShowCompetitive] = useState(true);

  const data = useMemo(() => getBattleCards(bankKey), [bankKey]);

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Shield size={48} className="mx-auto mb-3 opacity-50" />
        <p className="font-medium">No battle card data available</p>
      </div>
    );
  }

  // Filter cards by category
  const filteredCards = activeCategory
    ? data.cards.filter(c => c.category === activeCategory)
    : data.cards;

  const bankSpecificCount = data.cards.filter(c => c.source === 'bank-specific').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-5"
        style={{ background: 'linear-gradient(135deg, #091C35 0%, #1F3D99 100%)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Shield size={20} /> Battle Cards — {data.bankName}
            </h3>
            <p className="text-blue-200 text-sm mt-1">
              Objection handling intelligence tailored to this bank's context, competitive landscape, and decision dynamics.
            </p>
          </div>
          <div className="flex gap-3 text-center">
            <div className="bg-white/10 rounded-lg px-3 py-2">
              <div className="text-white font-bold text-xl">{data.totalCards}</div>
              <div className="text-blue-200 text-xs">Objections</div>
            </div>
            {data.criticalCount > 0 && (
              <div className="bg-red-500/20 rounded-lg px-3 py-2">
                <div className="text-red-300 font-bold text-xl">{data.criticalCount}</div>
                <div className="text-red-200 text-xs">Critical</div>
              </div>
            )}
            {bankSpecificCount > 0 && (
              <div className="bg-blue-500/20 rounded-lg px-3 py-2">
                <div className="text-blue-300 font-bold text-xl">{bankSpecificCount}</div>
                <div className="text-blue-200 text-xs">Bank-Specific</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <Filter size={12} /> Filter:
        </span>
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            !activeCategory ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({data.totalCards})
        </button>
        {data.categories.map(catId => {
          const cat = CATEGORIES[catId];
          const count = data.cards.filter(c => c.category === catId).length;
          return (
            <CategoryPill
              key={catId}
              id={catId}
              active={activeCategory === catId}
              onClick={() => setActiveCategory(activeCategory === catId ? null : catId)}
            />
          );
        })}
      </div>

      {/* Objection Cards */}
      <div className="space-y-3">
        {filteredCards.map((card, i) => (
          <ObjectionCard key={card.id} card={card} index={i} />
        ))}
      </div>

      {/* Competitive Counters Section */}
      {data.competitiveCounters.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowCompetitive(!showCompetitive)}
            className="flex items-center gap-2 text-sm font-bold text-orange-700 hover:text-orange-800 transition-colors"
          >
            <Swords size={16} />
            Competitive Counters ({data.competitiveCounters.length})
            {showCompetitive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <AnimatePresence>
            {showCompetitive && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {data.competitiveCounters.map(counter => (
                  <CompetitiveCounterCard key={counter.id} counter={counter} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Usage Tips */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
          <AlertTriangle size={12} /> Meeting Prep Tips
        </h4>
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• <strong>Critical/Likely objections</strong> — prepare for these first; they WILL come up</li>
          <li>• <strong>Bank-specific cards</strong> — these address unique dynamics at {data.bankName}</li>
          <li>• <strong>Copy responses</strong> — paste into your meeting prep notes or email</li>
          <li>• <strong>Competitive counters</strong> — know these cold before walking into the room</li>
          <li>• <strong>Never be defensive</strong> — acknowledge, redirect, prove with evidence</li>
        </ul>
      </div>
    </div>
  );
}
