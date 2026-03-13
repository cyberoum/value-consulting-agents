/**
 * Pure scoring helper functions — no data imports
 * These work with data passed as arguments (from API or static imports)
 */
import { QUAL_FRAMEWORK } from './qualification';

export { QUAL_FRAMEWORK };

/**
 * Calculate weighted qualification score from qualification data
 * @param {object} qualData - qualification data object with dimension scores
 * @returns {number} score 0-10
 */
export function calcScoreFromData(qualData) {
  if (!qualData) return 0;
  const fw = QUAL_FRAMEWORK.dimensions;
  let w = 0;
  Object.keys(fw).forEach(dim => {
    if (qualData[dim]) w += qualData[dim].score * fw[dim].weight;
  });
  if (qualData.power_map?.activated) w += 1.0;
  if (qualData.partner_access?.backbase_access) w += 0.5;
  return Math.round(Math.min(w, 10) * 10) / 10;
}

export function scoreColor(score) {
  if (score >= 8) return '#3366FF';
  if (score >= 6) return '#1F3D99';
  if (score >= 4) return '#F57F17';
  return '#FF7262';
}

export function scoreBg(score) {
  if (score >= 8) return '#EBF0FF';
  if (score >= 6) return '#F0F4FA';
  if (score >= 4) return '#FFF8E1';
  return '#FFF0EE';
}

export function scoreLabel(score) {
  if (score >= 8) return 'Strong Fit';
  if (score >= 6) return 'Good Fit';
  if (score >= 4) return 'Moderate Fit';
  return 'Low Fit';
}

export function parseBankKey(key) {
  const parts = key.split('_');
  return { bankName: parts[0], country: parts.slice(1).join('_') };
}

/**
 * Compute data confidence from bank data object
 * @param {string} bankKey
 * @param {object} bankData - full BANK_DATA entry
 * @returns {{ level: string, label: string, color: string, bg: string }}
 */
const DEEP_BANKS = ['Nordea_Sweden','SEB_Sweden','DNB_Norway','Handelsbanken_Sweden','Swedbank_Sweden','Danske Bank_Denmark','OP Financial Group_Finland','TF Bank_Sweden'];

export function dataConfidenceFromData(bankKey, bankData) {
  const hasFullOp = bankData?.operational_profile?.employees_breakdown || bankData?.operational_profile?.tech_stack;
  if (DEEP_BANKS.includes(bankKey)) return { level: 'deep', label: 'Deep', color: '#2E7D32', bg: '#E8F5E9' };
  if (hasFullOp) return { level: 'standard', label: 'Standard', color: '#F57F17', bg: '#FFF8E1' };
  return { level: 'preliminary', label: 'Preliminary', color: '#FF7262', bg: '#FFF0EE' };
}
