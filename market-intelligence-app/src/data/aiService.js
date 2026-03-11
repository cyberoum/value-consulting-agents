/**
 * AI Service — Client-side API for Claude AI analysis
 * Routes requests through the local API proxy (scripts/apiProxy.mjs)
 * Falls back to the pattern-based intelEngine when proxy is unavailable.
 */

const API_BASE = 'http://localhost:3001';

let _statusCache = null;
let _statusCheckTime = 0;
const STATUS_CACHE_TTL = 30000; // 30s

/**
 * Check if the AI API proxy is available
 * Caches result for 30 seconds to avoid hammering
 */
export async function checkAiAvailability() {
  const now = Date.now();
  if (_statusCache !== null && now - _statusCheckTime < STATUS_CACHE_TTL) {
    return _statusCache;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE}/api/status`, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      _statusCache = data.available === true;
    } else {
      _statusCache = false;
    }
  } catch {
    _statusCache = false;
  }
  _statusCheckTime = now;
  return _statusCache;
}

/**
 * Analyze raw intelligence text with Claude AI
 * @param {string} category - Intel category (signal, pain_point, etc.)
 * @param {string} text - Raw intelligence text
 * @param {object} bankContext - { bankKey, bankName }
 * @returns {object} Structured intelligence result
 */
export async function analyzeWithAI(category, text, bankContext = {}) {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, text, bankContext }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.result;
}

/**
 * Analyze news articles for a bank with Claude AI
 * @param {string} bankName
 * @param {Array} articles
 * @returns {object} Structured news analysis
 */
export async function analyzeNewsWithAI(bankName, articles) {
  const res = await fetch(`${API_BASE}/api/analyze-news`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bankName, articles }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.result;
}
