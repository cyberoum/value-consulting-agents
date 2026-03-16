import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Crosshair, AlertTriangle, Lightbulb, Briefcase, Loader2, WifiOff, ChevronDown, RefreshCw } from 'lucide-react';
import { BANK_DATA, QUAL_DATA, COMP_DATA, CX_DATA, VALUE_SELLING } from '../../data/utils';
import { checkAiAvailability, deepAnalyzeBank } from '../../data/aiService';

const ANALYSIS_TYPES = [
  {
    key: 'competitive',
    label: 'Competitive Intelligence',
    icon: Crosshair,
    desc: 'Vendor landscape, displacement opportunities, competitive threats',
    color: '#3366FF',
  },
  {
    key: 'pain_points',
    label: 'Pain Point Discovery',
    icon: AlertTriangle,
    desc: 'Top business pain points and how Backbase addresses them',
    color: '#E53E3E',
  },
  {
    key: 'opportunities',
    label: 'Opportunity Mapping',
    icon: Lightbulb,
    desc: 'Highest-value opportunities with entry strategies',
    color: '#38A169',
  },
  {
    key: 'executive_briefing',
    label: 'Executive Briefing',
    icon: Briefcase,
    desc: '2-minute briefing with talking points and provocative questions',
    color: '#D69E2E',
  },
];

function buildBankContext(bankKey) {
  const bd = BANK_DATA[bankKey];
  const qd = QUAL_DATA[bankKey];
  const comp = COMP_DATA[bankKey];
  const cx = CX_DATA[bankKey];
  const vs = VALUE_SELLING[bankKey];

  const ctx = {};
  if (bd) {
    ctx.country = bd.country;
    ctx.totalAssets = bd.total_assets_eur;
    ctx.employees = bd.employees;
    ctx.customers = bd.customers;
    ctx.coreBanking = bd.core_banking;
    ctx.digitalPlatform = bd.digital_platform;
    ctx.tagline = bd.tagline;
  }
  if (qd) {
    ctx.qualificationScore = Object.values(qd).reduce((s, d) => d?.score ? s + d.score : s, 0);
    ctx.landingZones = qd.landing_zones?.zones?.map(z => z.name).join(', ');
    ctx.risk = qd.risk;
  }
  if (comp) {
    ctx.keyCompetitors = comp.vendors?.map(v => v.name).join(', ');
    ctx.competitiveContext = comp.context;
  }
  if (cx) {
    ctx.appRating = cx.app_rating;
    ctx.cxStrengths = cx.cx_strengths?.join(', ');
    ctx.cxWeaknesses = cx.cx_weaknesses?.join(', ');
  }
  if (vs) {
    ctx.valueHypothesis = vs.value_hypothesis;
    ctx.discoveryQuestions = vs.discovery_questions?.slice(0, 3).join('; ');
  }
  return ctx;
}

export default function AiAnalysisPanel({ bankKey }) {
  const [aiAvailable, setAiAvailable] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [expanded, setExpanded] = useState(null);

  const bd = BANK_DATA[bankKey];
  const bankName = bd?.bank_name || bankKey;

  useEffect(() => {
    checkAiAvailability().then(setAiAvailable);
  }, []);

  const runAnalysis = async (type) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      const context = buildBankContext(bankKey);
      const result = await deepAnalyzeBank(bankName, type, context);
      setResults(prev => ({ ...prev, [type]: { data: result, timestamp: new Date().toISOString() } }));
      setExpanded(type);
    } catch (err) {
      setResults(prev => ({ ...prev, [type]: { error: err.message, timestamp: new Date().toISOString() } }));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const clearCache = (type) => {
    try { sessionStorage.removeItem(`ai_deep_${bankName}_${type}`); } catch { /* */ }
    setResults(prev => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
  };

  if (aiAvailable === null) {
    return <div className="p-6 text-center text-fg-muted text-xs">Checking AI availability...</div>;
  }

  if (!aiAvailable) {
    return (
      <div className="p-6 text-center">
        <WifiOff size={32} className="mx-auto mb-3 text-fg-disabled" />
        <p className="text-sm font-bold text-fg mb-1">AI Analysis Unavailable</p>
        <p className="text-xs text-fg-muted mb-3">Start the API proxy to enable Claude-powered analysis.</p>
        <code className="text-[11px] bg-surface-2 text-fg-muted px-3 py-1.5 rounded-lg font-mono">
          ANTHROPIC_API_KEY=sk-ant-... npm run api
        </code>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Brain size={16} className="text-primary" />
        <span className="text-xs font-bold text-fg">Claude AI Analysis</span>
        <span className="text-[9px] text-fg-disabled">Powered by claude-sonnet-4-20250514</span>
      </div>

      {ANALYSIS_TYPES.map((type) => {
        const result = results[type.key];
        const isLoading = loading[type.key];
        const isExpanded = expanded === type.key;
        const Icon = type.icon;

        return (
          <div key={type.key} className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* Card header */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${type.color}15` }}>
                  <Icon size={16} style={{ color: type.color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-fg">{type.label}</div>
                  <div className="text-[10px] text-fg-muted truncate">{type.desc}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {result?.data && (
                  <button
                    onClick={() => clearCache(type.key)}
                    className="p-1.5 text-fg-disabled hover:text-fg transition-colors"
                    title="Re-analyze (clear cache)"
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
                {result ? (
                  <button
                    onClick={() => setExpanded(isExpanded ? null : type.key)}
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                    style={{ color: type.color, background: `${type.color}10` }}
                  >
                    {result.error ? 'Error' : 'View Results'}
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={10} />
                    </motion.div>
                  </button>
                ) : (
                  <button
                    onClick={() => runAnalysis(type.key)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg text-white transition-colors disabled:opacity-50"
                    style={{ background: type.color }}
                  >
                    {isLoading ? <Loader2 size={10} className="animate-spin" /> : <Brain size={10} />}
                    {isLoading ? 'Analyzing...' : 'Analyze'}
                  </button>
                )}
              </div>
            </div>

            {/* Result content */}
            <AnimatePresence initial={false}>
              {isExpanded && result && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="px-4 pb-4 border-t border-border pt-3">
                    {result.error ? (
                      <div className="text-xs text-danger">{result.error}</div>
                    ) : (
                      <AnalysisResult type={type.key} data={result.data} color={type.color} />
                    )}
                    <div className="mt-2 text-[9px] text-fg-disabled text-right">
                      Generated {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function AnalysisResult({ type, data, color }) {
  if (!data) return null;

  switch (type) {
    case 'competitive':
      return (
        <div className="space-y-3">
          {data.topOpportunity && (
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
              <div className="text-[9px] font-bold text-primary uppercase mb-1">Top Opportunity</div>
              <div className="text-xs text-fg">{data.topOpportunity}</div>
            </div>
          )}
          {data.findings?.map((f, i) => (
            <FindingCard key={i} finding={f} color={color} />
          ))}
          {data.riskFactors?.length > 0 && (
            <div className="mt-2">
              <div className="text-[9px] font-bold text-danger uppercase mb-1">Risk Factors</div>
              <ul className="text-xs text-fg-muted space-y-0.5">
                {data.riskFactors.map((r, i) => <li key={i}>- {r}</li>)}
              </ul>
            </div>
          )}
        </div>
      );

    case 'pain_points':
      return (
        <div className="space-y-3">
          {data.topPriority && (
            <div className="p-2.5 rounded-lg bg-danger/5 border border-danger/10">
              <div className="text-[9px] font-bold text-danger uppercase mb-1">Lead With</div>
              <div className="text-xs text-fg">{data.topPriority}</div>
            </div>
          )}
          {data.painPoints?.map((pp, i) => (
            <div key={i} className="p-2.5 bg-surface-2 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-fg">{pp.title}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  pp.severity === 'critical' ? 'bg-danger/10 text-danger' :
                  pp.severity === 'high' ? 'bg-warning/10 text-warning' : 'bg-fg-muted/10 text-fg-muted'
                }`}>{pp.severity}</span>
              </div>
              <p className="text-[11px] text-fg-muted mb-1">{pp.description}</p>
              {pp.quantifiedImpact && <p className="text-[10px] text-fg"><strong>Impact:</strong> {pp.quantifiedImpact}</p>}
              {pp.affectedStakeholder && <p className="text-[10px] text-fg-muted"><strong>Stakeholder:</strong> {pp.affectedStakeholder}</p>}
              {pp.backbaseSolution && <p className="text-[10px] text-primary mt-1"><strong>Backbase:</strong> {pp.backbaseSolution}</p>}
            </div>
          ))}
        </div>
      );

    case 'opportunities':
      return (
        <div className="space-y-3">
          {data.recommendedLeadWith && (
            <div className="p-2.5 rounded-lg bg-success/5 border border-success/10">
              <div className="text-[9px] font-bold text-success uppercase mb-1">Recommended Lead</div>
              <div className="text-xs text-fg">{data.recommendedLeadWith}</div>
            </div>
          )}
          {data.opportunities?.map((opp, i) => (
            <div key={i} className="p-2.5 bg-surface-2 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-fg">{opp.title}</span>
                <div className="flex items-center gap-1.5">
                  {opp.estimatedValue && <span className="text-[9px] font-bold text-success">{opp.estimatedValue}</span>}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                    opp.confidence === 'high' ? 'bg-success/10 text-success' :
                    opp.confidence === 'medium' ? 'bg-warning/10 text-warning' : 'bg-fg-muted/10 text-fg-muted'
                  }`}>{opp.confidence}</span>
                </div>
              </div>
              <p className="text-[11px] text-fg-muted mb-1">{opp.description}</p>
              {opp.entryStrategy && <p className="text-[10px] text-fg"><strong>Entry:</strong> {opp.entryStrategy}</p>}
              {opp.champion && <p className="text-[10px] text-fg-muted"><strong>Champion:</strong> {opp.champion}</p>}
              {opp.timeline && <p className="text-[10px] text-fg-muted"><strong>Timeline:</strong> {opp.timeline}</p>}
            </div>
          ))}
        </div>
      );

    case 'executive_briefing':
      return (
        <div className="space-y-3">
          {data.openingHook && (
            <div className="p-2.5 rounded-lg bg-warning/5 border border-warning/10">
              <div className="text-[9px] font-bold text-warning uppercase mb-1">Opening Hook</div>
              <div className="text-xs text-fg italic">"{data.openingHook}"</div>
            </div>
          )}
          {data.talkingPoints?.map((tp, i) => (
            <div key={i} className="p-2.5 bg-surface-2 rounded-lg">
              <div className="text-xs font-bold text-fg mb-1">{i + 1}. {tp.topic}</div>
              <p className="text-[11px] text-fg-muted mb-1">{tp.point}</p>
              {tp.dataPoint && <p className="text-[10px] text-fg"><strong>Data:</strong> {tp.dataPoint}</p>}
              {tp.transition && <p className="text-[10px] text-primary"><strong>Bridge:</strong> {tp.transition}</p>}
            </div>
          ))}
          {data.provocativeQuestion && (
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
              <div className="text-[9px] font-bold text-primary uppercase mb-1">Provocative Question</div>
              <div className="text-xs text-fg italic">"{data.provocativeQuestion}"</div>
            </div>
          )}
          {data.closingMove && (
            <div className="p-2 bg-surface-2 rounded-lg">
              <div className="text-[9px] font-bold text-fg-muted uppercase mb-0.5">Next Step</div>
              <div className="text-xs text-fg">{data.closingMove}</div>
            </div>
          )}
          {data.doNots?.length > 0 && (
            <div className="mt-1">
              <div className="text-[9px] font-bold text-danger uppercase mb-1">Avoid</div>
              <ul className="text-[10px] text-fg-muted space-y-0.5">
                {data.doNots.map((d, i) => <li key={i}>- {d}</li>)}
              </ul>
            </div>
          )}
        </div>
      );

    default:
      return <pre className="text-[10px] text-fg-muted overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
  }
}

function FindingCard({ finding, color }) {
  return (
    <div className="p-2.5 bg-surface-2 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-bold uppercase" style={{ color }}>{finding.category}</span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
          finding.actionability === 'high' ? 'bg-success/10 text-success' :
          finding.actionability === 'medium' ? 'bg-warning/10 text-warning' : 'bg-fg-muted/10 text-fg-muted'
        }`}>{finding.actionability}</span>
      </div>
      <p className="text-xs font-medium text-fg mb-0.5">{finding.finding}</p>
      <p className="text-[11px] text-fg-muted mb-1">{finding.detail}</p>
      {finding.suggestedAction && (
        <p className="text-[10px] text-primary"><strong>Action:</strong> {finding.suggestedAction}</p>
      )}
    </div>
  );
}
