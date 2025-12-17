/**
 * SEO metadata extraction.
 *
 * @remarks
 * Extracts standard SEO meta tags from HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLDocument as Document } from '../../utils/html-parser.js';
import { getMetaContent } from '../../utils/meta-helpers.js';
import type { SEOMetadata } from './types.js';

/**
 * Extract SEO metadata from parsed HTML document.
 *
 * @remarks
 * Extracts standard SEO meta tags including title, description, keywords,
 * and browser-specific configuration. All fields are optional.
 *
 * @param doc - Parsed HTML document
 * @returns SEO metadata object
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const seo = extractSEO(doc);
 * console.log(seo.title); // Page title
 * console.log(seo.description); // Meta description
 * ```
 */
export function extractSEO(doc: Document): SEOMetadata {
  const metadata: SEOMetadata = {};

  // Extract <title> tag
  const titleElement = doc.querySelector('title');
  if (titleElement?.textContent) {
    metadata.title = titleElement.textContent.trim();
  }

  // Extract meta tags
  metadata.description = getMetaContent(doc, 'description');
  metadata.author = getMetaContent(doc, 'author');
  metadata.generator = getMetaContent(doc, 'generator');
  metadata.viewport = getMetaContent(doc, 'viewport');
  metadata.themeColor = getMetaContent(doc, 'theme-color');
  metadata.colorScheme = getMetaContent(doc, 'color-scheme');
  metadata.applicationName = getMetaContent(doc, 'application-name');
  metadata.appleMobileWebAppTitle = getMetaContent(doc, 'apple-mobile-web-app-title');
  metadata.appleMobileWebAppStatusBarStyle = getMetaContent(
    doc,
    'apple-mobile-web-app-status-bar-style',
  );

  // Extract keywords as array
  const keywordsString = getMetaContent(doc, 'keywords');
  if (keywordsString) {
    metadata.keywords = keywordsString
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  }

  // Parse apple-mobile-web-app-capable as boolean
  const capable = getMetaContent(doc, 'apple-mobile-web-app-capable');
  if (capable) {
    metadata.appleMobileWebAppCapable = capable.toLowerCase() === 'yes';
  }

  // Remove undefined values to keep the object clean
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as SEOMetadata;
}
