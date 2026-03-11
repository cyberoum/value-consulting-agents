#!/usr/bin/env node
/**
 * Local API Proxy Server
 * ──────────────────────
 * Provides a lightweight HTTP API that the React app can call to
 * route requests to the Claude API, keeping the API key server-side.
 *
 * Endpoints:
 *   POST /api/analyze       — Analyze raw intelligence text
 *   POST /api/analyze-news  — Analyze news articles for a bank
 *   GET  /api/status        — Check if API key is configured
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/apiProxy.mjs
 *   npm run api
 */

import { createServer } from 'http';
import { structureIntelWithClaude, analyzeNewsForBank, isClaudeAvailable } from './fetchers/claudeAnalyzer.mjs';

const PORT = process.env.API_PORT || 3001;
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173', 'http://127.0.0.1:5173'];

// ── CORS Helper ──
function setCorsHeaders(res, origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// ── Request Body Parser ──
function parseBody(req) {
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

// ── JSON Response Helper ──
function jsonResponse(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ── Route Handler ──
async function handleRequest(req, res) {
  const origin = req.headers.origin || '';
  setCorsHeaders(res, origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  try {
    // ── GET /api/status ──
    if (path === '/api/status' && req.method === 'GET') {
      return jsonResponse(res, 200, {
        available: isClaudeAvailable(),
        model: 'claude-sonnet-4-20250514',
        timestamp: new Date().toISOString(),
      });
    }

    // ── POST /api/analyze ──
    if (path === '/api/analyze' && req.method === 'POST') {
      if (!isClaudeAvailable()) {
        return jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured' });
      }

      const { category, text, bankContext } = await parseBody(req);
      if (!category || !text) {
        return jsonResponse(res, 400, { error: 'Missing required fields: category, text' });
      }

      console.log(`🤖 Analyzing ${category} for ${bankContext?.bankName || 'unknown bank'}...`);
      const result = await structureIntelWithClaude(category, text, bankContext || {});
      console.log(`   ✅ Analysis complete`);
      return jsonResponse(res, 200, { result, _source: 'claude-ai' });
    }

    // ── POST /api/analyze-news ──
    if (path === '/api/analyze-news' && req.method === 'POST') {
      if (!isClaudeAvailable()) {
        return jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured' });
      }

      const { bankName, articles } = await parseBody(req);
      if (!bankName || !articles) {
        return jsonResponse(res, 400, { error: 'Missing required fields: bankName, articles' });
      }

      console.log(`🤖 Analyzing ${articles.length} articles for ${bankName}...`);
      const result = await analyzeNewsForBank(bankName, articles);
      console.log(`   ✅ News analysis complete`);
      return jsonResponse(res, 200, { result, _source: 'claude-ai' });
    }

    // ── 404 ──
    return jsonResponse(res, 404, { error: `Not found: ${path}` });
  } catch (err) {
    console.error(`❌ Error handling ${path}:`, err.message);
    return jsonResponse(res, 500, { error: err.message });
  }
}

// ── Start Server ──
const server = createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  🤖 Market Intelligence API Proxy`);
  console.log(`${'═'.repeat(50)}`);
  console.log(`  📍 http://localhost:${PORT}`);
  console.log(`  🔑 Claude API: ${isClaudeAvailable() ? '✅ Available' : '❌ Not configured'}`);
  console.log(`  📡 CORS: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`\n  Endpoints:`);
  console.log(`    GET  /api/status        — Check API availability`);
  console.log(`    POST /api/analyze       — Analyze raw intelligence`);
  console.log(`    POST /api/analyze-news  — Analyze bank news articles`);
  console.log(`${'═'.repeat(50)}\n`);
});
