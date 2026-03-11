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

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const DELAY = 1000; // 1s between API calls to respect rate limits

// ── Claude API Call ──

async function callClaude(systemPrompt, userMessage, maxTokens = 1024) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

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
    const response = await callClaude(NEWS_SYSTEM_PROMPT, userMessage, 1024);
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
    const response = await callClaude(INTEL_SYSTEM_PROMPT, userMessage, 1024);
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
  return !!process.env.ANTHROPIC_API_KEY;
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
