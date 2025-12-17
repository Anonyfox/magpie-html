/**
 * OpenGraph metadata types.
 *
 * @remarks
 * Facebook's Open Graph protocol for rich social sharing.
 *
 * @packageDocumentation
 */

/**
 * OpenGraph article metadata.
 */
export interface OpenGraphArticle {
  /** Publication date */
  publishedTime?: string;
  /** Last modification date */
  modifiedTime?: string;
  /** Expiration date */
  expirationTime?: string;
  /** Article authors */
  authors?: string[];
  /** Article section/category */
  section?: string;
  /** Article tags */
  tags?: string[];
}

/**
 * OpenGraph video metadata.
 */
export interface OpenGraphVideo {
  /** Video URL */
  url?: string;
  /** HTTPS video URL */
  secureUrl?: string;
  /** MIME type */
  type?: string;
  /** Video width in pixels */
  width?: number;
  /** Video height in pixels */
  height?: number;
  /** Video duration in seconds */
  duration?: number;
  /** Release date */
  releaseDate?: string;
  /** Video tags */
  tags?: string[];
}

/**
 * OpenGraph audio metadata.
 */
export interface OpenGraphAudio {
  /** Audio URL */
  url?: string;
  /** HTTPS audio URL */
  secureUrl?: string;
  /** MIME type */
  type?: string;
}

/**
 * OpenGraph image metadata.
 */
export interface OpenGraphImage {
  /** Image URL */
  url: string;
  /** HTTPS image URL */
  secureUrl?: string;
  /** MIME type */
  type?: string;
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
  /** Alt text */
  alt?: string;
}

/**
 * OpenGraph book metadata.
 */
export interface OpenGraphBook {
  /** Book authors */
  authors?: string[];
  /** ISBN number */
  isbn?: string;
  /** Release date */
  releaseDate?: string;
  /** Book tags */
  tags?: string[];
}

/**
 * OpenGraph profile metadata.
 */
export interface OpenGraphProfile {
  /** First name */
  firstName?: string;
  /** Last name */
  lastName?: string;
  /** Username */
  username?: string;
  /** Gender */
  gender?: string;
}

/**
 * OpenGraph metadata extracted from meta tags.
 *
 * @remarks
 * Contains metadata from the Open Graph protocol used for rich social sharing.
 * All fields are optional - only present if found in the document.
 */
export interface OpenGraphMetadata {
  /** Content title */
  title?: string;
  /** Content type (article, website, video, etc.) */
  type?: string;
  /** Preview image URL (primary image) */
  image?: string;
  /** Canonical URL */
  url?: string;
  /** Content description */
  description?: string;
  /** Site name */
  siteName?: string;
  /** Content locale (e.g., en_US) */
  locale?: string;
  /** Alternate locales */
  localeAlternate?: string[];

  /** Article-specific metadata (if type is article) */
  article?: OpenGraphArticle;

  /** Video metadata (if type is video or video present) */
  video?: OpenGraphVideo;

  /** Audio metadata (if audio present) */
  audio?: OpenGraphAudio;

  /** All images with full metadata (if multiple images) */
  images?: OpenGraphImage[];

  /** Book metadata (if type is book) */
  book?: OpenGraphBook;

  /** Profile metadata (if type is profile) */
  profile?: OpenGraphProfile;
}
