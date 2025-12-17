/**
 * Language and localization extraction.
 *
 * @remarks
 * Extracts language and locale metadata from HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLElement } from '../../utils/html-parser.js';
import {
  getAllMetaPropertyValues,
  getMetaContent,
  getMetaHttpEquiv,
  getMetaProperty,
} from '../../utils/meta-helpers.js';
import type { LanguageMetadata } from './types.js';

/**
 * Extract language and localization metadata from parsed HTML document.
 *
 * @remarks
 * Extracts language information from HTML lang attribute, meta tags,
 * and OpenGraph locale. Normalizes to provide a primary language and region.
 *
 * @param doc - Parsed HTML document
 * @returns Language metadata
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const lang = extractLanguage(doc);
 * console.log(lang.primary); // 'en'
 * console.log(lang.region); // 'US'
 * ```
 */
export function extractLanguage(doc: HTMLElement): LanguageMetadata {
  const metadata: LanguageMetadata = {};

  // Extract HTML lang attribute
  const htmlElement = doc.querySelector('html');
  if (htmlElement) {
    const lang = htmlElement.getAttribute('lang');
    if (lang) {
      metadata.htmlLang = lang;
    }
  }

  // Extract content-language meta tag (can be http-equiv or name)
  metadata.contentLanguage =
    getMetaHttpEquiv(doc, 'content-language') || getMetaContent(doc, 'content-language');

  // Extract OpenGraph locale
  metadata.ogLocale = getMetaProperty(doc, 'og:locale');

  // Extract OpenGraph alternate locales
  const alternateLocales = getAllMetaPropertyValues(doc, 'og:locale:alternate');
  if (alternateLocales.length > 0) {
    metadata.alternateLocales = alternateLocales;
  }

  // Determine primary language and region
  const { primary, region } = parseLanguageCode(
    metadata.htmlLang || metadata.contentLanguage || metadata.ogLocale,
  );

  if (primary) {
    metadata.primary = primary;
  }
  if (region) {
    metadata.region = region;
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as LanguageMetadata;
}

/**
 * Parse language code to extract language and region.
 *
 * @remarks
 * Handles various formats:
 * - en → { primary: 'en' }
 * - en-US → { primary: 'en', region: 'US' }
 * - en_US → { primary: 'en', region: 'US' }
 * - en-us → { primary: 'en', region: 'US' }
 *
 * @param code - Language code to parse
 * @returns Normalized primary language and region
 */
function parseLanguageCode(code?: string): { primary?: string; region?: string } {
  if (!code) {
    return {};
  }

  // Normalize separators (both - and _ are used)
  const normalized = code.trim().replace(/_/g, '-');

  // Split on - or space
  const parts = normalized.split(/[-\s]/);

  if (parts.length === 0) {
    return {};
  }

  // First part is the language code (lowercase)
  const primary = parts[0].toLowerCase();

  // Second part (if exists) is the region code (uppercase)
  const region = parts.length > 1 ? parts[1].toUpperCase() : undefined;

  return { primary, region };
}
