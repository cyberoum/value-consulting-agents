/**
 * Next Best Action Engine
 *
 * Generates prioritized, contextual action recommendations for each bank
 * based on signals, qualification data, people, timing, and CX gaps.
 *
 * Each action includes: what to do, why (evidence), urgency, and type.
 */

import { BANK_DATA } from './banks';
import { QUAL_DATA } from './qualification';
import { CX_DATA } from './cx';
import { COMP_DATA } from './competition';
import { VALUE_SELLING } from './valueSelling';

const ACTION_TYPES = {
  CONTACT: { icon: '📞', label: 'Contact', color: '#3366FF' },
  RESEARCH: { icon: '🔍', label: 'Research', color: '#7C4DFF' },
  PREPARE: { icon: '📋', label: 'Prepare', color: '#E65100' },
  ENGAGE: { icon: '🤝', label: 'Engage', color: '#2E7D32' },
  RESPOND: { icon: '⚡', label: 'Respond', color: '#D32F2F' },
};

const URGENCY = {
  HIGH: { label: 'High', color: '#D32F2F', bg: '#FFEBEE' },
  MEDIUM: { label: 'Medium', color: '#F57F17', bg: '#FFF8E1' },
  LOW: { label: 'Low', color: '#2E7D32', bg: '#E8F5E9' },
};

/**
 * Generate Next Best Actions for a bank
 * Returns sorted array of actions with evidence
 */
export function getNextBestActions(bankKey) {
  const bd = BANK_DATA[bankKey];
  const qd = QUAL_DATA[bankKey];
  const cx = CX_DATA[bankKey];
  const comp = COMP_DATA[bankKey];
  const vs = VALUE_SELLING[bankKey];

  if (!bd) return [];

  const actions = [];
  const q = bd.backbase_qualification;

  // ─── Signal-based actions ───
  if (bd.signals?.length > 0) {
    bd.signals.forEach(sig => {
      const signal = sig.signal.toLowerCase();

      // Leadership change signals
      if (signal.includes('new') && (signal.includes('cto') || signal.includes('cio') || signal.includes('cpo') || signal.includes('head'))) {
        actions.push({
          type: ACTION_TYPES.CONTACT,
          urgency: URGENCY.HIGH,
          title: 'Engage new leadership within the first 90 days',
          detail: `New leaders are most open to vendor conversations in their first 90 days. ${sig.signal}`,
          evidence: sig.implication,
          score: 95,
        });
      }

      // Transformation/modernization signals
      if (signal.includes('transform') || signal.includes('moderniz') || signal.includes('platform') || signal.includes('migration')) {
        actions.push({
          type: ACTION_TYPES.PREPARE,
          urgency: URGENCY.HIGH,
          title: 'Prepare transformation alignment pitch',
          detail: `Their active transformation creates a natural entry point. Align Backbase value proposition to their initiative.`,
          evidence: sig.signal,
          score: 90,
        });
      }

      // Competitive threat signals
      if (signal.includes('neobank') || signal.includes('fintech') || signal.includes('competi')) {
        actions.push({
          type: ACTION_TYPES.PREPARE,
          urgency: URGENCY.MEDIUM,
          title: 'Build competitive response story',
          detail: `They face competitive pressure. Prepare a narrative showing how Backbase helps defend market share.`,
          evidence: sig.signal,
          score: 75,
        });
      }

      // Regulatory/compliance signals
      if (signal.includes('regulat') || signal.includes('compliance') || signal.includes('aml') || signal.includes('kyc')) {
        actions.push({
          type: ACTION_TYPES.PREPARE,
          urgency: URGENCY.MEDIUM,
          title: 'Position compliance as a value driver',
          detail: `Regulatory pressure creates urgency. Frame Backbase as enabling compliance-by-design, not just remediation.`,
          evidence: sig.signal,
          score: 70,
        });
      }
    });
  }

  // ─── People-based actions ───
  if (bd.key_decision_makers?.length > 0) {
    const targetKDMs = bd.key_decision_makers.filter(p =>
      p.note && (p.note.includes('🎯') || p.note.includes('CRITICAL') || p.note.includes('KEY'))
    );
    const linkedInKDMs = bd.key_decision_makers.filter(p => p.linkedin);
    const unconnectedKDMs = bd.key_decision_makers.filter(p => !p.linkedin && p.name && !p.name.startsWith('('));

    if (targetKDMs.length > 0) {
      const first = targetKDMs[0];
      actions.push({
        type: ACTION_TYPES.CONTACT,
        urgency: URGENCY.HIGH,
        title: `Prioritize outreach to ${first.name}`,
        detail: `${first.role} — flagged as key decision maker. ${first.note || ''}`,
        evidence: 'Power map analysis',
        score: 92,
      });
    }

    if (unconnectedKDMs.length > 2) {
      actions.push({
        type: ACTION_TYPES.RESEARCH,
        urgency: URGENCY.MEDIUM,
        title: `Research ${unconnectedKDMs.length} decision makers without LinkedIn profiles`,
        detail: `Validate current roles and find connection paths for: ${unconnectedKDMs.slice(0, 3).map(p => p.name).join(', ')}`,
        evidence: 'Incomplete power map',
        score: 60,
      });
    }

    if (linkedInKDMs.length > 0 && qd?.power_map?.activated) {
      actions.push({
        type: ACTION_TYPES.ENGAGE,
        urgency: URGENCY.MEDIUM,
        title: 'Leverage warm connections via partner network',
        detail: `Power map is activated with ${linkedInKDMs.length} profiled contacts. Check for shared connections via partner ecosystem.`,
        evidence: 'Activated power map',
        score: 65,
      });
    }
  }

  // ─── Qualification gap actions ───
  if (qd) {
    const dims = ['firmographics', 'technographics', 'decision_process', 'landing_zones', 'pain_push', 'power_map', 'partner_access'];
    dims.forEach(dim => {
      if (qd[dim] && qd[dim].score <= 5) {
        const labels = {
          technographics: 'Deepen tech stack understanding',
          decision_process: 'Map the buying process',
          power_map: 'Build the power map',
          partner_access: 'Identify partner connections',
        };
        if (labels[dim]) {
          actions.push({
            type: ACTION_TYPES.RESEARCH,
            urgency: qd[dim].score <= 3 ? URGENCY.HIGH : URGENCY.MEDIUM,
            title: labels[dim],
            detail: `${dim.replace(/_/g, ' ')} scored ${qd[dim].score}/10. ${qd[dim].note || 'Insufficient data.'}`,
            evidence: `Qualification: ${dim} = ${qd[dim].score}/10`,
            score: 55 + (6 - qd[dim].score) * 5,
          });
        }
      }
    });
  }

  // ─── CX-based actions ───
  if (cx) {
    const iosRating = parseFloat(cx.app_rating_ios);
    const androidRating = parseFloat(cx.app_rating_android);

    if (iosRating && iosRating < 3.5) {
      actions.push({
        type: ACTION_TYPES.PREPARE,
        urgency: URGENCY.MEDIUM,
        title: 'Use low app ratings as conversation opener',
        detail: `iOS rating is ${cx.app_rating_ios} — below the 3.5 average. Reference app store reviews to demonstrate CX gap.`,
        evidence: `iOS App Store: ${cx.app_rating_ios}`,
        score: 68,
      });
    }

    if (cx.cx_weaknesses?.length >= 3) {
      actions.push({
        type: ACTION_TYPES.PREPARE,
        urgency: URGENCY.LOW,
        title: `Document ${cx.cx_weaknesses.length} CX weaknesses for discovery`,
        detail: `Known CX gaps: ${cx.cx_weaknesses.slice(0, 3).join('; ')}. Use these as discovery question anchors.`,
        evidence: 'CX analysis',
        score: 55,
      });
    }
  }

  // ─── Competition-based actions ───
  if (comp) {
    if (comp.vendor_risk) {
      actions.push({
        type: ACTION_TYPES.RESPOND,
        urgency: URGENCY.MEDIUM,
        title: 'Prepare vendor displacement narrative',
        detail: `${comp.vendor_risk}. Build a compelling migration story with risk mitigation.`,
        evidence: `Current: ${comp.digital_platform || comp.core_banking || 'Unknown'}`,
        score: 72,
      });
    }
  }

  // ─── Value selling actions ───
  if (vs?.reference_customers?.length > 0) {
    const bestRef = vs.reference_customers[0];
    actions.push({
      type: ACTION_TYPES.PREPARE,
      urgency: URGENCY.LOW,
      title: `Prepare ${bestRef.name} reference story`,
      detail: `${bestRef.relevance}. Get permission to share this reference in conversations.`,
      evidence: `Reference: ${bestRef.name} (${bestRef.region})`,
      score: 50,
    });
  }

  // ─── Timing-based actions ───
  if (q?.timing) {
    const timing = q.timing.toLowerCase();
    if (timing.includes('now') || timing.includes('immediate') || timing.includes('q1') || timing.includes('2025') || timing.includes('2026')) {
      actions.push({
        type: ACTION_TYPES.ENGAGE,
        urgency: URGENCY.HIGH,
        title: 'Window is open — act now',
        detail: `Timing indicator: "${q.timing}". Budget cycles and decision windows are time-sensitive.`,
        evidence: `Timing: ${q.timing}`,
        score: 88,
      });
    }
  }

  // ─── Deal size actions ───
  if (q?.deal_size) {
    const dealStr = q.deal_size.toLowerCase();
    if (dealStr.includes('10m') || dealStr.includes('15m') || dealStr.includes('20m')) {
      actions.push({
        type: ACTION_TYPES.PREPARE,
        urgency: URGENCY.MEDIUM,
        title: 'Prepare enterprise-grade value case',
        detail: `Deal size ${q.deal_size} warrants a formal business case with ROI modeling and executive presentation.`,
        evidence: `Deal: ${q.deal_size}`,
        score: 73,
      });
    }
  }

  // Sort by score descending, deduplicate by title
  const seen = new Set();
  return actions
    .sort((a, b) => b.score - a.score)
    .filter(a => {
      if (seen.has(a.title)) return false;
      seen.add(a.title);
      return true;
    })
    .slice(0, 8); // Cap at 8 actions
}

export { ACTION_TYPES, URGENCY };
