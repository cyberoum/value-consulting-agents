/**
 * Merge Helpers — write fetcher results into SQLite with namespaced merge
 *
 * Each helper:
 *   1. Reads existing data from the target table
 *   2. Merges new data under a `live_*` or `pdf_*` namespace
 *   3. Writes back the merged JSON
 *   4. Logs the action to ingestion_log
 *
 * This ensures automated data never overwrites manually curated fields.
 */

// ── Logging ──

export function logIngestion(db, runId, bankKey, source, action, tableName, details) {
  db.prepare(`
    INSERT INTO ingestion_log (run_id, bank_key, source, action, table_name, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    runId,
    bankKey || null,
    source,
    action,
    tableName || null,
    typeof details === 'string' ? details : JSON.stringify(details)
  );
}

// ── Stock Data → banks.data.live_stock ──

export function mergeStockData(db, bankKey, stockData, runId) {
  const row = db.prepare('SELECT data FROM banks WHERE key = ?').get(bankKey);
  if (!row) {
    logIngestion(db, runId, bankKey, 'stock_yahoo', 'skip', 'banks', 'Bank not found in DB');
    return false;
  }

  const data = JSON.parse(row.data);
  data.live_stock = {
    ticker: stockData.ticker,
    currency: stockData.currency,
    price: stockData.price,
    dayChange: stockData.dayChange,
    dayChangePercent: stockData.dayChangePercent,
    fiftyTwoWeekHigh: stockData.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: stockData.fiftyTwoWeekLow,
    marketCap: stockData.marketCap,
    marketCapFormatted: stockData.marketCapFormatted,
    peRatio: stockData.peRatio,
    dividendYield: stockData.dividendYield,
    exchange: stockData.exchange,
    fetchedAt: stockData.fetchedAt || new Date().toISOString(),
  };

  db.prepare('UPDATE banks SET data = ?, updated_at = datetime(\'now\') WHERE key = ?')
    .run(JSON.stringify(data), bankKey);

  logIngestion(db, runId, bankKey, 'stock_yahoo', 'update', 'banks', {
    field: 'data.live_stock',
    price: stockData.price,
    ticker: stockData.ticker,
  });
  return true;
}

// ── News Signals → banks.data.live_news ──

export function mergeNewsData(db, bankKey, newsData, runId) {
  const row = db.prepare('SELECT data FROM banks WHERE key = ?').get(bankKey);
  if (!row) {
    logIngestion(db, runId, bankKey, 'news_rss', 'skip', 'banks', 'Bank not found in DB');
    return false;
  }

  const data = JSON.parse(row.data);
  data.live_news = {
    articles: (newsData.articles || []).slice(0, 10), // keep top 10
    topSignals: newsData.topSignals || [],
    signalCount: newsData.signalCount || 0,
    articleCount: newsData.articleCount || 0,
    fetchedAt: newsData.fetchedAt || new Date().toISOString(),
  };

  db.prepare('UPDATE banks SET data = ?, updated_at = datetime(\'now\') WHERE key = ?')
    .run(JSON.stringify(data), bankKey);

  logIngestion(db, runId, bankKey, 'news_rss', 'update', 'banks', {
    field: 'data.live_news',
    articleCount: data.live_news.articleCount,
    signalCount: data.live_news.signalCount,
  });
  return true;
}

// ── App Ratings → cx table ──

export function mergeAppRatings(db, bankKey, ratings, runId) {
  // Check if bank exists
  const bank = db.prepare('SELECT key FROM banks WHERE key = ?').get(bankKey);
  if (!bank) {
    logIngestion(db, runId, bankKey, 'app_ratings', 'skip', 'cx', 'Bank not found in DB');
    return false;
  }

  const iosRating = ratings.ios?.rating ?? null;
  const androidRating = ratings.android?.rating ?? null;

  // Check existing cx row
  const existing = db.prepare('SELECT * FROM cx WHERE bank_key = ?').get(bankKey);

  if (existing) {
    // Merge into existing cx data
    const data = existing.data ? JSON.parse(existing.data) : {};
    data.live_ratings = {
      ios: ratings.ios || null,
      android: ratings.android || null,
      fetchedAt: new Date().toISOString(),
    };

    db.prepare(`
      UPDATE cx SET
        app_rating_ios = COALESCE(?, app_rating_ios),
        app_rating_android = COALESCE(?, app_rating_android),
        data = ?,
        updated_at = datetime('now')
      WHERE bank_key = ?
    `).run(iosRating, androidRating, JSON.stringify(data), bankKey);
  } else {
    // Create new cx row
    const data = {
      live_ratings: {
        ios: ratings.ios || null,
        android: ratings.android || null,
        fetchedAt: new Date().toISOString(),
      },
    };
    db.prepare(`
      INSERT INTO cx (bank_key, app_rating_ios, app_rating_android, data)
      VALUES (?, ?, ?, ?)
    `).run(bankKey, iosRating, androidRating, JSON.stringify(data));
  }

  logIngestion(db, runId, bankKey, 'app_ratings', existing ? 'update' : 'insert', 'cx', {
    ios: iosRating,
    android: androidRating,
  });
  return true;
}

// ── AI Analysis → ai_analyses table ──

export function mergeAiAnalysis(db, bankKey, analysis, analysisType, runId) {
  // Check if bank exists
  const bank = db.prepare('SELECT key FROM banks WHERE key = ?').get(bankKey);
  if (!bank) {
    logIngestion(db, runId, bankKey, 'ai_analysis', 'skip', 'ai_analyses', 'Bank not found in DB');
    return false;
  }

  db.prepare(`
    INSERT INTO ai_analyses (bank_key, analysis_type, result, created_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(bank_key, analysis_type) DO UPDATE SET
      result = excluded.result, created_at = excluded.created_at
  `).run(bankKey, analysisType, JSON.stringify(analysis));

  logIngestion(db, runId, bankKey, 'ai_analysis', 'update', 'ai_analyses', {
    analysisType,
    hasSignals: !!(analysis.signals?.length),
    relevance: analysis.backbaseRelevance || 'unknown',
  });
  return true;
}

// ── PDF Extraction → banks.data.pdf_* ──

export function mergePdfExtraction(db, bankKey, extracted, runId) {
  const row = db.prepare('SELECT data FROM banks WHERE key = ?').get(bankKey);
  if (!row) {
    logIngestion(db, runId, bankKey, 'pdf_ingest', 'skip', 'banks', 'Bank not found in DB');
    return false;
  }

  const data = JSON.parse(row.data);

  // Write each extraction section under pdf_ namespace
  if (extracted.bank_profile) data.pdf_financials = extracted.bank_profile;
  if (extracted.digital_strategy) data.pdf_digital_strategy = extracted.digital_strategy;
  if (extracted.leadership) data.pdf_leadership = extracted.leadership;
  if (extracted.competitive_landscape) data.pdf_competitive = extracted.competitive_landscape;
  if (extracted.pain_points_indicators) data.pdf_pain_points = extracted.pain_points_indicators;
  if (extracted.strategic_priorities) data.pdf_strategic_priorities = extracted.strategic_priorities;
  if (extracted.risk_factors) data.pdf_risk_factors = extracted.risk_factors;
  data.pdf_extracted_at = new Date().toISOString();

  db.prepare('UPDATE banks SET data = ?, updated_at = datetime(\'now\') WHERE key = ?')
    .run(JSON.stringify(data), bankKey);

  // Also store the full extraction as an AI analysis
  db.prepare(`
    INSERT INTO ai_analyses (bank_key, analysis_type, result, created_at)
    VALUES (?, 'pdf_annual_report', ?, datetime('now'))
    ON CONFLICT(bank_key, analysis_type) DO UPDATE SET
      result = excluded.result, created_at = excluded.created_at
  `).run(bankKey, JSON.stringify(extracted));

  logIngestion(db, runId, bankKey, 'pdf_ingest', 'update', 'banks', {
    sections: Object.keys(extracted).filter(k => extracted[k]),
  });
  return true;
}

// ── Bank Key Resolution ──
// Maps config.mjs keys to DB keys (handles potential mismatches)

export function resolveBankKey(db, configKey, bankName) {
  // Try exact match
  let row = db.prepare('SELECT key FROM banks WHERE key = ?').get(configKey);
  if (row) return row.key;

  // Try by bank name
  if (bankName) {
    row = db.prepare('SELECT key FROM banks WHERE bank_name = ?').get(bankName);
    if (row) return row.key;
  }

  return null;
}
