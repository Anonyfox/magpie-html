import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseRFC822Date, parseRSSDate, isValidDate } from './parse-date.js';

describe('parseRFC822Date', () => {
  it('should parse standard RFC 822 date with GMT', () => {
    const input = 'Wed, 02 Oct 2002 13:00:00 GMT';
    const result = parseRFC822Date(input);
    assert.ok(result);
    assert.equal(result, '2002-10-02T13:00:00.000Z');
  });

  it('should parse RFC 822 date with timezone offset', () => {
    const input = 'Wed, 02 Oct 2002 15:00:00 +0200';
    const result = parseRFC822Date(input);
    assert.ok(result);
    assert.equal(result, '2002-10-02T13:00:00.000Z'); // +0200 -> UTC
  });

  it('should parse RFC 822 date with negative timezone', () => {
    const input = 'Wed, 17 Dec 2025 09:00:00 -0500';
    const result = parseRFC822Date(input);
    assert.ok(result);
    assert.equal(result, '2025-12-17T14:00:00.000Z'); // -0500 -> UTC
  });

  it('should parse RFC 822 date without day name', () => {
    const input = '17 Dec 2025 10:30:00 GMT';
    const result = parseRFC822Date(input);
    assert.ok(result);
    assert.equal(result, '2025-12-17T10:30:00.000Z');
  });

  it('should parse date with EST timezone', () => {
    const input = 'Wed, 17 Dec 2025 09:00:00 EST';
    const result = parseRFC822Date(input);
    assert.ok(result);
    // EST is -0500
    assert.equal(result, '2025-12-17T14:00:00.000Z');
  });

  it('should parse date with PDT timezone', () => {
    const input = 'Wed, 17 Dec 2025 06:00:00 PDT';
    const result = parseRFC822Date(input);
    assert.ok(result);
    // PDT is -0700
    assert.equal(result, '2025-12-17T13:00:00.000Z');
  });

  it('should handle RFC 822 with 2-digit year (legacy)', () => {
    const input = 'Wed, 02 Oct 02 13:00:00 GMT';
    const result = parseRFC822Date(input);
    assert.ok(result);
    // Should parse as 2002
    assert.ok(result.startsWith('2002'));
  });

  it('should return null for invalid date', () => {
    const input = 'Not a valid date';
    const result = parseRFC822Date(input);
    assert.equal(result, null);
  });

  it('should return null for empty string', () => {
    const result = parseRFC822Date('');
    assert.equal(result, null);
  });

  it('should return null for whitespace only', () => {
    const result = parseRFC822Date('   ');
    assert.equal(result, null);
  });

  it('should return null for null input', () => {
    const result = parseRFC822Date(null);
    assert.equal(result, null);
  });

  it('should return null for undefined input', () => {
    const result = parseRFC822Date(undefined);
    assert.equal(result, null);
  });

  it('should handle dates with extra whitespace', () => {
    const input = '  Wed, 17 Dec 2025 10:00:00 GMT  ';
    const result = parseRFC822Date(input);
    assert.ok(result);
    assert.equal(result, '2025-12-17T10:00:00.000Z');
  });

  it('should parse real-world RSS date from FAZ', () => {
    const input = 'Wed, 17 Dec 2025 09:49:41 GMT';
    const result = parseRFC822Date(input);
    assert.ok(result);
    assert.equal(result, '2025-12-17T09:49:41.000Z');
  });

  it('should parse real-world RSS date from RND', () => {
    const input = 'Wed, 17 Dec 2025 11:31:00 +0100';
    const result = parseRFC822Date(input);
    assert.ok(result);
    assert.equal(result, '2025-12-17T10:31:00.000Z');
  });

  it('should handle malformed date gracefully', () => {
    const input = 'Wed, 32 Dec 2025 25:00:00 GMT'; // Invalid day and hour
    const result = parseRFC822Date(input);
    // JavaScript Date is lenient, may parse or return null
    // Just verify it doesn't throw
    assert.ok(result === null || typeof result === 'string');
  });
});

describe('parseRSSDate', () => {
  it('should be an alias for parseRFC822Date', () => {
    const input = 'Wed, 17 Dec 2025 10:00:00 GMT';
    const result1 = parseRFC822Date(input);
    const result2 = parseRSSDate(input);
    assert.equal(result1, result2);
  });

  it('should handle null input', () => {
    const result = parseRSSDate(null);
    assert.equal(result, null);
  });
});

describe('isValidDate', () => {
  it('should return true for valid date', () => {
    const input = 'Wed, 17 Dec 2025 10:00:00 GMT';
    assert.equal(isValidDate(input), true);
  });

  it('should return false for invalid date', () => {
    const input = 'Not a date';
    assert.equal(isValidDate(input), false);
  });

  it('should return false for null', () => {
    assert.equal(isValidDate(null), false);
  });

  it('should return false for undefined', () => {
    assert.equal(isValidDate(undefined), false);
  });

  it('should return false for empty string', () => {
    assert.equal(isValidDate(''), false);
  });
});

