/**
 * Tests for URL determination.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractBestUrl } from './url.js';

describe('extractBestUrl', () => {
  it('should extract canonical URL when available', () => {
    const html = `
      <html>
        <head>
          <link rel="canonical" href="https://example.com/canonical-page" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const url = extractBestUrl(doc, 'https://example.com/other-page');
    assert.strictEqual(url, 'https://example.com/canonical-page');
  });

  it('should prefer canonical over final URL', () => {
    const html = `
      <html>
        <head>
          <link rel="canonical" href="https://example.com/canonical" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const url = extractBestUrl(doc, 'https://example.com/redirect-target');
    assert.strictEqual(url, 'https://example.com/canonical');
  });

  it('should fall back to final URL when no canonical', () => {
    const html = `
      <html>
        <head></head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const url = extractBestUrl(doc, 'https://example.com/final-url');
    assert.strictEqual(url, 'https://example.com/final-url');
  });

  it('should handle empty canonical URL', () => {
    const html = `
      <html>
        <head>
          <link rel="canonical" href="" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const url = extractBestUrl(doc, 'https://example.com/final-url');
    assert.strictEqual(url, 'https://example.com/final-url');
  });

  it('should handle whitespace-only canonical URL', () => {
    const html = `
      <html>
        <head>
          <link rel="canonical" href="   " />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const url = extractBestUrl(doc, 'https://example.com/final-url');
    assert.strictEqual(url, 'https://example.com/final-url');
  });

  it('should trim whitespace from canonical URL', () => {
    const html = `
      <html>
        <head>
          <link rel="canonical" href="  https://example.com/canonical  " />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const url = extractBestUrl(doc, 'https://example.com/final-url');
    assert.strictEqual(url, 'https://example.com/canonical');
  });

  it('should handle canonical URL with query parameters', () => {
    const html = `
      <html>
        <head>
          <link rel="canonical" href="https://example.com/page?utm_source=test" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const url = extractBestUrl(doc, 'https://example.com/page?utm_source=other&utm_campaign=test');
    // Should prefer canonical (cleaner URL)
    assert.strictEqual(url, 'https://example.com/page?utm_source=test');
  });

  it('should handle relative canonical URL', () => {
    const html = `
      <html>
        <head>
          <link rel="canonical" href="/canonical-path" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const url = extractBestUrl(doc, 'https://example.com/other-path');
    // Note: extractCanonical should handle URL normalization
    assert.ok(url.includes('canonical-path'));
  });

  it('should handle multiple canonical tags (takes first)', () => {
    const html = `
      <html>
        <head>
          <link rel="canonical" href="https://example.com/first-canonical" />
          <link rel="canonical" href="https://example.com/second-canonical" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const url = extractBestUrl(doc, 'https://example.com/final-url');
    // Should use first canonical
    assert.strictEqual(url, 'https://example.com/first-canonical');
  });
});
