/**
 * Meeting Prep Agent — Topic-Driven Intelligence Brief
 * ─────────────────────────────────────────────────────
 * Generates a comprehensive AI meeting prep brief by orchestrating:
 *   1. Person research (reuses existing researchPerson)
 *   2. Topic → bank data matching (zones, pain points, signals)
 *   3. Domain knowledge loading (Backbase verticals + cross-cutting)
 *   4. Google News search per topic + bank
 *   5. Dark zone detection (bank blind spots Backbase can solve)
 *   6. Claude synthesis into structured brief
 *
 * Uses: Google News RSS (free) + Claude API for synthesis.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { researchPerson } from './personResearch.mjs';
import { callClaude, isApiKeyConfigured } from './claudeClient.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = resolve(__dirname, '../../knowledge');

// ── Provenance formatting for prompt injection ──

const SOURCE_TYPE_LABELS = {
  pipeline_yahoo_finance: 'Yahoo Finance',
  pipeline_app_store: 'App Store',
  pipeline_google_play: 'Google Play',
  annual_report: 'Annual Report',
  press_release: 'Press Release',
  ir_feed: 'Investor Relations',
  regulatory: 'Regulatory Filing',
  news: 'News',
  google_news: 'Google News',
  job_signal: 'Job Posting',
  industry_feed: 'Industry Feed',
  ai_classified: 'AI Classification',
  ai_inferred: 'AI Inferred',
  manual: 'Manual Entry',
};

function formatSourceType(raw) {
  if (SOURCE_TYPE_LABELS[raw]) return SOURCE_TYPE_LABELS[raw];
  // Fallback: underscores to spaces, title case
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function truncateValue(str, max = 40) {
  if (!str) return '';
  const s = String(str);
  return s.length > max ? s.slice(0, max) + '…' : s;
}

/**
 * Format provenance records into a human-readable context block for the AI prompt.
 * Only includes bank profile provenance (not signal provenance).
 * Sorted: verified first, then inferred, then estimated.
 */
export function formatProvenanceForPrompt(provenanceRows) {
  if (!provenanceRows || provenanceRows.length === 0) return '';

  const TIER_LABELS = { 1: 'verified', 2: 'inferred', 3: 'estimated' };

  const bankRows = provenanceRows.filter(r => r.entity_type === 'bank');
  if (bankRows.length === 0) return '';

  bankRows.sort((a, b) => a.confidence_tier - b.confidence_tier || a.field_path.localeCompare(b.field_path));

  const lines = bankRows.map(r => {
    const label = TIER_LABELS[r.confidence_tier] || 'unknown';
    const fieldName = r.field_path.split('.').pop();
    const staleFlag = r.is_stale ? ' ⚠️ STALE' : '';
    let sourceDesc = formatSourceType(r.source_type);
    if (r.source_date) sourceDesc += `, ${r.source_date.slice(0, 7)}`;
    return `- ${fieldName} ("${truncateValue(r.value)}"): Tier ${r.confidence_tier} — ${sourceDesc} [${label}]${staleFlag}`;
  });

  return [
    'FACT PROVENANCE FOR THIS BRIEF:',
    ...lines,
    '',
    'Tier 1 = [verified] primary source, ≤6 months. Tier 2 = [inferred] secondary source. Tier 3 = [estimated] AI-derived or aged.',
    'When citing facts in the brief, append the tier label. Flag any [estimated] or STALE facts with appropriate caveats.',
  ].join('\n');
}

// ── Google News RSS Search ──

async function searchGoogleNews(query, maxResults = 5) {
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=en&gl=US&ceid=US:en`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return [];

    const xml = await res.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) && items.length < maxResults) {
      const itemXml = match[1];
      const title = (itemXml.match(/<title>(.*?)<\/title>/) || [])[1] || '';
      const pubDate = (itemXml.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
      const source = (itemXml.match(/<source.*?>(.*?)<\/source>/) || [])[1] || '';

      const cleanTitle = title
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      if (cleanTitle) {
        items.push({
          title: cleanTitle,
          source: source.replace(/<!\[CDATA\[|\]\]>/g, ''),
          date: pubDate,
        });
      }
    }

    return items;
  } catch (err) {
    console.error(`   Warning: Google News search failed: ${err.message}`);
    return [];
  }
}


// ═══════════════════════════════════════════════
// TOPIC → DOMAIN KNOWLEDGE MAPPING
// ═══════════════════════════════════════════════

/**
 * Maps topic keywords to Backbase vertical domains.
 * Each domain has a directory under knowledge/domains/{key}/
 * with pain_points.md, use_cases.md, value_propositions.md, etc.
 */
const TOPIC_DOMAIN_MAP = {
  // Vertical domains
  retail:     { dir: 'retail',     label: 'Retail Banking', keywords: ['retail', 'consumer', 'personal banking', 'b2c'] },
  sme:        { dir: 'sme',       label: 'SME Banking', keywords: ['sme', 'small business', 'business banking', 'msme', 'small and medium'] },
  commercial: { dir: 'commercial', label: 'Commercial Banking', keywords: ['commercial', 'corporate banking', 'treasury', 'trade finance'] },
  corporate:  { dir: 'corporate',  label: 'Corporate Banking', keywords: ['corporate', 'large enterprise', 'global transaction'] },
  wealth:     { dir: 'wealth',     label: 'Wealth Management', keywords: ['wealth', 'private banking', 'advisory', 'portfolio', 'aum', 'hnw'] },
  investing:  { dir: 'investing',  label: 'Investment Services', keywords: ['investing', 'investment', 'brokerage', 'securities', 'trading'] },
};

/**
 * Cross-cutting topics that span multiple verticals.
 * These pull from the platform lexicon rather than a specific domain.
 */
const CROSS_CUTTING_TOPICS = {
  ai:          { label: 'AI & Intelligence', keywords: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'genai', 'generative ai', 'chatbot', 'copilot'], lexiconSections: ['AI', 'Intelligence', 'Engage'] },
  onboarding:  { label: 'Onboarding & Origination', keywords: ['onboarding', 'origination', 'account opening', 'kyc', 'kyb', 'digital onboarding'], lexiconSections: ['Onboarding', 'Origination', 'Flow', 'Acquire'] },
  mobile:      { label: 'Mobile & Digital Channels', keywords: ['mobile', 'app', 'digital channels', 'omnichannel', 'mobile first'], lexiconSections: ['Mobile', 'Digital Banking', 'Omnichannel'] },
  payments:    { label: 'Payments & Transactions', keywords: ['payments', 'transactions', 'transfers', 'sepa', 'instant payments', 'rtp', 'p2p'], lexiconSections: ['Payment', 'Transaction', 'Cash'] },
  lending:     { label: 'Lending & Credit', keywords: ['lending', 'credit', 'loans', 'mortgage', 'credit line', 'loan origination'], lexiconSections: ['Lending', 'Credit', 'Loan', 'Origination'] },
  engagement:  { label: 'Customer Engagement', keywords: ['engagement', 'personalization', 'customer experience', 'cx', 'retention', 'loyalty', 'nba', 'next best action'], lexiconSections: ['Engage', 'Campaign', 'Notification', 'Personalization'] },
  selfservice: { label: 'Self-Service & Cost Reduction', keywords: ['self-service', 'self service', 'cost to serve', 'cost reduction', 'automation', 'straight through'], lexiconSections: ['Self-service', 'Automation', 'Assist'] },
  compliance:  { label: 'Compliance & Risk', keywords: ['compliance', 'regulatory', 'risk', 'aml', 'fraud', 'gdpr', 'psd2'], lexiconSections: ['Compliance', 'Risk', 'AML', 'Fraud'] },
};

// ── Per-process domain knowledge cache ──
const _domainCache = new Map();

/**
 * Loads domain knowledge files for a given domain key.
 * Returns concatenated content from pain_points, use_cases, value_propositions.
 * Cached per-process for performance.
 */
function loadDomainKnowledge(domainKey) {
  if (_domainCache.has(domainKey)) return _domainCache.get(domainKey);

  const domainConfig = TOPIC_DOMAIN_MAP[domainKey];
  if (!domainConfig) return null;

  const domainDir = resolve(KNOWLEDGE_DIR, 'domains', domainConfig.dir);
  const files = ['pain_points.md', 'use_cases.md', 'value_propositions.md', 'benchmarks.md', 'personas.md', 'journey_maps.md', 'roi_levers.md'];
  const sections = [];

  for (const file of files) {
    const filePath = resolve(domainDir, file);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        // Only include if it has meaningful content (not just headers)
        if (content.length > 200) {
          sections.push(`### ${file.replace('.md', '').replace(/_/g, ' ').toUpperCase()}\n${content}`);
        }
      } catch (err) {
        console.error(`   Warning: Failed to load ${filePath}: ${err.message}`);
      }
    }
  }

  // Also load the product directory summary for this domain
  const prodDirFile = resolve(KNOWLEDGE_DIR, 'domains', `product_directory_${domainConfig.dir}.md`);
  if (existsSync(prodDirFile)) {
    try {
      const content = readFileSync(prodDirFile, 'utf-8');
      if (content.length > 100) {
        sections.push(`### PRODUCT DIRECTORY\n${content}`);
      }
    } catch (err) {
      // non-critical
    }
  }

  const result = sections.length > 0
    ? `## ${domainConfig.label} Domain Knowledge\n\n${sections.join('\n\n---\n\n')}`
    : null;

  _domainCache.set(domainKey, result);
  return result;
}

/**
 * Loads relevant sections from the platform lexicon for cross-cutting topics.
 * Extracts sections that match the topic's lexiconSections keywords.
 */
let _lexiconCache = null;

function loadLexiconSections(sectionKeywords) {
  if (!_lexiconCache) {
    const lexiconPath = resolve(KNOWLEDGE_DIR, 'backbase_platform_lexicon.md');
    if (existsSync(lexiconPath)) {
      _lexiconCache = readFileSync(lexiconPath, 'utf-8');
    } else {
      _lexiconCache = '';
    }
  }

  if (!_lexiconCache) return null;

  // Extract relevant sections by keyword matching in headers
  const lines = _lexiconCache.split('\n');
  const relevantSections = [];
  let capturing = false;
  let currentSection = [];

  for (const line of lines) {
    if (line.startsWith('##')) {
      // Save previous section if it was relevant
      if (capturing && currentSection.length > 0) {
        relevantSections.push(currentSection.join('\n'));
      }

      // Check if new header matches any keyword
      const headerLower = line.toLowerCase();
      capturing = sectionKeywords.some(kw => headerLower.includes(kw.toLowerCase()));
      currentSection = capturing ? [line] : [];
    } else if (capturing) {
      currentSection.push(line);
    }
  }

  // Don't forget last section
  if (capturing && currentSection.length > 0) {
    relevantSections.push(currentSection.join('\n'));
  }

  return relevantSections.length > 0
    ? relevantSections.join('\n\n---\n\n').substring(0, 4000) // Limit size
    : null;
}


// ═══════════════════════════════════════════════
// TOPIC → BANK DATA MATCHING
// ═══════════════════════════════════════════════

/**
 * Classifies a free-form topic string into domain keys and cross-cutting keys.
 * Returns { domains: string[], crossCutting: string[] }
 */
function classifyTopic(topicStr) {
  const lower = topicStr.toLowerCase().trim();
  const domains = [];
  const crossCutting = [];

  for (const [key, config] of Object.entries(TOPIC_DOMAIN_MAP)) {
    if (config.keywords.some(kw => lower.includes(kw) || kw.includes(lower))) {
      domains.push(key);
    }
  }

  for (const [key, config] of Object.entries(CROSS_CUTTING_TOPICS)) {
    if (config.keywords.some(kw => lower.includes(kw) || kw.includes(lower))) {
      crossCutting.push(key);
    }
  }

  return { domains, crossCutting };
}

/**
 * Fuzzy-matches a topic string against a bank's data fields.
 * Returns matching zones, pain points, signals, and landing zones.
 */
function matchTopicToBankData(topicStr, bankData) {
  const lower = topicStr.toLowerCase();
  const results = {
    engagementZones: [],
    painPoints: [],
    signals: [],
    landingZones: [],
  };

  // Also check classified keywords for broader matching
  const { domains, crossCutting } = classifyTopic(topicStr);
  const allKeywords = [lower];

  // Add keywords from classified topics
  for (const dk of domains) {
    allKeywords.push(...TOPIC_DOMAIN_MAP[dk].keywords);
  }
  for (const ck of crossCutting) {
    allKeywords.push(...CROSS_CUTTING_TOPICS[ck].keywords);
  }

  // Deduplicate
  const uniqueKeywords = [...new Set(allKeywords)];

  function textMatches(text) {
    if (!text) return false;
    const textLower = text.toLowerCase();
    return uniqueKeywords.some(kw => textLower.includes(kw));
  }

  // Match engagement banking zones
  const engZones = bankData.backbase_qualification?.engagement_banking_zones || [];
  for (const z of engZones) {
    if (textMatches(z.zone) || textMatches(z.detail)) {
      results.engagementZones.push(z);
    }
  }

  // Match pain points
  const pains = bankData.pain_points || [];
  for (const p of pains) {
    if (textMatches(p.title) || textMatches(p.detail)) {
      results.painPoints.push(p);
    }
  }

  // Match signals
  const signals = bankData.signals || [];
  for (const s of signals) {
    if (textMatches(s.signal) || textMatches(s.implication)) {
      results.signals.push(s);
    }
  }

  // Match landing zones
  const landingZones = bankData.backbase_landing_zones || [];
  for (const lz of landingZones) {
    if (textMatches(lz.zone) || textMatches(lz.rationale)) {
      results.landingZones.push(lz);
    }
  }

  return results;
}


// ═══════════════════════════════════════════════
// DARK ZONE DETECTION
// ═══════════════════════════════════════════════

/**
 * Identifies "dark zones" — areas where:
 *   - Backbase has a landing zone (opportunity)
 *   - But the bank has NO matching engagement zone (blind spot)
 *   - Filtered by topic relevance when topics are provided
 *
 * These are high-value conversation starters: "Have you considered...?"
 */
function detectDarkZones(bankData, topics = []) {
  const engZones = bankData.backbase_qualification?.engagement_banking_zones || [];
  const landingZones = bankData.backbase_landing_zones || [];

  if (!landingZones.length) return [];

  // Build a "covered" set from engagement zone names
  const coveredKeywords = engZones.map(z => z.zone.toLowerCase());

  const darkZones = [];

  for (const lz of landingZones) {
    const lzLower = lz.zone.toLowerCase();

    // Check if this landing zone is already covered by an engagement zone
    const isCovered = coveredKeywords.some(covered =>
      covered.includes(lzLower.split(' ')[0]) || // First word match
      lzLower.includes(covered.split(' ')[0]) || // Reverse first word match
      wordOverlapSimilarity(covered, lzLower) > 0.5 // Fuzzy similarity
    );

    if (!isCovered) {
      // If topics provided, check relevance to topics
      let isRelevant = topics.length === 0; // Always relevant if no topics
      if (!isRelevant) {
        for (const topic of topics) {
          const topicLower = topic.toLowerCase();
          const { domains, crossCutting } = classifyTopic(topic);
          const allKw = [topicLower, ...domains.flatMap(d => TOPIC_DOMAIN_MAP[d].keywords), ...crossCutting.flatMap(c => CROSS_CUTTING_TOPICS[c].keywords)];
          if (allKw.some(kw => lzLower.includes(kw) || (lz.rationale || '').toLowerCase().includes(kw))) {
            isRelevant = true;
            break;
          }
        }
      }

      if (isRelevant) {
        darkZones.push({
          zone: lz.zone,
          fitScore: lz.fit_score,
          rationale: lz.rationale,
          entryStrategy: lz.entry_strategy,
        });
      }
    }
  }

  return darkZones;
}

/**
 * Simple word-level similarity for zone name matching.
 * Returns 0-1 score based on shared word overlap.
 */
function wordOverlapSimilarity(a, b) {
  const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  return intersection / Math.max(wordsA.size, wordsB.size);
}


// ═══════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════

// ── Position-First System Prompt ─────────────────────────────────────
const POSITION_FIRST_SYSTEM_PROMPT = `You are a senior Backbase Sales Strategist preparing a PRODUCT POSITIONING brief. You specialize in positioning Backbase solutions to specific personas at specific banks.

Your job is to build a complete positioning strategy for the specified product/initiative, tailored to the specific attendees at the specific bank. Everything you generate must be ANCHORED to the product being positioned — not a generic meeting brief.

Think like a pre-sales consultant: "How do I position [PRODUCT] to [PERSONA] at [BANK] so they see it as the solution to THEIR specific problems?"

Return ONLY valid JSON with this structure:
{
  "strategicPriorities": [
    {
      "area": "The priority area (e.g., 'SME digital onboarding', 'Real-time payments modernization')",
      "whyItMatters": "Why it matters to THIS persona at THIS bank — reference specific data points, KPIs, or news",
      "backbaseAngle": "How the product being positioned addresses it — be concrete about capabilities",
      "conversationHook": "A specific question to open this topic in conversation",
      "inferred": false
    }
  ],
  "positioningStrategy": {
    "headline": "One-sentence positioning statement: How to position [PRODUCT] to [PERSONA] at [BANK]",
    "valueAngle": "The primary value angle — what resonates most with THIS audience at THIS bank",
    "competitiveEdge": "What makes Backbase's offering better than what they have or what competitors offer"
  },
  "personIntelligence": {
    "summary": "2-3 sentence summary of the attendee(s) and what matters to them RE: this product",
    "priorities": ["What they care about that connects to this product"],
    "approach": "How to frame this product in terms THEY understand and value"
  },
  "topicInsights": [
    {
      "topic": "The product/initiative being positioned",
      "bankCurrentState": "What the bank currently has/does in this space — gaps, limitations, pain points",
      "painPoints": ["Specific pain points THIS product solves for THIS bank"],
      "backbaseOffering": "Concrete product capabilities, modules, features that address their needs",
      "talkingPoints": ["Product-anchored talking point 1", "Industry proof point 2", "Competitive differentiator 3"],
      "openingQuestion": "A question that surfaces the pain this product solves"
    }
  ],
  "darkZones": [
    {
      "zone": "Adjacent area where this product could expand into",
      "insight": "Why this is a natural extension of the product positioning",
      "provocation": "Question to open this adjacent opportunity",
      "backbaseSolution": "How the product connects to this zone"
    }
  ],
  "conversationFlow": {
    "opening": "Opening that leads with the BANK'S problem, not the product pitch",
    "middleSequence": [
      {
        "phase": "Phase name anchored to the product (e.g. 'Surface the Pain: Current Onboarding Friction')",
        "objective": "What to establish or learn in this phase — always linking back to the product",
        "transition": "Natural bridge to next phase"
      }
    ],
    "closing": "How to close with a product-specific next step (demo, workshop, POC)"
  },
  "quickValueEstimate": {
    "narrative": "Product-specific value story: what THIS product delivers to THIS bank in business terms",
    "suggestedMetric": "One anchor metric tied to the product (e.g., '60% reduction in onboarding time with Digital Onboarding')"
  },
  "competitiveContext": {
    "competitors": [
      {
        "name": "Competitor name",
        "leadsWiths": "What this competitor typically leads with in deals like this",
        "backbaseWins": "Where Backbase wins specifically for the product being positioned",
        "differentiator": "One-sentence differentiator to use with THIS persona"
      }
    ],
    "regionalDynamics": "Regional note on competitive dynamics (only if region is provided)"
  },
  "budgetUnlock": "A 1-2 sentence note on how to position this as an operational efficiency investment rather than a technology spend — helps unlock budget from ops/transformation budgets. Set to null if no AI & Operations personas are in the meeting.",
  "watchOuts": [
    "Product-specific sensitivities — existing vendor, past failed projects, budget cycles, technical constraints"
  ]
}

Guidelines:
- EVERY section must be anchored to the product being positioned — not generic meeting advice
- The conversation flow should build toward a product-specific outcome (demo, POC, workshop)
- Talking points should demonstrate deep product knowledge, not just sales messaging
- Watch-outs should include competitive intelligence specific to this product space
- Value estimates should be product-specific, not generic digital transformation numbers
- Dark zones should show ADJACENT opportunities the product can unlock

STRATEGIC PRIORITIES rules:
- Generate EXACTLY 2-4 strategic priorities. Prefer 2 strong ones over 4 weak ones.
- Each priority must follow the format: [area] — [why it matters to PERSONA at BANK] — [Backbase angle] — [conversation hook question]
- Derive priorities from: bank news/financials/strategy, persona's role and likely KPIs, the product being positioned, and any user-provided pain points
- Set "inferred": true for any priority NOT directly sourced from the provided bank data or news — i.e. derived from role-based assumptions or industry norms
- Set "inferred": false when the priority is grounded in a specific data point from the bank context (pain point, signal, news article, engagement zone, strategic initiative)
- Every priority must be anchored to the product being positioned

COMPETITIVE CONTEXT rules:
- Only generate "competitiveContext" if competitors are provided in the COMPETITIVE LANDSCAPE section
- For each named competitor, explain where Backbase's PRODUCT wins specifically — not generic platform comparisons
- The differentiator must be persona-specific and product-anchored
- If a region is provided, generate "regionalDynamics" with deal-relevant regional insights
- If no competitors or region are provided, set competitiveContext to null

AI & OPERATIONS PERSONA FRAMING rules:
- If ANY attendee has a role containing "COO", "Operations", "AI", "Automation", "Efficiency", "Transformation", or "Process", you MUST apply these adjustments:
  1. LANGUAGE SHIFT: Replace technology-centric language with operational efficiency language. Say "process automation" not "API orchestration". Say "cost-per-transaction reduction" not "platform modernization". Say "straight-through processing" not "headless architecture".
  2. STRATEGIC PRIORITIES: Lead with operational KPIs — STP rates, cost-to-serve, manual intervention reduction, FTE reallocation, processing time. These must appear as the first 1-2 priorities.
  3. BUDGET UNLOCK: Generate a "budgetUnlock" note — a 1-2 sentence recommendation on how to position Backbase as an operational efficiency investment (not a tech spend) to unlock budget from ops/transformation budgets rather than IT budgets.
  4. WHY BACKBASE REFRAME: If competitive context is present, reframe "backbaseWins" around Backbase APA (App Platform Accelerator) and operational use cases — intelligent routing, automated decisioning, self-service deflection, employee assist — not around developer experience or API architecture.
- If NO AI/Operations personas are present, set "budgetUnlock" to null and use standard technology language.`;

const MEETING_PREP_SYSTEM_PROMPT = `You are a senior Backbase Value Consultant preparing a comprehensive meeting brief. You specialize in digital banking transformation and engagement banking.

Your job is to synthesize ALL provided context (bank data, domain knowledge, news, dark zones, person intelligence) into one cohesive, actionable meeting preparation document.

Think like a consultant walking into this meeting: What do I need to know? What should I say? What questions should I ask? What can I offer that they haven't thought of?

Return ONLY valid JSON with this structure:
{
  "strategicPriorities": [
    {
      "area": "The priority area (e.g., 'SME digital onboarding', 'Real-time payments modernization')",
      "whyItMatters": "Why it matters to THIS persona at THIS bank — reference specific data points, KPIs, or news",
      "backbaseAngle": "How Backbase addresses it — be concrete about products/capabilities",
      "conversationHook": "A specific question to open this topic in conversation",
      "inferred": false
    }
  ],
  "personIntelligence": {
    "summary": "2-3 sentence summary of the attendee(s) and their likely focus areas",
    "priorities": ["Priority 1 for this person given their role", "Priority 2", ...],
    "approach": "How to best approach this person — tone, framing, what matters to them"
  },
  "topicInsights": [
    {
      "topic": "Topic name (e.g. AI, SME)",
      "bankCurrentState": "What this bank is currently doing in this area based on the data",
      "painPoints": ["Relevant pain point 1 for this topic at this bank", "Pain point 2", ...],
      "backbaseOffering": "What Backbase can specifically offer in this area — be concrete about products/capabilities",
      "talkingPoints": ["Provocative talking point 1", "Industry insight 2", "Backbase differentiator 3"],
      "openingQuestion": "A natural conversation opener for this topic"
    }
  ],
  "darkZones": [
    {
      "zone": "The blind spot area name",
      "insight": "Why this is a blind spot and why it matters for this bank",
      "provocation": "A provocative question to surface this blind spot in conversation",
      "backbaseSolution": "What Backbase specifically offers here"
    }
  ],
  "conversationFlow": {
    "opening": "Suggested opening approach — first 2 minutes",
    "middleSequence": [
      {
        "phase": "Phase name (e.g. 'Discovery: AI Vision')",
        "objective": "What to learn or validate in this phase",
        "transition": "Natural transition sentence to next phase"
      }
    ],
    "closing": "How to close — next steps, call to action"
  },
  "quickValueEstimate": {
    "narrative": "A back-of-napkin value story connecting the topics to business impact",
    "suggestedMetric": "One anchor metric to leave in their mind (e.g. '30% reduction in SME onboarding time')"
  },
  "competitiveContext": {
    "competitors": [
      {
        "name": "Competitor name",
        "leadsWiths": "What this competitor typically leads with in deals like this",
        "backbaseWins": "Where Backbase wins specifically against this competitor",
        "differentiator": "One-sentence differentiator to use with THIS persona"
      }
    ],
    "regionalDynamics": "Regional note on competitive dynamics (only if region is provided) — pricing, vendor preferences, reference clients"
  },
  "budgetUnlock": "A 1-2 sentence note on how to position this as an operational efficiency investment rather than a technology spend — helps unlock budget from ops/transformation budgets. Set to null if no AI & Operations personas are in the meeting.",
  "watchOuts": [
    "Things to be careful about — sensitivities, competitors, politics, timing"
  ]
}

Guidelines:
- Be SPECIFIC to this bank and these topics — never generic
- Reference actual data points, zone names, and pain points from the bank data
- For dark zones, be provocative but not presumptuous — frame as "Have you considered...?"
- Talking points should be things that demonstrate insight, not just product pitches
- The conversation flow should feel natural, not like a sales script
- Watch-outs should include competitive sensitivities and organizational politics
- Aim for: 3-5 priorities, 3-5 talking points per topic, 2-4 dark zones, 3-5 watch-outs

STRATEGIC PRIORITIES rules:
- Generate EXACTLY 2-4 strategic priorities. Prefer 2 strong ones over 4 weak ones.
- Each priority must follow the format: [area] — [why it matters to PERSONA at BANK] — [Backbase angle] — [conversation hook question]
- Derive priorities from: bank news/financials/strategy, persona's role and likely KPIs, the discussion topics, and any user-provided pain points
- Set "inferred": true for any priority NOT directly sourced from the provided bank data or news — i.e. derived from role-based assumptions or industry norms
- Set "inferred": false when the priority is grounded in a specific data point from the bank context (pain point, signal, news article, engagement zone, strategic initiative)
- These appear at the TOP of the brief as the consultant's strategic framing for the entire meeting

COMPETITIVE CONTEXT rules:
- Only generate "competitiveContext" if competitors are provided in the COMPETITIVE LANDSCAPE section
- For each named competitor, generate a specific "leadsWiths" / "backbaseWins" / "differentiator" block
- The differentiator must be tailored to the persona in this meeting, not generic marketing
- If a region is provided, generate "regionalDynamics" with deal-relevant regional insights
- If no competitors or region are provided, set competitiveContext to null

AI & OPERATIONS PERSONA FRAMING rules:
- If ANY attendee has a role containing "COO", "Operations", "AI", "Automation", "Efficiency", "Transformation", or "Process", you MUST apply these adjustments:
  1. LANGUAGE SHIFT: Replace technology-centric language with operational efficiency language. Say "process automation" not "API orchestration". Say "cost-per-transaction reduction" not "platform modernization". Say "straight-through processing" not "headless architecture".
  2. STRATEGIC PRIORITIES: Lead with operational KPIs — STP rates, cost-to-serve, manual intervention reduction, FTE reallocation, processing time. These must appear as the first 1-2 priorities.
  3. BUDGET UNLOCK: Generate a "budgetUnlock" note — a 1-2 sentence recommendation on how to position Backbase as an operational efficiency investment (not a tech spend) to unlock budget from ops/transformation budgets rather than IT budgets.
  4. WHY BACKBASE REFRAME: If competitive context is present, reframe "backbaseWins" around Backbase APA (App Platform Accelerator) and operational use cases — intelligent routing, automated decisioning, self-service deflection, employee assist — not around developer experience or API architecture.
- If NO AI/Operations personas are present, set "budgetUnlock" to null and use standard technology language.`;


/**
 * Main orchestrator — generates a comprehensive meeting prep brief.
 *
 * Supports two modes:
 * - "stakeholder" (default): Topic-driven meeting intelligence
 * - "position": Product-anchored positioning strategy
 *
 * @param {Object} params
 * @param {string} params.bankName - Bank display name
 * @param {string} params.bankKey - Bank key in database
 * @param {Array} params.attendees - [{name, role, customRole, isKDM}]
 * @param {Array<string>} params.topics - Free-form topic strings ["AI", "SME"]
 * @param {string} params.scopeKnown - "unknown"|"some_idea"|"clear"
 * @param {string} params.painPointKnown - "unknown"|"some_idea"|"clear"
 * @param {string} params.scopeText - Free text about known scope
 * @param {string} params.painText - Free text about known pain points
 * @param {Object} params.bankData - Full bank data object from SQLite
 * @param {string} [params.mode='stakeholder'] - "stakeholder" or "position"
 * @param {string} [params.positionProduct] - Product/initiative to position (position mode)
 * @param {string} [params.positionPainPoints] - Known pain points for positioning (position mode)
 * @param {Array<string>} [params.competitors] - Known competitors in this deal
 * @param {string} [params.region] - Deal region for regional competitive dynamics
 */
export async function generateMeetingPrep({
  bankName, bankKey, attendees = [], topics = [],
  scopeKnown, painPointKnown, scopeText, painText,
  bankData = {},
  mode = 'stakeholder', positionProduct, positionPainPoints,
  competitors = [], region = '',
  provenanceContext = '',
}) {
  const isPositionMode = mode === 'position' && positionProduct;
  console.log(`\n📋 Meeting Prep Agent${isPositionMode ? ' [POSITION MODE]' : ''}: ${bankName}`);
  console.log(`   ${isPositionMode ? `Product: ${positionProduct}` : `Topics: ${topics.join(', ')}`}`);
  console.log(`   Attendees: ${attendees.map(a => a.name).join(', ')}`);

  const startTime = Date.now();

  // ── Step 1: Research attendees (parallel) ──
  console.log(`   Step 1: Researching attendees...`);
  let personIntel = [];
  if (attendees.length > 0) {
    const personPromises = attendees.map(att =>
      researchPerson({
        name: att.name,
        role: att.role,
        customRole: att.customRole,
        bankName,
        bankKey,
        bankContext: {
          overview: bankData.overview,
          strategy: bankData.digital_strategy,
        },
      }).catch(err => {
        console.error(`   Warning: Person research failed for ${att.name}: ${err.message}`);
        return { personSummary: `${att.name} — ${att.role || att.customRole || 'Unknown role'}`, _error: err.message };
      })
    );
    personIntel = await Promise.all(personPromises);
  }
  console.log(`   Step 1 complete: ${personIntel.length} persons researched`);

  // ── Step 2: Match topics to bank data (fast, local) ──
  console.log(`   Step 2: Matching topics to bank data...`);
  const topicMatches = {};
  for (const topic of topics) {
    topicMatches[topic] = matchTopicToBankData(topic, bankData);
  }
  console.log(`   Step 2 complete: ${Object.keys(topicMatches).length} topics matched`);

  // ── Step 3: Load domain knowledge per topic (fast, cached) ──
  console.log(`   Step 3: Loading domain knowledge...`);
  const domainKnowledge = {};
  for (const topic of topics) {
    const { domains, crossCutting } = classifyTopic(topic);

    const parts = [];

    // Load vertical domain knowledge
    for (const dk of domains) {
      const knowledge = loadDomainKnowledge(dk);
      if (knowledge) parts.push(knowledge);
    }

    // Load cross-cutting lexicon sections
    for (const ck of crossCutting) {
      const config = CROSS_CUTTING_TOPICS[ck];
      const sections = loadLexiconSections(config.lexiconSections);
      if (sections) parts.push(`## ${config.label} (Platform Capabilities)\n\n${sections}`);
    }

    domainKnowledge[topic] = parts.length > 0 ? parts.join('\n\n') : null;
    console.log(`   - ${topic}: ${domains.length} domains, ${crossCutting.length} cross-cutting → ${parts.length > 0 ? 'loaded' : 'no knowledge found'}`);
  }

  // ── Step 4: Search Google News per topic + bank (parallel) ──
  console.log(`   Step 4: Searching news...`);
  const newsResults = {};
  const newsPromises = topics.map(async topic => {
    const results = await searchGoogleNews(`"${bankName}" ${topic} banking`, 4);
    newsResults[topic] = results;
  });
  // Also search general bank news
  const generalNewsPromise = searchGoogleNews(`"${bankName}" digital transformation strategy`, 3);
  await Promise.all([...newsPromises, generalNewsPromise]);
  const generalNews = await generalNewsPromise;
  console.log(`   Step 4 complete: ${Object.values(newsResults).reduce((s, r) => s + r.length, 0)} topic articles, ${generalNews.length} general`);

  // ── Step 5: Dark zone detection (fast, local) ──
  console.log(`   Step 5: Detecting dark zones...`);
  const darkZones = detectDarkZones(bankData, topics);
  console.log(`   Step 5 complete: ${darkZones.length} dark zones found`);

  // ── Step 6: Synthesize with Claude ──
  console.log(`   Step 6: Claude synthesis${isPositionMode ? ' (position mode)' : ''}...`);

  const systemPrompt = isPositionMode ? POSITION_FIRST_SYSTEM_PROMPT : MEETING_PREP_SYSTEM_PROMPT;

  const userMessage = buildSynthesisPrompt({
    bankName, bankKey, attendees, topics,
    scopeKnown, painPointKnown, scopeText, painText,
    bankData, personIntel, topicMatches,
    domainKnowledge, newsResults, generalNews, darkZones,
    isPositionMode, positionProduct, positionPainPoints,
    competitors, region, provenanceContext,
  });

  const raw = await callClaude(systemPrompt, userMessage, { maxTokens: 4096, timeout: 90000 });

  try {
    const jsonStr = raw.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(jsonStr);
    result._meta = {
      source: isPositionMode ? 'meeting-prep-agent-position' : 'meeting-prep-agent',
      mode: isPositionMode ? 'position' : 'stakeholder',
      ...(isPositionMode && { positionProduct }),
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      topicsAnalyzed: topics.length,
      attendeesResearched: personIntel.length,
      darkZonesFound: darkZones.length,
      newsArticles: Object.values(newsResults).reduce((s, r) => s + r.length, 0) + generalNews.length,
    };
    console.log(`   ✅ Meeting prep complete in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    return result;
  } catch (err) {
    console.error(`   Warning: Failed to parse Claude synthesis: ${err.message}`);
    // Return a structured fallback
    return buildFallbackBrief({
      bankName, attendees, topics, personIntel,
      topicMatches, darkZones, newsResults, err,
      startTime,
    });
  }
}


// ═══════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════

function buildSynthesisPrompt({
  bankName, bankKey, attendees, topics,
  scopeKnown, painPointKnown, scopeText, painText,
  bankData, personIntel, topicMatches,
  domainKnowledge, newsResults, generalNews, darkZones,
  isPositionMode, positionProduct, positionPainPoints,
  competitors = [], region = '', provenanceContext = '',
}) {
  const sections = [];

  // Position-First Mode: lead with the product positioning frame
  if (isPositionMode && positionProduct) {
    sections.push(`# PRODUCT POSITIONING BRIEF: How to position "${positionProduct}" at ${bankName}\n`);
    sections.push(`## POSITIONING OBJECTIVE\nGenerate a complete positioning strategy for **${positionProduct}** targeted at ${attendees.map(a => `${a.name} (${a.role || a.customRole})`).join(', ')} at **${bankName}**.\n\nEvery section of your response must be ANCHORED to positioning ${positionProduct}. Do NOT generate a generic meeting brief — this is a product positioning document.`);
    if (positionPainPoints) {
      sections.push(`## KNOWN CONTEXT / PAIN POINTS\nThe consultant has provided the following context that should inform the positioning:\n${positionPainPoints}`);
    }
  } else {
    // Standard stakeholder-first header
    sections.push(`# MEETING PREP BRIEF REQUEST: ${bankName}\n`);
  }

  if (bankData.overview) {
    sections.push(`## Bank Overview\n${bankData.overview}`);
  }

  if (bankData.digital_strategy) {
    sections.push(`## Digital Strategy\n${JSON.stringify(bankData.digital_strategy)}`);
  }

  // Attendees + person intel
  if (attendees.length > 0) {
    const attSection = attendees.map((att, i) => {
      const intel = personIntel[i];
      const roleStr = att.customRole || att.role || 'Unknown';
      let text = `### ${att.name} — ${roleStr}${att.isKDM ? ' (Key Decision Maker)' : ''}`;
      if (intel && !intel._error) {
        text += `\n${intel.personSummary || ''}`;
        if (intel.likelyPriorities?.length) {
          text += `\nLikely priorities:\n${intel.likelyPriorities.map(p => `- ${p.priority}: ${p.detail}`).join('\n')}`;
        }
        if (intel.suggestedApproach) {
          text += `\nSuggested approach: ${intel.suggestedApproach}`;
        }
      }
      return text;
    }).join('\n\n');
    sections.push(`## Meeting Attendees\n${attSection}`);
  }

  // Consultant's prior knowledge
  if (scopeText || painText) {
    sections.push(`## Consultant's Prior Knowledge\n${scopeKnown !== 'unknown' ? `Scope (${scopeKnown}): ${scopeText}` : 'Scope: Unknown'}\n${painPointKnown !== 'unknown' ? `Pain Points (${painPointKnown}): ${painText}` : 'Pain Points: Unknown'}`);
  }

  // Topic-specific sections
  for (const topic of topics) {
    const match = topicMatches[topic];
    const news = newsResults[topic] || [];
    const knowledge = domainKnowledge[topic];

    sections.push(`\n## ═══ TOPIC: ${topic.toUpperCase()} ═══`);

    // Bank data matches
    if (match.engagementZones.length > 0) {
      sections.push(`### Active Engagement Zones for "${topic}"\n${match.engagementZones.map(z => `- **${z.zone}** (${z.priority}): ${z.detail}`).join('\n')}`);
    }

    if (match.painPoints.length > 0) {
      sections.push(`### Related Bank Pain Points\n${match.painPoints.map(p => `- **${p.title}**: ${p.detail}`).join('\n')}`);
    }

    if (match.signals.length > 0) {
      sections.push(`### Related Signals\n${match.signals.map(s => `- Signal: ${s.signal}\n  Implication: ${s.implication}`).join('\n')}`);
    }

    if (match.landingZones.length > 0) {
      sections.push(`### Backbase Landing Zones\n${match.landingZones.map(lz => `- **${lz.zone}** (fit: ${lz.fit_score}/10): ${lz.rationale}`).join('\n')}`);
    }

    // News
    if (news.length > 0) {
      sections.push(`### Recent News: ${topic}\n${news.map(n => `- "${n.title}" (${n.source}, ${n.date})`).join('\n')}`);
    }

    // Domain knowledge (truncated to avoid overwhelming the prompt)
    if (knowledge) {
      const truncated = knowledge.substring(0, 3000);
      sections.push(`### Backbase Domain Knowledge: ${topic}\n${truncated}`);
    }
  }

  // General bank news
  if (generalNews.length > 0) {
    sections.push(`## General Bank News\n${generalNews.map(n => `- "${n.title}" (${n.source})`).join('\n')}`);
  }

  // Dark zones
  if (darkZones.length > 0) {
    sections.push(`## DARK ZONES (Blind Spots)\nThese are Backbase landing zones where the bank has NO active engagement — potential blind spots:\n${darkZones.map(dz => `- **${dz.zone}** (fit: ${dz.fitScore}/10): ${dz.rationale}\n  Entry strategy: ${dz.entryStrategy}`).join('\n\n')}`);
  }

  // Competitive context (consultant-provided)
  if (competitors.length > 0 || region) {
    const parts = [];
    if (competitors.length > 0) {
      parts.push(`Known competitors in this deal: ${competitors.join(', ')}\n\nFor EACH competitor listed, you MUST generate a "competitiveContext" block in your response with:\n- What that competitor typically leads with in deals like this\n- Where Backbase wins against them specifically\n- A one-sentence differentiator tailored to the persona(s) in this meeting`);
    }
    if (region) {
      parts.push(`Deal region: ${region}\n\nInclude a "regionalDynamics" note in competitiveContext about competitive dynamics specific to ${region} — pricing sensitivities, preferred vendor patterns, regional reference clients, regulatory considerations, etc.`);
    }
    sections.push(`## COMPETITIVE LANDSCAPE (Consultant-Provided)\n${parts.join('\n\n')}`);
  }

  // Additional bank context
  if (bankData.competitive_position) {
    sections.push(`## Competitive Position (from bank data)\n${JSON.stringify(bankData.competitive_position)}`);
  }

  if (bankData.strategic_initiatives) {
    const initiatives = Array.isArray(bankData.strategic_initiatives)
      ? bankData.strategic_initiatives
      : (typeof bankData.strategic_initiatives === 'string'
          ? (() => { try { return JSON.parse(bankData.strategic_initiatives); } catch { return [bankData.strategic_initiatives]; } })()
          : []);
    if (initiatives.length) {
      sections.push(`## Strategic Initiatives\n${initiatives.map(i => `- ${typeof i === 'string' ? i : i.initiative || i.title || JSON.stringify(i)}`).join('\n')}`);
    }
  }

  // Provenance context (Layer 1) — injected before instructions so Claude can reference tiers
  if (provenanceContext) {
    sections.push(`\n## DATA CONFIDENCE\n${provenanceContext}`);
  }

  if (isPositionMode && positionProduct) {
    sections.push(`\n## INSTRUCTIONS\nSynthesize ALL of the above into a PRODUCT POSITIONING brief for "${positionProduct}" at ${bankName}. Every insight, talking point, conversation phase, and value estimate must be anchored to positioning ${positionProduct}. The conversation flow should build toward a product-specific outcome (demo of ${positionProduct}, POC, workshop). Do NOT generate generic meeting advice — this is a positioning document.`);
  } else {
    sections.push(`\n## INSTRUCTIONS\nSynthesize ALL of the above into a comprehensive meeting prep brief. Focus on the topics: ${topics.join(', ')}. Make it actionable and specific to ${bankName}.`);
  }

  return sections.join('\n\n');
}


// ═══════════════════════════════════════════════
// FALLBACK BRIEF (when Claude parse fails)
// ═══════════════════════════════════════════════

function buildFallbackBrief({ bankName, attendees, topics, personIntel, topicMatches, darkZones, newsResults, err, startTime }) {
  // Build fallback strategic priorities from available data
  const fallbackPriorities = topics.slice(0, 4).map(topic => {
    const match = topicMatches[topic] || {};
    const pain = match.painPoints?.[0];
    const lz = match.landingZones?.[0];
    return {
      area: topic,
      whyItMatters: pain ? `${pain.title}: ${pain.detail}` : `${topic} is a key discussion area for this meeting`,
      backbaseAngle: lz ? `${lz.zone} (fit: ${lz.fit_score}/10) — ${lz.rationale}` : `See Backbase offering for ${topic}`,
      conversationHook: `What are your current priorities around ${topic}?`,
      inferred: !pain,
    };
  });

  return {
    strategicPriorities: fallbackPriorities.length >= 2 ? fallbackPriorities : fallbackPriorities.concat([
      { area: 'Digital Transformation', whyItMatters: 'Core strategic priority for most banks', backbaseAngle: 'Backbase Engagement Banking Platform', conversationHook: 'Where are you on your digital transformation journey?', inferred: true },
    ]).slice(0, 4),
    personIntelligence: {
      summary: attendees.map((a, i) => {
        const intel = personIntel[i];
        return intel?.personSummary || `${a.name} — ${a.role || a.customRole || 'Unknown role'}`;
      }).join('. '),
      priorities: personIntel.flatMap(p => (p.likelyPriorities || []).map(lp => lp.priority)).slice(0, 5),
      approach: personIntel[0]?.suggestedApproach || 'Take a discovery-first approach. Ask open-ended questions.',
    },
    topicInsights: topics.map(topic => {
      const match = topicMatches[topic] || {};
      return {
        topic,
        bankCurrentState: match.engagementZones?.map(z => z.zone).join(', ') || 'No specific data found',
        painPoints: match.painPoints?.map(p => p.title) || [],
        backbaseOffering: match.landingZones?.map(lz => lz.zone).join(', ') || 'See Backbase product portfolio',
        talkingPoints: match.signals?.map(s => s.signal).slice(0, 3) || [],
        openingQuestion: `What are your current priorities around ${topic}?`,
      };
    }),
    darkZones: darkZones.map(dz => ({
      zone: dz.zone,
      insight: dz.rationale,
      provocation: `Have you considered how ${dz.zone.toLowerCase()} could transform your ${topics[0] || 'digital'} strategy?`,
      backbaseSolution: dz.entryStrategy,
    })),
    conversationFlow: {
      opening: `Start with a genuine question about their experience with ${topics.join(' and ')}.`,
      middleSequence: topics.map(t => ({
        phase: `Explore: ${t}`,
        objective: `Understand current state and pain points around ${t}`,
        transition: `That connects well to another area I wanted to discuss...`,
      })),
      closing: 'Summarize key insights, propose a follow-up workshop or deeper dive.',
    },
    quickValueEstimate: {
      narrative: 'Synthesis unavailable — use the topic insights and dark zones to build a value story.',
      suggestedMetric: 'Discuss with the prospect to identify a relevant anchor metric.',
    },
    watchOuts: [
      'AI synthesis incomplete — verify all talking points independently',
      ...(Object.values(newsResults).flat().length > 0 ? ['Review recent news for timing sensitivities'] : []),
    ],
    _meta: {
      source: 'meeting-prep-agent-fallback',
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      error: err.message,
    },
  };
}


// ═══════════════════════════════════════════════
// ENGAGEMENT PLAN GENERATOR (Post-Meeting)
// ═══════════════════════════════════════════════

const ENGAGEMENT_PLAN_SYSTEM_PROMPT = `You are a senior Backbase Value Consultant generating a post-meeting Engagement Plan. You have access to the original meeting brief and the consultant's debrief notes.

Your job: synthesize the meeting outcome into a crisp, actionable 1-page engagement plan that can be pasted into Salesforce or sent as a Slack update.

Return ONLY valid JSON with this structure:
{
  "outcomeSummary": "One paragraph (3-5 sentences) summarizing what happened in the meeting: who attended, what the overall sentiment was, what key topics resonated, and the agreed next step. Write in past tense, factual tone.",
  "followUpActions": [
    {
      "action": "Concrete action item (e.g., 'Send competitive comparison deck with Temenos positioning')",
      "owner": "AE | VC | Product | Solution Architect | Customer Success",
      "deadline": "Suggested deadline relative to today (e.g., 'Within 3 business days', 'By end of week', 'Before next meeting')",
      "priority": "high | medium"
    }
  ],
  "nextMeetingAgenda": {
    "suggestedTiming": "When to schedule next meeting (e.g., '1-2 weeks', 'End of month')",
    "agendaItems": [
      "Specific agenda item 1 based on what resonated (e.g., 'Deep-dive demo: Digital Onboarding journey with APA orchestration')",
      "Specific agenda item 2",
      "Specific agenda item 3"
    ],
    "attendeeSuggestion": "Who should attend from the client side next time (e.g., 'Try to include the Head of Digital to validate CX priorities')"
  },
  "internalAction": {
    "whoToLoopIn": "Specific Backbase role or team to involve (e.g., 'Product team for Journey Manager demo', 'Solution Architect for integration assessment')",
    "reason": "Why — what the client needs or asked for that requires this person"
  },
  "riskOrWatchOut": "One key risk or competitive flag to watch (e.g., 'Client mentioned evaluating Thought Machine — prioritize competitive positioning in next meeting')"
}

Guidelines:
- Generate EXACTLY 2 follow-up actions. Prioritize by impact.
- Generate EXACTLY 3 agenda items for the next meeting, grounded in what resonated.
- The outcome summary must feel like a professional CRM note — factual, not promotional.
- The risk/watch-out should be specific and actionable, not generic.
- If the meeting outcome is "No interest", still generate the plan but frame actions as "nurture" activities.
- Reference specific Backbase products/capabilities by name when relevant.
- Keep the total output concise — this is a 1-page plan, not a report.`;

/**
 * Generates a post-meeting engagement plan.
 *
 * @param {Object} params
 * @param {string} params.bankName - Bank name
 * @param {Object} params.originalBrief - The meeting prep brief that was used
 * @param {string} params.outcome - "positive" | "neutral" | "need_followup" | "no_interest"
 * @param {Array<string>} params.resonatedPriorities - Which strategic priorities resonated
 * @param {string} params.clientAskedFor - Free text: what the client asked for
 * @param {string} params.agreedNextStep - Free text: what was agreed
 * @param {Array} params.attendees - Meeting attendees
 */
export async function generateEngagementPlan({
  bankName, originalBrief, outcome, resonatedPriorities = [],
  clientAskedFor = '', agreedNextStep = '', attendees = [],
}) {
  console.log(`\n📋 Engagement Plan Agent: ${bankName} (outcome: ${outcome})`);
  const startTime = Date.now();

  // Build a condensed version of the original brief for context
  const briefContext = [];
  briefContext.push(`Bank: ${bankName}`);
  briefContext.push(`Attendees: ${attendees.map(a => `${a.name} (${a.role || a.customRole || 'Unknown'})`).join(', ')}`);

  if (originalBrief?.strategicPriorities?.length) {
    briefContext.push(`\nPrepared Strategic Priorities:\n${originalBrief.strategicPriorities.map((sp, i) => `${i + 1}. ${sp.area} — ${sp.backbaseAngle}`).join('\n')}`);
  }
  if (originalBrief?.topicInsights?.length) {
    briefContext.push(`\nTopics Covered:\n${originalBrief.topicInsights.map(t => `- ${t.topic}: ${t.backbaseOffering}`).join('\n')}`);
  }
  if (originalBrief?.competitiveContext?.competitors?.length) {
    briefContext.push(`\nCompetitive Context:\n${originalBrief.competitiveContext.competitors.map(c => `- vs ${c.name}: ${c.differentiator}`).join('\n')}`);
  }
  if (originalBrief?.watchOuts?.length) {
    briefContext.push(`\nWatch-outs from prep:\n${originalBrief.watchOuts.map(w => `- ${w}`).join('\n')}`);
  }

  const OUTCOME_LABELS = {
    positive: 'Positive — client showed strong interest',
    neutral: 'Neutral — informational meeting, no clear commitment',
    need_followup: 'Needs follow-up — interest but unresolved questions',
    no_interest: 'No interest — client did not engage on our topics',
  };

  const userMessage = `# POST-MEETING DEBRIEF: ${bankName}

## ORIGINAL MEETING BRIEF (Context)
${briefContext.join('\n')}

## MEETING OUTCOME
Overall: ${OUTCOME_LABELS[outcome] || outcome}

## WHAT RESONATED
${resonatedPriorities.length > 0
    ? `The following strategic priorities resonated with the client:\n${resonatedPriorities.map(p => `- ${p}`).join('\n')}`
    : 'No specific priorities were highlighted as resonating.'}

## WHAT THE CLIENT ASKED FOR
${clientAskedFor || 'Nothing specific was requested.'}

## AGREED NEXT STEP
${agreedNextStep || 'No explicit next step was agreed.'}

## INSTRUCTIONS
Generate the Engagement Plan based on the above. Make it actionable and specific to ${bankName}. The follow-up actions should be concrete enough to add to a CRM task list.`;

  const raw = await callClaude(ENGAGEMENT_PLAN_SYSTEM_PROMPT, userMessage, { maxTokens: 2048, timeout: 60000 });

  try {
    const jsonStr = raw.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(jsonStr);
    result._meta = {
      source: 'engagement-plan-agent',
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      outcome,
      resonatedCount: resonatedPriorities.length,
    };
    console.log(`   ✅ Engagement plan complete in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    return result;
  } catch (err) {
    console.error(`   ⚠️ Engagement plan JSON parse failed: ${err.message}`);
    // Return a structured fallback
    return {
      outcomeSummary: `Meeting with ${bankName} concluded with a ${outcome} outcome. ${clientAskedFor ? `The client asked for: ${clientAskedFor}.` : ''} ${agreedNextStep ? `Agreed next step: ${agreedNextStep}.` : ''}`,
      followUpActions: [
        { action: agreedNextStep || 'Schedule follow-up meeting', owner: 'AE', deadline: 'Within 1 week', priority: 'high' },
        { action: 'Send meeting summary and relevant materials', owner: 'VC', deadline: 'Within 3 business days', priority: 'medium' },
      ],
      nextMeetingAgenda: {
        suggestedTiming: '1-2 weeks',
        agendaItems: resonatedPriorities.length > 0
          ? resonatedPriorities.slice(0, 3).map(p => `Deep-dive on: ${p}`)
          : ['Follow up on discussion topics', 'Product demonstration', 'Review next steps'],
        attendeeSuggestion: 'Same attendees plus relevant technical stakeholders',
      },
      internalAction: {
        whoToLoopIn: 'Solution Architect',
        reason: 'Support follow-up with technical depth',
      },
      riskOrWatchOut: 'AI synthesis incomplete — review and enhance manually.',
      _meta: {
        source: 'engagement-plan-agent-fallback',
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        error: err.message,
      },
    };
  }
}


// ── Availability Check ──

export function isMeetingPrepAvailable() {
  return isApiKeyConfigured();
}
