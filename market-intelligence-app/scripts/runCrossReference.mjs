#!/usr/bin/env node
/**
 * Cross-Reference Engine CLI — Sprint 2.4
 * ───────────────────────────────────────
 * Runs the internal-fact ↔ external-signal pattern matcher across every bank
 * that has facts, or a filtered subset.
 *
 * Idempotent: pattern_matches has a content_hash unique index so re-runs
 * don't double-insert. Use --force to re-evaluate facts already linked.
 *
 * Usage:
 *   node scripts/runCrossReference.mjs                           # all banks, only new facts
 *   node scripts/runCrossReference.mjs --bank=Nordea             # filter
 *   node scripts/runCrossReference.mjs --window=90               # ±90 day window (default 60)
 *   node scripts/runCrossReference.mjs --candidates=6            # max signals per fact (default 4)
 *   node scripts/runCrossReference.mjs --force                   # re-evaluate already-linked facts
 *   node scripts/runCrossReference.mjs --dry-run                 # report candidate count, no LLM
 */

import dotenv from 'dotenv';
dotenv.config({ override: true, quiet: true });

import { getDb } from './db.mjs';
import { runCrossReferenceForAllBanks, getPatternsForBank } from './lib/crossReferenceEngine.mjs';

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const bankArg = args.find(a => a.startsWith('--bank='));
const windowArg = args.find(a => a.startsWith('--window='));
const candArg = args.find(a => a.startsWith('--candidates='));
const opts = {
  bankFilter: bankArg ? bankArg.split('=')[1] : null,
  windowDays: windowArg ? parseInt(windowArg.split('=')[1], 10) : 60,
  maxCandidates: candArg ? parseInt(candArg.split('=')[1], 10) : 4,
  force: FORCE,
};

const db = getDb();

async function main() {
  console.log('═'.repeat(60));
  console.log('  Cross-Reference Engine');
  console.log('═'.repeat(60));
  console.log(`  Window: ±${opts.windowDays}d   Candidates/fact: ${opts.maxCandidates}   Force: ${FORCE}   Dry-run: ${DRY_RUN}`);
  if (opts.bankFilter) console.log(`  Bank filter: ${opts.bankFilter}`);

  if (DRY_RUN) {
    // Just count candidate pairs we would evaluate
    const facts = db.prepare(`SELECT bank_key, COUNT(*) c FROM meeting_facts GROUP BY bank_key ORDER BY c DESC`).all();
    console.log(`\n  Facts per bank (would-process):`);
    facts.forEach(r => console.log(`    ${r.bank_key.padEnd(35)} ${r.c}`));
    console.log(`\n  Total facts: ${facts.reduce((s, r) => s + r.c, 0)}`);
    return;
  }

  const start = Date.now();
  const results = await runCrossReferenceForAllBanks(db, opts);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log();
  let totalAdded = 0, totalCandidates = 0, totalFacts = 0;
  for (const r of results) {
    console.log(`  ${r.bank_key.padEnd(35)} facts:${r.processed_facts}  candidates:${r.candidates_evaluated}  added:${r.patterns_added}  skipped:${r.patterns_skipped}`);
    totalAdded += r.patterns_added;
    totalCandidates += r.candidates_evaluated;
    totalFacts += r.processed_facts;
  }
  console.log('═'.repeat(60));
  console.log(`  Total: ${totalAdded} patterns from ${totalCandidates} candidates across ${totalFacts} facts in ${elapsed}s`);
  console.log('═'.repeat(60));

  // Surface highest-confidence patterns for inspection
  const allPatterns = db.prepare(`SELECT bank_key FROM pattern_matches GROUP BY bank_key`).all();
  const highConf = [];
  for (const r of allPatterns) {
    highConf.push(...getPatternsForBank(db, r.bank_key, { minConfidence: 'high' }));
  }
  if (highConf.length > 0) {
    console.log();
    console.log(`  HIGH-CONFIDENCE PATTERNS (${highConf.length}):`);
    highConf.slice(0, 10).forEach(p => {
      console.log(`    ${p.bank_key} · ${p.pattern_type}/${p.topic} · gap:${p.time_gap_days}d`);
      console.log(`      ${p.summary}`);
    });
  }
}

main().catch(err => {
  console.error('Cross-reference engine error:', err);
  process.exit(1);
});
