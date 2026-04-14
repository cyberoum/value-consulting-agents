/**
 * Person & Context Research Module
 * ─────────────────────────────────
 * Provides real-time intelligence for meeting preparation:
 *   1. Person Intelligence — research a person by name + bank
 *   2. Context Enrichment — expand scope/pain knowledge with suggestions
 *
 * Uses: Google News RSS (free) for real-time signals + Claude API for synthesis.
 */

import { callClaude, isApiKeyConfigured } from './claudeClient.mjs';
import { getDb } from '../db.mjs';
import { writeProvenance } from '../lib/provenanceWriter.mjs';

// ── Google News RSS Search ──

async function searchGoogleNews(query, maxResults = 5) {
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=en&gl=US&ceid=US:en`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return [];

    const xml = await res.text();

    // Simple XML parsing for RSS items
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) && items.length < maxResults) {
      const itemXml = match[1];
      const title = (itemXml.match(/<title>(.*?)<\/title>/) || [])[1] || '';
      const pubDate = (itemXml.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
      const source = (itemXml.match(/<source.*?>(.*?)<\/source>/) || [])[1] || '';

      // Clean CDATA and HTML entities
      const cleanTitle = title
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      if (cleanTitle) {
        items.push({
          title: cleanTitle,
          source: source.replace(/<!\[CDATA\[|\]\]>/g, ''),
          date: pubDate,
        });
      }
    }

    return items;
  } catch (err) {
    console.error(`   Warning: Google News search failed: ${err.message}`);
    return [];
  }
}

// ═══════════════════════════════════════════════
// PERSON INTELLIGENCE
// ═══════════════════════════════════════════════

const PERSON_SYSTEM_PROMPT = `You are a market intelligence analyst specializing in the banking industry, preparing a Backbase sales consultant for a meeting.

Given a person's name, role, and bank, produce a structured intelligence brief. Use your knowledge of:
- The banking industry and digital transformation trends
- Common priorities for different C-level and senior roles
- The specific bank's known strategy, challenges, and market position
- Typical digital banking concerns for someone in this role

Return ONLY valid JSON with this structure:
{
  "personSummary": "2-3 sentence professional summary of who this person likely is and their responsibilities",
  "likelyPriorities": [
    {
      "priority": "Short priority description",
      "detail": "Why this matters for someone in this role at this bank",
      "relevanceToBackbase": "How Backbase solutions relate to this priority"
    }
  ],
  "conversationTopics": [
    {
      "topic": "Suggested conversation topic",
      "opener": "A natural way to bring this up in conversation",
      "intent": "What you're trying to learn or validate"
    }
  ],
  "recentContext": [
    "Key contextual point about the bank or person's domain"
  ],
  "watchOuts": [
    "Potential sensitivity or thing to be careful about in this meeting"
  ],
  "suggestedApproach": "How to best approach this person given their role and the bank's context"
}

Be specific and actionable. Tailor everything to the banking/fintech context and Backbase's engagement banking platform. Aim for 3-5 priorities, 3-4 conversation topics, 2-4 context points, and 1-3 watch-outs.`;


export async function researchPerson({ name, role, customRole, bankName, bankKey, bankContext }) {
  console.log(`  Researching ${name} (${role || customRole}) at ${bankName}...`);

  // Step 1: Search for recent news about this person
  const newsResults = await searchGoogleNews(`"${name}" "${bankName}"`, 5);
  const bankNewsResults = await searchGoogleNews(`"${bankName}" digital banking`, 3);

  console.log(`   Found ${newsResults.length} person mentions, ${bankNewsResults.length} bank articles`);

  // Step 2: Build context for Claude
  const newsContext = newsResults.length > 0
    ? `\n\nRecent news mentioning this person:\n${newsResults.map(n => `- "${n.title}" (${n.source}, ${n.date})`).join('\n')}`
    : '\n\nNo recent news found specifically mentioning this person.';

  const bankNewsContext = bankNewsResults.length > 0
    ? `\n\nRecent bank news:\n${bankNewsResults.map(n => `- "${n.title}" (${n.source})`).join('\n')}`
    : '';

  const contextStr = bankContext ? `\nAdditional bank context: ${JSON.stringify(bankContext)}` : '';

  const userMessage = `Research this person for an upcoming meeting:

Name: ${name}
Role: ${role || customRole || 'Unknown'}
${customRole ? `Custom role description: ${customRole}` : ''}
Bank: ${bankName}
${contextStr}
${newsContext}
${bankNewsContext}

Generate a comprehensive intelligence brief for a Backbase sales consultant preparing to meet this person.`;

  // Step 3: Synthesize with Claude
  const raw = await callClaude(PERSON_SYSTEM_PROMPT, userMessage, { maxTokens: 2048, timeout: 45000 });

  try {
    // Extract JSON from response (handle markdown code fences)
    const jsonStr = raw.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(jsonStr);
    result._newsFound = newsResults.length;
    result._bankNewsFound = bankNewsResults.length;
    result._source = 'claude-research';

    // Layer 2: write research results back to persons table
    if (bankKey && name && !result._error) {
      try {
        const db = getDb();
        db.prepare(`
          UPDATE persons
          SET note = ?, source_date = ?, verified_at = datetime('now'), updated_at = datetime('now')
          WHERE bank_key = ? AND canonical_name = ?
        `).run(
          result.personSummary || null,
          new Date().toISOString().slice(0, 10),
          bankKey,
          name,
        );
        // Layer 1: write provenance for this person research
        const today = new Date().toISOString().slice(0, 10);
        writeProvenance('person', bankKey, `person.${name}`, result.personSummary || '', 'person_research', null, today, 2);
      } catch (err) {
        console.error(`   Warning: Failed to update persons table for ${name}: ${err.message}`);
      }
    }

    return result;
  } catch (err) {
    console.error('   Warning: Failed to parse Claude response:', err.message);
    return {
      personSummary: `${name} serves as ${role || customRole || 'a senior executive'} at ${bankName}. Research synthesis failed — showing raw intelligence.`,
      likelyPriorities: [],
      conversationTopics: [],
      recentContext: newsResults.map(n => n.title),
      watchOuts: ['Research synthesis incomplete — verify independently'],
      suggestedApproach: 'Take a discovery-first approach. Ask open-ended questions about their priorities.',
      _error: err.message,
      _source: 'fallback',
    };
  }
}


// ═══════════════════════════════════════════════
// SCOPE & PAIN POINT ENRICHMENT
// ═══════════════════════════════════════════════

const CONTEXT_SYSTEM_PROMPT = `You are a market intelligence analyst specializing in the banking industry, helping a Backbase sales consultant prepare for a meeting.

Given what the consultant already knows about the meeting scope and pain points, plus any relevant news, enrich their understanding by:
1. Validating what they know with supporting context
2. Suggesting RELATED scope areas they may not have considered
3. Suggesting RELATED pain points that typically accompany the ones mentioned
4. Providing conversation angles for each topic

Return ONLY valid JSON with this structure:
{
  "scopeEnrichment": {
    "validation": "Brief validation of the scope areas mentioned",
    "relatedAreas": [
      {
        "area": "Related scope area name",
        "connection": "How this connects to what they already know",
        "question": "Question to explore this area in the meeting"
      }
    ]
  },
  "painPointEnrichment": {
    "validation": "Brief validation of the pain points mentioned",
    "relatedPainPoints": [
      {
        "painPoint": "Related pain point",
        "connection": "How this connects to the known pain points",
        "evidence": "Industry evidence or logic supporting this",
        "question": "Question to validate this pain point"
      }
    ]
  },
  "conversationStrategy": "Recommended approach for the meeting given the known scope and pain points",
  "keyInsight": "One key insight the consultant should walk in knowing"
}

Be specific to digital banking and engagement banking. Suggest 2-4 related areas and 2-4 related pain points. Ground suggestions in real banking industry trends.`;


export async function enrichContext({ bankName, scopeText, painText, attendeeRoles, bankContext }) {
  console.log(`  Enriching context for ${bankName}...`);

  // Step 1: Search for relevant news based on scope/pain topics
  const searchTopics = [];
  if (scopeText) searchTopics.push(...scopeText.split(/[,;.]/).filter(s => s.trim().length > 3).slice(0, 2));
  if (painText) searchTopics.push(...painText.split(/[,;.]/).filter(s => s.trim().length > 3).slice(0, 2));

  let newsContext = '';
  for (const topic of searchTopics) {
    const results = await searchGoogleNews(`"${bankName}" ${topic.trim()}`, 3);
    if (results.length > 0) {
      newsContext += `\nNews for "${topic.trim()}":\n${results.map(n => `- "${n.title}" (${n.source})`).join('\n')}`;
    }
  }

  // Also search for general bank digital transformation news
  const generalNews = await searchGoogleNews(`"${bankName}" digital transformation 2025 2026`, 3);
  if (generalNews.length > 0) {
    newsContext += `\nGeneral digital transformation news:\n${generalNews.map(n => `- "${n.title}" (${n.source})`).join('\n')}`;
  }

  console.log(`   Found contextual news from ${searchTopics.length} topic searches`);

  // Step 2: Build prompt
  const contextStr = bankContext ? `\nBank context: ${JSON.stringify(bankContext)}` : '';
  const rolesStr = attendeeRoles?.length ? `\nMeeting attendee roles: ${attendeeRoles.join(', ')}` : '';

  const userMessage = `Enrich the consultant's meeting preparation for ${bankName}:

WHAT THE CONSULTANT KNOWS ABOUT THE SCOPE:
${scopeText || '(Nothing specified — scope is unknown)'}

WHAT THE CONSULTANT KNOWS ABOUT PAIN POINTS:
${painText || '(Nothing specified — pain points are unknown)'}
${rolesStr}
${contextStr}
${newsContext ? `\nRELEVANT NEWS:${newsContext}` : ''}

Based on this, suggest related scope areas and pain points the consultant may not have considered. Ground your suggestions in real banking industry trends and the specific bank's context.`;

  // Step 3: Synthesize
  const raw = await callClaude(CONTEXT_SYSTEM_PROMPT, userMessage, { maxTokens: 2048, timeout: 45000 });

  try {
    const jsonStr = raw.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(jsonStr);
    result._source = 'claude-research';
    return result;
  } catch (err) {
    console.error('   Warning: Failed to parse context enrichment:', err.message);
    return {
      scopeEnrichment: {
        validation: 'Research synthesis failed — use your own judgment.',
        relatedAreas: [],
      },
      painPointEnrichment: {
        validation: 'Research synthesis failed — use your own judgment.',
        relatedPainPoints: [],
      },
      conversationStrategy: 'Take a discovery-first approach with open-ended questions.',
      keyInsight: 'Verify your assumptions early in the conversation.',
      _error: err.message,
      _source: 'fallback',
    };
  }
}


// ── Availability Check ──

export function isResearchAvailable() {
  return isApiKeyConfigured();
}
