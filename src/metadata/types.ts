/**
 * Unified metadata types - normalized interface across all metadata extractors.
 *
 * @remarks
 * These types provide a consistent interface for working with website metadata
 * extracted from HTML. All metadata is normalized to this structure.
 *
 * @packageDocumentation
 */

export type { CanonicalMetadata } from './canonical/types.js';
export type { OpenGraphMetadata } from './opengraph/types.js';
// Re-export all submodule types for convenience
export type { SEOMetadata } from './seo/types.js';
export type { TwitterCardMetadata } from './twitter-card/types.js';

/**
 * Complete metadata extraction result.
 *
 * @remarks
 * Contains all extracted metadata from a webpage, organized by type.
 * All fields are optional - only present if found in the document.
 *
 * This is the unified result returned by the main metadata extraction function
 * (TBD - will be designed after all submodules are implemented).
 */
export interface WebsiteMetadata {
  /** Basic SEO meta tags */
  seo?: import('./seo/types.js').SEOMetadata;

  /** OpenGraph protocol metadata */
  openGraph?: import('./opengraph/types.js').OpenGraphMetadata;

  /** Twitter Card metadata */
  twitterCard?: import('./twitter-card/types.js').TwitterCardMetadata;

  /** Canonical URLs and alternates */
  canonical?: import('./canonical/types.js').CanonicalMetadata;

  // Additional metadata types will be added as modules are implemented
}
