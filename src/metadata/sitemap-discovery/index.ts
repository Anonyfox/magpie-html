/**
 * Sitemap discovery module.
 *
 * @remarks
 * Discovers XML sitemaps in HTML documents.
 *
 * @packageDocumentation
 */

export { extractSitemapDiscovery } from './extract.js';
export { COMMON_SITEMAP_PATHS, generateSitemapSuggestions } from './heuristics.js';
export type { SitemapDiscoveryMetadata } from './types.js';
