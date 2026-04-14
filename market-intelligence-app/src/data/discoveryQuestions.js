/**
 * Role-Based Discovery Questions Engine
 *
 * Generates targeted discovery questions based on:
 * 1. Stakeholder role (CEO, CTO, Head of Digital, etc.)
 * 2. Bank-specific context (pain points, strategy, competitive landscape)
 * 3. Meeting phase (Opening → Deep Dive → Validation → Close)
 *
 * Usage: getDiscoveryQuestions(bankKey, roleKey) → { role, phases[], bankContext }
 */

import { BANK_DATA, COMP_DATA, VALUE_SELLING, QUAL_DATA } from './utils';
import { calculateRoi } from './roiEngine';

// ── Role Definitions ──────────────────────────────────────────────────

export const ROLES = {
  ceo: {
    key: 'ceo',
    title: 'CEO / President',
    icon: '👔',
    color: '#1F3D99',
    description: 'Strategic vision, growth priorities, competitive positioning',
    aliases: ['President', 'Group CEO', 'President & CEO', 'President & Group CEO', 'Managing Director'],
    objective: 'Understand strategic direction, investment appetite, and what success looks like in 2-3 years',
  },
  cfo: {
    key: 'cfo',
    title: 'CFO / Finance',
    icon: '📊',
    color: '#059669',
    description: 'Investment justification, cost-to-income, ROI expectations',
    aliases: ['CFO', 'Chief Financial Officer', 'Head of Finance', 'Deputy CEO'],
    objective: 'Understand financial constraints, ROI expectations, and how technology investments are evaluated',
  },
  cto: {
    key: 'cto',
    title: 'CTO / CIO / Head of IT',
    icon: '⚙️',
    color: '#7C3AED',
    description: 'Technology architecture, build vs. buy, integration requirements',
    aliases: ['CTO', 'CIO', 'Head of IT', 'Head of Technology', 'Head of Group Technology', 'EVP Technology', 'Acting Head of Group Technology', 'CPIO'],
    objective: 'Understand tech stack, architecture philosophy, integration constraints, and build-vs-buy stance',
  },
  head_digital: {
    key: 'head_digital',
    title: 'Head of Digital',
    icon: '📱',
    color: '#3366FF',
    description: 'Digital strategy, customer experience, channel modernization',
    aliases: ['Head of Digital', 'Chief Digital Officer', 'Head of One Digital', 'Head of Digital Customer Engagement', 'Head of Retail Digital', 'Head of Digital Wealth'],
    objective: 'Understand digital strategy, customer experience vision, and channel priorities',
  },
  head_retail: {
    key: 'head_retail',
    title: 'Head of Retail / Personal Banking',
    icon: '🏦',
    color: '#DC2626',
    description: 'Retail banking strategy, customer acquisition, product priorities',
    aliases: ['Head of Retail', 'Head of Personal Banking', 'EVP Personal Banking', 'Head of Business & Retail Banking', 'Head of Consumer Banking'],
    objective: 'Understand retail banking priorities, customer segment strategy, and digital channel requirements',
  },
  head_business: {
    key: 'head_business',
    title: 'Head of Business / SME Banking',
    icon: '🏢',
    color: '#EA580C',
    description: 'SME/corporate banking, business customer needs, lending strategy',
    aliases: ['Head of Business Banking', 'Head of SME', 'EVP Corporate Banking', 'Head of Large Corporates', 'CCO'],
    objective: 'Understand business banking priorities, SME customer needs, and commercial growth targets',
  },
  head_wealth: {
    key: 'head_wealth',
    title: 'Head of Wealth / Asset Management',
    icon: '💎',
    color: '#A855F7',
    description: 'Wealth management strategy, advisor tools, client experience',
    aliases: ['Head of Wealth', 'Head of Asset Management', 'Head of Wealth & Asset Management', 'Head of Private Banking'],
    objective: 'Understand wealth strategy, advisor enablement needs, and digital client experience goals',
  },
  coo: {
    key: 'coo',
    title: 'COO / Operations',
    icon: '🔧',
    color: '#0891B2',
    description: 'Operational efficiency, process automation, cost reduction',
    aliases: ['COO', 'Chief Operating Officer', 'Head of Operations', 'Head of Group Business Support'],
    objective: 'Understand operational pain points, efficiency targets, and process automation priorities',
  },
  cro: {
    key: 'cro',
    title: 'CRO / Risk & Compliance',
    icon: '🛡️',
    color: '#B91C1C',
    description: 'Risk management, compliance requirements, regulatory technology',
    aliases: ['CRO', 'Chief Risk Officer', 'Head of Risk', 'Chief Compliance Officer', 'Head of Anti-Money Laundering'],
    objective: 'Understand compliance challenges, KYC/AML pain points, and regulatory technology needs',
  },
  chief_ai_officer: {
    key: 'chief_ai_officer',
    title: 'Chief AI Officer / Head of AI',
    icon: '🤖',
    color: '#6366F1',
    description: 'AI strategy, intelligent automation, data-driven decisioning',
    aliases: ['Chief AI Officer', 'Head of AI', 'Head of Artificial Intelligence', 'VP AI', 'Director of AI', 'Head of AI Strategy', 'Head of Data & AI', 'Chief Data & AI Officer'],
    objective: 'Understand AI maturity, automation roadmap, and how AI fits into operational and customer-facing processes',
  },
  head_digital_transformation: {
    key: 'head_digital_transformation',
    title: 'Head of Digital Transformation',
    icon: '🔄',
    color: '#0EA5E9',
    description: 'Transformation programs, change management, operational modernization',
    aliases: ['Head of Digital Transformation', 'Chief Transformation Officer', 'Head of Transformation', 'VP Digital Transformation', 'Director of Transformation', 'Head of Change', 'Head of Business Transformation'],
    objective: 'Understand transformation priorities, organizational readiness, and how digital modernization maps to business outcomes',
  },
  head_efficiency: {
    key: 'head_efficiency',
    title: 'Head of Efficiency / Automation',
    icon: '⚡',
    color: '#F59E0B',
    description: 'Process optimization, STP rates, cost reduction, automation programs',
    aliases: ['Head of Efficiency', 'Head of Automation', 'Head of Process Optimization', 'VP Efficiency', 'Director of Automation', 'Head of Continuous Improvement', 'Head of Process Excellence', 'Head of Operational Excellence'],
    objective: 'Understand automation targets, STP rate goals, process bottlenecks, and cost-per-transaction reduction priorities',
  },
};

// ── Question Templates (Phase-Based) ──────────────────────────────────

const QUESTION_TEMPLATES = {
  ceo: {
    opening: [
      {
        question: "What are your top 3 strategic priorities for the next 2-3 years?",
        intent: "Understand strategic direction and where digital fits",
        tip: "Listen for gaps between stated priorities and current capabilities",
      },
      {
        question: "How do you see your competitive position changing in the market?",
        intent: "Gauge urgency and competitive pressure",
        tip: "Map to specific Backbase capabilities that address competitive gaps",
      },
    ],
    deep_dive: [
      {
        question: "What does your ideal customer experience look like in 3 years?",
        intent: "Vision alignment for digital transformation",
        tip: "Compare to current CX ratings and identify the gap",
      },
      {
        question: "Where are you losing customers today, and what would it take to win them back?",
        intent: "Surface acquisition/retention pain points",
        tip: "Quantify the revenue impact of customer churn",
      },
      {
        question: "How do you balance growth investment vs. cost efficiency in technology?",
        intent: "Understand investment appetite and constraints",
        tip: "Position Backbase as both growth enabler AND cost reducer",
      },
      {
        question: "What keeps you up at night about your technology platform?",
        intent: "Surface hidden concerns about current state",
        tip: "Often reveals build-vs-buy tension or legacy frustration",
      },
    ],
    validation: [
      {
        question: "If you could solve one digital banking challenge this year, what would it be?",
        intent: "Prioritize and focus the conversation",
        tip: "This becomes your entry point use case",
      },
      {
        question: "What would a successful technology partnership look like for you?",
        intent: "Understand vendor evaluation criteria",
        tip: "Listen for red flags about previous failed implementations",
      },
    ],
  },

  cfo: {
    opening: [
      {
        question: "What's your cost-to-income ratio target, and where is the biggest lever?",
        intent: "Understand financial pressure and efficiency goals",
        tip: "Position Backbase ROI against these specific targets",
      },
      {
        question: "How do you evaluate technology investments — what metrics matter most?",
        intent: "Understand the business case framework they use internally",
        tip: "Mirror their language when presenting ROI later",
      },
    ],
    deep_dive: [
      {
        question: "What's your current spend on maintaining digital channels vs. building new capabilities?",
        intent: "Surface the run-vs-change ratio pain point",
        tip: "Most banks spend 70-80% on run; Backbase can flip this",
      },
      {
        question: "How do you measure the ROI of digital investments today?",
        intent: "Understand measurement maturity and set expectations",
        tip: "Offer to help build the business case in their format",
      },
      {
        question: "What's the cost of customer acquisition through digital vs. branch channels?",
        intent: "Quantify the digital cost advantage",
        tip: "Use this to model Lever 2 (customer acquisition) ROI",
      },
      {
        question: "Have previous platform investments delivered on their promised ROI?",
        intent: "Surface skepticism and learn from past failures",
        tip: "Acknowledge this honestly — builds trust",
      },
    ],
    validation: [
      {
        question: "What investment level are you comfortable with for a digital transformation initiative?",
        intent: "Gauge budget range early",
        tip: "Don't anchor too high; let them set the range first",
      },
      {
        question: "What's the payback period you expect for a platform investment?",
        intent: "Calibrate ROI model timeline",
        tip: "Typical Backbase payback is 18-24 months",
      },
    ],
  },

  cto: {
    opening: [
      {
        question: "Walk me through your current technology architecture — what does the stack look like?",
        intent: "Map current state and integration points",
        tip: "Listen for monolithic vs. composable, cloud vs. on-prem",
      },
      {
        question: "What's your philosophy on build vs. buy for customer-facing platforms?",
        intent: "Gauge openness to vendor solutions",
        tip: "If strongly build-oriented, position Backbase as platform not product",
      },
    ],
    deep_dive: [
      {
        question: "How long does it take to ship a new digital feature from concept to production?",
        intent: "Measure current velocity to show improvement potential",
        tip: "Best banks are 2-4 weeks; most are 3-6 months. This is a key value lever.",
      },
      {
        question: "What's your biggest integration challenge with the core banking system?",
        intent: "Identify the core-to-channel friction point",
        tip: "Backbase's integration layer is a key differentiator here",
      },
      {
        question: "How many FTEs are dedicated to maintaining vs. developing your digital channels?",
        intent: "Quantify the maintenance burden",
        tip: "Use this for Lever 1 (developer efficiency) ROI modeling",
      },
      {
        question: "What's your approach to API strategy and open banking?",
        intent: "Assess architecture modernity and openness",
        tip: "Backbase's API-first approach aligns with modern architecture",
      },
      {
        question: "Are you containerized? What's your deployment model — cloud, hybrid, on-prem?",
        intent: "Understand infrastructure maturity",
        tip: "Maps to Backbase deployment options (SaaS, PaaS, self-hosted)",
      },
    ],
    validation: [
      {
        question: "If you could reduce time-to-market for new features by 50%, what would you build first?",
        intent: "Identify priority use cases and test engagement",
        tip: "This often becomes the pilot scope",
      },
      {
        question: "What are your non-negotiables for any technology platform?",
        intent: "Surface deal-breakers early",
        tip: "Common: on-prem option, no vendor lock-in, API-first",
      },
    ],
  },

  head_digital: {
    opening: [
      {
        question: "What's your digital banking vision for the next 2-3 years?",
        intent: "Understand strategic digital ambition",
        tip: "Compare vision to current capability to size the gap",
      },
      {
        question: "How do your customers rate your digital experience compared to competitors?",
        intent: "Surface CX pressure and competitive awareness",
        tip: "Reference app store ratings and NPS benchmarks",
      },
    ],
    deep_dive: [
      {
        question: "Which customer journeys are the most frustrating for your customers today?",
        intent: "Identify highest-impact improvement areas",
        tip: "Onboarding and lending origination are usually the biggest pain points",
      },
      {
        question: "How many separate digital experiences do your customers interact with?",
        intent: "Surface fragmentation and consolidation opportunity",
        tip: "Most banks have 3-7 apps/portals; unification is a key Backbase value",
      },
      {
        question: "What's your mobile-first strategy, and how far along are you?",
        intent: "Assess mobile maturity and ambition",
        tip: "Nordic customers expect mobile-first; this is table stakes",
      },
      {
        question: "How are you thinking about AI and personalization in the customer experience?",
        intent: "Gauge innovation appetite and readiness",
        tip: "Backbase's AI-powered engagement capabilities address this directly",
      },
    ],
    validation: [
      {
        question: "What's the one digital experience you wish you could launch tomorrow?",
        intent: "Identify the 'aha' use case for a pilot",
        tip: "This becomes the landing zone recommendation",
      },
      {
        question: "What's blocking you from moving faster on digital transformation?",
        intent: "Uncover internal obstacles (budget, tech, politics)",
        tip: "If it's tech, Backbase solves it. If it's political, we need champions.",
      },
    ],
  },

  head_retail: {
    opening: [
      {
        question: "What are your top priorities for the retail banking business this year?",
        intent: "Understand business priorities and where digital fits",
        tip: "Listen for customer growth vs. deepening vs. cost reduction",
      },
      {
        question: "How is the retail customer profile changing, and how are you adapting?",
        intent: "Surface demographic and behavioral shifts",
        tip: "Gen Z expectations and aging population both drive digital need",
      },
    ],
    deep_dive: [
      {
        question: "What's your customer acquisition cost through digital vs. physical channels?",
        intent: "Quantify the digital business case",
        tip: "Digital acquisition is typically 60-80% cheaper than branch",
      },
      {
        question: "What percentage of your products can be originated end-to-end digitally?",
        intent: "Assess digital origination maturity",
        tip: "Most banks are <30% fully digital; leading banks are 70%+",
      },
      {
        question: "How are you thinking about the branch network vs. digital investment balance?",
        intent: "Understand channel strategy and organizational dynamics",
        tip: "Backbase empowers branches with digital tools, not just replaces them",
      },
      {
        question: "What's your cross-sell/upsell rate, and how could digital improve it?",
        intent: "Quantify engagement revenue opportunity",
        tip: "This maps to Lever 3 (interaction value) in ROI modeling",
      },
    ],
    validation: [
      {
        question: "If you could give your retail customers one new digital capability, what would it be?",
        intent: "Prioritize the entry use case",
        tip: "Usually: better onboarding, PFM, or real-time engagement",
      },
    ],
  },

  head_business: {
    opening: [
      {
        question: "How is the SME/business banking segment performing vs. your growth targets?",
        intent: "Understand business performance and gap",
        tip: "SME is often the most underserved segment digitally",
      },
      {
        question: "What do your business customers tell you about their digital banking experience?",
        intent: "Surface customer voice and pain points",
        tip: "Business customers often benchmark against consumer apps",
      },
    ],
    deep_dive: [
      {
        question: "What's the typical time from loan application to disbursement for an SME customer?",
        intent: "Quantify origination friction",
        tip: "Industry best: 24-48 hours. Most banks: 2-4 weeks. Big improvement potential.",
      },
      {
        question: "How much relationship manager time is spent on admin vs. client engagement?",
        intent: "Quantify RM productivity opportunity",
        tip: "Most RMs spend 60-70% on admin; Backbase Assist can halve this",
      },
      {
        question: "What self-service capabilities do your business customers have today?",
        intent: "Assess self-service maturity gap",
        tip: "Cash management, payments, reporting are key SME needs",
      },
    ],
    validation: [
      {
        question: "What's the revenue opportunity if you could onboard SME customers 3x faster?",
        intent: "Build the business case together",
        tip: "Frame the conversation around business outcomes, not technology",
      },
    ],
  },

  head_wealth: {
    opening: [
      {
        question: "How is the wealth management business evolving — where do you see the biggest growth?",
        intent: "Understand wealth strategy and growth vectors",
        tip: "Listen for mass affluent vs. HNWI vs. institutional focus",
      },
      {
        question: "What tools do your advisors use today, and what's missing?",
        intent: "Surface advisor enablement pain points",
        tip: "Most advisors juggle 5-8 systems; unification is the value prop",
      },
    ],
    deep_dive: [
      {
        question: "What percentage of your wealth clients have a digital portal today?",
        intent: "Assess digital maturity in wealth",
        tip: "Wealth digital is typically 3-5 years behind retail",
      },
      {
        question: "How do you balance the human advisor relationship with digital self-service?",
        intent: "Understand the hybrid advisory model",
        tip: "Backbase Wealth enables both advisor and client experiences",
      },
      {
        question: "What's the biggest compliance burden in your client onboarding process?",
        intent: "Identify KYC/suitability pain points",
        tip: "Regulatory requirements create massive friction in wealth onboarding",
      },
    ],
    validation: [
      {
        question: "If you could give every advisor one tool they don't have today, what would it be?",
        intent: "Identify the advisor cockpit entry point",
        tip: "Usually: client 360, next-best-action, or portfolio view",
      },
    ],
  },

  coo: {
    opening: [
      {
        question: "What are your top operational efficiency priorities this year?",
        intent: "Understand operational pain points and targets",
        tip: "COOs think in processes and costs; speak their language",
      },
      {
        question: "Where do you see the biggest operational bottlenecks in customer-facing processes?",
        intent: "Surface process automation opportunities",
        tip: "Onboarding, servicing, and origination are usual hot spots",
      },
    ],
    deep_dive: [
      {
        question: "How many manual touchpoints exist in your account opening process?",
        intent: "Quantify automation opportunity",
        tip: "Each manual step is 5-15 min of cost; automation ROI is easy to model",
      },
      {
        question: "What's your straight-through processing rate for key banking products?",
        intent: "Measure automation maturity",
        tip: "Best-in-class is 80%+ STP; most banks are 30-50%",
      },
      {
        question: "How many contact center calls could be deflected with better self-service?",
        intent: "Quantify call deflection opportunity",
        tip: "This maps to Lever 4 (service cost) in ROI modeling",
      },
    ],
    validation: [
      {
        question: "What's the expected headcount impact of a 20% improvement in straight-through processing?",
        intent: "Anchor the cost savings business case",
        tip: "Frame as redeployment not reduction to avoid political sensitivity",
      },
    ],
  },

  cro: {
    opening: [
      {
        question: "What are your biggest compliance and regulatory challenges right now?",
        intent: "Understand regulatory pressure and priorities",
        tip: "In Nordics, AML/KYC is almost always top of mind",
      },
      {
        question: "How is the regulatory landscape evolving, and how are you preparing?",
        intent: "Gauge forward-looking regulatory awareness",
        tip: "PSD3, DORA, ESG reporting are major Nordic regulatory themes",
      },
    ],
    deep_dive: [
      {
        question: "What's the customer drop-off rate during KYC/onboarding processes?",
        intent: "Quantify compliance-induced friction",
        tip: "20-40% drop-off is common; reducing this is pure revenue recovery",
      },
      {
        question: "How much FTE time is spent on manual compliance reviews?",
        intent: "Size the compliance cost burden",
        tip: "Automation can reduce manual review by 40-60%",
      },
      {
        question: "How do you balance customer experience with compliance requirements?",
        intent: "Surface the CX-compliance tension",
        tip: "Backbase makes compliance invisible to the customer",
      },
    ],
    validation: [
      {
        question: "What would it mean if you could reduce KYC processing time by 60% while improving accuracy?",
        intent: "Build the compliance automation case",
        tip: "Compliance teams are usually budget-holders with dedicated spend",
      },
    ],
  },

  chief_ai_officer: {
    opening: [
      {
        question: "What's your AI strategy for banking operations — where are you seeing the most impact today?",
        intent: "Understand AI maturity and current deployment areas",
        tip: "Listen for whether they're in experimentation vs. production-scale AI",
      },
      {
        question: "Where are you still relying on manual processes that intelligent automation could address?",
        intent: "Surface automation gaps and prioritize AI opportunities",
        tip: "Common areas: customer service routing, credit decisioning, document processing",
      },
    ],
    deep_dive: [
      {
        question: "How are you thinking about GenAI for customer-facing vs. employee-facing use cases?",
        intent: "Map their GenAI priorities to Backbase capabilities",
        tip: "Position Backbase APA as the orchestration layer for both",
      },
      {
        question: "What's your data readiness for AI — can you get real-time customer context into decisioning?",
        intent: "Understand data infrastructure maturity for AI",
        tip: "Backbase's unified data layer is a key enabler — 360-degree customer view",
      },
      {
        question: "How do you measure AI ROI today — cost reduction, revenue uplift, or experience improvement?",
        intent: "Understand how they justify AI investments",
        tip: "Frame Backbase AI capabilities against their specific measurement framework",
      },
    ],
    validation: [
      {
        question: "If you could automate one high-volume process end-to-end this year, what would it be?",
        intent: "Identify the entry point use case for APA/AI",
        tip: "This becomes your proof-of-value opportunity",
      },
    ],
  },

  head_digital_transformation: {
    opening: [
      {
        question: "What's the core business outcome driving your transformation program — cost, growth, or experience?",
        intent: "Understand the transformation north star",
        tip: "This frames every subsequent conversation about platform and capabilities",
      },
      {
        question: "Where are you in the transformation journey — foundational, scaling, or optimizing?",
        intent: "Gauge maturity and budget phase",
        tip: "Early = more greenfield opportunity; scaling = integration & migration focus",
      },
    ],
    deep_dive: [
      {
        question: "What legacy systems are proving hardest to modernize, and what's the cost of delay?",
        intent: "Surface legacy pain and urgency",
        tip: "Connect Backbase's progressive modernization approach to their specific legacy challenges",
      },
      {
        question: "How do you manage change across business lines — is transformation centralized or federated?",
        intent: "Understand organizational structure for implementation planning",
        tip: "Backbase supports both models — important for sizing and sequencing",
      },
      {
        question: "What's your biggest people/process challenge in transformation — beyond technology?",
        intent: "Surface organizational blockers",
        tip: "Backbase's pre-built journeys reduce change management burden",
      },
    ],
    validation: [
      {
        question: "What does success look like in 12 months for your transformation program?",
        intent: "Define measurable outcomes to anchor the business case",
        tip: "Tie specific Backbase capabilities to their 12-month targets",
      },
    ],
  },

  head_efficiency: {
    opening: [
      {
        question: "What are your top operational KPIs — STP rates, cost-per-transaction, processing time?",
        intent: "Understand how they measure operational efficiency",
        tip: "Mirror their KPIs when presenting Backbase value — speak their language",
      },
      {
        question: "Where do you have the most manual intervention in customer-facing processes?",
        intent: "Identify high-volume automation candidates",
        tip: "Onboarding, loan processing, and service requests typically have highest manual overhead",
      },
    ],
    deep_dive: [
      {
        question: "What percentage of your processes run straight-through today vs. require manual touchpoints?",
        intent: "Quantify the automation gap",
        tip: "Industry best is 80%+ STP; most banks are 40-60%",
      },
      {
        question: "How are you measuring cost-to-serve per customer across channels?",
        intent: "Build the self-service and channel shift business case",
        tip: "Branch: $5-8 per interaction; digital: $0.10-0.50 — the math is compelling",
      },
      {
        question: "Where are your process bottlenecks creating customer experience issues?",
        intent: "Connect efficiency to customer satisfaction",
        tip: "This bridges ops efficiency to CX improvement — dual value story",
      },
    ],
    validation: [
      {
        question: "If you could eliminate one process bottleneck this quarter, which would unlock the most value?",
        intent: "Identify the quick-win entry point",
        tip: "This becomes your Phase 1 POC opportunity",
      },
    ],
  },
};

// ── Bank-Specific Question Generators ─────────────────────────────────

function generateBankContextQuestions(bankKey, roleKey) {
  const bank = BANK_DATA[bankKey];
  const comp = COMP_DATA[bankKey];
  const vs = VALUE_SELLING[bankKey];
  const qual = QUAL_DATA[bankKey];
  if (!bank) return [];

  const questions = [];
  const bankName = bank.bank_name;

  // ── Pain-point-derived questions ──
  if (bank.pain_points?.length > 0) {
    const relevantPains = bank.pain_points.filter(p => {
      if (roleKey === 'cto' || roleKey === 'head_digital') return true;
      if (roleKey === 'ceo') return true;
      if (roleKey === 'cfo' && (p.title?.toLowerCase().includes('cost') || p.detail?.toLowerCase().includes('cost'))) return true;
      if (roleKey === 'cro' && (p.title?.toLowerCase().includes('compliance') || p.title?.toLowerCase().includes('aml') || p.title?.toLowerCase().includes('kyc'))) return true;
      if (roleKey === 'head_retail' && (p.title?.toLowerCase().includes('customer') || p.title?.toLowerCase().includes('retail') || p.title?.toLowerCase().includes('digital'))) return true;
      if (roleKey === 'coo' && (p.title?.toLowerCase().includes('operations') || p.title?.toLowerCase().includes('legacy') || p.title?.toLowerCase().includes('process'))) return true;
      if (roleKey === 'chief_ai_officer' && (p.title?.toLowerCase().includes('ai') || p.title?.toLowerCase().includes('automat') || p.title?.toLowerCase().includes('intelligence') || p.title?.toLowerCase().includes('manual'))) return true;
      if (roleKey === 'head_digital_transformation' && (p.title?.toLowerCase().includes('digital') || p.title?.toLowerCase().includes('legacy') || p.title?.toLowerCase().includes('transform') || p.title?.toLowerCase().includes('modern'))) return true;
      if (roleKey === 'head_efficiency' && (p.title?.toLowerCase().includes('cost') || p.title?.toLowerCase().includes('efficien') || p.title?.toLowerCase().includes('process') || p.title?.toLowerCase().includes('manual') || p.title?.toLowerCase().includes('automat'))) return true;
      return false;
    });

    relevantPains.slice(0, 2).forEach(p => {
      questions.push({
        question: `We understand ${bankName} is dealing with "${p.title}" — how is this impacting your area specifically?`,
        intent: `Validate pain point: ${p.title}`,
        tip: p.detail,
        source: 'pain_point',
        tag: '🔴 Pain Point',
      });
    });
  }

  // ── Strategy-derived questions ──
  if (bank.digital_strategy) {
    const stratSnippet = bank.digital_strategy.substring(0, 100);
    if (roleKey === 'ceo' || roleKey === 'head_digital' || roleKey === 'cto' || roleKey === 'head_digital_transformation') {
      questions.push({
        question: `Your digital strategy mentions "${stratSnippet.split('.')[0]}..." — how is that translating into specific initiatives this year?`,
        intent: 'Validate strategic priorities and execution status',
        tip: 'Listen for gaps between strategy and execution',
        source: 'strategy',
        tag: '📋 Strategy',
      });
    }
  }

  // ── Signal-derived questions ──
  if (bank.signals?.length > 0) {
    const recentSignals = bank.signals.slice(0, 2);
    recentSignals.forEach(s => {
      questions.push({
        question: `We noticed ${s.signal.toLowerCase()} — what does this mean for your digital banking roadmap?`,
        intent: `Validate signal: ${s.signal}`,
        tip: s.implication,
        source: 'signal',
        tag: '📡 Signal',
      });
    });
  }

  // ── Competition-derived questions ──
  if (comp && (roleKey === 'ceo' || roleKey === 'cto' || roleKey === 'head_digital')) {
    if (comp.competitive_threats?.length > 0) {
      questions.push({
        question: `How concerned are you about competitive pressure from ${comp.competitive_threats.slice(0, 2).join(' and ')}?`,
        intent: 'Gauge competitive urgency',
        tip: `Current digital platform: ${comp.digital_platform || 'Unknown'}`,
        source: 'competition',
        tag: '⚔️ Competitive',
      });
    }
  }

  // ── Value-selling derived questions (existing discovery Q's from data) ──
  if (vs?.discovery_questions?.length > 0) {
    // Pick role-relevant existing questions
    const existing = vs.discovery_questions.filter(q => {
      const ql = q.toLowerCase();
      if (roleKey === 'ceo' && (ql.includes('strategy') || ql.includes('growth') || ql.includes('vision'))) return true;
      if (roleKey === 'cfo' && (ql.includes('cost') || ql.includes('invest') || ql.includes('revenue'))) return true;
      if (roleKey === 'cto' && (ql.includes('platform') || ql.includes('tech') || ql.includes('engineer') || ql.includes('stack'))) return true;
      if (roleKey === 'head_digital' && (ql.includes('digital') || ql.includes('customer') || ql.includes('mobile') || ql.includes('app'))) return true;
      if (roleKey === 'head_retail' && (ql.includes('retail') || ql.includes('customer') || ql.includes('personal'))) return true;
      if (roleKey === 'cro' && (ql.includes('compliance') || ql.includes('aml') || ql.includes('kyc') || ql.includes('risk'))) return true;
      return false;
    });

    existing.slice(0, 2).forEach(q => {
      questions.push({
        question: q,
        intent: 'Bank-specific discovery (from value selling research)',
        tip: 'This question was pre-researched based on public intelligence',
        source: 'value_selling',
        tag: '🎯 Pre-Researched',
      });
    });
  }

  // ── KDM-derived personalized questions ──
  if (bank.key_decision_makers?.length > 0) {
    const roleAliases = ROLES[roleKey]?.aliases || [];
    const matchingKDMs = bank.key_decision_makers.filter(kdm =>
      roleAliases.some(alias => kdm.role?.toLowerCase().includes(alias.toLowerCase()))
    );

    matchingKDMs.forEach(kdm => {
      if (kdm.note && (kdm.note.includes('Former') || kdm.note.includes('Since') || kdm.note.includes('Appointed'))) {
        const bgSnippet = kdm.note.split('.').slice(0, 2).join('.');
        questions.push({
          question: `${kdm.name}, given your background (${bgSnippet}) — how are you bringing that experience to ${bankName}'s digital transformation?`,
          intent: `Personal rapport with ${kdm.name} (${kdm.role})`,
          tip: `Full context: ${kdm.note}`,
          source: 'person',
          tag: `👤 ${kdm.name}`,
        });
      }
    });
  }

  // ── ROI-anchored questions ──
  if (roleKey === 'cfo' || roleKey === 'ceo' || roleKey === 'coo' || roleKey === 'head_efficiency') {
    try {
      const roi = calculateRoi(bankKey);
      if (roi?.base) {
        const totalBase = roi.base.total_annual;
        if (totalBase > 0) {
          questions.push({
            question: `Our preliminary analysis suggests a potential value opportunity in the range of ${formatRange(totalBase)} annually through digital engagement improvements. What's your view on that magnitude?`,
            intent: 'Anchor the value conversation with a data-backed range',
            tip: `Calculated base case: €${(totalBase / 1e6).toFixed(1)}M/yr. Use conservatively as a discussion starter, not a commitment.`,
            source: 'roi',
            tag: '💰 ROI-Anchored',
          });
        }
      }
    } catch (e) {
      // ROI calculation not available — skip
    }
  }

  // ── Multi-market questions (for banks operating across countries) ──
  if (bank.kpis) {
    const countryKpi = bank.kpis.find(k => k.label?.toLowerCase().includes('countries') || k.label?.toLowerCase().includes('markets'));
    if (countryKpi && parseInt(countryKpi.value) > 1) {
      if (roleKey === 'cto' || roleKey === 'coo' || roleKey === 'ceo' || roleKey === 'head_digital_transformation') {
        questions.push({
          question: `Operating across ${countryKpi.value} markets — are you running separate digital platforms per market, or do you have a unified approach?`,
          intent: 'Surface multi-market platform consolidation opportunity',
          tip: 'Multi-market banks often spend 2-3x on platform maintenance; consolidation is a major value lever',
          source: 'kpi',
          tag: '🌍 Multi-Market',
        });
      }
    }
  }

  return questions;
}

function formatRange(value) {
  const low = value * 0.7;
  const high = value * 1.3;
  const fmt = (v) => {
    if (v >= 1e9) return `€${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `€${(v / 1e6).toFixed(0)}M`;
    if (v >= 1e3) return `€${(v / 1e3).toFixed(0)}K`;
    return `€${v.toFixed(0)}`;
  };
  return `${fmt(low)}–${fmt(high)}`;
}

// ── Meeting Prep Tips per Role ────────────────────────────────────────

const MEETING_TIPS = {
  ceo: [
    "Speak in business outcomes, not technology features",
    "Reference 2-3 peer banks they respect (not compete with)",
    "Ask about strategic priorities BEFORE presenting solutions",
    "Keep it high-level — avoid architecture details",
    "Close with a clear next step (not a product demo)",
  ],
  cfo: [
    "Lead with numbers — cost-to-income, ROI, payback period",
    "Bring a preliminary ROI framework (not a final number)",
    "Ask about their investment evaluation process",
    "Be prepared to discuss TCO vs. build costs",
    "Acknowledge risk and present conservative scenarios first",
  ],
  cto: [
    "Be technically credible — know the Backbase architecture",
    "Respect their tech decisions; don't criticize current stack",
    "Offer a technical deep-dive or proof-of-concept",
    "Discuss integration patterns, not just features",
    "Address build-vs-buy honestly — Backbase as accelerator",
  ],
  head_digital: [
    "Show awareness of their app ratings and digital presence",
    "Reference competitor digital experiences they admire",
    "Focus on customer journey improvements, not backend tech",
    "Bring visual examples (prototypes, screenshots)",
    "Discuss time-to-market for new features",
  ],
  head_retail: [
    "Know their customer segments and market position",
    "Discuss acquisition, engagement, and retention metrics",
    "Reference branch-digital integration, not branch replacement",
    "Be prepared with cross-sell/upsell improvement examples",
    "Bring retail banking reference customer stories",
  ],
  head_business: [
    "Understand their SME customer segment and needs",
    "Discuss lending origination and treasury management",
    "Know their RM model and productivity metrics",
    "Reference SME banking success stories from similar banks",
    "Frame digital as revenue enabler for the business segment",
  ],
  head_wealth: [
    "Understand their AUM, advisor count, and client segments",
    "Discuss the hybrid advisory model (human + digital)",
    "Reference Julius Baer or similar wealth management deployments",
    "Focus on advisor productivity and client experience",
    "Address regulatory requirements (KYC, suitability, reporting)",
  ],
  coo: [
    "Talk processes and efficiency metrics, not features",
    "Bring STP rate benchmarks for their market",
    "Discuss operational cost reduction targets",
    "Frame Backbase as automation enabler",
    "Address change management and adoption concerns",
  ],
  cro: [
    "Lead with compliance and regulatory awareness",
    "Know the relevant regulations (AML6, PSD3, DORA, ESG)",
    "Discuss KYC/AML automation and digital identity",
    "Frame customer experience improvement as compliance-compatible",
    "Address data residency and security requirements upfront",
  ],
  chief_ai_officer: [
    "Lead with operational AI use cases, not chatbot demos",
    "Discuss Backbase APA as the AI orchestration layer",
    "Know their current AI maturity — don't oversell if they're early stage",
    "Frame AI as ops efficiency tool first, CX enhancer second",
    "Bring concrete metrics: % automation, cost-per-decision reduction",
  ],
  head_digital_transformation: [
    "Speak in business outcomes and transformation milestones, not features",
    "Understand their transformation timeline and budget cycle",
    "Reference progressive modernization — not big-bang replacement",
    "Address organizational change management challenges",
    "Frame Backbase as accelerating transformation, not adding another platform",
  ],
  head_efficiency: [
    "Lead with operational metrics: STP rates, cost-per-transaction, processing times",
    "Bring industry benchmarks for their specific processes",
    "Discuss before/after scenarios for specific processes",
    "Frame everything as FTE reallocation, not FTE reduction",
    "Position Backbase as unlocking straight-through processing at scale",
  ],
};

// ── Main API ──────────────────────────────────────────────────────────

/**
 * Get discovery questions for a specific bank and role
 * @param {string} bankKey - e.g., "DNB_Norway"
 * @param {string} roleKey - e.g., "cto"
 * @returns {{ role, phases[], bankContextQuestions[], tips[], matchedKDMs[] }}
 */
export function getDiscoveryQuestions(bankKey, roleKey) {
  const role = ROLES[roleKey];
  if (!role) return null;

  const templates = QUESTION_TEMPLATES[roleKey] || {};
  const bankContextQuestions = generateBankContextQuestions(bankKey, roleKey);
  const tips = MEETING_TIPS[roleKey] || [];

  // Find matching KDMs for this role at this bank
  const bank = BANK_DATA[bankKey];
  const matchedKDMs = [];
  if (bank?.key_decision_makers) {
    const aliases = role.aliases || [];
    bank.key_decision_makers.forEach(kdm => {
      if (aliases.some(alias => kdm.role?.toLowerCase().includes(alias.toLowerCase()))) {
        matchedKDMs.push(kdm);
      }
    });
  }

  // Build phases
  const phases = [
    {
      key: 'opening',
      label: 'Opening',
      icon: '👋',
      description: 'Build rapport and set the agenda (5-10 min)',
      questions: templates.opening || [],
    },
    {
      key: 'deep_dive',
      label: 'Deep Dive',
      icon: '🔍',
      description: 'Explore pain points and priorities (20-30 min)',
      questions: templates.deep_dive || [],
    },
    {
      key: 'bank_specific',
      label: `${bank?.bank_name || 'Bank'}-Specific`,
      icon: '🏦',
      description: 'Tailored questions from bank intelligence (10-15 min)',
      questions: bankContextQuestions,
    },
    {
      key: 'validation',
      label: 'Validation & Close',
      icon: '✅',
      description: 'Confirm priorities and agree on next steps (5-10 min)',
      questions: templates.validation || [],
    },
  ];

  return {
    role,
    phases,
    bankContextQuestions,
    tips,
    matchedKDMs,
    totalQuestions: phases.reduce((sum, p) => sum + p.questions.length, 0),
  };
}

/**
 * Detect which roles are relevant for a bank based on key_decision_makers
 * @param {string} bankKey
 * @returns {Array<{ roleKey, role, kdms[] }>}
 */
export function detectRelevantRoles(bankKey) {
  const bank = BANK_DATA[bankKey];
  if (!bank?.key_decision_makers) return Object.keys(ROLES).map(k => ({ roleKey: k, role: ROLES[k], kdms: [] }));

  const results = [];

  Object.entries(ROLES).forEach(([roleKey, role]) => {
    const matchingKDMs = bank.key_decision_makers.filter(kdm =>
      role.aliases.some(alias => kdm.role?.toLowerCase().includes(alias.toLowerCase()))
    );

    results.push({
      roleKey,
      role,
      kdms: matchingKDMs,
      hasMatch: matchingKDMs.length > 0,
      isTarget: matchingKDMs.some(k => k.note?.includes('🎯') || k.note?.includes('CRITICAL') || k.note?.includes('KEY') || k.note?.includes('TARGET')),
    });
  });

  // Sort: targets first, then matches, then no-match
  results.sort((a, b) => {
    if (a.isTarget && !b.isTarget) return -1;
    if (!a.isTarget && b.isTarget) return 1;
    if (a.hasMatch && !b.hasMatch) return -1;
    if (!a.hasMatch && b.hasMatch) return 1;
    return 0;
  });

  return results;
}
