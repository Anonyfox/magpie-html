/**
 * Metadata extraction module.
 *
 * @remarks
 * Comprehensive metadata extraction from HTML documents including SEO tags,
 * Open Graph, Twitter Cards, canonical URLs, and more.
 *
 * @packageDocumentation
 */

export type { AnalyticsMetadata } from './analytics/index.js';
// Phase 6 modules (implemented)
export { extractAnalytics } from './analytics/index.js';
export type { AssetsMetadata, ConnectionHint, PreloadResource } from './assets/index.js';
export { extractAssets } from './assets/index.js';
export type { AlternateLink, AppLinks, CanonicalMetadata } from './canonical/index.js';
export { extractCanonical } from './canonical/index.js';
export type { CopyrightMetadata } from './copyright/index.js';
// Phase 5 modules (implemented)
export { extractCopyright } from './copyright/index.js';
export type { DublinCoreMetadata } from './dublin-core/index.js';
export { extractDublinCore } from './dublin-core/index.js';
export type { DiscoveredFeed, FeedDiscoveryMetadata } from './feed-discovery/index.js';
// Phase 3 modules (implemented)
export {
  COMMON_FEED_PATHS,
  extractFeedDiscovery,
  generateFeedSuggestions,
} from './feed-discovery/index.js';
export type { GeoMetadata, GeoPosition } from './geo/index.js';
export { extractGeo } from './geo/index.js';
export type { AppleTouchIcon, IconsMetadata, MaskIcon, MSTile } from './icons/index.js';
export { extractIcons } from './icons/index.js';
export type { LanguageMetadata } from './language/index.js';
// Phase 4 modules (implemented)
export { extractLanguage } from './language/index.js';
export type { ExtractedLink, LinksExtractionOptions, LinksMetadata } from './links/index.js';
export { extractLinks } from './links/index.js';
export type { MonetizationMetadata } from './monetization/index.js';
export { extractMonetization } from './monetization/index.js';
export type { NewsMetadata } from './news/index.js';
export { extractNews } from './news/index.js';
export type {
  OpenGraphArticle,
  OpenGraphAudio,
  OpenGraphBook,
  OpenGraphImage,
  OpenGraphMetadata,
  OpenGraphProfile,
  OpenGraphVideo,
} from './opengraph/index.js';
export { extractOpenGraph } from './opengraph/index.js';
export type { PaginationMetadata } from './pagination/index.js';
export { extractPagination } from './pagination/index.js';
export type { RobotDirectives, RobotsMetadata } from './robots/index.js';
export { extractRobots, parseDirectives } from './robots/index.js';
export type { JsonLdBlock, SchemaOrgMetadata } from './schema-org/index.js';
// Phase 2 modules (implemented)
export { extractSchemaOrg } from './schema-org/index.js';
export type { SecurityMetadata } from './security/index.js';
export { extractSecurity } from './security/index.js';
export type { SEOMetadata } from './seo/index.js';
// Phase 1 modules (implemented)
export { extractSEO } from './seo/index.js';
export type { SitemapDiscoveryMetadata } from './sitemap-discovery/index.js';
export {
  COMMON_SITEMAP_PATHS,
  extractSitemapDiscovery,
  generateSitemapSuggestions,
} from './sitemap-discovery/index.js';
export type { SocialProfilesMetadata } from './social-profiles/index.js';
export { extractSocialProfiles } from './social-profiles/index.js';
export type {
  TwitterApp,
  TwitterAppPlatform,
  TwitterCardMetadata,
  TwitterPlayer,
} from './twitter-card/index.js';
export { extractTwitterCard } from './twitter-card/index.js';
// Unified types
export type { WebsiteMetadata } from './types.js';
export type { VerificationMetadata } from './verification/index.js';
export { extractVerification } from './verification/index.js';
