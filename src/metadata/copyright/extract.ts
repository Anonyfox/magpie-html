/**
 * Copyright and licensing extraction.
 *
 * @remarks
 * Extracts copyright and license metadata from HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLElement } from '../../utils/html-parser.js';
import { getLinkHref } from '../../utils/link-helpers.js';
import { getMetaContent } from '../../utils/meta-helpers.js';
import type { CopyrightMetadata } from './types.js';

/**
 * Extract copyright metadata from parsed HTML document.
 *
 * @remarks
 * Extracts copyright and licensing information from meta tags, link tags,
 * and Schema.org structured data.
 *
 * @param doc - Parsed HTML document
 * @returns Copyright metadata
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const copyright = extractCopyright(doc);
 * console.log(copyright.copyright);
 * console.log(copyright.license);
 * ```
 */
export function extractCopyright(doc: HTMLElement): CopyrightMetadata {
  const metadata: CopyrightMetadata = {};

  // Extract copyright from meta tag
  metadata.copyright = getMetaContent(doc, 'copyright');

  // Extract license from link tag
  metadata.license = getLinkHref(doc, 'license');

  // Extract Dublin Core rights (if no copyright yet)
  if (!metadata.copyright) {
    metadata.copyright = getMetaContent(doc, 'DC.rights') || getMetaContent(doc, 'dcterms.rights');
  }

  // Try to parse copyright holder and year from copyright string
  if (metadata.copyright) {
    const parsed = parseCopyright(metadata.copyright);
    if (parsed.holder && !metadata.holder) {
      metadata.holder = parsed.holder;
    }
    if (parsed.year && !metadata.year) {
      metadata.year = parsed.year;
    }
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as CopyrightMetadata;
}

/**
 * Parse copyright string to extract holder and year.
 *
 * @remarks
 * Attempts to extract copyright holder and year from common copyright formats:
 * - "© 2024 Company Name"
 * - "Copyright 2024 Company Name"
 * - "(c) 2024 Company Name"
 *
 * @param copyrightString - Copyright string to parse
 * @returns Parsed holder and year
 */
function parseCopyright(copyrightString: string): { holder?: string; year?: string } {
  const result: { holder?: string; year?: string } = {};

  // Match year (4 digits)
  const yearMatch = copyrightString.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    result.year = yearMatch[0];
  }

  // Try to extract holder by removing copyright symbols and year
  let holder = copyrightString
    .replace(/©/g, '')
    .replace(/\(c\)/gi, '')
    .replace(/^copyright\s+/gi, '') // Only remove "copyright" at the start
    .replace(/\b(19|20)\d{2}(-\d{4})?\b/g, '') // Remove year or year range
    .trim();

  // Clean up multiple spaces and leading punctuation
  holder = holder.replace(/\s+/g, ' ').replace(/^[,\-:\s]+/g, '');

  // Remove trailing "All rights reserved" and similar phrases
  holder = holder.replace(/\.\s*all rights reserved\.?$/gi, '');

  if (holder && holder.length > 0 && holder.length < 200) {
    result.holder = holder;
  }

  return result;
}
