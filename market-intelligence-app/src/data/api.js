/**
 * REST API Client — fetches data from the SQLite-backed API proxy
 */
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const DEFAULT_TIMEOUT = 15000; // 15s for data reads
const AI_TIMEOUT = 150000;    // 150s for AI-powered endpoints

async function request(path, options = {}) {
  const { signal: externalSignal, timeout, ...rest } = options;

  // Create timeout abort if no external signal provided
  const controller = new AbortController();
  const timeoutMs = timeout || DEFAULT_TIMEOUT;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // If caller provides their own signal (e.g., useSearch), link it
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort());
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...rest.headers },
      signal: controller.signal,
      ...rest,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Request failed: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError' && externalSignal?.aborted) {
      throw err; // Re-throw caller-initiated aborts (e.g., search cancellation)
    }
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s: ${path}`);
    }
    throw err;
  }
}

// ── Banks ──
export const fetchBanks = () => request('/api/banks');
export const fetchBank = (key) => request(`/api/banks/${encodeURIComponent(key)}`);
export const createBank = (data) => request('/api/banks', { method: 'POST', body: JSON.stringify(data) });
export const updateBank = (key, data) => request(`/api/banks/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteBank = (key) => request(`/api/banks/${encodeURIComponent(key)}`, { method: 'DELETE' });

// ── Bank sub-resources ──
export const fetchBankQualification = (key) => request(`/api/banks/${encodeURIComponent(key)}/qualification`);
export const updateBankQualification = (key, data) => request(`/api/banks/${encodeURIComponent(key)}/qualification`, { method: 'PUT', body: JSON.stringify(data) });
export const fetchBankCx = (key) => request(`/api/banks/${encodeURIComponent(key)}/cx`);
export const fetchBankCompetition = (key) => request(`/api/banks/${encodeURIComponent(key)}/competition`);
export const fetchBankValueSelling = (key) => request(`/api/banks/${encodeURIComponent(key)}/value-selling`);
export const fetchBankSources = (key) => request(`/api/banks/${encodeURIComponent(key)}/sources`);
export const fetchBankRelationship = (key) => request(`/api/banks/${encodeURIComponent(key)}/relationships`);

// ── Markets ──
export const fetchMarkets = () => request('/api/markets');
export const fetchMarket = (key) => request(`/api/markets/${encodeURIComponent(key)}`);
export const fetchMarketBanks = (key) => request(`/api/markets/${encodeURIComponent(key)}/banks`);

// ── Countries ──
export const fetchCountries = () => request('/api/countries');
export const fetchCountry = (name) => request(`/api/countries/${encodeURIComponent(name)}`);
export const fetchCountryBanks = (name) => request(`/api/countries/${encodeURIComponent(name)}/banks`);

// ── Stats & Search ──
export const fetchStats = () => request('/api/stats');
export const searchAll = (query, options) => request(`/api/search?q=${encodeURIComponent(query)}`, options);

// ── Ingestion Pipeline ──
export const fetchIngestionLog = ({ bankKey, source, limit = 50 } = {}) => {
  const params = new URLSearchParams();
  if (bankKey) params.set('bank_key', bankKey);
  if (source) params.set('source', source);
  if (limit) params.set('limit', String(limit));
  return request(`/api/ingestion-log?${params}`);
};

export const fetchBankFreshness = (key) => request(`/api/banks/${encodeURIComponent(key)}/freshness`);
export const fetchBankAiAnalyses = (key) => request(`/api/banks/${encodeURIComponent(key)}/ai-analyses`);

// ── Meeting Research (AI-powered — longer timeouts) ──
export const checkResearchStatus = () => request('/api/research/status');
export const researchPerson = (data) => request('/api/research/person', { method: 'POST', body: JSON.stringify(data), timeout: AI_TIMEOUT });
export const enrichContext = (data) => request('/api/research/context', { method: 'POST', body: JSON.stringify(data), timeout: AI_TIMEOUT });
export const generateMeetingPrep = (data) => request('/api/research/meeting-prep', { method: 'POST', body: JSON.stringify(data), timeout: AI_TIMEOUT });

// ── Landing Zones ──
export const fetchLandingZoneMatrix = (key) => request(`/api/banks/${encodeURIComponent(key)}/landing-zones`);
export const analyzeLandingZones = (data) => request('/api/research/landing-zones', { method: 'POST', body: JSON.stringify(data), timeout: AI_TIMEOUT });

// ── Discovery Storyline ──
export const fetchDiscoveryStoryline = (key) => request(`/api/banks/${encodeURIComponent(key)}/discovery-storyline`);
export const generateDiscoveryStoryline = (data) => request('/api/research/discovery-storyline', { method: 'POST', body: JSON.stringify(data), timeout: AI_TIMEOUT });

// ── Value Hypothesis (meeting-tailored) ──
export const generateValueHypothesis = (data) => request('/api/research/value-hypothesis', { method: 'POST', body: JSON.stringify(data), timeout: AI_TIMEOUT });
