/**
 * Pure scoring helper functions — no data imports
 * These work with data passed as arguments (from API or static imports)
 */
import { QUAL_FRAMEWORK } from './qualification';
import { SCORE, UI } from './constants';

export { QUAL_FRAMEWORK };

// ─── Types ──────────────────────────────────────────────────────────

interface DimensionScore {
  score: number;
  note?: string;
}

interface PowerMapData extends DimensionScore {
  activated?: boolean;
}

interface PartnerAccessData extends DimensionScore {
  backbase_access?: boolean;
}

export interface QualData {
  firmographics?: DimensionScore;
  technographics?: DimensionScore;
  decision_process?: DimensionScore;
  landing_zones?: DimensionScore;
  pain_push?: DimensionScore;
  power_map?: PowerMapData;
  partner_access?: PartnerAccessData;
  [key: string]: DimensionScore | PowerMapData | PartnerAccessData | undefined;
}

export interface DataConfidence {
  level: 'deep' | 'standard' | 'preliminary';
  label: string;
  color: string;
  bg: string;
}

interface OperationalProfile {
  employees_breakdown?: Record<string, unknown>;
  tech_stack?: Record<string, unknown>;
}

interface BankData {
  operational_profile?: OperationalProfile;
  [key: string]: unknown;
}

// ─── Functions ──────────────────────────────────────────────────────

/**
 * Calculate weighted qualification score from qualification data
 * @returns score 0-10
 */
export function calcScoreFromData(qualData: QualData | null | undefined): number {
  if (!qualData) return 0;
  const fw = QUAL_FRAMEWORK.dimensions;
  let w = 0;
  Object.keys(fw).forEach(dim => {
    const dimData = qualData[dim];
    if (dimData) w += dimData.score * (fw as Record<string, { weight: number }>)[dim].weight;
  });
  if ((qualData.power_map as PowerMapData)?.activated) w += SCORE.POWER_MAP_BONUS;
  if ((qualData.partner_access as PartnerAccessData)?.backbase_access) w += SCORE.PARTNER_ACCESS_BONUS;
  return Math.round(Math.min(w, SCORE.MAX) * 10) / 10;
}

export function scoreColor(score: number): string {
  if (score >= SCORE.TIER_STRONG) return '#3366FF';
  if (score >= SCORE.TIER_GOOD) return '#1F3D99';
  if (score >= SCORE.TIER_MODERATE) return '#F57F17';
  return '#FF7262';
}

export function scoreBg(score: number): string {
  if (score >= SCORE.TIER_STRONG) return '#EBF0FF';
  if (score >= SCORE.TIER_GOOD) return '#F0F4FA';
  if (score >= SCORE.TIER_MODERATE) return '#FFF8E1';
  return '#FFF0EE';
}

export function scoreLabel(score: number): string {
  if (score >= SCORE.TIER_STRONG) return 'Strong Fit';
  if (score >= SCORE.TIER_GOOD) return 'Good Fit';
  if (score >= SCORE.TIER_MODERATE) return 'Moderate Fit';
  return 'Low Fit';
}

export function parseBankKey(key: string): { bankName: string; country: string } {
  const parts = key.split('_');
  return { bankName: parts[0], country: parts.slice(1).join('_') };
}

/**
 * Compute data confidence from bank data object
 */
// DEEP_BANKS is now sourced from constants.ts via UI.DEEP_BANKS

export function dataConfidenceFromData(bankKey: string, bankData: BankData | null | undefined): DataConfidence {
  const hasFullOp = bankData?.operational_profile?.employees_breakdown || bankData?.operational_profile?.tech_stack;
  if ((UI.DEEP_BANKS as readonly string[]).includes(bankKey)) return { level: 'deep', label: 'Deep', color: '#2E7D32', bg: '#E8F5E9' };
  if (hasFullOp) return { level: 'standard', label: 'Standard', color: '#F57F17', bg: '#FFF8E1' };
  return { level: 'preliminary', label: 'Preliminary', color: '#FF7262', bg: '#FFF0EE' };
}
