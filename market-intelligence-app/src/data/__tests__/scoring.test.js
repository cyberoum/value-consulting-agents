import { describe, it, expect } from 'vitest';
import {
  calcScoreFromData, scoreColor, scoreBg, scoreLabel,
  parseBankKey, dataConfidenceFromData,
} from '../scoring';
import { SCORE } from '../constants';

// ── calcScoreFromData ───────────────────────────────────────────────

describe('calcScoreFromData', () => {
  it('returns 0 for null/undefined input', () => {
    expect(calcScoreFromData(null)).toBe(0);
    expect(calcScoreFromData(undefined)).toBe(0);
  });

  it('sums weighted dimension scores', () => {
    const qualData = {
      firmographics:      { score: 10 },  // ×0.10 = 1.0
      technographics:     { score: 8 },   // ×0.15 = 1.2
      decision_process:   { score: 6 },   // ×0.10 = 0.6
      landing_zones:      { score: 9 },   // ×0.20 = 1.8
      pain_push:          { score: 7 },   // ×0.20 = 1.4
      power_map:          { score: 5 },   // ×0.15 = 0.75
      partner_access:     { score: 4 },   // ×0.10 = 0.4
    };
    // Sum = 7.15
    expect(calcScoreFromData(qualData)).toBe(7.2); // rounded to 1dp
  });

  it('adds power_map_bonus when activated', () => {
    const base = {
      firmographics: { score: 5 },
      technographics: { score: 5 },
      decision_process: { score: 5 },
      landing_zones: { score: 5 },
      pain_push: { score: 5 },
      power_map: { score: 5, activated: true },
      partner_access: { score: 5 },
    };
    // Base sum = 5×(0.10+0.15+0.10+0.20+0.20+0.15+0.10) = 5×1.0 = 5.0
    // + power_map bonus = 1.0 → 6.0
    expect(calcScoreFromData(base)).toBe(6.0);
  });

  it('adds partner_access_bonus when activated', () => {
    const base = {
      firmographics: { score: 5 },
      technographics: { score: 5 },
      decision_process: { score: 5 },
      landing_zones: { score: 5 },
      pain_push: { score: 5 },
      power_map: { score: 5 },
      partner_access: { score: 5, backbase_access: true },
    };
    // 5.0 + 0.5 = 5.5
    expect(calcScoreFromData(base)).toBe(5.5);
  });

  it('caps at SCORE.MAX even with both bonuses', () => {
    const maxData = {
      firmographics: { score: 10 },
      technographics: { score: 10 },
      decision_process: { score: 10 },
      landing_zones: { score: 10 },
      pain_push: { score: 10 },
      power_map: { score: 10, activated: true },
      partner_access: { score: 10, backbase_access: true },
    };
    // Raw = 10 + 1.0 + 0.5 = 11.5, capped at 10
    expect(calcScoreFromData(maxData)).toBe(SCORE.MAX);
  });
});

// ── scoreColor / scoreBg / scoreLabel ───────────────────────────────

describe('score tier functions', () => {
  const cases = [
    { score: 9.5, color: '#3366FF', bg: '#EBF0FF', label: 'Strong Fit' },
    { score: 8.0, color: '#3366FF', bg: '#EBF0FF', label: 'Strong Fit' },
    { score: 7.0, color: '#1F3D99', bg: '#F0F4FA', label: 'Good Fit' },
    { score: 6.0, color: '#1F3D99', bg: '#F0F4FA', label: 'Good Fit' },
    { score: 5.0, color: '#F57F17', bg: '#FFF8E1', label: 'Moderate Fit' },
    { score: 4.0, color: '#F57F17', bg: '#FFF8E1', label: 'Moderate Fit' },
    { score: 3.0, color: '#FF7262', bg: '#FFF0EE', label: 'Low Fit' },
    { score: 0,   color: '#FF7262', bg: '#FFF0EE', label: 'Low Fit' },
  ];

  cases.forEach(({ score, color, bg, label }) => {
    it(`score ${score} → "${label}"`, () => {
      expect(scoreColor(score)).toBe(color);
      expect(scoreBg(score)).toBe(bg);
      expect(scoreLabel(score)).toBe(label);
    });
  });
});

// ── parseBankKey ────────────────────────────────────────────────────

describe('parseBankKey', () => {
  it('splits simple key', () => {
    expect(parseBankKey('Nordea_Sweden')).toEqual({ bankName: 'Nordea', country: 'Sweden' });
  });

  it('handles multi-part country', () => {
    expect(parseBankKey('SEB_United_Kingdom')).toEqual({ bankName: 'SEB', country: 'United_Kingdom' });
  });
});

// ── dataConfidenceFromData ──────────────────────────────────────────

describe('dataConfidenceFromData', () => {
  it('returns deep for known deep banks', () => {
    const result = dataConfidenceFromData('Nordea_Sweden', {});
    expect(result.level).toBe('deep');
  });

  it('returns standard when operational profile has breakdown', () => {
    const result = dataConfidenceFromData('Unknown_Bank', {
      operational_profile: { employees_breakdown: {} },
    });
    expect(result.level).toBe('standard');
  });

  it('returns preliminary for banks with no data', () => {
    const result = dataConfidenceFromData('Unknown_Bank', {});
    expect(result.level).toBe('preliminary');
  });
});
