/**
 * News Signal Monitor
 * Fetches news headlines for each bank from public RSS feeds and
 * a free news API (GNews). Extracts signal keywords for relevance scoring.
 *
 * Free tier: GNews API allows 100 requests/day with no key required for basic search.
 * Fallback: Google News RSS feed (always free, no key).
 */

import { BANK_SOURCES, PIPELINE_CONFIG } from '../config.mjs';

const DELAY = PIPELINE_CONFIG.rateLimits.requestDelayMs;
const TIMEOUT = PIPELINE_CONFIG.rateLimits.timeoutMs;

// Signal keywords that indicate strategic relevance
const SIGNAL_PATTERNS = {
  transformation: /digital transformation|moderniz|technology overhaul|platform migration/i,
  leadership: /CEO|CTO|CIO|CDO|appoint|resign|hire|depart|new.*chief/i,
  investment: /invest|funding|budget|allocat|spend|€|£|\$.*million|\$.*billion/i,
  partnership: /partner|alliance|collaboration|teaming|joint venture/i,
  competition: /RFP|vendor selection|evaluate|shortlist|contract award|chose/i,
  acquisition: /acqui|merger|M&A|takeover|bought|purchase/i,
  regulation: /regulat|compliance|fine|penalty|sanction|GDPR|PSD2|MiCA/i,
  product: /launch|release|new.*app|new.*feature|new.*platform|rebrand/i,
  financial: /quarterly|earnings|profit|revenue|Q[1-4].*result|annual report/i,
  cloud: /cloud|AWS|Azure|GCP|migration|SaaS/i,
};

// ── Google News RSS (always free) ──

async function fetchGoogleNewsRSS(bankName, country) {
  const query = encodeURIComponent(`"${bankName}" bank ${country}`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en&gl=US&ceid=US:en`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();

    // Simple XML parsing for RSS items
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
      const itemXml = match[1];
      const title = extractTag(itemXml, 'title');
      const link = extractTag(itemXml, 'link');
      const pubDate = extractTag(itemXml, 'pubDate');
      const source = extractTag(itemXml, 'source');

      if (title) {
        items.push({
          title: cleanHtml(title),
          link,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
          source: source ? cleanHtml(source) : 'Google News',
        });
      }
    }

    return items;
  } catch (err) {
    return [{ error: err.message }];
  }
}

// ── Bank-specific RSS feed ──

async function fetchBankRSS(rssFeedUrl) {
  if (!rssFeedUrl) return [];

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const res = await fetch(rssFeedUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
      const itemXml = match[1];
      const title = extractTag(itemXml, 'title');
      const link = extractTag(itemXml, 'link');
      const pubDate = extractTag(itemXml, 'pubDate');
      const description = extractTag(itemXml, 'description');

      if (title) {
        items.push({
          title: cleanHtml(title),
          link,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
          description: description ? cleanHtml(description).substring(0, 200) : null,
          source: 'Bank Press Release',
        });
      }
    }

    return items;
  } catch (err) {
    return [{ error: err.message }];
  }
}

// ── Signal scoring ──

function scoreNewsItem(item) {
  if (!item.title) return { ...item, signals: [], relevanceScore: 0 };

  const text = `${item.title} ${item.description || ''}`;
  const signals = [];

  for (const [signal, pattern] of Object.entries(SIGNAL_PATTERNS)) {
    if (pattern.test(text)) {
      signals.push(signal);
    }
  }

  return {
    ...item,
    signals,
    relevanceScore: signals.length,
  };
}

// ── Main: fetch all bank news ──

export async function fetchAllNewsSignals(onProgress) {
  const results = {};
  const banks = Object.entries(BANK_SOURCES);
  let completed = 0;

  for (const [bankKey, cfg] of banks) {
    // Fetch from Google News RSS
    const googleNews = await fetchGoogleNewsRSS(cfg.name, cfg.country);
    await sleep(DELAY);

    // Fetch from bank's own RSS if available
    const bankNews = await fetchBankRSS(cfg.rssFeed);
    if (cfg.rssFeed) await sleep(DELAY);

    // Combine, score, and sort by relevance
    const allNews = [...googleNews, ...bankNews]
      .filter(item => !item.error)
      .map(scoreNewsItem)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Extract top signals
    const topSignals = [...new Set(allNews.flatMap(n => n.signals))];

    results[bankKey] = {
      bankKey,
      name: cfg.name,
      articles: allNews.slice(0, 8),  // Keep top 8
      topSignals,
      signalCount: topSignals.length,
      articleCount: allNews.length,
      fetchedAt: new Date().toISOString(),
    };

    completed++;
    onProgress?.({ completed, total: banks.length, bank: cfg.name });
  }

  return results;
}

// ── Helpers ──

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? (match[1] || match[2] || '').trim() : null;
}

function cleanHtml(str) {
  return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run standalone
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  console.log('📰 News Signal Monitor — starting...\n');
  fetchAllNewsSignals(({ completed, total, bank }) => {
    process.stdout.write(`  [${completed}/${total}] ${bank}\r`);
  }).then(results => {
    const withSignals = Object.values(results).filter(r => r.signalCount > 0).length;
    console.log(`\n✅ Done: ${withSignals}/${Object.keys(results).length} banks with signals\n`);

    // Show top signal banks
    const sorted = Object.values(results).sort((a, b) => b.signalCount - a.signalCount).slice(0, 5);
    sorted.forEach(r => {
      console.log(`  ${r.name}: ${r.signalCount} signals [${r.topSignals.join(', ')}] — ${r.articleCount} articles`);
    });
  });
}
