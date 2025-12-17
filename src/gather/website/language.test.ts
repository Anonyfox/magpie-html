/**
 * Tests for language extraction and aggregation.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractBestLanguage } from './language.js';

describe('extractBestLanguage', () => {
  it('should extract language from HTML lang attribute', () => {
    const html = `
      <html lang="en-US">
        <head><title>Test</title></head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const lang = extractBestLanguage(doc);

    assert.strictEqual(lang.language, 'en');
    assert.strictEqual(lang.region, 'US');
  });

  it('should extract language without region', () => {
    const html = `
      <html lang="en">
        <head><title>Test</title></head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const lang = extractBestLanguage(doc);

    assert.strictEqual(lang.language, 'en');
    assert.strictEqual(lang.region, undefined);
  });

  it('should fall back to content-language meta tag', () => {
    const html = `
      <html>
        <head>
          <meta name="content-language" content="de-DE" />
          <title>Test</title>
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const lang = extractBestLanguage(doc);

    assert.strictEqual(lang.language, 'de');
    assert.strictEqual(lang.region, 'DE');
  });

  it('should fall back to OpenGraph locale', () => {
    const html = `
      <html>
        <head>
          <meta property="og:locale" content="fr_FR" />
          <title>Test</title>
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const lang = extractBestLanguage(doc);

    assert.strictEqual(lang.language, 'fr');
    assert.strictEqual(lang.region, 'FR');
  });

  it('should prioritize HTML lang over meta tags', () => {
    const html = `
      <html lang="en-GB">
        <head>
          <meta name="content-language" content="de-DE" />
          <meta property="og:locale" content="fr_FR" />
          <title>Test</title>
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const lang = extractBestLanguage(doc);

    assert.strictEqual(lang.language, 'en');
    assert.strictEqual(lang.region, 'GB');
  });

  it('should handle lowercase region codes', () => {
    const html = `
      <html lang="en-us">
        <head><title>Test</title></head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const lang = extractBestLanguage(doc);

    assert.strictEqual(lang.language, 'en');
    assert.strictEqual(lang.region, 'US'); // Should be normalized to uppercase
  });

  it('should handle underscore separator', () => {
    const html = `
      <html lang="pt_BR">
        <head><title>Test</title></head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const lang = extractBestLanguage(doc);

    assert.strictEqual(lang.language, 'pt');
    assert.strictEqual(lang.region, 'BR');
  });

  it('should return undefined properties when no language found', () => {
    const html = `
      <html>
        <head><title>Test</title></head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const lang = extractBestLanguage(doc);

    assert.strictEqual(lang.language, undefined);
    assert.strictEqual(lang.region, undefined);
  });

  it('should handle various language codes', () => {
    const testCases = [
      { input: 'ja', expected: { language: 'ja', region: undefined } },
      { input: 'ja-JP', expected: { language: 'ja', region: 'JP' } },
      { input: 'zh-CN', expected: { language: 'zh', region: 'CN' } },
      { input: 'zh-TW', expected: { language: 'zh', region: 'TW' } },
      { input: 'es-MX', expected: { language: 'es', region: 'MX' } },
      { input: 'ar-SA', expected: { language: 'ar', region: 'SA' } },
    ];

    for (const testCase of testCases) {
      const html = `
        <html lang="${testCase.input}">
          <head><title>Test</title></head>
          <body></body>
        </html>
      `;
      const doc = parseHTML(html);
      const lang = extractBestLanguage(doc);

      assert.strictEqual(lang.language, testCase.expected.language, `Failed for ${testCase.input}`);
      assert.strictEqual(lang.region, testCase.expected.region, `Failed for ${testCase.input}`);
    }
  });

  it('should handle whitespace in language codes', () => {
    const html = `
      <html lang="  en-US  ">
        <head><title>Test</title></head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const lang = extractBestLanguage(doc);

    assert.strictEqual(lang.language, 'en');
    assert.strictEqual(lang.region, 'US');
  });

  it('should handle http-equiv content-language', () => {
    const html = `
      <html>
        <head>
          <meta http-equiv="content-language" content="it-IT" />
          <title>Test</title>
        </head>
        <body></body>
      </html>
    `;
    const doc = parseHTML(html);
    const lang = extractBestLanguage(doc);

    assert.strictEqual(lang.language, 'it');
    assert.strictEqual(lang.region, 'IT');
  });
});
