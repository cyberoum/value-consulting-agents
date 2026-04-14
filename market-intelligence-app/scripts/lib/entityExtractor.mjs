/**
 * Entity Extractor — Layer 2
 *
 * Extracts persons, pain points, and landing zones from banks.data JSON blobs
 * into normalized tables with stable, deterministic IDs.
 *
 * Deterministic IDs: SHA-256 hash of (entity_type | bank_key | canonical identifier).
 * Re-running the extractor produces the same IDs, so ON CONFLICT upserts cleanly.
 */
import { createHash } from 'node:crypto';
import { getDb } from '../db.mjs';

// ── Deterministic ID generation ──

function entityId(entityType, bankKey, canonicalKey) {
  return createHash('sha256')
    .update(`${entityType}|${bankKey}|${canonicalKey}`)
    .digest('hex')
    .substring(0, 32);
}

// ── Role category inference ──

const ROLE_CATEGORY_PATTERNS = [
  { pattern: /\b(CEO|CFO|CTO|CIO|COO|CRO|CCO|CPIO|CMO|CDO|Chief)\b/i, category: 'C-suite' },
  { pattern: /\b(President|Group Head)\b/i, category: 'C-suite' },
  { pattern: /\b(EVP|SVP|Senior Vice President|Executive Vice President)\b/i, category: 'SVP' },
  { pattern: /\b(VP|Vice President)\b/i, category: 'VP' },
  { pattern: /\b(Head of|Director|Managing Director)\b/i, category: 'Director' },
  { pattern: /\b(Manager|Lead)\b/i, category: 'Manager' },
];

function inferRoleCategory(role) {
  if (!role) return null;
  for (const { pattern, category } of ROLE_CATEGORY_PATTERNS) {
    if (pattern.test(role)) return category;
  }
  return null;
}

// ── Pain point category inference ──

const PAIN_CATEGORY_PATTERNS = [
  { pattern: /\b(legacy|core|mainframe|monolith|aging|technical debt)\b/i, category: 'legacy_core' },
  { pattern: /\b(customer experience|CX|UX|app rating|NPS|digital experience|mobile|banking experience|digital gap|sme|dated|portal|wealth|advisory|digitization|digitisation)\b/i, category: 'cx' },
  { pattern: /\b(operations|efficiency|cost|manual|process|STP|FTE|employee|staff|tools|workforce)\b/i, category: 'ops' },
  { pattern: /\b(regulat|compliance|KYC|AML|GDPR|PSD2|license)\b/i, category: 'regulatory' },
  { pattern: /\b(revenue|cross.sell|growth|market share|acquisition|retention|engagement|personali)\b/i, category: 'revenue' },
  { pattern: /\b(onboarding|origination|lending|mortgage)\b/i, category: 'origination' },
  { pattern: /\b(integrat)/i, category: 'platform' },
  { pattern: /\b(platform|consolidat|fragment|silo)\b/i, category: 'platform' },
];

function inferPainCategory(title, detail) {
  const text = `${title} ${detail}`.toLowerCase();
  for (const { pattern, category } of PAIN_CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return null;
}

// ── Prepared statements (lazily initialized) ──

let _stmtPerson = null;
let _stmtPainPoint = null;
let _stmtLandingZone = null;

function stmtPerson() {
  if (!_stmtPerson) {
    _stmtPerson = getDb().prepare(`
      INSERT INTO persons (id, bank_key, canonical_name, role, role_category, aliases, linkedin_url, note, is_legacy, discovery_source)
      VALUES (@id, @bankKey, @canonicalName, @role, @roleCategory, @aliases, @linkedinUrl, @note, @isLegacy, @discoverySource)
      ON CONFLICT(bank_key, canonical_name) DO UPDATE SET
        role = excluded.role,
        role_category = excluded.role_category,
        linkedin_url = excluded.linkedin_url,
        note = excluded.note,
        is_legacy = excluded.is_legacy,
        discovery_source = excluded.discovery_source,
        updated_at = datetime('now')
    `);
  }
  return _stmtPerson;
}

function stmtPainPoint() {
  if (!_stmtPainPoint) {
    _stmtPainPoint = getDb().prepare(`
      INSERT INTO pain_points (id, bank_key, canonical_text, category, detail)
      VALUES (@id, @bankKey, @canonicalText, @category, @detail)
      ON CONFLICT(bank_key, canonical_text) DO UPDATE SET
        category = excluded.category,
        detail = excluded.detail
    `);
  }
  return _stmtPainPoint;
}

function stmtLandingZone() {
  if (!_stmtLandingZone) {
    _stmtLandingZone = getDb().prepare(`
      INSERT INTO landing_zones (id, bank_key, zone_name, fit_score, rationale, entry_strategy, source, details)
      VALUES (@id, @bankKey, @zoneName, @fitScore, @rationale, @entryStrategy, @source, @details)
      ON CONFLICT(bank_key, zone_name, source) DO UPDATE SET
        fit_score = excluded.fit_score,
        rationale = excluded.rationale,
        entry_strategy = excluded.entry_strategy,
        details = excluded.details,
        updated_at = datetime('now')
    `);
  }
  return _stmtLandingZone;
}

// ── Public extractors ──

/**
 * Extract persons from banks.data.key_decision_makers[].
 * Skips entries with no name or names starting with '(' (placeholder entries).
 * Returns count of persons extracted.
 */
export function extractPersons(bankKey, bankData) {
  const kdms = bankData?.key_decision_makers;
  if (!Array.isArray(kdms) || kdms.length === 0) return 0;

  const stmt = stmtPerson();
  let count = 0;

  for (const kdm of kdms) {
    if (!kdm.name || kdm.name.startsWith('(')) continue;

    const id = entityId('person', bankKey, kdm.name);
    stmt.run({
      id,
      bankKey,
      canonicalName: kdm.name,
      role: kdm.role || null,
      roleCategory: inferRoleCategory(kdm.role),
      aliases: null, // populated by entityResolver
      linkedinUrl: kdm.linkedin || null,
      note: kdm.note || null,
      isLegacy: 1,
      discoverySource: 'legacy_seed',
    });
    count++;
  }

  return count;
}

/**
 * Extract pain points from banks.data.pain_points[].
 * Uses title as canonical_text (the unique identifier).
 * Returns count of pain points extracted.
 */
export function extractPainPoints(bankKey, bankData) {
  const pps = bankData?.pain_points;
  if (!Array.isArray(pps) || pps.length === 0) return 0;

  const stmt = stmtPainPoint();
  let count = 0;

  for (const pp of pps) {
    if (!pp.title) continue;

    const id = entityId('pain_point', bankKey, pp.title);
    stmt.run({
      id,
      bankKey,
      canonicalText: pp.title,
      category: inferPainCategory(pp.title, pp.detail || ''),
      detail: pp.detail || null,
    });
    count++;
  }

  return count;
}

/**
 * Extract landing zones from two curated sources:
 *   Source 1: banks.data.backbase_landing_zones[] → source = 'curated_sales'
 *   Source 2: valueSelling.data.product_mapping[] → source = 'curated_implementation'
 *
 * These are stored as separate rows — not merged. Dedup is within-source only.
 * Returns count of landing zones extracted.
 */
export function extractLandingZones(bankKey, bankData, valueSellingData) {
  const stmt = stmtLandingZone();
  let count = 0;

  // Source 1: curated_sales (fit_score, rationale, entry_strategy)
  const salesZones = bankData?.backbase_landing_zones;
  if (Array.isArray(salesZones)) {
    for (const lz of salesZones) {
      if (!lz.zone) continue;

      const id = entityId('landing_zone', bankKey, `${lz.zone}|curated_sales`);
      stmt.run({
        id,
        bankKey,
        zoneName: lz.zone,
        fitScore: lz.fit_score ?? null,
        rationale: lz.rationale || null,
        entryStrategy: lz.entry_strategy || null,
        source: 'curated_sales',
        details: null,
      });
      count++;
    }
  }

  // Source 2: curated_implementation (products, modules, timeline, users)
  const implZones = valueSellingData?.product_mapping;
  if (Array.isArray(implZones)) {
    for (const pm of implZones) {
      if (!pm.zone) continue;

      const id = entityId('landing_zone', bankKey, `${pm.zone}|curated_implementation`);
      stmt.run({
        id,
        bankKey,
        zoneName: pm.zone,
        fitScore: null,
        rationale: null,
        entryStrategy: null,
        source: 'curated_implementation',
        details: JSON.stringify({
          products: pm.products || [],
          modules: pm.modules || [],
          timeline: pm.timeline || null,
          users: pm.users || null,
        }),
      });
      count++;
    }
  }

  return count;
}

/**
 * Extract all entities for a single bank.
 * Convenience wrapper that calls all three extractors.
 * Returns { persons, painPoints, landingZones } counts.
 */
export function extractAllEntities(bankKey, bankData, valueSellingData) {
  return {
    persons: extractPersons(bankKey, bankData),
    painPoints: extractPainPoints(bankKey, bankData),
    landingZones: extractLandingZones(bankKey, bankData, valueSellingData),
  };
}
