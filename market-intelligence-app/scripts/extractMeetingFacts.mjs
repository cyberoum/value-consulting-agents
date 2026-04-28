#!/usr/bin/env node
/**
 * Meeting Fact Extraction CLI — Sprint 2.2
 * ────────────────────────────────────────
 * Runs the LLM-bounded fact extractor over every meeting in meeting_history
 * that doesn't yet have facts in meeting_facts. Use --force to re-extract.
 *
 * Why a CLI: the extractor is a library function that can also be invoked
 * inline (e.g. when a meeting is logged via the UI). This wrapper exists so
 * we can backfill historical meetings and re-run extraction across the
 * portfolio after prompt/guardrail tuning.
 *
 * Usage:
 *   node scripts/extractMeetingFacts.mjs                  # only un-extracted meetings
 *   node scripts/extractMeetingFacts.mjs --force          # re-extract all
 *   node scripts/extractMeetingFacts.mjs --bank=Nordea    # filter by bank substring
 *   node scripts/extractMeetingFacts.mjs --dry-run        # report only, no DB writes
 */

import dotenv from 'dotenv';
dotenv.config({ override: true, quiet: true });

import { getDb } from './db.mjs';
import { extractFactsFromMeeting, persistFacts } from './lib/meetingFactExtractor.mjs';

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const bankArg = args.find(a => a.startsWith('--bank='));
const BANK_FILTER = bankArg ? bankArg.split('=')[1] : null;

const db = getDb();

function loadMeetings() {
  let sql = `SELECT m.* FROM meeting_history m`;
  const where = [];
  const params = [];
  if (!FORCE) where.push(`NOT EXISTS (SELECT 1 FROM meeting_facts mf WHERE mf.meeting_id = m.id)`);
  if (BANK_FILTER) { where.push('m.bank_key LIKE ?'); params.push(`%${BANK_FILTER}%`); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY m.meeting_date DESC';
  return db.prepare(sql).all(...params);
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  Meeting Fact Extractor');
  console.log('═'.repeat(60));
  console.log(`  Mode:  ${DRY_RUN ? 'DRY-RUN' : 'WRITE'}   Force: ${FORCE}${BANK_FILTER ? `   Bank: ${BANK_FILTER}` : ''}`);

  const meetings = loadMeetings();
  console.log(`  Meetings to process: ${meetings.length}`);
  if (meetings.length === 0) { console.log('\n✅ Nothing to do.'); return; }

  console.log();
  let totalFacts = 0;
  let attributedFacts = 0;
  let droppedSpeakers = 0; // facts with named speaker we don't have a profile for
  const start = Date.now();

  for (const m of meetings) {
    const persons = db.prepare(
      `SELECT id, canonical_name, role, role_category FROM persons WHERE bank_key = ? ORDER BY influence_score DESC`
    ).all(m.bank_key);

    const facts = await extractFactsFromMeeting(m, persons);
    const attributed = facts.filter(f => f.speaker_person_id).length;
    const namedButUnresolved = facts.filter(f => f.speaker_name && !f.speaker_person_id).length;
    attributedFacts += attributed;
    droppedSpeakers += namedButUnresolved;
    totalFacts += facts.length;

    const banner = `${m.meeting_date} · ${m.bank_key.padEnd(28)} (${persons.length} persons on file)`;
    if (DRY_RUN) {
      process.stdout.write(`  ⊙ ${banner} → would extract ${facts.length} facts (${attributed} T1 / ${facts.length - attributed} T2)\n`);
    } else {
      persistFacts(db, m.id, facts);
      process.stdout.write(`  ✓ ${banner} → ${facts.length} facts (${attributed} T1 / ${facts.length - attributed} T2)\n`);
    }

    // Surface a sample fact for visual inspection
    if (facts[0]) {
      const f = facts[0];
      process.stdout.write(`     ↳ ${f.topic}/${f.sentiment}: "${f.position.slice(0, 90)}..."\n`);
      process.stdout.write(`     ↳ speaker: ${f.speaker_name || '(unattributed)'} ${f.speaker_person_id ? '[matched]' : '[no profile]'}\n`);
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log();
  console.log('═'.repeat(60));
  console.log(`  Total facts:           ${totalFacts}`);
  console.log(`  Attributed (T1):       ${attributedFacts} (${totalFacts > 0 ? Math.round(100 * attributedFacts / totalFacts) : 0}%)`);
  console.log(`  Named-but-unresolved:  ${droppedSpeakers}  (named stakeholders missing from persons table — surface as follow-up)`);
  console.log(`  Elapsed:               ${elapsed}s`);
  console.log('═'.repeat(60));

  // Topic distribution rollup (anti-hallucination sanity check)
  if (!DRY_RUN && totalFacts > 0) {
    const topicDist = db.prepare(`SELECT topic, COUNT(*) c FROM meeting_facts GROUP BY topic ORDER BY c DESC`).all();
    const sentimentDist = db.prepare(`SELECT sentiment, COUNT(*) c FROM meeting_facts GROUP BY sentiment ORDER BY c DESC`).all();
    console.log();
    console.log('  Topic distribution:');
    topicDist.forEach(r => console.log(`    ${r.topic.padEnd(12)} ${r.c}`));
    console.log('  Sentiment distribution:');
    sentimentDist.forEach(r => console.log(`    ${r.sentiment.padEnd(12)} ${r.c}`));
  }
}

main().catch(err => {
  console.error('Meeting fact extractor error:', err);
  process.exit(1);
});
