/**
 * Text cleaning utilities for Atom feeds
 */

/**
 * Strip CDATA tags from text
 */
function stripCDATA(text: string): string {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

/**
 * Decode HTML entities
 */
function decodeEntities(text: string): string {
  // Common HTML entities
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }

  // Decode numeric entities (&#123; or &#xAB;)
  result = result.replace(/&#(\d+);/g, (_match, dec) => {
    return String.fromCharCode(Number.parseInt(dec, 10));
  });
  result = result.replace(/&#x([0-9A-Fa-f]+);/g, (_match, hex) => {
    return String.fromCharCode(Number.parseInt(hex, 16));
  });

  return result;
}

/**
 * Normalize whitespace (collapse multiple spaces, trim)
 */
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Clean text by applying all transformations
 */
function cleanText(text: string | null | undefined): string {
  if (!text) {
    return '';
  }
  return normalizeWhitespace(decodeEntities(stripCDATA(text)));
}

/**
 * Clean text content based on Atom content type
 * @param text - Raw text
 * @param type - Atom content type (text, html, xhtml, or mime type)
 * @returns Cleaned text
 */
export function cleanAtomContent(
  text: string | null | undefined,
  type: string | null | undefined = 'text',
): string {
  if (!text) {
    return '';
  }

  const contentType = (type || 'text').toLowerCase().trim();

  // For text type, decode entities and clean whitespace
  if (contentType === 'text') {
    return cleanText(text);
  }

  // For HTML/XHTML, we keep HTML entities and structure
  // Only normalize whitespace and strip CDATA
  if (contentType === 'html' || contentType === 'xhtml') {
    return normalizeWhitespace(stripCDATA(text));
  }

  // For other mime types (e.g., application/xml), preserve as-is after basic cleaning
  return normalizeWhitespace(stripCDATA(text));
}

// Export individual utilities for internal use
export { stripCDATA, decodeEntities, normalizeWhitespace, cleanText };
