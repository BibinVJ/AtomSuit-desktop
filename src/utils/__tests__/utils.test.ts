import { describe, expect, it } from 'vitest';
import { isApiError } from '../errors';
import { formatKebabCase } from '../string';
import { formatDate } from '../date';

describe('isApiError', () => {
  it('recognises an axios-shaped API error', () => {
    expect(isApiError({ response: { data: { message: 'Nope' } } })).toBe(true);
  });

  it.each([
    ['a plain Error', new Error('boom')],
    ['null', null],
    ['a string', 'boom'],
    ['an object with no response', { message: 'boom' }],
    ['a response with no data', { response: {} }],
  ])('rejects %s', (_label, value) => {
    expect(isApiError(value)).toBe(false);
  });
});

describe('formatKebabCase', () => {
  it('turns a permission slug into a readable label', () => {
    expect(formatKebabCase('view-sales-invoice')).toBe('View Sales Invoice');
  });

  it('handles a single word', () => {
    expect(formatKebabCase('dashboard')).toBe('Dashboard');
  });

  it('returns an empty string for empty input', () => {
    expect(formatKebabCase('')).toBe('');
  });
});

describe('formatDate', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(formatDate(new Date(2026, 8, 6))).toBe('2026-09-06');
  });

  it('zero-pads single-digit months and days', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  /**
   * Uses local getFullYear/getMonth/getDate rather than toISOString, so a late-evening date does
   * not roll forward into the next day. (The web frontend had exactly that bug.)
   */
  it('uses the local date, not UTC', () => {
    expect(formatDate(new Date(2026, 11, 31, 23, 30))).toBe('2026-12-31');
  });
});
