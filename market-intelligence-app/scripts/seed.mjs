#!/usr/bin/env node
/**
 * Seed Script — Populate SQLite from static JS data files
 * Run: npm run seed (or node scripts/seed.mjs)
 */
import { getDb, closeDb } from './db.mjs';
import { extractAllEntities } from './lib/entityExtractor.mjs';
import { resolveAllPersonAliases } from './lib/entityResolver.mjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcData = join(__dirname, '..', 'src', 'data');

console.log('Loading static data files...');

const { BANK_DATA } = await import(join(srcData, 'banks.js'));
const { QUAL_DATA } = await import(join(srcData, 'qualification.js'));
const { CX_DATA } = await import(join(srcData, 'cx.js'));
const { COMP_DATA } = await import(join(srcData, 'competition.js'));
const { VALUE_SELLING } = await import(join(srcData, 'valueSelling.js'));
const { MARKETS_META, MARKET_DATA } = await import(join(srcData, 'markets.js'));
const { COUNTRY_DATA } = await import(join(srcData, 'countries.js'));
const { GROUP_RELATIONSHIPS } = await import(join(srcData, 'relationships.js'));
const { SOURCES } = await import(join(srcData, 'sources.js'));

const db = getDb();

const seed = db.transaction(() => {
  // Clear in reverse dependency order
  db.exec('DELETE FROM ai_analyses');
  db.exec('DELETE FROM meeting_packs');
  db.exec('DELETE FROM sources');
  db.exec('DELETE FROM persons');
  db.exec('DELETE FROM pain_points');
  db.exec('DELETE FROM landing_zones');
  db.exec('DELETE FROM relationships');
  db.exec('DELETE FROM value_selling');
  db.exec('DELETE FROM competition');
  db.exec('DELETE FROM cx');
  db.exec('DELETE FROM qualification');
  db.exec('DELETE FROM banks');
  db.exec('DELETE FROM countries');
  db.exec('DELETE FROM markets');

  // ── Markets ──
  const insertMarket = db.prepare(`
    INSERT INTO markets (key, name, countries, emoji, has_data, data)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  let marketCount = 0;
  for (const [key, meta] of Object.entries(MARKETS_META)) {
    const marketData = MARKET_DATA[key] || null;
    insertMarket.run(
      key,
      meta.name,
      JSON.stringify(meta.countries),
      meta.emoji || null,
      meta.hasData ? 1 : 0,
      marketData ? JSON.stringify(marketData) : null
    );
    marketCount++;
  }
  console.log(`  Markets: ${marketCount}`);

  // ── Countries ──
  const insertCountry = db.prepare(`
    INSERT INTO countries (name, market_key, data)
    VALUES (?, ?, ?)
  `);
  let countryCount = 0;
  for (const [name, data] of Object.entries(COUNTRY_DATA)) {
    const marketKey = Object.entries(MARKETS_META)
      .find(([, m]) => m.countries.includes(name))?.[0] || null;
    insertCountry.run(name, marketKey, JSON.stringify(data));
    countryCount++;
  }
  console.log(`  Countries: ${countryCount}`);

  // ── Banks ──
  const insertBank = db.prepare(`
    INSERT INTO banks (key, bank_name, country, tagline, data)
    VALUES (?, ?, ?, ?, ?)
  `);
  let bankCount = 0;
  for (const [key, d] of Object.entries(BANK_DATA)) {
    insertBank.run(
      key,
      d.bank_name,
      d.country,
      d.tagline || null,
      JSON.stringify(d)
    );
    bankCount++;
  }
  console.log(`  Banks: ${bankCount}`);

  // ── Qualification ──
  const insertQual = db.prepare(`
    INSERT INTO qualification (bank_key, data) VALUES (?, ?)
  `);
  let qualCount = 0;
  for (const [key, data] of Object.entries(QUAL_DATA)) {
    if (BANK_DATA[key]) {
      insertQual.run(key, JSON.stringify(data));
      qualCount++;
    }
  }
  console.log(`  Qualification: ${qualCount}`);

  // ── CX ──
  const insertCx = db.prepare(`
    INSERT INTO cx (bank_key, app_rating_ios, app_rating_android, digital_maturity, data)
    VALUES (?, ?, ?, ?, ?)
  `);
  let cxCount = 0;
  for (const [key, d] of Object.entries(CX_DATA)) {
    if (BANK_DATA[key]) {
      insertCx.run(
        key,
        d.app_rating_ios ?? null,
        d.app_rating_android ?? null,
        d.digital_maturity || null,
        JSON.stringify(d)
      );
      cxCount++;
    }
  }
  console.log(`  CX: ${cxCount}`);

  // ── Competition ──
  const insertComp = db.prepare(`
    INSERT INTO competition (bank_key, core_banking, digital_platform, data)
    VALUES (?, ?, ?, ?)
  `);
  let compCount = 0;
  for (const [key, d] of Object.entries(COMP_DATA)) {
    if (BANK_DATA[key]) {
      insertComp.run(
        key,
        d.core_banking || null,
        d.digital_platform || null,
        JSON.stringify(d)
      );
      compCount++;
    }
  }
  console.log(`  Competition: ${compCount}`);

  // ── Value Selling ──
  const insertVS = db.prepare(`
    INSERT INTO value_selling (bank_key, data) VALUES (?, ?)
  `);
  let vsCount = 0;
  for (const [key, data] of Object.entries(VALUE_SELLING)) {
    if (BANK_DATA[key]) {
      insertVS.run(key, JSON.stringify(data));
      vsCount++;
    }
  }
  console.log(`  Value Selling: ${vsCount}`);

  // ── Relationships ──
  const insertRel = db.prepare(`
    INSERT INTO relationships (bank_key, data) VALUES (?, ?)
  `);
  let relCount = 0;
  for (const [key, data] of Object.entries(GROUP_RELATIONSHIPS)) {
    if (BANK_DATA[key]) {
      insertRel.run(key, JSON.stringify(data));
      relCount++;
    }
  }
  console.log(`  Relationships: ${relCount}`);

  // ── Sources ──
  const insertSource = db.prepare(`
    INSERT INTO sources (ref_key, label, url, category) VALUES (?, ?, ?, ?)
  `);
  let sourceCount = 0;
  for (const [refKey, arr] of Object.entries(SOURCES)) {
    if (Array.isArray(arr)) {
      for (const s of arr) {
        insertSource.run(refKey, s.label, s.url || null, s.cat || null);
        sourceCount++;
      }
    }
  }
  console.log(`  Sources: ${sourceCount}`);

  // ── Entity Extraction (Layer 2) ──
  console.log('\n  Extracting entities...');
  let totalPersons = 0, totalPainPoints = 0, totalLandingZones = 0;
  for (const [key, bankData] of Object.entries(BANK_DATA)) {
    const vsData = VALUE_SELLING[key] || {};
    const counts = extractAllEntities(key, bankData, vsData);
    totalPersons += counts.persons;
    totalPainPoints += counts.painPoints;
    totalLandingZones += counts.landingZones;
  }
  console.log(`  Persons: ${totalPersons}`);
  console.log(`  Pain Points: ${totalPainPoints}`);
  console.log(`  Landing Zones: ${totalLandingZones}`);

  // ── Entity Resolution (Layer 2) ──
  const resolverResult = resolveAllPersonAliases();
  if (resolverResult.clustersFound > 0) {
    console.log(`  Alias Resolution: ${resolverResult.clustersFound} clusters, ${resolverResult.aliasesWritten} aliases`);
  }
});

console.log('\nSeeding database...');
seed();
closeDb();
console.log('\nDone! Database seeded at data/market-intelligence.db');
