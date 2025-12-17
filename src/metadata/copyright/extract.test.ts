import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractCopyright } from './extract.js';

describe('extractCopyright', () => {
  it('should extract copyright from meta tag', () => {
    const html = '<meta name="copyright" content="© 2024 Example Company">';
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.copyright, '© 2024 Example Company');
    assert.equal(result.year, '2024');
    assert.equal(result.holder, 'Example Company');
  });

  it('should extract license from link tag', () => {
    const html = '<link rel="license" href="https://creativecommons.org/licenses/by/4.0/">';
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.license, 'https://creativecommons.org/licenses/by/4.0/');
  });

  it('should extract both copyright and license', () => {
    const html = `
      <meta name="copyright" content="© 2024 My Company">
      <link rel="license" href="https://opensource.org/licenses/MIT">
    `;
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.copyright, '© 2024 My Company');
    assert.equal(result.license, 'https://opensource.org/licenses/MIT');
    assert.equal(result.year, '2024');
    assert.equal(result.holder, 'My Company');
  });

  it('should extract from Dublin Core rights', () => {
    const html = '<meta name="DC.rights" content="© 2024 Dublin Core Publisher">';
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.copyright, '© 2024 Dublin Core Publisher');
  });

  it('should prefer copyright meta over DC.rights', () => {
    const html = `
      <meta name="copyright" content="© 2024 Copyright Holder">
      <meta name="DC.rights" content="© 2024 DC Rights Holder">
    `;
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.copyright, '© 2024 Copyright Holder');
    assert.equal(result.holder, 'Copyright Holder');
  });

  it('should parse year from copyright string', () => {
    const html = '<meta name="copyright" content="Copyright 2023 Test Company">';
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.year, '2023');
  });

  it('should parse holder from copyright string', () => {
    const html = '<meta name="copyright" content="Copyright 2024 John Doe">';
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.holder, 'John Doe');
  });

  it('should handle (c) format', () => {
    const html = '<meta name="copyright" content="(c) 2024 Company Inc.">';
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.year, '2024');
    assert.equal(result.holder, 'Company Inc.');
  });

  it('should handle year range', () => {
    const html = '<meta name="copyright" content="© 2020-2024 Example Corp">';
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    // Should extract first year found
    assert.equal(result.year, '2020');
  });

  it('should return empty object if no copyright metadata', () => {
    const html = '<html><head><title>No Copyright</title></head></html>';
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.deepEqual(result, {});
  });

  it('should handle complex copyright notice', () => {
    const html = `
      <meta name="copyright" content="© 2024 Acme Corporation. All rights reserved.">
    `;
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.year, '2024');
    assert.ok(result.holder?.includes('Acme Corporation'));
  });

  it('should extract Creative Commons license', () => {
    const html = '<link rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/">';
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.license, 'https://creativecommons.org/licenses/by-sa/4.0/');
  });

  it('should handle MIT license link', () => {
    const html = '<link rel="license" href="/LICENSE">';
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.license, '/LICENSE');
  });

  it('should handle dcterms.rights', () => {
    const html = '<meta name="dcterms.rights" content="© 2024 Publisher Name">';
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.copyright, '© 2024 Publisher Name');
  });

  it('should handle year in various formats', () => {
    const html = '<meta name="copyright" content="Copyright © 2024 Company">';
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.year, '2024');
    assert.equal(result.holder, 'Company');
  });

  it('should handle missing year gracefully', () => {
    const html = '<meta name="copyright" content="© Example Company">';
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.copyright, '© Example Company');
    assert.equal(result.holder, 'Example Company');
    assert.equal(result.year, undefined);
  });

  it('should handle missing holder gracefully', () => {
    const html = '<meta name="copyright" content="© 2024">';
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.year, '2024');
    // Holder should be undefined or empty
  });

  it('should extract complete copyright metadata', () => {
    const html = `
      <head>
        <meta name="copyright" content="© 2024 Tech Blog Publishing">
        <link rel="license" href="https://creativecommons.org/licenses/by-nc/4.0/">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractCopyright(doc);

    assert.equal(result.copyright, '© 2024 Tech Blog Publishing');
    assert.equal(result.license, 'https://creativecommons.org/licenses/by-nc/4.0/');
    assert.equal(result.year, '2024');
    assert.equal(result.holder, 'Tech Blog Publishing');
  });
});
