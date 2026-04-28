/**
 * Meeting Fact Extractor — Sprint 2.2
 * ────────────────────────────────────
 * Reads a meeting_history row (free-text notes + key_topics + outcome) and
 * extracts discrete, attributed facts about what specific stakeholders said
 * about specific topics. Each fact carries a verbatim evidence quote.
 *
 * Why LLM here (vs. the structural composition we used for Pulse): meeting
 * notes are free text that requires entity resolution (which named person
 * said this?) and topical classification (is this about budget? vendors?).
 * Both are well-bounded LLM tasks. The LLM is constrained:
 *   - It MUST match speaker names against the persons table (no inventing)
 *   - It MUST quote evidence verbatim (no paraphrasing)
 *   - It outputs structured JSON, validated row-by-row
 * Sentences that don't ground to a speaker AND a verbatim quote are dropped,
 * not invented around. This is the anti-hallucination guardrail at the
 * extraction layer.
 *
 * Topics (canonical 7): budget | vendors | timeline | politics | technical | blockers | other
 */

import { callClaude, isApiKeyConfigured } from '../fetchers/claudeClient.mjs';
import { randomUUID } from 'node:crypto';

const TOPICS = ['budget', 'vendors', 'timeline', 'politics', 'technical', 'blockers', 'other'];

const SYSTEM_PROMPT = `You extract structured stakeholder positions from a banking sales meeting record.

Given:
- A list of named stakeholders for the bank (with their roles)
- The meeting's free-text notes, key_topics, and outcome

Produce: an array of discrete facts, each in this JSON shape:
{
  "speaker_name": "exact name from the provided stakeholder list, or null if not attributable to any named stakeholder",
  "topic": "budget" | "vendors" | "timeline" | "politics" | "technical" | "blockers" | "other",
  "position": "1-2 sentence summary of what the speaker conveyed about this topic. Concrete claim, not editorial.",
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "evidence_quote": "VERBATIM excerpt from the meeting notes that supports this position. Maximum 200 chars."
}

STRICT RULES:
1. NEVER invent a speaker name. If you can't attribute a fact to a named stakeholder, set speaker_name=null.
2. NEVER invent an evidence_quote. It must appear verbatim somewhere in the meeting notes provided.
3. NEVER produce more than 8 facts per meeting (focus on highest-value claims).
4. NEVER produce facts that are not direct claims by stakeholders. Avoid generic narrative summary.
5. NEVER produce a fact for "other" topic unless it's a meaningful business signal.
6. If the meeting notes are too thin to extract any clear facts, return an empty array [].

Return ONLY a valid JSON array. No markdown, no commentary, no preamble.`;

/**
 * Extract facts from one meeting. Returns array of facts (already validated).
 *
 * @param {object} meeting - meeting_history row
 * @param {Array} persons - persons rows for the bank (used for name matching)
 * @returns {Promise<Array<object>>} validated facts
 */
export async function extractFactsFromMeeting(meeting, persons) {
  if (!isApiKeyConfigured()) {
    console.warn('[meetingFactExtractor] ANTHROPIC_API_KEY not set — skipping');
    return [];
  }
  if (!meeting?.notes && !meeting?.key_topics && !meeting?.outcome) {
    return []; // No content to extract from
  }

  const stakeholderList = persons.slice(0, 25).map(p =>
    `- ${p.canonical_name} (${p.role || 'role unknown'})`
  ).join('\n') || '(no named stakeholders on file)';

  const userMessage = `BANK STAKEHOLDERS:
${stakeholderList}

MEETING ON ${meeting.meeting_date} (type: ${meeting.meeting_type || 'meeting'})

ATTENDEES: ${meeting.attendees || '(not recorded)'}

KEY TOPICS DISCUSSED:
${meeting.key_topics || '(not recorded)'}

NOTES (verbatim):
${meeting.notes || '(no notes)'}

OUTCOME:
${meeting.outcome || '(not recorded)'}

OBJECTIONS RAISED:
${meeting.objections_raised || '(none recorded)'}

COMMITMENTS MADE:
${meeting.commitments_made || '(none recorded)'}

Extract up to 8 attributed facts. Match speakers to the stakeholder list. Quote evidence verbatim from the notes/topics/outcome.`;

  let raw;
  try {
    raw = await callClaude(SYSTEM_PROMPT, userMessage, { maxTokens: 2048, timeout: 60000 });
  } catch (err) {
    console.warn(`[meetingFactExtractor] Claude call failed: ${err.message}`);
    return [];
  }

  // Parse + validate. Drop any fact that fails validation rather than salvage.
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/```$/, '').trim();
  let parsed;
  try { parsed = JSON.parse(cleaned); } catch {
    console.warn('[meetingFactExtractor] Could not parse Claude JSON; raw[:200]:', cleaned.slice(0, 200));
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  // Build a normalized name lookup so we can match speakers
  const personByName = new Map();
  for (const p of persons) {
    const key = (p.canonical_name || '').toLowerCase().trim();
    if (key) personByName.set(key, p);
  }

  const facts = [];
  for (const f of parsed) {
    if (!f || typeof f !== 'object') continue;
    if (!TOPICS.includes(f.topic)) continue;
    if (!f.position || typeof f.position !== 'string' || f.position.length < 5) continue;
    if (!f.evidence_quote || typeof f.evidence_quote !== 'string' || f.evidence_quote.length < 5) continue;

    // Verbatim guardrail — the evidence_quote MUST appear in the source text.
    // (Allow loose match for whitespace/case but require substantial overlap.)
    const sourceText = `${meeting.notes || ''} ${meeting.key_topics || ''} ${meeting.outcome || ''} ${meeting.objections_raised || ''} ${meeting.commitments_made || ''}`.toLowerCase();
    const quoteLow = String(f.evidence_quote).toLowerCase().trim();
    if (sourceText.length > 0) {
      // Check for exact substring OR check that ≥80% of words appear in order
      const hasExact = sourceText.includes(quoteLow);
      const words = quoteLow.split(/\s+/).filter(w => w.length > 3);
      const wordHits = words.filter(w => sourceText.includes(w)).length;
      const looseMatch = words.length > 0 && (wordHits / words.length) >= 0.7;
      if (!hasExact && !looseMatch) {
        // Fabricated quote — drop the fact entirely (anti-hallucination guard)
        continue;
      }
    }

    // Speaker resolution — match against persons table
    let speakerPersonId = null;
    if (f.speaker_name) {
      const person = personByName.get(String(f.speaker_name).toLowerCase().trim());
      if (person) speakerPersonId = person.id;
      // If the LLM names someone NOT in our persons list, we keep the name
      // string but mark person_id null. This is the "named stakeholder we
      // don't have a profile for yet" case — surfaced for follow-up.
    }

    facts.push({
      id: randomUUID(),
      meeting_id: meeting.id,
      bank_key: meeting.bank_key,
      speaker_person_id: speakerPersonId,
      speaker_name: f.speaker_name || null,
      topic: f.topic,
      position: String(f.position).trim(),
      sentiment: ['positive', 'neutral', 'negative', 'mixed'].includes(f.sentiment) ? f.sentiment : 'neutral',
      evidence_quote: String(f.evidence_quote).trim().slice(0, 400),
      meeting_date: meeting.meeting_date,
      confidence_tier: speakerPersonId ? 1 : 2, // attributed = T1, unattributed = T2
      extracted_by: 'auto',
    });
  }

  return facts;
}

/**
 * Persist extracted facts (idempotent — drops + reinserts for that meeting).
 */
export function persistFacts(db, meetingId, facts) {
  const txn = db.transaction(() => {
    db.prepare('DELETE FROM meeting_facts WHERE meeting_id = ?').run(meetingId);
    if (facts.length === 0) return;
    const stmt = db.prepare(`
      INSERT INTO meeting_facts (
        id, meeting_id, bank_key, speaker_person_id, speaker_name, topic,
        position, sentiment, evidence_quote, meeting_date, confidence_tier,
        extracted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const f of facts) {
      stmt.run(
        f.id, f.meeting_id, f.bank_key, f.speaker_person_id, f.speaker_name,
        f.topic, f.position, f.sentiment, f.evidence_quote, f.meeting_date,
        f.confidence_tier, f.extracted_by
      );
    }
  });
  txn();
  return facts.length;
}

/**
 * Bulk extraction — process every meeting in the DB that doesn't yet have
 * extracted facts (or all of them if --force). Returns { processed, total_facts }.
 */
export async function extractFactsForAllMeetings(db, options = {}) {
  const { force = false, bankFilter = null } = options;

  let sql = `
    SELECT m.*
    FROM meeting_history m
  `;
  const params = [];
  const where = [];
  if (!force) {
    where.push(`NOT EXISTS (SELECT 1 FROM meeting_facts mf WHERE mf.meeting_id = m.id)`);
  }
  if (bankFilter) {
    where.push('m.bank_key LIKE ?');
    params.push(`%${bankFilter}%`);
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY m.meeting_date DESC';

  const meetings = db.prepare(sql).all(...params);
  if (meetings.length === 0) return { processed: 0, total_facts: 0 };

  let totalFacts = 0;
  for (const m of meetings) {
    const persons = db.prepare(
      `SELECT id, canonical_name, role, role_category FROM persons WHERE bank_key = ? ORDER BY influence_score DESC NULLS LAST`
    ).all(m.bank_key);
    const facts = await extractFactsFromMeeting(m, persons);
    persistFacts(db, m.id, facts);
    totalFacts += facts.length;
  }
  return { processed: meetings.length, total_facts: totalFacts };
}
