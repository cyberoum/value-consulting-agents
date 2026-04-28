/**
 * Pulse Generator — Sprint 1 (Strategic Repositioning)
 * ────────────────────────────────────────────────────
 * The flagship Nova capability. Generates a quarterly account pulse where
 * EVERY cell is source-cited, freshness-tagged, and diff-able against the
 * prior period's pulse.
 *
 * Critical design principle: structured composition, NOT free LLM generation.
 * This synthesizer reads from existing tables (signals, meeting_history,
 * persons, qualification, competition, entity_history) and assembles a
 * pulse as a deterministic transformation of facts → cells. The LLM is used
 * only for tight, source-anchored summarizations within each cell — never
 * to invent facts. If a section has no underlying facts, it shows
 * "Data gap — no signals in this period." Not invented prose.
 *
 * The pulse is internal AE intelligence: short, factual, dense, designed
 * for a 5-minute review. NOT prospect-facing narrative.
 *
 * 7 sections per pulse:
 *   1. strategic_posture          — one-paragraph synthesis of bank's strategic state
 *   2. quarterly_execution        — what we did / what worked / what didn't
 *   3. market_signals             — news, partner intel, regulatory/M&A grouped
 *   4. engagement_trend           — score + direction + drivers
 *   5. dmu_changes                — appointments / departures / role changes
 *   6. budget_cycles              — RFP timing, mandate windows
 *   7. blockers_asks_actions      — open blockers, top-3 asks, top-3 actions
 *
 * Each cell carries:
 *   - synthesis: short text (1-3 sentences max)
 *   - data: structured arrays/objects with the underlying facts
 *   - source_records[]: provenance trail (every claim → source URL/doc/date/confidence)
 *   - freshness: green | yellow | stale (based on age of newest source)
 *   - diff_vs_previous: string describing what changed since last pulse
 */

import { randomUUID } from 'node:crypto';
import { applyDiffs, findPriorPulse } from './pulseDiffer.mjs';
import { getBankDriftRollup } from './stakeholderDrift.mjs';
import { getPatternsForBank } from './crossReferenceEngine.mjs';

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

const FRESHNESS_GREEN_DAYS = 30;   // any source < 30d old → green
const FRESHNESS_YELLOW_DAYS = 90;  // 30-90d → yellow
                                   // > 90d → stale (or no sources)

function freshnessFor(sources) {
  if (!sources || sources.length === 0) return 'stale';
  const newest = sources.reduce((max, s) => {
    const d = s.source_date || s.date;
    if (!d) return max;
    const t = new Date(String(d).replace(' ', 'T') + (String(d).includes('T') ? '' : 'Z')).getTime();
    return isNaN(t) ? max : Math.max(max, t);
  }, 0);
  if (!newest) return 'stale';
  const ageDays = (Date.now() - newest) / 86400000;
  if (ageDays <= FRESHNESS_GREEN_DAYS) return 'green';
  if (ageDays <= FRESHNESS_YELLOW_DAYS) return 'yellow';
  return 'stale';
}

function sourceFromSignal(s) {
  return {
    source_url: s.source_url || null,
    source_type: s.source_type || 'news',
    source_date: s.detected_at || s.published_at || null,
    confidence_tier: s.is_demo ? 3 : (s.relevance_score >= 7 ? 1 : 2),
    verifier: s.acknowledged_at ? 'ae_confirmed' : 'auto',
    label: s.title?.substring(0, 100),
  };
}

function withinPeriod(dateStr, period) {
  if (!dateStr) return false;
  const t = new Date(String(dateStr).replace(' ', 'T') + (String(dateStr).includes('T') ? '' : 'Z')).getTime();
  if (isNaN(t)) return false;
  const start = new Date(period.starts_at + 'T00:00:00Z').getTime();
  const end = new Date(period.ends_at + 'T23:59:59Z').getTime();
  return t >= start && t <= end;
}

// ─────────────────────────────────────────────────────────────────────
// Data loaders
// ─────────────────────────────────────────────────────────────────────

function loadBank(db, bankKey) {
  const bank = db.prepare('SELECT * FROM banks WHERE key = ?').get(bankKey);
  if (!bank) return null;
  return { ...bank, data: bank.data ? JSON.parse(bank.data) : {} };
}

function loadAllSignalsForBank(db, bankKey, asOf = null) {
  // asOf: optional ISO date — filter to signals known/created at or before this
  // moment. Used when backfilling a closed period's pulse so it reflects what
  // was known THEN, not what we know now. This is what makes Q-over-Q diffs
  // honest: Q1's pulse can't be polluted by signals harvested in Q2.
  const params = [bankKey];
  let where = `deal_id = ? AND COALESCE(is_demo, 0) = 0`;
  if (asOf) {
    where += ` AND (detected_at IS NULL OR detected_at <= ?)`;
    params.push(asOf);
  }
  return db.prepare(`
    SELECT id, signal_category, signal_event, title, description, source_url,
           source_type, severity, detected_at, acknowledged_at, action_point,
           evidence_quote, mentioned_stakeholders, relevance_score,
           is_strategic_initiative, domain_tags, is_demo
    FROM deal_signals
    WHERE ${where}
    ORDER BY detected_at DESC
  `).all(...params);
}

function loadMeetingsForPeriod(db, bankKey, period) {
  // Schema (from db.mjs): id, bank_key, meeting_date, attendees, key_topics,
  // objections_raised, commitments_made, outcome, notes, source, meeting_type.
  // We map `notes` → summary semantically; `outcome` is a free field that can
  // include positive / negative qualitative assessment.
  const rows = db.prepare(`
    SELECT id, meeting_date, meeting_type, attendees, key_topics,
           objections_raised, commitments_made, outcome, notes, source
    FROM meeting_history
    WHERE bank_key = ?
      AND meeting_date >= ? AND meeting_date <= ?
    ORDER BY meeting_date DESC
  `).all(bankKey, period.starts_at, period.ends_at);
  return rows.map(m => ({ ...m, summary: m.notes, sentiment: null }));
}

function loadPersons(db, bankKey, asOf = null) {
  // asOf: filter to persons created at or before this moment. We don't have
  // person-history tracking for engagement_status changes, so engagement is
  // current state; this is a known V0 limitation, called out in the brief
  // as something the meeting-intelligence layer (Sprint 2) deepens.
  const params = [bankKey];
  let where = `bank_key = ?`;
  if (asOf) {
    where += ` AND (created_at IS NULL OR created_at <= ?)`;
    params.push(asOf);
  }
  return db.prepare(`
    SELECT id, canonical_name, role, role_category, lob, meddicc_roles,
           influence_score, engagement_status, support_status,
           created_at, updated_at, note, discovery_source
    FROM persons WHERE ${where}
    ORDER BY influence_score DESC NULLS LAST
  `).all(...params);
}

function loadEntityHistoryForPeriod(db, bankKey, period) {
  // entity_history table tracks per-field changes. We pull changes for
  // this bank's persons in this period — the source of "DMU changes."
  try {
    return db.prepare(`
      SELECT entity_type, entity_key, field_path, old_value, new_value, changed_at, source
      FROM entity_history
      WHERE entity_key = ? AND changed_at >= ? AND changed_at <= ?
      ORDER BY changed_at DESC
    `).all(bankKey, period.starts_at, period.ends_at);
  } catch {
    return [];
  }
}

function loadQualification(db, bankKey) {
  const row = db.prepare('SELECT data FROM qualification WHERE bank_key = ?').get(bankKey);
  return row ? JSON.parse(row.data || '{}') : {};
}

function loadCompetition(db, bankKey) {
  const row = db.prepare('SELECT data FROM competition WHERE bank_key = ?').get(bankKey);
  return row ? JSON.parse(row.data || '{}') : {};
}

/**
 * Load stakeholder-drift rollup, filtered by `asOf` so closed-period Pulses
 * never reference facts that didn't exist yet at period close.
 */
function loadDriftForPulse(db, bankKey, asOf) {
  const rollup = getBankDriftRollup(db, bankKey, { includeUnattributed: false });
  if (!asOf) return rollup;
  const cutoffISO = String(asOf).slice(0, 10);
  // Filter every bucket to cells whose last_seen ≤ cutoff. A cell's series
  // is also clipped — but keep it simple: drop the whole cell if its last
  // observation post-dates cutoff and the cell has no earlier observations.
  const clipCells = (cells) => cells
    .map(c => ({
      ...c,
      series: (c.series || []).filter(s => s.meeting_date <= cutoffISO),
    }))
    .filter(c => c.series.length > 0)
    .map(c => ({
      ...c,
      n_facts: c.series.length,
      first_seen: c.series[0].meeting_date,
      last_seen: c.series[c.series.length - 1].meeting_date,
    }));
  return {
    improving: clipCells(rollup.improving),
    deteriorating: clipCells(rollup.deteriorating),
    mixed: clipCells(rollup.mixed),
    new_positions: clipCells(rollup.new_positions),
    stable: clipCells(rollup.stable),
    counts: rollup.counts,
  };
}

/**
 * Load cross-reference patterns, filtered by `asOf`. Patterns whose either
 * fact_meeting_date OR signal_detected_at exceeds asOf are dropped — both
 * sides must have existed at the time of the snapshot.
 */
function loadPatternsForPulse(db, bankKey, asOf) {
  const patterns = getPatternsForBank(db, bankKey);
  if (!asOf) return patterns;
  const cutoff = String(asOf).slice(0, 10);
  return patterns.filter(p => {
    const factDate = String(p.fact_meeting_date || '').slice(0, 10);
    const sigDate = String(p.signal_detected_at || '').slice(0, 10);
    return (!factDate || factDate <= cutoff) && (!sigDate || sigDate <= cutoff);
  });
}

// ─────────────────────────────────────────────────────────────────────
// Section synthesizers — one per pulse section
// Each returns { synthesis, data, source_records, freshness, diff_vs_previous }
// ─────────────────────────────────────────────────────────────────────

function synthesizeStrategicPosture(ctx) {
  const { bank, signals, qualification } = ctx;
  const strategicSignals = signals.filter(s =>
    s.signal_category === 'strategic' && s.relevance_score >= 6
  ).slice(0, 5);
  const ackedStrategic = strategicSignals.filter(s => s.acknowledged_at);

  const sources = strategicSignals.map(sourceFromSignal);
  if (qualification?.firmographics?.note) {
    sources.push({
      source_url: null,
      source_type: 'qualification',
      source_date: bank.updated_at,
      confidence_tier: 1,
      verifier: 'ae_logged',
      label: 'Qualification note',
    });
  }

  const data = {
    bank_type: qualification?.firmographics?.note?.substring(0, 200) || bank.tagline || '',
    top_strategic_signals: strategicSignals.map(s => ({
      title: s.title,
      score: s.relevance_score,
      action_point: s.action_point,
      acknowledged: !!s.acknowledged_at,
      source_url: s.source_url,
    })),
    acknowledged_count: ackedStrategic.length,
    total_strategic_count: strategicSignals.length,
  };

  // Synthesis is template-driven, not LLM-generated. Each fragment maps to
  // a known fact source. If a fact is missing, we say so explicitly.
  const fragments = [];
  if (data.bank_type) fragments.push(data.bank_type);
  if (strategicSignals.length > 0) {
    const top = strategicSignals[0];
    fragments.push(`Most active strategic theme this period: "${top.title?.substring(0, 80)}" (score ${top.relevance_score?.toFixed?.(1)}).`);
  } else {
    fragments.push('No strategic-category signals scored ≥ 6 in this period.');
  }
  if (ackedStrategic.length > 0) {
    fragments.push(`${ackedStrategic.length} strategic signal${ackedStrategic.length === 1 ? ' has' : 's have'} been validated by the AE.`);
  }

  return {
    synthesis: fragments.join(' '),
    data,
    source_records: sources,
    freshness: freshnessFor(sources),
    diff_vs_previous: '(no prior pulse — first capture)',
  };
}

function synthesizeQuarterlyExecution(ctx) {
  const { meetings } = ctx;
  const inPeriod = meetings; // already filtered to period in loader

  const what_we_did = inPeriod.map(m => ({
    date: m.meeting_date,
    type: m.meeting_type || 'meeting',
    summary: m.summary?.substring(0, 200) || '(no summary)',
    attendees: m.attendees ? safeParseArray(m.attendees) : [],
  }));

  const what_worked = inPeriod
    .filter(m => /positive|strong|advance|win/i.test((m.outcome || '') + ' ' + (m.sentiment || '')))
    .map(m => ({ date: m.meeting_date, outcome: m.outcome }))
    .filter(x => x.outcome);

  const what_didnt = inPeriod
    .filter(m => /stall|block|push back|concern|hesit/i.test((m.outcome || '') + ' ' + (m.sentiment || '')))
    .map(m => ({ date: m.meeting_date, outcome: m.outcome }))
    .filter(x => x.outcome);

  const sources = inPeriod.map(m => ({
    source_url: null,
    source_type: 'meeting',
    source_date: m.meeting_date,
    confidence_tier: 1, // direct internal record
    verifier: 'ae_logged',
    label: `${m.meeting_type || 'meeting'} on ${m.meeting_date}`,
  }));

  let synthesis;
  if (inPeriod.length === 0) {
    synthesis = 'No internal meetings or AE-logged activity in this period. Engagement may be cold or activity is being logged elsewhere.';
  } else {
    synthesis = `${inPeriod.length} touchpoint${inPeriod.length === 1 ? '' : 's'} logged this period. ${what_worked.length} positive outcome${what_worked.length === 1 ? '' : 's'}, ${what_didnt.length} blocker/concern noted.`;
  }

  return {
    synthesis,
    data: { what_we_did, what_worked, what_didnt, total_touchpoints: inPeriod.length },
    source_records: sources,
    freshness: freshnessFor(sources),
    diff_vs_previous: '(no prior pulse — first capture)',
  };
}

function synthesizeMarketSignals(ctx) {
  const { signals, period } = ctx;
  const inPeriod = signals.filter(s => withinPeriod(s.detected_at, period));

  const news = inPeriod.filter(s =>
    s.signal_category === 'market' || s.signal_category === 'strategic'
  ).slice(0, 8);

  const regulatoryOrMA = inPeriod.filter(s =>
    s.signal_category === 'regulatory'
    || (s.signal_category === 'market' && /merger|acqui|m&a|takeover/i.test(s.title || ''))
  );

  const partnerIntel = inPeriod.filter(s =>
    s.signal_category === 'competitive'
    || s.source_type === 'linkedin' || s.source_type === 'manual'
  );

  const sources = inPeriod.slice(0, 20).map(sourceFromSignal);

  const totalActionable = inPeriod.filter(s => s.relevance_score >= 5).length;
  const topUrgent = inPeriod.filter(s => s.severity === 'urgent').length;

  const synthesis = inPeriod.length === 0
    ? 'No market signals harvested for this account in this period. Run Refresh to pull latest news + classify.'
    : `${inPeriod.length} signal${inPeriod.length === 1 ? '' : 's'} captured this period; ${totalActionable} actionable (score ≥ 5), ${topUrgent} flagged urgent. ${regulatoryOrMA.length} regulatory/M&A item${regulatoryOrMA.length === 1 ? '' : 's'}.`;

  return {
    synthesis,
    data: {
      news: news.map(s => ({ title: s.title, score: s.relevance_score, severity: s.severity, action_point: s.action_point, source_url: s.source_url })),
      partner_intel: partnerIntel.slice(0, 5).map(s => ({ title: s.title, source_type: s.source_type, source_url: s.source_url })),
      regulatory_or_ma: regulatoryOrMA.slice(0, 5).map(s => ({ title: s.title, severity: s.severity, source_url: s.source_url })),
      counts: { total: inPeriod.length, actionable: totalActionable, urgent: topUrgent },
    },
    source_records: sources,
    freshness: freshnessFor(sources),
    diff_vs_previous: '(no prior pulse — first capture)',
  };
}

function synthesizeEngagementTrend(ctx) {
  const { meetings, persons, signals, drift } = ctx;
  // Engagement score is a derived metric. We use a simple weighted formula
  // that we can evolve. The point is calibration is honest and components
  // are transparent.
  const meetingCount = meetings.length;
  const ackedSignals = signals.filter(s => s.acknowledged_at).length;
  const engagedPersons = persons.filter(p =>
    ['engaged', 'active', 'champion'].includes((p.engagement_status || '').toLowerCase())
  ).length;

  // Score 0-10. Each component caps so no single signal can max it.
  const meetingComponent = Math.min(meetingCount * 1.5, 4);
  const personsComponent = Math.min(engagedPersons * 1, 3);
  const signalsComponent = Math.min(ackedSignals * 0.5, 3);
  const score = Math.round((meetingComponent + personsComponent + signalsComponent) * 10) / 10;

  // Direction: we'd compare to last quarter's score if we had it. For V0
  // (no prior pulse), direction is reported as "baseline."
  const direction = 'baseline'; // 'rising' | 'flat' | 'falling' | 'baseline'

  const drivers = [];
  if (meetingCount > 0) drivers.push(`${meetingCount} meeting${meetingCount === 1 ? '' : 's'} this period (+${meetingComponent.toFixed(1)})`);
  if (engagedPersons > 0) drivers.push(`${engagedPersons} engaged stakeholder${engagedPersons === 1 ? '' : 's'} (+${personsComponent.toFixed(1)})`);
  if (ackedSignals > 0) drivers.push(`${ackedSignals} acknowledged signal${ackedSignals === 1 ? '' : 's'} (+${signalsComponent.toFixed(1)})`);
  if (drivers.length === 0) drivers.push('No engagement components present — score baseline 0.');

  // Sprint 2.5: stakeholder sentiment drift surfaces here. The "score" only
  // measures engagement *volume*; drift measures engagement *direction* per
  // topic — what positions are improving, deteriorating, mixed, new.
  // We summarize compactly and pass the structured cells through.
  const driftRollup = drift || { improving: [], deteriorating: [], mixed: [], new_positions: [], stable: [] };
  const driftLine = (() => {
    const parts = [];
    if (driftRollup.improving.length) parts.push(`${driftRollup.improving.length} improving`);
    if (driftRollup.deteriorating.length) parts.push(`${driftRollup.deteriorating.length} deteriorating`);
    if (driftRollup.mixed.length) parts.push(`${driftRollup.mixed.length} mixed`);
    if (driftRollup.new_positions.length) parts.push(`${driftRollup.new_positions.length} new position${driftRollup.new_positions.length === 1 ? '' : 's'}`);
    return parts.length ? `Stakeholder drift: ${parts.join(', ')}.` : '';
  })();

  // Drift adds to source_records as meeting-derived T1 facts (when attributed)
  const driftSources = [];
  ['improving', 'deteriorating', 'mixed', 'new_positions'].forEach(bucket => {
    (driftRollup[bucket] || []).forEach(c => {
      driftSources.push({
        source_type: 'meeting_fact',
        source_date: c.last_seen,
        confidence_tier: c.confidence_tier || 2,
        verifier: 'auto',
        label: `${c.speaker_name} on ${c.topic} → ${c.trend}${c.n_facts > 1 ? ` (${c.n_facts} mentions)` : ''}`,
      });
    });
  });

  const sources = [
    ...meetings.map(m => ({ source_type: 'meeting', source_date: m.meeting_date, confidence_tier: 1, verifier: 'ae_logged', label: `Meeting ${m.meeting_date}` })),
    ...persons.filter(p => engagedPersons && ['engaged', 'active', 'champion'].includes((p.engagement_status || '').toLowerCase()))
      .map(p => ({ source_type: 'persons_table', source_date: p.updated_at, confidence_tier: 2, verifier: 'ae_logged', label: `${p.canonical_name} (${p.engagement_status})` })),
    ...driftSources,
  ];

  return {
    synthesis: `Engagement score ${score}/10 (${direction}). ${drivers.join('; ')}.${driftLine ? ' ' + driftLine : ''}`,
    data: {
      score,
      direction,
      drivers,
      components: { meetings: meetingComponent, persons: personsComponent, signals: signalsComponent },
      // Structured drift payload — UI renders per-stakeholder drift cards from this.
      stakeholder_drift: {
        improving: driftRollup.improving,
        deteriorating: driftRollup.deteriorating,
        mixed: driftRollup.mixed,
        new_positions: driftRollup.new_positions,
        counts: driftRollup.counts || { total_cells: 0, stakeholders: 0 },
      },
    },
    source_records: sources,
    freshness: freshnessFor(sources),
    diff_vs_previous: '(no prior pulse — first capture)',
  };
}

function synthesizeDmuChanges(ctx) {
  const { signals, persons, period, patterns = [] } = ctx;
  const stakeholderSignals = signals.filter(s =>
    s.signal_category === 'stakeholder' && withinPeriod(s.detected_at, period)
  );

  // Detect appointments — require appointment-verb at the START of a clause
  // or near a role-keyword, not just any sentence containing "joins."
  // This prevents false positives like commentary articles by named execs.
  const appointmentRe = /\b(appointed|named as|nominated|joins as|hires?|hired|elected|takes over|takes? the role|becomes? (?:the )?(?:new |incoming )?(?:CEO|CTO|CIO|CDO|COO|CHRO|chair|head of|chief)|new (?:CEO|CTO|CIO|CDO|COO|CHRO|chair|head of|chief)|first (?:Head of|Chief))\b/i;
  const appointments = stakeholderSignals
    .filter(s => appointmentRe.test(s.title || ''))
    .map(s => ({ title: s.title, date: s.detected_at, source_url: s.source_url, mentioned: parseStakeholderArr(s.mentioned_stakeholders) }));

  const departureRe = /\b(resigns?|resigned|departs?|departed|steps? down|leaves|leaving|exits?|exited|retir(?:es|ed|ing)|to leave|out as)\b/i;
  const departures = stakeholderSignals
    .filter(s => departureRe.test(s.title || ''))
    .map(s => ({ title: s.title, date: s.detected_at, source_url: s.source_url, mentioned: parseStakeholderArr(s.mentioned_stakeholders) }));

  // "Registrations" = newly-added persons in our table during this period.
  // BUT: only count if the person was added by a real signal source — not by
  // initial DB seeding (`discovery_source = 'auto_profiler'` etc.). This
  // prevents reporting our seeding activity as bank hiring activity.
  const registrations = persons
    .filter(p => withinPeriod(p.created_at, period))
    .filter(p => {
      // Treat as a real bank-side hire only if there's an associated stakeholder
      // signal naming this person, OR the discovery_source indicates external
      // press / LinkedIn / news. Pure auto-profiler additions are noise.
      const isAuto = /seed|auto|profiler|legacy/i.test(p.discovery_source || '');
      if (isAuto) return false;
      const namedInSignal = stakeholderSignals.some(s =>
        parseStakeholderArr(s.mentioned_stakeholders).some(name =>
          name && p.canonical_name && name.toLowerCase().includes(p.canonical_name.toLowerCase().split(' ')[0])
        )
      );
      return namedInSignal;
    })
    .map(p => ({ name: p.canonical_name, role: p.role, lob: p.lob, created_at: p.created_at, discovery_source: p.discovery_source }));

  // Sprint 2.5: surface stakeholder/politics patterns from cross-reference engine.
  // These are corroborated DMU-relevant signals — e.g., a stakeholder said
  // something about politics/blockers/vendors and an external signal corroborates
  // or evolves it. We filter to politics-relevant topics + keep only medium+
  // confidence (low-conf is for the patterns panel, not the pulse).
  const dmuPatterns = patterns
    .filter(p => ['politics', 'blockers', 'vendors'].includes(p.topic))
    .filter(p => p.confidence !== 'low')
    .filter(p => withinPeriod(p.fact_meeting_date || p.detected_at, period))
    .slice(0, 6);

  const sources = [
    ...stakeholderSignals.map(sourceFromSignal),
    ...dmuPatterns.map(p => ({
      source_type: 'pattern_match',
      source_date: p.fact_meeting_date || p.detected_at,
      confidence_tier: p.confidence === 'high' ? 1 : 2,
      verifier: 'auto',
      label: `Pattern: ${p.fact_speaker_name || 'Stakeholder'} ${p.pattern_type} ${p.topic} (${p.confidence})`,
    })),
  ];

  const baseLine = (appointments.length + departures.length + registrations.length === 0)
    ? 'No DMU changes detected this period.'
    : `${appointments.length} appointment${appointments.length === 1 ? '' : 's'}, ${departures.length} departure${departures.length === 1 ? '' : 's'}, ${registrations.length} new contact${registrations.length === 1 ? '' : 's'} added.`;
  const patternLine = dmuPatterns.length
    ? ` ${dmuPatterns.length} corroborated stakeholder pattern${dmuPatterns.length === 1 ? '' : 's'} (politics/blockers/vendors).`
    : '';

  return {
    synthesis: baseLine + patternLine,
    data: {
      appointments,
      departures,
      registrations,
      stakeholder_signal_count: stakeholderSignals.length,
      // Compact pattern summaries with full provenance for UI rendering
      corroborated_patterns: dmuPatterns.map(p => ({
        id: p.id,
        type: p.pattern_type,
        topic: p.topic,
        confidence: p.confidence,
        gap_days: p.time_gap_days,
        summary: p.summary,
        speaker: p.fact_speaker_name,
        meeting_date: p.fact_meeting_date,
        signal_title: p.signal_title,
        signal_url: p.signal_source_url,
      })),
    },
    source_records: sources,
    freshness: freshnessFor(sources),
    diff_vs_previous: '(no prior pulse — first capture)',
  };
}

function synthesizeBudgetCycles(ctx) {
  const { signals, qualification, period } = ctx;
  // Look for RFP/RFI/budget/mandate keywords in signals + qualification
  const inPeriod = signals.filter(s => withinPeriod(s.detected_at, period));
  const rfpSignals = inPeriod.filter(s =>
    /RFP|RFI|tender|procurement|vendor selection|evaluation|mandate/i.test(`${s.title || ''} ${s.description || ''}`)
  );
  const budgetSignals = inPeriod.filter(s =>
    /budget|capex|opex|investment|spend|allocate|funding/i.test(`${s.title || ''} ${s.description || ''}`)
  );

  // qualification.decision_process often has timeline notes
  const decision = qualification?.decision_process || {};
  const decisionTimingNote = decision.note?.substring(0, 200) || '';

  const sources = [
    ...rfpSignals.map(sourceFromSignal),
    ...budgetSignals.slice(0, 3).map(sourceFromSignal),
  ];
  if (decisionTimingNote) {
    sources.push({
      source_type: 'qualification',
      source_date: null,
      confidence_tier: 2,
      verifier: 'ae_logged',
      label: 'Decision process notes',
    });
  }

  const synthesis = (rfpSignals.length + budgetSignals.length === 0 && !decisionTimingNote)
    ? 'No budget-cycle or RFP signals identified this period. Validate timing in next discovery.'
    : `${rfpSignals.length} RFP/procurement mention${rfpSignals.length === 1 ? '' : 's'}, ${budgetSignals.length} budget signal${budgetSignals.length === 1 ? '' : 's'}.${decisionTimingNote ? ' AE notes: ' + decisionTimingNote : ''}`;

  return {
    synthesis,
    data: {
      rfp_windows: rfpSignals.slice(0, 5).map(s => ({ title: s.title, date: s.detected_at, source_url: s.source_url })),
      mandate_windows: budgetSignals.slice(0, 5).map(s => ({ title: s.title, date: s.detected_at, source_url: s.source_url })),
      ae_notes: decisionTimingNote,
    },
    source_records: sources,
    freshness: freshnessFor(sources),
    diff_vs_previous: '(no prior pulse — first capture)',
  };
}

function synthesizeBlockersAsksActions(ctx) {
  const { qualification, signals, period } = ctx;
  const inPeriod = signals.filter(s => withinPeriod(s.detected_at, period));

  // Extract action points from acknowledged signals — those are validated AE actions
  const ackedActions = inPeriod
    .filter(s => s.acknowledged_at && s.action_point && !/^no action/i.test(s.action_point))
    .map(s => ({ action: s.action_point, source: s.title, source_url: s.source_url, score: s.relevance_score }));

  // Top 3 by relevance score
  const top_3_actions = ackedActions
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3);

  // Blockers from qualification.power_map.blockers if exists, plus any signal
  // tagged as a blocker via severity=urgent + category in (regulatory, competitive)
  const powerMap = qualification?.power_map || {};
  const explicitBlockers = (powerMap.blockers || []).map(b =>
    typeof b === 'string' ? { description: b, source: 'AE-logged power map' } : b
  );
  const inferredBlockers = inPeriod
    .filter(s => s.severity === 'urgent' && (s.signal_category === 'regulatory' || s.signal_category === 'competitive'))
    .slice(0, 3)
    .map(s => ({ description: s.title, source: s.source_url || 'signal', date: s.detected_at }));
  const blockers = [...explicitBlockers, ...inferredBlockers];

  // Top 3 asks: derive from urgent unacknowledged signals — these are open
  // questions/decisions the AE needs from the bank
  const top_3_asks = inPeriod
    .filter(s => !s.acknowledged_at && s.severity === 'urgent' && s.action_point)
    .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
    .slice(0, 3)
    .map(s => ({ ask: s.action_point, anchor_signal: s.title, source_url: s.source_url }));

  const sources = [
    ...ackedActions.slice(0, 3).map(a => ({ source_type: 'signal', source_url: a.source_url, confidence_tier: 1, verifier: 'ae_confirmed', label: a.source })),
    ...inferredBlockers.map(b => ({ source_type: 'signal', source_url: b.source, source_date: b.date, confidence_tier: 2, verifier: 'auto', label: b.description })),
  ];

  const synthesis = `${blockers.length} blocker${blockers.length === 1 ? '' : 's'}, ${top_3_asks.length} open ask${top_3_asks.length === 1 ? '' : 's'}, ${top_3_actions.length} action${top_3_actions.length === 1 ? '' : 's'} validated by AE this period.`;

  return {
    synthesis,
    data: { blockers, top_3_asks, top_3_actions },
    source_records: sources,
    freshness: freshnessFor(sources),
    diff_vs_previous: '(no prior pulse — first capture)',
  };
}

// ─────────────────────────────────────────────────────────────────────
// Top-level: generate a complete pulse for a bank for a period
// ─────────────────────────────────────────────────────────────────────

/**
 * Generate (or regenerate) a pulse for one account+period.
 * Idempotent on (account_id, period_id) — re-running replaces the row.
 *
 * @param {Database} db - better-sqlite3 instance
 * @param {string} bankKey - e.g., 'Nordea_Sweden'
 * @param {string} periodId - e.g., '2026-Q2'
 * @param {object} options - { generated_by }
 * @returns {object} pulse object (with id + payload)
 */
export function generatePulseForBank(db, bankKey, periodId, options = {}) {
  const { generated_by = 'auto', asOf = null } = options;

  const period = db.prepare('SELECT * FROM review_periods WHERE id = ?').get(periodId);
  if (!period) throw new Error(`Period not found: ${periodId}`);

  const bank = loadBank(db, bankKey);
  if (!bank) throw new Error(`Bank not found: ${bankKey}`);

  // For closed periods, default `asOf` to period.ends_at so the snapshot is
  // historically honest — Q1's pulse only contains signals known by Mar 31,
  // not signals harvested in April. For active periods, asOf=null (current).
  const effectiveAsOf = asOf || (period.status === 'closed' ? period.ends_at + 'T23:59:59Z' : null);

  // Single context object passed to every section synthesizer
  const ctx = {
    bank,
    period,
    asOf: effectiveAsOf,
    signals: loadAllSignalsForBank(db, bankKey, effectiveAsOf),
    meetings: loadMeetingsForPeriod(db, bankKey, period),
    persons: loadPersons(db, bankKey, effectiveAsOf),
    history: loadEntityHistoryForPeriod(db, bankKey, period),
    qualification: loadQualification(db, bankKey),
    competition: loadCompetition(db, bankKey),
    // Sprint 2.5 additions: meeting intelligence layer surfaces.
    // Both are filtered by asOf so closed-period pulses stay historically honest
    // (a Q1 pulse never references facts/patterns dated after Mar 31).
    drift: loadDriftForPulse(db, bankKey, effectiveAsOf),
    patterns: loadPatternsForPulse(db, bankKey, effectiveAsOf),
  };

  const sections = {
    strategic_posture:        synthesizeStrategicPosture(ctx),
    quarterly_execution:      synthesizeQuarterlyExecution(ctx),
    market_signals:           synthesizeMarketSignals(ctx),
    engagement_trend:         synthesizeEngagementTrend(ctx),
    dmu_changes:              synthesizeDmuChanges(ctx),
    budget_cycles:            synthesizeBudgetCycles(ctx),
    blockers_asks_actions:    synthesizeBlockersAsksActions(ctx),
  };

  // Overall freshness = worst section freshness
  const freshnessLevels = Object.values(sections).map(s => s.freshness);
  const worstFreshness = freshnessLevels.includes('stale') ? 'stale'
    : freshnessLevels.includes('yellow') ? 'yellow' : 'green';

  // Cell-count metrics for benchmark dashboard
  const totalSourceRecords = Object.values(sections)
    .reduce((sum, s) => sum + (s.source_records?.length || 0), 0);
  const internalDataCells = ['quarterly_execution', 'engagement_trend', 'blockers_asks_actions']
    .filter(k => sections[k].source_records.some(r => ['meeting', 'persons_table', 'qualification', 'ae_logged'].includes(r.source_type) || r.verifier === 'ae_logged'))
    .length;

  const payload = {
    account: bankKey,
    bank_name: bank.bank_name,
    period: periodId,
    period_starts_at: period.starts_at,
    period_ends_at: period.ends_at,
    generated_at: new Date().toISOString(),
    freshness: { overall: worstFreshness, stalest_section: freshnessLevels.indexOf('stale') >= 0 ? Object.keys(sections)[freshnessLevels.indexOf('stale')] : null },
    metrics: {
      total_source_records: totalSourceRecords,
      sections_with_internal_data: internalDataCells,
      total_signals_in_period: ctx.signals.filter(s => withinPeriod(s.detected_at, period)).length,
    },
    sections,
    ae_overrides: [],
  };

  // Sprint 1 Days 8-9: apply Q-over-Q diffs against the immediately-prior
  // closed pulse, if one exists. Replaces the V0 stub "(no prior pulse — first
  // capture)" with real per-section deltas like "+3 strategic signals,
  // engagement 1.5 ↑ 4.5 (+3.0), 1 new appointment."
  const prior = findPriorPulse(db, bankKey, periodId);
  if (prior) {
    applyDiffs(payload, prior.payload, { period_id: prior.period_id });
  }

  // Upsert the pulse row
  const existing = db.prepare('SELECT id FROM pulses WHERE account_id = ? AND period_id = ?').get(bankKey, periodId);
  let pulseId;
  if (existing) {
    pulseId = existing.id;
    db.prepare(`UPDATE pulses SET payload_json = ?, generated_at = datetime('now'), generated_by = ? WHERE id = ?`)
      .run(JSON.stringify(payload), generated_by, pulseId);
  } else {
    pulseId = randomUUID();
    db.prepare(`INSERT INTO pulses (id, account_id, period_id, payload_json, generated_by) VALUES (?, ?, ?, ?, ?)`)
      .run(pulseId, bankKey, periodId, JSON.stringify(payload), generated_by);
  }

  return { id: pulseId, ...payload };
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function safeParseArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; }
}

function parseStakeholderArr(raw) {
  const arr = safeParseArray(raw);
  return arr.map(item => typeof item === 'string' ? item : (item?.name || ''));
}
