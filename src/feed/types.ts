/**
 * Unified feed types - normalized interface across all feed formats.
 *
 * @remarks
 * These types provide a consistent interface for working with feeds regardless
 * of the original format (RSS, Atom, or JSON Feed). All format-specific data
 * is normalized to this structure by the parser.
 *
 * @packageDocumentation
 */

/**
 * Feed author information.
 *
 * @remarks
 * Represents author/contributor information normalized across all feed formats.
 * Not all formats provide all fields.
 */
export interface FeedAuthor {
  /** Author's name */
  name?: string;
  /** Author's email address */
  email?: string;
  /** Author's website URL */
  url?: string;
}

/**
 * Feed enclosure (attached file).
 *
 * @remarks
 * Represents attached files like audio, video, or documents. Commonly used
 * for podcasts and media feeds.
 */
export interface FeedEnclosure {
  /** URL of the attached file */
  url: string;
  /** MIME type of the file (e.g., 'audio/mpeg', 'video/mp4') */
  type?: string;
  /** File size in bytes */
  length?: number;
}

/**
 * Feed item (entry/article/post).
 *
 * @remarks
 * Represents a single item in a feed. Items are normalized across all formats
 * to provide a consistent interface. Not all fields are available in all formats.
 */
export interface FeedItem {
  /** Unique identifier for the item (GUID, ID, or URL) */
  id: string;
  /** Item title */
  title?: string;
  /** Canonical URL for the item */
  url?: string;
  /** External URL for linked posts (when different from canonical URL) */
  externalUrl?: string;
  /** Full HTML content of the item */
  contentHtml?: string;
  /** Plain text content of the item */
  contentText?: string;
  /** Short summary or description */
  summary?: string;
  /** Publication date in ISO 8601 format */
  published?: string;
  /** Last modified date in ISO 8601 format */
  modified?: string;
  /** Item authors (may be empty if using feed-level authors) */
  authors?: FeedAuthor[];
  /** Tags, categories, or keywords */
  tags?: string[];
  /** Featured image URL */
  image?: string;
  /** Attached files (audio, video, documents) */
  enclosures?: FeedEnclosure[];
}

/**
 * Normalized feed data.
 *
 * @remarks
 * The main feed object containing metadata and items. This is the recommended
 * interface for working with feeds as it provides a consistent structure
 * regardless of the original format.
 */
export interface Feed {
  /** Original feed format */
  format: 'rss' | 'atom' | 'json-feed' | 'sitemap';
  /** Feed title (required) */
  title: string;
  /** Feed description or subtitle */
  description?: string;
  /** Feed's home page URL */
  url?: string;
  /** Feed's own URL (self-reference) */
  feedUrl?: string;
  /** Feed language code (e.g., 'en', 'de') */
  language?: string;
  /** Feed icon or logo URL */
  image?: string;
  /** Feed-level authors */
  authors?: FeedAuthor[];
  /** Last update date in ISO 8601 format */
  updated?: string;
  /** Feed items (entries/articles/posts) */
  items: FeedItem[];
}

/**
 * Parse result containing both normalized and original data.
 *
 * @remarks
 * Returned by {@link parseFeed}. Contains both the normalized feed data
 * (recommended for most use cases) and the original format-specific data
 * (for advanced use cases requiring format-specific fields).
 */
export interface ParseResult {
  /** Normalized feed data (recommended) */
  feed: Feed;
  /** Original format-specific data (advanced use) */
  original: unknown;
}
