/**
 * Feed format detection utilities.
 *
 * @packageDocumentation
 */

/**
 * Feed format type.
 *
 * @remarks
 * Represents the detected or expected format of a feed.
 * - `'rss'` - RSS 2.0, 0.9x, or RSS 1.0 (RDF)
 * - `'atom'` - Atom 1.0
 * - `'json-feed'` - JSON Feed 1.0 or 1.1
 * - `'sitemap'` - XML Sitemap (urlset or sitemapindex)
 * - `'unknown'` - Format could not be determined
 */
export type FeedFormat = 'rss' | 'atom' | 'json-feed' | 'sitemap' | 'unknown';

/**
 * Detect feed format from content string.
 *
 * @remarks
 * Analyzes the content to determine if it's RSS, Atom, or JSON Feed.
 * Detection is based on root elements, namespaces, and structure.
 *
 * Detection priority:
 * 1. JSON Feed (checks for JSON with jsonfeed.org version)
 * 2. RSS (checks for `<rss>` or `<rdf:RDF>` root elements)
 * 3. Atom (checks for `<feed>` root element with Atom namespace)
 *
 * @param content - Feed content as string
 * @returns Detected format or 'unknown' if format cannot be determined
 *
 * @example
 * ```typescript
 * const format = detectFormat(feedContent);
 * if (format === 'rss') {
 *   console.log('This is an RSS feed');
 * }
 * ```
 */
export function detectFormat(content: string): FeedFormat {
  if (!content || typeof content !== 'string') {
    return 'unknown';
  }

  const trimmed = content.trim();

  // Check for JSON Feed (starts with { or [)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    // Try to parse as JSON
    try {
      const data = JSON.parse(trimmed);
      if (
        data &&
        typeof data === 'object' &&
        !Array.isArray(data) &&
        data.version &&
        typeof data.version === 'string' &&
        data.version.includes('jsonfeed.org')
      ) {
        return 'json-feed';
      }
    } catch {
      // Not valid JSON
    }
    return 'unknown';
  }

  // Must be XML-based (RSS or Atom)
  // Remove XML declaration and comments for easier parsing
  const cleaned = trimmed
    .replace(/<\?xml[^?]*\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();

  // Check for RSS root element first (most reliable)
  if (cleaned.match(/<rss[\s>]/i)) {
    return 'rss';
  }

  // Check for Atom root element
  if (cleaned.match(/<feed[\s>]/i)) {
    return 'atom';
  }

  // Check for Atom as root namespace (not just xmlns:atom extension)
  // Only if feed is the root element
  if (cleaned.match(/<feed[^>]*xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/i)) {
    return 'atom';
  }

  // Check for RDF-based RSS 1.0
  if (cleaned.match(/<rdf:RDF/i) && cleaned.includes('rss/1.0')) {
    return 'rss';
  }

  // Check for channel element (common in RSS)
  if (cleaned.match(/<channel[\s>]/i)) {
    return 'rss';
  }

  // Check for Sitemap (urlset or sitemapindex)
  if (
    (cleaned.match(/<urlset[\s>]/i) || cleaned.match(/<sitemapindex[\s>]/i)) &&
    cleaned.includes('sitemaps.org')
  ) {
    return 'sitemap';
  }

  return 'unknown';
}

/**
 * Check if content is a valid feed (any format).
 *
 * @param content - Feed content as string
 * @returns `true` if content is RSS, Atom, or JSON Feed
 *
 * @example
 * ```typescript
 * if (isFeed(content)) {
 *   const result = parseFeed(content);
 * }
 * ```
 */
export function isFeed(content: string): boolean {
  return detectFormat(content) !== 'unknown';
}

/**
 * Check if content is RSS format.
 *
 * @param content - Feed content as string
 * @returns `true` if content is RSS (any version)
 */
export function isRSS(content: string): boolean {
  return detectFormat(content) === 'rss';
}

/**
 * Check if content is Atom format.
 *
 * @param content - Feed content as string
 * @returns `true` if content is Atom 1.0
 */
export function isAtom(content: string): boolean {
  return detectFormat(content) === 'atom';
}

/**
 * Check if content is JSON Feed format.
 *
 * @param content - Feed content as string
 * @returns `true` if content is JSON Feed (1.0 or 1.1)
 */
export function isJSONFeed(content: string): boolean {
  return detectFormat(content) === 'json-feed';
}

/**
 * Check if content is XML Sitemap format.
 *
 * @param content - Feed content as string
 * @returns `true` if content is a sitemap (urlset or sitemapindex)
 */
export function isSitemapFormat(content: string): boolean {
  return detectFormat(content) === 'sitemap';
}
