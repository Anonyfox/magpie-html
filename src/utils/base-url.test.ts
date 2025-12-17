import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { getBaseUrl } from './base-url.js';
import { parseHTML } from './html-parser.js';

describe('getBaseUrl', () => {
  it('should extract base URL from <base> tag', () => {
    const html = '<html><head><base href="https://example.com/"></head></html>';
    const doc = parseHTML(html);

    const result = getBaseUrl(doc, 'https://example.org/page.html');
    assert.equal(result, 'https://example.com/');
  });

  it('should resolve relative base href against document URL', () => {
    const html = '<html><head><base href="/subdirectory/"></head></html>';
    const doc = parseHTML(html);

    const result = getBaseUrl(doc, 'https://example.com/page.html');
    assert.equal(result, 'https://example.com/subdirectory/');
  });

  it('should return document URL if no base tag', () => {
    const html = '<html><head><title>Test</title></head></html>';
    const doc = parseHTML(html);

    const result = getBaseUrl(doc, 'https://example.com/page.html');
    assert.equal(result, 'https://example.com/page.html');
  });

  it('should accept URL object as document URL', () => {
    const html = '<html><head></head></html>';
    const doc = parseHTML(html);

    const url = new URL('https://example.com/page.html');
    const result = getBaseUrl(doc, url);
    assert.equal(result, 'https://example.com/page.html');
  });

  it('should return undefined if no base tag and no document URL', () => {
    const html = '<html><head></head></html>';
    const doc = parseHTML(html);

    const result = getBaseUrl(doc);
    assert.equal(result, undefined);
  });

  it('should return base href as-is if no document URL provided', () => {
    const html = '<html><head><base href="https://example.com/base/"></head></html>';
    const doc = parseHTML(html);

    const result = getBaseUrl(doc);
    assert.equal(result, 'https://example.com/base/');
  });

  it('should return relative base href as-is if no document URL', () => {
    const html = '<html><head><base href="/relative/"></head></html>';
    const doc = parseHTML(html);

    const result = getBaseUrl(doc);
    assert.equal(result, '/relative/');
  });

  it('should handle invalid base href gracefully', () => {
    const html = '<html><head><base href="not-a-valid-url"></head></html>';
    const doc = parseHTML(html);

    const result = getBaseUrl(doc, 'https://example.com/page.html');
    // Should return the base href even if invalid
    assert.ok(result);
  });
});
