/**
 * Tests for description extraction and aggregation.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractBestDescription } from './description.js';

describe('extractBestDescription', () => {
  it('should prioritize Schema.org NewsArticle description', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "NewsArticle",
            "description": "High-quality Schema.org article description with detailed information about the content."
          }
          </script>
          <meta property="og:description" content="Short OG desc" />
          <meta name="description" content="Short meta desc" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const description = extractBestDescription(doc);
    assert.strictEqual(
      description,
      'High-quality Schema.org article description with detailed information about the content.',
    );
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
                "description": "Article description from graph structure."
              },
              {
                "@type": "WebPage",
                "description": "WebPage description"
              }
            ]
          }
          </script>
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const description = extractBestDescription(doc);
    assert.strictEqual(description, 'Article description from graph structure.');
  });

  it('should extract OpenGraph description when available', () => {
    const html = `
      <html>
        <head>
          <meta property="og:description" content="This is an OpenGraph description." />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const description = extractBestDescription(doc);
    assert.strictEqual(description, 'This is an OpenGraph description.');
  });

  it('should extract Twitter description when available', () => {
    const html = `
      <html>
        <head>
          <meta name="twitter:description" content="This is a Twitter Card description." />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const description = extractBestDescription(doc);
    assert.strictEqual(description, 'This is a Twitter Card description.');
  });

  it('should extract HTML meta description', () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="This is a standard meta description." />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const description = extractBestDescription(doc);
    assert.strictEqual(description, 'This is a standard meta description.');
  });

  it('should pick the longest description from multiple sources', () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="Short description." />
          <meta property="og:description" content="Medium length OpenGraph description here." />
          <meta name="twitter:description" content="Very long and detailed Twitter Card description with lots of information." />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const description = extractBestDescription(doc);
    assert.strictEqual(
      description,
      'Very long and detailed Twitter Card description with lots of information.',
    );
  });

  it('should handle multiple sources with same length', () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="First description here." />
          <meta property="og:description" content="Other description text." />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const description = extractBestDescription(doc);
    // Should return one of them (both similar length)
    assert.ok(description?.includes('description'));
  });

  it('should return undefined when no descriptions found', () => {
    const html = `
      <html>
        <head></head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const description = extractBestDescription(doc);
    assert.strictEqual(description, undefined);
  });

  it('should handle empty/whitespace descriptions', () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="   " />
          <meta property="og:description" content="" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const description = extractBestDescription(doc);
    assert.strictEqual(description, undefined);
  });

  it('should trim whitespace from descriptions', () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="  Trimmed description  " />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const description = extractBestDescription(doc);
    assert.strictEqual(description, 'Trimmed description');
  });

  it('should not look in body content', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <p>This is body text that should not be used as description.</p>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const description = extractBestDescription(doc);
    assert.strictEqual(description, undefined);
  });

  it('should prefer longer social descriptions over short meta tags', () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="Short." />
          <meta property="og:description" content="This is a much longer and more detailed OpenGraph description that provides substantial information about the content." />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const description = extractBestDescription(doc);
    assert.ok(description && description.length > 50);
    assert.ok(description?.includes('substantial'));
  });
});
