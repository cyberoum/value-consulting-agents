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

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = resolve(__dirname, '../../knowledge');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

// ── Claude API Call (self-contained per module pattern) ──

async function callClaude(systemPrompt, userMessage, maxTokens = 4096) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000); // 90s for complex synthesis

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API ${res.status}: ${err.substring(0, 200)}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || '';
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
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
  const files = ['pain_points.md', 'use_cases.md', 'value_propositions.md', 'benchmarks.md'];
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

const MEETING_PREP_SYSTEM_PROMPT = `You are a senior Backbase Value Consultant preparing a comprehensive meeting brief. You specialize in digital banking transformation and engagement banking.

Your job is to synthesize ALL provided context (bank data, domain knowledge, news, dark zones, person intelligence) into one cohesive, actionable meeting preparation document.

Think like a consultant walking into this meeting: What do I need to know? What should I say? What questions should I ask? What can I offer that they haven't thought of?

Return ONLY valid JSON with this structure:
{
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
- Aim for: 3-5 priorities, 3-5 talking points per topic, 2-4 dark zones, 3-5 watch-outs`;


/**
 * Main orchestrator — generates a comprehensive meeting prep brief.
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
 */
export async function generateMeetingPrep({
  bankName, bankKey, attendees = [], topics = [],
  scopeKnown, painPointKnown, scopeText, painText,
  bankData = {},
}) {
  console.log(`\n📋 Meeting Prep Agent: ${bankName}`);
  console.log(`   Topics: ${topics.join(', ')}`);
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
  console.log(`   Step 6: Claude synthesis...`);

  const userMessage = buildSynthesisPrompt({
    bankName, bankKey, attendees, topics,
    scopeKnown, painPointKnown, scopeText, painText,
    bankData, personIntel, topicMatches,
    domainKnowledge, newsResults, generalNews, darkZones,
  });

  const raw = await callClaude(MEETING_PREP_SYSTEM_PROMPT, userMessage, 4096);

  try {
    const jsonStr = raw.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(jsonStr);
    result._meta = {
      source: 'meeting-prep-agent',
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
}) {
  const sections = [];

  // Bank overview
  sections.push(`# MEETING PREP BRIEF REQUEST: ${bankName}\n`);

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

  // Additional bank context
  if (bankData.competitive_position) {
    sections.push(`## Competitive Position\n${JSON.stringify(bankData.competitive_position)}`);
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

  sections.push(`\n## INSTRUCTIONS\nSynthesize ALL of the above into a comprehensive meeting prep brief. Focus on the topics: ${topics.join(', ')}. Make it actionable and specific to ${bankName}.`);

  return sections.join('\n\n');
}


// ═══════════════════════════════════════════════
// FALLBACK BRIEF (when Claude parse fails)
// ═══════════════════════════════════════════════

function buildFallbackBrief({ bankName, attendees, topics, personIntel, topicMatches, darkZones, newsResults, err, startTime }) {
  return {
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


// ── Availability Check ──

export function isMeetingPrepAvailable() {
  return !!process.env.ANTHROPIC_API_KEY;
}
