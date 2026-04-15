/**
 * Country Intelligence Agent — AI-powered refresh of country market intelligence.
 *
 * Generates structured JSON for 4 sections:
 *   - fintech_landscape: vendor categories with presence/threat mapping
 *   - regulatory_environment: regulations, licensing, open banking status
 *   - market_news: trends, M&A deals, digital transformation scoring
 *   - customer_needs: adoption metrics, unmet needs, pain points, behavioral shifts
 *
 * Uses callClaude() from the shared client with the Denmark data as a few-shot example.
 */

import { callClaude } from './claudeClient.mjs';

const STALENESS_HOURS = 24;

export function isCountryIntelAvailable() {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Check if a section is stale (> STALENESS_HOURS since last refresh)
 */
function isStale(sectionData) {
  if (!sectionData?.last_refreshed) return true;
  const age = Date.now() - new Date(sectionData.last_refreshed).getTime();
  return age > STALENESS_HOURS * 3600 * 1000;
}

const SYSTEM_PROMPT = `You are a senior financial technology market analyst specializing in banking technology landscapes across global markets. You generate structured market intelligence for Backbase, a B2B engagement banking platform vendor.

Your output must be VALID JSON matching the exact schema provided. No markdown, no commentary outside JSON.

Key principles:
- Be specific: name real vendors, real regulations, real market events
- Be accurate: use publicly available information only
- Be balanced: acknowledge market strengths AND gaps
- Focus on technology vendors relevant to banking: CBS, digital experience, payments, cards, AML/compliance, CRM, wealth management, lending, AI/ML, open banking, channels, identity/KYC, trading, data analytics
- For each vendor, assess their presence (strong/moderate/emerging/exiting) and threat level to Backbase (high/medium/low)
- Highlight Backbase's positioning: where it competes, where there's whitespace, where it complements

IMPORTANT: The "threat_level" field refers to the competitive threat TO Backbase in the engagement banking / digital experience space. CBS vendors are typically "low" threat (complementary), CRM vendors like Salesforce are "medium" (overlapping customer 360), and digital banking platforms are the main competition.`;

/**
 * Build a per-section user prompt
 */
function buildUserPrompt(countryName, existingData, sections) {
  const sectionDescriptions = {
    fintech_landscape: `Generate the "fintech_landscape" section with:
- summary: 2-3 sentence overview of the fintech ecosystem
- maturity_level: "emerging" | "growing" | "mature" | "advanced"
- categories: array of 10-14 categories, each with:
  - id: slug (cbs, engagement_banking, payments, cards, aml_compliance, crm, wealth_management, lending_platforms, ai_ml, open_banking, channels, identity_verification, trading, data_analytics)
  - name: human-readable category name
  - vendors: array of 3-5 vendors per category, each with: name, type (global/regional/local/neobank), presence (strong/moderate/emerging/exiting), notable_clients (array of bank names), threat_level (high/medium/low), notes (1 sentence)
- last_refreshed: current ISO timestamp`,

    regulatory_environment: `Generate the "regulatory_environment" section with:
- summary: 2-3 sentence overview
- central_bank: name and key facts
- key_regulations: array of 5-8 major regulations, each with: name, status (implemented/in_progress/planned), effective_date, impact (1 sentence), relevance (high/medium/low)
- licensing: { digital_banking_license: bool, neobank_framework: bool, sandbox_available: bool, notes: string }
- open_banking: { status (advanced/implemented/in_progress/early/none), standard, api_adoption_rate, notes }
- aml_kyc: { digital_onboarding_allowed: bool, ekyc_framework: bool, notes }
- last_refreshed: current ISO timestamp`,

    market_news: `Generate the "market_news" section with:
- trends: array of 4-6 recent market trends, each with: title, category (digital_transformation/m_and_a/regulation/fintech/consumer/sustainability), summary (2-3 sentences), impact (high/medium/low), date (YYYY-QN format)
- recent_deals: array of 3-5 recent M&A/partnership/funding events, each with: type (acquisition/partnership/funding/divestment), parties (array), value (string or "Undisclosed"), date, significance (1 sentence)
- digital_transformation_score: 0-10 integer
- last_refreshed: current ISO timestamp`,

    customer_needs: `Generate the "customer_needs" section with:
- summary: 2-3 sentence overview
- digital_adoption: { mobile_banking_penetration, online_banking_penetration, contactless_payments, open_banking_usage } — all as percentage strings like "85%"
- unmet_needs: array of 4-6 items, each with: segment (retail/sme/corporate/wealth), need, gap_severity (high/medium/low), opportunity (1 sentence), evidence (1 sentence)
- customer_pain_points: array of 4-5 items, each with: pain, affected_segments (array), prevalence (widespread/common/niche)
- behavioral_shifts: array of 3-4 items, each with: shift, trend_direction (accelerating/steady/slowing), implication
- last_refreshed: current ISO timestamp`,
  };

  const requestedSections = sections
    .map(s => sectionDescriptions[s])
    .filter(Boolean)
    .join('\n\n');

  // Include existing context for enrichment
  const existingContext = existingData ? `
Existing country context:
- Tagline: ${existingData.tagline || 'N/A'}
- Banking sector: ${(existingData.banking_sector || '').substring(0, 500)}
- Top banks: ${(existingData.top_banks || []).map(b => b.name).join(', ')}
` : '';

  return `Generate market intelligence for: ${countryName}

${existingContext}

Generate ONLY the following sections as a single JSON object with section names as keys:

${requestedSections}

Output ONLY valid JSON. No markdown fences, no explanation text.`;
}

/**
 * Refresh country intelligence via Claude AI.
 *
 * @param {string} countryName - e.g., "Denmark"
 * @param {object} existingData - current country data blob
 * @param {string[]} sections - sections to refresh
 * @param {boolean} force - ignore staleness check
 * @returns {Promise<object>} - refreshed section data
 */
export async function refreshCountryIntelligence(countryName, existingData, sections, force = false) {
  // Filter to sections that are stale (or forced)
  const sectionsToRefresh = force
    ? sections
    : sections.filter(s => isStale(existingData?.[s]));

  if (sectionsToRefresh.length === 0) {
    return { refreshed: {}, skipped: sections };
  }

  const userPrompt = buildUserPrompt(countryName, existingData, sectionsToRefresh);

  const response = await callClaude(SYSTEM_PROMPT, userPrompt, {
    maxTokens: 8192,
    timeout: 120000,
  });

  // Parse and validate JSON
  let parsed;
  try {
    // Strip markdown fences if present
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${e.message}`);
  }

  // Validate required fields per section
  const refreshed = {};
  for (const section of sectionsToRefresh) {
    if (parsed[section]) {
      // Ensure last_refreshed is set
      parsed[section].last_refreshed = new Date().toISOString();
      refreshed[section] = parsed[section];
    }
  }

  return {
    refreshed,
    skipped: sections.filter(s => !refreshed[s]),
  };
}
