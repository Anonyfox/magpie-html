import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isValidAtomDate, parseAtomDate, parseRFC3339Date } from './parse-date.js';

describe('parseRFC3339Date', () => {
  it('should parse ISO 8601 date with Z timezone', () => {
    const input = '2025-12-17T10:00:00Z';
    const result = parseRFC3339Date(input);
    assert.ok(result);
    assert.equal(result, '2025-12-17T10:00:00.000Z');
  });

  it('should parse ISO 8601 date with positive timezone offset', () => {
    const input = '2025-12-17T11:00:00+01:00';
    const result = parseRFC3339Date(input);
    assert.ok(result);
    assert.equal(result, '2025-12-17T10:00:00.000Z');
  });

  it('should parse ISO 8601 date with negative timezone offset', () => {
    const input = '2025-12-17T05:00:00-05:00';
    const result = parseRFC3339Date(input);
    assert.ok(result);
    assert.equal(result, '2025-12-17T10:00:00.000Z');
  });

  it('should parse date with milliseconds', () => {
    const input = '2025-12-17T10:00:00.123Z';
    const result = parseRFC3339Date(input);
    assert.ok(result);
    assert.equal(result, '2025-12-17T10:00:00.123Z');
  });

  it('should parse date without seconds', () => {
    const input = '2025-12-17T10:00Z';
    const result = parseRFC3339Date(input);
    assert.ok(result);
  });

  it('should parse date with timezone +00:00', () => {
    const input = '2025-12-17T10:00:00+00:00';
    const result = parseRFC3339Date(input);
    assert.ok(result);
    assert.equal(result, '2025-12-17T10:00:00.000Z');
  });

  it('should return null for invalid date', () => {
    const input = 'not a date';
    const result = parseRFC3339Date(input);
    assert.equal(result, null);
  });

  it('should return null for empty string', () => {
    const result = parseRFC3339Date('');
    assert.equal(result, null);
  });

  it('should return null for whitespace only', () => {
    const result = parseRFC3339Date('   ');
    assert.equal(result, null);
  });

  it('should return null for null input', () => {
    const result = parseRFC3339Date(null);
    assert.equal(result, null);
  });

  it('should return null for undefined input', () => {
    const result = parseRFC3339Date(undefined);
    assert.equal(result, null);
  });

  it('should handle dates with extra whitespace', () => {
    const input = '  2025-12-17T10:00:00Z  ';
    const result = parseRFC3339Date(input);
    assert.ok(result);
    assert.equal(result, '2025-12-17T10:00:00.000Z');
  });

  it('should parse date-only format', () => {
    const input = '2025-12-17';
    const result = parseRFC3339Date(input);
    assert.ok(result);
  });
});

describe('parseAtomDate', () => {
  it('should be an alias for parseRFC3339Date', () => {
    const input = '2025-12-17T10:00:00Z';
    const result1 = parseRFC3339Date(input);
    const result2 = parseAtomDate(input);
    assert.equal(result1, result2);
  });
});

describe('isValidAtomDate', () => {
  it('should return true for valid date', () => {
    const input = '2025-12-17T10:00:00Z';
    assert.equal(isValidAtomDate(input), true);
  });

  it('should return false for invalid date', () => {
    const input = 'not a date';
    assert.equal(isValidAtomDate(input), false);
  });

  it('should return false for null', () => {
    assert.equal(isValidAtomDate(null), false);
  });

  it('should return false for undefined', () => {
    assert.equal(isValidAtomDate(undefined), false);
  });

  it('should return false for empty string', () => {
    assert.equal(isValidAtomDate(''), false);
  });
});
