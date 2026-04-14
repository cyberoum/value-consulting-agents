/**
 * AI Signal Classifier
 * ────────────────────
 * Uses Claude API to batch-classify raw articles into actionable signals
 * for value consultants. Produces:
 *   - Relevance score (0-10)
 *   - Signal type (strategic, competitive, regulatory, hiring, financial, product)
 *   - Implication: the "so what" for a Backbase sales consultant
 *   - Priority: high/medium/low
 *
 * Cost optimization:
 *   - Pre-filters via keyword heuristics (skip articles with 0 signal keywords)
 *   - Batches up to 15 articles per Claude call (~6 calls per full refresh)
 *   - Uses claude-sonnet for quality at reasonable cost (~$0.02/batch)
 */

import { callClaude, isApiKeyConfigured } from './claudeClient.mjs';

const BATCH_SIZE = 15; // Articles per Claude API call
const CLASSIFY_TIMEOUT = 90000; // 90s per batch

// Signal keywords for pre-filtering — intentionally broad to avoid false negatives.
// Better to send a few extra articles to Claude than to miss a real signal.
const SIGNAL_PATTERNS = {
  transformation: /digital transformation|moderniz|technology overhaul|platform migration|digital strategy|digital banking/i,
  leadership: /CEO|CTO|CIO|CDO|appoint|resign|hire|depart|new.*chief|leadership|executive|board.*director/i,
  restructuring: /restructur|layoff|lay off|cut.*staff|cut.*job|redundanc|reorganiz|cost.?cutting|headcount/i,
  investment: /invest|funding|budget|allocat|spend|\d+.*million|\d+.*billion|capital|growth.*strateg/i,
  partnership: /partner|alliance|collaboration|teaming|joint venture|select|vendor|contract/i,
  competition: /RFP|vendor selection|evaluate|shortlist|contract award|chose|backbase|temenos|thought ?machine|mambu|finastra/i,
  acquisition: /acqui|merger|M&A|takeover|bought|purchase|consolidat/i,
  regulation: /regulat|compliance|fine|penalty|sanction|GDPR|PSD2|MiCA|AML|anti.?money|KYC|supervisory|FSA|watchdog|probe/i,
  product: /launch|release|new.*app|new.*feature|new.*platform|rebrand|open.?banking|API|BaaS/i,
  financial: /quarterly|earnings|profit|revenue|Q[1-4].*result|annual report|buyback|dividend/i,
  cloud: /cloud|AWS|Azure|GCP|migration|SaaS|infra/i,
  customer: /customer experience|CX|NPS|churn|onboarding|mobile banking|app rating|digital channel/i,
};

const SYSTEM_PROMPT = `You are a market intelligence analyst for Backbase, a digital banking platform vendor.

Your job: classify news articles about banks to determine if they represent actionable sales signals for Backbase value consultants.

For each article, provide:
1. relevance_score (0-10): How relevant is this to Backbase's sales pipeline?
   - 8-10: Direct buying signal (platform RFP, digital transformation budget, CEO mandate)
   - 6-7: Strong indicator (core banking pain, competitor weakness, regulatory pressure)
   - 4-5: Moderate (general industry trend, no specific Backbase angle)
   - 0-3: Noise (unrelated financial news, general corporate)
2. signal_type: One of: strategic, competitive, regulatory, hiring, financial, product
3. implication: A 1-2 sentence "so what" for a Backbase consultant preparing for a meeting.
   Write as if briefing a colleague: "This means..." or "This creates an opportunity because..."
4. priority: high (score 8+), medium (score 5-7), low (score <5)

Context: Backbase sells digital banking platforms (engagement banking, journey orchestration, smart money, lending). Our target buyers are Head of Digital, CTO, Head of Channels at retail banks and credit unions.

IMPORTANT: Only score 6+ if there's a clear connection to digital banking platform decisions. Generic banking news scores low.

Respond with a JSON array matching the input order. No markdown, just valid JSON.`;

/**
 * Pre-filter articles using keyword heuristics.
 * Returns articles likely to be relevant (at least 1 signal keyword match).
 */
export function preFilterArticles(articles) {
  return articles.filter(article => {
    const text = `${article.title} ${article.snippet || ''}`;
    return Object.values(SIGNAL_PATTERNS).some(pattern => pattern.test(text));
  });
}

/**
 * Classify a batch of articles using Claude.
 * Returns array of { relevance_score, signal_type, implication, priority }
 */
async function classifyBatch(articles) {
  const input = articles.map((a, i) => ({
    id: i,
    bank: a.bankName || 'Unknown',
    title: a.title,
    snippet: (a.snippet || '').substring(0, 200),
    source: a.source,
  }));

  const userMessage = `Classify these ${articles.length} articles:\n\n${JSON.stringify(input, null, 2)}`;

  const response = await callClaude(SYSTEM_PROMPT, userMessage, {
    maxTokens: 2048,
    timeout: CLASSIFY_TIMEOUT,
  });

  // Parse JSON response — handle potential markdown wrapping
  let cleaned = response.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error('Expected array');
    return parsed;
  } catch (err) {
    console.warn(`  [signalClassifier] Failed to parse Claude response: ${err.message}`);
    // Return empty classifications for this batch
    return articles.map(() => ({
      relevance_score: 0,
      signal_type: 'unknown',
      implication: '',
      priority: 'low',
    }));
  }
}

/**
 * Classify all articles in batches.
 *
 * @param {Array} articles - Array of { title, snippet, source, bankKey, bankName }
 * @param {Function} onProgress - Progress callback
 * @returns {Array} Articles with classification fields added
 */
export async function classifySignals(articles, onProgress) {
  if (!isApiKeyConfigured()) {
    console.warn('  [signalClassifier] ANTHROPIC_API_KEY not set — skipping AI classification');
    return articles.map(a => ({ ...a, relevance_score: 0, signal_type: 'unclassified', implication: '', priority: 'low' }));
  }

  if (articles.length === 0) return [];

  const results = [];
  const batches = [];

  // Split into batches
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    batches.push(articles.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    onProgress?.({ completed: i, total: batches.length, batchSize: batch.length });

    try {
      const classifications = await classifyBatch(batch);

      // Merge classifications back onto articles
      for (let j = 0; j < batch.length; j++) {
        const cls = classifications[j] || { relevance_score: 0, signal_type: 'unknown', implication: '', priority: 'low' };
        results.push({
          ...batch[j],
          relevance_score: cls.relevance_score || 0,
          signal_type: cls.signal_type || 'unknown',
          implication: cls.implication || '',
          priority: cls.priority || 'low',
        });
      }
    } catch (err) {
      console.warn(`  [signalClassifier] Batch ${i + 1} failed: ${err.message}`);
      // Add unclassified entries for failed batch
      for (const article of batch) {
        results.push({
          ...article,
          relevance_score: 0,
          signal_type: 'error',
          implication: `Classification failed: ${err.message}`,
          priority: 'low',
        });
      }
    }
  }

  return results;
}
