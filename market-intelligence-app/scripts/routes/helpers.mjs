/**
 * Shared HTTP helpers for route modules.
 */

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
];

export function setCorsHeaders(res, origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString();
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

export function jsonResponse(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Simple in-memory rate limiter for expensive AI endpoints.
 * Prevents accidental token burn from runaway requests.
 * @param {number} maxRequests - Max requests in the time window
 * @param {number} windowMs - Time window in milliseconds
 */
export function createRateLimiter(maxRequests = 10, windowMs = 60_000) {
  const hits = [];
  return function checkRate(res) {
    const now = Date.now();
    // Evict expired entries
    while (hits.length > 0 && hits[0] <= now - windowMs) hits.shift();
    if (hits.length >= maxRequests) {
      jsonResponse(res, 429, {
        error: `Rate limit exceeded: max ${maxRequests} AI requests per ${windowMs / 1000}s. Please wait.`,
      });
      return false; // blocked
    }
    hits.push(now);
    return true; // allowed
  };
}

export { ALLOWED_ORIGINS };
