/**
 * Types for high-level gathering functionality.
 *
 * @packageDocumentation
 */

/**
 * Gathered website data.
 *
 * @remarks
 * This interface represents the complete gathered data from a website,
 * including the authoritative URL and all extracted metadata.
 * It will be extended incrementally with more properties.
 */
export interface Website {
  /**
   * Authoritative URL for the page.
   *
   * @remarks
   * Uses canonical URL if present, otherwise the final URL after redirects.
   */
  url: URL;

  /** Discovered feed URLs (RSS, Atom, JSON Feed) as URL objects */
  feeds: URL[];

  /**
   * Page title (cleaned, from best available source).
   *
   * @remarks
   * Collects titles from multiple sources, cleans them, and picks the longest.
   * Sources: OpenGraph, Twitter Card, HTML title tag, First H1
   */
  title?: string;

  /**
   * Page description (from best available source).
   *
   * @remarks
   * Collects descriptions from metadata and picks the longest.
   * Sources: OpenGraph, Twitter Card, HTML meta description
   */
  description?: string;

  /**
   * Page keyvisual/image URL (from best available source).
   *
   * @remarks
   * Priority: OpenGraph > Twitter Card > Largest Apple Touch Icon > Favicon
   * Returns the URL object of the best visual representation of the site.
   */
  image?: URL;

  /**
   * Best available icon/favicon for the site.
   *
   * @remarks
   * Priority: Largest Apple Touch Icon > Safari mask icon > Favicon > Shortcut icon > MS tile > Fluid icon
   * Returns the highest quality icon available, preferring modern, high-resolution formats.
   */
  icon?: URL;

  /**
   * Primary language code (ISO 639-1).
   *
   * @remarks
   * Extracted from HTML lang attribute, content-language meta tag, or OpenGraph locale.
   * Normalized to lowercase ISO 639-1 format (e.g., 'en', 'de', 'fr', 'ja').
   */
  language?: string;

  /**
   * Region code (ISO 3166-1 alpha-2).
   *
   * @remarks
   * Only present if the language includes a region specifier.
   * Normalized to uppercase ISO 3166-1 alpha-2 format (e.g., 'US', 'GB', 'DE').
   */
  region?: string;

  /**
   * Raw HTML content of the page (UTF-8).
   *
   * @remarks
   * The complete HTML source after fetching and decoding to UTF-8.
   * Useful for custom processing or caching.
   */
  html: string;

  /**
   * Plain text content extracted from the HTML.
   *
   * @remarks
   * Automatically converted from HTML using the `htmlToText` function.
   * Removes all tags, decodes entities, and preserves document structure
   * with appropriate line breaks.
   */
  text: string;

  /**
   * Internal links found on the page (same domain, excluding current URL).
   *
   * @remarks
   * All links are URL objects. The current page URL is excluded to avoid
   * self-references. Useful for site crawling and navigation analysis.
   */
  internalLinks: URL[];

  /**
   * External links found on the page (different domains).
   *
   * @remarks
   * All links are URL objects. Useful for analyzing outbound links,
   * citations, and external resources.
   */
  externalLinks: URL[];
}

/**
 * Gathered article data.
 *
 * @remarks
 * This interface represents the complete gathered data from an article page,
 * including the authoritative URL, raw HTML, and extracted content.
 * It will be extended incrementally with more properties.
 */
export interface Article {
  /**
   * Authoritative URL for the article.
   *
   * @remarks
   * Uses canonical URL if present, otherwise the final URL after redirects.
   */
  url: URL;

  /**
   * Raw HTML content of the article page (UTF-8).
   *
   * @remarks
   * The complete HTML source after fetching and decoding to UTF-8.
   * Useful for custom processing or caching.
   */
  html: string;

  /**
   * Plain text content extracted from the HTML.
   *
   * @remarks
   * Automatically converted from HTML using the `htmlToText` function.
   * Removes all tags, decodes entities, and preserves document structure
   * with appropriate line breaks.
   */
  text: string;

  /**
   * Cleaned article content (plain text).
   *
   * @remarks
   * Extracted using Mozilla Readability (cleaned HTML), then converted to
   * plain text using `htmlToText` for proper formatting.
   * This is the main article body without navigation, ads, or other clutter.
   * Falls back to undefined if Readability extraction fails.
   */
  content?: string;

  /**
   * Article title.
   *
   * @remarks
   * Extracted from Mozilla Readability if available.
   * Falls back to metadata (Schema.org, OpenGraph, Twitter Card, HTML title)
   * if Readability extraction fails or title is empty.
   */
  title?: string;

  /**
   * Article description/excerpt.
   *
   * @remarks
   * Extracted from Mozilla Readability's excerpt if available.
   * Falls back to metadata (OpenGraph, Twitter Card, HTML meta description)
   * if Readability excerpt is empty or extraction fails.
   */
  description?: string;

  /**
   * Article keyvisual/image URL (from best available source).
   *
   * @remarks
   * Priority: Schema.org NewsArticle/Article (largest) > OpenGraph > Twitter Card > Largest Apple Touch Icon > Favicon
   * Returns the URL object of the best visual representation of the article.
   */
  image?: URL;

  /**
   * Primary language code (ISO 639-1).
   *
   * @remarks
   * Extracted from HTML lang attribute, Content-Language meta, or OpenGraph locale.
   * Returns lowercase 2-letter ISO 639-1 code (e.g., 'en', 'de', 'fr').
   */
  language?: string;

  /**
   * Region/country code (ISO 3166-1 alpha-2).
   *
   * @remarks
   * Extracted from language tags like 'en-US' or 'de-DE'.
   * Returns uppercase 2-letter ISO 3166-1 alpha-2 code (e.g., 'US', 'GB', 'DE').
   */
  region?: string;

  /**
   * Internal links found in the article (same domain/subdomain).
   *
   * @remarks
   * Links pointing to pages within the same domain.
   * Automatically excludes the current article URL.
   * All URLs are absolute and normalized.
   */
  internalLinks: URL[];

  /**
   * External links found in the article (different domains).
   *
   * @remarks
   * Links pointing to external domains (useful for citations, references).
   * All URLs are absolute and normalized.
   */
  externalLinks: URL[];

  /**
   * Word count of the article.
   *
   * @remarks
   * Calculated from `content` if available (Readability-cleaned content),
   * otherwise calculated from `text` (full page text).
   * Based on whitespace-separated word boundaries.
   */
  wordCount: number;

  /**
   * Estimated reading time in minutes.
   *
   * @remarks
   * Calculated from word count using average reading speed of 200 words per minute.
   * Minimum value is 1 minute.
   */
  readingTime: number;
}
