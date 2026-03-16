import { describe, it, expect } from 'vitest';
import {
  parseKpiValue, formatNumber, formatMillions, formatEur,
  getConversationSummary, BENCHMARKS,
} from '../roiEngine';

// ── parseKpiValue ──────────────────────────────────────────────────

describe('parseKpiValue', () => {
  it('returns null for null/undefined/empty', () => {
    expect(parseKpiValue(null)).toBeNull();
    expect(parseKpiValue(undefined)).toBeNull();
    expect(parseKpiValue('')).toBeNull();
  });

  it('parses EUR billions', () => {
    const r = parseKpiValue('€570B');
    expect(r.value).toBe(570e9);
    expect(r.eurValue).toBe(570e9);
    expect(r.currency).toBe('EUR');
    expect(r.isPercent).toBe(false);
  });

  it('parses USD billions and converts to EUR', () => {
    const r = parseKpiValue('$100B');
    expect(r.value).toBe(100e9);
    expect(r.eurValue).toBe(100e9 * 0.92);
    expect(r.currency).toBe('USD');
  });

  it('parses GBP millions', () => {
    const r = parseKpiValue('£50M');
    expect(r.value).toBe(50e6);
    expect(r.eurValue).toBe(50e6 * 1.17);
    expect(r.currency).toBe('GBP');
  });

  it('parses SEK values', () => {
    const r = parseKpiValue('SEK 200B');
    expect(r.value).toBe(200e9);
    expect(r.currency).toBe('SEK');
    expect(r.eurValue).toBeCloseTo(200e9 * 0.087);
  });

  it('parses percentages', () => {
    const r = parseKpiValue('~46%');
    expect(r.value).toBeCloseTo(0.46);
    expect(r.isPercent).toBe(true);
  });

  it('handles commas and tildes', () => {
    const r = parseKpiValue('~28,000');
    expect(r.value).toBe(28000);
  });

  it('handles plus sign', () => {
    const r = parseKpiValue('9.3M+');
    expect(r.value).toBe(9.3e6);
  });

  it('parses plain numbers', () => {
    const r = parseKpiValue('12345');
    expect(r.value).toBe(12345);
    expect(r.currency).toBe('EUR');
  });

  it('returns null for non-numeric strings', () => {
    expect(parseKpiValue('hello')).toBeNull();
  });

  it('parses K suffix', () => {
    const r = parseKpiValue('€500K');
    expect(r.value).toBe(500e3);
  });
});

// ── formatNumber ───────────────────────────────────────────────────

describe('formatNumber', () => {
  it('returns dash for null', () => {
    expect(formatNumber(null)).toBe('—');
  });

  it('formats with thousand separators', () => {
    expect(formatNumber(28000)).toBe('28,000');
  });

  it('formats small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

// ── formatMillions ─────────────────────────────────────────────────

describe('formatMillions', () => {
  it('returns dash for null', () => {
    expect(formatMillions(null)).toBe('—');
  });

  it('formats billions', () => {
    expect(formatMillions(2.5e9)).toBe('2.5B');
  });

  it('formats millions', () => {
    expect(formatMillions(42e6)).toBe('42.0M');
  });

  it('formats thousands', () => {
    expect(formatMillions(5000)).toBe('5K');
  });

  it('formats small numbers', () => {
    expect(formatMillions(500)).toBe('500');
  });

  it('handles negative billions', () => {
    expect(formatMillions(-3e9)).toBe('-3.0B');
  });
});

// ── formatEur ──────────────────────────────────────────────────────

describe('formatEur', () => {
  it('returns dash for null', () => {
    expect(formatEur(null)).toBe('—');
  });

  it('prefixes with €', () => {
    expect(formatEur(10e6)).toBe('€10.0M');
  });
});

// ── getConversationSummary ─────────────────────────────────────────

describe('getConversationSummary', () => {
  it('returns null for null input', () => {
    expect(getConversationSummary(null)).toBeNull();
  });

  it('generates a readable summary', () => {
    const roi = {
      metrics: {
        bankName: 'TestBank',
        customers: 1000000,
        employees: 5000,
        totalAssets: 50e9,
      },
      totals: {
        conservative: 2e6,
        base: 5e6,
        optimistic: 10e6,
      },
    };
    const summary = getConversationSummary(roi);
    expect(summary).toContain('TestBank');
    expect(summary).toContain('1,000,000 customers');
    expect(summary).toContain('5,000 employees');
    expect(summary).toContain('€50.0B in assets');
    expect(summary).toContain('€2.0M');
    expect(summary).toContain('€10.0M');
  });
});

// ── BENCHMARKS structure ───────────────────────────────────────────

describe('BENCHMARKS', () => {
  it('has all required improvement factors', () => {
    const required = ['cost_to_serve', 'channel_shift', 'onboarding_lift', 'cross_sell', 'platform_savings'];
    required.forEach(key => {
      expect(BENCHMARKS[key]).toBeDefined();
      expect(BENCHMARKS[key].factors).toHaveLength(3);
      // Conservative ≤ base ≤ optimistic
      expect(BENCHMARKS[key].factors[0]).toBeLessThanOrEqual(BENCHMARKS[key].factors[1]);
      expect(BENCHMARKS[key].factors[1]).toBeLessThanOrEqual(BENCHMARKS[key].factors[2]);
    });
  });

  it('has source documentation', () => {
    expect(BENCHMARKS.sources).toBeDefined();
    expect(Object.keys(BENCHMARKS.sources).length).toBeGreaterThan(0);
  });
});
