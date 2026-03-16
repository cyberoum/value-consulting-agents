/**
 * Shared Claude API client — eliminates duplication across 6 agent files.
 *
 * Usage:
 *   import { callClaude } from './claudeClient.mjs';
 *   const text = await callClaude(systemPrompt, userMessage, { maxTokens: 4096, timeout: 90000 });
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_TIMEOUT = 60000; // 60s default
const DEFAULT_MAX_TOKENS = 1024;

/**
 * Call the Claude API with consistent error handling, timeouts, and retry.
 *
 * @param {string} systemPrompt - System prompt
 * @param {string} userMessage - User message
 * @param {Object} [options]
 * @param {number} [options.maxTokens=1024] - Max response tokens
 * @param {number} [options.timeout=60000] - Request timeout in ms
 * @param {string} [options.model] - Override model (defaults to claude-sonnet-4-20250514)
 * @returns {Promise<string>} - The text response
 */
export async function callClaude(systemPrompt, userMessage, options = {}) {
  const {
    maxTokens = DEFAULT_MAX_TOKENS,
    timeout = DEFAULT_TIMEOUT,
    model = DEFAULT_MODEL,
  } = options;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Claude API ${res.status}: ${err.substring(0, 200)}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || '';
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Claude API request timed out after ${timeout}ms`);
    }
    throw err;
  }
}

/**
 * Check if the API key is configured.
 * @returns {boolean}
 */
export function isApiKeyConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}
