/**
 * Pulse Diff Engine — Sprint 1 Days 8-9
 * ─────────────────────────────────────
 * Compares two pulse payloads (current + prior) and emits a per-section
 * `diff_vs_previous` string describing what changed.
 *
 * The diff is the structural answer to "what's new since last quarter?" It
 * replaces the V0 placeholder "(no prior pulse — first capture)" with real
 * deltas: count changes, score deltas, named additions, named removals.
 *
 * Scope: this is structural diff, not semantic narrative. We compare lists
 * by key (signal id, source_url, person id, action_point text), compute
 * adds/removes, and emit terse "+N urgent · −2 stakeholder · score 4.5→6.2"
 * style strings. Not LLM-generated prose.
 *
 * Why structural: the brief is explicit about anti-hallucination. Diffs that
 * say "deepening compliance pressure" are inferred narrative — diffs that
 * say "+2 regulatory signals (urgent), all naming Finansinspektionen" are
 * facts. We do the latter.
 */

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function listKey(item, ...keys) {
  // Build a stable key from the first non-empty field — used to match
  // items across snapshots. e.g., signals → source_url || title.
  for (const k of keys) {
    if (item?.[k]) return String(item[k]).trim().toLowerCase();
  }
  return '';
}

function diffLists(currentList, priorList, keyFn) {
  const current = currentList || [];
  const prior = priorList || [];
  const priorKeys = new Set(prior.map(keyFn).filter(Boolean));
  const currentKeys = new Set(current.map(keyFn).filter(Boolean));
  const added = current.filter(x => keyFn(x) && !priorKeys.has(keyFn(x)));
  const removed = prior.filter(x => keyFn(x) && !currentKeys.has(keyFn(x)));
  return { added, removed };
}

function pluralize(n, s, p = null) {
  return n === 1 ? s : (p || `${s}s`);
}

// ─────────────────────────────────────────────────────────────────
// Per-section diff functions
// ─────────────────────────────────────────────────────────────────

function diffStrategicPosture(cur, prev) {
  const c = cur.data || {};
  const p = prev.data || {};
  const dCount = (c.total_strategic_count || 0) - (p.total_strategic_count || 0);
  const dAcked = (c.acknowledged_count || 0) - (p.acknowledged_count || 0);

  const cTitles = (c.top_strategic_signals || []).map(s => listKey(s, 'source_url', 'title'));
  const pTitles = (p.top_strategic_signals || []).map(s => listKey(s, 'source_url', 'title'));
  const newSigs = (c.top_strategic_signals || []).filter(s =>
    !pTitles.includes(listKey(s, 'source_url', 'title'))
  );

  const parts = [];
  if (dCount !== 0) parts.push(`${dCount > 0 ? '+' : ''}${dCount} strategic ${pluralize(Math.abs(dCount), 'signal')}`);
  if (dAcked !== 0) parts.push(`${dAcked > 0 ? '+' : ''}${dAcked} ${pluralize(Math.abs(dAcked), 'acknowledgement')}`);
  if (newSigs.length > 0 && newSigs.length <= 2) {
    parts.push(`new top theme${newSigs.length > 1 ? 's' : ''}: ${newSigs.map(s => `"${(s.title || '').substring(0, 50)}"`).join(', ')}`);
  } else if (newSigs.length > 2) {
    parts.push(`${newSigs.length} new strategic themes surfaced`);
  }
  return parts.length === 0 ? 'No change since prior period.' : parts.join(' · ');
}

function diffQuarterlyExecution(cur, prev) {
  const c = cur.data || {};
  const p = prev.data || {};
  const dTouch = (c.total_touchpoints || 0) - (p.total_touchpoints || 0);
  const dWorked = (c.what_worked?.length || 0) - (p.what_worked?.length || 0);
  const dDidnt = (c.what_didnt?.length || 0) - (p.what_didnt?.length || 0);

  const parts = [];
  if (dTouch !== 0) parts.push(`${dTouch > 0 ? '+' : ''}${dTouch} ${pluralize(Math.abs(dTouch), 'touchpoint')}`);
  if (dWorked !== 0) parts.push(`${dWorked > 0 ? '+' : ''}${dWorked} positive ${pluralize(Math.abs(dWorked), 'outcome')}`);
  if (dDidnt !== 0) parts.push(`${dDidnt > 0 ? '+' : ''}${dDidnt} ${pluralize(Math.abs(dDidnt), 'blocker')} flagged`);
  return parts.length === 0 ? 'No change in execution activity.' : parts.join(' · ');
}

function diffMarketSignals(cur, prev) {
  const c = cur.data?.counts || {};
  const p = prev.data?.counts || {};
  const dTotal = (c.total || 0) - (p.total || 0);
  const dActionable = (c.actionable || 0) - (p.actionable || 0);
  const dUrgent = (c.urgent || 0) - (p.urgent || 0);

  // Named new news items (most actionable feature)
  const cNews = cur.data?.news || [];
  const pNews = prev.data?.news || [];
  const { added: newNews } = diffLists(cNews, pNews, n => listKey(n, 'source_url', 'title'));
  const newUrgent = newNews.filter(n => n.severity === 'urgent');

  const parts = [];
  if (dTotal !== 0) parts.push(`${dTotal > 0 ? '+' : ''}${dTotal} ${pluralize(Math.abs(dTotal), 'signal')}`);
  if (dActionable !== 0) parts.push(`${dActionable > 0 ? '+' : ''}${dActionable} actionable`);
  if (dUrgent !== 0) parts.push(`${dUrgent > 0 ? '+' : ''}${dUrgent} urgent`);
  if (newUrgent.length > 0 && newUrgent.length <= 2) {
    parts.push(`new urgent: ${newUrgent.map(n => `"${(n.title || '').substring(0, 50)}"`).join(', ')}`);
  }
  return parts.length === 0 ? 'No signal change since prior period.' : parts.join(' · ');
}

function diffEngagementTrend(cur, prev) {
  const c = cur.data || {};
  const p = prev.data || {};
  const dScore = ((c.score || 0) - (p.score || 0));
  const dirArrow = dScore > 0.5 ? '↑' : dScore < -0.5 ? '↓' : '→';

  const parts = [];
  parts.push(`Score ${(p.score || 0).toFixed(1)} ${dirArrow} ${(c.score || 0).toFixed(1)} (${dScore > 0 ? '+' : ''}${dScore.toFixed(1)})`);
  // Itemize component deltas if any moved
  const comps = ['meetings', 'persons', 'signals'];
  const compDeltas = comps
    .map(k => {
      const dC = ((c.components?.[k] || 0) - (p.components?.[k] || 0));
      return Math.abs(dC) >= 0.5 ? `${k}: ${dC > 0 ? '+' : ''}${dC.toFixed(1)}` : null;
    })
    .filter(Boolean);
  if (compDeltas.length > 0) parts.push(`drivers: ${compDeltas.join(', ')}`);
  return parts.join(' · ');
}

function diffDmuChanges(cur, prev) {
  const c = cur.data || {};
  const p = prev.data || {};
  const cAppt = c.appointments || [];
  const pAppt = p.appointments || [];
  const cDep = c.departures || [];
  const pDep = p.departures || [];
  const cReg = c.registrations || [];
  const pReg = p.registrations || [];

  const { added: newAppt } = diffLists(cAppt, pAppt, x => listKey(x, 'source_url', 'title'));
  const { added: newDep } = diffLists(cDep, pDep, x => listKey(x, 'source_url', 'title'));
  const { added: newReg } = diffLists(cReg, pReg, x => listKey(x, 'name'));

  const parts = [];
  if (newAppt.length > 0) parts.push(`+${newAppt.length} ${pluralize(newAppt.length, 'appointment')}`);
  if (newDep.length > 0) parts.push(`+${newDep.length} ${pluralize(newDep.length, 'departure')}`);
  if (newReg.length > 0) parts.push(`+${newReg.length} new ${pluralize(newReg.length, 'contact')}`);
  if (newAppt.length === 1) parts.push(`("${(newAppt[0].title || '').substring(0, 60)}")`);
  return parts.length === 0 ? 'No DMU changes since prior period.' : parts.join(' · ');
}

function diffBudgetCycles(cur, prev) {
  const cRfp = cur.data?.rfp_windows || [];
  const pRfp = prev.data?.rfp_windows || [];
  const cMan = cur.data?.mandate_windows || [];
  const pMan = prev.data?.mandate_windows || [];

  const { added: newRfp } = diffLists(cRfp, pRfp, x => listKey(x, 'source_url', 'title'));
  const { added: newMan } = diffLists(cMan, pMan, x => listKey(x, 'source_url', 'title'));

  const parts = [];
  if (newRfp.length > 0) parts.push(`+${newRfp.length} new RFP/procurement ${pluralize(newRfp.length, 'mention')}`);
  if (newMan.length > 0) parts.push(`+${newMan.length} new budget ${pluralize(newMan.length, 'signal')}`);
  return parts.length === 0 ? 'No new budget-cycle activity.' : parts.join(' · ');
}

function diffBlockersAsksActions(cur, prev) {
  const c = cur.data || {};
  const p = prev.data || {};
  const dBlock = (c.blockers?.length || 0) - (p.blockers?.length || 0);

  const cActions = c.top_3_actions || [];
  const pActions = p.top_3_actions || [];
  const { added: newActions } = diffLists(cActions, pActions, x => listKey(x, 'source', 'action'));

  const cAsks = c.top_3_asks || [];
  const pAsks = p.top_3_asks || [];
  const { added: newAsks } = diffLists(cAsks, pAsks, x => listKey(x, 'anchor_signal', 'ask'));

  const parts = [];
  if (dBlock !== 0) parts.push(`${dBlock > 0 ? '+' : ''}${dBlock} ${pluralize(Math.abs(dBlock), 'blocker')}`);
  if (newActions.length > 0) parts.push(`+${newActions.length} new validated ${pluralize(newActions.length, 'action')}`);
  if (newAsks.length > 0) parts.push(`+${newAsks.length} new open ${pluralize(newAsks.length, 'ask')}`);
  return parts.length === 0 ? 'No change in blockers / asks / actions.' : parts.join(' · ');
}

// ─────────────────────────────────────────────────────────────────
// Top-level: compute diffs for all sections
// ─────────────────────────────────────────────────────────────────

const DIFFERS = {
  strategic_posture:        diffStrategicPosture,
  quarterly_execution:      diffQuarterlyExecution,
  market_signals:           diffMarketSignals,
  engagement_trend:         diffEngagementTrend,
  dmu_changes:              diffDmuChanges,
  budget_cycles:            diffBudgetCycles,
  blockers_asks_actions:    diffBlockersAsksActions,
};

/**
 * Apply diffs against a prior pulse to a current pulse payload IN PLACE.
 * Mutates each section's `diff_vs_previous` field.
 *
 * @param {object} currentPulse - the pulse being generated (will be mutated)
 * @param {object} priorPulse - the prior period's pulse (read-only)
 * @param {object} priorMeta - { period_id } from the prior pulse
 */
export function applyDiffs(currentPulse, priorPulse, priorMeta = {}) {
  if (!priorPulse?.sections) {
    // No prior — leave the V0 stub strings alone
    return currentPulse;
  }
  const priorPeriod = priorMeta.period_id || priorPulse.period || 'prior period';
  for (const [sectionKey, differ] of Object.entries(DIFFERS)) {
    const cur = currentPulse.sections?.[sectionKey];
    const prev = priorPulse.sections?.[sectionKey];
    if (!cur || !prev) continue;
    try {
      const diffStr = differ(cur, prev);
      cur.diff_vs_previous = `vs ${priorPeriod}: ${diffStr}`;
    } catch (err) {
      cur.diff_vs_previous = `vs ${priorPeriod}: (diff failed: ${err.message})`;
    }
  }
  // Top-level metadata: roll up section diffs
  currentPulse.diff_summary = {
    prior_period: priorPeriod,
    prior_pulse_generated_at: priorPulse.generated_at,
  };
  return currentPulse;
}

/**
 * Find the immediately-prior closed pulse for an account, if one exists.
 *
 * @param {Database} db
 * @param {string} bankKey
 * @param {string} currentPeriodId - e.g., "2026-Q2"
 * @returns {object|null} { period_id, payload } or null
 */
export function findPriorPulse(db, bankKey, currentPeriodId) {
  // Find periods that ended before this period started
  const period = db.prepare('SELECT starts_at FROM review_periods WHERE id = ?').get(currentPeriodId);
  if (!period) return null;

  const priorPulseRow = db.prepare(`
    SELECT p.period_id, p.payload_json, p.generated_at
    FROM pulses p
    JOIN review_periods rp ON rp.id = p.period_id
    WHERE p.account_id = ? AND rp.ends_at < ?
    ORDER BY rp.ends_at DESC
    LIMIT 1
  `).get(bankKey, period.starts_at);
  if (!priorPulseRow) return null;
  return {
    period_id: priorPulseRow.period_id,
    generated_at: priorPulseRow.generated_at,
    payload: JSON.parse(priorPulseRow.payload_json),
  };
}
