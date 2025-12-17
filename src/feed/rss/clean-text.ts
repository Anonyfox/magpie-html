/**
 * Text cleaning utilities for RSS feeds
 * Handles CDATA, HTML entities, and whitespace normalization
 */

/**
 * Strip CDATA tags from text
 * RSS feeds often wrap content in CDATA sections
 * Handles leading/trailing whitespace before CDATA markers
 */
export function stripCDATA(text: string): string {
  if (!text) return text;
  return text.replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '');
}

/**
 * Decode common HTML entities
 * Basic entity decoding for feed content
 */
export function decodeEntities(text: string): string {
  if (!text) return text;

  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#39;': "'",
    '&#x27;': "'",
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replaceAll(entity, char);
  }

  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, dec) => {
    return String.fromCharCode(Number.parseInt(dec, 10));
  });

  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    return String.fromCharCode(Number.parseInt(hex, 16));
  });

  return result;
}

/**
 * Normalize whitespace
 * Trim and collapse multiple spaces
 */
export function normalizeWhitespace(text: string, preserveLineBreaks = false): string {
  if (!text) return text;

  let result = text.trim();

  if (preserveLineBreaks) {
    // Collapse spaces but keep line breaks
    result = result.replace(/ +/g, ' ');
    result = result.replace(/\n +/g, '\n');
    result = result.replace(/ +\n/g, '\n');
  } else {
    // Collapse all whitespace
    result = result.replace(/\s+/g, ' ');
  }

  return result;
}

/**
 * Clean text from RSS feed
 * Combines CDATA stripping, entity decoding, and whitespace normalization
 */
export function cleanText(
  text: string | null | undefined,
  options: {
    stripCdata?: boolean;
    decodeEntities?: boolean;
    normalizeWhitespace?: boolean;
    preserveLineBreaks?: boolean;
  } = {},
): string {
  if (text === null || text === undefined) return '';
  if (typeof text !== 'string') return '';

  const {
    stripCdata = true,
    decodeEntities: shouldDecodeEntities = true,
    normalizeWhitespace: shouldNormalizeWhitespace = true,
    preserveLineBreaks = false,
  } = options;

  let result = text;

  if (stripCdata) {
    result = stripCDATA(result);
  }

  if (shouldDecodeEntities) {
    result = decodeEntities(result);
  }

  if (shouldNormalizeWhitespace) {
    result = normalizeWhitespace(result, preserveLineBreaks);
  }

  return result;
}

