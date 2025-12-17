/**
 * Tests for title extraction and aggregation.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractBestTitle } from './title.js';

describe('extractBestTitle', () => {
  it('should prioritize Schema.org NewsArticle headline', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "NewsArticle",
            "headline": "Schema.org Clean Headline"
          }
          </script>
          <meta property="og:title" content="OG Title | Brand" />
          <title>HTML Title | Brand</title>
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const title = extractBestTitle(doc);
    assert.strictEqual(title, 'Schema.org Clean Headline');
  });

  it('should handle Schema.org with @graph array', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "NewsArticle",
                "headline": "Article from Graph"
              },
              {
                "@type": "WebPage",
                "name": "Page Name"
              }
            ]
          }
          </script>
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const title = extractBestTitle(doc);
    assert.strictEqual(title, 'Article from Graph');
  });

  it('should fall back to WebPage name if no Article', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "WebPage",
            "name": "WebPage Title"
          }
          </script>
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const title = extractBestTitle(doc);
    assert.strictEqual(title, 'WebPage Title');
  });

  it('should extract OpenGraph title when available', () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Article Title" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const title = extractBestTitle(doc);
    assert.strictEqual(title, 'Article Title');
  });

  it('should extract Twitter title when available', () => {
    const html = `
      <html>
        <head>
          <meta name="twitter:title" content="Tweet Title" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const title = extractBestTitle(doc);
    assert.strictEqual(title, 'Tweet Title');
  });

  it('should extract HTML title tag', () => {
    const html = `
      <html>
        <head>
          <title>Page Title</title>
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const title = extractBestTitle(doc);
    assert.strictEqual(title, 'Page Title');
  });

  it('should extract first h1 as fallback', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <h1>Main Heading</h1>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const title = extractBestTitle(doc);
    assert.strictEqual(title, 'Main Heading');
  });

  it('should clean brand suffixes from titles', () => {
    const html = `
      <html>
        <head>
          <title>Article Title | Brand Name</title>
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const title = extractBestTitle(doc);
    assert.strictEqual(title, 'Article Title');
  });

  it('should pick the longest cleaned title from multiple sources', () => {
    const html = `
      <html>
        <head>
          <title>Short | Brand</title>
          <meta property="og:title" content="Medium Title | Brand" />
          <meta name="twitter:title" content="Very Long Descriptive Title | Brand" />
        </head>
        <body>
          <h1>Tiny</h1>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const title = extractBestTitle(doc);
    assert.strictEqual(title, 'Very Long Descriptive Title');
  });

  it('should handle multiple sources with same cleaned length', () => {
    const html = `
      <html>
        <head>
          <title>First Title | Brand</title>
          <meta property="og:title" content="Other Title | Brand" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const title = extractBestTitle(doc);
    // Should return one of them (both same length after cleaning)
    assert.ok(title === 'First Title' || title === 'Other Title');
  });

  it('should return undefined when no titles found', () => {
    const html = `
      <html>
        <head></head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const title = extractBestTitle(doc);
    assert.strictEqual(title, undefined);
  });

  it('should handle empty/whitespace titles', () => {
    const html = `
      <html>
        <head>
          <title>   </title>
          <meta property="og:title" content="" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const title = extractBestTitle(doc);
    assert.strictEqual(title, undefined);
  });

  it('should prefer longer content over shorter brand-only text', () => {
    const html = `
      <html>
        <head>
          <title>CNN</title>
          <meta property="og:title" content="Breaking News Story - Important Details | CNN" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const title = extractBestTitle(doc);
    assert.strictEqual(title, 'Breaking News Story - Important Details');
  });
});
