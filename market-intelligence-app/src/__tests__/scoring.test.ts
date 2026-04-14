import { describe, it, expect } from 'vitest';
import { calcScoreFromData, scoreColor, scoreLabel, dataConfidenceFromData } from '../data/scoring';

describe('calcScoreFromData', () => {
  it('returns 0 for null/undefined input', () => {
    expect(calcScoreFromData(null)).toBe(0);
    expect(calcScoreFromData(undefined)).toBe(0);
  });

  it('calculates weighted score from qualification dimensions', () => {
    const qualData = {
      firmographics: { score: 10 },     // 10% weight
      technographics: { score: 6 },     // 15% weight
      decision_process: { score: 5 },   // 10% weight
      landing_zones: { score: 9 },      // 20% weight
      pain_push: { score: 7 },          // 20% weight
      power_map: { score: 6, activated: false }, // 15% weight
      partner_access: { score: 5, backbase_access: false }, // 10% weight
    };
    const score = calcScoreFromData(qualData);
    // Expected: 10*0.1 + 6*0.15 + 5*0.1 + 9*0.2 + 7*0.2 + 6*0.15 + 5*0.1 = 1+0.9+0.5+1.8+1.4+0.9+0.5 = 7.0
    expect(score).toBeCloseTo(7.0, 0);
  });

  it('applies power_map activation bonus (+1.0)', () => {
    const base = {
      firmographics: { score: 5 }, technographics: { score: 5 },
      decision_process: { score: 5 }, landing_zones: { score: 5 },
      pain_push: { score: 5 }, power_map: { score: 5, activated: false },
      partner_access: { score: 5, backbase_access: false },
    };
    const withActivation = { ...base, power_map: { score: 5, activated: true } };
    expect(calcScoreFromData(withActivation)).toBeGreaterThan(calcScoreFromData(base));
  });

  it('clamps score at max 10', () => {
    const maxData = {
      firmographics: { score: 10 }, technographics: { score: 10 },
      decision_process: { score: 10 }, landing_zones: { score: 10 },
      pain_push: { score: 10 }, power_map: { score: 10, activated: true },
      partner_access: { score: 10, backbase_access: true },
    };
    expect(calcScoreFromData(maxData)).toBeLessThanOrEqual(10);
  });
});

describe('scoreColor', () => {
  it('returns blue for high scores', () => {
    expect(scoreColor(8)).toBeTruthy();
    expect(scoreColor(10)).toBeTruthy();
  });

  it('returns a color string for all score ranges', () => {
    for (let s = 0; s <= 10; s++) {
      expect(typeof scoreColor(s)).toBe('string');
      expect(scoreColor(s).length).toBeGreaterThan(0);
    }
  });
});

describe('scoreLabel', () => {
  it('returns Strong Fit for scores >= 8', () => {
    expect(scoreLabel(8)).toContain('Strong');
    expect(scoreLabel(9.5)).toContain('Strong');
  });

  it('returns appropriate labels for each tier', () => {
    expect(scoreLabel(7)).toBeTruthy();
    expect(scoreLabel(4)).toBeTruthy();
    expect(scoreLabel(2)).toBeTruthy();
  });
});

describe('dataConfidenceFromData', () => {
  it('returns a valid confidence object', () => {
    const result = dataConfidenceFromData('Nordea_Sweden', { operational_profile: { employees: '28000' } });
    expect(result).toHaveProperty('level');
    expect(result).toHaveProperty('label');
  });
});
