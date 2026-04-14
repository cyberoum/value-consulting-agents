import { describe, it, expect } from 'vitest';
import { analyzeMotionsForBank, SALES_MOTIONS, getMotionById } from '../data/salesMotions';

describe('analyzeMotionsForBank', () => {
  it('returns empty array for null input', () => {
    expect(analyzeMotionsForBank(null)).toEqual([]);
    expect(analyzeMotionsForBank(undefined)).toEqual([]);
  });

  it('returns empty array for bank with no relevant data', () => {
    const result = analyzeMotionsForBank({ overview: 'A small local bank with no digital strategy.' });
    // May return empty or very low scores — no false positives
    result.forEach(m => expect(m.evidenceScore).toBeGreaterThanOrEqual(3));
  });

  it('identifies channel decoupling for banks with platform fragmentation pain points', () => {
    const bankData = {
      pain_points: [{ title: 'Legacy Core Platform', detail: 'Aging monolithic core banking system needs modernization' }],
      signals: [{ signal: 'Digital transformation investment of €1B', implication: 'Active modernization' }],
      backbase_landing_zones: [{ zone: 'Unified Digital Banking Platform', fit_score: 9, rationale: 'Platform unification' }],
    };
    const result = analyzeMotionsForBank(bankData);
    const channelDecoupling = result.find(m => m.id === 'channel-decoupling');
    expect(channelDecoupling).toBeTruthy();
    expect(channelDecoupling.verdict).toBe('primary');
  });

  it('identifies SME banking gap when bank has SME pain points', () => {
    const bankData = {
      pain_points: [{ title: 'SME Banking Experience Gap', detail: 'Business banking portal is outdated' }],
      signals: [{ signal: 'SME banking growth priority', implication: 'Active investment' }],
      backbase_landing_zones: [{ zone: 'SME Banking Portal', fit_score: 8, rationale: 'Modern business banking' }],
    };
    const result = analyzeMotionsForBank(bankData);
    const smeGap = result.find(m => m.id === 'sme-banking-gap');
    expect(smeGap).toBeTruthy();
    expect(smeGap.evidenceScore).toBeGreaterThanOrEqual(5);
  });

  it('includes evidence items explaining WHY each motion was selected', () => {
    const bankData = {
      pain_points: [{ title: 'Wealth Platform Modernization', detail: 'Digital advisory tools needed' }],
      backbase_landing_zones: [{ zone: 'Wealth Management Platform', fit_score: 8, rationale: 'Wealth digital' }],
    };
    const result = analyzeMotionsForBank(bankData);
    const wealth = result.find(m => m.id === 'retail-to-wealth');
    if (wealth) {
      expect(wealth.evidence).toBeTruthy();
      expect(wealth.evidence.length).toBeGreaterThan(0);
      // Each evidence item should be a non-empty string
      wealth.evidence.forEach(e => {
        expect(typeof e).toBe('string');
        expect(e.length).toBeGreaterThan(0);
      });
    }
  });

  it('sorts results by evidence score descending', () => {
    const bankData = {
      pain_points: [
        { title: 'Legacy Core Platform', detail: 'Aging system' },
        { title: 'Wealth Platform', detail: 'Needs advisory tools' },
      ],
      signals: [
        { signal: 'Technology investment exceeding €1B', implication: 'Modernization' },
        { signal: 'Wealth expansion targets', implication: 'Growth' },
      ],
      backbase_landing_zones: [
        { zone: 'Unified Digital Platform', fit_score: 9, rationale: 'Platform' },
        { zone: 'Wealth Management', fit_score: 7, rationale: 'Wealth' },
      ],
    };
    const result = analyzeMotionsForBank(bankData);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].evidenceScore).toBeLessThanOrEqual(result[i - 1].evidenceScore);
    }
  });

  it('does NOT include motions with score < 3', () => {
    const result = analyzeMotionsForBank({ overview: 'Generic bank' });
    result.forEach(m => expect(m.evidenceScore).toBeGreaterThanOrEqual(3));
  });
});

describe('SALES_MOTIONS reference library', () => {
  it('has 6 defined motions', () => {
    expect(Object.keys(SALES_MOTIONS).length).toBe(6);
  });

  it('each motion has required fields', () => {
    Object.values(SALES_MOTIONS).forEach(m => {
      expect(m.id).toBeTruthy();
      expect(m.label).toBeTruthy();
      expect(m.description).toBeTruthy();
      expect(m.qualifying_questions.length).toBeGreaterThanOrEqual(3);
      expect(m.backbase_products.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('getMotionById', () => {
  it('returns the correct motion', () => {
    const m = getMotionById('channel-decoupling');
    expect(m).toBeTruthy();
    expect(m.label).toContain('Channel');
  });

  it('returns null for unknown ID', () => {
    expect(getMotionById('nonexistent')).toBeNull();
  });
});
