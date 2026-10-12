import { describe, expect, it } from 'vitest';
import {
  parseAdminDateRange,
  pushDateRangeFilter,
  hasDateRange,
} from './adminDateRange.js';

describe('parseAdminDateRange', () => {
  it('accepts empty query as all-time', () => {
    expect(parseAdminDateRange({})).toEqual({ startDate: null, endDate: null });
  });

  it('parses YYYY-MM-DD bounds', () => {
    expect(parseAdminDateRange({ startDate: '2024-01-15', endDate: '2024-02-01' })).toEqual({
      startDate: '2024-01-15',
      endDate: '2024-02-01',
    });
  });

  it('rejects inverted ranges', () => {
    expect(parseAdminDateRange({ startDate: '2024-03-01', endDate: '2024-01-01' })).toEqual({
      error: 'startDate must be on or before endDate',
    });
  });

  it('ignores invalid formats', () => {
    expect(parseAdminDateRange({ startDate: '01/15/2024', endDate: 'nope' })).toEqual({
      startDate: null,
      endDate: null,
    });
  });
});

describe('pushDateRangeFilter', () => {
  it('builds inclusive end-date predicates', () => {
    const parts = ['user_id > 0'];
    const params = [];
    pushDateRangeFilter(parts, params, 'purchase_date', '2024-01-01', '2024-01-31');
    expect(parts).toEqual([
      'user_id > 0',
      'purchase_date >= $1::date',
      "purchase_date < ($2::date + INTERVAL '1 day')",
    ]);
    expect(params).toEqual(['2024-01-01', '2024-01-31']);
  });
});

describe('hasDateRange', () => {
  it('is true when either bound is set', () => {
    expect(hasDateRange('2024-01-01', null)).toBe(true);
    expect(hasDateRange(null, '2024-01-01')).toBe(true);
    expect(hasDateRange(null, null)).toBe(false);
  });
});
