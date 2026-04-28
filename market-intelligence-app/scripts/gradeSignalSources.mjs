#!/usr/bin/env node
/**
 * Source Grader CLI — Sprint 3.1
 * ──────────────────────────────
 * Runs the rule-based source grader across every signal in deal_signals.
 *
 * Usage:
 *   node scripts/gradeSignalSources.mjs                # only ungraded
 *   node scripts/gradeSignalSources.mjs --force        # regrade all
 *   node scripts/gradeSignalSources.mjs --inspect      # show example signals per grade
 */

import dotenv from 'dotenv';
dotenv.config({ override: true, quiet: true });

import { getDb } from './db.mjs';
import { gradeAllSignals, getGradeBreakdown } from './lib/sourceGrader.mjs';

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const INSPECT = args.includes('--inspect');

const db = getDb();

console.log('═'.repeat(60));
console.log('  Source Grader');
console.log('═'.repeat(60));
console.log(`  Force: ${FORCE}`);

const result = gradeAllSignals(db, { force: FORCE });
console.log(`  Processed: ${result.processed}   Updated: ${result.updated}`);
console.log();
console.log('  Distribution this run:');
['A', 'B', 'C', 'D'].forEach(g => console.log(`    ${g}: ${result.by_grade[g] || 0}`));

console.log();
console.log('  Full DB breakdown (non-demo signals):');
const breakdown = getGradeBreakdown(db);
breakdown.forEach(r => console.log(`    ${r.grade || '(null)'}: ${r.count}`));

if (INSPECT) {
  console.log();
  console.log('  Example signals per grade:');
  for (const g of ['A', 'B', 'C', 'D']) {
    const examples = db.prepare(`
      SELECT publisher_name, substr(title, 1, 70) AS title
      FROM deal_signals
      WHERE source_grade = ? AND COALESCE(is_demo, 0) = 0
      ORDER BY detected_at DESC
      LIMIT 3
    `).all(g);
    console.log(`\n    Grade ${g} (${examples.length} samples):`);
    examples.forEach(e => console.log(`      [${e.publisher_name || '(no pub)'}] ${e.title}`));
  }
}

console.log();
console.log('═'.repeat(60));
