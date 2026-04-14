/**
 * Meeting Tailoring Engine
 *
 * Takes meeting context (who you're meeting, what you know) and produces
 * prioritized, filtered content for each narrative section.
 *
 * The core idea: a meeting with a CFO should emphasize ROI levers and cost zones;
 * a meeting with a CTO should emphasize platform/architecture zones and tech signals;
 * a meeting where the scope is unknown should surface more opening/discovery questions.
 */

import { ROLES, getDiscoveryQuestions } from '../data/discoveryQuestions';

// ── Role → Zone Relevance Keywords ──────────────────────────────────
// When a zone name contains these keywords, it's especially relevant for that role.

const ROLE_ZONE_KEYWORDS = {
  ceo:          ['retail', 'corporate', 'wealth', 'sme', 'business', 'origination', 'engagement'],
  cfo:          ['cost', 'origination', 'consolidation', 'platform', 'efficiency', 'onboarding'],
  cto:          ['platform', 'api', 'integration', 'architecture', 'cloud', 'digital', 'technology', 'assist'],
  head_digital: ['digital', 'engagement', 'mobile', 'app', 'portal', 'customer', 'experience', 'onboarding'],
  head_retail:  ['retail', 'personal', 'consumer', 'onboarding', 'origination', 'engagement'],
  head_business:['sme', 'business', 'corporate', 'commercial', 'lending', 'treasury'],
  head_wealth:  ['wealth', 'asset', 'investment', 'advisory', 'private', 'portfolio'],
  coo:          ['operations', 'origination', 'assist', 'employee', 'process', 'servicing'],
  cro:          ['compliance', 'kyc', 'aml', 'onboarding', 'risk', 'identity', 'verification'],
  chief_ai_officer:          ['ai', 'intelligence', 'automation', 'assist', 'engagement', 'conversational', 'copilot', 'self-service'],
  head_digital_transformation: ['digital', 'engagement', 'platform', 'origination', 'onboarding', 'mobile', 'modernization'],
  head_efficiency:           ['operations', 'origination', 'assist', 'servicing', 'automation', 'self-service', 'cost'],
};

// ── Role → ROI Lever Relevance ──────────────────────────────────────
// Which ROI levers are most relevant for each role (ordered by priority).

const ROLE_LEVER_PRIORITY = {
  ceo:          ['cross_sell', 'channel_shift', 'onboarding', 'cost_to_serve', 'platform'],
  cfo:          ['cost_to_serve', 'platform', 'channel_shift', 'onboarding', 'cross_sell'],
  cto:          ['platform', 'cost_to_serve', 'channel_shift', 'onboarding', 'cross_sell'],
  head_digital: ['channel_shift', 'onboarding', 'cross_sell', 'cost_to_serve', 'platform'],
  head_retail:  ['onboarding', 'cross_sell', 'channel_shift', 'cost_to_serve', 'platform'],
  head_business:['onboarding', 'cross_sell', 'cost_to_serve', 'channel_shift', 'platform'],
  head_wealth:  ['cross_sell', 'onboarding', 'channel_shift', 'platform', 'cost_to_serve'],
  coo:          ['cost_to_serve', 'channel_shift', 'platform', 'onboarding', 'cross_sell'],
  cro:          ['onboarding', 'cost_to_serve', 'platform', 'channel_shift', 'cross_sell'],
  chief_ai_officer:          ['cost_to_serve', 'channel_shift', 'cross_sell', 'onboarding', 'platform'],
  head_digital_transformation: ['channel_shift', 'platform', 'onboarding', 'cost_to_serve', 'cross_sell'],
  head_efficiency:           ['cost_to_serve', 'platform', 'channel_shift', 'onboarding', 'cross_sell'],
};

// ── Role → ROI Framing ──────────────────────────────────────────────
// How to position the ROI conversation for each audience.

const ROLE_ROI_FRAMING = {
  ceo:          'Focus on total value creation and competitive positioning. Lead with base-case total, then show the biggest levers.',
  cfo:          'Lead with conservative scenario. Emphasize payback period, cost reduction, and defensible assumptions. Offer to build the business case together.',
  cto:          'Frame around platform consolidation savings and developer efficiency. Show the technology cost reduction lever prominently.',
  head_digital: 'Emphasize digital channel shift and customer experience improvements. Show how conversion lift drives revenue.',
  head_retail:  'Focus on customer acquisition, engagement revenue, and cross-sell uplift. Frame around customer lifetime value.',
  head_business:'Lead with SME onboarding speed and RM productivity gains. Show business banking revenue opportunity.',
  head_wealth:  'Emphasize advisor productivity and AUM growth potential. Frame around client experience and cross-sell.',
  coo:          'Lead with operational efficiency and cost-to-serve reduction. Show STP rate improvements and FTE impact.',
  cro:          'Frame around compliance cost reduction and KYC automation. Show onboarding drop-off recovery as revenue.',
  chief_ai_officer: 'Lead with AI-powered automation ROI — reduction in manual interventions, intelligent routing, and copilot-driven productivity gains. Frame Backbase APA as the AI orchestration layer.',
  head_digital_transformation: 'Emphasize platform modernization savings and time-to-market acceleration. Show how Backbase replaces fragmented point solutions with a unified engagement platform.',
  head_efficiency: 'Lead with STP rate improvements, cost-per-transaction reduction, and FTE reallocation. Show concrete process automation use cases with before/after metrics.',
};

// ── Role → Signal Relevance Keywords ────────────────────────────────

const ROLE_SIGNAL_KEYWORDS = {
  ceo:          ['strategy', 'growth', 'market', 'competition', 'acquisition', 'transformation', 'ceo', 'board'],
  cfo:          ['cost', 'revenue', 'profit', 'efficiency', 'invest', 'budget', 'margin', 'restructur'],
  cto:          ['technology', 'platform', 'cloud', 'api', 'digital', 'legacy', 'migration', 'architect', 'vendor'],
  head_digital: ['digital', 'mobile', 'app', 'customer', 'experience', 'engagement', 'channel', 'ux'],
  head_retail:  ['retail', 'personal', 'customer', 'branch', 'onboard', 'product', 'acquisition'],
  head_business:['sme', 'business', 'corporate', 'lending', 'commercial', 'treasury'],
  head_wealth:  ['wealth', 'asset', 'invest', 'advisor', 'portfolio', 'private', 'hnw'],
  coo:          ['operation', 'process', 'automat', 'efficien', 'legacy', 'cost', 'service'],
  cro:          ['compliance', 'regulat', 'risk', 'aml', 'kyc', 'gdpr', 'psd', 'dora'],
  chief_ai_officer:          ['ai', 'automat', 'intelligen', 'machine learn', 'copilot', 'chatbot', 'genai', 'data'],
  head_digital_transformation: ['transform', 'moderniz', 'digital', 'migration', 'platform', 'legacy', 'change'],
  head_efficiency:           ['efficien', 'automat', 'process', 'cost', 'stp', 'manual', 'optimiz', 'streamlin'],
};

// ── Core Functions ──────────────────────────────────────────────────

/**
 * Match a KDM to a role key using ROLES aliases.
 * Returns the best-matching roleKey or null.
 */
export function getRoleForKDM(kdm) {
  if (!kdm?.role) return null;
  const roleLower = kdm.role.toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  for (const [roleKey, role] of Object.entries(ROLES)) {
    for (const alias of role.aliases) {
      if (roleLower.includes(alias.toLowerCase())) {
        // Longer alias = more specific match = higher score
        const score = alias.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = roleKey;
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Score how relevant a zone is to the meeting's role composition.
 * Returns 0-1 where 1 = highly relevant.
 */
export function scoreZoneRelevance(zoneName, roleKeys) {
  if (!roleKeys.length) return 0.5; // neutral if no roles

  const zoneWords = (zoneName || '').toLowerCase();
  let maxScore = 0;

  for (const roleKey of roleKeys) {
    const keywords = ROLE_ZONE_KEYWORDS[roleKey] || [];
    const matches = keywords.filter(kw => zoneWords.includes(kw)).length;
    const score = keywords.length > 0 ? matches / Math.min(keywords.length, 4) : 0;
    maxScore = Math.max(maxScore, score);
  }

  return Math.min(maxScore, 1);
}

/**
 * Score how relevant a signal is to the meeting's role composition.
 */
export function scoreSignalRelevance(signal, roleKeys) {
  if (!roleKeys.length) return 0.5;

  const text = ((signal.signal || '') + ' ' + (signal.implication || '')).toLowerCase();
  let maxScore = 0;

  for (const roleKey of roleKeys) {
    const keywords = ROLE_SIGNAL_KEYWORDS[roleKey] || [];
    const matches = keywords.filter(kw => text.includes(kw)).length;
    const score = keywords.length > 0 ? matches / Math.min(keywords.length, 3) : 0;
    maxScore = Math.max(maxScore, score);
  }

  return Math.min(maxScore, 1);
}

/**
 * Get the recommended question phases based on what the consultant knows.
 */
export function getRecommendedPhases(scopeKnown, painPointKnown) {
  // Both known → skip opening, focus on validation
  if (scopeKnown === 'known' && painPointKnown === 'known') {
    return { phases: ['deep_dive', 'bank_specific', 'validation'], hint: 'Since you know the scope and pain points, focus on validation and deepening understanding.' };
  }
  // Scope known, pain unknown → deep dive to discover pain
  if (scopeKnown === 'known' && painPointKnown === 'unknown') {
    return { phases: ['deep_dive', 'bank_specific', 'validation'], hint: 'You know the scope but need to uncover pain points. Focus on deep-dive questions.' };
  }
  // Scope unknown → start broad
  if (scopeKnown === 'unknown') {
    return { phases: ['opening', 'deep_dive', 'bank_specific'], hint: 'Scope is unclear — start with broad opening questions to understand priorities.' };
  }
  // Partial knowledge → balanced approach
  return { phases: ['opening', 'deep_dive', 'bank_specific', 'validation'], hint: 'Mixed knowledge level — use a balanced approach across all phases.' };
}

/**
 * Get ROI lever ordering for the meeting audience.
 */
export function getPrioritizedLevers(roleKeys) {
  if (!roleKeys.length) return null; // no reordering

  // Aggregate lever priorities across all roles
  const leverScores = {};
  for (const roleKey of roleKeys) {
    const levers = ROLE_LEVER_PRIORITY[roleKey] || [];
    levers.forEach((lever, idx) => {
      const score = levers.length - idx; // higher score for higher priority
      leverScores[lever] = (leverScores[lever] || 0) + score;
    });
  }

  // Return sorted lever IDs
  return Object.entries(leverScores)
    .sort((a, b) => b[1] - a[1])
    .map(([lever]) => lever);
}

/**
 * Get the ROI framing guidance for the audience.
 */
export function getRoiFraming(roleKeys) {
  if (!roleKeys.length) return null;
  // Use the most senior role's framing
  const priorityOrder = ['ceo', 'cfo', 'cto', 'coo', 'cro', 'head_digital', 'head_retail', 'head_business', 'head_wealth'];
  for (const rk of priorityOrder) {
    if (roleKeys.includes(rk)) return ROLE_ROI_FRAMING[rk];
  }
  return ROLE_ROI_FRAMING[roleKeys[0]] || null;
}

/**
 * Get tailored discovery questions for the meeting.
 * Merges role-based questions from all attendee roles.
 */
export function getTailoredQuestions(bankKey, roleKeys, scopeKnown, painPointKnown) {
  if (!roleKeys.length) return null;

  const { phases: recommendedPhases, hint } = getRecommendedPhases(scopeKnown, painPointKnown);
  const allQuestions = [];
  const seenQuestions = new Set();

  for (const roleKey of roleKeys) {
    const result = getDiscoveryQuestions(bankKey, roleKey);
    if (!result) continue;

    for (const phase of result.phases) {
      if (!recommendedPhases.includes(phase.key)) continue;
      for (const q of phase.questions) {
        const qText = q.question || q;
        if (!seenQuestions.has(qText)) {
          seenQuestions.add(qText);
          allQuestions.push({
            ...q,
            question: qText,
            roleKey,
            phaseKey: phase.key,
            phaseLabel: phase.label,
          });
        }
      }
    }
  }

  return { questions: allQuestions.slice(0, 10), hint, roleKeys };
}

/**
 * Aggregate meeting tips across all attendee roles.
 */
export function getAggregatedTips(roleKeys) {
  if (!roleKeys.length) return [];

  const tips = [];
  for (const roleKey of roleKeys) {
    const role = ROLES[roleKey];
    const result = getDiscoveryQuestions(null, roleKey);
    if (result?.tips) {
      tips.push({
        roleKey,
        roleTitle: role?.title || roleKey,
        roleIcon: role?.icon || '👤',
        tips: result.tips.slice(0, 3),
      });
    }
  }
  return tips;
}

/**
 * Build a complete tailored briefing context.
 * This is the main entry point used by BankPage.
 */
export function buildMeetingContext(attendees, scopeKnown, painPointKnown) {
  const roleKeys = [...new Set(
    attendees
      .map(a => a.roleKey)
      .filter(Boolean)
  )];

  return {
    attendees,
    roleKeys,
    scopeKnown,
    painPointKnown,
    isActive: attendees.length > 0,
    audienceLabel: roleKeys.map(rk => ROLES[rk]?.title || rk).join(' + '),
    roiFraming: getRoiFraming(roleKeys),
  };
}
