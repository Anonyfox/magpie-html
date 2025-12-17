/**
 * Robots and crawling directives types.
 *
 * @remarks
 * Types for robot crawling and indexing directives.
 *
 * @packageDocumentation
 */

/**
 * Parsed robot directives.
 */
export interface RobotDirectives {
  /** Allow indexing */
  index?: boolean;

  /** Allow following links */
  follow?: boolean;

  /** Prevent archiving/caching */
  noarchive?: boolean;

  /** Prevent showing snippets */
  nosnippet?: boolean;

  /** Prevent indexing images */
  noimageindex?: boolean;

  /** Maximum snippet length (characters) */
  maxSnippet?: number;

  /** Maximum image preview size */
  maxImagePreview?: string;

  /** Maximum video preview length (seconds) */
  maxVideoPreview?: number;

  /** Prevent translation */
  notranslate?: boolean;

  /** Date after which content is unavailable */
  unavailableAfter?: string;
}

/**
 * Robots and crawling metadata.
 *
 * @remarks
 * Contains robot directives for search engines and crawlers.
 */
export interface RobotsMetadata {
  /** General robots directives */
  robots?: RobotDirectives;

  /** Google-specific directives */
  googlebot?: RobotDirectives;

  /** Bing-specific directives */
  bingbot?: RobotDirectives;

  /** Google News-specific directives */
  googlebotNews?: RobotDirectives;
}
