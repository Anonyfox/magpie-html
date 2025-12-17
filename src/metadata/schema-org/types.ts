/**
 * Schema.org / JSON-LD metadata types.
 *
 * @remarks
 * Structured data for search engines and rich snippets using JSON-LD format.
 *
 * @packageDocumentation
 */

/**
 * A single JSON-LD block found in the document.
 */
export interface JsonLdBlock {
  /** Original JSON string */
  raw: string;

  /** Parsed JSON object */
  parsed: unknown;

  /** @type field(s) from the JSON-LD */
  type?: string | string[];

  /** @context field */
  context?: string | unknown;
}

/**
 * Schema.org metadata extracted from JSON-LD scripts.
 *
 * @remarks
 * Contains all JSON-LD structured data blocks found in the document.
 * Provides convenience accessors for common types.
 */
export interface SchemaOrgMetadata {
  /** All JSON-LD blocks found in the document */
  jsonLd: JsonLdBlock[];

  /** Convenience: Article/NewsArticle/BlogPosting types */
  articles?: unknown[];

  /** Convenience: WebPage/WebSite types */
  webPages?: unknown[];

  /** Convenience: BreadcrumbList type */
  breadcrumbs?: unknown[];

  /** Convenience: Organization type */
  organization?: unknown;

  /** Convenience: Person type */
  person?: unknown;

  /** Convenience: Product types */
  products?: unknown[];

  /** Convenience: Event types */
  events?: unknown[];

  /** Convenience: Recipe types */
  recipes?: unknown[];

  /** Convenience: VideoObject types */
  videos?: unknown[];

  /** Convenience: ImageObject types */
  images?: unknown[];
}
