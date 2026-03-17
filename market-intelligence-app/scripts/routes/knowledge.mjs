/**
 * Knowledge API routes — serves consulting domain knowledge for pre-engagement prep.
 *
 * Reads from the repo's knowledge/ directory:
 *   - Domain benchmarks, pain points, value propositions, use cases, personas, journeys
 *   - Consulting Playbook CSV benchmarks
 *   - Capability taxonomy per domain
 *
 * These give value consultants real consulting context directly in the app.
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { jsonResponse } from './helpers.mjs';

// ─── Paths ──────────────────────────────────────────────────────────
const REPO_ROOT = resolve(import.meta.dirname, '..', '..');
const DOMAINS_DIR = join(REPO_ROOT, 'knowledge', 'domains');
const STANDARDS_DIR = join(REPO_ROOT, 'knowledge', 'standards');
const KNOWLEDGE_ROOT = join(REPO_ROOT, 'knowledge');

const VALID_DOMAINS = ['retail', 'commercial', 'corporate', 'sme', 'wealth', 'investing'];
const VALID_FILES = [
  'benchmarks', 'pain_points', 'value_propositions', 'use_cases',
  'personas', 'journey_maps', 'process_maps', 'roi_levers', '_index',
];

// ─── Zone-to-domain mapping ─────────────────────────────────────────
// Maps landing zone keywords to knowledge domains
const ZONE_DOMAIN_MAP = {
  retail: 'retail',
  'personal banking': 'retail',
  'digital banking': 'retail',
  consumer: 'retail',
  sme: 'sme',
  'small business': 'sme',
  'business banking': 'sme',
  'mid-market': 'sme',
  wealth: 'wealth',
  'private banking': 'wealth',
  'asset management': 'wealth',
  advisory: 'wealth',
  commercial: 'commercial',
  corporate: 'corporate',
  'large corporate': 'corporate',
  'transaction banking': 'corporate',
  investing: 'investing',
  'e-commerce': 'commercial',
  merchant: 'commercial',
  onboarding: 'retail',       // default to retail for generic journeys
  origination: 'retail',
  employee: 'retail',         // employee assist maps to retail context
  'branch tools': 'retail',
};

/**
 * Map a bank's landing zones to relevant knowledge domains.
 */
function mapZonesToDomains(zones) {
  if (!zones || !Array.isArray(zones)) return ['retail'];
  const domains = new Set();
  for (const z of zones) {
    const zoneLower = (z.zone || '').toLowerCase();
    for (const [keyword, domain] of Object.entries(ZONE_DOMAIN_MAP)) {
      if (zoneLower.includes(keyword)) {
        domains.add(domain);
      }
    }
  }
  return domains.size > 0 ? [...domains] : ['retail'];
}

/**
 * Read a markdown file from knowledge/domains/{domain}/{file}.md
 */
function readDomainFile(domain, file) {
  const filePath = join(DOMAINS_DIR, domain, `${file}.md`);
  if (!existsSync(filePath)) return null;
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Read capability taxonomy for a domain
 */
function readCapabilityTaxonomy(domain) {
  const filePath = join(STANDARDS_DIR, `capability_taxonomy_${domain}.md`);
  if (!existsSync(filePath)) {
    // Fall back to the master taxonomy
    const master = join(STANDARDS_DIR, 'capability_taxonomy.md');
    if (!existsSync(master)) return null;
    try { return readFileSync(master, 'utf-8'); } catch { return null; }
  }
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// ─── Consulting Playbook CSV parser ─────────────────────────────────
let _csvCache = null;

function loadPlaybookCSV() {
  if (_csvCache) return _csvCache;
  const csvPath = join(KNOWLEDGE_ROOT, 'Consulting Playbook Metrics Benchmark [Master] - Benchmarks.csv');
  if (!existsSync(csvPath)) return [];
  try {
    const raw = readFileSync(csvPath, 'utf-8');
    const lines = raw.split('\n');
    // Find header row (has "Journey", "KPI", etc.)
    let headerIdx = -1;
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      if (lines[i].includes('Journey') && lines[i].includes('KPI')) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) return [];

    const headers = parseCSVLine(lines[headerIdx]);
    const rows = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => {
        const key = h.trim().toLowerCase().replace(/\s+/g, '_');
        if (key) row[key] = (cols[idx] || '').trim();
      });
      if (row.kpi || row.journey) rows.push(row);
    }
    _csvCache = rows;
    return rows;
  } catch {
    return [];
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += char; }
  }
  result.push(current);
  return result;
}

// ─── ROI examples & upgrade patterns ────────────────────────────────
function readKnowledgeFile(filename) {
  const filePath = join(DOMAINS_DIR, filename);
  if (!existsSync(filePath)) return null;
  try { return readFileSync(filePath, 'utf-8'); } catch { return null; }
}

// ─── Route handler ──────────────────────────────────────────────────

export async function handleKnowledgeRoute(req, res, { path }) {
  // GET /api/knowledge/domains — list available domains
  if (path === '/api/knowledge/domains') {
    return jsonResponse(res, 200, {
      domains: VALID_DOMAINS,
      files: VALID_FILES,
      description: 'Available knowledge domains and file types',
    }), true;
  }

  // GET /api/knowledge/domains/:domain — get all knowledge for a domain
  const domainMatch = path.match(/^\/api\/knowledge\/domains\/([a-z]+)$/);
  if (domainMatch) {
    const domain = domainMatch[1];
    if (!VALID_DOMAINS.includes(domain)) {
      return jsonResponse(res, 404, { error: `Unknown domain: ${domain}. Valid: ${VALID_DOMAINS.join(', ')}` }), true;
    }
    const result = {};
    for (const file of VALID_FILES) {
      const content = readDomainFile(domain, file);
      if (content) result[file] = content;
    }
    result._domain = domain;
    result._capability_taxonomy = readCapabilityTaxonomy(domain);
    return jsonResponse(res, 200, result), true;
  }

  // GET /api/knowledge/domains/:domain/:file — get specific file
  const fileMatch = path.match(/^\/api\/knowledge\/domains\/([a-z]+)\/([a-z_]+)$/);
  if (fileMatch) {
    const [, domain, file] = fileMatch;
    if (!VALID_DOMAINS.includes(domain)) {
      return jsonResponse(res, 404, { error: `Unknown domain: ${domain}` }), true;
    }
    if (!VALID_FILES.includes(file)) {
      return jsonResponse(res, 404, { error: `Unknown file: ${file}. Valid: ${VALID_FILES.join(', ')}` }), true;
    }
    const content = readDomainFile(domain, file);
    if (!content) {
      return jsonResponse(res, 404, { error: `File not found: ${domain}/${file}.md` }), true;
    }
    return jsonResponse(res, 200, { domain, file, content }), true;
  }

  // GET /api/knowledge/capability-taxonomy/:domain — get capability maturity framework
  const taxMatch = path.match(/^\/api\/knowledge\/capability-taxonomy\/([a-z]+)$/);
  if (taxMatch) {
    const domain = taxMatch[1];
    const content = readCapabilityTaxonomy(domain);
    if (!content) {
      return jsonResponse(res, 404, { error: `No capability taxonomy for domain: ${domain}` }), true;
    }
    return jsonResponse(res, 200, { domain, content }), true;
  }

  // GET /api/knowledge/benchmarks-csv — get full Consulting Playbook benchmarks
  if (path === '/api/knowledge/benchmarks-csv') {
    const rows = loadPlaybookCSV();
    return jsonResponse(res, 200, { count: rows.length, rows }), true;
  }

  // GET /api/knowledge/benchmarks-csv/:journey — filter by journey
  const csvJourneyMatch = path.match(/^\/api\/knowledge\/benchmarks-csv\/(.+)$/);
  if (csvJourneyMatch) {
    const journey = decodeURIComponent(csvJourneyMatch[1]).toLowerCase();
    const rows = loadPlaybookCSV().filter(r =>
      (r.journey || '').toLowerCase().includes(journey)
    );
    return jsonResponse(res, 200, { journey, count: rows.length, rows }), true;
  }

  // GET /api/knowledge/for-bank/:bankKey — get all relevant knowledge for a bank
  //   Uses the bank's landing zones to determine which domains to load
  const bankKnowledgeMatch = path.match(/^\/api\/knowledge\/for-bank\/(.+)$/);
  if (bankKnowledgeMatch) {
    const bankKey = decodeURIComponent(bankKnowledgeMatch[1]);
    // We need bank data — import dynamically or accept it won't be available server-side
    // For now, accept domains as query param or return all domain knowledge
    const result = {
      bankKey,
      domains: {},
      _zoneDomainMap: ZONE_DOMAIN_MAP,
      _tip: 'Pass ?domains=retail,wealth to filter, or the frontend maps landing zones to domains',
    };

    // Parse domains from URL if provided (e.g., ?domains=retail,wealth)
    const urlObj = new URL(`http://localhost${path}`);
    const domainsParam = urlObj.searchParams?.get('domains');
    const requestedDomains = domainsParam
      ? domainsParam.split(',').filter(d => VALID_DOMAINS.includes(d))
      : VALID_DOMAINS;

    for (const domain of requestedDomains) {
      const domainData = {};
      for (const file of ['benchmarks', 'pain_points', 'value_propositions', 'use_cases', 'roi_levers']) {
        const content = readDomainFile(domain, file);
        if (content) domainData[file] = content;
      }
      domainData._capability_taxonomy = readCapabilityTaxonomy(domain);
      if (Object.keys(domainData).length > 0) {
        result.domains[domain] = domainData;
      }
    }
    return jsonResponse(res, 200, result), true;
  }

  // GET /api/knowledge/roi-examples — get ROI examples from past engagements
  if (path === '/api/knowledge/roi-examples') {
    const content = readKnowledgeFile('roi_examples.md');
    return jsonResponse(res, 200, { content: content || 'No ROI examples found' }), true;
  }

  // GET /api/knowledge/upgrade-patterns — get upgrade/migration patterns
  if (path === '/api/knowledge/upgrade-patterns') {
    const content = readKnowledgeFile('upgrade_patterns.md');
    return jsonResponse(res, 200, { content: content || 'No upgrade patterns found' }), true;
  }

  // GET /api/knowledge/standards/:standard — get consulting standards
  const stdMatch = path.match(/^\/api\/knowledge\/standards\/([a-z_]+)$/);
  if (stdMatch) {
    const standard = stdMatch[1];
    const validStandards = [
      'auditability_protocol', 'benchmark_evolution', 'capability_taxonomy',
      'context_management_protocol', 'ramp_up_models',
    ];
    if (!validStandards.includes(standard)) {
      return jsonResponse(res, 404, { error: `Unknown standard: ${standard}. Valid: ${validStandards.join(', ')}` }), true;
    }
    const filePath = join(STANDARDS_DIR, `${standard}.md`);
    if (!existsSync(filePath)) {
      return jsonResponse(res, 404, { error: `Standard file not found: ${standard}` }), true;
    }
    try {
      const content = readFileSync(filePath, 'utf-8');
      return jsonResponse(res, 200, { standard, content }), true;
    } catch {
      return jsonResponse(res, 500, { error: 'Failed to read standard file' }), true;
    }
  }

  return false;
}

// Export the zone-to-domain mapper for use by other modules
export { mapZonesToDomains, VALID_DOMAINS, ZONE_DOMAIN_MAP };
