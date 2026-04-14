/**
 * Job Signal Fetcher
 * ──────────────────
 * Detects hiring signals that indicate digital transformation activity
 * at tracked banks. Uses Google News RSS as a proxy for LinkedIn/Indeed.
 *
 * Signal types detected:
 *   - C-suite departures/appointments (CEO, CTO, CDO, CIO)
 *   - "Digital transformation" hiring surges
 *   - Core banking migration roles
 *   - Head of Digital / Chief Digital Officer roles
 *   - Platform/API engineering team buildouts
 */

import { BANK_SOURCES, PIPELINE_CONFIG } from '../config.mjs';

const TIMEOUT = PIPELINE_CONFIG.rateLimits.timeoutMs;
const DELAY = PIPELINE_CONFIG.rateLimits.requestDelayMs;

// Job-specific search templates
const JOB_QUERIES = [
  {
    name: 'Leadership Changes',
    template: (bankName) =>
      `"${bankName}" (CEO OR CTO OR CIO OR CDO OR "chief digital" OR "chief technology") (appoint OR hire OR resign OR depart OR join)`,
  },
  {
    name: 'Digital Transformation Hiring',
    template: (bankName) =>
      `"${bankName}" ("digital transformation" OR "core banking migration" OR "platform modernization") (hire OR recruit OR team OR role)`,
  },
];

/**
 * Fetch job-related news for a single bank via Google News RSS
 */
async function fetchBankJobSignals(bankName) {
  const results = [];

  for (const query of JOB_QUERIES) {
    const searchTerm = query.template(bankName);
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchTerm)}&hl=en&gl=US&ceid=US:en`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketIntelligence/1.0)' },
      });
      clearTimeout(timer);

      if (!res.ok) continue;
      const xml = await res.text();

      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      let count = 0;
      while ((match = itemRegex.exec(xml)) !== null && count < 5) {
        const itemXml = match[1];
        const title = extractTag(itemXml, 'title');
        const link = extractTag(itemXml, 'link');
        const pubDate = extractTag(itemXml, 'pubDate');
        const source = extractTag(itemXml, 'source');

        if (title) {
          results.push({
            title: cleanHtml(title),
            link: link || null,
            publishedAt: pubDate ? safeDate(pubDate) : null,
            snippet: null,
            source: source ? `${cleanHtml(source)} (${query.name})` : query.name,
            queryType: query.name,
          });
          count++;
        }
      }
    } catch {
      // Silently skip failed queries
    }

    await sleep(DELAY);
  }

  return results;
}

/**
 * Fetch job signals for all tracked banks.
 * Only queries banks likely to have public hiring signals.
 */
export async function fetchAllJobSignals(onProgress) {
  const results = {};
  const banks = Object.entries(BANK_SOURCES);
  const priorityBanks = banks.filter(([, cfg]) => cfg.ticker || cfg.irUrl);
  let completed = 0;

  for (const [bankKey, cfg] of priorityBanks) {
    onProgress?.({ completed, total: priorityBanks.length, bank: cfg.name });

    const signals = await fetchBankJobSignals(cfg.name);
    if (signals.length > 0) {
      results[bankKey] = {
        bankKey,
        bankName: cfg.name,
        articles: signals,
        count: signals.length,
        fetchedAt: new Date().toISOString(),
      };
    }

    completed++;
  }

  return results;
}

// ── Helpers ──

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`
  ));
  return match ? (match[1] || match[2] || '').trim() : null;
}

function cleanHtml(str) {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function safeDate(str) {
  try { return new Date(str).toISOString(); } catch { return null; }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
