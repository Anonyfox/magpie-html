/**
 * Character encoding detection and conversion.
 *
 * @remarks
 * Detects character encoding from BOM, HTTP headers, and HTML meta tags.
 * Converts all content to UTF-8 using native TextDecoder.
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 *
 * @packageDocumentation
 */

import { PluckEncodingError } from './types.js';

/**
 * Detect character encoding from various sources.
 *
 * @remarks
 * Priority order:
 * 1. BOM (Byte Order Mark) in content
 * 2. charset in Content-Type header
 * 3. <meta charset> in HTML (first 1KB)
 * 4. <meta http-equiv="Content-Type"> in HTML
 * 5. Default to UTF-8
 *
 * @param buffer - Response body as ArrayBuffer
 * @param contentType - Content-Type header value
 * @returns Detected encoding (e.g., 'utf-8', 'windows-1252')
 */
export function detectEncoding(buffer: ArrayBuffer, contentType?: string | null): string {
  // Check BOM first (most reliable)
  const bomEncoding = detectBOM(buffer);
  if (bomEncoding) {
    return bomEncoding;
  }

  // Check Content-Type header
  if (contentType) {
    const headerEncoding = parseCharsetFromContentType(contentType);
    if (headerEncoding) {
      return headerEncoding;
    }
  }

  // Check first 1KB for meta declarations
  const preview = new Uint8Array(buffer.slice(0, 1024));
  const previewText = new TextDecoder('utf-8', { fatal: false }).decode(preview);

  // Check XML declaration first (for RSS/Atom feeds)
  const xmlEncoding = parseCharsetFromXml(previewText);
  if (xmlEncoding) {
    return xmlEncoding;
  }

  // Check HTML meta tags
  const metaEncoding = parseCharsetFromHtml(previewText);
  if (metaEncoding) {
    return metaEncoding;
  }

  // Default to UTF-8
  return 'utf-8';
}

/**
 * Detect encoding from Byte Order Mark (BOM).
 *
 * @param buffer - Response body as ArrayBuffer
 * @returns Encoding if BOM detected, null otherwise
 */
function detectBOM(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer);

  // UTF-8 BOM: EF BB BF
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8';
  }

  // UTF-16 LE BOM: FF FE
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return 'utf-16le';
  }

  // UTF-16 BE BOM: FE FF
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return 'utf-16be';
  }

  return null;
}

/**
 * Parse charset from Content-Type header.
 *
 * @param contentType - Content-Type header value
 * @returns Encoding if found, null otherwise
 *
 * @example
 * parseCharsetFromContentType('text/html; charset=utf-8') // 'utf-8'
 * parseCharsetFromContentType('text/html; charset=windows-1252') // 'windows-1252'
 */
export function parseCharsetFromContentType(contentType: string): string | null {
  const match = /charset\s*=\s*["']?([^"'\s;]+)/i.exec(contentType);
  if (match) {
    return normalizeEncoding(match[1]);
  }
  return null;
}

/**
 * Parse charset from HTML meta tags.
 *
 * @remarks
 * Checks for:
 * - `<meta charset="XXX">`
 * - `<meta http-equiv="Content-Type" content="text/html; charset=XXX">`
 *
 * Uses light regex scanning, not full HTML parsing.
 *
 * @param html - HTML content (typically first 1KB)
 * @returns Encoding if found, null otherwise
 */
export function parseCharsetFromHtml(html: string): string | null {
  // Check <meta charset="XXX">
  const charsetMatch = /<meta[^>]+charset\s*=\s*["']?([^"'\s>]+)/i.exec(html);
  if (charsetMatch) {
    return normalizeEncoding(charsetMatch[1]);
  }

  // Check <meta http-equiv="Content-Type" content="...; charset=XXX">
  const httpEquivMatch =
    /<meta[^>]+http-equiv\s*=\s*["']?content-type["']?[^>]+content\s*=\s*["']([^"']+)/i.exec(html);
  if (httpEquivMatch) {
    const charset = parseCharsetFromContentType(httpEquivMatch[1]);
    if (charset) {
      return charset;
    }
  }

  return null;
}

/**
 * Parse charset from XML declaration.
 *
 * @remarks
 * Checks for: `<?xml version="1.0" encoding="XXX"?>`
 *
 * @param xml - XML content (typically first 1KB)
 * @returns Encoding if found, null otherwise
 */
export function parseCharsetFromXml(xml: string): string | null {
  // Check <?xml ... encoding="XXX"?>
  const xmlDeclMatch = /<\?xml[^?]*encoding\s*=\s*["']([^"']+)["'][^?]*\?>/i.exec(xml);
  if (xmlDeclMatch) {
    return normalizeEncoding(xmlDeclMatch[1]);
  }

  return null;
}

/**
 * Normalize encoding name to standard form.
 *
 * @remarks
 * Handles common aliases and variations.
 *
 * @param encoding - Raw encoding name
 * @returns Normalized encoding name
 */
function normalizeEncoding(encoding: string): string {
  const normalized = encoding.toLowerCase().trim();

  // Common aliases
  const aliases: Record<string, string> = {
    utf8: 'utf-8',
    'iso-8859-1': 'latin1',
    'iso-88591': 'latin1',
    'iso8859-1': 'latin1',
    'windows-1252': 'windows-1252',
    cp1252: 'windows-1252',
    ansi: 'windows-1252',
  };

  return aliases[normalized] || normalized;
}

/**
 * Decode buffer to UTF-8 string.
 *
 * @remarks
 * Uses native TextDecoder with the detected encoding.
 * Always returns UTF-8 string, regardless of source encoding.
 *
 * @param buffer - Response body as ArrayBuffer
 * @param encoding - Character encoding (e.g., 'utf-8', 'windows-1252')
 * @param validate - Whether to throw on invalid encoding
 * @returns UTF-8 decoded string
 * @throws PluckEncodingError if encoding is invalid and validate=true
 */
export function decodeToUtf8(buffer: ArrayBuffer, encoding: string, validate = true): string {
  try {
    const decoder = new TextDecoder(encoding, { fatal: validate });
    return decoder.decode(buffer);
  } catch (error) {
    if (validate) {
      throw new PluckEncodingError(
        `Failed to decode content with encoding '${encoding}': ${error}`,
        encoding,
        error as Error,
      );
    }

    // Fallback to UTF-8 with error replacement
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(buffer);
  }
}

/**
 * Check if encoding is supported by TextDecoder.
 *
 * @param encoding - Encoding name to check
 * @returns True if encoding is supported
 */
export function isEncodingSupported(encoding: string): boolean {
  try {
    new TextDecoder(encoding);
    return true;
  } catch {
    return false;
  }
}
