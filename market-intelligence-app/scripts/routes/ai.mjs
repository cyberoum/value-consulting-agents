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
import { generateMeetingPrep, generateEngagementPlan, isMeetingPrepAvailable, formatProvenanceForPrompt, formatMeetingHistoryForPrompt } from '../fetchers/meetingPrepAgent.mjs';
import { getProvenanceForEntity } from '../lib/provenanceWriter.mjs';
import { getChangesForBank, formatChangesForPrompt } from '../lib/changeWriter.mjs';
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
    // Layer 3: fetch recent changes (last 30 days) for brief context
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentChanges = getChangesForBank(bankKey, { since: thirtyDaysAgo, limit: 10 });
    const changesContext = formatChangesForPrompt(recentChanges);
    // Layer 4: fetch prior meeting history for deal context
    const meetingRows = db.prepare('SELECT * FROM meeting_history WHERE bank_key = ? ORDER BY meeting_date DESC LIMIT 3').all(bankKey);
    const meetingHistoryContext = formatMeetingHistoryForPrompt(meetingRows.map(r => parseRow('meeting_history', r)));
    const isPositionMode = mode === 'position';
    console.log(`📋 Meeting prep${isPositionMode ? ' [POSITION MODE]' : ''}: ${bankName} | ${isPositionMode ? `Product: ${positionProduct}` : `Topics: ${topics.join(', ')}`}${provenanceRows.length > 0 ? ` | ${provenanceRows.length} provenance records` : ''}${recentChanges.length > 0 ? ` | ${recentChanges.length} recent changes` : ''}${meetingRows.length > 0 ? ` | ${meetingRows.length} prior meetings` : ''}`);
    const result = await generateMeetingPrep({
      bankName, bankKey, attendees, topics,
      scopeKnown, painPointKnown, scopeText, painText, bankData,
      mode, positionProduct, positionPainPoints,
      competitors, region, provenanceContext, changesContext, meetingHistoryContext,
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

  // ── POST /api/banks/:key/meetings/extract — AI transcript extraction (Layer 4) ──
  const extractMatch = path.match(/^\/api\/banks\/([^/]+)\/meetings\/extract$/);
  if (extractMatch && req.method === 'POST') {
    if (!aiRateCheck(res)) return true;
    if (!isClaudeAvailable()) {
      jsonResponse(res, 503, { error: 'ANTHROPIC_API_KEY not configured. Transcript extraction requires AI.' });
      return true;
    }
    const bankKey = decodeURIComponent(extractMatch[1]);
    const { transcript } = await parseBody(req);
    if (!transcript) {
      jsonResponse(res, 400, { error: 'Missing required field: transcript' });
      return true;
    }
    if (transcript.length > 50000) {
      jsonResponse(res, 400, { error: 'Transcript too long — please trim to the relevant portion (max 50,000 characters)' });
      return true;
    }

    console.log(`📝 Transcript extraction: ${bankKey} (${transcript.length} chars)...`);

    const extractionPrompt = `You are a meeting transcript analyzer for B2B fintech sales. Extract structured meeting data from the raw transcript below.

TRANSCRIPT FORMAT HANDLING:
- Ignore speaker labels (e.g., "Speaker 1:", "Oumaima:", "John Smith:")
- Ignore timestamps (e.g., "00:14:32", "[14:32]", "2:30 PM")
- Ignore filler words, greetings, and small talk
- Focus ONLY on substantive business content
- If the transcript is messy, incomplete, or has formatting artifacts, extract what you can and note gaps

EXTRACTION RULES:
- attendees: Extract names and roles mentioned. If only first names appear, use them. If roles aren't stated, infer from context or use null.
- key_topics: Maximum 5 topics. Use short, specific labels (e.g., "digital onboarding timeline" not "technology discussion").
- objections_raised: Only include genuine concerns or pushback from the CLIENT side, not questions or clarifications.
- commitments_made: Each commitment must have an owner. If the owner isn't clear, use "unclear". All commitments start with fulfilled: false. Include deadline if mentioned.
- outcome: Infer from the overall tone and ending:
  "progressed" = positive momentum, next steps agreed
  "stalled" = no clear next step, unresolved blockers
  "lost" = explicit rejection or deal-ending language
  "won" = explicit agreement to proceed with purchase/POC
  If truly ambiguous, use "progressed" as default.
- notes: 2-3 sentence summary capturing the key takeaway a rep needs before the next meeting.

Return ONLY valid JSON. No markdown code fences. No preamble. No explanation.

{
  "meeting_date": "YYYY-MM-DD or null if not mentioned",
  "attendees": [
    { "name": "Person Name", "role": "Their Role or null" }
  ],
  "key_topics": ["topic1", "topic2"],
  "objections_raised": ["objection text"],
  "commitments_made": [
    { "commitment": "What was committed", "owner": "Who owns it", "deadline": "By when or null", "fulfilled": false }
  ],
  "outcome": "progressed",
  "notes": "2-3 sentence summary"
}`;

    const { callClaude } = await import('../fetchers/claudeClient.mjs');
    const raw = await callClaude(extractionPrompt, transcript, { maxTokens: 2048, timeout: 60000 });

    try {
      const jsonStr = raw.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(jsonStr);
      result._source = 'transcript_extraction';
      console.log(`   ✅ Transcript extraction complete: ${result.attendees?.length || 0} attendees, ${result.key_topics?.length || 0} topics`);
      jsonResponse(res, 200, { result });
    } catch (err) {
      console.error(`   Warning: Failed to parse extraction response: ${err.message}`);
      jsonResponse(res, 200, {
        result: {
          meeting_date: null,
          attendees: [],
          key_topics: [],
          objections_raised: [],
          commitments_made: [],
          outcome: 'progressed',
          notes: 'Transcript extraction failed — please enter meeting details manually.',
          _source: 'extraction_fallback',
          _error: err.message,
        }
      });
    }
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
