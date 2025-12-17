/**
 * Links extraction types.
 *
 * @remarks
 * Types for navigational link extraction and analysis.
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 *
 * @packageDocumentation
 */

/**
 * Extracted link with metadata.
 *
 * @remarks
 * Represents a single hyperlink with all relevant attributes.
 * URLs are normalized to absolute format if a base URL is available.
 */
export interface ExtractedLink {
  /** Absolute URL of the link */
  url: string;

  /** Anchor text (visible text content) */
  text?: string;

  /** Title attribute */
  title?: string;

  /** Rel attribute value */
  rel?: string;

  /** Target attribute (_blank, _self, etc.) */
  target?: string;

  /** Whether this is an internal link (same origin) */
  internal?: boolean;

  /** Whether this is an external link (different origin) */
  external?: boolean;

  /** Whether link has nofollow rel */
  nofollow?: boolean;

  /** Whether link has ugc (User Generated Content) rel */
  ugc?: boolean;

  /** Whether link has sponsored rel */
  sponsored?: boolean;

  /** Whether link has noopener rel */
  noopener?: boolean;

  /** Whether link has noreferrer rel */
  noreferrer?: boolean;
}

/**
 * Links extraction options.
 */
export interface LinksExtractionOptions {
  /**
   * Filter links by scope.
   *
   * @remarks
   * - `'all'` - Return all links (default)
   * - `'internal'` - Only links to same origin
   * - `'external'` - Only links to different origins
   */
  scope?: 'all' | 'internal' | 'external';

  /**
   * Filter out links with specific rel attributes.
   *
   * @remarks
   * Useful for crawlers to skip nofollow, sponsored, or UGC links.
   *
   * @example
   * ```typescript
   * // Skip nofollow and sponsored links
   * { excludeRel: ['nofollow', 'sponsored'] }
   * ```
   */
  excludeRel?: Array<'nofollow' | 'noopener' | 'noreferrer' | 'ugc' | 'sponsored'>;

  /**
   * Include only links with specific rel attributes.
   *
   * @remarks
   * If specified, only links matching these rel values are included.
   */
  includeRel?: Array<'nofollow' | 'noopener' | 'noreferrer' | 'ugc' | 'sponsored'>;

  /**
   * Whether to include hash-only links (#anchor).
   *
   * @default false
   */
  includeHashLinks?: boolean;

  /**
   * Whether to deduplicate URLs.
   *
   * @remarks
   * If true, only unique URLs are returned (keeps first occurrence).
   *
   * @default true
   */
  deduplicate?: boolean;

  /**
   * Maximum number of links to extract.
   *
   * @remarks
   * Useful for limiting extraction on large pages.
   */
  limit?: number;
}

/**
 * Links metadata extracted from HTML.
 *
 * @remarks
 * Contains categorized and analyzed links from the document.
 */
export interface LinksMetadata {
  /** All extracted links */
  all?: ExtractedLink[];

  /** Internal links (same origin) */
  internal?: ExtractedLink[];

  /** External links (different origin) */
  external?: ExtractedLink[];

  /** Links with nofollow rel */
  nofollow?: ExtractedLink[];

  /** Total count of links found */
  totalCount?: number;

  /** Count of internal links */
  internalCount?: number;

  /** Count of external links */
  externalCount?: number;

  /** Count of nofollow links */
  nofollowCount?: number;
}
