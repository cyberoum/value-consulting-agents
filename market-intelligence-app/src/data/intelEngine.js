// Intelligence Structuring Engine
// Takes raw user input and produces structured data suggestions
// Currently: pattern-based extraction + templates
// Future: Claude API integration for deep analysis

import { INTEL_CATEGORIES } from './userIntel';

/**
 * Process raw intel text and produce structured suggestions
 * Returns an object matching the target data structure
 */
export function structureIntel(category, rawText, bankContext = {}) {
  switch (category) {
    case 'signal':
      return structureSignal(rawText, bankContext);
    case 'pain_point':
      return structurePainPoint(rawText, bankContext);
    case 'leadership':
      return structureLeadership(rawText, bankContext);
    case 'meeting_note':
      return structureMeetingNote(rawText, bankContext);
    case 'cx_insight':
      return structureCxInsight(rawText, bankContext);
    case 'competition':
      return structureCompetition(rawText, bankContext);
    case 'strategy':
      return structureStrategy(rawText, bankContext);
    case 'qualification':
      return structureQualification(rawText, bankContext);
    default:
      return { summary: rawText };
  }
}

// ── Category-specific structuring ──

function structureSignal(text, ctx) {
  // Extract signal and implication pattern
  const lines = text.split(/[.\n]/).map(l => l.trim()).filter(Boolean);
  const signal = lines[0] || text.substring(0, 100);
  const implication = lines.slice(1).join('. ') || inferImplication(signal, ctx);

  return {
    type: 'signal',
    signal: signal,
    implication: implication,
    urgency: detectUrgency(text),
    suggestedActions: inferActions(text, 'signal', ctx),
  };
}

function structurePainPoint(text, ctx) {
  const lines = text.split(/[.\n]/).map(l => l.trim()).filter(Boolean);
  const title = extractTitle(lines[0] || text);
  const detail = lines.slice(1).join('. ') || lines[0] || text;

  return {
    type: 'pain_point',
    title: title,
    detail: detail,
    severity: detectSeverity(text),
    backbaseRelevance: inferBackbaseRelevance(text),
  };
}

function structureLeadership(text, ctx) {
  const nameMatch = text.match(/(?:^|\b)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
  const roleMatch = text.match(/(?:as|appointed|new|becomes?|named)\s+(.+?)(?:\.|,|$)/i);
  const changeMatch = text.match(/(?:join|leav|depart|replac|promot|appoint|mov|hire)/i);

  return {
    type: 'leadership',
    name: nameMatch?.[1] || '[Name not detected]',
    role: roleMatch?.[1]?.trim() || '[Role not detected]',
    changeType: changeMatch ? detectChangeType(text) : 'update',
    detail: text,
    powerMapImpact: inferPowerMapImpact(text),
  };
}

function structureMeetingNote(text, ctx) {
  // Multi-output: meeting notes can produce signals, pain points, leadership updates, etc.
  const suggestions = [];

  // Look for pain point indicators
  const painPatterns = /frustrat|struggle|challenge|problem|issue|pain|difficult|broken|slow|complex|expensive|cost overrun/gi;
  if (painPatterns.test(text)) {
    const painSentences = extractSentencesMatching(text, painPatterns);
    suggestions.push({
      targetCategory: 'pain_point',
      title: extractTitle(painSentences[0] || ''),
      detail: painSentences.join('. '),
      confidence: 'likely',
    });
  }

  // Look for signal indicators
  const signalPatterns = /announc|plan|strateg|invest|launch|partner|transform|migrat|replac|evaluat|RFP|vendor select/gi;
  if (signalPatterns.test(text)) {
    const signalSentences = extractSentencesMatching(text, signalPatterns);
    suggestions.push({
      targetCategory: 'signal',
      signal: signalSentences[0] || '',
      implication: signalSentences.slice(1).join('. '),
      confidence: 'likely',
    });
  }

  // Look for leadership mentions
  const leadershipPatterns = /(?:met|spoke|call|meeting) with\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi;
  const leaderMatch = leadershipPatterns.exec(text);
  if (leaderMatch) {
    suggestions.push({
      targetCategory: 'leadership',
      name: leaderMatch[1],
      detail: `Direct contact established — mentioned in meeting notes`,
      confidence: 'confirmed',
    });
  }

  // Look for product interest
  const productPatterns = /backbase|wealth|retail|business banking|onboarding|engagement|origination|lending|payment/gi;
  if (productPatterns.test(text)) {
    const productSentences = extractSentencesMatching(text, productPatterns);
    suggestions.push({
      targetCategory: 'qualification',
      update: productSentences.join('. '),
      dimension: 'landing_zones',
      confidence: 'likely',
    });
  }

  return {
    type: 'meeting_note',
    summary: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
    extractedInsights: suggestions,
    keyTopics: extractKeyTopics(text),
    nextSteps: extractNextSteps(text),
  };
}

function structureCxInsight(text, ctx) {
  const isStrength = /good|great|excellent|love|fast|easy|intuitive|smooth|best|strong/i.test(text);
  const isWeakness = /bad|poor|slow|confus|frustrat|missing|lack|broken|outdated|clunky/i.test(text);

  return {
    type: 'cx_insight',
    observation: text,
    sentiment: isStrength ? 'positive' : isWeakness ? 'negative' : 'neutral',
    category: isStrength ? 'strength' : isWeakness ? 'weakness' : 'observation',
    suggestedField: isStrength ? 'cx_strengths' : isWeakness ? 'cx_weaknesses' : null,
  };
}

function structureCompetition(text, ctx) {
  // Try to extract vendor names (common banking vendors)
  const vendorPatterns = /Temenos|Finastra|FIS|Fiserv|TCS|Infosys|Thought Machine|Mambu|10x|nCino|Salesforce|SAP|Oracle|Microsoft|IBM|Accenture|Deloitte|Backbase|Avaloq|Sopra|Diebold|NCR/gi;
  const vendors = [...new Set((text.match(vendorPatterns) || []).map(v => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()))];

  return {
    type: 'competition',
    detail: text,
    vendorsMentioned: vendors,
    isWin: /won|selected|chose|contract|deal/i.test(text),
    isLoss: /lost|rejected|chose competitor|went with/i.test(text),
    isThreat: /evaluat|RFP|shortlist|considering|looking at/i.test(text),
    riskLevel: /replac|switch|migrat/i.test(text) ? 'high' : 'medium',
  };
}

function structureStrategy(text, ctx) {
  return {
    type: 'strategy',
    update: text,
    themes: extractStrategyThemes(text),
    timeframe: extractTimeframe(text),
    investmentSignal: /invest|budget|spend|allocat|fund/i.test(text),
    transformationSignal: /transform|modern|digital|cloud|migrat/i.test(text),
  };
}

function structureQualification(text, ctx) {
  // Detect which qualification dimension this relates to
  const dimensionMap = {
    firmographics: /size|asset|tier|employ|revenue|customer base/i,
    technographics: /tech|stack|legacy|cloud|modern|platform|vendor/i,
    decision_process: /budget|procurement|decision|governance|cycle|buy/i,
    landing_zones: /product|fit|retail|wealth|business|onboard|lend/i,
    pain_push: /pain|urgent|pressure|frustrat|mandate|deadline|compet/i,
    power_map: /champion|sponsor|blocker|decision.?maker|CTO|CIO|CEO/i,
    partner_access: /partner|SI|integrator|consult|accenture|deloitte/i,
  };

  let dimension = 'general';
  for (const [dim, pattern] of Object.entries(dimensionMap)) {
    if (pattern.test(text)) { dimension = dim; break; }
  }

  // Try to detect score direction
  const isPositive = /increas|improv|strong|good|high|activat|engag|interest/i.test(text);
  const isNegative = /decreas|worsen|weak|low|block|delay|stall|no budget/i.test(text);

  return {
    type: 'qualification',
    update: text,
    dimension: dimension,
    scoreDirection: isPositive ? 'up' : isNegative ? 'down' : 'neutral',
    scoreSuggestion: isPositive ? '+0.5' : isNegative ? '-0.5' : '0',
  };
}

// ── Helper Functions ──

function extractTitle(text) {
  // Create a short title from a sentence
  const cleaned = text.replace(/^(the|a|an|our|their|they|we|i)\s+/i, '');
  const words = cleaned.split(/\s+/).slice(0, 6);
  return words.join(' ') + (cleaned.split(/\s+/).length > 6 ? '...' : '');
}

function detectUrgency(text) {
  if (/urgent|immediate|critical|breaking|just announced|today/i.test(text)) return 'high';
  if (/soon|upcoming|next quarter|planning|expected/i.test(text)) return 'medium';
  return 'low';
}

function detectSeverity(text) {
  if (/critical|severe|major|significant|blocking|showstopper/i.test(text)) return 'high';
  if (/moderate|notable|concerning|growing/i.test(text)) return 'medium';
  return 'low';
}

function detectChangeType(text) {
  if (/join|hire|appoint|recruit|onboard/i.test(text)) return 'new_hire';
  if (/leav|depart|resign|retire|exit/i.test(text)) return 'departure';
  if (/promot|elevat|expand/i.test(text)) return 'promotion';
  if (/replac|succeed/i.test(text)) return 'replacement';
  if (/restructur|reorganiz|merge/i.test(text)) return 'restructure';
  return 'update';
}

function inferImplication(signal, ctx) {
  // Generate a basic implication based on keywords
  if (/CEO|CTO|CIO|CDO/i.test(signal)) return 'Leadership change may create window for new vendor conversations';
  if (/transform|moderniz|digital/i.test(signal)) return 'Active transformation signals potential platform evaluation';
  if (/cost|efficien|optimi/i.test(signal)) return 'Cost pressure may increase appetite for platform consolidation';
  if (/partner|acquisit|merger/i.test(signal)) return 'Corporate restructuring may shift technology priorities';
  return 'Monitor for impact on Backbase engagement opportunity';
}

function inferBackbaseRelevance(text) {
  const keywords = ['digital', 'platform', 'customer experience', 'onboarding', 'engagement', 'mobile', 'lending', 'wealth', 'self-service', 'omnichannel'];
  const matches = keywords.filter(k => text.toLowerCase().includes(k));
  if (matches.length >= 3) return 'high';
  if (matches.length >= 1) return 'medium';
  return 'low';
}

function inferPowerMapImpact(text) {
  if (/champion|sponsor|advocate|supportive|interested|wants/i.test(text)) return 'champion';
  if (/block|against|resist|skeptic|oppose/i.test(text)) return 'blocker';
  if (/neutral|undecided|new|unknown/i.test(text)) return 'neutral';
  return 'unknown';
}

function inferActions(text, category, ctx) {
  const actions = [];
  if (/meeting|call|conversation/i.test(text)) actions.push('Schedule follow-up');
  if (/new.*(?:CTO|CIO|CDO)/i.test(text)) actions.push('Research new contact on LinkedIn');
  if (/RFP|evaluation|vendor/i.test(text)) actions.push('Alert sales team immediately');
  if (/partner|SI/i.test(text)) actions.push('Check partner alignment');
  return actions.length > 0 ? actions : ['Review and assess impact'];
}

function extractSentencesMatching(text, pattern) {
  const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
  return sentences.filter(s => pattern.test(s));
}

function extractKeyTopics(text) {
  const topics = [];
  if (/digital|platform|app|mobile/i.test(text)) topics.push('Digital Transformation');
  if (/cost|budget|ROI|invest/i.test(text)) topics.push('Cost & Investment');
  if (/customer|CX|experience|engagement/i.test(text)) topics.push('Customer Experience');
  if (/wealth|private|advisory/i.test(text)) topics.push('Wealth Management');
  if (/SME|business banking|corporate/i.test(text)) topics.push('Business Banking');
  if (/retail|personal|consumer/i.test(text)) topics.push('Retail Banking');
  if (/cloud|API|microservice|modern/i.test(text)) topics.push('Technology');
  if (/regul|compli|KYC|AML/i.test(text)) topics.push('Regulation & Compliance');
  return topics;
}

function extractNextSteps(text) {
  const steps = [];
  const nextStepPattern = /(?:next step|follow.?up|action|todo|to.?do|need to|should|will)\s*[:—-]?\s*(.+?)(?:\.|$)/gi;
  let match;
  while ((match = nextStepPattern.exec(text)) !== null) {
    steps.push(match[1].trim());
  }
  return steps;
}

function extractTimeframe(text) {
  if (/Q[1-4]\s*20\d{2}/i.test(text)) return text.match(/Q[1-4]\s*20\d{2}/i)[0];
  if (/202[5-9]/i.test(text)) return text.match(/202[5-9]/i)[0];
  if (/this year|current year/i.test(text)) return '2026';
  if (/next year/i.test(text)) return '2027';
  if (/next quarter/i.test(text)) return 'Next Quarter';
  return null;
}

function extractStrategyThemes(text) {
  const themes = [];
  if (/cost.*reduc|efficien|lean/i.test(text)) themes.push('Cost Optimization');
  if (/growth|expand|scale/i.test(text)) themes.push('Growth');
  if (/innovat|AI|machine learn|automat/i.test(text)) themes.push('Innovation & AI');
  if (/sustain|ESG|green/i.test(text)) themes.push('Sustainability');
  if (/custom|client|experienc/i.test(text)) themes.push('Customer Centricity');
  if (/open.*bank|API|ecosystem|partner/i.test(text)) themes.push('Open Banking');
  return themes;
}
