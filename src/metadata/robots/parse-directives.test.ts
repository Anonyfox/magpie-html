import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseDirectives } from './parse-directives.js';

describe('parseDirectives', () => {
  it('should parse noindex directive', () => {
    const result = parseDirectives('noindex');
    assert.equal(result.index, false);
  });

  it('should parse nofollow directive', () => {
    const result = parseDirectives('nofollow');
    assert.equal(result.follow, false);
  });

  it('should parse index directive', () => {
    const result = parseDirectives('index');
    assert.equal(result.index, true);
  });

  it('should parse follow directive', () => {
    const result = parseDirectives('follow');
    assert.equal(result.follow, true);
  });

  it('should parse combined directives', () => {
    const result = parseDirectives('noindex, nofollow');
    assert.equal(result.index, false);
    assert.equal(result.follow, false);
  });

  it('should parse all directive', () => {
    const result = parseDirectives('all');
    assert.equal(result.index, true);
    assert.equal(result.follow, true);
  });

  it('should parse none directive', () => {
    const result = parseDirectives('none');
    assert.equal(result.index, false);
    assert.equal(result.follow, false);
  });

  it('should parse noarchive directive', () => {
    const result = parseDirectives('noarchive');
    assert.equal(result.noarchive, true);
  });

  it('should parse nosnippet directive', () => {
    const result = parseDirectives('nosnippet');
    assert.equal(result.nosnippet, true);
  });

  it('should parse noimageindex directive', () => {
    const result = parseDirectives('noimageindex');
    assert.equal(result.noimageindex, true);
  });

  it('should parse notranslate directive', () => {
    const result = parseDirectives('notranslate');
    assert.equal(result.notranslate, true);
  });

  it('should parse max-snippet directive', () => {
    const result = parseDirectives('max-snippet:150');
    assert.equal(result.maxSnippet, 150);
  });

  it('should parse max-snippet:-1 (unlimited)', () => {
    const result = parseDirectives('max-snippet:-1');
    assert.equal(result.maxSnippet, -1);
  });

  it('should parse max-image-preview directive', () => {
    const result = parseDirectives('max-image-preview:large');
    assert.equal(result.maxImagePreview, 'large');
  });

  it('should parse max-video-preview directive', () => {
    const result = parseDirectives('max-video-preview:60');
    assert.equal(result.maxVideoPreview, 60);
  });

  it('should parse unavailable_after directive', () => {
    const result = parseDirectives('unavailable_after:2025-01-01');
    assert.equal(result.unavailableAfter, '2025-01-01');
  });

  it('should parse complex combination', () => {
    const result = parseDirectives(
      'noindex, nofollow, noarchive, max-snippet:100, max-image-preview:standard',
    );

    assert.equal(result.index, false);
    assert.equal(result.follow, false);
    assert.equal(result.noarchive, true);
    assert.equal(result.maxSnippet, 100);
    assert.equal(result.maxImagePreview, 'standard');
  });

  it('should handle whitespace', () => {
    const result = parseDirectives('noindex , nofollow , noarchive');
    assert.equal(result.index, false);
    assert.equal(result.follow, false);
    assert.equal(result.noarchive, true);
  });

  it('should handle case insensitivity', () => {
    const result = parseDirectives('NOINDEX, NOFOLLOW');
    assert.equal(result.index, false);
    assert.equal(result.follow, false);
  });

  it('should return empty object for empty string', () => {
    const result = parseDirectives('');
    assert.deepEqual(result, {});
  });

  it('should return empty object for undefined', () => {
    const result = parseDirectives(undefined);
    assert.deepEqual(result, {});
  });

  it('should ignore unknown directives', () => {
    const result = parseDirectives('noindex, unknown-directive, nofollow');
    assert.equal(result.index, false);
    assert.equal(result.follow, false);
    // unknown-directive should be ignored
  });

  it('should parse Google-style directives', () => {
    const result = parseDirectives(
      'max-snippet:320, max-image-preview:large, max-video-preview:-1',
    );

    assert.equal(result.maxSnippet, 320);
    assert.equal(result.maxImagePreview, 'large');
    assert.equal(result.maxVideoPreview, -1);
  });
});
