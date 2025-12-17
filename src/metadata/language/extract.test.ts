import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractLanguage } from './extract.js';

describe('extractLanguage', () => {
  it('should extract HTML lang attribute', () => {
    const html = '<html lang="en"><head></head></html>';
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.equal(result.htmlLang, 'en');
    assert.equal(result.primary, 'en');
  });

  it('should extract HTML lang with region', () => {
    const html = '<html lang="en-US"><head></head></html>';
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.equal(result.htmlLang, 'en-US');
    assert.equal(result.primary, 'en');
    assert.equal(result.region, 'US');
  });

  it('should extract content-language from http-equiv', () => {
    const html = '<meta http-equiv="content-language" content="de">';
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.equal(result.contentLanguage, 'de');
    assert.equal(result.primary, 'de');
  });

  it('should extract content-language from name attribute', () => {
    const html = '<meta name="content-language" content="fr">';
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.equal(result.contentLanguage, 'fr');
    assert.equal(result.primary, 'fr');
  });

  it('should extract OpenGraph locale', () => {
    const html = '<meta property="og:locale" content="en_US">';
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.equal(result.ogLocale, 'en_US');
    assert.equal(result.primary, 'en');
    assert.equal(result.region, 'US');
  });

  it('should extract OpenGraph alternate locales', () => {
    const html = `
      <meta property="og:locale" content="en_US">
      <meta property="og:locale:alternate" content="fr_FR">
      <meta property="og:locale:alternate" content="de_DE">
      <meta property="og:locale:alternate" content="es_ES">
    `;
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.equal(result.ogLocale, 'en_US');
    assert.ok(result.alternateLocales);
    assert.equal(result.alternateLocales.length, 3);
    assert.deepEqual(result.alternateLocales, ['fr_FR', 'de_DE', 'es_ES']);
  });

  it('should prefer HTML lang for primary language', () => {
    const html = `
      <html lang="de-DE">
        <head>
          <meta http-equiv="content-language" content="en">
          <meta property="og:locale" content="fr_FR">
        </head>
      </html>
    `;
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.equal(result.htmlLang, 'de-DE');
    assert.equal(result.contentLanguage, 'en');
    assert.equal(result.ogLocale, 'fr_FR');
    // Should use HTML lang for primary
    assert.equal(result.primary, 'de');
    assert.equal(result.region, 'DE');
  });

  it('should handle underscore separator in language codes', () => {
    const html = '<html lang="pt_BR"><head></head></html>';
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.equal(result.primary, 'pt');
    assert.equal(result.region, 'BR');
  });

  it('should handle hyphen separator in language codes', () => {
    const html = '<html lang="zh-CN"><head></head></html>';
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.equal(result.primary, 'zh');
    assert.equal(result.region, 'CN');
  });

  it('should normalize region code to uppercase', () => {
    const html = '<html lang="en-us"><head></head></html>';
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.equal(result.region, 'US');
  });

  it('should normalize language code to lowercase', () => {
    const html = '<html lang="EN-US"><head></head></html>';
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.equal(result.primary, 'en');
    assert.equal(result.region, 'US');
  });

  it('should return empty object if no language metadata found', () => {
    const html = '<html><head><title>No Language</title></head></html>';
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.deepEqual(result, {});
  });

  it('should handle language code without region', () => {
    const html = '<html lang="ja"><head></head></html>';
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.equal(result.primary, 'ja');
    assert.equal(result.region, undefined);
  });

  it('should extract complete language metadata', () => {
    const html = `
      <html lang="en-GB">
        <head>
          <meta http-equiv="content-language" content="en">
          <meta property="og:locale" content="en_GB">
          <meta property="og:locale:alternate" content="en_US">
          <meta property="og:locale:alternate" content="fr_FR">
        </head>
      </html>
    `;
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.equal(result.htmlLang, 'en-GB');
    assert.equal(result.contentLanguage, 'en');
    assert.equal(result.ogLocale, 'en_GB');
    assert.deepEqual(result.alternateLocales, ['en_US', 'fr_FR']);
    assert.equal(result.primary, 'en');
    assert.equal(result.region, 'GB');
  });

  it('should handle three-letter language codes', () => {
    const html = '<html lang="eng"><head></head></html>';
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    assert.equal(result.primary, 'eng');
  });

  it('should handle script subtags', () => {
    const html = '<html lang="zh-Hans-CN"><head></head></html>';
    const doc = parseHTML(html);

    const result = extractLanguage(doc);

    // Should extract zh as primary
    assert.equal(result.primary, 'zh');
    // Should extract Hans as "region" (though it's really a script)
    assert.equal(result.region, 'HANS');
  });
});
