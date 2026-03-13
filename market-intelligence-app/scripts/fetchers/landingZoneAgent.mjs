/**
 * Landing Zone Agent — AI-Powered 4×5 Matrix Analysis
 * ────────────────────────────────────────────────────
 * Researches a bank via internet data (Google News RSS) and classifies
 * opportunities into a structured 4×5 Landing Zone Matrix:
 *   - 4 LOBs: Retail, Small Business, Commercial, Wealth
 *   - 5 Journeys: Onboarding, Servicing, Lending, Loan Origination, Investing
 *
 * For each cell, the agent scores 0-10 with evidence, assigns a modernization
 * play (Replatform / Add New Journeys / Unified Channel), and identifies
 * unconsidered needs (blind spots the bank hasn't explored).
 *
 * Uses: Google News RSS (free) + Claude API for synthesis.
 * Reference: "Landing Zones + Modernization Plays" Value Consulting framework.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = resolve(__dirname, '../../knowledge');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';


// ═══════════════════════════════════════════════
// INFRASTRUCTURE (self-contained per module pattern)
// ═══════════════════════════════════════════════

async function callClaude(systemPrompt, userMessage, maxTokens = 4096) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000); // 120s for heavy analysis

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
    console.error(`   Warning: Google News search failed for "${query}": ${err.message}`);
    return [];
  }
}


// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════

export const LOBS = ['retail', 'small_business', 'commercial', 'wealth'];
export const JOURNEYS = ['onboarding', 'servicing', 'lending', 'loan_origination', 'investing'];

export const LOB_LABELS = {
  retail: 'Retail',
  small_business: 'Small Business',
  commercial: 'Commercial',
  wealth: 'Private Banking / Wealth',
};

export const JOURNEY_LABELS = {
  onboarding: 'Onboarding',
  servicing: 'Servicing',
  lending: 'Lending',
  loan_origination: 'Loan Origination',
  investing: 'Investing',
};

export const PLAY_TYPES = {
  replatform: 'Replatform',
  add_new_journeys: 'Add New Journeys',
  unified_channel: 'Unified Channel Architecture',
};

// Map LOBs to domain knowledge directories
const LOB_DOMAIN_MAP = {
  retail: 'retail',
  small_business: 'sme',
  commercial: 'commercial',
  wealth: 'wealth',
};


// ═══════════════════════════════════════════════
// DOMAIN KNOWLEDGE LOADING
// ═══════════════════════════════════════════════

const _domainCache = new Map();

/**
 * Loads domain knowledge files for a LOB.
 * Maps LOBs to knowledge/domains/{dir}/ and reads pain_points, use_cases, value_propositions.
 */
function loadDomainKnowledge(lob) {
  if (_domainCache.has(lob)) return _domainCache.get(lob);

  const domainDir = LOB_DOMAIN_MAP[lob];
  if (!domainDir) return null;

  const basePath = resolve(KNOWLEDGE_DIR, 'domains', domainDir);
  const files = ['pain_points.md', 'use_cases.md', 'value_propositions.md'];
  const sections = [];

  for (const file of files) {
    const filePath = resolve(basePath, file);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        if (content.length > 200) {
          // Truncate to keep prompt manageable
          const truncated = content.length > 3000 ? content.substring(0, 3000) + '\n...[truncated]' : content;
          sections.push(`### ${file.replace('.md', '').replace(/_/g, ' ').toUpperCase()}\n${truncated}`);
        }
      } catch (err) {
        // non-critical
      }
    }
  }

  const result = sections.length > 0
    ? `## ${LOB_LABELS[lob]} Domain Knowledge\n\n${sections.join('\n\n')}`
    : null;

  _domainCache.set(lob, result);
  return result;
}


// ═══════════════════════════════════════════════
// EVIDENCE GATHERING (Google News)
// ═══════════════════════════════════════════════

/**
 * Runs multiple parallel Google News searches to gather evidence about a bank.
 * Returns deduplicated news items.
 */
async function gatherEvidence(bankName, country, meetingContext = null) {
  const searchQueries = [
    `"${bankName}" digital banking transformation 2024 2025`,
    `"${bankName}" onboarding lending technology platform`,
    `"${bankName}" wealth management digital advisory`,
    `"${bankName}" SME small business banking portal`,
    `"${bankName}" CTO CIO technology hiring digital`,
    `"${bankName}" core banking modernization vendor fintech`,
    `"${bankName}" annual report strategy digital`,
  ];

  // Add topic-specific queries when meeting context is provided
  if (meetingContext?.topics?.length) {
    for (const topic of meetingContext.topics.slice(0, 3)) {
      searchQueries.push(`"${bankName}" ${topic} 2025 2026`);
    }
    console.log(`   + ${Math.min(meetingContext.topics.length, 3)} topic-specific queries from meeting context`);
  }

  console.log(`   Searching news (${searchQueries.length} queries)...`);

  // Stagger searches slightly to avoid rate limiting
  const results = [];
  for (let i = 0; i < searchQueries.length; i++) {
    const batch = searchGoogleNews(searchQueries[i], 4);
    results.push(batch);
    // Small stagger per query
    if (i < searchQueries.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  const allResults = await Promise.all(results);
  const allItems = allResults.flat();

  // Deduplicate by title similarity
  const seen = new Set();
  const unique = [];
  for (const item of allItems) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 60);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  console.log(`   Found ${unique.length} unique news items`);
  return unique;
}


// ═══════════════════════════════════════════════
// CLAUDE SYSTEM PROMPT
// ═══════════════════════════════════════════════

const LANDING_ZONE_SYSTEM_PROMPT = `You are a senior Backbase Value Consultant specializing in the "Landing Zones + Modernization Plays" framework.

Your job: Given bank intelligence (profile, news, pain points, signals, existing zones) and Backbase domain knowledge, classify this bank's opportunities into a **4x5 Landing Zone Matrix** and assign **Modernization Plays**.

## Landing Zone Matrix Definition

**4 Lines of Business (LOBs):**
- retail: Consumer/personal banking
- small_business: SME, small and medium enterprise banking
- commercial: Mid-to-large corporate, treasury, trade finance
- wealth: Private banking, wealth management, advisory, investment

**5 Journeys:**
- onboarding: Account opening, KYC/KYB, digital origination
- servicing: Self-service, engagement, notifications, day-to-day banking
- lending: Credit products, mortgages, loan servicing
- loan_origination: Loan/credit application journeys, decisioning
- investing: Investment products, brokerage, portfolio management

## Scoring Guidelines

Score each of the 20 cells (4 LOBs x 5 Journeys) from 0-10:
- **0**: No evidence of bank activity or need in this area
- **1-3**: Minimal evidence, low priority for the bank
- **4-6**: Moderate evidence of need or activity, potential opportunity
- **7-8**: Strong evidence: clear gap, stated priority, or active initiative
- **9-10**: Urgent need: multiple evidence sources, strategic priority, public commitment

## Modernization Play Assignment

For each cell with score >= 4, assign ONE play:
- **replatform**: Bank has legacy digital in this area, needs to REPLACE with modern platform
- **add_new_journeys**: Bank has no digital here, needs to ADD new digital journeys
- **unified_channel**: Bank has multiple fragmented solutions, needs to CONSOLIDATE into one

Leave play as null for cells with score < 4.

## Unconsidered Needs

Identify areas where:
- **unconsidered**: The bank shows no awareness but Backbase has strong capability (blind spots)
- **unknown_strength**: Backbase has unique differentiation the bank likely does not know about

## Rules
- Be evidence-grounded: every score must connect to specific data (news, signals, pain points, zone data)
- Be conservative: do not score high without evidence
- Score 0 with brief rationale for cells where the bank truly has no presence
- For "currentState": describe what the bank is currently doing in that cell based on evidence
- For "rationale": explain WHY this score, citing specific evidence
- For "evidence": list the specific news items or data points that support this score

Return ONLY valid JSON matching the exact structure specified in the user prompt.`;


// ═══════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════

/**
 * Analyze a bank's landing zones and modernization plays.
 *
 * @param {Object} params
 * @param {string} params.bankName - Bank display name
 * @param {string} params.bankKey - Bank key for SQLite
 * @param {Object} params.bankData - Full bank data object from SQLite
 * @returns {Object} Structured landing zone matrix with plays
 */
export async function analyzeLandingZones({ bankName, bankKey, bankData, meetingContext }) {
  const startTime = Date.now();
  const isTailored = !!meetingContext;
  console.log(`\n[LZ Agent] Landing Zone Analysis: ${bankName}${isTailored ? ' (meeting-tailored: ' + (meetingContext.topics || []).join(', ') + ')' : ''}`);
  console.log(`${'─'.repeat(50)}`);

  // Step 1: Gather news evidence (with optional topic-specific queries)
  const country = bankData.country || '';
  const newsItems = await gatherEvidence(bankName, country, meetingContext);

  // Step 2: Load domain knowledge per LOB
  console.log(`   Loading domain knowledge...`);
  const domainKnowledge = {};
  for (const lob of LOBS) {
    domainKnowledge[lob] = loadDomainKnowledge(lob);
  }
  const domainKnowledgeText = Object.entries(domainKnowledge)
    .filter(([, v]) => v)
    .map(([lob, text]) => `\n--- ${LOB_LABELS[lob]} ---\n${text}`)
    .join('\n');

  // Step 3: Extract existing bank data
  const existingLandingZones = bankData.backbase_landing_zones || [];
  const engagementZones = bankData.backbase_qualification?.engagement_banking_zones || [];
  const aiOpportunities = bankData.backbase_qualification?.ai_opportunities || [];
  const painPoints = bankData.pain_points || [];
  const signals = bankData.signals || [];
  const overview = bankData.overview || '';
  const kpis = bankData.kpis || [];

  // Step 4: Build classification prompt
  const newsText = newsItems.length > 0
    ? newsItems.map((n, i) => `  ${i + 1}. "${n.title}" (${n.source}, ${n.date})`).join('\n')
    : '  No recent news found.';

  const existingZonesText = existingLandingZones.length > 0
    ? existingLandingZones.map(lz => `  - ${lz.zone} (fit_score: ${lz.fit_score}) - ${lz.rationale}`).join('\n')
    : '  None available.';

  const engagementZonesText = engagementZones.length > 0
    ? engagementZones.map(ez => `  - [${ez.priority}] ${ez.zone} - ${ez.detail}`).join('\n')
    : '  None available.';

  const painPointsText = painPoints.length > 0
    ? painPoints.map(pp => `  - ${pp.title}: ${pp.detail}`).join('\n')
    : '  None available.';

  const signalsText = signals.length > 0
    ? signals.map(s => `  - ${s.signal}: ${s.implication}`).join('\n')
    : '  None available.';

  const aiOppText = aiOpportunities.length > 0
    ? aiOpportunities.map(ao => `  - ${ao.zone}: ${ao.detail}`).join('\n')
    : '  None available.';

  const kpisText = kpis.length > 0
    ? kpis.map(k => `  - ${k.label}: ${k.value}${k.sub ? ` (${k.sub})` : ''}`).join('\n')
    : '  None available.';

  const userMessage = `## Bank: ${bankName}
${country ? `Country: ${country}` : ''}

### Bank Overview
${overview || 'No overview available.'}

### Key Metrics
${kpisText}

### Recent News (from Google News)
${newsText}

### Existing Landing Zones (from previous analysis)
${existingZonesText}

### Engagement Banking Zones (bank current priorities)
${engagementZonesText}

### AI Opportunities Identified
${aiOppText}

### Pain Points
${painPointsText}

### Market Signals
${signalsText}

### Backbase Domain Knowledge
${domainKnowledgeText || 'No domain knowledge available.'}

---

## YOUR TASK

Analyze ALL the above data and produce a Landing Zone Matrix. Return ONLY valid JSON:

{
  "matrix": {
    "retail": {
      "onboarding": { "score": 0, "rationale": "WHY this score with specific evidence", "evidence": [{"source": "news|annual_report|pain_point|signal|engagement_zone", "title": "brief description"}], "play": "replatform|add_new_journeys|unified_channel|null", "currentState": "what the bank is doing here now" },
      "servicing": { "score": 0, "rationale": "...", "evidence": [], "play": null, "currentState": "..." },
      "lending": { "score": 0, "rationale": "...", "evidence": [], "play": null, "currentState": "..." },
      "loan_origination": { "score": 0, "rationale": "...", "evidence": [], "play": null, "currentState": "..." },
      "investing": { "score": 0, "rationale": "...", "evidence": [], "play": null, "currentState": "..." }
    },
    "small_business": { "onboarding": {...}, "servicing": {...}, "lending": {...}, "loan_origination": {...}, "investing": {...} },
    "commercial": { "onboarding": {...}, "servicing": {...}, "lending": {...}, "loan_origination": {...}, "investing": {...} },
    "wealth": { "onboarding": {...}, "servicing": {...}, "lending": {...}, "loan_origination": {...}, "investing": {...} }
  },
  "unconsideredNeeds": [
    { "need": "description of blind spot", "category": "unconsidered|unknown_strength", "evidence": "why this is a blind spot", "backbaseCapability": "what Backbase offers here" }
  ],
  "challenges": [
    { "challenge": "bank challenge description", "dataSource": "annual_report|news|earnings_call|hiring|tech_stack|signal", "relatedInitiative": "related bank initiative if any" }
  ]
}

IMPORTANT:
- Score ALL 20 cells (even 0 for empty areas)
- Every score >= 4 MUST have a play assignment
- Every score > 0 MUST cite evidence
- Be specific and concrete in rationale: name technologies, competitors, initiatives
- Keep rationale to 2-3 sentences max per cell
- Identify at least 2-3 unconsidered needs
- Extract 3-5 challenges from the data` + (meetingContext ? `

### ═══ MEETING CONTEXT ═══
This analysis is being prepared for a specific meeting.
Meeting topics: ${meetingContext.topics?.join(', ') || 'General'}
Attendees: ${meetingContext.attendees?.map(a => `${a.name} (${a.customRole || a.role || 'Unknown'})`).join(', ') || 'Unknown'}
${meetingContext.scopeText ? `Known scope: ${meetingContext.scopeText}` : ''}
${meetingContext.painText ? `Known pain points: ${meetingContext.painText}` : ''}
${meetingContext.meetingPrepSummary ? `Person intelligence: ${meetingContext.meetingPrepSummary.substring(0, 300)}` : ''}

ADDITIONAL INSTRUCTIONS for meeting-tailored analysis:
- Score cells related to "${meetingContext.topics?.join(', ') || 'the meeting topics'}" with EXTRA attention and detail
- Provide more detailed evidence and rationale for cells matching meeting topics
- Identify unconsidered needs that are relevant to the meeting themes
- The attendee's perspective matters: ${meetingContext.attendees?.[0]?.role || 'general'} priorities should influence which cells get deeper analysis` : '');

  // Step 5: Call Claude
  console.log(`   Calling Claude for 4x5 matrix classification...`);
  let rawResponse;
  try {
    rawResponse = await callClaude(LANDING_ZONE_SYSTEM_PROMPT, userMessage, 6000);
  } catch (err) {
    console.error(`   Claude call failed: ${err.message}`);
    return buildFallbackResult(bankData, newsItems, startTime);
  }

  // Step 6: Parse JSON response
  let parsed;
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error(`   JSON parse failed: ${err.message}`);
    return buildFallbackResult(bankData, newsItems, startTime);
  }

  // Validate matrix structure
  const matrix = parsed.matrix || {};
  for (const lob of LOBS) {
    if (!matrix[lob]) matrix[lob] = {};
    for (const journey of JOURNEYS) {
      if (!matrix[lob][journey]) {
        matrix[lob][journey] = { score: 0, rationale: 'No data available', evidence: [], play: null, currentState: 'Unknown' };
      }
      // Ensure score is numeric
      matrix[lob][journey].score = Math.min(10, Math.max(0, Number(matrix[lob][journey].score) || 0));
      // Ensure evidence is array
      if (!Array.isArray(matrix[lob][journey].evidence)) {
        matrix[lob][journey].evidence = [];
      }
    }
  }

  // Step 7: Derive topLandingZones
  const allCells = [];
  for (const lob of LOBS) {
    for (const journey of JOURNEYS) {
      const cell = matrix[lob][journey];
      if (cell.score > 0) {
        allCells.push({ lob, journey, score: cell.score, play: cell.play, oneLineSummary: cell.rationale?.substring(0, 100) });
      }
    }
  }
  allCells.sort((a, b) => b.score - a.score);
  const topLandingZones = allCells.slice(0, 5);

  // Step 8: Group zones by play for modernizationPlays
  const playGroups = { replatform: [], add_new_journeys: [], unified_channel: [] };
  for (const cell of allCells) {
    if (cell.play && playGroups[cell.play]) {
      playGroups[cell.play].push({ lob: cell.lob, journey: cell.journey, score: cell.score });
    }
  }

  const modernizationPlays = [
    {
      play: 'replatform',
      zones: playGroups.replatform,
      narrative: playGroups.replatform.length > 0
        ? `${bankName} has ${playGroups.replatform.length} area(s) where legacy digital channels should be replaced with a modern Backbase engagement layer.`
        : 'No replatform opportunities identified based on current evidence.',
    },
    {
      play: 'add_new_journeys',
      zones: playGroups.add_new_journeys,
      narrative: playGroups.add_new_journeys.length > 0
        ? `${bankName} has ${playGroups.add_new_journeys.length} area(s) where new digital journeys can be added on top of the existing platform.`
        : 'No new journey opportunities identified based on current evidence.',
    },
    {
      play: 'unified_channel',
      zones: playGroups.unified_channel,
      narrative: playGroups.unified_channel.length > 0
        ? `${bankName} has ${playGroups.unified_channel.length} area(s) where fragmented channel solutions should be consolidated into one unified platform.`
        : 'No channel unification opportunities identified based on current evidence.',
    },
  ];

  const durationMs = Date.now() - startTime;
  console.log(`   Landing zone analysis complete (${(durationMs / 1000).toFixed(1)}s)`);
  console.log(`   Top zones: ${topLandingZones.map(z => `${LOB_LABELS[z.lob]}/${JOURNEY_LABELS[z.journey]}(${z.score})`).join(', ')}`);

  return {
    matrix,
    modernizationPlays,
    unconsideredNeeds: parsed.unconsideredNeeds || [],
    challenges: parsed.challenges || [],
    topLandingZones,
    generatedAt: new Date().toISOString(),
    _meta: {
      source: 'landing-zone-agent',
      durationMs,
      newsArticles: newsItems.length,
      bankKey,
    },
  };
}


// ═══════════════════════════════════════════════
// FALLBACK (when Claude fails)
// ═══════════════════════════════════════════════

/**
 * Builds a minimal matrix from existing bank data when Claude API fails.
 * Maps existing flat landing zones into approximate matrix positions.
 */
function buildFallbackResult(bankData, newsItems, startTime) {
  console.log('   Using fallback: mapping existing landing zones to matrix');

  const existingLZ = bankData.backbase_landing_zones || [];
  const matrix = {};

  // Initialize empty matrix
  for (const lob of LOBS) {
    matrix[lob] = {};
    for (const journey of JOURNEYS) {
      matrix[lob][journey] = { score: 0, rationale: 'No data: run analysis with API key', evidence: [], play: null, currentState: 'Unknown' };
    }
  }

  // Map existing zones to approximate positions
  const LOB_KW = {
    retail: ['retail', 'consumer', 'personal', 'b2c', 'nordic', 'digital banking'],
    small_business: ['sme', 'small business', 'business banking', 'msme'],
    commercial: ['commercial', 'corporate', 'trade finance', 'treasury'],
    wealth: ['wealth', 'private banking', 'advisory', 'hnw', 'portfolio'],
  };
  const JOURNEY_KW = {
    onboarding: ['onboarding', 'kyc', 'account opening', 'origination'],
    servicing: ['servicing', 'self-service', 'engagement', 'assist', 'employee', 'portal', 'platform'],
    lending: ['lending', 'credit', 'mortgage', 'loan serv'],
    loan_origination: ['loan origination', 'credit origination', 'origination journey'],
    investing: ['investing', 'investment', 'brokerage', 'securities'],
  };

  for (const lz of existingLZ) {
    const name = lz.zone.toLowerCase();

    // Find best LOB match
    let bestLob = 'retail';
    let bestLobScore = 0;
    for (const [lob, keywords] of Object.entries(LOB_KW)) {
      const score = keywords.filter(kw => name.includes(kw)).length;
      if (score > bestLobScore) {
        bestLobScore = score;
        bestLob = lob;
      }
    }

    // Find best Journey match
    let bestJourney = 'servicing';
    let bestJourneyScore = 0;
    for (const [journey, keywords] of Object.entries(JOURNEY_KW)) {
      const score = keywords.filter(kw => name.includes(kw)).length;
      if (score > bestJourneyScore) {
        bestJourneyScore = score;
        bestJourney = journey;
      }
    }

    // Only overwrite if this zone has a higher score
    if (lz.fit_score > (matrix[bestLob][bestJourney].score || 0)) {
      matrix[bestLob][bestJourney] = {
        score: lz.fit_score,
        rationale: lz.rationale || 'From existing landing zone data',
        evidence: [{ source: 'existing_data', title: lz.zone }],
        play: null,
        currentState: lz.entry_strategy || 'See existing landing zone data',
      };
    }
  }

  return {
    matrix,
    modernizationPlays: [
      { play: 'replatform', zones: [], narrative: 'Run AI analysis to identify replatform opportunities.' },
      { play: 'add_new_journeys', zones: [], narrative: 'Run AI analysis to identify new journey opportunities.' },
      { play: 'unified_channel', zones: [], narrative: 'Run AI analysis to identify channel unification opportunities.' },
    ],
    unconsideredNeeds: [],
    challenges: [],
    topLandingZones: existingLZ.slice(0, 5).map(lz => ({
      lob: 'retail',
      journey: 'servicing',
      score: lz.fit_score,
      play: null,
      oneLineSummary: lz.rationale?.substring(0, 100) || lz.zone,
    })),
    generatedAt: new Date().toISOString(),
    _meta: {
      source: 'landing-zone-agent-fallback',
      durationMs: Date.now() - startTime,
      newsArticles: newsItems.length,
    },
  };
}


// ═══════════════════════════════════════════════
// AVAILABILITY CHECK
// ═══════════════════════════════════════════════

export function isLandingZoneAgentAvailable() {
  return !!process.env.ANTHROPIC_API_KEY;
}
