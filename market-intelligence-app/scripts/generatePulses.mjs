#!/usr/bin/env node
/**
 * Bulk Pulse Generator (Sprint 1 finishing touch)
 * ───────────────────────────────────────────────
 * Generates pulses for every bank for one or more review periods. Used to
 * backfill the closed Q1 2026 snapshots and the in-progress Q2 2026 across
 * the entire portfolio so the Pulse system applies to all banks in all
 * countries — not just Nordea.
 *
 * Idempotent: re-running replaces the row for (account, period). Safe to
 * run repeatedly; the synthesizer is fast (~50ms per bank, structured
 * composition with no LLM calls in V0).
 *
 * Usage:
 *   node scripts/generatePulses.mjs                              # all banks, Q1 + Q2 2026
 *   node scripts/generatePulses.mjs --period=2026-Q2             # all banks, one period
 *   node scripts/generatePulses.mjs --bank=Nordea                # one bank, Q1 + Q2
 *   node scripts/generatePulses.mjs --country=Sweden             # all Swedish banks
 *   node scripts/generatePulses.mjs --dry-run                    # report only, no DB writes
 */

import dotenv from 'dotenv';
dotenv.config({ override: true, quiet: true });

import { getDb } from './db.mjs';
import { generatePulseForBank } from './lib/pulseGenerator.mjs';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const periodArg = args.find(a => a.startsWith('--period='));
const bankArg = args.find(a => a.startsWith('--bank='));
const countryArg = args.find(a => a.startsWith('--country='));

const ONLY_PERIOD = periodArg ? periodArg.split('=')[1] : null;
const ONLY_BANK = bankArg ? bankArg.split('=')[1] : null;
const ONLY_COUNTRY = countryArg ? countryArg.split('=')[1] : null;

const db = getDb();

function loadBanks() {
  let sql = 'SELECT key, bank_name, country FROM banks';
  const params = [];
  const where = [];
  if (ONLY_BANK) { where.push('bank_name LIKE ?'); params.push(`%${ONLY_BANK}%`); }
  if (ONLY_COUNTRY) { where.push('(country = ? OR country LIKE ?)'); params.push(ONLY_COUNTRY, `${ONLY_COUNTRY}%`); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY country, bank_name';
  return db.prepare(sql).all(...params);
}

function loadPeriods() {
  if (ONLY_PERIOD) {
    return db.prepare('SELECT id, status FROM review_periods WHERE id = ?').all(ONLY_PERIOD);
  }
  // Default: Q1 (closed snapshot) + Q2 (active) — these are the demo-relevant ones
  return db.prepare("SELECT id, status FROM review_periods WHERE id IN ('2026-Q1', '2026-Q2') ORDER BY id").all();
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  Bulk Pulse Generator');
  console.log('═'.repeat(60));
  console.log(`  Mode:    ${DRY_RUN ? 'DRY-RUN' : 'WRITE'}`);

  const banks = loadBanks();
  const periods = loadPeriods();
  console.log(`  Banks:   ${banks.length}${ONLY_BANK ? ` (filter=${ONLY_BANK})` : ''}${ONLY_COUNTRY ? ` (country=${ONLY_COUNTRY})` : ''}`);
  console.log(`  Periods: ${periods.map(p => p.id + (p.status === 'closed' ? ' [closed]' : '')).join(', ')}`);

  if (banks.length === 0 || periods.length === 0) {
    console.log('\n✅ Nothing to do.');
    return;
  }

  console.log();
  let succeeded = 0;
  let failed = 0;
  const stats = []; // { bank, period, sources, internal_sections, signals_in_period }
  const start = Date.now();

  for (const bank of banks) {
    for (const period of periods) {
      try {
        if (DRY_RUN) {
          process.stdout.write(`  ⊙ ${period.id} · ${bank.bank_name.padEnd(35)} (would generate)\n`);
          succeeded += 1;
          continue;
        }
        const pulse = generatePulseForBank(db, bank.key, period.id, { generated_by: 'bulk' });
        const m = pulse.metrics || {};
        const internalCount = m.sections_with_internal_data || 0;
        process.stdout.write(`  ✓ ${period.id} · ${bank.bank_name.padEnd(35)} ${m.total_source_records || 0} sources · ${internalCount} internal · ${m.total_signals_in_period || 0} signals\n`);
        stats.push({
          bank: bank.bank_name,
          period: period.id,
          sources: m.total_source_records || 0,
          internal: internalCount,
          signals: m.total_signals_in_period || 0,
        });
        succeeded += 1;
      } catch (err) {
        process.stdout.write(`  ✗ ${period.id} · ${bank.bank_name}: ${err.message}\n`);
        failed += 1;
      }
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log();
  console.log('═'.repeat(60));
  console.log(`  Generated: ${succeeded}   Failed: ${failed}   in ${elapsed}s`);
  console.log('═'.repeat(60));

  if (!DRY_RUN && stats.length > 0) {
    // Coverage rollup
    const noData = stats.filter(s => s.sources === 0).length;
    const withInternal = stats.filter(s => s.internal > 0).length;
    const totalSources = stats.reduce((sum, s) => sum + s.sources, 0);
    console.log();
    console.log(`  Coverage:`);
    console.log(`    Pulses with at least 1 source:  ${stats.length - noData}/${stats.length} (${Math.round((1 - noData / stats.length) * 100)}%)`);
    console.log(`    Pulses with internal-only data: ${withInternal}/${stats.length} (${Math.round((withInternal / stats.length) * 100)}%)`);
    console.log(`    Total source records:           ${totalSources}`);
    console.log(`    Avg sources per pulse:          ${(totalSources / stats.length).toFixed(1)}`);

    // Banks with weakest coverage (V0 will struggle on these — flag for follow-up)
    const weakest = stats.filter(s => s.sources <= 2).slice(0, 5);
    if (weakest.length > 0) {
      console.log();
      console.log(`  ⚠ Weak-coverage pulses (≤2 sources) — likely need data-collection follow-up:`);
      weakest.forEach(s => console.log(`    · ${s.period} · ${s.bank}: ${s.sources} sources, ${s.signals} signals`));
    }
  }
}

main().catch(err => {
  console.error('Bulk pulse generator error:', err);
  process.exit(1);
});
