/**
 * App Ratings Fetcher
 * Scrapes Google Play Store pages for app rating and review count.
 * Apple App Store uses a public lookup API.
 *
 * No API keys required — uses publicly accessible endpoints.
 */

import { BANK_SOURCES, PIPELINE_CONFIG } from '../config.mjs';

const DELAY = PIPELINE_CONFIG.rateLimits.requestDelayMs;
const TIMEOUT = PIPELINE_CONFIG.rateLimits.timeoutMs;

// ── Google Play Store ──

async function fetchGooglePlayRating(packageId) {
  const url = `https://play.google.com/store/apps/details?id=${packageId}&hl=en&gl=US`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Extract rating from the page — Google Play embeds it in structured data
    const ratingMatch = html.match(/"ratingValue"\s*:\s*"?([\d.]+)"?/);
    const reviewMatch = html.match(/"ratingCount"\s*:\s*"?(\d+)"?/);

    // Fallback: try aria-label patterns
    const ariaMatch = html.match(/Rated ([\d.]+) stars/);
    const reviewAria = html.match(/([\d,]+) reviews/);

    const rating = ratingMatch ? parseFloat(ratingMatch[1]) :
                   ariaMatch ? parseFloat(ariaMatch[1]) : null;

    const reviews = reviewMatch ? parseInt(reviewMatch[1]) :
                    reviewAria ? parseInt(reviewAria[1].replace(/,/g, '')) : null;

    return { rating, reviews, source: 'google_play', fetchedAt: new Date().toISOString() };
  } catch (err) {
    return { rating: null, reviews: null, source: 'google_play', error: err.message, fetchedAt: new Date().toISOString() };
  }
}

// ── Apple App Store (public lookup API) ──

async function fetchAppStoreRating(appId) {
  const url = `https://itunes.apple.com/lookup?id=${appId}&country=us`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const app = data.results[0];
      return {
        rating: app.averageUserRating ? Math.round(app.averageUserRating * 10) / 10 : null,
        reviews: app.userRatingCount || null,
        version: app.version || null,
        source: 'app_store',
        fetchedAt: new Date().toISOString(),
      };
    }
    return { rating: null, reviews: null, source: 'app_store', error: 'No results', fetchedAt: new Date().toISOString() };
  } catch (err) {
    return { rating: null, reviews: null, source: 'app_store', error: err.message, fetchedAt: new Date().toISOString() };
  }
}

// ── Main: fetch all bank app ratings ──

export async function fetchAllAppRatings(onProgress) {
  const results = {};
  const banks = Object.entries(BANK_SOURCES);
  let completed = 0;

  for (const [bankKey, cfg] of banks) {
    const bankResult = { bankKey, name: cfg.name };

    // Google Play
    if (cfg.googlePlayId) {
      bankResult.android = await fetchGooglePlayRating(cfg.googlePlayId);
      await sleep(DELAY);
    }

    // Apple App Store
    if (cfg.appStoreId) {
      bankResult.ios = await fetchAppStoreRating(cfg.appStoreId);
      await sleep(DELAY);
    }

    results[bankKey] = bankResult;
    completed++;
    onProgress?.({ completed, total: banks.length, bank: cfg.name });
  }

  return results;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run standalone
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  console.log('🏪 App Ratings Fetcher — starting...\n');
  fetchAllAppRatings(({ completed, total, bank }) => {
    process.stdout.write(`  [${completed}/${total}] ${bank}\r`);
  }).then(results => {
    const successCount = Object.values(results).filter(r => r.ios?.rating || r.android?.rating).length;
    console.log(`\n✅ Done: ${successCount}/${Object.keys(results).length} banks with ratings\n`);
    console.log(JSON.stringify(results, null, 2));
  });
}
