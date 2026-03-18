/**
 * Live Signal Ingestion Orchestrator
 * ───────────────────────────────────
 * Coordinates the full signals pipeline:
 *   1. Fetch from all sources (Google News, industry feeds, job boards)
 *   2. Deduplicate via content hash
 *   3. Pre-filter with keyword heuristics
 *   4. AI-classify with Claude (batched)
 *   5. Store in live_signals table
 *   6. Prune signals older than 90 days
 *   7. Log to signal_refresh_log
 *
 * Usage:
 *   import { runSignalRefresh } from './signalIngestion.mjs';
 *   await runSignalRefresh(db);
 *
 * Standalone:
 *   node scripts/fetchers/signalIngestion.mjs
 */

import { createHash } from 'crypto';
import { fetchAllNewsSignals } from './newsSignals.mjs';
import { fetchIndustryFeeds } from './industryFeeds.mjs';
import { fetchAllJobSignals } from './jobSignals.mjs';
import { fetchAllPressReleases } from './pressReleaseFeeds.mjs';
import { preFilterArticles, classifySignals } from './signalClassifier.mjs';
import { BANK_SOURCES } from '../config.mjs';
import { bulkWriteProvenance } from '../lib/provenanceWriter.mjs';

const PRUNE_DAYS = 90;
const MIN_RELEVANCE = 5; // Only store signals scoring 5+

/**
 * Generate a content hash for deduplication
 */
function contentHash(source, title, bankKey) {
  return createHash('sha256')
    .update(`${source}|${title}|${bankKey}`)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Derive confidence tier from signal source type.
 * Tier 1 (Verified): bank's own press releases, IR, regulatory filings
 * Tier 2 (Inferred): news articles, job postings, industry feeds
 * Tier 3 (Estimated): no source URL or unrecognized source
 */
function deriveSignalConfidenceTier(source, sourceUrl) {
  const s = (source || '').toLowerCase();
  const u = (sourceUrl || '').toLowerCase();

  // Tier 1: first-party bank sources
  if (s.includes('press') || s.includes('ir_feed') || s.includes('regulatory')
      || u.includes('/press') || u.includes('/investor') || u.includes('/ir/')) {
    return 1;
  }

  // Tier 2: third-party but sourced
  if (s.includes('news') || s.includes('job') || s.includes('industry')
      || u.includes('news.google') || u.includes('reuters') || u.includes('bloomberg')) {
    return 2;
  }

  // Default: tier 2 if there's a URL (external source), tier 3 if no URL
  return sourceUrl ? 2 : 3;
}

/**
 * Resolve a config-style bank key to a DB key.
 * Config keys: "Nordea_Sweden", DB keys: "Nordea_Sweden" or "Nordea Bank_Sweden"
 */
function resolveBankKeyFromDB(db, configKey) {
  // Try exact match first
  const exact = db.prepare('SELECT key FROM banks WHERE key = ?').get(configKey);
  if (exact) return exact.key;

  // Try bank name match
  const bankName = BANK_SOURCES[configKey]?.name;
  if (bankName) {
    const byName = db.prepare('SELECT key FROM banks WHERE bank_name = ?').get(bankName);
    if (byName) return byName.key;

    // Fuzzy: bank_name contains the config name
    const fuzzy = db.prepare('SELECT key FROM banks WHERE bank_name LIKE ?').get(`%${bankName}%`);
    if (fuzzy) return fuzzy.key;
  }

  return null;
}

/**
 * Run a full signal refresh cycle.
 *
 * @param {Database} db - better-sqlite3 database instance
 * @param {Object} options
 * @param {boolean} options.skipNews - Skip Google News per-bank (faster)
 * @param {boolean} options.skipJobs - Skip job signal queries
 * @param {boolean} options.skipIndustry - Skip industry feeds
 * @param {boolean} options.skipPressReleases - Skip bank press release RSS feeds
 * @param {boolean} options.skipClassify - Skip AI classification
 * @param {Function} options.onProgress - Progress callback
 * @returns {Object} Refresh stats
 */
export async function runSignalRefresh(db, options = {}) {
  const startTime = Date.now();
  const stats = {
    sources: {},
    totalFetched: 0,
    preFiltered: 0,
    classified: 0,
    stored: 0,
    duplicatesSkipped: 0,
    belowThreshold: 0,
    pruned: 0,
    errors: [],
  };

  const log = (msg) => {
    console.log(`  [signals] ${msg}`);
    options.onProgress?.({ message: msg });
  };

  // Log refresh start
  const refreshLogId = db.prepare(
    `INSERT INTO signal_refresh_log (source, status) VALUES ('all', 'running')`
  ).run().lastInsertRowid;

  // Build bank key resolver cache
  const bankKeyCache = {};
  for (const configKey of Object.keys(BANK_SOURCES)) {
    const dbKey = resolveBankKeyFromDB(db, configKey);
    if (dbKey) bankKeyCache[configKey] = dbKey;
  }

  // ── Collect raw articles from all sources ──
  const rawArticles = []; // Array of { title, snippet, link, publishedAt, source, bankKey, bankName }

  // 1. Google News per-bank (existing fetcher)
  if (!options.skipNews) {
    log('Fetching Google News per-bank...');
    try {
      const news = await fetchAllNewsSignals(({ completed, total, bank }) => {
        if (completed % 5 === 0) log(`  News: [${completed}/${total}] ${bank}`);
      });
      let newsCount = 0;
      for (const [configKey, data] of Object.entries(news)) {
        const dbKey = bankKeyCache[configKey];
        if (!dbKey) continue;
        for (const article of (data.articles || []).filter(a => !a.error)) {
          rawArticles.push({
            ...article,
            bankKey: dbKey,
            bankName: BANK_SOURCES[configKey]?.name || configKey,
          });
          newsCount++;
        }
      }
      stats.sources.google_news = newsCount;
      log(`  Google News: ${newsCount} articles`);
    } catch (err) {
      stats.errors.push(`Google News: ${err.message}`);
      log(`  Google News failed: ${err.message}`);
    }
  }

  // 2. Industry feeds
  if (!options.skipIndustry) {
    log('Fetching industry feeds...');
    try {
      const industry = await fetchIndustryFeeds(({ feed }) => {
        log(`  Feed: ${feed}`);
      });
      for (const match of industry.matchedArticles) {
        const dbKey = bankKeyCache[match.bankKey];
        if (!dbKey) continue;
        rawArticles.push({
          ...match.article,
          bankKey: dbKey,
          bankName: match.bankName,
        });
      }
      stats.sources.industry_feeds = industry.matchedCount;
      log(`  Industry feeds: ${industry.totalArticles} total, ${industry.matchedCount} matched to banks`);
    } catch (err) {
      stats.errors.push(`Industry feeds: ${err.message}`);
      log(`  Industry feeds failed: ${err.message}`);
    }
  }

  // 3. Job signals
  if (!options.skipJobs) {
    log('Fetching job signals...');
    try {
      const jobs = await fetchAllJobSignals(({ completed, total, bank }) => {
        if (completed % 5 === 0) log(`  Jobs: [${completed}/${total}] ${bank}`);
      });
      let jobCount = 0;
      for (const [configKey, data] of Object.entries(jobs)) {
        const dbKey = bankKeyCache[configKey];
        if (!dbKey) continue;
        for (const article of data.articles) {
          rawArticles.push({
            ...article,
            bankKey: dbKey,
            bankName: data.bankName,
          });
          jobCount++;
        }
      }
      stats.sources.job_signals = jobCount;
      log(`  Job signals: ${jobCount} articles`);
    } catch (err) {
      stats.errors.push(`Job signals: ${err.message}`);
      log(`  Job signals failed: ${err.message}`);
    }
  }

  // 4. Bank press release RSS feeds (first-party sources)
  if (!options.skipPressReleases) {
    log('Fetching bank press release feeds...');
    try {
      const pressReleases = await fetchAllPressReleases(({ bank }) => {
        log(`  Press: ${bank}`);
      });
      for (const article of pressReleases.articles) {
        const dbKey = bankKeyCache[article.bankKey];
        if (!dbKey) continue;
        rawArticles.push({
          ...article,
          bankKey: dbKey,
        });
      }
      stats.sources.press_releases = pressReleases.totalArticles;
      log(`  Press releases: ${pressReleases.totalArticles} articles from ${pressReleases.feedStats.length} banks`);
    } catch (err) {
      stats.errors.push(`Press releases: ${err.message}`);
      log(`  Press releases failed: ${err.message}`);
    }
  }

  stats.totalFetched = rawArticles.length;
  log(`Total raw articles: ${rawArticles.length}`);

  // ── Deduplicate ──
  const insertOrSkip = db.prepare(`
    INSERT OR IGNORE INTO live_signals (bank_key, source, source_url, title, snippet, published_at, fetched_at, content_hash)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)
  `);

  const newArticles = [];
  for (const article of rawArticles) {
    const hash = contentHash(article.source, article.title, article.bankKey);
    const result = insertOrSkip.run(
      article.bankKey,
      article.source,
      article.link || null,
      article.title,
      article.snippet || null,
      article.publishedAt || null,
      hash,
    );
    if (result.changes > 0) {
      newArticles.push({ ...article, id: result.lastInsertRowid, content_hash: hash });
    } else {
      stats.duplicatesSkipped++;
    }
  }
  log(`New articles after dedup: ${newArticles.length} (${stats.duplicatesSkipped} duplicates skipped)`);

  // ── Pre-filter with keyword heuristics ──
  const filtered = preFilterArticles(newArticles);
  stats.preFiltered = newArticles.length - filtered.length;
  log(`Pre-filtered: ${filtered.length} pass, ${stats.preFiltered} filtered out (no signal keywords)`);

  // Also pick up previously unclassified articles from past runs
  // (they may now pass the improved keyword filter)
  const previouslyUnclassified = db.prepare(`
    SELECT ls.content_hash, ls.title, ls.snippet, ls.source, ls.bank_key, b.bank_name
    FROM live_signals ls
    JOIN banks b ON b.key = ls.bank_key
    WHERE ls.classified_at IS NULL
  `).all().map(row => ({
    title: row.title,
    snippet: row.snippet,
    source: row.source,
    bankKey: row.bank_key,
    bankName: row.bank_name,
    content_hash: row.content_hash,
  }));

  const retroFiltered = preFilterArticles(previouslyUnclassified);
  if (retroFiltered.length > 0) {
    log(`Found ${retroFiltered.length} previously unclassified articles that now pass keyword filter`);
    filtered.push(...retroFiltered);
  }

  // ── AI Classification ──
  if (!options.skipClassify && filtered.length > 0) {
    log(`Classifying ${filtered.length} articles with Claude AI...`);
    try {
      const classified = await classifySignals(filtered, ({ completed, total, batchSize }) => {
        log(`  Batch ${completed + 1}/${total} (${batchSize} articles)`);
      });

      // Update live_signals with classification results
      const updateSignal = db.prepare(`
        UPDATE live_signals
        SET relevance_score = ?, signal_type = ?, implication = ?, priority = ?, classified_at = datetime('now')
        WHERE content_hash = ?
      `);

      const updateBatch = db.transaction((items) => {
        for (const item of items) {
          updateSignal.run(
            item.relevance_score,
            item.signal_type,
            item.implication,
            item.priority,
            item.content_hash,
          );
        }
      });

      updateBatch(classified);
      stats.classified = classified.length;

      // Count stored (above threshold) vs below
      const actionable = classified.filter(c => c.relevance_score >= MIN_RELEVANCE);
      stats.stored = actionable.length;
      stats.belowThreshold = classified.filter(c => c.relevance_score < MIN_RELEVANCE).length;

      // Layer 1: write provenance for actionable signals
      // Two records per signal: title (source-based tier) + implication (always tier 3)
      const provenanceRecords = [];
      for (const sig of actionable) {
        const hash = sig.content_hash;
        const bk = sig.bankKey;
        if (!bk || !hash) continue;

        const signalTier = deriveSignalConfidenceTier(sig.source, sig.link || sig.source_url);
        const pubDate = sig.publishedAt || new Date().toISOString().slice(0, 10);

        // Signal title — source-based confidence tier
        provenanceRecords.push({
          entityType: 'signal',
          entityKey: bk,
          fieldPath: `signals.${hash}.title`,
          value: sig.title,
          sourceType: sig.source || 'unknown',
          sourceUrl: sig.link || sig.source_url || null,
          sourceDate: pubDate,
          confidenceTier: signalTier,
        });

        // Implication — always tier 3 (AI-generated interpretation)
        if (sig.implication) {
          provenanceRecords.push({
            entityType: 'signal',
            entityKey: bk,
            fieldPath: `signals.${hash}.implication`,
            value: sig.implication,
            sourceType: 'ai_classified',
            sourceUrl: null,
            sourceDate: new Date().toISOString().slice(0, 10),
            confidenceTier: 3,
          });
        }
      }
      if (provenanceRecords.length > 0) {
        bulkWriteProvenance(provenanceRecords);
        log(`Provenance: ${provenanceRecords.length} records written for ${actionable.length} signals`);
      }

      log(`Classified: ${stats.stored} actionable (score ${MIN_RELEVANCE}+), ${stats.belowThreshold} below threshold`);
    } catch (err) {
      stats.errors.push(`Classification: ${err.message}`);
      log(`Classification failed: ${err.message}`);
    }
  }

  // ── Prune old signals ──
  const pruneResult = db.prepare(
    `DELETE FROM live_signals WHERE published_at < datetime('now', '-${PRUNE_DAYS} days') AND published_at IS NOT NULL`
  ).run();
  stats.pruned = pruneResult.changes;
  if (stats.pruned > 0) log(`Pruned ${stats.pruned} signals older than ${PRUNE_DAYS} days`);

  // ── Update refresh log ──
  const durationMs = Date.now() - startTime;
  db.prepare(`
    UPDATE signal_refresh_log
    SET status = 'complete',
        articles_fetched = ?,
        articles_classified = ?,
        errors = ?,
        duration_ms = ?,
        completed_at = datetime('now')
    WHERE id = ?
  `).run(stats.totalFetched, stats.classified, stats.errors.length, durationMs, refreshLogId);

  log(`Signal refresh complete in ${(durationMs / 1000).toFixed(1)}s`);
  return stats;
}

// ── Standalone runner ──
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  // Load env
  const dotenv = await import('dotenv');
  dotenv.config({ override: true, quiet: true });

  const { getDb, closeDb } = await import('../db.mjs');
  const db = getDb();

  console.log('\n' + '='.repeat(60));
  console.log('  Live Signal Ingestion Pipeline');
  console.log('='.repeat(60));
  console.log(`  API Key: ${process.env.ANTHROPIC_API_KEY ? 'configured' : 'NOT SET'}`);

  const flags = process.argv.slice(2);
  const options = {
    skipNews: flags.includes('--skip-news'),
    skipJobs: flags.includes('--skip-jobs'),
    skipIndustry: flags.includes('--skip-industry'),
    skipPressReleases: flags.includes('--skip-press'),
    skipClassify: flags.includes('--skip-classify') || !process.env.ANTHROPIC_API_KEY,
  };

  if (options.skipClassify && !flags.includes('--skip-classify')) {
    console.log('  NOTE: Skipping AI classification (ANTHROPIC_API_KEY not set)');
  }

  try {
    const stats = await runSignalRefresh(db, options);

    console.log('\n' + '-'.repeat(40));
    console.log('  Results:');
    for (const [source, count] of Object.entries(stats.sources)) {
      console.log(`    ${source}: ${count} articles`);
    }
    console.log(`    Total fetched: ${stats.totalFetched}`);
    console.log(`    Duplicates skipped: ${stats.duplicatesSkipped}`);
    console.log(`    Pre-filtered out: ${stats.preFiltered}`);
    console.log(`    AI classified: ${stats.classified}`);
    console.log(`    Stored (score ${MIN_RELEVANCE}+): ${stats.stored}`);
    console.log(`    Pruned: ${stats.pruned}`);
    if (stats.errors.length > 0) {
      console.log(`    Errors: ${stats.errors.join('; ')}`);
    }

    // Show top signals
    const top = db.prepare(`
      SELECT ls.*, b.bank_name FROM live_signals ls
      JOIN banks b ON b.key = ls.bank_key
      WHERE ls.relevance_score >= ?
      ORDER BY ls.relevance_score DESC, ls.published_at DESC
      LIMIT 10
    `).all(MIN_RELEVANCE);

    if (top.length > 0) {
      console.log(`\n  Top ${top.length} signals:`);
      for (const s of top) {
        console.log(`    [${s.relevance_score}] ${s.bank_name}: ${s.title.substring(0, 70)}`);
        if (s.implication) console.log(`         ${s.implication.substring(0, 80)}`);
      }
    }
  } finally {
    closeDb();
  }
}
