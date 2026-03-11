/**
 * Live Data Provider
 * Imports pipeline-generated liveData.json and provides
 * accessor functions for the React app.
 *
 * The JSON is statically imported by Vite — after running the pipeline,
 * the dev server hot-reloads and picks up changes automatically.
 */

import liveData from './liveData.json';

// ── Pipeline metadata ──

export function getPipelineStatus() {
  return {
    lastRun: liveData.lastRun,
    version: liveData.version,
    fetchers: liveData.fetchers || {},
    bankCount: Object.keys(liveData.banks || {}).length,
    isPopulated: !!liveData.lastRun,
  };
}

export function getFetcherStatus(fetcherName) {
  return liveData.fetchers?.[fetcherName] || null;
}

// ── Bank-level accessors ──

export function getLiveBankData(bankKey) {
  return liveData.banks?.[bankKey] || null;
}

// ── App Ratings ──

export function getLiveAppRating(bankKey) {
  const bank = liveData.banks?.[bankKey];
  if (!bank?.appRatings) return null;

  return {
    android: bank.appRatings.android?.rating ?? null,
    androidReviews: bank.appRatings.android?.reviews ?? null,
    ios: bank.appRatings.ios?.rating ?? null,
    iosReviews: bank.appRatings.ios?.reviews ?? null,
    fetchedAt: bank.appRatings.android?.fetchedAt || bank.appRatings.ios?.fetchedAt,
  };
}

/**
 * Compare live rating vs static data — returns delta
 * Positive = improvement, negative = decline
 */
export function getRatingDelta(bankKey, staticAndroid, staticIos) {
  const live = getLiveAppRating(bankKey);
  if (!live) return null;

  return {
    android: live.android && staticAndroid ? Math.round((live.android - staticAndroid) * 10) / 10 : null,
    ios: live.ios && staticIos ? Math.round((live.ios - staticIos) * 10) / 10 : null,
  };
}

// ── News Signals ──

export function getLiveNews(bankKey) {
  const bank = liveData.banks?.[bankKey];
  if (!bank?.news) return null;

  return {
    articles: bank.news.articles || [],
    topSignals: bank.news.topSignals || [],
    signalCount: bank.news.signalCount || 0,
    articleCount: bank.news.articleCount || 0,
    fetchedAt: bank.news.fetchedAt,
  };
}

export function getHighRelevanceNews(bankKey, minScore = 2) {
  const news = getLiveNews(bankKey);
  if (!news) return [];
  return news.articles.filter(a => a.relevanceScore >= minScore);
}

// ── Stock Data ──

export function getLiveStockData(bankKey) {
  const bank = liveData.banks?.[bankKey];
  if (!bank?.stock) return null;

  return {
    ticker: bank.stock.ticker,
    currency: bank.stock.currency,
    price: bank.stock.price,
    dayChange: bank.stock.dayChange,
    dayChangePercent: bank.stock.dayChangePercent,
    fiftyTwoWeekHigh: bank.stock.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: bank.stock.fiftyTwoWeekLow,
    marketCap: bank.stock.marketCap,
    marketCapFormatted: bank.stock.marketCapFormatted,
    peRatio: bank.stock.peRatio,
    dividendYield: bank.stock.dividendYield,
    exchange: bank.stock.exchange,
    fetchedAt: bank.stock.fetchedAt,
    hasError: !!bank.stock.error,
  };
}

// ── AI Analysis ──

export function getAiAnalysis(bankKey) {
  const bank = liveData.banks?.[bankKey];
  if (!bank?.aiAnalysis) return null;
  return bank.aiAnalysis;
}

export function getAiSignals(bankKey) {
  const analysis = getAiAnalysis(bankKey);
  if (!analysis?.signals) return [];
  return analysis.signals;
}

export function getAiSuggestedActions(bankKey) {
  const analysis = getAiAnalysis(bankKey);
  if (!analysis?.suggestedActions) return [];
  return analysis.suggestedActions;
}

export function getBanksWithAiAnalysis() {
  const banks = liveData.banks || {};
  return Object.entries(banks)
    .filter(([, b]) => b.aiAnalysis && !b.aiAnalysis.error)
    .map(([key, b]) => ({ key, analysis: b.aiAnalysis }));
}

// ── Aggregations ──

export function getAllLiveBanks() {
  return Object.keys(liveData.banks || {});
}

export function getSignalHeatmap() {
  // Returns signal frequency across all banks
  const heatmap = {};
  for (const [bankKey, bank] of Object.entries(liveData.banks || {})) {
    if (bank.news?.topSignals) {
      for (const signal of bank.news.topSignals) {
        if (!heatmap[signal]) heatmap[signal] = [];
        heatmap[signal].push(bankKey);
      }
    }
  }
  return heatmap;
}

export function getPipelineSummary() {
  const banks = liveData.banks || {};
  const bankKeys = Object.keys(banks);

  return {
    lastRun: liveData.lastRun,
    totalBanks: bankKeys.length,
    withRatings: bankKeys.filter(k => banks[k].appRatings?.android?.rating || banks[k].appRatings?.ios?.rating).length,
    withNews: bankKeys.filter(k => banks[k].news?.articleCount > 0).length,
    withStocks: bankKeys.filter(k => banks[k].stock?.price).length,
    withAiAnalysis: bankKeys.filter(k => banks[k].aiAnalysis && !banks[k].aiAnalysis?.error).length,
    totalArticles: bankKeys.reduce((sum, k) => sum + (banks[k].news?.articleCount || 0), 0),
    totalSignals: bankKeys.reduce((sum, k) => sum + (banks[k].news?.signalCount || 0), 0),
  };
}
