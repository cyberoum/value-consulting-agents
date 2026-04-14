/**
 * Bank Press Release RSS Fetcher
 * ──────────────────────────────
 * Fetches press releases directly from banks' own RSS feeds.
 * These are first-party sources — the most reliable signal source
 * for leadership changes, quarterly results, partnerships, and
 * digital transformation announcements.
 *
 * Banks with configured rssFeed in BANK_SOURCES:
 *   - Nordea: https://www.nordea.com/en/rss/press
 *   - SEB: https://sebgroup.com/press/rss
 *   - DNB: https://www.dnb.no/en/about-us/press/rss
 *   - Danske Bank: https://danskebank.com/news-and-insights/rss
 */

import { BANK_SOURCES, PIPELINE_CONFIG } from '../config.mjs';

const TIMEOUT = PIPELINE_CONFIG.rateLimits.timeoutMs;
const DELAY = PIPELINE_CONFIG.rateLimits.requestDelayMs;
const MAX_ITEMS_PER_FEED = 15;

/**
 * Fetch and parse a bank's press release RSS feed.
 */
async function fetchPressReleaseFeed(bankKey, config) {
  if (!config.rssFeed) return [];

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const res = await fetch(config.rssFeed, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MarketIntelligence/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`  [pressReleases] ${config.name} HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const items = [];

    // Parse RSS items — handles both <item> (RSS 2.0) and <entry> (Atom)
    const itemRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < MAX_ITEMS_PER_FEED) {
      const itemXml = match[1];
      const title = extractTag(itemXml, 'title');
      const link = extractTag(itemXml, 'link') || extractAtomLink(itemXml);
      const pubDate = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'published') || extractTag(itemXml, 'updated');
      const description = extractTag(itemXml, 'description') || extractTag(itemXml, 'summary') || extractTag(itemXml, 'content');

      if (title) {
        items.push({
          title: cleanHtml(title),
          link: link || null,
          publishedAt: pubDate ? safeDate(pubDate) : null,
          snippet: description ? cleanHtml(description).substring(0, 300) : null,
          source: `${config.name} Press Release`,
          bankKey,
          bankName: config.name,
        });
      }
    }

    return items;
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn(`  [pressReleases] ${config.name} failed: ${err.message}`);
    }
    return [];
  }
}

/**
 * Fetch press releases from all banks that have configured RSS feeds.
 *
 * @param {Function} onProgress - Progress callback
 * @returns {Object} { articles, feedStats, totalArticles }
 */
export async function fetchAllPressReleases(onProgress) {
  const banksWithFeeds = Object.entries(BANK_SOURCES).filter(([, cfg]) => cfg.rssFeed);
  const allArticles = [];
  const feedStats = [];

  for (let i = 0; i < banksWithFeeds.length; i++) {
    const [bankKey, config] = banksWithFeeds[i];
    onProgress?.({ completed: i, total: banksWithFeeds.length, bank: config.name });

    const articles = await fetchPressReleaseFeed(bankKey, config);
    allArticles.push(...articles);
    feedStats.push({ bank: config.name, count: articles.length });

    if (i < banksWithFeeds.length - 1) await sleep(DELAY);
  }

  return {
    articles: allArticles,
    feedStats,
    totalArticles: allArticles.length,
  };
}

// ── Helpers ──

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`
  ));
  return match ? (match[1] || match[2] || '').trim() : null;
}

function extractAtomLink(xml) {
  const match = xml.match(/<link[^>]+href=["']([^"']+)["']/);
  return match ? match[1] : null;
}

function cleanHtml(str) {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function safeDate(str) {
  try { return new Date(str).toISOString(); } catch { return null; }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
