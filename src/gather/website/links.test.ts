/**
 * Tests for links extraction and aggregation.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractPageLinks } from './links.js';

describe('extractPageLinks', () => {
  it('should separate internal and external links', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <a href="https://example.com/about">About</a>
          <a href="https://example.com/contact">Contact</a>
          <a href="https://other.com">External</a>
          <a href="https://twitter.com/example">Twitter</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const { internal, external } = extractPageLinks(doc, 'https://example.com/page');

    assert.strictEqual(internal.length, 2);
    assert.ok(internal.includes('https://example.com/about'));
    assert.ok(internal.includes('https://example.com/contact'));

    assert.strictEqual(external.length, 2);
    assert.ok(external.includes('https://other.com/'));
    assert.ok(external.includes('https://twitter.com/example'));
  });

  it('should exclude current page URL from internal links', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <a href="https://example.com/current-page">Self link</a>
          <a href="https://example.com/other-page">Other page</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const { internal, external } = extractPageLinks(doc, 'https://example.com/current-page');

    // Should only include other-page, not current-page
    assert.strictEqual(internal.length, 1);
    assert.strictEqual(internal[0], 'https://example.com/other-page');
    assert.strictEqual(external.length, 0);
  });

  it('should exclude self-references with query parameters', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <a href="https://example.com/page">Same page (no query)</a>
          <a href="https://example.com/page?utm_source=test">Same page (with query)</a>
          <a href="https://example.com/other">Other page</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const { internal, external } = extractPageLinks(
      doc,
      'https://example.com/page?utm_campaign=newsletter',
    );

    // All three have same pathname, should exclude all self-references
    assert.strictEqual(internal.length, 1);
    assert.strictEqual(internal[0], 'https://example.com/other');
    assert.strictEqual(external.length, 0);
  });

  it('should exclude self-references with hash fragments', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <a href="https://example.com/page#section1">Section 1</a>
          <a href="https://example.com/page#section2">Section 2</a>
          <a href="https://example.com/other">Other page</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const { internal, external } = extractPageLinks(doc, 'https://example.com/page');

    // Hash-only links are excluded by default, but #section links with full URL
    // should be detected as self-references
    assert.strictEqual(internal.length, 1);
    assert.strictEqual(internal[0], 'https://example.com/other');
    assert.strictEqual(external.length, 0);
  });

  it('should handle relative URLs', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <a href="/about">About (relative)</a>
          <a href="/contact">Contact (relative)</a>
          <a href="https://external.com">External</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const { internal, external } = extractPageLinks(doc, 'https://example.com/page');

    assert.strictEqual(internal.length, 2);
    assert.ok(internal.includes('https://example.com/about'));
    assert.ok(internal.includes('https://example.com/contact'));

    assert.strictEqual(external.length, 1);
    assert.strictEqual(external[0], 'https://external.com/');
  });

  it('should deduplicate links', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <a href="https://example.com/about">About 1</a>
          <a href="https://example.com/about">About 2</a>
          <a href="https://example.com/about">About 3</a>
          <a href="https://external.com">External 1</a>
          <a href="https://external.com">External 2</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const { internal, external } = extractPageLinks(doc, 'https://example.com/page');

    // Should deduplicate
    assert.strictEqual(internal.length, 1);
    assert.strictEqual(internal[0], 'https://example.com/about');

    assert.strictEqual(external.length, 1);
    assert.strictEqual(external[0], 'https://external.com/');
  });

  it('should return empty arrays when no links found', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <p>No links here</p>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const { internal, external } = extractPageLinks(doc, 'https://example.com/page');

    assert.strictEqual(internal.length, 0);
    assert.strictEqual(external.length, 0);
  });

  it('should handle page with only self-references', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <a href="https://example.com/page">Link 1</a>
          <a href="https://example.com/page">Link 2</a>
          <a href="https://example.com/page#top">Link 3</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const { internal, external } = extractPageLinks(doc, 'https://example.com/page');

    // All links point to current page, should be excluded
    assert.strictEqual(internal.length, 0);
    assert.strictEqual(external.length, 0);
  });

  it('should handle mixed internal and external with self-references', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <a href="https://example.com/current">Current</a>
          <a href="https://example.com/page1">Page 1</a>
          <a href="https://example.com/page2">Page 2</a>
          <a href="https://external1.com">External 1</a>
          <a href="https://external2.com">External 2</a>
          <a href="https://example.com/current?ref=link">Current with query</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const { internal, external } = extractPageLinks(doc, 'https://example.com/current');

    // Should exclude both self-references
    assert.strictEqual(internal.length, 2);
    assert.ok(internal.includes('https://example.com/page1'));
    assert.ok(internal.includes('https://example.com/page2'));

    assert.strictEqual(external.length, 2);
    assert.ok(external.includes('https://external1.com/'));
    assert.ok(external.includes('https://external2.com/'));
  });

  it('should handle subdomain as external', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <a href="https://example.com/page1">Same domain</a>
          <a href="https://subdomain.example.com/page">Subdomain</a>
          <a href="https://other.com">Other domain</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const { internal, external } = extractPageLinks(doc, 'https://example.com/current');

    assert.strictEqual(internal.length, 1);
    assert.strictEqual(internal[0], 'https://example.com/page1');

    // Subdomain should be treated as external
    assert.strictEqual(external.length, 2);
    assert.ok(external.includes('https://subdomain.example.com/page'));
    assert.ok(external.includes('https://other.com/'));
  });
});
