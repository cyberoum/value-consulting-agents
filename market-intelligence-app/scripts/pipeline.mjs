#!/usr/bin/env node
/**
 * Market Intelligence Data Pipeline
 * ──────────────────────────────────
 * Orchestrates all data fetchers and produces a unified liveData.json
 * consumed by the React app. Run this on a schedule (cron) or manually.
 *
 * Usage:
 *   node scripts/pipeline.mjs                  # Run all fetchers
 *   node scripts/pipeline.mjs --ratings        # App ratings only
 *   node scripts/pipeline.mjs --news           # News signals only
 *   node scripts/pipeline.mjs --stocks         # Stock data only
 *   node scripts/pipeline.mjs --dry-run        # Preview without saving
 *   node scripts/pipeline.mjs --analyze        # Run Claude AI analysis on news
 *   node scripts/pipeline.mjs --news --analyze # Fetch news + AI analysis
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { fetchAllAppRatings } from './fetchers/appRatings.mjs';
import { fetchAllNewsSignals } from './fetchers/newsSignals.mjs';
import { fetchAllStockData } from './fetchers/stockData.mjs';
import { analyzeAllBankNews, isClaudeAvailable } from './fetchers/claudeAnalyzer.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../src/data/liveData.json');
const LOG_DIR = resolve(__dirname, 'logs');

// ── CLI Flags ──
const args = process.argv.slice(2);
const runAll = args.length === 0 || args.includes('--all');
const runRatings = runAll || args.includes('--ratings');
const runNews = runAll || args.includes('--news');
const runStocks = runAll || args.includes('--stocks');
const runAnalyze = args.includes('--analyze');
const dryRun = args.includes('--dry-run');

// ── Pretty logging ──
const log = {
  header: (msg) => console.log(`\n${'═'.repeat(60)}\n  ${msg}\n${'═'.repeat(60)}`),
  section: (msg) => console.log(`\n┌─ ${msg}`),
  progress: (msg) => process.stdout.write(`│  ${msg}\r`),
  done: (msg) => console.log(`└─ ✅ ${msg}`),
  warn: (msg) => console.log(`│  ⚠️  ${msg}`),
  error: (msg) => console.log(`│  ❌ ${msg}`),
  info: (msg) => console.log(`│  ${msg}`),
};

// ── Main Pipeline ──

async function runPipeline() {
  const startTime = Date.now();
  log.header('Market Intelligence Data Pipeline');
  console.log(`  📅 ${new Date().toISOString()}`);
  console.log(`  🎯 Fetchers: ${[runRatings && 'Ratings', runNews && 'News', runStocks && 'Stocks', runAnalyze && 'AI Analysis'].filter(Boolean).join(', ')}`);
  if (dryRun) console.log('  🧪 DRY RUN — will not save to disk');
  if (runAnalyze && !isClaudeAvailable()) {
    log.warn('ANTHROPIC_API_KEY not set — skipping AI analysis');
    log.info('Set it with: export ANTHROPIC_API_KEY=sk-ant-...');
  }

  // Load existing data (merge strategy: update, don't overwrite missing)
  let existing = {};
  if (existsSync(OUTPUT_PATH)) {
    try {
      existing = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
    } catch {
      log.warn('Could not parse existing liveData.json — starting fresh');
    }
  }

  const pipeline = {
    version: '1.0.0',
    lastRun: new Date().toISOString(),
    fetchers: {},
    banks: existing.banks || {},
  };

  // ── 1. App Ratings ──
  if (runRatings) {
    log.section('App Ratings Fetcher');
    const fetcherStart = Date.now();
    try {
      const ratings = await fetchAllAppRatings(({ completed, total, bank }) => {
        log.progress(`[${completed}/${total}] ${bank.padEnd(30)}`);
      });
      console.log(''); // Clear progress line

      // Merge into banks
      let successCount = 0;
      for (const [bankKey, data] of Object.entries(ratings)) {
        if (!pipeline.banks[bankKey]) pipeline.banks[bankKey] = {};
        pipeline.banks[bankKey].appRatings = {
          android: data.android || null,
          ios: data.ios || null,
        };
        if (data.android?.rating || data.ios?.rating) successCount++;
      }

      pipeline.fetchers.appRatings = {
        status: 'success',
        banksProcessed: Object.keys(ratings).length,
        banksWithData: successCount,
        durationMs: Date.now() - fetcherStart,
        completedAt: new Date().toISOString(),
      };
      log.done(`${successCount} banks with ratings (${((Date.now() - fetcherStart) / 1000).toFixed(1)}s)`);
    } catch (err) {
      pipeline.fetchers.appRatings = { status: 'error', error: err.message, completedAt: new Date().toISOString() };
      log.error(`App ratings failed: ${err.message}`);
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

      let withSignals = 0;
      let totalArticles = 0;
      for (const [bankKey, data] of Object.entries(news)) {
        if (!pipeline.banks[bankKey]) pipeline.banks[bankKey] = {};
        pipeline.banks[bankKey].news = {
          articles: data.articles,
          topSignals: data.topSignals,
          signalCount: data.signalCount,
          articleCount: data.articleCount,
          fetchedAt: data.fetchedAt,
        };
        if (data.signalCount > 0) withSignals++;
        totalArticles += data.articleCount;
      }

      pipeline.fetchers.newsSignals = {
        status: 'success',
        banksProcessed: Object.keys(news).length,
        banksWithSignals: withSignals,
        totalArticles,
        durationMs: Date.now() - fetcherStart,
        completedAt: new Date().toISOString(),
      };
      log.done(`${withSignals} banks with signals, ${totalArticles} articles (${((Date.now() - fetcherStart) / 1000).toFixed(1)}s)`);
    } catch (err) {
      pipeline.fetchers.newsSignals = { status: 'error', error: err.message, completedAt: new Date().toISOString() };
      log.error(`News signals failed: ${err.message}`);
    }
  }

  // ── 3. Stock Data ──
  if (runStocks) {
    log.section('Stock Data Fetcher');
    const fetcherStart = Date.now();
    try {
      const stocks = await fetchAllStockData(({ completed, total, bank }) => {
        log.progress(`[${completed}/${total}] ${bank.padEnd(30)}`);
      });
      console.log('');

      let successCount = 0;
      for (const [bankKey, data] of Object.entries(stocks)) {
        if (!pipeline.banks[bankKey]) pipeline.banks[bankKey] = {};
        pipeline.banks[bankKey].stock = {
          ticker: data.ticker,
          currency: data.currency,
          price: data.price,
          dayChange: data.dayChange,
          dayChangePercent: data.dayChangePercent,
          fiftyTwoWeekHigh: data.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: data.fiftyTwoWeekLow,
          marketCap: data.marketCap,
          marketCapFormatted: data.marketCapFormatted,
          peRatio: data.peRatio,
          dividendYield: data.dividendYield,
          exchange: data.exchange,
          fetchedAt: data.fetchedAt,
          error: data.error || null,
        };
        if (data.price) successCount++;
      }

      pipeline.fetchers.stockData = {
        status: 'success',
        banksProcessed: Object.keys(stocks).length,
        banksWithData: successCount,
        durationMs: Date.now() - fetcherStart,
        completedAt: new Date().toISOString(),
      };
      log.done(`${successCount} stocks fetched (${((Date.now() - fetcherStart) / 1000).toFixed(1)}s)`);
    } catch (err) {
      pipeline.fetchers.stockData = { status: 'error', error: err.message, completedAt: new Date().toISOString() };
      log.error(`Stock data failed: ${err.message}`);
    }
  }

  // ── 4. Claude AI Analysis ──
  if (runAnalyze && isClaudeAvailable()) {
    log.section('Claude AI News Analysis');
    const fetcherStart = Date.now();
    try {
      // Build news data from pipeline banks
      const newsData = {};
      for (const [bankKey, bankData] of Object.entries(pipeline.banks)) {
        if (bankData.news?.articles?.length > 0) {
          newsData[bankKey] = {
            name: bankData.news.articles[0]?.bankName || bankKey.split('_')[0],
            articles: bankData.news.articles,
          };
        }
      }

      const bankCount = Object.keys(newsData).length;
      if (bankCount === 0) {
        log.warn('No news articles to analyze — run --news first');
      } else {
        log.info(`Analyzing news for ${bankCount} banks...`);
        const analysis = await analyzeAllBankNews(newsData, ({ completed, total, bank }) => {
          log.progress(`[${completed}/${total}] 🤖 ${bank.padEnd(30)}`);
        });
        console.log('');

        let withAnalysis = 0;
        for (const [bankKey, aiResult] of Object.entries(analysis)) {
          if (!pipeline.banks[bankKey]) pipeline.banks[bankKey] = {};
          pipeline.banks[bankKey].aiAnalysis = aiResult;
          withAnalysis++;
        }

        pipeline.fetchers.aiAnalysis = {
          status: 'success',
          banksProcessed: bankCount,
          banksWithAnalysis: withAnalysis,
          durationMs: Date.now() - fetcherStart,
          completedAt: new Date().toISOString(),
        };
        log.done(`${withAnalysis} banks analyzed by Claude (${((Date.now() - fetcherStart) / 1000).toFixed(1)}s)`);
      }
    } catch (err) {
      pipeline.fetchers.aiAnalysis = { status: 'error', error: err.message, completedAt: new Date().toISOString() };
      log.error(`AI analysis failed: ${err.message}`);
    }
  }

  // ── Write Output ──
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  pipeline.durationMs = Date.now() - startTime;

  if (!dryRun) {
    writeFileSync(OUTPUT_PATH, JSON.stringify(pipeline, null, 2));
    log.header(`Pipeline Complete — ${totalDuration}s`);
    console.log(`  💾 Saved to: ${OUTPUT_PATH}`);
    console.log(`  📊 Banks: ${Object.keys(pipeline.banks).length}`);

    // Write log
    if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
    const logEntry = {
      timestamp: pipeline.lastRun,
      durationMs: pipeline.durationMs,
      fetchers: pipeline.fetchers,
    };
    const logPath = resolve(LOG_DIR, 'pipeline.log');
    const logLine = JSON.stringify(logEntry) + '\n';
    const existingLog = existsSync(logPath) ? readFileSync(logPath, 'utf-8') : '';
    writeFileSync(logPath, existingLog + logLine);
    console.log(`  📝 Log: ${logPath}`);
  } else {
    log.header(`Pipeline Preview — ${totalDuration}s`);
    console.log(`  📊 Would save ${Object.keys(pipeline.banks).length} banks`);
    console.log(`  Fetchers: ${JSON.stringify(pipeline.fetchers, null, 2)}`);
  }
}

runPipeline().catch(err => {
  console.error('\n❌ Pipeline crashed:', err);
  process.exit(1);
});
