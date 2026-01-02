/**
 * Sitemap Parser Module
 *
 * @remarks
 * Parses XML sitemaps including standard sitemaps, sitemap indexes,
 * and extensions like Google News, Image, and Video sitemaps.
 *
 * @packageDocumentation
 */

export { isSitemap, parseSitemap } from './parse.js';
export type {
  Sitemap,
  SitemapImage,
  SitemapIndexEntry,
  SitemapNews,
  SitemapParseResult,
  SitemapUrl,
  SitemapVideo,
} from './types.js';
