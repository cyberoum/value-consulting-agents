/**
 * Battle Cards — Objection Handling Intelligence
 *
 * Architecture:
 * - GENERIC objections auto-apply based on bank/competitive context
 * - BANK_SPECIFIC overrides add unique objections per bank
 * - COMPETITIVE_COUNTERS provide vendor-specific responses
 * - Each card includes: objection, response, talking points, proof points
 *
 * Data-driven: The BattleCardsPanel evaluates `applies()` functions
 * against each bank's data to show only relevant objections.
 */

import { BANK_DATA } from './banks';
import { COMP_DATA } from './competition';
import { VALUE_SELLING } from './valueSelling';
import { calculateRoi, formatEur } from './roiEngine';

// ─── Objection Categories ────────────────────────────────────────────

export const CATEGORIES = {
  'build-vs-buy':  { label: 'Build vs. Buy',    icon: '🔨', color: '#3366FF', bg: '#EBF0FF' },
  'competitive':   { label: 'Competitive',       icon: '⚔️', color: '#E65100', bg: '#FFF3E0' },
  'cost':          { label: 'Cost & ROI',        icon: '💰', color: '#2E7D32', bg: '#E8F5E9' },
  'timing':        { label: 'Timing & Priority', icon: '⏰', color: '#7B1FA2', bg: '#F3E5F5' },
  'risk':          { label: 'Risk & Governance', icon: '🛡️', color: '#C62828', bg: '#FFEBEE' },
  'integration':   { label: 'Integration',       icon: '🔗', color: '#00838F', bg: '#E0F7FA' },
};

// ─── Severity Levels ─────────────────────────────────────────────────

export const SEVERITY = {
  critical: { label: 'Very Likely', color: '#C62828', bg: '#FFEBEE' },
  high:     { label: 'Likely',      color: '#E65100', bg: '#FFF3E0' },
  medium:   { label: 'Possible',    color: '#F57F17', bg: '#FFF8E1' },
  low:      { label: 'Unlikely',    color: '#2E7D32', bg: '#E8F5E9' },
};

// ─── Generic Objection Templates ─────────────────────────────────────

export const GENERIC_OBJECTIONS = [
  // ── 1. BUILD VS. BUY ──────────────────────────────────────────────
  {
    id: 'build-inhouse',
    category: 'build-vs-buy',
    objection: 'We have a strong engineering team and prefer to build in-house',
    severity: (bank, comp) => {
      const vendorRisk = (comp?.vendor_risk || '').toLowerCase();
      const platform = (comp?.digital_platform || '').toLowerCase();
      if (vendorRisk.includes('strong in-house') || platform.includes('in-house')) return 'critical';
      if (vendorRisk.includes('in-house')) return 'high';
      return 'medium';
    },
    applies: (bank, comp) => {
      const vr = (comp?.vendor_risk || '').toLowerCase();
      const dp = (comp?.digital_platform || '').toLowerCase();
      return vr.includes('in-house') || dp.includes('in-house') || dp.includes('proprietary');
    },
    response: {
      headline: 'Focus your engineers on differentiation — not commodity infrastructure',
      points: [
        'Backbase provides 80% of standard engagement banking OOTB — freeing your team for the 20% that creates competitive advantage',
        'In-house engagement platforms typically take 3-5 years to reach feature parity. Your competitors are already live.',
        'Build vs. buy is not binary: Backbase is extensible. Your engineers build ON TOP of it, not instead of it.',
        'Total cost of ownership for in-house builds is 3-5× platform cost when you factor in maintenance, upgrades, and talent churn',
      ],
      proofPoints: [
        'ABN AMRO (3,000+ engineers) chose Backbase — realized commodity UX was consuming differentiation capacity',
        '120+ banks globally use Backbase, including institutions with 1,000+ developers who still chose platform over build',
      ],
    },
    bankContext: (bank, comp) => {
      const engineers = (comp?.key_vendors || []).find(v => v.toLowerCase().includes('in-house'));
      if (engineers) {
        return `${bank.bank_name} context: ${engineers}. Challenge them: "What percentage of that engineering capacity is spent on commodity engagement features vs. genuine differentiation?"`;
      }
      return null;
    },
  },

  {
    id: 'already-building',
    category: 'build-vs-buy',
    objection: 'We already have a transformation program underway — we can\'t add another platform',
    severity: (bank) => {
      const strat = (bank.strategic_initiatives || bank.digital_strategy || '').toLowerCase();
      if (strat.includes('transformation') || strat.includes('modernization')) return 'high';
      return 'medium';
    },
    applies: (bank) => {
      const text = (bank.strategic_initiatives || '') + (bank.digital_strategy || '');
      return text.toLowerCase().includes('transformation') || text.toLowerCase().includes('modernization') || text.toLowerCase().includes('migration');
    },
    response: {
      headline: 'Backbase accelerates your transformation — it doesn\'t compete with it',
      points: [
        'Core modernization and customer engagement are different problems. You can modernize your core while deploying Backbase as the engagement layer on top.',
        'Backbase decouples the customer-facing experience from core systems — you can upgrade your core at your own pace without freezing customer innovation.',
        'Most of our 120+ bank customers deployed Backbase DURING an active core transformation. It\'s designed for exactly this.',
        'Your transformation delivers operational efficiency. Backbase delivers the customer experience that monetizes that efficiency.',
      ],
      proofPoints: [
        'Multiple Tier-1 banks have deployed Backbase in parallel with core banking migrations — the two programs are complementary, not competing',
        'Decoupled architecture means Backbase connects to both old and new core systems simultaneously during migration',
      ],
    },
    bankContext: (bank) => {
      const strat = bank.digital_strategy || '';
      if (strat) {
        return `${bank.bank_name}'s digital strategy mentions: "${strat.slice(0, 120)}..." — Position Backbase as the acceleration layer for this existing strategy, not a separate initiative.`;
      }
      return null;
    },
  },

  // ── 2. COMPETITIVE ──────────────────────────────────────────────────
  {
    id: 'existing-vendor',
    category: 'competitive',
    objection: 'We already have a vendor for this — why would we switch?',
    severity: (bank, comp) => {
      const competitors = comp?.backbase_competitors_at_bank || [];
      if (competitors.some(c => c.toLowerCase().includes('temenos') || c.toLowerCase().includes('thought machine'))) return 'high';
      if (competitors.length > 0) return 'medium';
      return 'low';
    },
    applies: (bank, comp) => {
      const competitors = comp?.backbase_competitors_at_bank || [];
      return competitors.length > 0 && !competitors.every(c => c.toLowerCase().includes('in-house') || c.toLowerCase().includes('none'));
    },
    response: {
      headline: 'It\'s not about switching — it\'s about layering the right capability',
      points: [
        'Backbase doesn\'t replace your core banking system. It sits on top as the customer engagement layer — working WITH your existing stack.',
        'Most banks use 5-15 systems for customer interactions. Backbase consolidates the engagement layer while your other systems handle what they\'re good at.',
        'The question isn\'t "replace what you have" — it\'s "are your customers getting the digital experience they expect, and is your current stack delivering that?"',
      ],
      proofPoints: [
        'Backbase integrates with all major core banking systems — Temenos, Finastra, Mambu, FIS, and in-house cores',
        'Banks running Backbase on top of legacy cores see 40-60% faster time-to-market for new digital features',
      ],
    },
    bankContext: (bank, comp) => {
      const competitors = comp?.backbase_competitors_at_bank || [];
      if (competitors.length > 0) {
        return `Known competitors at ${bank.bank_name}: ${competitors.join(', ')}. Prepare differentiation for each.`;
      }
      return null;
    },
  },

  // ── 3. COST & ROI ──────────────────────────────────────────────────
  {
    id: 'too-expensive',
    category: 'cost',
    objection: 'The investment is too large — we can\'t justify this spend right now',
    severity: () => 'high',
    applies: () => true, // Always applicable
    response: {
      headline: 'The cost of NOT doing this is higher than the cost of doing it',
      points: [
        'Every year without a modern engagement platform costs you in customer attrition, manual process overhead, and missed cross-sell revenue.',
        'Our ROI modeling shows the platform pays for itself within the first year through just 2-3 of the 5 value levers.',
        'Compare our platform cost to what you\'re spending on maintaining fragmented legacy front-end systems today.',
        'This isn\'t a cost center — it\'s a revenue acceleration investment with documented payback.',
      ],
      proofPoints: [
        'Backbase customers see average 15-25% reduction in cost-to-serve within 18 months of deployment',
        'Digital channel shift alone typically delivers 3-5× the platform licensing cost in annual savings',
      ],
    },
    bankContext: (bank, comp, bankKey) => {
      const roi = calculateRoi(bankKey);
      if (roi?.totals) {
        return `${bank.bank_name} ROI estimate: ${formatEur(roi.totals.conservative)}–${formatEur(roi.totals.optimistic)} annual value. Base case: ${formatEur(roi.totals.base)}/year. Use these numbers in the conversation.`;
      }
      return null;
    },
  },

  {
    id: 'show-roi-first',
    category: 'cost',
    objection: 'We need to see a clear business case before we can proceed',
    severity: () => 'medium',
    applies: () => true,
    response: {
      headline: 'Absolutely — and we\'ll build it with you using YOUR numbers',
      points: [
        'We have a structured ROI framework with 5 value levers. We\'ll populate it with your actual data, not generic benchmarks.',
        'The business case covers: cost-to-serve reduction, digital channel migration, onboarding conversion, cross-sell revenue, and platform consolidation savings.',
        'We can deliver a preliminary value estimate in one working session using your annual report metrics.',
        'Our methodology is conservative by design — we understate rather than overstate, so the numbers are defensible in front of your CFO.',
      ],
      proofPoints: [
        'Every Backbase engagement starts with a value assessment — this is how we operate, not an afterthought',
        'Our ROI models use published industry benchmarks from McKinsey, BCG, EBA, and Celent — fully sourced and auditable',
      ],
    },
    bankContext: () => null,
  },

  // ── 4. TIMING & PRIORITY ──────────────────────────────────────────
  {
    id: 'bad-timing',
    category: 'timing',
    objection: 'The timing isn\'t right — we have other priorities this year',
    severity: () => 'high',
    applies: () => true,
    response: {
      headline: 'Digital engagement IS the priority — it underlies every other initiative',
      points: [
        'Every strategic initiative your bank is running — growth, efficiency, compliance, customer retention — requires a modern customer engagement layer.',
        'The longer you wait, the wider the gap becomes with competitors who are already deploying engagement platforms.',
        'We don\'t require a "big bang." Start with one journey, one business line, one country — prove value, then expand.',
        'The question isn\'t whether this is a priority — it\'s whether you can afford to give your competitors another year of head start.',
      ],
      proofPoints: [
        'Banks that delayed digital engagement platform decisions by 2+ years saw 15-20% higher total cost when they eventually moved — due to accumulated technical debt',
        'Backbase offers modular deployment: start with onboarding in 3 months, add more journeys incrementally',
      ],
    },
    bankContext: (bank) => {
      const signals = bank.signals || [];
      if (signals.length > 0) {
        const urgent = signals[0];
        return `Counter-signal for ${bank.bank_name}: "${urgent.signal}" → ${urgent.implication}. Use their own urgency signals against the "bad timing" narrative.`;
      }
      return null;
    },
  },

  {
    id: 'post-scandal',
    category: 'timing',
    objection: 'We\'re focused on compliance and remediation — growth can wait',
    severity: (bank) => {
      const text = (bank.overview || '' + bank.tagline || '').toLowerCase();
      return (text.includes('aml') || text.includes('scandal') || text.includes('remediation')) ? 'critical' : 'low';
    },
    applies: (bank) => {
      const text = ((bank.overview || '') + (bank.tagline || '')).toLowerCase();
      return text.includes('aml') || text.includes('scandal') || text.includes('remediation') || text.includes('fine');
    },
    response: {
      headline: 'The remediation phase IS over — your competitors have moved on. You need to catch up.',
      points: [
        'You\'ve invested in compliance infrastructure. Now it\'s time to leverage that investment by winning back the customers you lost during the crisis.',
        'Every month in "remediation mode" is another month competitors are capturing your market share with better digital experiences.',
        'Modern engagement platforms actually IMPROVE compliance — automated KYC, audit trails, consistent processes reduce regulatory risk.',
        'Your customers stayed loyal through the crisis. Reward that loyalty with the digital experience they deserve — before they finally switch.',
      ],
      proofPoints: [
        'Banks that pivoted from remediation to growth mode within 18 months of settlement recovered market share 2× faster than those that waited',
      ],
    },
    bankContext: (bank) => {
      if ((bank.tagline || '').toLowerCase().includes('aml') || (bank.tagline || '').toLowerCase().includes('scandal')) {
        return `${bank.bank_name} is explicitly described as post-scandal. This is THE moment to pivot from defense to offense. Their competitors (named in competitive data) are capitalizing on their distraction.`;
      }
      return null;
    },
  },

  // ── 5. RISK & GOVERNANCE ────────────────────────────────────────────
  {
    id: 'governance-complex',
    category: 'risk',
    objection: 'Our decision-making process is too complex for this kind of platform purchase',
    severity: (bank, comp, qual) => {
      const score = qual?.decision_process?.score;
      if (score && score <= 4) return 'critical';
      if (score && score <= 6) return 'high';
      return 'medium';
    },
    applies: () => true,
    response: {
      headline: 'We\'ve navigated complex governance at banks larger than yours — it\'s what we do',
      points: [
        'Backbase has been through procurement at 120+ banks, including cooperative groups, federated structures, and multi-country institutions.',
        'We provide structured business case materials designed for your CFO, CTO, risk committee, and board.',
        'Our engagement model is phased: start with a bounded pilot that requires lower-level approval, prove value, then scale with executive sponsorship.',
        'Complex governance is a feature, not a bug — it means once you\'re in, you\'re in for the long term.',
      ],
      proofPoints: [
        'Backbase has deployed in cooperative banking groups with 100+ member institutions — governance is our specialty',
        'Our structured POC approach is designed to work within bank procurement frameworks',
      ],
    },
    bankContext: (bank, comp, qual) => {
      const dp = qual?.decision_process;
      if (dp?.note) {
        return `${bank.bank_name} governance: "${dp.note}". Tailor the approach to work within this specific decision structure.`;
      }
      return null;
    },
  },

  {
    id: 'vendor-lockin',
    category: 'risk',
    objection: 'We\'re worried about vendor lock-in',
    severity: () => 'medium',
    applies: () => true,
    response: {
      headline: 'Backbase is designed for openness — not lock-in',
      points: [
        'Open API architecture: everything Backbase does is accessible via REST APIs. Your data and integrations are yours.',
        'Technology-agnostic: runs on any cloud (Azure, AWS, GCP) or on-premises. No cloud vendor lock-in either.',
        'Standards-based: uses industry standard technologies (Java, Angular/React, Kubernetes) — your team can extend and maintain.',
        'Integration layer connects to any core banking system. If you change your core, Backbase adapts.',
        'Compare this to building in-house: you\'re locked into your OWN team\'s architecture, with key-person dependency risk.',
      ],
      proofPoints: [
        'Backbase runs on all major cloud providers and on-premises — the choice is yours',
        'Banks have migrated from one core to another while keeping Backbase as the stable engagement layer',
      ],
    },
    bankContext: () => null,
  },

  {
    id: 'implementation-risk',
    category: 'risk',
    objection: 'Large platform implementations always go over budget and timeline',
    severity: (bank) => {
      const employees = (bank.operational_profile?.total_employees || '');
      return employees.includes('10,000') || employees.includes('20,000') || employees.includes('28,000') ? 'high' : 'medium';
    },
    applies: () => true,
    response: {
      headline: 'We de-risk by starting small and proving value before scaling',
      points: [
        'Our implementation model is modular: deploy one journey (e.g., onboarding) in 8-12 weeks, prove value, then expand.',
        'We don\'t do "big bang" — we do incremental value delivery with measurable milestones.',
        'Backbase has a certified partner ecosystem of 50+ system integrators who deliver implementations globally.',
        'Pre-built journeys and OOTB capabilities mean 60-70% of the solution is configuration, not custom development.',
      ],
      proofPoints: [
        'Average first-journey deployment: 3-6 months. Not years.',
        'Backbase\'s implementation methodology has been refined across 120+ bank deployments',
      ],
    },
    bankContext: () => null,
  },

  // ── 6. INTEGRATION ──────────────────────────────────────────────────
  {
    id: 'core-integration',
    category: 'integration',
    objection: 'How will this integrate with our core banking system?',
    severity: () => 'medium',
    applies: () => true,
    response: {
      headline: 'Backbase integrates with every major core — and your in-house systems too',
      points: [
        'Pre-built connectors for Temenos, Finastra, FIS, Mambu, SAP, and 20+ other core banking systems.',
        'For in-house cores: our integration layer uses REST APIs and event-driven architecture. If your core exposes an API, we connect.',
        'Backbase decouples front-end from back-end: your core handles transactions and ledger, Backbase handles customer experience. Clean separation.',
        'We support hybrid: connect to multiple cores simultaneously during migration. No need to complete core migration first.',
      ],
      proofPoints: [
        'Backbase currently runs in production integrated with 30+ different core banking systems globally',
        'Integration typically takes 4-8 weeks for standard cores, 8-12 weeks for custom in-house systems',
      ],
    },
    bankContext: (bank, comp) => {
      const core = comp?.core_banking;
      if (core) {
        return `${bank.bank_name}'s core: "${core}". Prepare specific integration approach for this system.`;
      }
      return null;
    },
  },

  {
    id: 'cooperative-complexity',
    category: 'integration',
    objection: 'We have multiple member banks / entities — one platform can\'t serve all of them',
    severity: (bank) => {
      const text = ((bank.tagline || '') + (bank.overview || '')).toLowerCase();
      return (text.includes('cooperative') || text.includes('member bank') || text.includes('alliance') || text.includes('federated')) ? 'critical' : 'low';
    },
    applies: (bank) => {
      const text = ((bank.tagline || '') + (bank.overview || '')).toLowerCase();
      return text.includes('cooperative') || text.includes('member bank') || text.includes('alliance') || text.includes('federated') || text.includes('regional companies');
    },
    response: {
      headline: 'Multi-entity deployment is literally our sweet spot',
      points: [
        'Backbase\'s multi-entity architecture was PURPOSE-BUILT for cooperative and federated banking groups.',
        'Each member bank gets its own branded experience, while sharing the same platform, features, and integrations.',
        'Central IT manages the shared platform; member banks configure their own products, branding, and journeys.',
        'This is not theoretical — we deploy this for cooperative groups with 100+ member institutions.',
      ],
      proofPoints: [
        'Backbase powers cooperative banking groups globally — same architecture, proven at scale',
        'Multi-entity reduces per-bank cost by 60-80% compared to individual deployments',
      ],
    },
    bankContext: (bank) => {
      const text = (bank.tagline || '') + ' ' + (bank.overview || '');
      if (text.includes('120+')) return `OP Financial Group's 120+ cooperative banks are the PERFECT use case. Position Backbase as the ONLY platform architected for this exact challenge.`;
      if (text.includes('23 regional')) return `Länsförsäkringar's 23 regional companies mirror exactly how Backbase multi-entity works. Each company gets branded UX, shared platform underneath.`;
      if (text.includes('SpareBank') || text.includes('Alliance')) return `The SpareBank 1 Alliance's 14 member banks sharing technology is the ideal multi-entity deployment. Winning one influential member could cascade across the Alliance.`;
      if (text.includes('Savings Bank') || text.includes('Säästöpankki')) return `The Savings Bank Group's 16 member banks need exactly what Backbase multi-entity provides — shared platform, individual bank branding.`;
      return null;
    },
  },

  {
    id: 'subsidiary-noauth',
    category: 'risk',
    objection: 'Platform decisions are made at group level — we don\'t have authority here',
    severity: (bank) => {
      const qual = bank.backbase_qualification;
      if (qual?.label?.includes('via') || qual?.label?.includes('Subsidiary') || qual?.timing?.includes('FOLLOWS GROUP')) return 'critical';
      return 'low';
    },
    applies: (bank) => {
      const qual = bank.backbase_qualification;
      return qual?.label?.includes('via') || qual?.label?.includes('Subsidiary') || qual?.timing?.includes('FOLLOWS GROUP');
    },
    response: {
      headline: 'Understood — let\'s engage the right level together',
      points: [
        'We appreciate the transparency. Can you help us understand who at group level owns platform decisions?',
        'Your local perspective is valuable — what are the specific pain points in this market that the group needs to hear?',
        'Would you be open to a joint conversation with your group technology leadership? We can bring relevant case studies.',
        'Often, local market needs are the CATALYST for group-level platform decisions. Your input matters.',
      ],
      proofPoints: [
        'Many Backbase deals started with a local country champion who escalated the need to group level',
      ],
    },
    bankContext: (bank) => {
      const qual = bank.backbase_qualification;
      if (qual?.opinion) {
        return `Note: ${qual.opinion.slice(0, 200)}...`;
      }
      return null;
    },
  },
];

// ─── Bank-Specific Objections (unique to certain banks) ──────────────

export const BANK_SPECIFIC_OBJECTIONS = {
  'Nordea_Sweden': [
    {
      id: 'nordea-one-platform',
      category: 'build-vs-buy',
      objection: '"We have the One Platform program and €1.5B annual tech spend — we don\'t need another vendor"',
      severity: 'critical',
      response: {
        headline: 'One Platform is modernizing your core. Who\'s modernizing your customer experience?',
        points: [
          'One Platform is focused on core infrastructure modernization — the plumbing. Backbase provides the customer-facing engagement layer — the experience customers actually see.',
          'You spend €1.5B/year on tech. What percentage delivers visible customer value vs. keeping the lights on? Backbase shifts that ratio.',
          'Kirsten Renner (Head of Group Tech) led the engagement banking transformation at ABN AMRO — she understands the difference between core modernization and engagement acceleration.',
          'Your stated goal is a unified digital experience across 4 Nordic countries. That\'s EXACTLY what Backbase was built for — and no amount of in-house core modernization solves the multi-country engagement challenge automatically.',
        ],
        proofPoints: [
          'ABN AMRO — where Kirsten Renner previously served — is a Backbase customer. She has first-hand experience with the platform.',
          'Backbase decouples engagement from core, meaning One Platform can proceed independently while customers get a better experience NOW.',
        ],
      },
    },
    {
      id: 'nordea-four-countries',
      category: 'integration',
      objection: '"Deploying across 4 countries with different regulations is too complex"',
      severity: 'high',
      response: {
        headline: 'Multi-country deployment is literally our core architecture advantage',
        points: [
          'Backbase\'s multi-entity architecture handles country-specific regulation, language, and product configuration from a single platform.',
          'Each country gets its own branded experience with local compliance rules, while sharing the engagement platform.',
          'You\'re already spending €1.5B/year trying to solve this exact problem with in-house builds across 4 markets.',
          'Start with ONE country (Finland — HQ country, decision makers are here), prove value, then roll to the other three.',
        ],
        proofPoints: [
          'Backbase powers multi-country banking deployments across Europe, APAC, and Americas',
        ],
      },
    },
  ],

  'Danske Bank_Denmark': [
    {
      id: 'danske-post-aml',
      category: 'timing',
      objection: '"We\'re still recovering from the AML scandal — now is not the time for big investments"',
      severity: 'critical',
      response: {
        headline: 'The recovery phase is OVER. Nykredit and Jyske aren\'t waiting for you.',
        points: [
          'The $2B AML fine is paid. CEO Egeriis has explicitly pivoted from remediation to growth. The question is: what\'s your growth weapon?',
          'While you were in remediation, Nykredit captured retail market share and Jyske Bank acquired Handelsbanken Denmark. Your competitive position has weakened.',
          'A modern digital engagement platform is how you win back the customers who left. It\'s not a discretionary investment — it\'s the growth engine.',
          'Your 3.3M customers stayed loyal through the crisis. Reward them with a world-class digital experience before they finally switch.',
        ],
        proofPoints: [
          'Banks that pivot from remediation to growth within 18 months of settlement recover market share 2× faster',
        ],
      },
    },
  ],

  'Handelsbanken_Sweden': [
    {
      id: 'shb-branch-model',
      category: 'build-vs-buy',
      objection: '"Our branch-based relationship model IS our differentiation — we don\'t need digital engagement"',
      severity: 'critical',
      response: {
        headline: 'Digital engagement enhances your relationships — it doesn\'t replace them',
        points: [
          'Your branch model is your strength. But branch foot traffic is declining 10-15% year-over-year. Even your most loyal customers expect a digital complement.',
          'Backbase\'s Employee Assist gives your branch staff superpowers — a 360° customer view, next-best-action, and digital tools for in-person conversations.',
          'The best relationship banks in the world combine physical presence with digital excellence. You\'re only doing half of that equation.',
          'Younger customers — your future — won\'t walk into a branch. You need to bring the Handelsbanken relationship quality to digital channels.',
        ],
        proofPoints: [
          'Backbase Employee Assist is specifically designed for relationship-centric banks — not to replace the RM, but to amplify them',
          'Banks with strong branch models that added digital engagement saw 20% increase in relationship depth, not a decrease',
        ],
      },
    },
  ],

  'OP Financial Group_Finland': [
    {
      id: 'op-cooperative-consensus',
      category: 'risk',
      objection: '"We need consensus from 120+ cooperative member banks — this will take forever"',
      severity: 'critical',
      response: {
        headline: 'The central institution makes shared platform decisions — and those 120 banks are the REASON you need Backbase',
        points: [
          'Technology platform decisions are made by the central institution, not by individual member banks. This is a single procurement decision with 120 beneficiaries.',
          'Backbase multi-entity architecture serves each member bank individually while sharing the platform centrally. This is EXACTLY your operating model.',
          'The cooperative structure means one deployment serves 4.4M customers across 120+ banks — unbeatable unit economics.',
          'Position this as: "We\'re not asking 120 banks to agree. We\'re providing the central institution with a platform that serves all 120 banks better."',
        ],
        proofPoints: [
          'Backbase has deployed in cooperative banking groups with 100+ member institutions globally',
          'Multi-entity reduces per-bank cost by 60-80% vs. individual deployments',
        ],
      },
    },
  ],

  'TF Bank_Sweden': [
    {
      id: 'tf-avarda-rebrand',
      category: 'timing',
      objection: '"We\'re in the middle of rebranding to Avarda Bank — it\'s too early for a platform decision"',
      severity: 'high',
      response: {
        headline: 'A rebrand IS the platform decision — this is the best time, not the worst',
        points: [
          'Avarda Bank needs a digital front door. You\'re building a new brand — the customer experience IS the brand. This is the moment to get it right.',
          'You\'re shifting from broker-dependent to direct customer relationships across 14 markets. That direct relationship needs an engagement platform from day one.',
          'Stefan Görling owns both product AND technology. One decision maker, one decision. No governance delays.',
          'With 480 employees across 14 countries, you can\'t afford to build this in-house. Backbase gives Avarda Bank a Tier-1 digital experience immediately.',
        ],
        proofPoints: [
          'Rebranding banks that deploy modern engagement platforms see 30-50% faster brand adoption through digital channels',
        ],
      },
    },
  ],
};

// ─── Competitive Counter Cards ───────────────────────────────────────
// When a specific competitor is mentioned, provide targeted differentiation

export const COMPETITIVE_COUNTERS = {
  'temenos': {
    competitor: 'Temenos (Infinity / Transact)',
    whenMentioned: '"We use Temenos" or "We evaluated Temenos Infinity"',
    positioning: 'Complementary — Temenos for core, Backbase for engagement',
    keyPoints: [
      'Temenos excels at core banking (Transact). Backbase excels at customer engagement. They\'re different layers.',
      'Temenos Infinity exists but is not Temenos\'s strength — it\'s a bolt-on, not purpose-built for engagement.',
      'Backbase integrates WITH Temenos Transact. Several banks run both — core on Temenos, engagement on Backbase.',
      'Ask: "Is Temenos Infinity delivering the digital customer experience you envisioned? Or is it just another system to maintain?"',
    ],
    differentiators: [
      'Purpose-built for engagement banking vs. core banking add-on',
      'Multi-entity architecture that Temenos Infinity lacks',
      'Faster time-to-market for customer-facing journeys',
      'Stronger mobile and omnichannel capabilities',
    ],
  },
  'tietoevry': {
    competitor: 'TietoEVRY',
    whenMentioned: '"We use TietoEVRY" or "TietoEVRY is our primary partner"',
    positioning: 'Replace the legacy engagement layer; keep the core',
    keyPoints: [
      'TietoEVRY is a Nordic IT infrastructure provider — strong in core processing and operations, not in modern engagement.',
      'TietoEVRY\'s digital banking capabilities are legacy-era. Modern engagement banking requires a different architecture.',
      'Backbase can sit on top of TietoEVRY core processing — no need to rip and replace the core.',
      'Several Nordic banks are modernizing their engagement layer away from TietoEVRY while keeping TietoEVRY for core — Backbase enables this.',
    ],
    differentiators: [
      'Modern UX and mobile-first design vs. legacy Nordic IT stack',
      'Global best practices from 120+ banks vs. Nordic-only perspective',
      'Cloud-native architecture vs. on-premises legacy',
      'Continuous product innovation with quarterly releases',
    ],
  },
  'inhouse': {
    competitor: 'In-House Build',
    whenMentioned: '"We prefer to build ourselves" or "Our engineering team can handle this"',
    positioning: 'Platform + your engineers > pure in-house build',
    keyPoints: [
      'Your engineers are your differentiation — don\'t waste them on commodity engagement banking UX.',
      'Backbase provides 80% OOTB. Your team builds the 20% that makes you unique.',
      'In-house build: 3-5 years to feature parity, 100+ engineers dedicated, ongoing maintenance. Backbase: 6-12 months, your team focuses on differentiation.',
      'Key person risk: in-house means you\'re dependent on specific architects. Backbase eliminates that risk.',
      'Total cost: in-house engagement platform costs 3-5× more than Backbase over 5 years when you include maintenance, upgrades, and talent costs.',
    ],
    differentiators: [
      'Battle-tested across 120+ banks vs. single-bank architecture',
      'Continuous product updates from 1,500+ Backbase engineers',
      '10+ years of engagement banking domain expertise embedded in the platform',
      'Pre-built regulatory compliance (KYC, AML, accessibility) — not built from scratch each time',
    ],
  },
};

// ─── Generate Battle Cards for a Bank ────────────────────────────────

/**
 * Returns the full set of relevant battle cards for a bank,
 * combining generic (filtered by applicability) + bank-specific
 */
export function getBattleCards(bankKey) {
  const bank = BANK_DATA[bankKey];
  const comp = COMP_DATA[bankKey];
  const vs = VALUE_SELLING[bankKey];

  if (!bank) return null;

  // Import qual data dynamically
  const qual = {};
  try {
    // Use bank's embedded qualification data
    const q = bank.backbase_qualification;
    if (q) Object.assign(qual, q);
  } catch (e) { /* ignore */ }

  const cards = [];

  // 1. Generic objections — evaluate applicability
  GENERIC_OBJECTIONS.forEach(obj => {
    const isApplicable = typeof obj.applies === 'function' ? obj.applies(bank, comp, qual) : true;
    if (!isApplicable) return;

    const severity = typeof obj.severity === 'function' ? obj.severity(bank, comp, qual) : obj.severity;
    const context = typeof obj.bankContext === 'function' ? obj.bankContext(bank, comp, bankKey) : null;

    cards.push({
      ...obj,
      severity,
      bankContext: context,
      source: 'generic',
    });
  });

  // 2. Bank-specific objections
  const bankSpecific = BANK_SPECIFIC_OBJECTIONS[bankKey] || [];
  bankSpecific.forEach(obj => {
    cards.push({
      ...obj,
      bankContext: null,
      source: 'bank-specific',
    });
  });

  // 3. Competitive counters — based on known vendors
  const relevantCounters = [];
  const compAtBank = comp?.backbase_competitors_at_bank || [];
  const vendors = comp?.key_vendors || [];
  const allVendorText = [...compAtBank, ...vendors].join(' ').toLowerCase();

  Object.entries(COMPETITIVE_COUNTERS).forEach(([key, counter]) => {
    if (allVendorText.includes(key) || (key === 'inhouse' && allVendorText.includes('in-house'))) {
      relevantCounters.push({ ...counter, id: `counter-${key}` });
    }
  });

  // Sort: bank-specific first, then by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  cards.sort((a, b) => {
    if (a.source === 'bank-specific' && b.source !== 'bank-specific') return -1;
    if (a.source !== 'bank-specific' && b.source === 'bank-specific') return 1;
    return (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
  });

  return {
    bankKey,
    bankName: bank.bank_name,
    cards,
    competitiveCounters: relevantCounters,
    totalCards: cards.length,
    criticalCount: cards.filter(c => c.severity === 'critical').length,
    categories: [...new Set(cards.map(c => c.category))],
  };
}
