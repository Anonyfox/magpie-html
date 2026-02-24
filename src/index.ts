/**
 * Magpie HTML - Universal web content scraper for Node.js and browsers
 *
 * @remarks
 * A modern TypeScript library for parsing web feeds (RSS, Atom, JSON Feed),
 * extracting metadata, and scraping article content from HTML.
 * Designed to be isomorphic, type-safe, and resilient to malformed data.
 *
 * Key features:
 * - Universal feed parser with automatic format detection
 * - Comprehensive metadata extraction (SEO, OpenGraph, Schema.org, etc.)
 * - Article content extraction with Mozilla Readability
 * - Smart URL resolution (relative to absolute)
 * - Content quality assessment
 * - Full TypeScript support
 * - Minimal runtime dependencies
 *
 * @packageDocumentation
 */

// Content Extraction - Types and Functions
export type {
  ContentExtractionOptions,
  ContentQuality,
  ContentResult,
  ExtractedContent,
  ExtractionErrorType,
  ExtractionFailure,
  HtmlToTextOptions,
} from './content/index.js';
export {
  assessContentQuality,
  calculateReadingTime,
  countWords,
  extractContent,
  htmlToText,
  isProbablyReaderable,
} from './content/index.js';
// Feed Parser - Types
export type {
  Feed,
  FeedAuthor,
  FeedEnclosure,
  FeedFormat,
  FeedItem,
  ParseResult,
} from './feed/index.js';
// Feed Parser - Main API
export { detectFormat, isAtom, isFeed, isJSONFeed, isRSS, parseFeed } from './feed/index.js';
// High-level gathering - Convenience methods combining fetch + parse
export type { Article, Website } from './gather/index.js';
export { gatherArticle, gatherFeed, gatherWebsite } from './gather/index.js';
// Metadata Extraction - Types and Functions
export type {
  AlternateLink,
  AnalyticsMetadata,
  AppLinks,
  AppleTouchIcon,
  AssetsMetadata,
  CanonicalMetadata,
  ConnectionHint,
  CopyrightMetadata,
  DiscoveredFeed,
  DublinCoreMetadata,
  ExtractedLink,
  FeedDiscoveryMetadata,
  GeoMetadata,
  GeoPosition,
  IconsMetadata,
  JsonLdBlock,
  LanguageMetadata,
  LinksExtractionOptions,
  LinksMetadata,
  MaskIcon,
  MonetizationMetadata,
  MSTile,
  NewsMetadata,
  OpenGraphArticle,
  OpenGraphAudio,
  OpenGraphBook,
  OpenGraphImage,
  OpenGraphMetadata,
  OpenGraphProfile,
  OpenGraphVideo,
  PaginationMetadata,
  PreloadResource,
  RobotDirectives,
  RobotsMetadata,
  SchemaOrgMetadata,
  SEOMetadata,
  SecurityMetadata,
  SitemapDiscoveryMetadata,
  SocialProfilesMetadata,
  TwitterApp,
  TwitterAppPlatform,
  TwitterCardMetadata,
  TwitterPlayer,
  VerificationMetadata,
} from './metadata/index.js';
export {
  extractAnalytics,
  extractAssets,
  extractCanonical,
  extractCopyright,
  extractDublinCore,
  extractFeedDiscovery,
  extractGeo,
  extractIcons,
  extractLanguage,
  extractLinks,
  extractMonetization,
  extractNews,
  extractOpenGraph,
  extractPagination,
  extractRobots,
  extractSchemaOrg,
  extractSEO,
  extractSecurity,
  extractSitemapDiscovery,
  extractSocialProfiles,
  extractTwitterCard,
  extractVerification,
} from './metadata/index.js';
export type { PluckInit, PluckResponse } from './pluck/index.js';
// Enhanced fetch for web scraping
export {
  PluckContentTypeError,
  PluckEncodingError,
  PluckError,
  PluckHttpError,
  PluckNetworkError,
  PluckRedirectError,
  PluckSizeError,
  PluckTimeoutError,
  pluck,
} from './pluck/index.js';
// Experimental SPA rendering
export type { SwoopInit, SwoopResult, SwoopWaitStrategy } from './swoop/index.js';
export {
  SwoopEnvironmentError,
  SwoopError,
  SwoopExecutionError,
  SwoopSecurityError,
  SwoopTimeoutError,
  swoop,
} from './swoop/index.js';
// Utilities
export type { DocumentInput, HTMLDocument } from './utils/html-parser.js';
export { parseHTML } from './utils/html-parser.js';
