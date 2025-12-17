/**
 * Robots and crawling directives extraction.
 *
 * @remarks
 * Extracts robot crawling and indexing directives from HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLDocument as Document } from '../../utils/html-parser.js';
import { getMetaContent } from '../../utils/meta-helpers.js';
import { parseDirectives } from './parse-directives.js';
import type { RobotsMetadata } from './types.js';

/**
 * Extract robots metadata from parsed HTML document.
 *
 * @remarks
 * Extracts robot directives from meta tags for general robots,
 * Googlebot, Bingbot, and Google News bot.
 *
 * @param doc - Parsed HTML document
 * @returns Robots metadata
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const robots = extractRobots(doc);
 * console.log(robots.robots?.index); // true/false
 * console.log(robots.robots?.follow); // true/false
 * ```
 */
export function extractRobots(doc: Document): RobotsMetadata {
  const metadata: RobotsMetadata = {};

  // Extract general robots directives
  const robotsContent = getMetaContent(doc, 'robots');
  if (robotsContent) {
    const directives = parseDirectives(robotsContent);
    if (Object.keys(directives).length > 0) {
      metadata.robots = directives;
    }
  }

  // Extract Googlebot directives
  const googlebotContent = getMetaContent(doc, 'googlebot');
  if (googlebotContent) {
    const directives = parseDirectives(googlebotContent);
    if (Object.keys(directives).length > 0) {
      metadata.googlebot = directives;
    }
  }

  // Extract Bingbot directives
  const bingbotContent = getMetaContent(doc, 'bingbot');
  if (bingbotContent) {
    const directives = parseDirectives(bingbotContent);
    if (Object.keys(directives).length > 0) {
      metadata.bingbot = directives;
    }
  }

  // Extract Google News bot directives
  const googlebotNewsContent = getMetaContent(doc, 'googlebot-news');
  if (googlebotNewsContent) {
    const directives = parseDirectives(googlebotNewsContent);
    if (Object.keys(directives).length > 0) {
      metadata.googlebotNews = directives;
    }
  }

  return metadata;
}
