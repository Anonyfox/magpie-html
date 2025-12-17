/**
 * Tests for image/keyvisual extraction and aggregation.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractBestImage } from './image.js';

describe('extractBestImage', () => {
  it('should prioritize Schema.org NewsArticle image (string URL)', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "NewsArticle",
            "image": "https://example.com/schema-image.jpg"
          }
          </script>
          <meta property="og:image" content="https://example.com/og-image.jpg" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    assert.strictEqual(image, 'https://example.com/schema-image.jpg');
  });

  it('should handle Schema.org ImageObject with url property', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "NewsArticle",
            "image": {
              "@type": "ImageObject",
              "url": "https://example.com/image-object.jpg",
              "width": 1200,
              "height": 630
            }
          }
          </script>
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    assert.strictEqual(image, 'https://example.com/image-object.jpg');
  });

  it('should pick largest from array of ImageObjects', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "NewsArticle",
            "image": [
              {
                "@type": "ImageObject",
                "url": "https://example.com/small.jpg",
                "width": "300",
                "height": "200"
              },
              {
                "@type": "ImageObject",
                "url": "https://example.com/large.jpg",
                "width": "1200",
                "height": "800"
              },
              {
                "@type": "ImageObject",
                "url": "https://example.com/medium.jpg",
                "width": 600,
                "height": 400
              }
            ]
          }
          </script>
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    // Should pick the largest (1200x800 = 960000 pixels)
    assert.strictEqual(image, 'https://example.com/large.jpg');
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
                "image": "https://example.com/article-image.jpg"
              },
              {
                "@type": "WebPage",
                "image": "https://example.com/page-image.jpg"
              }
            ]
          }
          </script>
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    // Should prefer Article over WebPage
    assert.strictEqual(image, 'https://example.com/article-image.jpg');
  });

  it('should extract OpenGraph image when available', () => {
    const html = `
      <html>
        <head>
          <meta property="og:image" content="https://example.com/og-image.jpg" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    assert.strictEqual(image, 'https://example.com/og-image.jpg');
  });

  it('should extract Twitter Card image when available', () => {
    const html = `
      <html>
        <head>
          <meta name="twitter:image" content="https://example.com/twitter-image.jpg" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    assert.strictEqual(image, 'https://example.com/twitter-image.jpg');
  });

  it('should prefer OpenGraph over Twitter Card', () => {
    const html = `
      <html>
        <head>
          <meta property="og:image" content="https://example.com/og-image.jpg" />
          <meta name="twitter:image" content="https://example.com/twitter-image.jpg" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    assert.strictEqual(image, 'https://example.com/og-image.jpg');
  });

  it('should fall back to Apple Touch Icon', () => {
    const html = `
      <html>
        <head>
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    assert.strictEqual(image, '/apple-icon.png');
  });

  it('should pick largest Apple Touch Icon', () => {
    const html = `
      <html>
        <head>
          <link rel="apple-touch-icon" sizes="57x57" href="/icon-57.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
          <link rel="apple-touch-icon" sizes="120x120" href="/icon-120.png" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    assert.strictEqual(image, '/icon-180.png');
  });

  it('should fall back to favicon', () => {
    const html = `
      <html>
        <head>
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    assert.strictEqual(image, '/favicon.ico');
  });

  it('should prefer social images over favicon', () => {
    const html = `
      <html>
        <head>
          <link rel="icon" href="/favicon.ico" />
          <meta property="og:image" content="https://example.com/social.jpg" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    assert.strictEqual(image, 'https://example.com/social.jpg');
  });

  it('should prefer social images over Apple Touch Icon', () => {
    const html = `
      <html>
        <head>
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
          <meta name="twitter:image" content="https://example.com/twitter.jpg" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    assert.strictEqual(image, 'https://example.com/twitter.jpg');
  });

  it('should return undefined when no images found', () => {
    const html = `
      <html>
        <head></head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    assert.strictEqual(image, undefined);
  });

  it('should handle empty/whitespace image URLs', () => {
    const html = `
      <html>
        <head>
          <meta property="og:image" content="   " />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    assert.strictEqual(image, undefined);
  });

  it('should trim whitespace from image URLs', () => {
    const html = `
      <html>
        <head>
          <meta property="og:image" content="  https://example.com/image.jpg  " />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    assert.strictEqual(image, 'https://example.com/image.jpg');
  });

  it('should handle Apple Touch Icon without sizes', () => {
    const html = `
      <html>
        <head>
          <link rel="apple-touch-icon" href="/icon.png" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    assert.strictEqual(image, '/icon.png');
  });

  it('should handle "any" size for Apple Touch Icon', () => {
    const html = `
      <html>
        <head>
          <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
          <link rel="apple-touch-icon" sizes="any" href="/icon-any.svg" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    // "any" should be treated as largest
    assert.strictEqual(image, '/icon-any.svg');
  });

  it('should handle complete priority chain', () => {
    const html = `
      <html>
        <head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const image = extractBestImage(doc);
    // Should prefer Apple Touch Icon over favicon
    assert.strictEqual(image, '/apple-icon.png');
  });
});
