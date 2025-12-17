/**
 * News and press types.
 *
 * @remarks
 * Types for news-specific metadata.
 *
 * @packageDocumentation
 */

/**
 * News metadata.
 *
 * @remarks
 * Contains news-specific metadata for articles and press releases.
 */
export interface NewsMetadata {
  /** News keywords (distinct from regular keywords) */
  keywords?: string[];

  /** Google News standout tag (indicates exceptional journalism) */
  standout?: string;

  /** Syndication source (original publisher) */
  syndicationSource?: string;

  /** Original source URL */
  originalSource?: string;
}
