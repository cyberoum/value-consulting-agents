/**
 * AI / Research route handlers.
 *
 * Endpoints:
 *   GET  /api/status                    — API key check
 *   POST /api/analyze                   — Analyze raw intelligence
 *   POST /api/analyze-news              — Analyze news articles
 *   POST /api/deep-analysis             — Deep bank analysis
 *   GET  /api/research/status           — Research availability
 *   POST /api/research/person           — Person research
 *   POST /api/research/context          — Context enrichment
 *   POST /api/research/meeting-prep     — Meeting prep brief
 *   POST /api/research/landing-zones    — Landing zone matrix
 *   POST /api/research/discovery-storyline — Discovery storyline
 *   POST /api/research/value-hypothesis — Value hypothesis
 *   POST /api/research/engagement-plan  — Post-meeting engagement plan
 */

import { structureIntelWithClaude, analyzeNewsForBank, deepAnalyzeBank, isClaudeAvailable } from '../fetchers/claudeAnalyzer.mjs';
import { researchPerson, enrichContext, isResearchAvailable } from '../fetchers/personResearch.mjs';
import { generateMeetingPrep, generateEngagementPlan, isMeetingPrepAvailable, formatProvenanceForPrompt } from '../fetchers/meetingPrepAgent.mjs';
import { getProvenanceForEntity } from '../lib/provenanceWriter.mjs';
import { analyzeLandingZones, isLandingZoneAgentAvailable } from '../fetchers/landingZoneAgent.mjs';
import { generateDiscoveryStoryline, isDiscoveryStorylineAvailable } from '../fetchers/discoveryStorylineAgent.mjs';
import { generateValueHypothesisForMeeting, isValueHypothesisAvailable } from '../fetchers/valueHypothesisAgent.mjs';
import { jsonResponse, parseBody, createRateLimiter } from './helpers.mjs';

// Rate limit: max 20 AI requests per minute (generous for normal use, blocks runaways)
const aiRateCheck = createRateLimiter(20, 60_000);

/**
 * Try to handle an AI/research route. Returns true if handled, false if not matched.
 */
export async function handleAiRoute(req, res, { path, db, parseRow }) {
  // ── GET /api/status ──
  if (path === '/api/status' && req.method === 'GET') {
    jsonResponse(res, 200, {
      available: isClaudeAvailable(),
      model: 'claude-sonnet-4-20250514',
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  // ── POST /api/analyze ──
  if (path === '/api/analyze' && req.method === 'POST') {
    if (!aiRateCheck(res)) return true; // 429 already sent
    if (!isClaudeAvailable()) {
      jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured' });
      return true;
    }
    const { category, text, bankContext } = await parseBody(req);
    if (!category || !text) {
      jsonResponse(res, 400, { error: 'Missing required fields: category, text' });
      return true;
    }
    console.log(`🤖 Analyzing ${category} for ${bankContext?.bankName || 'unknown bank'}...`);
    const result = await structureIntelWithClaude(category, text, bankContext || {});
    console.log(`   ✅ Analysis complete`);
    jsonResponse(res, 200, { result, _source: 'claude-ai' });
    return true;
  }

  // ── POST /api/analyze-news ──
  if (path === '/api/analyze-news' && req.method === 'POST') {
    if (!aiRateCheck(res)) return true;
    if (!isClaudeAvailable()) {
      jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured' });
      return true;
    }
    const { bankName, articles } = await parseBody(req);
    if (!bankName || !articles) {
      jsonResponse(res, 400, { error: 'Missing required fields: bankName, articles' });
      return true;
    }
    console.log(`🤖 Analyzing ${articles.length} articles for ${bankName}...`);
    const result = await analyzeNewsForBank(bankName, articles);
    console.log(`   ✅ News analysis complete`);
    jsonResponse(res, 200, { result, _source: 'claude-ai' });
    return true;
  }

  // ── POST /api/deep-analysis ──
  if (path === '/api/deep-analysis' && req.method === 'POST') {
    if (!aiRateCheck(res)) return true;
    if (!isClaudeAvailable()) {
      jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured' });
      return true;
    }
    const { bankName, analysisType, context } = await parseBody(req);
    if (!bankName || !analysisType) {
      jsonResponse(res, 400, { error: 'Missing required fields: bankName, analysisType' });
      return true;
    }
    console.log(`🤖 Deep analysis (${analysisType}) for ${bankName}...`);
    const result = await deepAnalyzeBank(bankName, analysisType, context || {});
    console.log(`   ✅ ${analysisType} analysis complete`);
    jsonResponse(res, 200, { result, _source: 'claude-ai', analysisType });
    return true;
  }

  // ── GET /api/research/status ──
  if (path === '/api/research/status' && req.method === 'GET') {
    jsonResponse(res, 200, { available: isResearchAvailable() });
    return true;
  }

  // ── POST /api/research/person ──
  if (path === '/api/research/person' && req.method === 'POST') {
    if (!aiRateCheck(res)) return true;
    if (!isResearchAvailable()) {
      jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured. Person research requires AI.' });
      return true;
    }
    const { name, role, customRole, bankName, bankKey, bankContext } = await parseBody(req);
    if (!name || !bankName) {
      jsonResponse(res, 400, { error: 'Missing required fields: name, bankName' });
      return true;
    }
    console.log(`🔍 Person research: ${name} at ${bankName}...`);
    const result = await researchPerson({ name, role, customRole, bankName, bankKey, bankContext });
    console.log(`   ✅ Person research complete`);
    jsonResponse(res, 200, { result });
    return true;
  }

  // ── POST /api/research/context ──
  if (path === '/api/research/context' && req.method === 'POST') {
    if (!aiRateCheck(res)) return true;
    if (!isResearchAvailable()) {
      jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured. Context enrichment requires AI.' });
      return true;
    }
    const { bankName, scopeText, painText, attendeeRoles, bankContext } = await parseBody(req);
    if (!bankName) {
      jsonResponse(res, 400, { error: 'Missing required field: bankName' });
      return true;
    }
    console.log(`🔍 Context enrichment for ${bankName}...`);
    const result = await enrichContext({ bankName, scopeText, painText, attendeeRoles, bankContext });
    console.log(`   ✅ Context enrichment complete`);
    jsonResponse(res, 200, { result });
    return true;
  }

  // ── POST /api/research/meeting-prep ──
  if (path === '/api/research/meeting-prep' && req.method === 'POST') {
    if (!aiRateCheck(res)) return true;
    if (!isMeetingPrepAvailable()) {
      jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured. Meeting prep requires AI.' });
      return true;
    }
    const { bankName, bankKey, attendees, topics, scopeKnown, painPointKnown, scopeText, painText, mode, positionProduct, positionPainPoints, competitors, region } = await parseBody(req);
    if (!bankName || !bankKey || !topics?.length) {
      jsonResponse(res, 400, { error: 'Missing required fields: bankName, bankKey, topics[]' });
      return true;
    }
    const bankRow = db.prepare('SELECT data FROM banks WHERE key = ?').get(bankKey);
    const bankData = bankRow?.data ? JSON.parse(bankRow.data) : {};
    // Layer 1: fetch provenance records and format for prompt injection
    const provenanceRows = getProvenanceForEntity('bank', bankKey);
    const provenanceContext = formatProvenanceForPrompt(provenanceRows);
    const isPositionMode = mode === 'position';
    console.log(`📋 Meeting prep${isPositionMode ? ' [POSITION MODE]' : ''}: ${bankName} | ${isPositionMode ? `Product: ${positionProduct}` : `Topics: ${topics.join(', ')}`}${provenanceRows.length > 0 ? ` | ${provenanceRows.length} provenance records` : ''}`);
    const result = await generateMeetingPrep({
      bankName, bankKey, attendees, topics,
      scopeKnown, painPointKnown, scopeText, painText, bankData,
      mode, positionProduct, positionPainPoints,
      competitors, region, provenanceContext,
    });
    console.log(`   ✅ Meeting prep complete`);
    jsonResponse(res, 200, { result });
    return true;
  }

  // ── POST /api/research/landing-zones ──
  if (path === '/api/research/landing-zones' && req.method === 'POST') {
    if (!aiRateCheck(res)) return true;
    if (!isLandingZoneAgentAvailable()) {
      jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured. Landing zone analysis requires AI.' });
      return true;
    }
    const { bankName, bankKey, meetingContext } = await parseBody(req);
    if (!bankName || !bankKey) {
      jsonResponse(res, 400, { error: 'Missing required fields: bankName, bankKey' });
      return true;
    }
    const bankRow = db.prepare('SELECT data FROM banks WHERE key = ?').get(bankKey);
    const bankData = bankRow?.data ? JSON.parse(bankRow.data) : {};
    console.log(`🎯 Landing zone analysis: ${bankName}${meetingContext ? ' (meeting-tailored)' : ''}...`);
    const result = await analyzeLandingZones({ bankName, bankKey, bankData, meetingContext });

    db.prepare(`
      INSERT INTO landing_zone_matrix (bank_key, matrix, plays, unconsidered, challenges, top_zones)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(bank_key) DO UPDATE SET
        matrix = excluded.matrix, plays = excluded.plays,
        unconsidered = excluded.unconsidered, challenges = excluded.challenges,
        top_zones = excluded.top_zones, updated_at = datetime('now')
    `).run(
      bankKey,
      JSON.stringify(result.matrix),
      JSON.stringify(result.modernizationPlays),
      JSON.stringify(result.unconsideredNeeds),
      JSON.stringify(result.challenges),
      JSON.stringify(result.topLandingZones)
    );

    console.log(`   ✅ Landing zone analysis complete and persisted`);
    jsonResponse(res, 200, { result });
    return true;
  }

  // ── POST /api/research/discovery-storyline ──
  if (path === '/api/research/discovery-storyline' && req.method === 'POST') {
    if (!aiRateCheck(res)) return true;
    if (!isDiscoveryStorylineAvailable()) {
      jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured. Discovery storyline requires AI.' });
      return true;
    }
    const { bankName, bankKey, meetingContext } = await parseBody(req);
    if (!bankName || !bankKey) {
      jsonResponse(res, 400, { error: 'Missing required fields: bankName, bankKey' });
      return true;
    }
    const bankRow = db.prepare('SELECT data FROM banks WHERE key = ?').get(bankKey);
    const bankData = bankRow?.data ? JSON.parse(bankRow.data) : {};
    const lzRow = db.prepare('SELECT * FROM landing_zone_matrix WHERE bank_key = ?').get(bankKey);
    const lzMatrixData = lzRow ? parseRow('landing_zone_matrix', lzRow) : null;
    console.log(`\n🎯 Discovery storyline generation: ${bankName}${meetingContext ? ' (meeting-tailored)' : ''}...`);
    const result = await generateDiscoveryStoryline({ bankName, bankKey, bankData, lzMatrixData, meetingContext });

    db.prepare(`
      INSERT INTO discovery_storylines (bank_key, storyline, roi_estimate, next_steps)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(bank_key) DO UPDATE SET
        storyline = excluded.storyline, roi_estimate = excluded.roi_estimate,
        next_steps = excluded.next_steps, updated_at = datetime('now')
    `).run(
      bankKey,
      JSON.stringify(result),
      JSON.stringify(result.illustrativeRoi || null),
      JSON.stringify(result.nextSteps || null)
    );

    console.log(`   ✅ Discovery storyline complete and persisted`);
    jsonResponse(res, 200, { result });
    return true;
  }

  // ── POST /api/research/value-hypothesis ──
  if (path === '/api/research/value-hypothesis' && req.method === 'POST') {
    if (!aiRateCheck(res)) return true;
    if (!isValueHypothesisAvailable()) {
      jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured.' });
      return true;
    }
    const { bankName, bankKey, meetingContext } = await parseBody(req);
    if (!bankName || !bankKey) {
      jsonResponse(res, 400, { error: 'Missing required fields: bankName, bankKey' });
      return true;
    }
    const bankRow = db.prepare('SELECT data FROM banks WHERE key = ?').get(bankKey);
    const bankData = bankRow?.data ? JSON.parse(bankRow.data) : {};
    const vsRow = db.prepare('SELECT data FROM value_selling WHERE bank_key = ?').get(bankKey);
    const existingHypothesis = vsRow?.data ? JSON.parse(vsRow.data)?.value_hypothesis || null : null;

    console.log(`\n🎯 Value hypothesis generation: ${bankName} (meeting-tailored)...`);
    const result = await generateValueHypothesisForMeeting({
      bankName, bankData, meetingContext, existingHypothesis,
    });
    console.log(`   ✅ Value hypothesis complete`);
    jsonResponse(res, 200, { result });
    return true;
  }

  // ── POST /api/research/engagement-plan ──
  if (path === '/api/research/engagement-plan' && req.method === 'POST') {
    if (!aiRateCheck(res)) return true;
    if (!isMeetingPrepAvailable()) {
      jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured. Engagement plan requires AI.' });
      return true;
    }
    const { bankName, originalBrief, outcome, resonatedPriorities, clientAskedFor, agreedNextStep, attendees } = await parseBody(req);
    if (!bankName || !outcome) {
      jsonResponse(res, 400, { error: 'Missing required fields: bankName, outcome' });
      return true;
    }
    console.log(`📋 Engagement plan: ${bankName} (${outcome})`);
    const result = await generateEngagementPlan({
      bankName, originalBrief, outcome, resonatedPriorities,
      clientAskedFor, agreedNextStep, attendees,
    });
    console.log(`   ✅ Engagement plan complete`);
    jsonResponse(res, 200, { result });
    return true;
  }

  return false;
}
