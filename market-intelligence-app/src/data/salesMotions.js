/**
 * Sales Motions — Evidence-Based Motion Analysis for Account Planning
 *
 * Two-layer architecture:
 *   1. SALES_MOTIONS — reference library defining what each motion is
 *   2. analyzeMotionsForBank() — evidence-based analysis that reads a bank's
 *      actual situation and derives which motions apply with specific reasoning
 *
 * The analysis starts from the bank's problems (pain points, signals, gaps)
 * and maps UPWARD to motions — not the other way around.
 */

// ═══════════════════════════════════════════════
// Layer 1: Motion Reference Library
// ═══════════════════════════════════════════════

export const SALES_MOTIONS = {
  'retail-to-wealth': {
    id: 'retail-to-wealth',
    label: 'Retail → Wealth Upgrade',
    icon: '📈',
    color: '#7C4DFF',
    description: 'Bank has a large retail base and wants to capture more wallet share from high-net-worth segments by adding self-serve investment and advisory capabilities.',
    qualifying_questions: [
      'How are your wealth clients currently onboarded — fully digital, hybrid, or paper-based?',
      'What percentage of your HNW clients actively use your mobile app for portfolio management?',
      'How do your relationship managers currently share portfolio insights with clients?',
      'What is your target for AUM growth over the next 3 years?',
    ],
    signals_to_watch: [
      'Annual report mentions wealth expansion as strategic priority',
      'New Head of Wealth appointed in last 12 months',
      'Job postings for digital wealth or private banking roles',
    ],
    internal_resources: ['Wealth domain specialist', 'Backbase Wealth demo environment', 'Wealth ROI model'],
    backbase_products: ['Backbase Wealth', 'Digital Onboarding', 'Engagement Banking Platform'],
    typical_deal_size: '€2M–€8M',
    typical_cycle: '9–15 months',
  },
  'intergenerational-wealth': {
    id: 'intergenerational-wealth',
    label: 'Intergenerational Wealth Transfer',
    icon: '🏛️',
    color: '#E65100',
    description: 'Bank is losing wealth clients to competitors during inheritance events. Modern digital tools for estate planning, beneficiary management, and next-gen onboarding are missing.',
    qualifying_questions: [
      'What is your current retention rate of assets during intergenerational transfers?',
      'Do you have a dedicated digital product for the next generation of your wealth clients?',
      'How do you currently manage beneficiary profiles and estate planning digitally?',
      'What does client churn look like at inheritance or major life events?',
    ],
    signals_to_watch: [
      'Churn data shows spike at certain age segments',
      'New initiative around next-gen banking mentioned publicly',
      'Competitor launches estate planning or family banking product',
    ],
    internal_resources: ['Wealth domain specialist', 'Reference client in private banking'],
    backbase_products: ['Backbase Wealth', 'Engagement Banking Platform'],
    typical_deal_size: '€1.5M–€5M',
    typical_cycle: '9–12 months',
  },
  'channel-decoupling': {
    id: 'channel-decoupling',
    label: 'Channel Core Decoupling',
    icon: '🔓',
    color: '#3366FF',
    description: 'Bank is trapped in a monolithic core banking system that bundles front-end and back-end. They want to modernize the digital experience without replacing the core.',
    qualifying_questions: [
      'Is your current digital experience built on top of your core banking system or separate?',
      'How long did it take to release your last major digital feature?',
      'What is blocking you from delivering the digital experience your customers expect?',
      'Have you evaluated decoupling your engagement layer from your core?',
    ],
    signals_to_watch: [
      'Job postings for headless banking or API-first engineers',
      'Annual report mentions digital transformation without specifics',
      'Public complaints about app quality in app store reviews',
    ],
    internal_resources: ['Pre-sales architect', 'Core decoupling reference architecture', 'Migration case studies'],
    backbase_products: ['Engagement Banking Platform', 'Grand Central', 'Connector Studio'],
    typical_deal_size: '€3M–€12M',
    typical_cycle: '12–18 months',
  },
  'sme-banking-gap': {
    id: 'sme-banking-gap',
    label: 'SME Banking Experience Gap',
    icon: '🏢',
    color: '#2E7D32',
    description: 'Bank has strong retail digital banking but its SME/business portal is significantly behind. SME clients are vocal about friction in daily banking and lending.',
    qualifying_questions: [
      'How do your SME clients currently access their accounts and submit payment instructions?',
      'What is the NPS or satisfaction score for your business banking product vs retail?',
      'What is your current digital SME lending journey — how many steps, how much paper?',
      'How do your SME RMs currently manage client interactions digitally?',
    ],
    signals_to_watch: [
      'SME mentioned as growth segment in investor communications',
      'Low business banking app store ratings',
      'Fintech challenger launching SME product in same market',
    ],
    internal_resources: ['SME domain specialist', 'Backbase SME demo'],
    backbase_products: ['Backbase for Business', 'SME Portal', 'Lending Journeys'],
    typical_deal_size: '€2M–€6M',
    typical_cycle: '9–14 months',
  },
  'elastic-operations': {
    id: 'elastic-operations',
    label: 'Elastic Operations / AI-Native Workforce',
    icon: '🤖',
    color: '#1F3D99',
    description: 'Bank wants to scale operations without linear headcount growth. Exploring AI agents, automated workflows, and intelligent orchestration.',
    qualifying_questions: [
      'What is your current cost-to-serve per customer and what is your target?',
      'Which manual operations processes consume the most headcount today?',
      'What is your current AI strategy — experimenting, scaling, or deploying?',
      'How do your operations staff currently interact with customer data and workflows?',
    ],
    signals_to_watch: [
      'Public announcement of headcount reduction or efficiency program',
      'CTO speaks at conference about AI or automation',
      'Cost/income ratio deteriorating in latest results',
    ],
    internal_resources: ['AI developer demo team', 'Agentic banking reference architecture'],
    backbase_products: ['Engagement Banking Platform', 'AI Assist', 'Orchestration Fabric'],
    typical_deal_size: '€3M–€10M',
    typical_cycle: '12–18 months',
  },
  'payments-modernization': {
    id: 'payments-modernization',
    label: 'Payments & Cash Management Modernization',
    icon: '💳',
    color: '#C62828',
    description: "Bank's payments and cash management for corporate or retail clients is behind standards. Open banking, instant payments, or embedded finance opportunities are being missed.",
    qualifying_questions: [
      'What is your current roadmap for instant payments and open banking compliance?',
      'How do your corporate clients currently initiate and track payments — fully digital?',
      'What is the biggest operational friction in your current payments workflow?',
      'Are you building or buying your payments modernization capabilities?',
    ],
    signals_to_watch: [
      'Regulatory deadline for instant payments (EU IP Regulation)',
      'New payments vendor contract or RFP issued',
      'Competitor launches embedded payments product',
    ],
    internal_resources: ['Transaction banking specialist', 'Payments reference architecture'],
    backbase_products: ['Transaction Banking', 'Grand Central', 'Orchestration Fabric'],
    typical_deal_size: '€2M–€7M',
    typical_cycle: '10–16 months',
  },
};

// ═══════════════════════════════════════════════
// Layer 2: Evidence-Based Motion Analysis
// ═══════════════════════════════════════════════

/**
 * Evidence mapping: each entry maps a bank data pattern to a motion
 * with a weight and the type of evidence it represents.
 *
 * This is the core logic that replaces keyword matching.
 * Each rule says: "IF this specific condition is true about the bank,
 * THEN this motion gets +N points, and HERE is the evidence."
 */
const EVIDENCE_RULES = [
  // ── Channel Decoupling ──
  { test: (d) => hasPainPoint(d, ['legacy', 'core', 'monolith', 'aging', 'platform fragmentation', 'moderniz']),
    motion: 'channel-decoupling', weight: 5, reason: (d) => `Pain point: ${findPainPoint(d, ['legacy', 'core', 'monolith', 'aging', 'platform fragmentation', 'moderniz'])}` },
  { test: (d) => hasSignal(d, ['technology investment', 'digital transformation', 'platform', 'moderniz', 'rebuild']),
    motion: 'channel-decoupling', weight: 4, reason: (d) => `Signal: ${findSignal(d, ['technology investment', 'digital transformation', 'platform', 'moderniz', 'rebuild'])}` },
  { test: (d) => hasLandingZone(d, ['platform', 'unified', 'digital banking', 'engagement']),
    motion: 'channel-decoupling', weight: 3, reason: (d) => `Landing zone: ${findLandingZone(d, ['platform', 'unified', 'digital banking', 'engagement'])}` },
  { test: (d) => hasInStrategy(d, ['cloud', 'API', 'microservice', 'decouple', 'headless']),
    motion: 'channel-decoupling', weight: 3, reason: () => 'Digital strategy mentions cloud/API/decoupling' },

  // ── SME Banking Gap ──
  { test: (d) => hasPainPoint(d, ['SME', 'business banking', 'SME experience', 'entrepreneur']),
    motion: 'sme-banking-gap', weight: 5, reason: (d) => `Pain point: ${findPainPoint(d, ['SME', 'business banking', 'SME experience', 'entrepreneur'])}` },
  { test: (d) => hasSignal(d, ['SME', 'small business', 'business banking', 'entrepreneur']),
    motion: 'sme-banking-gap', weight: 4, reason: (d) => `Signal: ${findSignal(d, ['SME', 'small business', 'business banking', 'entrepreneur'])}` },
  { test: (d) => hasLandingZone(d, ['SME', 'business banking', 'business portal']),
    motion: 'sme-banking-gap', weight: 4, reason: (d) => `Landing zone: ${findLandingZone(d, ['SME', 'business banking', 'business portal'])}` },

  // ── Retail → Wealth ──
  { test: (d) => hasPainPoint(d, ['wealth', 'advisory', 'investment', 'private banking', 'HNW', 'portfolio']),
    motion: 'retail-to-wealth', weight: 5, reason: (d) => `Pain point: ${findPainPoint(d, ['wealth', 'advisory', 'investment', 'private banking', 'HNW', 'portfolio'])}` },
  { test: (d) => hasSignal(d, ['wealth', 'advisory', 'asset management', 'private banking', 'AUM']),
    motion: 'retail-to-wealth', weight: 4, reason: (d) => `Signal: ${findSignal(d, ['wealth', 'advisory', 'asset management', 'private banking', 'AUM'])}` },
  { test: (d) => hasLandingZone(d, ['wealth', 'advisory', 'investment']),
    motion: 'retail-to-wealth', weight: 4, reason: (d) => `Landing zone: ${findLandingZone(d, ['wealth', 'advisory', 'investment'])}` },
  { test: (d) => hasLargeCustomerBase(d, 1000000),
    motion: 'retail-to-wealth', weight: 2, reason: () => 'Large retail customer base (1M+) creates wealth upgrade opportunity' },

  // ── Intergenerational Wealth ──
  { test: (d) => hasPainPoint(d, ['aging', 'intergenerational', 'next gen', 'estate', 'inheritance', 'churn']),
    motion: 'intergenerational-wealth', weight: 5, reason: (d) => `Pain point: ${findPainPoint(d, ['aging', 'intergenerational', 'next gen', 'estate', 'inheritance'])}` },
  { test: (d) => hasInStrategy(d, ['aging population', 'next generation', 'young', 'millennial', 'retention']),
    motion: 'intergenerational-wealth', weight: 3, reason: () => 'Strategy mentions next-gen or aging population challenges' },
  { test: (d) => hasPainPoint(d, ['younger', 'digital-native', 'attract', 'next generation']),
    motion: 'intergenerational-wealth', weight: 3, reason: (d) => `Pain point: ${findPainPoint(d, ['younger', 'digital-native', 'attract', 'next generation'])}` },

  // ── Elastic Operations ──
  { test: (d) => hasPainPoint(d, ['employee', 'operations', 'efficiency', 'cost to serve', 'manual', 'automation']),
    motion: 'elastic-operations', weight: 5, reason: (d) => `Pain point: ${findPainPoint(d, ['employee', 'operations', 'efficiency', 'cost to serve', 'manual', 'automation'])}` },
  { test: (d) => hasSignal(d, ['AI', 'automation', 'efficiency', 'cost', 'headcount', 'operational']),
    motion: 'elastic-operations', weight: 4, reason: (d) => `Signal: ${findSignal(d, ['AI', 'automation', 'efficiency', 'cost', 'headcount', 'operational'])}` },
  { test: (d) => hasHighCostIncome(d, 55),
    motion: 'elastic-operations', weight: 3, reason: (d) => `Cost/income ratio ${d.operational_profile?.cost_income_ratio || ''} indicates efficiency pressure` },
  { test: (d) => hasLandingZone(d, ['employee', 'assist', 'RM', 'operations']),
    motion: 'elastic-operations', weight: 3, reason: (d) => `Landing zone: ${findLandingZone(d, ['employee', 'assist', 'RM', 'operations'])}` },

  // ── Payments Modernization ──
  { test: (d) => hasPainPoint(d, ['payment', 'cash management', 'transaction banking', 'open banking', 'instant']),
    motion: 'payments-modernization', weight: 5, reason: (d) => `Pain point: ${findPainPoint(d, ['payment', 'cash management', 'transaction banking', 'open banking'])}` },
  { test: (d) => hasSignal(d, ['payment', 'PSD2', 'open banking', 'instant payment', 'transaction']),
    motion: 'payments-modernization', weight: 4, reason: (d) => `Signal: ${findSignal(d, ['payment', 'PSD2', 'open banking', 'instant payment', 'transaction'])}` },
  { test: (d) => hasLandingZone(d, ['payment', 'transaction', 'corporate banking', 'cash management']),
    motion: 'payments-modernization', weight: 3, reason: (d) => `Landing zone: ${findLandingZone(d, ['payment', 'transaction', 'corporate banking', 'cash management'])}` },
];

// ═══════════════════════════════════════════════
// Evidence helper functions
// ═══════════════════════════════════════════════

function hasPainPoint(d, keywords) {
  return (d.pain_points || []).some(p => {
    const text = `${p.title} ${p.detail}`.toLowerCase();
    return keywords.some(k => text.includes(k.toLowerCase()));
  });
}

function findPainPoint(d, keywords) {
  const match = (d.pain_points || []).find(p => {
    const text = `${p.title} ${p.detail}`.toLowerCase();
    return keywords.some(k => text.includes(k.toLowerCase()));
  });
  return match?.title || '';
}

function hasSignal(d, keywords) {
  return (d.signals || []).some(s => {
    const text = `${s.signal} ${s.implication}`.toLowerCase();
    return keywords.some(k => text.includes(k.toLowerCase()));
  });
}

function findSignal(d, keywords) {
  const match = (d.signals || []).find(s => {
    const text = `${s.signal} ${s.implication}`.toLowerCase();
    return keywords.some(k => text.includes(k.toLowerCase()));
  });
  return match?.signal || '';
}

function hasLandingZone(d, keywords) {
  return (d.backbase_landing_zones || []).some(lz => {
    const text = `${lz.zone} ${lz.rationale || ''}`.toLowerCase();
    return keywords.some(k => text.includes(k.toLowerCase()));
  });
}

function findLandingZone(d, keywords) {
  const match = (d.backbase_landing_zones || []).find(lz => {
    const text = `${lz.zone} ${lz.rationale || ''}`.toLowerCase();
    return keywords.some(k => text.includes(k.toLowerCase()));
  });
  return match ? `${match.zone} (fit: ${match.fit_score}/10)` : '';
}

function hasInStrategy(d, keywords) {
  const text = [
    typeof d.digital_strategy === 'string' ? d.digital_strategy : '',
    typeof d.strategic_initiatives === 'string' ? d.strategic_initiatives : '',
    d.overview || '',
  ].join(' ').toLowerCase();
  return keywords.some(k => text.includes(k.toLowerCase()));
}

function hasLargeCustomerBase(d, threshold) {
  const custStr = d.operational_profile?.total_customers || '';
  const match = custStr.match(/([\d.]+)\s*[Mm]/);
  if (match) return parseFloat(match[1]) * 1000000 >= threshold;
  const numMatch = custStr.replace(/[^0-9]/g, '');
  return numMatch && parseInt(numMatch) >= threshold;
}

function hasHighCostIncome(d, threshold) {
  const ciStr = d.operational_profile?.cost_income_ratio || '';
  const num = parseFloat(ciStr.replace(/[^0-9.]/g, ''));
  return !isNaN(num) && num >= threshold;
}

// ═══════════════════════════════════════════════
// Main Analysis Function
// ═══════════════════════════════════════════════

/**
 * Analyze a bank's situation and derive which sales motions apply.
 *
 * Returns motions sorted by evidence strength, each with:
 * - The motion definition (from SALES_MOTIONS)
 * - Total evidence score
 * - Specific evidence items (what data points triggered this motion)
 * - A verdict: 'primary' (score >= 10), 'secondary' (>= 5), 'exploratory' (>= 3), or 'not_applicable'
 *
 * Only returns motions with score >= 3 (at least some evidence).
 */
export function analyzeMotionsForBank(bankData) {
  if (!bankData) return [];

  // Accumulate evidence per motion
  const motionScores = {};

  for (const rule of EVIDENCE_RULES) {
    try {
      if (rule.test(bankData)) {
        if (!motionScores[rule.motion]) {
          motionScores[rule.motion] = { score: 0, evidence: [] };
        }
        motionScores[rule.motion].score += rule.weight;
        motionScores[rule.motion].evidence.push(rule.reason(bankData));
      }
    } catch {
      // Skip rules that fail on incomplete data
    }
  }

  // Build results with verdicts
  const results = Object.entries(motionScores)
    .filter(([, data]) => data.score >= 3) // Only motions with real evidence
    .map(([motionId, data]) => {
      const motion = SALES_MOTIONS[motionId];
      if (!motion) return null;

      let verdict;
      if (data.score >= 10) verdict = 'primary';
      else if (data.score >= 5) verdict = 'secondary';
      else verdict = 'exploratory';

      return {
        ...motion,
        evidenceScore: data.score,
        evidence: data.evidence,
        verdict,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.evidenceScore - a.evidenceScore);

  return results;
}

/**
 * Get the motion reference by ID.
 * Use this when you need the full motion definition without analysis.
 */
export function getMotionById(motionId) {
  return SALES_MOTIONS[motionId] || null;
}

/**
 * Get all motion IDs.
 */
export function getAllMotionIds() {
  return Object.keys(SALES_MOTIONS);
}
