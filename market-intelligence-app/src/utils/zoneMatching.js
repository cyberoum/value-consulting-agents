/**
 * Zone Matching Utility
 *
 * Two main exports:
 *   1. scoreBankMatrix(bankData) — Evidence-based 4×5 matrix scoring using ALL bank intelligence
 *   2. matchZonesToLandingZones() — Matches engagement zones to landing zones for visual linking
 */

// Keywords to strip when normalizing zone names (noise words)
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'platform', 'portal', 'digital', 'engagement',
  'banking', 'backbase', 'journeys', 'solution', 'unified', 'modern', 'new',
]);

/**
 * Normalize a zone name into a set of meaningful keywords for matching.
 */
function extractKeywords(zoneName) {
  return (zoneName || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')   // strip punctuation
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Calculate match score between two sets of keywords (Jaccard-like).
 * Returns 0-1 where 1 = perfect overlap.
 */
function keywordOverlap(kwA, kwB) {
  if (kwA.length === 0 || kwB.length === 0) return 0;
  const setB = new Set(kwB);
  const matches = kwA.filter(w => setB.has(w)).length;
  const union = new Set([...kwA, ...kwB]).size;
  return union > 0 ? matches / union : 0;
}

// ═══════════════════════════════════════════════════
// EVIDENCE-BASED MATRIX SCORING
// ═══════════════════════════════════════════════════

const LOBS = ['retail', 'small_business', 'commercial', 'wealth'];
const JOURNEYS = ['onboarding', 'servicing', 'lending', 'loan_origination', 'investing'];

// Extended keyword vocabularies — much richer than the original LOB_KW/JOURNEY_KW
const LOB_VOCAB = {
  retail: ['retail', 'consumer', 'personal', 'b2c', 'mobile banking', 'individual',
           'mass market', 'digital banking', 'neobank', 'challenger bank', 'fintech'],
  small_business: ['sme', 'small business', 'business banking', 'msme', 'mid-market',
                   'micro enterprise', 'smb', 'small and medium', 'business portal',
                   'business customer', 'merchant', 'invoic'],
  commercial: ['commercial', 'corporate', 'trade finance', 'treasury', 'cash management',
               'fx', 'transaction banking', 'large corporate', 'global transaction',
               'correspondent', 'supply chain financ'],
  wealth: ['wealth', 'private banking', 'advisory', 'hnw', 'high net worth', 'affluent',
           'asset management', 'portfolio', 'wealth management', 'private bank',
           'family office', 'discretionary'],
};

const JOURNEY_VOCAB = {
  onboarding: ['onboarding', 'kyc', 'aml', 'account opening', 'enrollment',
               'identity verification', 'customer acquisition', 'signup', 'registration',
               'new customer', 'due diligence', 'know your customer', 'compliance check',
               'digital onboarding', 'customer onboarding'],
  servicing: ['servicing', 'self-service', 'engagement', 'portal', 'platform',
              'mobile app', 'notification', 'personalization', 'assist', 'employee',
              'rm tool', 'relationship manager', 'contact center', 'branch', 'channel',
              'unified', 'cross-sell', 'upsell', 'customer experience', 'daily banking',
              'account management', 'digital experience', 'user experience',
              'financial insight', 'personal finance', 'next best action'],
  lending: ['lending', 'credit', 'mortgage', 'loan', 'financing', 'underwriting',
            'credit risk', 'debt', 'borrowing', 'credit line', 'overdraft',
            'interest rate', 'collateral', 'credit score', 'risk assessment'],
  loan_origination: ['loan origination', 'credit origination', 'mortgage origination',
                     'application process', 'loan application', 'origination journey',
                     'digital lending', 'credit decisioning', 'loan processing',
                     'application workflow', 'approval process', 'credit application'],
  investing: ['investing', 'investment', 'brokerage', 'securities', 'trading', 'funds',
              'robo-advisor', 'robo advisory', 'savings product', 'pension', 'retirement',
              'stock', 'etf', 'mutual fund', 'wealth advisory', 'asset allocation',
              'portfolio management', 'discretionary management'],
};

/**
 * Check if text contains any keywords for a given LOB.
 * Returns true/false.
 */
function textMatchesLob(text, lob) {
  const lower = text.toLowerCase();
  return LOB_VOCAB[lob].some(kw => lower.includes(kw));
}

/**
 * Check if text contains any keywords for a given journey.
 * Returns true/false.
 */
function textMatchesJourney(text, journey) {
  const lower = text.toLowerCase();
  return JOURNEY_VOCAB[journey].some(kw => lower.includes(kw));
}

/**
 * Score the full 4×5 Landing Zone Matrix from ALL available bank intelligence.
 *
 * Uses a point-accumulation system: each evidence source (landing zones, pain points,
 * engagement zones, signals, strategy text) adds points to matching cells.
 * Points are then normalized to a 0-10 score.
 *
 * Explicitly EXCLUDES: reference_customers, product_mapping
 *
 * @param {Object} bankData - Full bank data object from the banks table
 * @returns {Object} matrix keyed by lob → journey → {score, rationale, evidence[], play, currentState}
 */
export function scoreBankMatrix(bankData = {}) {
  // Initialize accumulator: lob → journey → { points, evidence[] }
  const acc = {};
  for (const lob of LOBS) {
    acc[lob] = {};
    for (const j of JOURNEYS) {
      acc[lob][j] = { points: 0, evidence: [] };
    }
  }

  // Helper: add points to matching cells for a piece of evidence.
  // Handles 3 cases:
  //   1. LOB + Journey → direct score to that cell
  //   2. LOB only → small spillover to servicing
  //   3. Journey only → distribute across ALL LOBs at reduced weight
  function scoreEvidence(text, basePoints, source, title) {
    if (!text) return;
    const matchedLobs = LOBS.filter(lob => textMatchesLob(text, lob));
    const matchedJourneys = JOURNEYS.filter(j => textMatchesJourney(text, j));

    if (matchedLobs.length > 0 && matchedJourneys.length > 0) {
      // Case 1: Both LOB and journey matched → direct score
      for (const lob of matchedLobs) {
        for (const journey of matchedJourneys) {
          acc[lob][journey].points += basePoints;
          acc[lob][journey].evidence.push({ source, title });
        }
      }
    } else if (matchedLobs.length > 0) {
      // Case 2: LOB matched but no journey → small spillover to servicing
      for (const lob of matchedLobs) {
        acc[lob].servicing.points += basePoints * 0.15;
        acc[lob].servicing.evidence.push({ source, title });
      }
    } else if (matchedJourneys.length > 0) {
      // Case 3: Journey matched but no LOB → applies to ALL LOBs (cross-LOB evidence)
      // e.g., "Onboarding Complexity" with KYC/AML keywords affects all LOBs
      for (const lob of LOBS) {
        for (const journey of matchedJourneys) {
          acc[lob][journey].points += basePoints * 0.4;
          acc[lob][journey].evidence.push({ source, title });
        }
      }
    }
    // Case 4: No match at all → skip
  }

  // Helper: for weaker signals (strategy text, signals), spread more broadly
  function scoreEvidenceSpread(text, basePoints, source, title) {
    if (!text) return;
    const matchedLobs = LOBS.filter(lob => textMatchesLob(text, lob));
    const matchedJourneys = JOURNEYS.filter(j => textMatchesJourney(text, j));

    if (matchedLobs.length > 0 && matchedJourneys.length > 0) {
      for (const lob of matchedLobs) {
        for (const journey of matchedJourneys) {
          acc[lob][journey].points += basePoints;
          acc[lob][journey].evidence.push({ source, title });
        }
      }
    } else if (matchedLobs.length > 0) {
      // Spread thin across all journeys (general LOB priority signal)
      for (const lob of matchedLobs) {
        for (const journey of JOURNEYS) {
          acc[lob][journey].points += basePoints * 0.08;
        }
        acc[lob].servicing.evidence.push({ source, title });
      }
    } else if (matchedJourneys.length > 0) {
      // Journey-only signal → spread across all LOBs at reduced weight
      for (const lob of LOBS) {
        for (const journey of matchedJourneys) {
          acc[lob][journey].points += basePoints * 0.25;
        }
      }
    }
  }

  // ── Source 1: Landing Zones (strongest signal) ──
  // Weight: fit_score * 0.3 (~2.1 - 2.7 points per zone)
  for (const lz of bankData.backbase_landing_zones || []) {
    const text = [lz.zone, lz.rationale, lz.entry_strategy].filter(Boolean).join(' ');
    scoreEvidence(text, (lz.fit_score || 7) * 0.3, 'landing_zone', lz.zone);
  }

  // ── Source 2: Pain Points (strong signal — gaps = opportunity) ──
  // Weight: 2.0 points per match
  for (const pp of bankData.pain_points || []) {
    const text = [pp.title, pp.detail].filter(Boolean).join(' ');
    scoreEvidence(text, 2.0, 'pain_point', pp.title);
  }

  // ── Source 3: Engagement Banking Zones (strong signal — pre-identified targets) ──
  // Weight: HIGH priority = 2.5, MEDIUM = 1.5
  const engZones = bankData.backbase_qualification?.engagement_banking_zones || [];
  for (const ez of engZones) {
    const text = [ez.zone, ez.detail].filter(Boolean).join(' ');
    const points = (ez.priority || '').toUpperCase() === 'HIGH' ? 2.5 : 1.5;
    scoreEvidence(text, points, 'engagement_zone', ez.zone);
  }

  // ── Source 4: Signals (moderate signal — readiness/budget indicators) ──
  // Weight: 1.0 points per match
  for (const sig of bankData.signals || []) {
    const text = [sig.signal, sig.implication].filter(Boolean).join(' ');
    scoreEvidenceSpread(text, 1.0, 'signal', sig.signal?.substring(0, 60));
  }

  // ── Source 5: AI Opportunities (moderate signal) ──
  // Weight: 1.5 points per match
  const aiOpps = bankData.backbase_qualification?.ai_opportunities || [];
  for (const opp of aiOpps) {
    const text = [opp.zone, opp.detail].filter(Boolean).join(' ');
    scoreEvidence(text, 1.5, 'ai_opportunity', opp.zone);
  }

  // ── Source 6: Strategy text fields (weak signal — general direction) ──
  // Weight: 0.5 per LOB/journey hit
  const stratFields = [
    { key: 'digital_strategy', label: 'Digital Strategy' },
    { key: 'strategic_initiatives', label: 'Strategic Initiatives' },
    { key: 'customer_sentiment', label: 'Customer Sentiment' },
  ];
  for (const { key, label } of stratFields) {
    if (typeof bankData[key] === 'string' && bankData[key].length > 10) {
      scoreEvidenceSpread(bankData[key], 0.5, 'strategy', label);
    }
  }

  // ── Source 7: Competitive position (weakest signal) ──
  if (typeof bankData.competitive_position === 'string' && bankData.competitive_position.length > 10) {
    scoreEvidenceSpread(bankData.competitive_position, 0.3, 'competitive', 'Competitive Position');
  }

  // ── Normalize to 0-10 ──
  // Scale factor calibrated so: landing zone (2.7) + pain point (2.0) + engagement zone (2.5) ≈ 9-10
  const SCALE = 1.3;
  const matrix = {};
  for (const lob of LOBS) {
    matrix[lob] = {};
    for (const j of JOURNEYS) {
      const raw = acc[lob][j];
      const score = Math.min(10, Math.round(raw.points * SCALE));
      // Deduplicate evidence (same title from same source)
      const seen = new Set();
      const uniqueEvidence = raw.evidence.filter(e => {
        const k = `${e.source}:${e.title}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      // Build rationale from evidence
      const rationale = uniqueEvidence.length > 0
        ? uniqueEvidence.slice(0, 3).map(e => e.title).join('; ')
        : '';

      matrix[lob][j] = {
        score,
        rationale,
        evidence: uniqueEvidence.slice(0, 5),
        play: null,
        currentState: '',
      };
    }
  }

  return matrix;
}

// ── Legacy fallback (kept for backward compatibility) ──
const LOB_KW = {
  retail: ['retail', 'consumer', 'personal', 'b2c', 'digital banking'],
  small_business: ['sme', 'small business', 'business banking', 'msme'],
  commercial: ['commercial', 'corporate', 'trade finance', 'treasury'],
  wealth: ['wealth', 'private banking', 'advisory', 'hnw', 'portfolio'],
};
const JOURNEY_KW = {
  onboarding: ['onboarding', 'kyc', 'account opening', 'origination'],
  servicing: ['servicing', 'self-service', 'engagement', 'assist', 'employee', 'portal', 'platform'],
  lending: ['lending', 'credit', 'mortgage', 'loan'],
  loan_origination: ['loan origination', 'credit origination', 'origination journey'],
  investing: ['investing', 'investment', 'brokerage', 'securities'],
};

/** @deprecated Use scoreBankMatrix(bankData) instead */
export function mapFlatZonesToMatrix(landingZones = []) {
  const matrix = {};
  for (const lob of LOBS) {
    matrix[lob] = {};
    for (const j of JOURNEYS) {
      matrix[lob][j] = { score: 0, rationale: '', evidence: [], play: null, currentState: '' };
    }
  }

  for (const lz of landingZones) {
    const name = lz.zone.toLowerCase();
    let bestLob = 'retail';
    let bestLobScore = 0;
    for (const [lob, keywords] of Object.entries(LOB_KW)) {
      const score = keywords.filter(kw => name.includes(kw)).length;
      if (score > bestLobScore) { bestLobScore = score; bestLob = lob; }
    }
    let bestJourney = 'servicing';
    let bestJourneyScore = 0;
    for (const [journey, keywords] of Object.entries(JOURNEY_KW)) {
      const score = keywords.filter(kw => name.includes(kw)).length;
      if (score > bestJourneyScore) { bestJourneyScore = score; bestJourney = journey; }
    }
    if (lz.fit_score > matrix[bestLob][bestJourney].score) {
      matrix[bestLob][bestJourney] = {
        score: lz.fit_score,
        rationale: lz.rationale || '',
        evidence: [{ source: 'existing_data', title: lz.zone }],
        play: null,
        currentState: lz.entry_strategy || '',
      };
    }
  }

  return matrix;
}

export function matchZonesToLandingZones(engagementZones = [], landingZones = []) {
  if (!engagementZones.length || !landingZones.length) {
    return engagementZones.map(ez => ({ ...ez, matchedLandingZones: [] }));
  }

  // Pre-compute keywords for all landing zones
  const lzKeywords = landingZones.map(lz => ({
    ...lz,
    keywords: extractKeywords(lz.zone),
  }));

  const usedLzIndices = new Set();

  return engagementZones.map(ez => {
    const ezKeywords = extractKeywords(ez.zone);

    // Score every landing zone against this engagement zone
    const scored = lzKeywords
      .map((lz, idx) => ({
        ...lz,
        idx,
        score: keywordOverlap(ezKeywords, lz.keywords),
      }))
      .filter(lz => lz.score >= 0.15) // minimum overlap threshold
      .sort((a, b) => b.score - a.score);

    // Take best match (or two if both score high), prefer unused
    const matched = [];
    for (const candidate of scored) {
      if (matched.length >= 2) break;
      if (!usedLzIndices.has(candidate.idx) || candidate.score > 0.4) {
        matched.push(candidate);
        usedLzIndices.add(candidate.idx);
      }
    }

    return {
      ...ez,
      matchedLandingZones: matched.map(({ keywords, idx, score, ...lz }) => lz),
    };
  });
}
