/**
 * Description extraction and aggregation for websites.
 *
 * @packageDocumentation
 */

import { extractOpenGraph } from '../../metadata/opengraph/index.js';
import { extractSchemaOrg } from '../../metadata/schema-org/index.js';
import { extractSEO } from '../../metadata/seo/index.js';
import { extractTwitterCard } from '../../metadata/twitter-card/index.js';
import type { HTMLDocument as Document } from '../../utils/html-parser.js';

/**
 * Extract page description from multiple sources and pick the longest.
 *
 * @remarks
 * Strategy:
 * 1. Collect all possible descriptions from metadata sources (priority order):
 *    - Schema.org NewsArticle/Article description
 *    - OpenGraph og:description
 *    - Twitter twitter:description
 *    - HTML meta description tag
 * 2. Pick the longest description (no cleaning needed)
 * 3. This ensures we get the most detailed/descriptive summary
 *
 * Note: Does not look in the body content, only metadata tags.
 *
 * @param doc - Parsed HTML document
 * @returns Best available description or undefined if none found
 *
 * @example
 * ```typescript
 * const doc = parseHTML(html);
 * const description = extractBestDescription(doc);
 * console.log(description); // Most detailed description from metadata
 * ```
 */
export function extractBestDescription(doc: Document): string | undefined {
  const candidates: string[] = [];

  // 1. Schema.org Article/NewsArticle description
  const schema = extractSchemaOrg(doc);
  if (schema.articles && schema.articles.length > 0) {
    for (const article of schema.articles) {
      const description = getStringProperty(article, 'description');
      if (description?.trim()) {
        candidates.push(description.trim());
      }
    }
  }

  // 2. OpenGraph description
  const og = extractOpenGraph(doc);
  if (og.description?.trim()) {
    candidates.push(og.description.trim());
  }

  // 3. Twitter Card description
  const twitter = extractTwitterCard(doc);
  if (twitter.description?.trim()) {
    candidates.push(twitter.description.trim());
  }

  // 4. HTML meta description tag
  const seo = extractSEO(doc);
  if (seo.description?.trim()) {
    candidates.push(seo.description.trim());
  }

  // No candidates found
  if (candidates.length === 0) {
    return undefined;
  }

  // Pick the longest description (more detail is better)
  candidates.sort((a, b) => b.length - a.length);

  return candidates[0];
}

/**
 * Safely extract a string property from an unknown object.
 */
function getStringProperty(obj: unknown, prop: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const value = (obj as Record<string, unknown>)[prop];
  return typeof value === 'string' ? value : undefined;
}
