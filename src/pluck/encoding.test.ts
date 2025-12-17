/**
 * Encoding detection and conversion tests.
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  decodeToUtf8,
  detectEncoding,
  isEncodingSupported,
  parseCharsetFromContentType,
  parseCharsetFromHtml,
} from './encoding.js';

describe('parseCharsetFromContentType', () => {
  it('should parse charset from standard Content-Type', () => {
    const result = parseCharsetFromContentType('text/html; charset=utf-8');
    assert.equal(result, 'utf-8');
  });

  it('should parse charset with quotes', () => {
    const result = parseCharsetFromContentType('text/html; charset="utf-8"');
    assert.equal(result, 'utf-8');
  });

  it('should parse charset with single quotes', () => {
    const result = parseCharsetFromContentType("text/html; charset='utf-8'");
    assert.equal(result, 'utf-8');
  });

  it('should parse Windows-1252', () => {
    const result = parseCharsetFromContentType('text/html; charset=windows-1252');
    assert.equal(result, 'windows-1252');
  });

  it('should handle case insensitivity', () => {
    const result = parseCharsetFromContentType('text/html; CHARSET=UTF-8');
    assert.equal(result, 'utf-8');
  });

  it('should normalize encoding aliases', () => {
    const result = parseCharsetFromContentType('text/html; charset=iso-8859-1');
    assert.equal(result, 'latin1');
  });

  it('should return null if no charset', () => {
    const result = parseCharsetFromContentType('text/html');
    assert.equal(result, null);
  });

  it('should return null for empty string', () => {
    const result = parseCharsetFromContentType('');
    assert.equal(result, null);
  });
});

describe('parseCharsetFromHtml', () => {
  it('should parse from <meta charset>', () => {
    const html = '<html><head><meta charset="utf-8"></head></html>';
    const result = parseCharsetFromHtml(html);
    assert.equal(result, 'utf-8');
  });

  it('should parse from <meta charset> without quotes', () => {
    const html = '<html><head><meta charset=utf-8></head></html>';
    const result = parseCharsetFromHtml(html);
    assert.equal(result, 'utf-8');
  });

  it('should parse from <meta http-equiv="Content-Type">', () => {
    const html =
      '<html><head><meta http-equiv="Content-Type" content="text/html; charset=windows-1252"></head></html>';
    const result = parseCharsetFromHtml(html);
    assert.equal(result, 'windows-1252');
  });

  it('should handle case insensitivity in meta tags', () => {
    const html = '<html><head><META CHARSET="UTF-8"></head></html>';
    const result = parseCharsetFromHtml(html);
    assert.equal(result, 'utf-8');
  });

  it('should find charset in attributes with extra spaces', () => {
    const html = '<html><head><meta   charset  =  "utf-8"  ></head></html>';
    const result = parseCharsetFromHtml(html);
    assert.equal(result, 'utf-8');
  });

  it('should return null if no charset found', () => {
    const html = '<html><head><title>No Charset</title></head></html>';
    const result = parseCharsetFromHtml(html);
    assert.equal(result, null);
  });

  it('should return null for empty HTML', () => {
    const result = parseCharsetFromHtml('');
    assert.equal(result, null);
  });

  it('should find first charset if multiple exist', () => {
    const html = `
      <html><head>
        <meta charset="utf-8">
        <meta charset="iso-8859-1">
      </head></html>
    `;
    const result = parseCharsetFromHtml(html);
    assert.equal(result, 'utf-8');
  });
});

describe('detectEncoding', () => {
  it('should detect UTF-8 BOM', () => {
    // UTF-8 BOM: EF BB BF
    const buffer = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x65, 0x6c, 0x6c, 0x6f]).buffer;
    const result = detectEncoding(buffer);
    assert.equal(result, 'utf-8');
  });

  it('should detect UTF-16 LE BOM', () => {
    // UTF-16 LE BOM: FF FE
    const buffer = new Uint8Array([0xff, 0xfe, 0x48, 0x00, 0x65, 0x00]).buffer;
    const result = detectEncoding(buffer);
    assert.equal(result, 'utf-16le');
  });

  it('should detect UTF-16 BE BOM', () => {
    // UTF-16 BE BOM: FE FF
    const buffer = new Uint8Array([0xfe, 0xff, 0x00, 0x48, 0x00, 0x65]).buffer;
    const result = detectEncoding(buffer);
    assert.equal(result, 'utf-16be');
  });

  it('should use Content-Type header if no BOM', () => {
    const buffer = new TextEncoder().encode('Hello').buffer;
    const result = detectEncoding(buffer, 'text/html; charset=windows-1252');
    assert.equal(result, 'windows-1252');
  });

  it('should parse charset from HTML meta if no BOM or header', () => {
    const html = '<meta charset="iso-8859-1">Hello';
    const buffer = new TextEncoder().encode(html).buffer;
    const result = detectEncoding(buffer);
    assert.equal(result, 'latin1'); // Normalized
  });

  it('should default to UTF-8 if nothing found', () => {
    const buffer = new TextEncoder().encode('Hello World').buffer;
    const result = detectEncoding(buffer);
    assert.equal(result, 'utf-8');
  });

  it('should prioritize BOM over header', () => {
    // UTF-8 BOM
    const buffer = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x65, 0x6c, 0x6c, 0x6f]).buffer;
    const result = detectEncoding(buffer, 'text/html; charset=windows-1252');
    assert.equal(result, 'utf-8'); // BOM wins
  });

  it('should prioritize header over HTML meta', () => {
    const html = '<meta charset="iso-8859-1">Hello';
    const buffer = new TextEncoder().encode(html).buffer;
    const result = detectEncoding(buffer, 'text/html; charset=utf-8');
    assert.equal(result, 'utf-8'); // Header wins
  });
});

describe('decodeToUtf8', () => {
  it('should decode UTF-8 content', () => {
    const buffer = new TextEncoder().encode('Hello World').buffer;
    const result = decodeToUtf8(buffer, 'utf-8');
    assert.equal(result, 'Hello World');
  });

  it('should decode UTF-8 with special characters', () => {
    const buffer = new TextEncoder().encode('Héllo Wörld 你好').buffer;
    const result = decodeToUtf8(buffer, 'utf-8');
    assert.equal(result, 'Héllo Wörld 你好');
  });

  it('should decode Windows-1252 content', () => {
    // Windows-1252 "Hello" with special chars
    const buffer = new Uint8Array([0x48, 0xe9, 0x6c, 0x6c, 0x6f]).buffer; // Héllo
    const result = decodeToUtf8(buffer, 'windows-1252');
    assert.equal(result, 'Héllo');
  });

  it('should decode ISO-8859-1 (latin1) content', () => {
    const buffer = new Uint8Array([0x48, 0xe9, 0x6c, 0x6c, 0x6f]).buffer; // Héllo in latin1
    const result = decodeToUtf8(buffer, 'latin1');
    assert.equal(result, 'Héllo');
  });

  it('should throw on invalid encoding if validate=true', () => {
    const buffer = new TextEncoder().encode('Hello').buffer;
    assert.throws(() => decodeToUtf8(buffer, 'invalid-encoding', true), /Failed to decode content/);
  });

  it('should fallback to UTF-8 on invalid encoding if validate=false', () => {
    const buffer = new TextEncoder().encode('Hello').buffer;
    const result = decodeToUtf8(buffer, 'invalid-encoding', false);
    assert.equal(result, 'Hello');
  });

  it('should handle empty buffer', () => {
    const buffer = new ArrayBuffer(0);
    const result = decodeToUtf8(buffer, 'utf-8');
    assert.equal(result, '');
  });

  it('should handle malformed UTF-8 with fatal=false', () => {
    // Invalid UTF-8 sequence
    const buffer = new Uint8Array([0xff, 0xfe, 0xfd]).buffer;
    const result = decodeToUtf8(buffer, 'utf-8', false);
    // Should not throw, may contain replacement characters
    assert.ok(typeof result === 'string');
  });
});

describe('isEncodingSupported', () => {
  it('should return true for UTF-8', () => {
    assert.equal(isEncodingSupported('utf-8'), true);
  });

  it('should return true for UTF-16', () => {
    assert.equal(isEncodingSupported('utf-16le'), true);
    assert.equal(isEncodingSupported('utf-16be'), true);
  });

  it('should return true for Windows-1252', () => {
    assert.equal(isEncodingSupported('windows-1252'), true);
  });

  it('should return true for ISO-8859-1', () => {
    assert.equal(isEncodingSupported('iso-8859-1'), true);
  });

  it('should return false for invalid encoding', () => {
    assert.equal(isEncodingSupported('invalid-encoding'), false);
  });

  it('should return false for empty string', () => {
    assert.equal(isEncodingSupported(''), false);
  });
});

describe('encoding edge cases', () => {
  it('should handle HTML with charset in middle of document', () => {
    const html = `
      <html>
        <head>
          <title>Page</title>
          <meta charset="utf-8">
          <link rel="stylesheet" href="style.css">
        </head>
      </html>
    `;
    const buffer = new TextEncoder().encode(html).buffer;
    const result = detectEncoding(buffer);
    assert.equal(result, 'utf-8');
  });

  it('should handle Content-Type with extra parameters', () => {
    const result = parseCharsetFromContentType(
      'text/html; charset=utf-8; boundary=----WebKitFormBoundary',
    );
    assert.equal(result, 'utf-8');
  });

  it('should normalize various UTF-8 spellings', () => {
    assert.equal(parseCharsetFromContentType('text/html; charset=utf8'), 'utf-8');
    assert.equal(parseCharsetFromContentType('text/html; charset=UTF-8'), 'utf-8');
    assert.equal(parseCharsetFromContentType('text/html; charset=utf-8'), 'utf-8');
  });

  it('should handle ANSI alias for Windows-1252', () => {
    const result = parseCharsetFromContentType('text/html; charset=ansi');
    assert.equal(result, 'windows-1252');
  });

  it('should handle BOM in middle of buffer', () => {
    // BOM should only be at start
    const buffer = new Uint8Array([0x48, 0xef, 0xbb, 0xbf, 0x65]).buffer;
    const result = detectEncoding(buffer);
    assert.equal(result, 'utf-8'); // Defaults to UTF-8 (no BOM at start)
  });

  it('should handle very short buffer', () => {
    const buffer = new Uint8Array([0x48]).buffer; // Just 'H'
    const result = detectEncoding(buffer);
    assert.equal(result, 'utf-8'); // Default
  });

  it('should scan only first 1KB for charset', () => {
    // Create >1KB HTML with charset beyond first 1KB
    const padding = 'x'.repeat(2000);
    const html = `${padding}<meta charset="iso-8859-1">`;
    const buffer = new TextEncoder().encode(html).buffer;
    const result = detectEncoding(buffer);
    // Should not find charset (beyond 1KB scan)
    assert.equal(result, 'utf-8'); // Default
  });
});
