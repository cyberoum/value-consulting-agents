import { INTEL_CATEGORIES, CONFIDENCE_LEVELS } from '../../data/userIntel';
import { AlertTriangle, ArrowUp, ArrowDown, Minus, Zap, Users, Target, TrendingUp } from 'lucide-react';

export default function IntelSuggestion({ category, structured, rawContent, confidence }) {
  if (!structured) return null;

  const cat = INTEL_CATEGORIES[category];
  const conf = CONFIDENCE_LEVELS[confidence];

  return (
    <div className="space-y-3">
      {/* Category header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{cat.icon}</span>
        <span className="text-xs font-bold" style={{ color: cat.color }}>{cat.label}</span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: conf.bg, color: conf.color }}>
          {conf.icon} {conf.label}
        </span>
      </div>

      {/* Structured output based on category */}
      {category === 'signal' && <SignalCard data={structured} />}
      {category === 'pain_point' && <PainPointCard data={structured} />}
      {category === 'leadership' && <LeadershipCard data={structured} />}
      {category === 'meeting_note' && <MeetingNoteCard data={structured} />}
      {category === 'cx_insight' && <CxInsightCard data={structured} />}
      {category === 'competition' && <CompetitionCard data={structured} />}
      {category === 'strategy' && <StrategyCard data={structured} />}
      {category === 'qualification' && <QualificationCard data={structured} />}

      {/* Raw content preview */}
      <div className="mt-3 p-3 bg-surface-2 rounded-lg border border-border">
        <div className="text-[9px] font-bold text-fg-disabled uppercase mb-1">Original Input</div>
        <p className="text-[11px] text-fg-muted leading-relaxed line-clamp-4">{rawContent}</p>
      </div>
    </div>
  );
}

// ── Card Components ──

function SignalCard({ data }) {
  return (
    <div className="p-4 bg-primary-50 border border-primary/20 rounded-xl">
      <div className="flex items-start gap-2 mb-2">
        <Zap size={14} className="text-primary mt-0.5 shrink-0" />
        <div className="font-bold text-sm text-primary leading-snug">{data.signal}</div>
      </div>
      {data.implication && (
        <div className="ml-5 text-xs text-fg-muted leading-relaxed mb-2">{data.implication}</div>
      )}
      <div className="flex gap-2 ml-5 flex-wrap">
        {data.urgency && (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
            data.urgency === 'high' ? 'bg-danger-subtle text-danger' :
            data.urgency === 'medium' ? 'bg-warning/10 text-warning' :
            'bg-surface-3 text-fg-muted'
          }`}>
            {data.urgency === 'high' ? '🔴' : data.urgency === 'medium' ? '🟡' : '🟢'} {data.urgency} urgency
          </span>
        )}
      </div>
      {data.suggestedActions?.length > 0 && (
        <div className="mt-3 ml-5">
          <div className="text-[9px] font-bold text-fg-disabled uppercase mb-1">Suggested Actions</div>
          {data.suggestedActions.map((a, i) => (
            <div key={i} className="text-[10px] text-primary-700">→ {a}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function PainPointCard({ data }) {
  return (
    <div className="p-4 bg-danger-subtle border-l-3 border-danger rounded-r-xl">
      <div className="font-bold text-sm text-danger mb-1">{data.title}</div>
      <p className="text-xs text-fg-muted leading-relaxed mb-2">{data.detail}</p>
      <div className="flex gap-2 flex-wrap">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
          data.severity === 'high' ? 'bg-danger/10 text-danger' :
          data.severity === 'medium' ? 'bg-warning/10 text-warning' :
          'bg-surface-3 text-fg-muted'
        }`}>
          Severity: {data.severity}
        </span>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
          data.backbaseRelevance === 'high' ? 'bg-primary-50 text-primary' :
          data.backbaseRelevance === 'medium' ? 'bg-primary-50/50 text-primary-700' :
          'bg-surface-3 text-fg-muted'
        }`}>
          Backbase relevance: {data.backbaseRelevance}
        </span>
      </div>
    </div>
  );
}

function LeadershipCard({ data }) {
  const changeLabels = {
    new_hire: '🆕 New Hire',
    departure: '👋 Departure',
    promotion: '⬆️ Promotion',
    replacement: '🔄 Replacement',
    restructure: '🏗️ Restructure',
    update: '📋 Update',
  };

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Users size={14} className="text-blue-600" />
        <span className="font-bold text-sm text-blue-900">{data.name}</span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
          {changeLabels[data.changeType] || data.changeType}
        </span>
      </div>
      {data.role && <div className="text-xs text-blue-800 mb-1">Role: {data.role}</div>}
      <p className="text-[11px] text-fg-muted leading-relaxed">{data.detail}</p>
      {data.powerMapImpact && data.powerMapImpact !== 'unknown' && (
        <div className="mt-2">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
            data.powerMapImpact === 'champion' ? 'bg-success-subtle text-success' :
            data.powerMapImpact === 'blocker' ? 'bg-danger-subtle text-danger' :
            'bg-surface-3 text-fg-muted'
          }`}>
            Power Map: {data.powerMapImpact}
          </span>
        </div>
      )}
    </div>
  );
}

function MeetingNoteCard({ data }) {
  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
        <div className="text-[10px] font-bold text-purple-700 uppercase mb-1">Meeting Summary</div>
        <p className="text-xs text-fg leading-relaxed">{data.summary}</p>
      </div>

      {/* Key Topics */}
      {data.keyTopics?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.keyTopics.map((t, i) => (
            <span key={i} className="text-[9px] font-bold px-2 py-0.5 bg-primary-50 text-primary rounded-full">{t}</span>
          ))}
        </div>
      )}

      {/* Extracted Insights */}
      {data.extractedInsights?.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-fg-muted uppercase mb-2">
            ✨ Extracted Insights ({data.extractedInsights.length})
          </div>
          {data.extractedInsights.map((insight, i) => (
            <div key={i} className="p-3 bg-surface-2 border border-border rounded-lg mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs">{INTEL_CATEGORIES[insight.targetCategory]?.icon || '📋'}</span>
                <span className="text-[10px] font-bold text-fg" style={{ color: INTEL_CATEGORIES[insight.targetCategory]?.color }}>
                  {INTEL_CATEGORIES[insight.targetCategory]?.label || insight.targetCategory}
                </span>
              </div>
              <p className="text-[11px] text-fg-muted">
                {insight.title || insight.signal || insight.update || insight.detail || JSON.stringify(insight).substring(0, 100)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Next Steps */}
      {data.nextSteps?.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-fg-muted uppercase mb-1">Next Steps</div>
          {data.nextSteps.map((s, i) => (
            <div key={i} className="text-xs text-primary-700">☐ {s}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function CxInsightCard({ data }) {
  const sentimentEmoji = data.sentiment === 'positive' ? '😊' : data.sentiment === 'negative' ? '😟' : '😐';

  return (
    <div className={`p-4 border rounded-xl ${
      data.sentiment === 'positive' ? 'bg-success-subtle border-success/20' :
      data.sentiment === 'negative' ? 'bg-danger-subtle border-danger/20' :
      'bg-surface-2 border-border'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{sentimentEmoji}</span>
        <span className={`text-xs font-bold ${
          data.sentiment === 'positive' ? 'text-success' :
          data.sentiment === 'negative' ? 'text-danger' :
          'text-fg-muted'
        }`}>
          {data.category === 'strength' ? 'CX Strength' : data.category === 'weakness' ? 'CX Weakness' : 'CX Observation'}
        </span>
      </div>
      <p className="text-xs text-fg leading-relaxed">{data.observation}</p>
      {data.suggestedField && (
        <div className="mt-2 text-[9px] text-fg-disabled">
          → Will be added to: <strong>{data.suggestedField.replace('cx_', 'CX ')}</strong>
        </div>
      )}
    </div>
  );
}

function CompetitionCard({ data }) {
  return (
    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Target size={14} className="text-orange-600" />
        <span className="font-bold text-xs text-orange-800">Competition Intel</span>
        {data.riskLevel === 'high' && (
          <span className="text-[9px] font-bold px-2 py-0.5 bg-danger-subtle text-danger rounded-full">
            <AlertTriangle size={8} className="inline mr-0.5" /> High Risk
          </span>
        )}
      </div>
      <p className="text-xs text-fg leading-relaxed mb-2">{data.detail}</p>
      {data.vendorsMentioned?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {data.vendorsMentioned.map((v, i) => (
            <span key={i} className="text-[9px] font-bold px-2 py-0.5 bg-orange-100 text-orange-700 rounded">{v}</span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {data.isWin && <span className="text-[9px] font-bold text-success">✓ Vendor Win</span>}
        {data.isLoss && <span className="text-[9px] font-bold text-danger">✗ Vendor Loss</span>}
        {data.isThreat && <span className="text-[9px] font-bold text-warning">⚠ Active Evaluation</span>}
      </div>
    </div>
  );
}

function StrategyCard({ data }) {
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp size={14} className="text-green-700" />
        <span className="font-bold text-xs text-green-800">Strategy Update</span>
        {data.timeframe && (
          <span className="text-[9px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
            📅 {data.timeframe}
          </span>
        )}
      </div>
      <p className="text-xs text-fg leading-relaxed mb-2">{data.update}</p>
      {data.themes?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {data.themes.map((t, i) => (
            <span key={i} className="text-[9px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{t}</span>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        {data.investmentSignal && <span className="text-[9px] text-green-700 font-bold">💰 Investment Signal</span>}
        {data.transformationSignal && <span className="text-[9px] text-green-700 font-bold">🚀 Transformation Signal</span>}
      </div>
    </div>
  );
}

function QualificationCard({ data }) {
  const DirectionIcon = data.scoreDirection === 'up' ? ArrowUp : data.scoreDirection === 'down' ? ArrowDown : Minus;

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold text-xs text-amber-800">Qualification Update</span>
        <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full capitalize">
          {data.dimension?.replace(/_/g, ' ')}
        </span>
      </div>
      <p className="text-xs text-fg leading-relaxed mb-2">{data.update}</p>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-fg-muted">Score Impact:</span>
        <span className={`flex items-center gap-1 text-xs font-black ${
          data.scoreDirection === 'up' ? 'text-success' :
          data.scoreDirection === 'down' ? 'text-danger' :
          'text-fg-muted'
        }`}>
          <DirectionIcon size={12} />
          {data.scoreSuggestion}
        </span>
      </div>
    </div>
  );
}
