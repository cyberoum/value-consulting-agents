/**
 * Claude AI Analyzer
 * Uses the Anthropic Claude API to perform deep analysis:
 *   1. News article insight extraction
 *   2. Competitive intelligence structuring
 *   3. Strategic signal classification
 *
 * Requires: ANTHROPIC_API_KEY environment variable
 * Falls back gracefully when API key is not available.
 */

import { BANK_SOURCES, PIPELINE_CONFIG } from '../config.mjs';
import { callClaude, isApiKeyConfigured } from './claudeClient.mjs';

const DELAY = 1000; // 1s between API calls to respect rate limits

// ── News Insight Extraction ──

const NEWS_SYSTEM_PROMPT = `You are a market intelligence analyst for Backbase (an engagement banking platform vendor).
Analyze news articles about banks and extract structured intelligence.

Return ONLY valid JSON with this structure:
{
  "summary": "1-2 sentence summary",
  "signals": [
    {
      "type": "transformation|leadership|investment|partnership|competition|regulation|product|financial",
      "signal": "What happened",
      "implication": "What this means for Backbase sales opportunity",
      "urgency": "high|medium|low"
    }
  ],
  "backbaseRelevance": "high|medium|low",
  "relevanceReason": "Why this matters for Backbase",
  "suggestedActions": ["Action 1", "Action 2"]
}`;

export async function analyzeNewsForBank(bankName, articles) {
  if (!articles || articles.length === 0) return null;

  const articleText = articles
    .slice(0, 5) // Limit to top 5 articles
    .map((a, i) => `[${i + 1}] ${a.title}${a.description ? '\n   ' + a.description : ''}`)
    .join('\n');

  const userMessage = `Bank: ${bankName}\n\nRecent news articles:\n${articleText}\n\nAnalyze these articles and extract structured intelligence.`;

  try {
    const response = await callClaude(NEWS_SYSTEM_PROMPT, userMessage, { maxTokens: 1024, timeout: 30000 });
    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (err) {
    return { error: err.message };
  }
}

// ── Intel Structuring (enhanced version of pattern-based engine) ──

const INTEL_SYSTEM_PROMPT = `You are a market intelligence analyst for Backbase.
A consultant has submitted raw intelligence about a bank. Structure it into actionable insights.

Return ONLY valid JSON matching the category schema:

For "signal": { "signal": "...", "implication": "...", "urgency": "high|medium|low", "suggestedActions": ["..."] }
For "pain_point": { "title": "...", "detail": "...", "severity": "high|medium|low", "backbaseRelevance": "high|medium|low" }
For "leadership": { "name": "...", "role": "...", "changeType": "new_hire|departure|promotion|replacement|restructure|update", "detail": "...", "powerMapImpact": "champion|blocker|neutral|unknown" }
For "meeting_note": { "summary": "...", "keyTopics": ["..."], "extractedInsights": [{"targetCategory": "signal|pain_point|leadership|competition|qualification", ...insight_fields}], "nextSteps": ["..."] }
For "cx_insight": { "observation": "...", "sentiment": "positive|negative|neutral", "category": "strength|weakness|observation", "suggestedField": "cx_strengths|cx_weaknesses|null" }
For "competition": { "detail": "...", "vendorsMentioned": ["..."], "isWin": bool, "isLoss": bool, "isThreat": bool, "riskLevel": "high|medium|low" }
For "strategy": { "update": "...", "themes": ["..."], "timeframe": "...", "investmentSignal": bool, "transformationSignal": bool }
For "qualification": { "update": "...", "dimension": "firmographics|technographics|decision_process|landing_zones|pain_push|power_map|partner_access", "scoreDirection": "up|down|neutral", "scoreSuggestion": "+0.5|-0.5|0" }`;

export async function structureIntelWithClaude(category, rawText, bankContext = {}) {
  const userMessage = `Bank: ${bankContext.bankName || 'Unknown'}\nCategory: ${category}\n\nRaw intelligence:\n${rawText}`;

  try {
    const response = await callClaude(INTEL_SYSTEM_PROMPT, userMessage, { maxTokens: 1024, timeout: 30000 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { ...parsed, type: category, _aiGenerated: true };
    }
    return null;
  } catch (err) {
    return { error: err.message };
  }
}

// ── Deep Bank Analysis (4 types: competitive, pain_points, opportunities, executive_briefing) ──

const DEEP_ANALYSIS_PROMPTS = {
  competitive: {
    system: `You are a senior competitive intelligence analyst for Backbase, an engagement banking platform vendor.
Analyze a bank's competitive position and generate actionable intelligence for the sales team.

Return ONLY valid JSON:
{
  "title": "Competitive Analysis: [Bank Name]",
  "findings": [
    {
      "category": "Vendor Landscape|Displacement Opportunity|Competitive Threat|Differentiation Angle",
      "finding": "Key finding in 1-2 sentences",
      "detail": "Supporting analysis (2-3 sentences)",
      "actionability": "high|medium|low",
      "suggestedAction": "What the AE should do"
    }
  ],
  "topOpportunity": "The single biggest competitive opportunity in 1-2 sentences",
  "riskFactors": ["Risk 1", "Risk 2"]
}`,
    maxTokens: 2048,
  },

  pain_points: {
    system: `You are a value consultant specializing in banking digital transformation.
Analyze the bank's profile and identify the most impactful business pain points that Backbase can address.

Return ONLY valid JSON:
{
  "title": "Pain Point Discovery: [Bank Name]",
  "painPoints": [
    {
      "title": "Pain point title",
      "description": "What the pain point is (2-3 sentences)",
      "quantifiedImpact": "Estimated financial or operational impact",
      "affectedStakeholder": "CTO|COO|Head of Digital|Head of Retail|CFO",
      "backbaseSolution": "How Backbase addresses this (1-2 sentences)",
      "severity": "critical|high|medium"
    }
  ],
  "topPriority": "The #1 pain point to lead with and why"
}`,
    maxTokens: 2048,
  },

  opportunities: {
    system: `You are a strategic account planner for Backbase, an engagement banking platform.
Identify the highest-value opportunities for Backbase given the bank's profile.

Return ONLY valid JSON:
{
  "title": "Opportunity Map: [Bank Name]",
  "opportunities": [
    {
      "title": "Opportunity title",
      "description": "What the opportunity is (2-3 sentences)",
      "estimatedValue": "Rough deal size or value range",
      "entryStrategy": "How to approach this (2-3 sentences)",
      "champion": "Likely internal champion role",
      "timeline": "short-term|medium-term|long-term",
      "confidence": "high|medium|low"
    }
  ],
  "recommendedLeadWith": "Which opportunity to open with and why"
}`,
    maxTokens: 2048,
  },

  executive_briefing: {
    system: `You are a senior sales strategist preparing an AE for an executive meeting at a bank.
Generate a concise, high-impact executive briefing.

Return ONLY valid JSON:
{
  "title": "Executive Briefing: [Bank Name]",
  "openingHook": "A provocative opening statement to grab attention (1-2 sentences)",
  "talkingPoints": [
    {
      "topic": "Topic name",
      "point": "What to say (2-3 sentences)",
      "dataPoint": "Supporting metric or fact",
      "transition": "How to bridge to Backbase"
    }
  ],
  "provocativeQuestion": "A question that makes the exec think differently",
  "closingMove": "Suggested next step to propose",
  "doNots": ["Thing to avoid saying 1", "Thing to avoid saying 2"]
}`,
    maxTokens: 2048,
  },
};

export async function deepAnalyzeBank(bankName, analysisType, context) {
  const config = DEEP_ANALYSIS_PROMPTS[analysisType];
  if (!config) throw new Error(`Unknown analysis type: ${analysisType}`);

  const userMessage = `Bank: ${bankName}

Bank Profile:
${Object.entries(context).map(([k, v]) => `- ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n')}

Generate a ${analysisType.replace('_', ' ')} analysis.`;

  try {
    const response = await callClaude(config.system, userMessage, { maxTokens: config.maxTokens, timeout: 30000 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (err) {
    return { error: err.message };
  }
}

// ── Batch Analysis: process all banks with news ──

export async function analyzeAllBankNews(newsData, onProgress) {
  const results = {};
  const banks = Object.entries(newsData).filter(([, data]) => data.articles?.length > 0);
  let completed = 0;

  for (const [bankKey, data] of banks) {
    const analysis = await analyzeNewsForBank(data.name || bankKey, data.articles);
    if (analysis && !analysis.error) {
      results[bankKey] = {
        ...analysis,
        analyzedAt: new Date().toISOString(),
        articleCount: data.articles.length,
      };
    }
    completed++;
    onProgress?.({ completed, total: banks.length, bank: data.name || bankKey });
    await sleep(DELAY);
  }

  return results;
}

// ── Check if API key is available ──

export function isClaudeAvailable() {
  return isApiKeyConfigured();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run standalone
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  if (!isClaudeAvailable()) {
    console.log('⚠️  ANTHROPIC_API_KEY not set. Set it to enable AI analysis:');
    console.log('   export ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(0);
  }

  console.log('🤖 Claude AI Analyzer — testing...\n');

  // Test with a sample
  structureIntelWithClaude('meeting_note',
    'Met with the CTO yesterday. They are frustrated with their legacy platform and looking at Temenos and Backbase. Budget approved for Q3.',
    { bankName: 'Test Bank' }
  ).then(result => {
    console.log('Result:', JSON.stringify(result, null, 2));
  });
}
