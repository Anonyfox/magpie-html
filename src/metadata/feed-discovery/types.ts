/**
 * Feed discovery types.
 *
 * @remarks
 * Types for discovering RSS, Atom, and JSON feeds.
 *
 * @packageDocumentation
 */

/**
 * Discovered feed information.
 */
export interface DiscoveredFeed {
  /** Feed URL */
  url: string;

  /** Feed type */
  type: 'rss' | 'atom' | 'json' | 'unknown';

  /** Feed title (if provided in link tag) */
  title?: string;
}

/**
 * Feed discovery metadata.
 *
 * @remarks
 * Contains all discovered feeds and suggested feed URLs based on common patterns.
 */
export interface FeedDiscoveryMetadata {
  /** Feeds explicitly declared in <link> tags */
  feeds: DiscoveredFeed[];

  /** Suggested feed URLs based on common patterns (not verified) */
  suggestions?: string[];
}
