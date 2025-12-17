import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from './html-parser.js';

describe('parseHTML', () => {
  it('should parse valid HTML', () => {
    const html = '<html><head><title>Test</title></head><body>Content</body></html>';
    const doc = parseHTML(html);

    const title = doc.querySelector('title');
    assert.equal(title?.text, 'Test');

    const body = doc.querySelector('body');
    assert.equal(body?.text, 'Content');
  });

  it('should parse malformed HTML', () => {
    const html = '<div><p>Unclosed paragraph<div>Nested</div>';
    const doc = parseHTML(html);

    // Should not throw
    const div = doc.querySelector('div');
    assert.ok(div);
  });

  it('should handle empty string', () => {
    const doc = parseHTML('');
    assert.ok(doc);
  });

  it('should handle HTML fragments', () => {
    const html = '<meta name="description" content="Test">';
    const doc = parseHTML(html);

    const meta = doc.querySelector('meta');
    assert.equal(meta?.getAttribute('name'), 'description');
    assert.equal(meta?.getAttribute('content'), 'Test');
  });

  it('should parse meta tags in head', () => {
    const html = `
      <html>
        <head>
          <meta name="keywords" content="test, html">
          <meta property="og:title" content="Test Title">
        </head>
      </html>
    `;
    const doc = parseHTML(html);

    const meta1 = doc.querySelector('meta[name="keywords"]');
    const meta2 = doc.querySelector('meta[property="og:title"]');

    assert.equal(meta1?.getAttribute('content'), 'test, html');
    assert.equal(meta2?.getAttribute('content'), 'Test Title');
  });

  it('should parse link tags', () => {
    const html = `
      <html>
        <head>
          <link rel="canonical" href="https://example.com/page">
          <link rel="alternate" hreflang="fr" href="/fr">
        </head>
      </html>
    `;
    const doc = parseHTML(html);

    const canonical = doc.querySelector('link[rel="canonical"]');
    const alternate = doc.querySelector('link[rel="alternate"]');

    assert.equal(canonical?.getAttribute('href'), 'https://example.com/page');
    assert.equal(alternate?.getAttribute('hreflang'), 'fr');
  });
});
