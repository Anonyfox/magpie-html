/**
 * Assets extraction types.
 *
 * @remarks
 * Types for categorized asset URLs extracted from HTML documents.
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 *
 * @packageDocumentation
 */

/**
 * Categorized assets extracted from HTML.
 *
 * @remarks
 * Contains all external assets referenced in the document, organized by type.
 * All URLs are normalized to absolute format if a base URL is available.
 */
export interface AssetsMetadata {
  /** Image URLs from img, picture, srcset, and meta tags */
  images?: string[];

  /** Stylesheet URLs from link tags */
  stylesheets?: string[];

  /** Script URLs from script tags */
  scripts?: string[];

  /** Font URLs extracted from CSS */
  fonts?: string[];

  /** Media URLs from video, audio, source, and track elements */
  media?: string[];

  /** Web app manifest URLs */
  manifests?: string[];

  /** Preload/prefetch resource hints */
  preloads?: PreloadResource[];

  /** DNS prefetch and preconnect hints */
  connectionHints?: ConnectionHint[];
}

/**
 * Preload or prefetch resource hint.
 */
export interface PreloadResource {
  /** Resource URL */
  url: string;

  /** Resource type (script, style, font, image, etc.) */
  as?: string;

  /** MIME type */
  type?: string;

  /** Crossorigin attribute */
  crossorigin?: string;

  /** Whether this is a prefetch (true) or preload (false) */
  prefetch?: boolean;
}

/**
 * DNS prefetch or preconnect hint.
 */
export interface ConnectionHint {
  /** Domain URL */
  url: string;

  /** Whether this is a preconnect (true) or dns-prefetch (false) */
  preconnect?: boolean;

  /** Crossorigin attribute */
  crossorigin?: string;
}
