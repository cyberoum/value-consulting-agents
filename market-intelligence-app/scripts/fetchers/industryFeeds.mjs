/**
 * Industry RSS Feed Fetcher
 * ─────────────────────────
 * Fetches articles from banking/fintech industry RSS feeds and matches
 * them to tracked banks by scanning for bank names in title/snippet.
 *
 * Sources:
 *   - Finextra (finextra.com/rss/rss.aspx)
 *   - Fintech Futures (fintechfutures.com/feed/)
 *   - Finovate (finovate.com/feed/)
 *   - The Banker / Banking Tech via Google News proxy
 *
 * Unlike newsSignals.mjs which searches per-bank, this fetcher scans
 * industry-wide feeds once and matches articles to banks post-hoc.
 */

import { BANK_SOURCES, PIPELINE_CONFIG } from '../config.mjs';

const TIMEOUT = PIPELINE_CONFIG.rateLimits.timeoutMs;
const DELAY = PIPELINE_CONFIG.rateLimits.requestDelayMs;

// Industry RSS feeds — banking/fintech focused
const INDUSTRY_FEEDS = [
  {
    name: 'Finextra',
    // Finextra blocks direct RSS with 403; use Google News proxy
    url: 'https://news.google.com/rss/search?q=site:finextra.com&hl=en&gl=US&ceid=US:en',
    maxItems: 20,
  },
  {
    name: 'Fintech Futures',
    // Fintech Futures blocks direct RSS; use Google News proxy
    url: 'https://news.google.com/rss/search?q=site:fintechfutures.com&hl=en&gl=US&ceid=US:en',
    maxItems: 15,
  },
  {
    name: 'Finovate',
    url: 'https://finovate.com/feed/',
    maxItems: 15,
  },
  {
    name: 'The Banker (Google)',
    url: 'https://news.google.com/rss/search?q=site:thebanker.com+OR+"digital+banking"+OR+"core+banking"+OR+"banking+platform"&hl=en&gl=US&ceid=US:en',
    maxItems: 10,
  },
  {
    name: 'Banking Tech (Google)',
    url: 'https://news.google.com/rss/search?q="digital+banking"+OR+"core+banking+transformation"+OR+"banking+platform+modernization"&hl=en&gl=US&ceid=US:en',
    maxItems: 15,
  },
];

// Scandinavian-language feeds — capture Nordic banking news that doesn't reach English outlets
const SCANDINAVIAN_FEEDS = [
  // ── SWEDISH ──
  {
    name: 'Dagens Industri (SV)',
    // Swedish financial daily — covers Nordea, SEB, Handelsbanken, Swedbank digital moves
    url: 'https://news.google.com/rss/search?q=site:di.se+(bank+OR+Nordea+OR+SEB+OR+Handelsbanken+OR+Swedbank+OR+SBAB+OR+Skandiabanken+OR+%22digital+bank%22)&hl=sv&gl=SE&ceid=SE:sv',
    maxItems: 15,
  },
  {
    name: 'Realtid (SV)',
    // Swedish business news — strong fintech/banking coverage
    url: 'https://news.google.com/rss/search?q=site:realtid.se+(bank+OR+fintech+OR+digital+OR+Nordea+OR+SEB+OR+Handelsbanken+OR+Swedbank)&hl=sv&gl=SE&ceid=SE:sv',
    maxItems: 10,
  },
  // ── NORWEGIAN ──
  {
    name: 'E24 (NO)',
    // Norwegian business news — covers DNB, SpareBank, Storebrand
    url: 'https://news.google.com/rss/search?q=site:e24.no+(bank+OR+DNB+OR+SpareBank+OR+Sbanken+OR+Storebrand+OR+%22digital+bank%22)&hl=no&gl=NO&ceid=NO:no',
    maxItems: 15,
  },
  {
    name: 'Dagens Næringsliv (NO)',
    // Norwegian Financial Times — premium banking coverage
    url: 'https://news.google.com/rss/search?q=site:dn.no+(bank+OR+DNB+OR+SpareBank+OR+fintech+OR+digital)&hl=no&gl=NO&ceid=NO:no',
    maxItems: 10,
  },
  // ── DANISH ──
  {
    name: 'Finans.dk (DK)',
    // Danish financial news — covers Danske Bank, Jyske, Nykredit, Lunar
    url: 'https://news.google.com/rss/search?q=site:finans.dk+(bank+OR+%22Danske+Bank%22+OR+Jyske+OR+Nykredit+OR+Lunar+OR+Sydbank+OR+%22Spar+Nord%22)&hl=da&gl=DK&ceid=DK:da',
    maxItems: 15,
  },
  {
    name: 'Børsen (DK)',
    // Danish business daily — strong banking sector coverage
    url: 'https://news.google.com/rss/search?q=site:borsen.dk+(bank+OR+fintech+OR+digital+OR+%22Danske+Bank%22+OR+Jyske+OR+Nykredit)&hl=da&gl=DK&ceid=DK:da',
    maxItems: 10,
  },
];

// Build bank name lookup for matching (lowercase name -> bank key)
function buildBankLookup() {
  const lookup = {};
  for (const [key, cfg] of Object.entries(BANK_SOURCES)) {
    lookup[cfg.name.toLowerCase()] = key;
    const shortName = cfg.name.replace(/ Bank$/i, '').replace(/ Group$/i, '');
    if (shortName.length >= 3) {
      lookup[shortName.toLowerCase()] = key;
    }
  }
  return lookup;
}

/**
 * Fetch and parse an RSS feed
 */
async function fetchRSSFeed(feedConfig) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const res = await fetch(feedConfig.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketIntelligence/1.0)' },
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < feedConfig.maxItems) {
      const itemXml = match[1];
      const title = extractTag(itemXml, 'title');
      const link = extractTag(itemXml, 'link');
      const pubDate = extractTag(itemXml, 'pubDate');
      const description = extractTag(itemXml, 'description');

      if (title) {
        items.push({
          title: cleanHtml(title),
          link: link || null,
          publishedAt: pubDate ? safeDate(pubDate) : null,
          snippet: description ? cleanHtml(description).substring(0, 300) : null,
          source: feedConfig.name,
        });
      }
    }

    return items;
  } catch (err) {
    console.warn(`  [industryFeeds] ${feedConfig.name} failed: ${err.message}`);
    return [];
  }
}

/**
 * Match articles to tracked banks by scanning text for bank names.
 */
function matchArticlesToBanks(articles, bankLookup) {
  const matched = [];

  for (const article of articles) {
    const text = `${article.title} ${article.snippet || ''}`.toLowerCase();

    for (const [name, bankKey] of Object.entries(bankLookup)) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(text)) {
        matched.push({
          article,
          bankKey,
          bankName: BANK_SOURCES[bankKey]?.name || bankKey,
        });
        break; // One bank match per article
      }
    }
  }

  return matched;
}

/**
 * Fetch all industry feeds and match articles to tracked banks.
 */
export async function fetchIndustryFeeds(onProgress) {
  const bankLookup = buildBankLookup();
  const allArticles = [];
  const feedStats = [];

  // Combine English + Scandinavian feeds into a single pass
  const allFeeds = [...INDUSTRY_FEEDS, ...SCANDINAVIAN_FEEDS];

  for (let i = 0; i < allFeeds.length; i++) {
    const feed = allFeeds[i];
    onProgress?.({ completed: i, total: allFeeds.length, feed: feed.name });

    const articles = await fetchRSSFeed(feed);
    allArticles.push(...articles);
    feedStats.push({ name: feed.name, count: articles.length });

    if (i < allFeeds.length - 1) await sleep(DELAY);
  }

  const matchedArticles = matchArticlesToBanks(allArticles, bankLookup);

  return {
    feedStats,
    totalArticles: allArticles.length,
    matchedArticles,
    matchedCount: matchedArticles.length,
    unmatchedCount: allArticles.length - matchedArticles.length,
  };
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
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function safeDate(str) {
  try { return new Date(str).toISOString(); } catch { return null; }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
