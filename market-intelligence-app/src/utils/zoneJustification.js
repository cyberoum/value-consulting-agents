/**
 * Zone Justification Utility
 *
 * Builds evidence trails for engagement zones by cross-referencing:
 *   - Storyline acts (keyPoints that mention the zone's topic)
 *   - Landing Zone Matrix cells (LOB/Journey matching the zone)
 *   - Meeting Prep dark zones (blind spots)
 *
 * Called as a useMemo in BankPage when storyline + matrix + meeting prep are all available.
 */

/**
 * Extract keywords from a zone name for fuzzy matching.
 */
function extractTopicWords(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'platform', 'portal', 'digital',
  'banking', 'backbase', 'solution', 'unified', 'modern', 'new',
]);

/**
 * Check if two sets of words have meaningful overlap.
 */
function hasOverlap(wordsA, wordsB) {
  if (wordsA.length === 0 || wordsB.length === 0) return false;
  const setB = new Set(wordsB);
  return wordsA.some(w => setB.has(w));
}

/**
 * Build evidence trails for each engagement zone.
 *
 * @param {Array} enrichedZones - Engagement zones (from matchZonesToLandingZones)
 * @param {Object|null} storylineData - Discovery storyline data (storyline.acts[])
 * @param {Object|null} lzData - Landing zone matrix data (matrix, plays)
 * @param {Object|null} meetingPrepBrief - Meeting prep brief (darkZones[])
 * @returns {Map<string, Object>} Map of zone name → { evidenceSources: [] }
 */
export function buildZoneJustifications(enrichedZones = [], storylineData = null, lzData = null, meetingPrepBrief = null) {
  const justifications = new Map();

  for (const ez of enrichedZones) {
    const zoneWords = extractTopicWords(ez.zone);
    const sources = [];

    // 1. Link to storyline acts
    const acts = storylineData?.storyline?.acts || storylineData?.acts || [];
    for (const act of acts) {
      const relevantPoints = (act.keyPoints || []).filter(kp =>
        hasOverlap(zoneWords, extractTopicWords(kp.point))
      );
      if (relevantPoints.length > 0) {
        sources.push({
          type: 'storyline',
          label: `${act.title}`,
          detail: relevantPoints[0].point.substring(0, 100),
        });
      }
    }

    // 2. Link to landing zone matrix cells
    if (lzData?.matrix) {
      const matrix = lzData.matrix;
      let bestCell = null;
      let bestScore = 0;
      for (const lob of ['retail', 'small_business', 'commercial', 'wealth']) {
        for (const journey of ['onboarding', 'servicing', 'lending', 'loan_origination', 'investing']) {
          const cell = matrix[lob]?.[journey];
          if (cell && cell.score > bestScore) {
            // Check if this cell's rationale relates to the zone
            const cellWords = extractTopicWords(cell.rationale || '');
            if (hasOverlap(zoneWords, cellWords) || cell.score >= 8) {
              bestCell = { lob, journey, ...cell };
              bestScore = cell.score;
            }
          }
        }
      }
      if (bestCell) {
        const lobLabel = { retail: 'Retail', small_business: 'SME', commercial: 'Commercial', wealth: 'Wealth' }[bestCell.lob] || bestCell.lob;
        const journeyLabel = { onboarding: 'Onboarding', servicing: 'Servicing', lending: 'Lending', loan_origination: 'Loan Orig.', investing: 'Investing' }[bestCell.journey] || bestCell.journey;
        sources.push({
          type: 'matrix',
          label: `${lobLabel} / ${journeyLabel}: ${bestCell.score}/10`,
          detail: (bestCell.rationale || '').substring(0, 100),
        });
      }
    }

    // 3. Link to meeting prep dark zones
    if (meetingPrepBrief?.darkZones) {
      for (const dz of meetingPrepBrief.darkZones) {
        if (hasOverlap(zoneWords, extractTopicWords(dz.zone))) {
          sources.push({
            type: 'dark_zone',
            label: `Blind spot: ${dz.zone}`,
            detail: (dz.insight || dz.provocation || '').substring(0, 100),
          });
          break; // One dark zone match is enough
        }
      }
    }

    justifications.set(ez.zone, { evidenceSources: sources });
  }

  return justifications;
}
