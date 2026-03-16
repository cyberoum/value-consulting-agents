/**
 * Stock / Financial Data Fetcher
 * Fetches live stock price, market cap, P/E, and 52-week range
 * from Yahoo Finance's public API endpoints.
 *
 * No API key required — uses Yahoo Finance v8 public quote endpoint.
 */

import { BANK_SOURCES, PIPELINE_CONFIG } from '../config.mjs';

const DELAY = PIPELINE_CONFIG.rateLimits.requestDelayMs;
const TIMEOUT = PIPELINE_CONFIG.rateLimits.timeoutMs;

// ── Yahoo Finance Quote API ──

async function fetchYahooQuote(ticker) {
  // Yahoo Finance v8 public API — works without auth for basic quotes
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d&includePrePost=false`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'application/json',
      },
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error('No data in response');

    return {
      ticker,
      currency: meta.currency || 'USD',
      price: meta.regularMarketPrice ?? null,
      previousClose: meta.previousClose ?? null,
      dayChange: meta.regularMarketPrice && meta.previousClose
        ? Math.round((meta.regularMarketPrice - meta.previousClose) * 100) / 100
        : null,
      dayChangePercent: meta.regularMarketPrice && meta.previousClose
        ? Math.round(((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 10000) / 100
        : null,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
      exchange: meta.exchangeName || null,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      ticker,
      error: err.message,
      fetchedAt: new Date().toISOString(),
    };
  }
}

// ── Yahoo Finance Summary (market cap, P/E, etc.) ──

async function fetchYahooSummary(ticker) {
  // Try the quoteSummary endpoint for fundamentals
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=price,summaryDetail,financialData`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });
    clearTimeout(timer);

    if (!res.ok) return {}; // Graceful fallback — chart API is primary
    const data = await res.json();

    const price = data?.quoteSummary?.result?.[0]?.price || {};
    const summary = data?.quoteSummary?.result?.[0]?.summaryDetail || {};
    const financial = data?.quoteSummary?.result?.[0]?.financialData || {};

    return {
      marketCap: price.marketCap?.raw ?? null,
      marketCapFormatted: price.marketCap?.fmt ?? null,
      peRatio: summary.trailingPE?.raw ?? null,
      forwardPE: summary.forwardPE?.raw ?? null,
      dividendYield: summary.dividendYield?.raw ?? null,
      returnOnEquity: financial.returnOnEquity?.raw ?? null,
      revenueGrowth: financial.revenueGrowth?.raw ?? null,
    };
  } catch {
    return {};
  }
}

// ── Main: fetch all bank stock data ──

export async function fetchAllStockData(onProgress) {
  const results = {};
  const banksWithTickers = Object.entries(BANK_SOURCES).filter(([, cfg]) => cfg.ticker);
  let completed = 0;

  for (const [bankKey, cfg] of banksWithTickers) {
    // Fetch quote (price, change)
    const quote = await fetchYahooQuote(cfg.ticker);
    await sleep(DELAY);

    // Fetch summary (market cap, P/E) — only if quote succeeded
    let fundamentals = {};
    if (!quote.error) {
      fundamentals = await fetchYahooSummary(cfg.ticker);
      await sleep(DELAY);
    }

    results[bankKey] = {
      bankKey,
      name: cfg.name,
      ...quote,
      ...fundamentals,
    };

    completed++;
    onProgress?.({ completed, total: banksWithTickers.length, bank: cfg.name });
  }

  return results;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run standalone
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  console.log('📈 Stock Data Fetcher — starting...\n');

  const banksWithTickers = Object.entries(BANK_SOURCES).filter(([, cfg]) => cfg.ticker);
  console.log(`  ${banksWithTickers.length} banks with stock tickers\n`);

  fetchAllStockData(({ completed, total, bank }) => {
    process.stdout.write(`  [${completed}/${total}] ${bank}\r`);
  }).then(results => {
    const successCount = Object.values(results).filter(r => r.price).length;
    console.log(`\n✅ Done: ${successCount}/${Object.keys(results).length} stocks fetched\n`);

    Object.values(results).forEach(r => {
      if (r.price) {
        const arrow = r.dayChangePercent > 0 ? '▲' : r.dayChangePercent < 0 ? '▼' : '—';
        console.log(`  ${r.name.padEnd(25)} ${r.currency} ${r.price.toFixed(2).padStart(10)} ${arrow} ${(r.dayChangePercent || 0).toFixed(2)}%  MC: ${r.marketCapFormatted || 'N/A'}`);
      } else {
        console.log(`  ${r.name.padEnd(25)} ❌ ${r.error}`);
      }
    });
  });
}
