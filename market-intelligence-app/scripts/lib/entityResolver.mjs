/**
 * Entity Resolver — Layer 2
 *
 * Clusters person name variants that likely refer to the same individual.
 * Operates per bank_key — never merges across banks.
 *
 * Clustering requires BOTH:
 *   1. Last name match (case-insensitive exact match on last word of name)
 *   2. Role similarity (exact match, same category, or substring containment)
 *
 * When a cluster is found, the longest name becomes canonical and shorter
 * variants are stored as aliases.
 */
import { getDb } from '../db.mjs';

// ── Name helpers ──

function lastName(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

function normalizeForComparison(name) {
  return (name || '').toLowerCase().replace(/[^a-z\s]/g, '').trim();
}

// ── Role similarity ──

function rolesAreSimilar(roleA, roleB, catA, catB) {
  if (!roleA || !roleB) return false;

  const a = roleA.toLowerCase();
  const b = roleB.toLowerCase();

  // Exact role match
  if (a === b) return true;

  // Same role_category (both non-null)
  if (catA && catB && catA === catB) return true;

  // Substring containment (catches "CEO" in "Group CEO", "CFO" in "CFO, Deputy CEO & Head of IR")
  if (a.includes(b) || b.includes(a)) return true;

  return false;
}

// ── Main resolver ──

/**
 * Resolve person aliases within a single bank.
 * Reads all persons for the bank, finds clusters where last name + role match,
 * writes aliases[] back to the canonical (longest name) person row.
 *
 * Returns { bankKey, clustersFound, aliasesWritten }.
 */
export function resolvePersonAliases(bankKey) {
  const db = getDb();
  const persons = db.prepare('SELECT * FROM persons WHERE bank_key = ?').all(bankKey);

  if (persons.length < 2) return { bankKey, clustersFound: 0, aliasesWritten: 0 };

  // Group by last name
  const byLastName = {};
  for (const p of persons) {
    const ln = lastName(p.canonical_name);
    if (!ln) continue;
    if (!byLastName[ln]) byLastName[ln] = [];
    byLastName[ln].push(p);
  }

  const updateAliases = db.prepare(`
    UPDATE persons SET aliases = ?, updated_at = datetime('now') WHERE id = ?
  `);

  let clustersFound = 0;
  let aliasesWritten = 0;

  for (const [, group] of Object.entries(byLastName)) {
    if (group.length < 2) continue;

    // Within each last-name group, find pairs with similar roles
    const clusters = []; // Array of arrays — each inner array is a cluster of same-person entries
    const assigned = new Set();

    for (let i = 0; i < group.length; i++) {
      if (assigned.has(group[i].id)) continue;

      const cluster = [group[i]];
      assigned.add(group[i].id);

      for (let j = i + 1; j < group.length; j++) {
        if (assigned.has(group[j].id)) continue;

        if (rolesAreSimilar(group[i].role, group[j].role, group[i].role_category, group[j].role_category)) {
          cluster.push(group[j]);
          assigned.add(group[j].id);
        }
      }

      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    }

    // Process each cluster
    for (const cluster of clusters) {
      clustersFound++;

      // Canonical = longest name (most complete variant)
      cluster.sort((a, b) => b.canonical_name.length - a.canonical_name.length);
      const canonical = cluster[0];
      const aliases = cluster.slice(1).map(p => p.canonical_name);

      // Write aliases to canonical person
      updateAliases.run(JSON.stringify(aliases), canonical.id);
      aliasesWritten += aliases.length;
    }
  }

  return { bankKey, clustersFound, aliasesWritten };
}

/**
 * Run alias resolution across all banks.
 * Returns aggregate stats.
 */
export function resolveAllPersonAliases() {
  const db = getDb();
  const bankKeys = db.prepare('SELECT DISTINCT bank_key FROM persons').all().map(r => r.bank_key);

  let totalClusters = 0;
  let totalAliases = 0;

  for (const bankKey of bankKeys) {
    const result = resolvePersonAliases(bankKey);
    totalClusters += result.clustersFound;
    totalAliases += result.aliasesWritten;
  }

  return { banksProcessed: bankKeys.length, clustersFound: totalClusters, aliasesWritten: totalAliases };
}
