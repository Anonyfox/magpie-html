/**
 * Schema.org / JSON-LD extraction.
 *
 * @remarks
 * Extracts structured data from JSON-LD script tags.
 *
 * @packageDocumentation
 */

import { type DocumentInput, ensureDocument } from '../../utils/html-parser.js';
import { extractGraphItems, matchesAnyType, parseJsonLd } from './parse-json-ld.js';
import type { SchemaOrgMetadata } from './types.js';

/**
 * Extract Schema.org metadata from HTML.
 *
 * @remarks
 * Finds all <script type="application/ld+json"> tags, parses the JSON-LD,
 * and organizes by type for easy access.
 *
 * @param input - Parsed HTML document or raw HTML string
 * @returns Schema.org metadata object
 *
 * @example
 * ```typescript
 * // With parsed document (recommended for multiple extractions)
 * const doc = parseHTML(htmlString);
 * const schema = extractSchemaOrg(doc);
 *
 * // Or directly with HTML string
 * const schema = extractSchemaOrg(htmlString);
 * ```
 */
export function extractSchemaOrg(input: DocumentInput): SchemaOrgMetadata {
  const doc = ensureDocument(input);
  const metadata: SchemaOrgMetadata = {
    jsonLd: [],
  };

  // Find all JSON-LD script tags
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

  // Parse each script
  for (const script of Array.from(scripts)) {
    // Try different ways to get script content
    const content = script.textContent || script.innerHTML;
    if (!content) continue;

    const block = parseJsonLd(content);
    if (block) {
      metadata.jsonLd.push(block);
    }
  }

  // Organize by type for convenience
  if (metadata.jsonLd.length > 0) {
    organizeByType(metadata);
  }

  return metadata;
}

/**
 * Organize JSON-LD blocks by type for convenience accessors.
 */
function organizeByType(metadata: SchemaOrgMetadata): void {
  const articles: unknown[] = [];
  const webPages: unknown[] = [];
  const breadcrumbs: unknown[] = [];
  const products: unknown[] = [];
  const events: unknown[] = [];
  const recipes: unknown[] = [];
  const videos: unknown[] = [];
  const images: unknown[] = [];
  let organization: unknown | undefined;
  let person: unknown | undefined;

  // Process each JSON-LD block
  for (const block of metadata.jsonLd) {
    // Extract items from @graph if present
    const items = extractGraphItems(block.parsed);

    for (const item of items) {
      // Articles (Article, NewsArticle, BlogPosting, etc.)
      if (matchesAnyType(item, ['Article', 'NewsArticle', 'BlogPosting', 'TechArticle'])) {
        articles.push(item);
      }

      // Web pages (WebPage, WebSite)
      if (matchesAnyType(item, ['WebPage', 'WebSite', 'AboutPage', 'ContactPage'])) {
        webPages.push(item);
      }

      // Breadcrumbs
      if (matchesAnyType(item, ['BreadcrumbList'])) {
        breadcrumbs.push(item);
      }

      // Products
      if (matchesAnyType(item, ['Product'])) {
        products.push(item);
      }

      // Events
      if (matchesAnyType(item, ['Event'])) {
        events.push(item);
      }

      // Recipes
      if (matchesAnyType(item, ['Recipe'])) {
        recipes.push(item);
      }

      // Videos
      if (matchesAnyType(item, ['VideoObject'])) {
        videos.push(item);
      }

      // Images
      if (matchesAnyType(item, ['ImageObject'])) {
        images.push(item);
      }

      // Organization (take first one)
      if (!organization && matchesAnyType(item, ['Organization', 'Corporation'])) {
        organization = item;
      }

      // Person (take first one)
      if (!person && matchesAnyType(item, ['Person'])) {
        person = item;
      }
    }
  }

  // Add to metadata if found
  if (articles.length > 0) metadata.articles = articles;
  if (webPages.length > 0) metadata.webPages = webPages;
  if (breadcrumbs.length > 0) metadata.breadcrumbs = breadcrumbs;
  if (products.length > 0) metadata.products = products;
  if (events.length > 0) metadata.events = events;
  if (recipes.length > 0) metadata.recipes = recipes;
  if (videos.length > 0) metadata.videos = videos;
  if (images.length > 0) metadata.images = images;
  if (organization) metadata.organization = organization;
  if (person) metadata.person = person;
}
