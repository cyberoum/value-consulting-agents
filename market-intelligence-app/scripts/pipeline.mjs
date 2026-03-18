#!/usr/bin/env node
/**
 * Market Intelligence Data Pipeline — SQLite Edition
 * ──────────────────────────────────────────────────
 * Orchestrates all data fetchers and writes results directly into SQLite.
 * Uses namespaced merge (live_*, pdf_*) so automated data never overwrites
 * manually curated consultant fields.
 *
 * Usage:
 *   node scripts/pipeline.mjs                  # Run all fetchers
 *   node scripts/pipeline.mjs --ratings        # App ratings only
 *   node scripts/pipeline.mjs --news           # News signals only
 *   node scripts/pipeline.mjs --stocks         # Stock data only
 *   node scripts/pipeline.mjs --dry-run        # Preview without writing to DB
 *   node scripts/pipeline.mjs --analyze        # Run Claude AI analysis on news
 *   node scripts/pipeline.mjs --news --analyze # Fetch news + AI analysis
 *   node scripts/pipeline.mjs --signals        # Live signals (industry feeds + jobs + AI classify)
 *   node scripts/pipeline.mjs --provenance     # Run staleness check on provenance records
 *   node scripts/pipeline.mjs --all            # Run everything (including signals + provenance)
 */

import { randomUUID } from 'crypto';
import { getDb, closeDb } from './db.mjs';
import { BANK_SOURCES } from './config.mjs';
import {
  logIngestion,
  mergeStockData,
  mergeNewsData,
  mergeAppRatings,
  mergeAiAnalysis,
  resolveBankKey,
} from './lib/mergeHelpers.mjs';
import { writeProvenance, bulkWriteProvenance, runStalenessCheck } from './lib/provenanceWriter.mjs';
import { detectStockPriceChange, detectAppRatingChanges, recordChange } from './lib/changeWriter.mjs';

import { fetchAllAppRatings } from './fetchers/appRatings.mjs';
import { fetchAllNewsSignals } from './fetchers/newsSignals.mjs';
import { fetchAllStockData } from './fetchers/stockData.mjs';
import { analyzeAllBankNews, isClaudeAvailable } from './fetchers/claudeAnalyzer.mjs';

// ── CLI Flags ──
const args = process.argv.slice(2);
const runAll = args.length === 0 || args.includes('--all');
const runRatings = runAll || args.includes('--ratings');
const runNews = runAll || args.includes('--news');
const runStocks = runAll || args.includes('--stocks');
const runAnalyze = args.includes('--analyze');
const runSignals = args.includes('--signals');
const runProvenance = runAll || args.includes('--provenance');
const dryRun = args.includes('--dry-run');

// ── Pretty Logging ──
const log = {
  header: (msg) => console.log(`\n${'═'.repeat(60)}\n  ${msg}\n${'═'.repeat(60)}`),
  section: (msg) => console.log(`\n┌─ ${msg}`),
  progress: (msg) => process.stdout.write(`│  ${msg}\r`),
  done: (msg) => console.log(`└─ ✅ ${msg}`),
  warn: (msg) => console.log(`│  ⚠️  ${msg}`),
  error: (msg) => console.log(`│  ❌ ${msg}`),
  info: (msg) => console.log(`│  ${msg}`),
};

// ── Bank Key Mapping ──
// The config keys (e.g. "Nordea_Sweden") may differ from DB keys.
// Build a lookup once at startup so we can translate config → DB keys.
function buildKeyMap(db) {
  const keyMap = {};
  for (const [configKey, cfg] of Object.entries(BANK_SOURCES)) {
    const dbKey = resolveBankKey(db, configKey, cfg.name);
    if (dbKey) {
      keyMap[configKey] = dbKey;
    }
  }
  return keyMap;
}

// ── Main Pipeline ──

async function runPipeline() {
  const startTime = Date.now();
  const runId = randomUUID();

  log.header('Market Intelligence Data Pipeline (SQLite)');
  console.log(`  📅 ${new Date().toISOString()}`);
  console.log(`  🆔 Run: ${runId.slice(0, 8)}`);
  console.log(`  🎯 Fetchers: ${[runRatings && 'Ratings', runNews && 'News', runStocks && 'Stocks', runAnalyze && 'AI Analysis', runSignals && 'Live Signals'].filter(Boolean).join(', ')}`);
  if (dryRun) console.log('  🧪 DRY RUN — will not write to database');
  if (runAnalyze && !isClaudeAvailable()) {
    log.warn('ANTHROPIC_API_KEY not set — skipping AI analysis');
    log.info('Set it with: export ANTHROPIC_API_KEY=sk-ant-...');
  }

  // Get database connection (skip in dry-run — we still need it for key mapping)
  const db = getDb();
  const keyMap = buildKeyMap(db);
  const mappedBankCount = Object.keys(keyMap).length;
  log.info(`Mapped ${mappedBankCount}/${Object.keys(BANK_SOURCES).length} config banks to DB keys`);

  // Track pipeline stats
  const stats = {
    stocks: { processed: 0, written: 0, skipped: 0, errors: 0 },
    news: { processed: 0, written: 0, skipped: 0, errors: 0 },
    ratings: { processed: 0, written: 0, skipped: 0, errors: 0 },
    analysis: { processed: 0, written: 0, skipped: 0, errors: 0 },
  };

  // Log pipeline start
  if (!dryRun) {
    logIngestion(db, runId, null, 'pipeline', 'start', null, {
      fetchers: [runRatings && 'ratings', runNews && 'news', runStocks && 'stocks', runAnalyze && 'analyze'].filter(Boolean),
      dryRun,
      configBanks: Object.keys(BANK_SOURCES).length,
      mappedBanks: mappedBankCount,
    });
  }

  // Collect news data for potential AI analysis later
  let collectedNews = {};

  // ── 1. Stock Data ──
  if (runStocks) {
    log.section('Stock Data Fetcher');
    const fetcherStart = Date.now();
    try {
      const stocks = await fetchAllStockData(({ completed, total, bank }) => {
        log.progress(`[${completed}/${total}] ${bank.padEnd(30)}`);
      });
      console.log(''); // Clear progress line

      for (const [configKey, stockData] of Object.entries(stocks)) {
        stats.stocks.processed++;
        const dbKey = keyMap[configKey];
        if (!dbKey) {
          stats.stocks.skipped++;
          continue;
        }

        if (!dryRun) {
          try {
            // Layer 3: detect stock price change >10% before overwriting
            if (stockData.price != null) {
              const stockChange = detectStockPriceChange(dbKey, stockData.price, { pipelineRunId: runId });
              if (stockChange) {
                recordChange(stockChange);
                log.info(`  Change detected: ${dbKey} stock price ${stockChange.oldValue} → ${stockChange.newValue}`);
              }
            }
            const ok = mergeStockData(db, dbKey, stockData, runId);
            if (ok) {
              stats.stocks.written++;
              // Layer 1: record provenance for each stock field
              const today = new Date().toISOString().slice(0, 10);
              const stockProvenance = [];
              if (stockData.price != null) stockProvenance.push({ entityType: 'bank', entityKey: dbKey, fieldPath: 'live_stock.price', value: stockData.price, sourceType: 'pipeline_yahoo_finance', sourceUrl: `https://finance.yahoo.com/quote/${stockData.ticker}`, sourceDate: today, confidenceTier: 1 });
              if (stockData.marketCap != null) stockProvenance.push({ entityType: 'bank', entityKey: dbKey, fieldPath: 'live_stock.marketCap', value: stockData.marketCap, sourceType: 'pipeline_yahoo_finance', sourceUrl: `https://finance.yahoo.com/quote/${stockData.ticker}`, sourceDate: today, confidenceTier: 1 });
              if (stockData.peRatio != null) stockProvenance.push({ entityType: 'bank', entityKey: dbKey, fieldPath: 'live_stock.peRatio', value: stockData.peRatio, sourceType: 'pipeline_yahoo_finance', sourceUrl: `https://finance.yahoo.com/quote/${stockData.ticker}`, sourceDate: today, confidenceTier: 1 });
              if (stockData.dayChangePercent != null) stockProvenance.push({ entityType: 'bank', entityKey: dbKey, fieldPath: 'live_stock.dayChangePercent', value: stockData.dayChangePercent, sourceType: 'pipeline_yahoo_finance', sourceUrl: `https://finance.yahoo.com/quote/${stockData.ticker}`, sourceDate: today, confidenceTier: 1 });
              if (stockProvenance.length > 0) bulkWriteProvenance(stockProvenance);
            }
            else stats.stocks.skipped++;
          } catch (err) {
            stats.stocks.errors++;
            logIngestion(db, runId, dbKey, 'stock_yahoo', 'error', 'banks', err.message);
          }
        } else if (stockData.price) {
          stats.stocks.written++; // count as "would write"
        }
      }

      log.done(`${stats.stocks.written} stocks written, ${stats.stocks.skipped} skipped (${((Date.now() - fetcherStart) / 1000).toFixed(1)}s)`);
    } catch (err) {
      log.error(`Stock data failed: ${err.message}`);
      if (!dryRun) logIngestion(db, runId, null, 'stock_yahoo', 'error', null, err.message);
    }
  }

  // ── 2. News Signals ──
  if (runNews) {
    log.section('News Signal Monitor');
    const fetcherStart = Date.now();
    try {
      const news = await fetchAllNewsSignals(({ completed, total, bank }) => {
        log.progress(`[${completed}/${total}] ${bank.padEnd(30)}`);
      });
      console.log('');

      for (const [configKey, newsData] of Object.entries(news)) {
        stats.news.processed++;
        const dbKey = keyMap[configKey];
        if (!dbKey) {
          stats.news.skipped++;
          continue;
        }

        // Collect for AI analysis
        if (newsData.articles?.length > 0) {
          collectedNews[configKey] = {
            name: BANK_SOURCES[configKey]?.name || configKey.split('_')[0],
            articles: newsData.articles,
          };
        }

        if (!dryRun) {
          try {
            const ok = mergeNewsData(db, dbKey, newsData, runId);
            if (ok) {
              stats.news.written++;
              // Layer 1: record provenance for news data
              if (newsData.articleCount > 0) {
                const today = new Date().toISOString().slice(0, 10);
                writeProvenance('bank', dbKey, 'live_news.latest', newsData.articles?.[0]?.title || `${newsData.articleCount} articles`, 'google_news', newsData.articles?.[0]?.link || null, today, 2);
              }
            }
            else stats.news.skipped++;
          } catch (err) {
            stats.news.errors++;
            logIngestion(db, runId, dbKey, 'news_rss', 'error', 'banks', err.message);
          }
        } else if (newsData.articleCount > 0) {
          stats.news.written++;
        }
      }

      log.done(`${stats.news.written} banks with news, ${stats.news.skipped} skipped (${((Date.now() - fetcherStart) / 1000).toFixed(1)}s)`);
    } catch (err) {
      log.error(`News signals failed: ${err.message}`);
      if (!dryRun) logIngestion(db, runId, null, 'news_rss', 'error', null, err.message);
    }
  }

  // ── 3. App Ratings ──
  if (runRatings) {
    log.section('App Ratings Fetcher');
    const fetcherStart = Date.now();
    try {
      const ratings = await fetchAllAppRatings(({ completed, total, bank }) => {
        log.progress(`[${completed}/${total}] ${bank.padEnd(30)}`);
      });
      console.log('');

      for (const [configKey, ratingsData] of Object.entries(ratings)) {
        stats.ratings.processed++;
        const dbKey = keyMap[configKey];
        if (!dbKey) {
          stats.ratings.skipped++;
          continue;
        }

        if (!dryRun) {
          try {
            // Layer 3: detect app rating drops before overwriting
            const ratingChanges = detectAppRatingChanges(dbKey, ratingsData, { pipelineRunId: runId });
            for (const rc of ratingChanges) {
              recordChange(rc);
              log.info(`  Change detected: ${dbKey} ${rc.fieldPath} ${rc.oldValue} → ${rc.newValue}`);
            }
            const ok = mergeAppRatings(db, dbKey, ratingsData, runId);
            if (ok) {
              stats.ratings.written++;
              // Layer 1: record provenance for app ratings
              const today = new Date().toISOString().slice(0, 10);
              const ratingsProv = [];
              if (ratingsData.ios?.rating != null) ratingsProv.push({ entityType: 'bank', entityKey: dbKey, fieldPath: 'app_rating_ios', value: ratingsData.ios.rating, sourceType: 'pipeline_app_store', sourceUrl: ratingsData.ios.url || null, sourceDate: today, confidenceTier: 1 });
              if (ratingsData.android?.rating != null) ratingsProv.push({ entityType: 'bank', entityKey: dbKey, fieldPath: 'app_rating_android', value: ratingsData.android.rating, sourceType: 'pipeline_google_play', sourceUrl: ratingsData.android.url || null, sourceDate: today, confidenceTier: 1 });
              if (ratingsProv.length > 0) bulkWriteProvenance(ratingsProv);
            }
            else stats.ratings.skipped++;
          } catch (err) {
            stats.ratings.errors++;
            logIngestion(db, runId, dbKey, 'app_ratings', 'error', 'cx', err.message);
          }
        } else if (ratingsData.android?.rating || ratingsData.ios?.rating) {
          stats.ratings.written++;
        }
      }

      log.done(`${stats.ratings.written} banks with ratings, ${stats.ratings.skipped} skipped (${((Date.now() - fetcherStart) / 1000).toFixed(1)}s)`);
    } catch (err) {
      log.error(`App ratings failed: ${err.message}`);
      if (!dryRun) logIngestion(db, runId, null, 'app_ratings', 'error', null, err.message);
    }
  }

  // ── 4. Claude AI Analysis ──
  if (runAnalyze && isClaudeAvailable()) {
    log.section('Claude AI News Analysis');
    const fetcherStart = Date.now();
    try {
      // If we didn't run --news this time, try loading from DB
      if (Object.keys(collectedNews).length === 0) {
        log.info('No fresh news — loading recent news from database...');
        for (const [configKey, cfg] of Object.entries(BANK_SOURCES)) {
          const dbKey = keyMap[configKey];
          if (!dbKey) continue;
          const row = db.prepare('SELECT data FROM banks WHERE key = ?').get(dbKey);
          if (row) {
            const data = JSON.parse(row.data);
            if (data.live_news?.articles?.length > 0) {
              collectedNews[configKey] = {
                name: cfg.name,
                articles: data.live_news.articles,
              };
            }
          }
        }
      }

      const bankCount = Object.keys(collectedNews).length;
      if (bankCount === 0) {
        log.warn('No news articles to analyze — run --news first');
      } else {
        log.info(`Analyzing news for ${bankCount} banks...`);
        const analysis = await analyzeAllBankNews(collectedNews, ({ completed, total, bank }) => {
          log.progress(`[${completed}/${total}] 🤖 ${bank.padEnd(30)}`);
        });
        console.log('');

        for (const [configKey, aiResult] of Object.entries(analysis)) {
          stats.analysis.processed++;
          const dbKey = keyMap[configKey];
          if (!dbKey) {
            stats.analysis.skipped++;
            continue;
          }

          if (!dryRun) {
            try {
              const ok = mergeAiAnalysis(db, dbKey, aiResult, 'news_intelligence', runId);
              if (ok) stats.analysis.written++;
              else stats.analysis.skipped++;
            } catch (err) {
              stats.analysis.errors++;
              logIngestion(db, runId, dbKey, 'ai_analysis', 'error', 'ai_analyses', err.message);
            }
          } else {
            stats.analysis.written++;
          }
        }

        log.done(`${stats.analysis.written} banks analyzed (${((Date.now() - fetcherStart) / 1000).toFixed(1)}s)`);
      }
    } catch (err) {
      log.error(`AI analysis failed: ${err.message}`);
      if (!dryRun) logIngestion(db, runId, null, 'ai_analysis', 'error', null, err.message);
    }
  }

  // ── 5. Live Signal Ingestion ──
  if (runSignals) {
    log.section('Live Signal Ingestion (Industry Feeds + Jobs + AI Classification)');
    const fetcherStart = Date.now();
    try {
      const { runSignalRefresh } = await import('./fetchers/signalIngestion.mjs');
      const signalStats = await runSignalRefresh(db, {
        skipNews: runNews, // Skip per-bank news if already fetched above
        onProgress: ({ message }) => log.info(message),
      });

      stats.signals = {
        fetched: signalStats.totalFetched,
        classified: signalStats.classified,
        stored: signalStats.stored,
        errors: signalStats.errors.length,
      };

      log.done(`${signalStats.stored} actionable signals stored (${((Date.now() - fetcherStart) / 1000).toFixed(1)}s)`);
    } catch (err) {
      log.error(`Signal ingestion failed: ${err.message}`);
      stats.signals = { fetched: 0, classified: 0, stored: 0, errors: 1 };
      if (!dryRun) logIngestion(db, runId, null, 'signal_ingestion', 'error', null, err.message);
    }
  }

  // ── 6. Provenance Staleness Check ──
  if (runProvenance && !dryRun) {
    log.section('Provenance Staleness Check');
    try {
      const { checked, markedStale } = runStalenessCheck();
      log.done(`${checked} provenance records checked, ${markedStale} marked stale`);
      stats.provenance = { checked, markedStale };
    } catch (err) {
      log.error(`Staleness check failed: ${err.message}`);
      stats.provenance = { checked: 0, markedStale: 0, error: err.message };
    }
  }

  // ── Pipeline Summary ──
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalWritten = stats.stocks.written + stats.news.written + stats.ratings.written + stats.analysis.written + (stats.signals?.stored || 0);
  const totalErrors = stats.stocks.errors + stats.news.errors + stats.ratings.errors + stats.analysis.errors;

  // Log pipeline completion
  if (!dryRun) {
    logIngestion(db, runId, null, 'pipeline', 'complete', null, {
      durationMs: Date.now() - startTime,
      stats,
      totalWritten,
      totalErrors,
    });
  }

  // Close DB
  closeDb();

  // Print summary
  if (!dryRun) {
    log.header(`Pipeline Complete — ${totalDuration}s`);
    console.log(`  🆔 Run: ${runId.slice(0, 8)}`);
    console.log(`  💾 Database: data/market-intelligence.db`);
  } else {
    log.header(`Pipeline Preview (Dry Run) — ${totalDuration}s`);
  }

  console.log(`  📊 Results:`);
  if (runStocks) console.log(`     Stocks:   ${stats.stocks.written} written, ${stats.stocks.skipped} skipped, ${stats.stocks.errors} errors`);
  if (runNews) console.log(`     News:     ${stats.news.written} written, ${stats.news.skipped} skipped, ${stats.news.errors} errors`);
  if (runRatings) console.log(`     Ratings:  ${stats.ratings.written} written, ${stats.ratings.skipped} skipped, ${stats.ratings.errors} errors`);
  if (runAnalyze) console.log(`     Analysis: ${stats.analysis.written} written, ${stats.analysis.skipped} skipped, ${stats.analysis.errors} errors`);
  if (runSignals) console.log(`     Signals:  ${stats.signals?.stored || 0} stored, ${stats.signals?.classified || 0} classified, ${stats.signals?.errors || 0} errors`);
  if (runProvenance && stats.provenance) console.log(`     Provenance: ${stats.provenance.checked} checked, ${stats.provenance.markedStale} stale`);
  console.log(`  ─────────────`);
  console.log(`  Total: ${totalWritten} writes, ${totalErrors} errors`);

  if (totalErrors > 0) {
    console.log(`\n  ⚠️  Check ingestion_log for error details:`);
    console.log(`     SELECT * FROM ingestion_log WHERE run_id LIKE '${runId.slice(0, 8)}%' AND action = 'error'`);
  }
}

runPipeline().catch(err => {
  console.error('\n❌ Pipeline crashed:', err);
  process.exit(1);
});
