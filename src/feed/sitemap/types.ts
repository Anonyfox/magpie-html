/**
 * Sitemap XML Type Definitions
 * Spec: https://www.sitemaps.org/protocol.html
 * Google News: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */

/**
 * Standard sitemap URL entry
 */
export interface SitemapUrl {
  /** URL of the page (required) */
  loc: string;
  /** Last modification date (ISO 8601) */
  lastmod?: string;
  /** Change frequency hint */
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' | string;
  /** Priority relative to other URLs (0.0 to 1.0) */
  priority?: number;
  /** Google News extension data */
  news?: SitemapNews;
  /** Image extension data */
  images?: SitemapImage[];
  /** Video extension data */
  videos?: SitemapVideo[];
}

/**
 * Google News sitemap extension
 */
export interface SitemapNews {
  /** Publication info */
  publication?: {
    /** Publication name */
    name?: string;
    /** Language code (ISO 639) */
    language?: string;
  };
  /** Publication date (ISO 8601) */
  publicationDate?: string;
  /** Article title */
  title?: string;
  /** Keywords (deprecated but still used) */
  keywords?: string[];
  /** Stock tickers */
  stockTickers?: string[];
}

/**
 * Image sitemap extension
 */
export interface SitemapImage {
  /** Image URL (required) */
  loc: string;
  /** Image caption */
  caption?: string;
  /** Geographic location */
  geoLocation?: string;
  /** Image title */
  title?: string;
  /** Image license URL */
  license?: string;
}

/**
 * Video sitemap extension
 */
export interface SitemapVideo {
  /** Thumbnail URL (required) */
  thumbnailLoc: string;
  /** Video title (required) */
  title: string;
  /** Video description (required) */
  description: string;
  /** Video content URL */
  contentLoc?: string;
  /** Video player URL */
  playerLoc?: string;
  /** Duration in seconds */
  duration?: number;
  /** Expiration date */
  expirationDate?: string;
  /** Rating (0.0 to 5.0) */
  rating?: number;
  /** View count */
  viewCount?: number;
  /** Publication date */
  publicationDate?: string;
  /** Family friendly flag */
  familyFriendly?: boolean;
  /** Tags */
  tags?: string[];
  /** Category */
  category?: string;
}

/**
 * Sitemap index entry (references other sitemaps)
 */
export interface SitemapIndexEntry {
  /** URL of the sitemap */
  loc: string;
  /** Last modification date */
  lastmod?: string;
}

/**
 * Complete Sitemap document
 */
export interface Sitemap {
  /** Type of sitemap */
  type: 'urlset' | 'sitemapindex';
  /** URLs (for urlset type) */
  urls: SitemapUrl[];
  /** Sitemap references (for sitemapindex type) */
  sitemaps: SitemapIndexEntry[];
}

/**
 * Parse result with original data preserved
 */
export interface SitemapParseResult {
  /** Parsed sitemap data */
  sitemap: Sitemap;
  /** Whether this is a sitemap index */
  isIndex: boolean;
}

