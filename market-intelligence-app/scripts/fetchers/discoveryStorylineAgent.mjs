/**
 * Discovery Storyline Agent -- AI-Powered First Meeting Narrative Generator
 * ────────────────────────────────────────────────────────────────────────
 * Synthesizes ALL intelligence about a bank prospect into a persuasive,
 * 7-act narrative for the first discovery meeting:
 *
 *   Act 1: Market Context ("The World is Changing")
 *   Act 2: Your Reality  ("We Understand You")
 *   Act 3: Customer Lens ("Your Customers Expect More")
 *   Act 4: Competitive Landscape ("The Race")
 *   Act 5: Art of the Possible ("Our Vision")
 *   Act 6: Proof Points ("We've Done This Before")
 *   Act 7: Call to Action ("Let's Explore Together")
 *
 * Sources: bank data, landing zone matrix, Google News RSS, BCG/McKinsey
 * thought leadership, Backbase domain knowledge, ROI case studies.
 *
 * Uses: Google News RSS (free) + Claude API for synthesis.
 * NOTE: This module does NOT use child_process or exec in any form.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { callClaude, isApiKeyConfigured } from './claudeClient.mjs';

const currentDir = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = resolve(currentDir, '../../knowledge');


// ===============================================
// INFRASTRUCTURE
// ===============================================

async function searchGoogleNews(query, maxResults = 5) {
  const encoded = encodeURIComponent(query);
  const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en&gl=US&ceid=US:en`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(rssUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) return [];

    const xml = await response.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(xml)) && items.length < maxResults) {
      const itemXml = itemMatch[1];
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
  } catch (searchErr) {
    console.error(`   Warning: News search failed for "${query}": ${searchErr.message}`);
    return [];
  }
}


// ===============================================
// CONSTANTS
// ===============================================

const ACT_IDS = [
  'market_context',
  'your_reality',
  'customer_lens',
  'competitive_landscape',
  'art_of_possible',
  'proof_points',
  'call_to_action',
];

const ACT_TITLES = {
  market_context: 'The World is Changing',
  your_reality: 'Your Reality',
  customer_lens: 'Your Customers Expect More',
  competitive_landscape: 'The Race',
  art_of_possible: 'The Art of the Possible',
  proof_points: "We've Done This Before",
  call_to_action: "Let's Explore Together",
};

const LOB_DOMAIN_MAP = {
  retail: 'retail',
  small_business: 'sme',
  commercial: 'commercial',
  wealth: 'wealth',
};

const LOB_KEYWORDS = {
  retail: ['retail', 'consumer', 'personal', 'mobile banking', 'digital banking', 'b2c'],
  small_business: ['sme', 'small business', 'business banking', 'msme', 'corporate lite'],
  commercial: ['commercial', 'corporate', 'trade finance', 'treasury', 'cash management'],
  wealth: ['wealth', 'private banking', 'advisory', 'hnw', 'portfolio', 'investment'],
};


// ===============================================
// KNOWLEDGE LOADING
// ===============================================

function loadFileContent(filePath) {
  try {
    if (existsSync(filePath)) {
      return readFileSync(filePath, 'utf-8');
    }
  } catch (readErr) {
    console.error(`   Warning: could not read ${filePath}: ${readErr.message}`);
  }
  return '';
}

function loadRoiExamples() {
  return loadFileContent(resolve(KNOWLEDGE_DIR, 'domains', 'roi_examples.md'));
}

function loadRoiLearnings() {
  const learningsDir = resolve(KNOWLEDGE_DIR, 'learnings', 'roi_models');
  if (!existsSync(learningsDir)) return '';

  try {
    const files = readdirSync(learningsDir).filter(f => f.endsWith('.md'));
    const chunks = [];
    for (const file of files.slice(0, 5)) {
      const content = loadFileContent(resolve(learningsDir, file));
      if (content) {
        chunks.push(`### ${file.replace('.md', '')}\n${content.substring(0, 2000)}`);
      }
    }
    return chunks.join('\n\n---\n\n');
  } catch (dirErr) {
    console.error(`   Warning: could not read ROI learnings: ${dirErr.message}`);
    return '';
  }
}

function loadDomainKnowledge(lobKey) {
  const domainDir = LOB_DOMAIN_MAP[lobKey];
  if (!domainDir) return '';

  const basePath = resolve(KNOWLEDGE_DIR, 'domains', domainDir);
  const files = ['pain_points.md', 'use_cases.md', 'value_propositions.md', 'roi_levers.md'];

  const sections = [];
  for (const file of files) {
    const content = loadFileContent(resolve(basePath, file));
    if (content && content.length > 50) {
      sections.push(`#### ${file.replace('.md', '').replace(/_/g, ' ').toUpperCase()}\n${content.substring(0, 2500)}`);
    }
  }

  return sections.length > 0
    ? `### ${domainDir.toUpperCase()} Domain Knowledge\n${sections.join('\n\n')}`
    : '';
}


// ===============================================
// BANK INTELLIGENCE HELPERS
// ===============================================

function detectRelevantLobs(bankData, lzMatrixData) {
  const lobScores = { retail: 0, small_business: 0, commercial: 0, wealth: 0 };

  // Score from landing zone matrix (highest signal)
  if (lzMatrixData?.matrix) {
    for (const [lob, journeys] of Object.entries(lzMatrixData.matrix)) {
      if (lobScores[lob] === undefined) continue;
      for (const cell of Object.values(journeys)) {
        if (cell?.score > 0) lobScores[lob] += cell.score;
      }
    }
  }

  // Score from engagement banking zones
  const ezZones = bankData?.backbase_qualification?.engagement_banking_zones || [];
  for (const ez of ezZones) {
    const name = (ez.zone || '').toLowerCase();
    for (const [lob, keywords] of Object.entries(LOB_KEYWORDS)) {
      if (keywords.some(kw => name.includes(kw))) {
        lobScores[lob] += ez.priority === 'HIGH' ? 10 : ez.priority === 'MEDIUM' ? 5 : 2;
      }
    }
  }

  // Score from landing zones
  const lzZones = bankData?.backbase_landing_zones || [];
  for (const lz of lzZones) {
    const name = (lz.zone || '').toLowerCase();
    for (const [lob, keywords] of Object.entries(LOB_KEYWORDS)) {
      if (keywords.some(kw => name.includes(kw))) {
        lobScores[lob] += lz.fit_score || 3;
      }
    }
  }

  // Default: always include retail
  if (lobScores.retail === 0) lobScores.retail = 1;

  return Object.entries(lobScores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([lob]) => lob);
}

function formatKpis(kpis) {
  if (!kpis?.length) return 'No KPIs available.';
  return kpis.map(k => `- ${k.label}: ${k.value}${k.sub ? ` (${k.sub})` : ''}`).join('\n');
}

function formatPainPoints(painPoints) {
  if (!painPoints?.length) return 'No pain points documented.';
  return painPoints.map(p =>
    `- [${p.severity || 'medium'}] ${p.title}: ${p.detail}${p.backbaseRelevance ? ` (Backbase relevance: ${p.backbaseRelevance})` : ''}`
  ).join('\n');
}

function formatSignals(signals) {
  if (!signals?.length) return 'No signals detected.';
  return signals.slice(0, 10).map(s => `- Signal: ${s.signal} -> Implication: ${s.implication}`).join('\n');
}

function formatLzMatrix(lzMatrixData) {
  if (!lzMatrixData?.matrix) return 'No landing zone matrix generated yet.';

  const lines = ['4x5 Landing Zone Matrix (LOB x Journey):'];
  for (const [lob, journeys] of Object.entries(lzMatrixData.matrix)) {
    for (const [journey, cell] of Object.entries(journeys)) {
      if (cell?.score > 0) {
        lines.push(`  ${lob}/${journey}: Score ${cell.score}/10${cell.play ? ` | Play: ${cell.play}` : ''}${cell.rationale ? ` | ${cell.rationale}` : ''}`);
      }
    }
  }
  return lines.join('\n');
}

function formatUnconsidered(lzMatrixData) {
  const needs = lzMatrixData?.unconsidered;
  if (!needs?.length) return 'No unconsidered needs identified yet.';
  return needs.map(n =>
    `- [${n.category}] ${n.need}${n.evidence ? `: ${n.evidence}` : ''}${n.backbaseCapability ? ` (Backbase: ${n.backbaseCapability})` : ''}`
  ).join('\n');
}

function formatChallenges(lzMatrixData) {
  const challenges = lzMatrixData?.challenges;
  if (!challenges?.length) return 'No challenges documented.';
  return challenges.map(c =>
    `- ${c.challenge}${c.dataSource ? ` [Source: ${c.dataSource}]` : ''}${c.relatedInitiative ? ` -> ${c.relatedInitiative}` : ''}`
  ).join('\n');
}

function formatEngagementZones(bankData) {
  const zones = bankData?.backbase_qualification?.engagement_banking_zones || [];
  if (!zones.length) return 'No engagement zones mapped.';
  return zones.map(z => `- [${z.priority || 'N/A'}] ${z.zone}: ${z.detail || ''}`).join('\n');
}

function formatNews(newsItems) {
  if (!newsItems?.length) return 'No recent news found.';
  return newsItems.slice(0, 20).map(n =>
    `- "${n.title}" (${n.source || 'Unknown'}, ${n.date || 'recent'})`
  ).join('\n');
}


// ===============================================
// EVIDENCE GATHERING
// ===============================================

async function gatherStorylineEvidence(bankName, country, meetingContext = null) {
  const cleanCountry = (country || '').split('/')[0].trim() || 'global';

  const queries = [
    `"${bankName}" digital banking transformation 2025 2026`,
    `"${bankName}" customer experience strategy`,
    `"${bankName}" technology modernization fintech partnership`,
    `BCG McKinsey digital banking transformation 2025 2026`,
    `banking digital transformation trends ${cleanCountry} 2025`,
    `fintech disruption banking ${cleanCountry}`,
    `digital banking customer experience expectations 2025`,
    `"${bankName}" competitors digital banking`,
  ];

  // Add topic-specific queries when meeting context is provided
  if (meetingContext?.topics?.length) {
    for (const topic of meetingContext.topics.slice(0, 3)) {
      queries.push(`"${bankName}" ${topic} strategy 2025 2026`);
      queries.push(`${topic} banking digital transformation trends 2025`);
    }
    console.log(`   + ${meetingContext.topics.length * 2} topic-specific queries from meeting context`);
  }

  console.log(`   Searching ${queries.length} news sources...`);

  const allResults = [];
  // Staggered parallel search (batches of 3)
  for (let i = 0; i < queries.length; i += 3) {
    const batch = queries.slice(i, i + 3);
    const batchResults = await Promise.all(
      batch.map(q => searchGoogleNews(q, 5))
    );
    for (const items of batchResults) {
      allResults.push(...items);
    }
    if (i + 3 < queries.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Deduplicate by title
  const seen = new Set();
  const unique = [];
  for (const item of allResults) {
    const key = item.title.toLowerCase().substring(0, 50);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  console.log(`   Found ${unique.length} unique news items`);
  return unique;
}


// ===============================================
// CLAUDE SYSTEM PROMPT
// ===============================================

const DISCOVERY_STORYLINE_SYSTEM_PROMPT = `You are a senior Backbase Value Consultant crafting a persuasive first discovery meeting storyline. Your goal: create an inspirational, evidence-grounded, 7-act narrative that convinces the prospect that Backbase deeply understands their challenges and is the best partner for digital banking transformation.

## Narrative Principles

1. INSPIRATIONAL: Paint a vision of what is possible, not just what is broken. The prospect should leave feeling excited.
2. EVIDENCE-GROUNDED: Every claim must cite a specific source (bank data field, news article, case study, or industry report).
3. BANK-SPECIFIC: Generic talking points are worthless. Reference THIS bank's specific reality.
4. PROVOCATIVE: Surface unconsidered needs they have not thought of. Show you see further than their own team.
5. CONSERVATIVE ROI: All financial estimates must be labeled illustrative with clear caveats.
6. CONVERSATIONAL: Each act should include talking points the consultant can use naturally. Not a script, a guide.

## Act Structure

### Act 1: Market Context ("The World is Changing")
Set the stage with industry-level forces. Reference specific thought leadership insights (BCG, McKinsey, Gartner). Use regional trends. Create healthy urgency.

### Act 2: Your Reality ("We Understand You")
Demonstrate deep knowledge of THIS bank. Reference their specific pain points, digital strategy, strategic initiatives, signals, and challenges. Show homework no competitor has done.

### Act 3: Customer Lens ("Your Customers Expect More")
Shift to the end-customer perspective. Use CX data, sentiment scores, app ratings if available. Reference fintech competitors setting new expectations. Highlight generational shifts.

### Act 4: Competitive Landscape ("The Race")
Who is moving faster? What are the specific competitive threats? Include fintech disruption. Paint what happens if they do not act.

### Act 5: Art of the Possible ("Our Vision")
Introduce the Backbase vision as a possibility, not a sales pitch. Map pain points to solutions. Surface 2-3 unconsidered needs. Show AI-powered capabilities.

### Act 6: Proof Points ("We Have Done This Before")
Match relevant case studies by bank type, geography, and size. Provide specific ROI numbers. Calculate illustrative ROI range for THIS bank.

### Act 7: Call to Action ("Let Us Explore Together")
Propose concrete next steps. Suggest discovery workshop format. Identify 2-3 quick wins. Make it easy to say yes.

## Output Format
Return ONLY valid JSON. No markdown, no commentary outside the JSON structure.`;


// ===============================================
// PROMPT BUILDER
// ===============================================

function buildStorylinePrompt({ bankName, bankData, lzMatrixData, newsItems, domainKnowledge, roiExamplesText, roiLearningsText, meetingContext }) {
  const sections = [];

  sections.push(`## Bank: ${bankName}`);
  sections.push(`Country: ${bankData.country || 'Unknown'}`);
  sections.push(`Tagline: ${bankData.tagline || 'N/A'}`);

  sections.push(`\n### Bank Overview\n${(bankData.overview || 'No overview available.').substring(0, 2000)}`);
  sections.push(`\n### Key Metrics\n${formatKpis(bankData.kpis)}`);

  if (bankData.financials) {
    sections.push(`\n### Financial Position\n${bankData.financials.substring(0, 1000)}`);
  }

  sections.push(`\n### Digital Strategy\n${(bankData.digital_strategy || 'Unknown').substring(0, 1500)}`);

  if (bankData.strategic_initiatives) {
    sections.push(`\n### Strategic Initiatives\n${bankData.strategic_initiatives.substring(0, 1000)}`);
  }

  sections.push(`\n### Pain Points\n${formatPainPoints(bankData.pain_points)}`);
  sections.push(`\n### Signals and Recent Developments\n${formatSignals(bankData.signals)}`);

  // CX Data
  const cxParts = [];
  if (bankData.cx_strengths?.length) cxParts.push(`CX Strengths: ${bankData.cx_strengths.join(', ')}`);
  if (bankData.cx_weaknesses) cxParts.push(`CX Weaknesses: ${bankData.cx_weaknesses}`);
  if (bankData.customer_sentiment) cxParts.push(`Customer Sentiment: ${bankData.customer_sentiment}`);
  if (bankData.sentiment_scores) {
    const ss = bankData.sentiment_scores;
    cxParts.push(`Sentiment Scores: Mobile=${ss.mobile_app || 'N/A'}, Service=${ss.customer_service || 'N/A'}, Digital=${ss.digital_features || 'N/A'}, Trust=${ss.trust || 'N/A'}, Innovation=${ss.innovation || 'N/A'}`);
  }
  if (cxParts.length > 0) {
    sections.push(`\n### Customer Experience\n${cxParts.join('\n')}`);
  }

  sections.push(`\n### Competitive Position\n${(bankData.competitive_position || 'Unknown').substring(0, 1500)}`);
  sections.push(`\n### Engagement Banking Zones\n${formatEngagementZones(bankData)}`);

  if (bankData.backbase_landing_zones?.length > 0) {
    const lzText = bankData.backbase_landing_zones.map(z =>
      `- ${z.zone} (Fit: ${z.fit_score}/10): ${z.rationale || ''}`
    ).join('\n');
    sections.push(`\n### Backbase Landing Zones\n${lzText}`);
  }

  sections.push(`\n### Landing Zone Matrix\n${formatLzMatrix(lzMatrixData)}`);
  sections.push(`\n### Unconsidered Needs\n${formatUnconsidered(lzMatrixData)}`);
  sections.push(`\n### Bank Challenges\n${formatChallenges(lzMatrixData)}`);

  if (bankData.key_decision_makers?.length > 0) {
    const kdmText = bankData.key_decision_makers.slice(0, 8).map(k =>
      `- ${k.name} (${k.role}): ${k.note || ''}`
    ).join('\n');
    sections.push(`\n### Key Decision Makers\n${kdmText}`);
  }

  if (bankData.points_of_interest?.length > 0) {
    const poiText = bankData.points_of_interest.slice(0, 5).map(p =>
      typeof p === 'string' ? `- ${p}` : `- ${p.title || p.point || JSON.stringify(p)}`
    ).join('\n');
    sections.push(`\n### Points of Interest\n${poiText}`);
  }

  if (bankData.recommended_approach) {
    sections.push(`\n### Recommended Approach\n${bankData.recommended_approach.substring(0, 1000)}`);
  }

  if (bankData.backbase_qualification) {
    const q = bankData.backbase_qualification;
    const qParts = [];
    if (q.score) qParts.push(`Qualification Score: ${q.score}/10 (${q.label || ''})`);
    if (q.deal_size) qParts.push(`Deal Size: ${q.deal_size}`);
    if (q.timing) qParts.push(`Timing: ${q.timing}`);
    if (q.opinion) qParts.push(`Opinion: ${q.opinion}`);
    if (qParts.length > 0) {
      sections.push(`\n### Qualification\n${qParts.join('\n')}`);
    }
  }

  const aiOps = bankData.backbase_qualification?.ai_opportunities || [];
  if (aiOps.length > 0) {
    sections.push(`\n### AI Opportunities\n${aiOps.map(a => `- ${a.zone}: ${a.detail || ''}`).join('\n')}`);
  }

  sections.push(`\n### Recent News and Thought Leadership\n${formatNews(newsItems)}`);

  if (domainKnowledge) {
    sections.push(`\n### Backbase Domain Knowledge\n${domainKnowledge.substring(0, 6000)}`);
  }

  if (roiExamplesText) {
    sections.push(`\n### ROI Case Studies (for matching to this bank)\n${roiExamplesText.substring(0, 8000)}`);
  }

  if (roiLearningsText) {
    sections.push(`\n### ROI Engagement Learnings\n${roiLearningsText.substring(0, 3000)}`);
  }

  sections.push(`\n---\n\n## YOUR TASK\n
Generate a 7-act discovery meeting storyline for ${bankName}. Return ONLY valid JSON:

{
  "executiveSummary": "3-sentence hook summarizing why this bank should partner with Backbase",
  "bankSpecificHook": "A compelling opening line tailored to this bank (something the consultant says in the first 30 seconds)",
  "acts": [
    {
      "id": "market_context",
      "title": "The World is Changing",
      "subtitle": "A subtitle specific to this bank region or context",
      "narrative": "2-3 paragraphs of compelling narrative for this act. Write as if briefing a consultant.",
      "keyPoints": [
        { "point": "A specific quotable insight", "source": "Name of report, data field, or news article", "sourceType": "thought_leadership" }
      ],
      "talkingPoints": ["A provocative question or statement the consultant can use in conversation"]
    },
    {
      "id": "your_reality",
      "title": "Your Reality",
      "subtitle": "What we understand about ${bankName}",
      "narrative": "...",
      "keyPoints": [{ "point": "...", "source": "...", "sourceType": "bank_data" }],
      "talkingPoints": ["..."]
    },
    {
      "id": "customer_lens",
      "title": "Your Customers Expect More",
      "subtitle": "...",
      "narrative": "...",
      "keyPoints": [{ "point": "...", "source": "...", "sourceType": "bank_data" }],
      "talkingPoints": ["..."]
    },
    {
      "id": "competitive_landscape",
      "title": "The Race",
      "subtitle": "...",
      "narrative": "...",
      "keyPoints": [{ "point": "...", "source": "...", "sourceType": "news" }],
      "talkingPoints": ["..."]
    },
    {
      "id": "art_of_possible",
      "title": "The Art of the Possible",
      "subtitle": "...",
      "narrative": "...",
      "keyPoints": [{ "point": "...", "source": "...", "sourceType": "bank_data" }],
      "talkingPoints": ["..."]
    },
    {
      "id": "proof_points",
      "title": "We Have Done This Before",
      "subtitle": "...",
      "narrative": "...",
      "keyPoints": [{ "point": "...", "source": "...", "sourceType": "case_study" }],
      "talkingPoints": ["..."]
    },
    {
      "id": "call_to_action",
      "title": "Let Us Explore Together",
      "subtitle": "...",
      "narrative": "...",
      "keyPoints": [{ "point": "...", "source": "...", "sourceType": "bank_data" }],
      "talkingPoints": ["..."]
    }
  ],
  "illustrativeRoi": {
    "headline": "$X-YM potential value over N years",
    "comparison": "Similar to what [matched case study bank] achieved with [X] percent ROI",
    "levers": [
      { "lever": "Lever name", "range": "$X-$YM", "confidence": "high", "basis": "Based on [case study name] engagement" }
    ],
    "caveats": [
      "Illustrative only, based on similar engagements, not validated with client data",
      "Requires discovery workshop to establish baseline metrics and validate assumptions",
      "Conservative estimates using moderate scenario assumptions"
    ]
  },
  "nextSteps": {
    "proposedApproach": "Recommended engagement approach and format",
    "quickWins": ["Quick win 1 with timeline", "Quick win 2 with timeline"],
    "timeline": "Discovery: X weeks | Assessment: Y weeks | Proof of Value: Z weeks",
    "workshop": "Proposed workshop format and duration"
  }
}

IMPORTANT RULES:
- Every keyPoint must cite a source (bank data field, news article, or case study)
- sourceType must be one of: thought_leadership, bank_data, news, case_study
- ROI numbers must be illustrative and conservative, always include caveats
- Match case studies by: (1) segment match, (2) geography proximity, (3) bank size similarity
- Surface at least 2 unconsidered needs in Act 5
- Act 6 must reference specific case study numbers from the ROI examples provided
- Act 7 must propose concrete next steps, not generic advice
- Each act must have at least 3 keyPoints and 2 talkingPoints
- The narrative in each act should be 150-300 words`);

  // Inject meeting context when available — tailors the entire storyline
  if (meetingContext) {
    sections.push(`\n\n### ═══ MEETING CONTEXT — TAILOR THE STORYLINE ═══`);
    if (meetingContext.topics?.length) {
      sections.push(`Meeting topics to focus on: ${meetingContext.topics.join(', ')}`);
    }
    if (meetingContext.attendees?.length) {
      const attendeeList = meetingContext.attendees.map(a =>
        `${a.name} (${a.customRole || a.role || 'Unknown'})`
      ).join(', ');
      sections.push(`Meeting attendees: ${attendeeList}`);
    }
    if (meetingContext.scopeText) {
      sections.push(`Known scope: ${meetingContext.scopeText}`);
    }
    if (meetingContext.painText) {
      sections.push(`Known pain points: ${meetingContext.painText}`);
    }
    if (meetingContext.meetingPrepSummary) {
      sections.push(`Meeting prep intelligence: ${meetingContext.meetingPrepSummary.substring(0, 500)}`);
    }
    sections.push(`
CRITICAL TAILORING INSTRUCTIONS:
- Act 1 (Market Context): Focus market forces on ${meetingContext.topics?.join(', ') || 'the meeting themes'}
- Act 2 (Your Reality): Emphasize evidence related to ${meetingContext.topics?.join(', ') || 'the meeting themes'}
- Act 3 (Customer Lens): Frame customer expectations around ${meetingContext.topics?.join(', ') || 'digital banking'}
- Act 5 (Art of the Possible): Propose Backbase solutions specifically for ${meetingContext.topics?.join(', ') || 'the topics discussed'}
- Act 7 (Call to Action): Propose next steps that are relevant to ${meetingContext.attendees?.[0]?.role || 'the attendee'}'s decision-making authority
- Use talking points that would resonate with: ${meetingContext.attendees?.map(a => a.customRole || a.role).join(', ') || 'the audience'}`);
  }

  return sections.join('\n');
}


// ===============================================
// MAIN ORCHESTRATOR
// ===============================================

export async function generateDiscoveryStoryline({ bankName, bankKey, bankData, lzMatrixData, meetingContext }) {
  const startTime = Date.now();
  const isTailored = !!meetingContext;
  console.log(`\n[Storyline Agent] Generating discovery storyline for ${bankName}${isTailored ? ' (meeting-tailored: ' + (meetingContext.topics || []).join(', ') + ')' : ''}`);

  // Step 1: Detect relevant LOBs
  const relevantLobs = detectRelevantLobs(bankData || {}, lzMatrixData);
  console.log(`   Relevant LOBs: ${relevantLobs.join(', ')}`);

  // Step 2: Gather news evidence (with optional topic-specific queries)
  const newsItems = await gatherStorylineEvidence(bankName, bankData?.country, meetingContext);

  // Step 3: Load domain knowledge for relevant LOBs
  const domainChunks = [];
  for (const lob of relevantLobs) {
    const dk = loadDomainKnowledge(lob);
    if (dk) domainChunks.push(dk);
  }
  const domainKnowledge = domainChunks.join('\n\n---\n\n');
  console.log(`   Loaded domain knowledge for ${relevantLobs.length} LOBs`);

  // Step 4: Load ROI examples and learnings
  const roiExamplesText = loadRoiExamples();
  const roiLearningsText = loadRoiLearnings();
  console.log(`   Loaded ROI examples (${roiExamplesText.length} chars) and learnings (${roiLearningsText.length} chars)`);

  // Step 5: Build the full prompt (with optional meeting context)
  const userMessage = buildStorylinePrompt({
    bankName, bankData: bankData || {}, lzMatrixData,
    newsItems, domainKnowledge, roiExamplesText, roiLearningsText, meetingContext,
  });
  console.log(`   Prompt built: ${userMessage.length} chars`);

  // Step 6: Call Claude (8192 tokens for rich narrative)
  console.log(`   Calling Claude for 7-act storyline synthesis...`);
  let rawResponse;
  try {
    rawResponse = await callClaude(DISCOVERY_STORYLINE_SYSTEM_PROMPT, userMessage, { maxTokens: 8192, timeout: 150000 });
    console.log(`   Claude response: ${rawResponse.length} chars`);
  } catch (claudeErr) {
    console.error(`   Claude call failed: ${claudeErr.message}`);
    console.log(`   Falling back to basic storyline...`);
    return buildFallbackResult(bankData || {}, bankName, startTime);
  }

  // Step 7: Parse JSON response
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in Claude response');

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.acts || !Array.isArray(parsed.acts) || parsed.acts.length < 5) {
      throw new Error(`Invalid acts structure: got ${parsed.acts?.length || 0} acts, expected 7`);
    }

    for (const act of parsed.acts) {
      if (!act.id || !act.title || !act.narrative) {
        console.warn(`   Warning: act missing fields: ${JSON.stringify(act).substring(0, 100)}`);
      }
    }

    const durationMs = Date.now() - startTime;
    parsed.generatedAt = new Date().toISOString();
    parsed._meta = {
      source: 'discovery-storyline-agent',
      durationMs,
      newsArticles: newsItems.length,
      lobsAnalyzed: relevantLobs,
      caseStudiesMatched: (parsed.illustrativeRoi?.levers?.length || 0),
      bankKey,
    };

    console.log(`   Storyline generated successfully in ${durationMs}ms`);
    return parsed;

  } catch (parseErr) {
    console.error(`   JSON parse failed: ${parseErr.message}`);
    console.log(`   Falling back to basic storyline...`);
    return buildFallbackResult(bankData || {}, bankName, startTime);
  }
}


// ===============================================
// FALLBACK
// ===============================================

function buildFallbackResult(bankData, bankName, startTime) {
  return {
    executiveSummary: `${bankName} is navigating digital transformation challenges common to the banking industry. Based on available intelligence, there are clear opportunities for Backbase to add value across multiple lines of business.`,
    bankSpecificHook: `Based on our research into ${bankName}, we see significant opportunities to accelerate your digital banking transformation.`,
    acts: ACT_IDS.map(id => ({
      id,
      title: ACT_TITLES[id],
      subtitle: `Analysis for ${bankName}`,
      narrative: getFallbackNarrative(id, bankData, bankName),
      keyPoints: getFallbackKeyPoints(id, bankData),
      talkingPoints: getFallbackTalkingPoints(id),
    })),
    illustrativeRoi: {
      headline: 'ROI estimate requires AI analysis',
      comparison: 'Run AI analysis for case study matching',
      levers: [],
      caveats: ['This is a fallback storyline. Run AI analysis for the full evidence-grounded narrative.'],
    },
    nextSteps: {
      proposedApproach: 'Discovery Workshop to validate pain points and opportunities',
      quickWins: ['Digital journey audit (2 weeks)', 'Competitive UX benchmark (1 week)'],
      timeline: 'Discovery: 2-3 weeks | Assessment: 4-6 weeks',
      workshop: 'Half-day Ignite Inspire workshop',
    },
    generatedAt: new Date().toISOString(),
    _meta: {
      source: 'discovery-storyline-agent-fallback',
      durationMs: Date.now() - startTime,
      newsArticles: 0,
      lobsAnalyzed: ['retail'],
      caseStudiesMatched: 0,
    },
  };
}

function getFallbackNarrative(actId, bankData, bankName) {
  const narratives = {
    market_context: `The global banking industry is undergoing unprecedented digital transformation. According to industry analysts, banks that fail to modernize their digital engagement layer risk losing customers to fintech challengers and digital-native competitors. This trend is accelerating in ${bankData.country || 'the region'}, where customer expectations are rapidly evolving.`,
    your_reality: `${bankName} faces several strategic challenges. ${(bankData.pain_points || []).slice(0, 2).map(p => p.title).join('. ') || 'Digital transformation and customer engagement modernization are key priorities.'}. The bank's current digital strategy indicates awareness of these challenges, but execution speed and platform capabilities may be limiting progress.`,
    customer_lens: `Today's banking customers expect seamless, personalized digital experiences. ${bankData.cx_weaknesses ? `Areas for improvement include: ${bankData.cx_weaknesses}` : 'Customer experience benchmarking would reveal specific improvement opportunities.'}`,
    competitive_landscape: `${bankData.competitive_position ? bankData.competitive_position.substring(0, 300) : `The competitive landscape in ${bankData.country || 'this market'} is intensifying, with both traditional banks and fintech players investing heavily in digital capabilities.`}`,
    art_of_possible: `Backbase's engagement banking platform offers a fundamentally different approach. Rather than replacing core systems, Backbase creates a unified digital engagement layer that orchestrates experiences across all channels and customer segments. ${(bankData.backbase_landing_zones || []).length > 0 ? `Key opportunity areas include: ${bankData.backbase_landing_zones.slice(0, 3).map(z => z.zone).join(', ')}.` : ''}`,
    proof_points: `Backbase has delivered measurable results for banks globally. Engagements with similar institutions have demonstrated ROI ranging from 66% to 167% over 5-year periods, with payback periods as short as 1-2 years. Specific case studies will be matched during the AI analysis.`,
    call_to_action: `We propose starting with a focused discovery workshop to validate the opportunities identified and build a shared understanding of priorities. This would be followed by a structured value assessment to quantify the business case.`,
  };
  return narratives[actId] || `Analysis for ${bankName} in this area requires AI-powered research.`;
}

function getFallbackKeyPoints(actId, bankData) {
  const painPoints = bankData.pain_points || [];
  const signals = bankData.signals || [];

  if (actId === 'your_reality' && painPoints.length > 0) {
    return painPoints.slice(0, 3).map(p => ({
      point: `${p.title}: ${p.detail}`,
      source: 'Bank intelligence data',
      sourceType: 'bank_data',
    }));
  }
  if (actId === 'competitive_landscape' && signals.length > 0) {
    return signals.slice(0, 3).map(s => ({
      point: s.signal,
      source: s.implication || 'Market signal',
      sourceType: 'news',
    }));
  }
  return [{ point: 'Run AI analysis for detailed evidence-grounded insights', source: 'System', sourceType: 'bank_data' }];
}

function getFallbackTalkingPoints(actId) {
  const points = {
    market_context: ['What trends are you seeing that concern you most about the competitive landscape?', 'How does your digital transformation timeline compare to what you see from peers?'],
    your_reality: ['What would you say is your biggest barrier to digital transformation today?', 'If you could solve one pain point this year, what would it be?'],
    customer_lens: ['How do you measure customer satisfaction with your digital channels today?', 'What feedback are you hearing from your youngest customer segments?'],
    competitive_landscape: ['Which competitor digital experience do you admire most, and why?', 'How do you think about the fintech threat in your market?'],
    art_of_possible: ['What if you could modernize the customer experience without replacing your core?', 'Where would you start if you had a platform that could orchestrate all channels?'],
    proof_points: ['Would it be helpful to connect you with a reference bank in a similar position?', 'What ROI metrics matter most to your executive team?'],
    call_to_action: ['Would a half-day discovery workshop with your key stakeholders be feasible?', 'Who else should be involved in this conversation?'],
  };
  return points[actId] || ['How do you see this evolving?'];
}


// ===============================================
// AVAILABILITY CHECK
// ===============================================

export function isDiscoveryStorylineAvailable() {
  return isApiKeyConfigured();
}
