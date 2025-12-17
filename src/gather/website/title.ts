/**
 * Title extraction and aggregation for websites.
 *
 * @packageDocumentation
 */

import { extractOpenGraph } from '../../metadata/opengraph/index.js';
import { extractSchemaOrg } from '../../metadata/schema-org/index.js';
import { extractSEO } from '../../metadata/seo/index.js';
import { extractTwitterCard } from '../../metadata/twitter-card/index.js';
import { cleanTitle } from '../../utils/clean-title.js';
import type { HTMLDocument as Document } from '../../utils/html-parser.js';

/**
 * Extract page title from multiple sources, clean them, and pick the longest.
 *
 * @remarks
 * Strategy:
 * 1. Collect all possible titles from multiple sources (priority order):
 *    - Schema.org NewsArticle/Article headline (cleanest, no brand)
 *    - OpenGraph og:title
 *    - Twitter twitter:title
 *    - Schema.org WebPage name (may include brand)
 *    - HTML <title> tag
 *    - First <h1> element
 * 2. Clean each title to remove brand suffixes
 * 3. Pick the longest cleaned title
 * 4. This ensures we get the most substantial/descriptive title
 *
 * @param doc - Parsed HTML document
 * @returns Best available title or undefined if none found
 *
 * @example
 * ```typescript
 * const doc = parseHTML(html);
 * const title = extractBestTitle(doc);
 * console.log(title); // Most descriptive title without brand
 * ```
 */
export function extractBestTitle(doc: Document): string | undefined {
  const candidates: string[] = [];

  // 1. Schema.org Article/NewsArticle headline (cleanest, no brand)
  const schema = extractSchemaOrg(doc);
  if (schema.articles && schema.articles.length > 0) {
    for (const article of schema.articles) {
      const headline = getStringProperty(article, 'headline');
      if (headline?.trim()) {
        candidates.push(headline.trim());
      }
    }
  }

  // 2. OpenGraph title
  const og = extractOpenGraph(doc);
  if (og.title?.trim()) {
    candidates.push(og.title.trim());
  }

  // 3. Twitter Card title
  const twitter = extractTwitterCard(doc);
  if (twitter.title?.trim()) {
    candidates.push(twitter.title.trim());
  }

  // 4. Schema.org WebPage name (may include brand)
  if (schema.webPages && schema.webPages.length > 0) {
    for (const page of schema.webPages) {
      const name = getStringProperty(page, 'name');
      if (name?.trim()) {
        candidates.push(name.trim());
      }
    }
  }

  // 5. HTML <title> tag
  const seo = extractSEO(doc);
  if (seo.title?.trim()) {
    candidates.push(seo.title.trim());
  }

  // 6. First <h1> element
  const h1 = doc.querySelector('h1');
  if (h1?.textContent?.trim()) {
    candidates.push(h1.textContent.trim());
  }

  // No candidates found
  if (candidates.length === 0) {
    return undefined;
  }

  // Clean all candidates and pick the longest
  const cleaned = candidates.map((title) => ({
    original: title,
    cleaned: cleanTitle(title),
  }));

  // Sort by cleaned length (descending) and return the longest
  cleaned.sort((a, b) => b.cleaned.length - a.cleaned.length);

  return cleaned[0].cleaned;
}

/**
 * Safely extract a string property from an unknown object.
 */
function getStringProperty(obj: unknown, prop: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const value = (obj as Record<string, unknown>)[prop];
  return typeof value === 'string' ? value : undefined;
}
