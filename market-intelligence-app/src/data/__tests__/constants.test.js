import { describe, it, expect } from 'vitest';
import { SCORE, ROI, NBA } from '../constants';

describe('SCORE constants', () => {
  it('has correct tier ordering: STRONG > GOOD > MODERATE', () => {
    expect(SCORE.TIER_STRONG).toBeGreaterThan(SCORE.TIER_GOOD);
    expect(SCORE.TIER_GOOD).toBeGreaterThan(SCORE.TIER_MODERATE);
  });

  it('bonuses do not exceed MAX', () => {
    expect(SCORE.POWER_MAP_BONUS + SCORE.PARTNER_ACCESS_BONUS).toBeLessThanOrEqual(SCORE.MAX);
  });
});

describe('ROI constants', () => {
  it('rates are between 0 and 1', () => {
    expect(ROI.ACQUISITION_RATE).toBeGreaterThan(0);
    expect(ROI.ACQUISITION_RATE).toBeLessThan(1);
    expect(ROI.DIGITAL_CHANNEL_SHARE).toBeGreaterThan(0);
    expect(ROI.DIGITAL_CHANNEL_SHARE).toBeLessThanOrEqual(1);
    expect(ROI.FIRST_YEAR_REVENUE_FACTOR).toBeGreaterThan(0);
    expect(ROI.FIRST_YEAR_REVENUE_FACTOR).toBeLessThanOrEqual(1);
    expect(ROI.ADDRESSABLE_TECH_SPEND_PCT).toBeGreaterThan(0);
    expect(ROI.ADDRESSABLE_TECH_SPEND_PCT).toBeLessThanOrEqual(1);
  });

  it('revenue fee multiplier is reasonable', () => {
    expect(ROI.REVENUE_FEE_MULTIPLIER).toBeGreaterThanOrEqual(1);
    expect(ROI.REVENUE_FEE_MULTIPLIER).toBeLessThanOrEqual(5);
  });
});

describe('NBA constants', () => {
  it('MAX_ACTIONS is a positive integer', () => {
    expect(NBA.MAX_ACTIONS).toBeGreaterThan(0);
    expect(Number.isInteger(NBA.MAX_ACTIONS)).toBe(true);
  });

  it('thresholds are within scoring range', () => {
    expect(NBA.QUAL_GAP_THRESHOLD).toBeGreaterThan(0);
    expect(NBA.QUAL_GAP_THRESHOLD).toBeLessThanOrEqual(SCORE.MAX);
    expect(NBA.LOW_APP_RATING).toBeGreaterThan(0);
    expect(NBA.LOW_APP_RATING).toBeLessThanOrEqual(5);
  });
});
