/**
 * Data Pipeline Configuration
 * Maps banks to their public data sources for automated fetching.
 *
 * Sources:
 *   - Google Play Store (app ratings, review counts)
 *   - Apple App Store (app ratings, review counts)
 *   - Yahoo Finance (stock price, market cap, P/E)
 *   - RSS feeds (press releases, news)
 *   - Company IR pages (investor relations)
 */

export const PIPELINE_CONFIG = {
  // How often to run (in hours)
  refreshInterval: 24,

  // Output paths
  output: {
    liveData: '../src/data/liveData.json',
    log: './logs/pipeline.log',
  },

  // Rate limiting
  rateLimits: {
    requestDelayMs: 1500,  // Delay between requests to same host
    maxRetries: 2,
    timeoutMs: 15000,
  },
};

/**
 * Bank data source registry
 * Each bank has: googlePlayId, appStoreId, ticker, rssFeed, irUrl
 * Set excluded: true to skip a bank in all pipeline runs (stocks, ratings, news, contacts)
 */
export const BANK_SOURCES = {
  // ── SWEDEN ──
  Nordea_Sweden: {
    name: 'Nordea',
    country: 'Sweden',
    googlePlayId: 'com.nordea.mobilebank',
    appStoreId: '393498075',
    ticker: 'NDA-FI.HE',     // Helsinki exchange
    rssFeed: 'https://www.nordea.com/en/data_export/articles_xml/305',
    irUrl: 'https://www.nordea.com/en/investors',
  },
  SEB_Sweden: {
    name: 'SEB',
    country: 'Sweden',
    googlePlayId: 'se.seb.privat',
    appStoreId: '390498745',
    ticker: 'SEB-A.ST',
    rssFeed: 'https://news.google.com/rss/search?q=site:sebgroup.com+press+release&hl=en',
    irUrl: 'https://sebgroup.com/investor-relations',
  },
  Handelsbanken_Sweden: {
    name: 'Handelsbanken',
    country: 'Sweden',
    googlePlayId: 'com.handelsbanken.mobile',
    appStoreId: '429747976',
    ticker: 'SHB-A.ST',
    rssFeed: null,
    irUrl: 'https://www.handelsbanken.com/en/investor-relations',
  },
  Swedbank_Sweden: {
    name: 'Swedbank',
    country: 'Sweden',
    googlePlayId: 'com.swedbank',
    appStoreId: '344161302',
    ticker: 'SWED-A.ST',
    rssFeed: null,
    irUrl: 'https://www.swedbank.com/investor-relations.html',
  },
  'Länsförsäkringar_Sweden': {
    name: 'Länsförsäkringar',
    country: 'Sweden',
    googlePlayId: 'se.lansforsakringar.mobile',
    appStoreId: '453312364',
    ticker: null,              // Mutual/cooperative — not listed
    rssFeed: null,
    irUrl: null,
  },
  SBAB_Sweden: {
    name: 'SBAB',
    country: 'Sweden',
    googlePlayId: 'se.sbab.bankapp',
    appStoreId: '1187498215',
    ticker: null,
    rssFeed: null,
    irUrl: null,
  },
  Skandiabanken_Sweden: {
    name: 'Skandiabanken',
    country: 'Sweden',
    googlePlayId: 'se.skandia.android',
    appStoreId: '1141498145',
    ticker: null,
    rssFeed: null,
    irUrl: null,
  },
  TF_Bank_Sweden: {
    name: 'TF Bank',
    country: 'Sweden',
    googlePlayId: null,
    appStoreId: null,
    ticker: 'TFBANK.ST',
    rssFeed: null,
    irUrl: null,
  },

  // ── NORWAY ──
  DNB_Norway: {
    name: 'DNB',
    country: 'Norway',
    googlePlayId: 'no.dnb.mobile',
    appStoreId: '390224987',
    ticker: 'DNB.OL',
    rssFeed: 'https://news.google.com/rss/search?q=site:dnb.no+press+release&hl=en',
    irUrl: 'https://www.dnb.no/en/about-us/investor-relations',
  },
  Sbanken_Norway: {
    name: 'Sbanken',
    country: 'Norway',
    googlePlayId: 'no.skandiabanken',
    appStoreId: '440444498',
    ticker: null,              // Acquired by DNB
    rssFeed: null,
    irUrl: null,
  },
  'SpareBank 1 SR-Bank_Norway': {
    name: 'SpareBank 1 SR-Bank',
    country: 'Norway',
    googlePlayId: 'no.sparebank1.mobilbank',
    appStoreId: '383279654',
    ticker: 'SRBNK.OL',
    rssFeed: null,
    irUrl: null,
  },
  'Storebrand Bank_Norway': {
    name: 'Storebrand Bank',
    country: 'Norway',
    googlePlayId: null,
    appStoreId: null,
    ticker: 'STB.OL',
    rssFeed: null,
    irUrl: null,
  },

  // ── DENMARK ──
  'Danske Bank_Denmark': {
    name: 'Danske Bank',
    country: 'Denmark',
    googlePlayId: 'com.danskebank.mobilebank3.dk',
    appStoreId: '477444950',
    ticker: 'DANSKE.CO',
    rssFeed: 'https://news.google.com/rss/search?q=site:danskebank.com+press+release&hl=en',
    irUrl: 'https://danskebank.com/investor-relations',
  },
  Nykredit_Denmark: {
    name: 'Nykredit',
    country: 'Denmark',
    googlePlayId: 'dk.nykredit.mobilbank',
    appStoreId: '480050498',
    ticker: null,              // Not publicly listed
    rssFeed: null,
    irUrl: null,
  },
  'Jyske Bank_Denmark': {
    name: 'Jyske Bank',
    country: 'Denmark',
    googlePlayId: 'dk.jyskebank.mobilbank',
    appStoreId: '412409498',
    ticker: 'JYSK.CO',
    rssFeed: null,
    irUrl: null,
  },
  Lunar_Denmark: {
    name: 'Lunar',
    country: 'Denmark',
    googlePlayId: 'com.lunarway.app',
    appStoreId: '1190503395',
    ticker: null,              // Private
    rssFeed: null,
    irUrl: null,
  },
  Sydbank_Denmark: {
    name: 'Sydbank',
    country: 'Denmark',
    googlePlayId: 'dk.sydbank.mobilbank',
    appStoreId: '1072802498',
    ticker: 'SYDB.CO',
    rssFeed: null,
    irUrl: null,
  },
  'Spar Nord_Denmark': {
    name: 'Spar Nord',
    country: 'Denmark',
    googlePlayId: 'dk.sparnord.mobilbank',
    appStoreId: '1072900498',
    ticker: 'SPNO.CO',
    rssFeed: null,
    irUrl: null,
  },

  // ── FINLAND ──
  'OP Financial Group_Finland': {
    name: 'OP Financial Group',
    country: 'Finland',
    googlePlayId: 'fi.op.android.opbank',
    appStoreId: '524192375',
    ticker: null,              // Cooperative — not publicly listed
    rssFeed: 'https://news.cision.com/op-pohjola?format=rss',
    irUrl: 'https://www.op.fi/op-financial-group/investor-relations',
  },
  'Aktia Bank_Finland': {
    name: 'Aktia Bank',
    country: 'Finland',
    googlePlayId: 'fi.aktia.mobilebank',
    appStoreId: '1097048245',
    ticker: 'AKTIA.HE',
    rssFeed: null,
    irUrl: null,
  },
  'S-Bank_Finland': {
    name: 'S-Bank',
    country: 'Finland',
    googlePlayId: 'fi.spankki.android',
    appStoreId: '1054367802',
    ticker: null,
    rssFeed: null,
    irUrl: null,
  },

  // ── ICELAND ──
  'Landsbankinn_Iceland': {
    name: 'Landsbankinn',
    country: 'Iceland',
    googlePlayId: 'is.landsbankinn.android',
    appStoreId: '1138395205',
    ticker: null,
    rssFeed: null,
    irUrl: null,
  },
  'Íslandsbanki_Iceland': {
    name: 'Íslandsbanki',
    country: 'Iceland',
    googlePlayId: 'is.islandsbanki.app',
    appStoreId: '1193407922',
    ticker: 'ISB.IC',
    rssFeed: null,
    irUrl: null,
  },
  'Arion Bank_Iceland': {
    name: 'Arion Bank',
    country: 'Iceland',
    googlePlayId: 'is.arionbanki.app',
    appStoreId: '1254131171',
    ticker: 'ARION.IC',
    rssFeed: null,
    irUrl: null,
  },
};

/**
 * Staleness thresholds by field type (in days).
 * Used by provenanceWriter.runStalenessCheck() to flag outdated records.
 * A field is stale when: now - source_date > threshold.
 */
export const STALENESS_THRESHOLDS = {
  financial_kpis: 180,        // annual report cycle
  leadership: 90,             // executive tenures change faster
  strategy: 180,
  app_ratings: 30,
  stock_data: 1,
  signals: 30,
  qualification_scores: 365,  // manual scores stay valid longer
  pain_points: 180,
};

/**
 * Maps field_path prefixes to staleness categories.
 * provenanceWriter uses this to look up the right threshold for each field.
 */
export const FIELD_STALENESS_MAP = {
  'operational_profile.': 'financial_kpis',
  'live_stock.': 'stock_data',
  'app_rating_': 'app_ratings',
  'key_decision_makers.': 'leadership',
  'digital_strategy': 'strategy',
  'strategic_initiatives': 'strategy',
  'pain_points.': 'pain_points',
  'live_news.': 'signals',
  'signals.': 'signals',
  'qualification.': 'qualification_scores',
};

// Helper: get all banks with a specific source
export function banksWithSource(sourceKey) {
  return Object.entries(BANK_SOURCES)
    .filter(([, cfg]) => cfg[sourceKey])
    .map(([key, cfg]) => ({ key, ...cfg }));
}
