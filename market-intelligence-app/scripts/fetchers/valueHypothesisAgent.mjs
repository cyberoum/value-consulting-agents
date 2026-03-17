/**
 * Value Hypothesis Agent — Meeting-Tailored IF/THEN/BY/RESULT Generator
 * ──────────────────────────────────────────────────────────────────────
 * Lightweight agent that takes the existing static value hypothesis and
 * re-frames it for a specific meeting context:
 *   - Focus on selected topics (SME, onboarding, lending, etc.)
 *   - Frame for attendee roles (CTO → architecture, CFO → ROI, CDO → CX)
 *   - Incorporate known scope/pain points
 *
 * Uses: Claude API only (no news search — keeps it fast ~3-5s).
 */

import { callClaude, isApiKeyConfigured } from './claudeClient.mjs';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const KNOWLEDGE_DIR = resolve(__dirname, '../../knowledge');

// ── Domain mapping for knowledge lookups ──

const ZONE_DOMAIN_MAP = {
  retail: 'retail', consumer: 'retail', personal: 'retail', 'digital banking': 'retail',
  onboarding: 'retail', origination: 'retail', 'mobile banking': 'retail',
  sme: 'sme', 'small business': 'sme', 'business banking': 'sme',
  wealth: 'wealth', 'private banking': 'wealth', advisory: 'wealth',
  commercial: 'commercial', corporate: 'corporate', 'trade finance': 'commercial',
  investing: 'investing',
};

function detectDomains(bankData, meetingContext) {
  const domains = new Set();

  // From landing zones
  if (bankData.backbase_landing_zones?.length) {
    for (const z of bankData.backbase_landing_zones) {
      const zl = (z.zone || '').toLowerCase();
      for (const [kw, domain] of Object.entries(ZONE_DOMAIN_MAP)) {
        if (zl.includes(kw)) domains.add(domain);
      }
    }
  }

  // From meeting topics
  if (meetingContext.topics?.length) {
    for (const topic of meetingContext.topics) {
      const tl = topic.toLowerCase();
      for (const [kw, domain] of Object.entries(ZONE_DOMAIN_MAP)) {
        if (tl.includes(kw)) domains.add(domain);
      }
    }
  }

  return domains.size > 0 ? [...domains] : ['retail'];
}

function loadFile(filePath) {
  try {
    if (existsSync(filePath)) return readFileSync(filePath, 'utf-8');
  } catch { /* ignore */ }
  return '';
}

function loadDomainKnowledge(domains) {
  const files = ['value_propositions.md', 'pain_points.md', 'use_cases.md', 'roi_levers.md', 'benchmarks.md'];
  const sections = [];

  for (const domain of domains.slice(0, 2)) { // cap at 2 domains to limit tokens
    const basePath = resolve(KNOWLEDGE_DIR, 'domains', domain);
    const domainSections = [];
    for (const file of files) {
      const content = loadFile(resolve(basePath, file));
      if (content && content.length > 50) {
        // Trim to keep total prompt reasonable (~2KB per file)
        domainSections.push(`#### ${file.replace('.md', '').replace(/_/g, ' ').toUpperCase()}\n${content.substring(0, 2000)}`);
      }
    }
    if (domainSections.length > 0) {
      sections.push(`### ${domain.toUpperCase()} Domain Knowledge\n${domainSections.join('\n\n')}`);
    }
  }

  return sections.join('\n\n---\n\n');
}

// ── System Prompt ──

const SYSTEM_PROMPT = `You are a Backbase Value Consultant generating a tailored value hypothesis for a specific meeting.

Your output uses the IF/THEN/BY/RESULT framework:
- IF: The bank's current situation and trigger (what's happening now)
- THEN: The strategic outcome Backbase enables
- BY: The specific Backbase deployment approach
- RESULT: Quantified business results (time-to-market, cost savings, NPS improvement, revenue growth)

Rules:
1. The hypothesis MUST be tailored to the specific meeting topics and attendee roles
2. If the attendee is a CTO/CIO → emphasize architecture, platform consolidation, time-to-market
3. If the attendee is a CFO → emphasize ROI, cost reduction, operational efficiency
4. If the attendee is a CDO/Head of Digital → emphasize CX, NPS, digital adoption, customer acquisition
5. If the attendee is a CEO/COO → emphasize strategic competitive advantage, market position
6. If the attendee is Head of Business/LOB → emphasize revenue growth, cross-sell, customer retention
7. Incorporate any known scope or pain points into the IF condition
8. Keep each field concise (1-3 sentences max)
9. The one_liner should be provocative and memorable (under 25 words)
10. Use provided DOMAIN KNOWLEDGE (value propositions, benchmarks, ROI levers, pain points) to ground the hypothesis in real data — cite specific metrics or benchmarks when available
11. Reference relevant use cases from the domain knowledge to make the BY section concrete

Return ONLY valid JSON with this exact structure:
{
  "one_liner": "Provocative one-line hypothesis under 25 words",
  "if_condition": "Current situation + trigger",
  "then_outcome": "Strategic outcome Backbase enables",
  "by_deploying": "Specific Backbase approach",
  "resulting_in": "Quantified business results",
  "tailored_for": "Brief description of who this is tailored for"
}`;

// ── Main Export ──

/**
 * Generate a meeting-tailored value hypothesis.
 *
 * @param {Object} params
 * @param {string} params.bankName
 * @param {Object} params.bankData - Full bank data
 * @param {Object} params.meetingContext - { topics, attendees, scopeKnown, painPointKnown, scopeText, painText, meetingPrepSummary }
 * @param {Object|null} params.existingHypothesis - Static hypothesis from value_selling table
 * @returns {Object} Tailored hypothesis with IF/THEN/BY/RESULT
 */
export async function generateValueHypothesisForMeeting({
  bankName,
  bankData = {},
  meetingContext = {},
  existingHypothesis = null,
}) {
  const start = Date.now();

  // Load consulting domain knowledge for detected domains
  const domains = detectDomains(bankData, meetingContext);
  const domainKnowledge = loadDomainKnowledge(domains);

  // Build context sections
  const sections = [];

  sections.push(`## Bank: ${bankName}`);

  // Inject domain knowledge early so Claude can reference it
  if (domainKnowledge) {
    sections.push(`## CONSULTING DOMAIN KNOWLEDGE (use this to ground your hypothesis in real value propositions, benchmarks, and ROI levers)\n\n${domainKnowledge}`);
  }

  if (bankData.overview) {
    sections.push(`### Bank Overview\n${bankData.overview.substring(0, 500)}`);
  }

  if (bankData.digital_strategy) {
    sections.push(`### Digital Strategy\n${bankData.digital_strategy.substring(0, 400)}`);
  }

  // Pain points (top 5)
  if (bankData.pain_points?.length > 0) {
    const pps = bankData.pain_points.slice(0, 5).map(pp => `- ${pp.title}: ${pp.detail || ''}`).join('\n');
    sections.push(`### Known Pain Points\n${pps}`);
  }

  // Existing static hypothesis
  if (existingHypothesis) {
    sections.push(`### Existing (Generic) Value Hypothesis\n- One-liner: ${existingHypothesis.one_liner || ''}\n- IF: ${existingHypothesis.if_condition || ''}\n- THEN: ${existingHypothesis.then_outcome || ''}\n- BY: ${existingHypothesis.by_deploying || ''}\n- RESULT: ${existingHypothesis.resulting_in || ''}`);
  }

  // Meeting context
  sections.push(`\n## MEETING CONTEXT (TAILOR THE HYPOTHESIS TO THIS)`);

  if (meetingContext.topics?.length) {
    sections.push(`Meeting topics: ${meetingContext.topics.join(', ')}`);
  }

  if (meetingContext.attendees?.length) {
    const attendeeList = meetingContext.attendees.map(a =>
      `${a.name} (${a.customRole || a.role || 'Unknown role'})`
    ).join(', ');
    sections.push(`Attendees: ${attendeeList}`);
  }

  if (meetingContext.scopeKnown && meetingContext.scopeKnown !== 'unknown') {
    sections.push(`Scope knowledge: ${meetingContext.scopeKnown}${meetingContext.scopeText ? ' — ' + meetingContext.scopeText : ''}`);
  }

  if (meetingContext.painPointKnown && meetingContext.painPointKnown !== 'unknown') {
    sections.push(`Pain point knowledge: ${meetingContext.painPointKnown}${meetingContext.painText ? ' — ' + meetingContext.painText : ''}`);
  }

  if (meetingContext.meetingPrepSummary) {
    sections.push(`Meeting prep intelligence: ${meetingContext.meetingPrepSummary.substring(0, 300)}`);
  }

  sections.push(`\nGenerate a VALUE HYPOTHESIS tailored specifically for this meeting context. If an existing hypothesis is provided, refine and sharpen it for this audience and these topics. If no existing hypothesis exists, create one from scratch based on the bank data and meeting context.`);

  const userMessage = sections.join('\n\n');

  try {
    const raw = await callClaude(SYSTEM_PROMPT, userMessage, { maxTokens: 1024, timeout: 30000 });

    // Parse JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[ValueHypothesis] Could not parse JSON from Claude response');
      return buildFallback(bankName, meetingContext, existingHypothesis);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const durationMs = Date.now() - start;

    console.log(`[ValueHypothesis] Generated for ${bankName} in ${durationMs}ms`);

    return {
      ...parsed,
      _meta: {
        source: 'value-hypothesis-agent',
        generatedAt: new Date().toISOString(),
        durationMs,
        topics: meetingContext.topics || [],
        attendees: meetingContext.attendees?.map(a => a.name) || [],
      },
    };
  } catch (err) {
    console.error(`[ValueHypothesis] Error for ${bankName}:`, err.message);
    return buildFallback(bankName, meetingContext, existingHypothesis);
  }
}

/**
 * Build a fallback hypothesis when Claude fails.
 */
function buildFallback(bankName, meetingContext, existingHypothesis) {
  if (existingHypothesis) {
    return {
      ...existingHypothesis,
      tailored_for: `Fallback — could not tailor for ${meetingContext.topics?.join(', ') || 'meeting'}`,
      _meta: { source: 'value-hypothesis-agent', fallback: true, generatedAt: new Date().toISOString() },
    };
  }

  const topics = meetingContext.topics?.join(' and ') || 'digital transformation';
  return {
    one_liner: `Accelerate ${bankName}'s ${topics} journey with a unified engagement platform.`,
    if_condition: `${bankName} is investing in ${topics}`,
    then_outcome: `Backbase can deliver a unified platform accelerating time-to-market`,
    by_deploying: `Backbase Engagement Banking Platform focused on ${topics}`,
    resulting_in: `30-40% faster digital delivery, improved customer experience, and platform consolidation savings`,
    tailored_for: `Fallback — general hypothesis for ${topics}`,
    _meta: { source: 'value-hypothesis-agent', fallback: true, generatedAt: new Date().toISOString() },
  };
}

/**
 * Check if this agent can run.
 */
export function isValueHypothesisAvailable() {
  return isApiKeyConfigured();
}
