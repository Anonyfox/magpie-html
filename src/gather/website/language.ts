/**
 * Language extraction and aggregation for websites.
 *
 * @packageDocumentation
 */

import { extractLanguage } from '../../metadata/language/index.js';
import type { HTMLDocument as Document } from '../../utils/html-parser.js';

/**
 * Language information for a website.
 */
export interface WebsiteLanguage {
  /** Primary language code (ISO 639-1, e.g., 'en', 'de', 'fr') */
  language?: string;
  /** Region code (ISO 3166-1 alpha-2, e.g., 'US', 'GB', 'DE') */
  region?: string;
}

/**
 * Extract best available language information from the document.
 *
 * @remarks
 * Uses the language metadata extractor to determine the primary language
 * and region of the page. Prioritizes HTML lang attribute, then content-language
 * meta tag, then OpenGraph locale.
 *
 * The returned language code is normalized to ISO 639-1 format (e.g., 'en')
 * and the region code (if available) to ISO 3166-1 alpha-2 (e.g., 'US').
 *
 * @param doc - Parsed HTML document
 * @returns Language information with ISO codes
 *
 * @example
 * ```typescript
 * const doc = parseHTML(html);
 * const lang = extractBestLanguage(doc);
 * console.log(lang.language); // 'en'
 * console.log(lang.region);   // 'US'
 * ```
 */
export function extractBestLanguage(doc: Document): WebsiteLanguage {
  const metadata = extractLanguage(doc);

  return {
    language: metadata.primary,
    region: metadata.region,
  };
}
