/**
 * Tests for icon extraction and aggregation.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractBestIcon } from './icon.js';

describe('extractBestIcon', () => {
  it('should prioritize largest Apple Touch Icon', () => {
    const html = `
      <html>
        <head>
          <link rel="apple-touch-icon" sizes="57x57" href="/icon-57.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
          <link rel="apple-touch-icon" sizes="120x120" href="/icon-120.png" />
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const icon = extractBestIcon(doc);
    // Should pick the largest Apple Touch Icon (180x180)
    assert.strictEqual(icon, '/icon-180.png');
  });

  it('should prefer "any" size Apple Touch Icon', () => {
    const html = `
      <html>
        <head>
          <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
          <link rel="apple-touch-icon" sizes="any" href="/icon-any.svg" />
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const icon = extractBestIcon(doc);
    // "any" should be treated as largest (SVG)
    assert.strictEqual(icon, '/icon-any.svg');
  });

  it('should fall back to Safari mask icon', () => {
    const html = `
      <html>
        <head>
          <link rel="mask-icon" href="/mask-icon.svg" color="#000000" />
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const icon = extractBestIcon(doc);
    // Should prefer mask icon over favicon
    assert.strictEqual(icon, '/mask-icon.svg');
  });

  it('should fall back to standard favicon', () => {
    const html = `
      <html>
        <head>
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const icon = extractBestIcon(doc);
    assert.strictEqual(icon, '/favicon.ico');
  });

  it('should fall back to shortcut icon (legacy)', () => {
    const html = `
      <html>
        <head>
          <link rel="shortcut icon" href="/shortcut.ico" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const icon = extractBestIcon(doc);
    assert.strictEqual(icon, '/shortcut.ico');
  });

  it('should fall back to MS tile image', () => {
    const html = `
      <html>
        <head>
          <meta name="msapplication-TileImage" content="/tile.png" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const icon = extractBestIcon(doc);
    assert.strictEqual(icon, '/tile.png');
  });

  it('should fall back to fluid icon (legacy)', () => {
    const html = `
      <html>
        <head>
          <link rel="fluid-icon" href="/fluid-icon.png" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const icon = extractBestIcon(doc);
    assert.strictEqual(icon, '/fluid-icon.png');
  });

  it('should prefer Apple Touch Icon over Safari mask icon', () => {
    const html = `
      <html>
        <head>
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
          <link rel="mask-icon" href="/mask-icon.svg" color="#000000" />
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const icon = extractBestIcon(doc);
    assert.strictEqual(icon, '/apple-icon.png');
  });

  it('should prefer Safari mask icon over favicon', () => {
    const html = `
      <html>
        <head>
          <link rel="mask-icon" href="/mask-icon.svg" color="#000000" />
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const icon = extractBestIcon(doc);
    assert.strictEqual(icon, '/mask-icon.svg');
  });

  it('should prefer favicon over shortcut icon', () => {
    const html = `
      <html>
        <head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="shortcut icon" href="/shortcut.ico" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const icon = extractBestIcon(doc);
    assert.strictEqual(icon, '/favicon.ico');
  });

  it('should return undefined when no icons found', () => {
    const html = `
      <html>
        <head></head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const icon = extractBestIcon(doc);
    assert.strictEqual(icon, undefined);
  });

  it('should handle whitespace in icon URLs', () => {
    const html = `
      <html>
        <head>
          <link rel="icon" href="  /favicon.ico  " />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const icon = extractBestIcon(doc);
    assert.strictEqual(icon, '/favicon.ico');
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
    const icon = extractBestIcon(doc);
    assert.strictEqual(icon, '/icon.png');
  });

  it('should handle complete priority chain', () => {
    const html = `
      <html>
        <head>
          <link rel="fluid-icon" href="/fluid.png" />
          <meta name="msapplication-TileImage" content="/tile.png" />
          <link rel="shortcut icon" href="/shortcut.ico" />
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const icon = extractBestIcon(doc);
    // Should prefer favicon (highest priority among these)
    assert.strictEqual(icon, '/favicon.ico');
  });

  it('should handle all icon types present', () => {
    const html = `
      <html>
        <head>
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
          <link rel="mask-icon" href="/mask-icon.svg" color="#000000" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="shortcut icon" href="/shortcut.ico" />
          <meta name="msapplication-TileImage" content="/tile.png" />
          <link rel="fluid-icon" href="/fluid.png" />
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const icon = extractBestIcon(doc);
    // Should prefer Apple Touch Icon (highest priority)
    assert.strictEqual(icon, '/apple-icon.png');
  });
});
