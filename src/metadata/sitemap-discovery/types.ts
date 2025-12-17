/**
 * Sitemap discovery types.
 *
 * @remarks
 * Types for discovering XML sitemaps and sitemap indexes.
 *
 * @packageDocumentation
 */

/**
 * Sitemap discovery metadata.
 *
 * @remarks
 * Contains discovered sitemaps from <link> tags and suggested common sitemap URLs.
 */
export interface SitemapDiscoveryMetadata {
  /** Sitemaps explicitly declared in <link rel="sitemap"> tags */
  sitemaps: string[];

  /** Suggested sitemap URLs based on common patterns (not verified) */
  suggestions?: string[];
}
