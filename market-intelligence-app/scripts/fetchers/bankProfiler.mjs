/**
 * Bank Profiler — Automated Bank Data Enrichment
 * ────────────────────────────────────────────────
 * Two-stage system for populating Nova's full bank data model:
 *
 *   Stage 1 (Facts): Web research for executives, financials, competitors
 *   Stage 2 (Strategy): Claude-powered analysis for pain points, value hypothesis, landing zones
 *
 * Produces a complete bank profile matching Nova's data schema.
 * Results are written directly to SQLite via merge logic (never overwrites curated data).
 *
 * Usage:
 *   import { profileBank } from './bankProfiler.mjs';
 *   const result = await profileBank('Sydbank_Denmark');
 *
 * Standalone (auto-finds skeleton banks):
 *   node scripts/fetchers/bankProfiler.mjs
 *
 * Standalone (specific banks):
 *   node scripts/fetchers/bankProfiler.mjs Sydbank_Denmark Lunar_Denmark
 */

import { getDb, closeDb } from '../db.mjs';
import { callClaude, isApiKeyConfigured } from './claudeClient.mjs';
import { BANK_SOURCES } from '../config.mjs';
import { writeProvenance } from '../lib/provenanceWriter.mjs';
import { upsertDiscoveredPerson } from './contactDiscovery.mjs';

// Google News RSS Search

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
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) && items.length < maxResults) {
      const itemXml = match[1];
      const title = (itemXml.match(/<title>(.*?)<\/title>/) || [])[1] || '';
      const cleanTitle = title.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      if (cleanTitle) items.push({ title: cleanTitle });
    }
    return items;
  } catch { return []; }
}

// ═══════════════════════════════════════════════
// STAGE 1: Web Research (Facts)
// ═══════════════════════════════════════════════

async function stage1Research(bankKey, bankName, country) {
  console.log('  Stage 1: Web research for ' + bankName + '...');

  const [executiveNews, financialNews, strategyNews, digitalNews, competitorNews] = await Promise.all([
    searchGoogleNews('"' + bankName + '" CEO OR CFO OR CTO OR "Head of" OR "Chief" executive 2024 OR 2025 OR 2026', 5),
    searchGoogleNews('"' + bankName + '" annual report 2024 total assets employees revenue', 5),
    searchGoogleNews('"' + bankName + '" digital transformation strategy 2025', 5),
    searchGoogleNews('"' + bankName + '" mobile banking app digital', 3),
    searchGoogleNews('"' + bankName + '" ' + country + ' banking competitor fintech', 3),
  ]);

  const allHeadlines = [
    ...executiveNews.map(n => '[EXEC] ' + n.title),
    ...financialNews.map(n => '[FIN] ' + n.title),
    ...strategyNews.map(n => '[STRATEGY] ' + n.title),
    ...digitalNews.map(n => '[DIGITAL] ' + n.title),
    ...competitorNews.map(n => '[COMP] ' + n.title),
  ].join('\n');

  const total = executiveNews.length + financialNews.length + strategyNews.length + digitalNews.length + competitorNews.length;
  console.log('     Found ' + total + ' news items');

  return { allHeadlines };
}

// ═══════════════════════════════════════════════
// STAGE 2: AI Strategic Analysis
// ═══════════════════════════════════════════════

const PROFILER_SYSTEM_PROMPT = `You are a senior B2B fintech sales intelligence analyst working for Backbase, the leading engagement banking platform vendor.

Backbase products: Retail Banking, Business/SME Banking, Wealth Management, Corporate Banking, Lending & Origination, Employee Assist, Engage (AI personalization), Multi-Entity Architecture.

LANDING ZONE FIT SCORING: 10=perfect fit, 8-9=strong, 6-7=good, 4-5=moderate, 1-3=weak.

Return ONLY valid JSON. No markdown fences. No preamble.
{
  "operational_profile": {
    "total_assets": "string or null",
    "total_customers": "string or null",
    "employees": "string or null",
    "cost_income_ratio": "string or null",
    "roe": "string or null"
  },
  "key_decision_makers": [
    { "name": "Full Name", "role": "Exact Title", "note": "1-2 sentence context" }
  ],
  "pain_points": [
    { "title": "Short Title", "detail": "2-3 sentence description" }
  ],
  "backbase_landing_zones": [
    { "zone": "Zone Name", "fit_score": 8, "rationale": "Why this fits", "entry_strategy": "How to approach" }
  ],
  "signals": [
    { "signal": "Observable signal", "implication": "What it means for Backbase" }
  ],
  "backbase_qualification": {
    "bank_type": "string", "deal_size": "string", "sales_cycle": "string", "timing": "string", "risk": "string"
  },
  "value_hypothesis": {
    "if_condition": "string", "then_outcome": "string", "by_deploying": "string", "resulting_in": "string", "one_liner": "string"
  },
  "competitive_landscape": {
    "core_banking": "string or null", "digital_platform": "string or null", "key_vendors": ["string"], "vendor_risk": "string"
  },
  "recommended_approach": "3-5 sentence sales approach",
  "discovery_questions": ["Question tailored to this bank"],
  "confidence_notes": "What is confident vs inferred"
}

RULES:
- key_decision_makers: Only real names from the news. If unsure, return empty array. NEVER fabricate.
- operational_profile: Use ~ for estimates. null if unknown.
- pain_points: 3-5 realistic challenges Backbase can address.
- landing_zones: 2-4 with honest scores.
- discovery_questions: 4-6 for a first meeting.`;

async function stage2Analysis(bankKey, bankName, country, headlines, existingData) {
  console.log('  Stage 2: AI strategic analysis...');

  let existingContext = '';
  if (existingData) {
    const realKdms = (existingData.key_decision_makers || []).filter(k => k.name && !k.name.startsWith('('));
    existingContext = '\nEXISTING DATA (may be partial — update with better info):\n' +
      'Overview: ' + (existingData.overview || 'None') + '\n' +
      'KDMs: ' + (realKdms.map(k => k.name + ' (' + k.role + ')').join(', ') || 'None confirmed') + '\n' +
      'Pain Points: ' + ((existingData.pain_points || []).map(p => p.title).join(', ') || 'None') + '\n';
  }

  const prompt = 'Profile this bank:\n\nBANK: ' + bankName + '\nCOUNTRY: ' + country +
    existingContext + '\n\nRECENT NEWS:\n' + (headlines || 'No recent news — use your knowledge.');

  const raw = await callClaude(PROFILER_SYSTEM_PROMPT, prompt, {

    maxTokens: 4000,

    timeout: 60000,
  });

  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('     Failed to parse AI response: ' + err.message);
    return null;
  }
}

// ═══════════════════════════════════════════════
// STAGE 3: Write to Database (merge, never overwrite)
// ═══════════════════════════════════════════════

function stage3Write(bankKey, bankName, country, profile) {
  console.log('  Stage 3: Writing to database...');
  const db = getDb();

  const existing = db.prepare('SELECT data FROM banks WHERE key = ?').get(bankKey);
  const existingData = existing ? JSON.parse(existing.data || '{}') : {};
  const merged = { ...existingData };

  // Operational profile — fill gaps only
  if (profile.operational_profile) {
    if (!merged.operational_profile) merged.operational_profile = {};
    for (const [k, v] of Object.entries(profile.operational_profile)) {
      if (v && !merged.operational_profile[k]) merged.operational_profile[k] = v;
    }
  }

  // Pain points — add new, keep existing
  if (profile.pain_points && profile.pain_points.length > 0) {
    const existingTitles = new Set((merged.pain_points || []).map(p => p.title.toLowerCase()));
    const newPains = profile.pain_points.filter(p => !existingTitles.has(p.title.toLowerCase()));
    merged.pain_points = [...(merged.pain_points || []), ...newPains];
  }

  // Landing zones — add new, keep existing
  if (profile.backbase_landing_zones && profile.backbase_landing_zones.length > 0) {
    const existingZones = new Set((merged.backbase_landing_zones || []).map(z => z.zone.toLowerCase()));
    const newZones = profile.backbase_landing_zones.filter(z => !existingZones.has(z.zone.toLowerCase()));
    merged.backbase_landing_zones = [...(merged.backbase_landing_zones || []), ...newZones];
  }

  // Signals — add new, dedup
  if (profile.signals && profile.signals.length > 0) {
    const existingSigs = new Set((merged.signals || []).map(s => s.signal.substring(0, 50).toLowerCase()));
    const newSigs = profile.signals.filter(s => !existingSigs.has(s.signal.substring(0, 50).toLowerCase()));
    merged.signals = [...(merged.signals || []), ...newSigs];
  }

  // Qualification — only if missing
  if (profile.backbase_qualification && !merged.backbase_qualification) {
    merged.backbase_qualification = profile.backbase_qualification;
  }

  // Recommended approach — only if missing
  if (profile.recommended_approach && !merged.recommended_approach) {
    merged.recommended_approach = profile.recommended_approach;
  }

  // KDMs via upsertDiscoveredPerson
  let kdmStats = { verified: 0, inserted: 0 };
  if (profile.key_decision_makers && profile.key_decision_makers.length > 0) {
    for (const kdm of profile.key_decision_makers) {
      if (kdm.name && kdm.name.split(/\s+/).length >= 2) {
        const result = upsertDiscoveredPerson(bankKey, { name: kdm.name, role: kdm.role, note: kdm.note }, 'auto_profiler');
        if (result.action === 'verified') kdmStats.verified++;
        if (result.action === 'inserted') kdmStats.inserted++;
      }
    }
    // Also update blob for backward compat
    const existingNames = new Set((merged.key_decision_makers || []).map(k => (k.name || '').toLowerCase()));
    const newKdms = profile.key_decision_makers.filter(k =>
      k.name && k.name.split(/\s+/).length >= 2 && !existingNames.has(k.name.toLowerCase())
    );
    merged.key_decision_makers = [...(merged.key_decision_makers || []), ...newKdms];
  }

  // Write merged bank data
  db.prepare('UPDATE banks SET data = ? WHERE key = ?').run(JSON.stringify(merged), bankKey);

  // Competition table
  if (profile.competitive_landscape) {
    const existingComp = db.prepare('SELECT data FROM competition WHERE bank_key = ?').get(bankKey);
    if (existingComp) {
      const compData = JSON.parse(existingComp.data || '{}');
      for (const [k, v] of Object.entries(profile.competitive_landscape)) {
        if (v && (!compData[k] || (Array.isArray(v) && v.length > (compData[k] || []).length))) {
          compData[k] = v;
        }
      }
      db.prepare('UPDATE competition SET data = ? WHERE bank_key = ?').run(JSON.stringify(compData), bankKey);
    }
  }

  // Value selling — only if missing
  if (profile.value_hypothesis) {
    const existingVs = db.prepare('SELECT 1 FROM value_selling WHERE bank_key = ?').get(bankKey);
    if (!existingVs) {
      db.prepare('INSERT INTO value_selling (bank_key, data) VALUES (?, ?)').run(
        bankKey, JSON.stringify({ value_hypothesis: profile.value_hypothesis, discovery_questions: profile.discovery_questions || [] })
      );
    }
  }

  // Provenance
  const today = new Date().toISOString().slice(0, 10);
  if (profile.operational_profile) {
    for (const [k, v] of Object.entries(profile.operational_profile)) {
      if (v) {
        writeProvenance(
          'bank', bankKey,
          'operational_profile.' + k, v,
          'auto_profiler', null, today, 3
        );
      }
    }
  }

  return {
    painPointsAdded: (profile.pain_points || []).length,
    landingZonesAdded: (profile.backbase_landing_zones || []).length,
    signalsAdded: (profile.signals || []).length,
    kdmVerified: kdmStats.verified,
    kdmInserted: kdmStats.inserted,
    hasQualification: !!profile.backbase_qualification,
    hasValueHypothesis: !!profile.value_hypothesis,
    hasOperationalProfile: !!profile.operational_profile,
  };
}

// ═══════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════

export async function profileBank(bankKey) {
  if (!isApiKeyConfigured()) {
    console.log('  Claude API key not configured');
    return null;
  }

  const db = getDb();
  const bank = db.prepare('SELECT bank_name, country, data FROM banks WHERE key = ?').get(bankKey);
  if (!bank) { console.error('  Bank not found: ' + bankKey); return null; }

  const bankName = bank.bank_name;
  const country = bank.country;
  const existingData = JSON.parse(bank.data || '{}');

  console.log('\n  Bank Profiler: ' + bankName + ' (' + country + ')');
  console.log('  ──────────────────────────────────────');

  const { allHeadlines } = await stage1Research(bankKey, bankName, country);
  const profile = await stage2Analysis(bankKey, bankName, country, allHeadlines, existingData);
  if (!profile) { console.log('  Profiling failed'); return null; }

  const stats = stage3Write(bankKey, bankName, country, profile);

  console.log('  Results: KDMs +' + stats.kdmInserted + ' new/' + stats.kdmVerified + ' verified | Pain +' + stats.painPointsAdded + ' | LZ +' + stats.landingZonesAdded + ' | Sig +' + stats.signalsAdded);
  console.log('  OpProfile: ' + (stats.hasOperationalProfile ? 'yes' : 'no') + ' | Qual: ' + (stats.hasQualification ? 'yes' : 'no') + ' | VH: ' + (stats.hasValueHypothesis ? 'yes' : 'no'));

  return { bankKey, bankName, profile, stats };
}

export async function profileBanks(bankKeys) {
  const results = [];
  for (let i = 0; i < bankKeys.length; i++) {
    const result = await profileBank(bankKeys[i]);
    if (result) results.push(result);
    if (i < bankKeys.length - 1) {
      console.log('  Rate limit pause (3s)...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  return results;
}

// Standalone
const isMain = process.argv[1] && process.argv[1].endsWith('bankProfiler.mjs');
if (isMain) {
  const bankKeys = process.argv.slice(2);

  if (bankKeys.length === 0) {
    const db = getDb();
    const allBanks = db.prepare('SELECT key, data FROM banks').all();
    const skeletonKeys = [];
    for (const bank of allBanks) {
      const data = JSON.parse(bank.data || '{}');
      const realKdms = (data.key_decision_makers || []).filter(k => k.name && !k.name.startsWith('(') && !k.name.startsWith('Various'));
      if (realKdms.length < 3) skeletonKeys.push(bank.key);
    }
    console.log('Found ' + skeletonKeys.length + ' skeleton banks to profile');
    const results = await profileBanks(skeletonKeys);
    console.log('\nProfiled ' + results.length + '/' + skeletonKeys.length + ' banks');
  } else {
    const results = await profileBanks(bankKeys);
    console.log('\nProfiled ' + results.length + '/' + bankKeys.length + ' banks');
  }

  closeDb();
}
