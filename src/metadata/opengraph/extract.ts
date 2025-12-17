/**
 * OpenGraph metadata extraction.
 *
 * @remarks
 * Extracts Open Graph protocol metadata from HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLDocument as Document } from '../../utils/html-parser.js';
import { getAllMetaPropertyValues, getMetaProperty } from '../../utils/meta-helpers.js';
import type {
  OpenGraphArticle,
  OpenGraphAudio,
  OpenGraphBook,
  OpenGraphImage,
  OpenGraphMetadata,
  OpenGraphProfile,
  OpenGraphVideo,
} from './types.js';

/**
 * Extract OpenGraph metadata from parsed HTML document.
 *
 * @remarks
 * Extracts Open Graph protocol metadata including basic metadata,
 * article data, video/audio, images, books, and profiles.
 *
 * @param doc - Parsed HTML document
 * @returns OpenGraph metadata object
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const og = extractOpenGraph(doc);
 * console.log(og.title);
 * console.log(og.image);
 * console.log(og.article?.publishedTime);
 * ```
 */
export function extractOpenGraph(doc: Document): OpenGraphMetadata {
  const metadata: OpenGraphMetadata = {};

  // Extract basic OpenGraph properties
  metadata.title = getMetaProperty(doc, 'og:title');
  metadata.type = getMetaProperty(doc, 'og:type');
  metadata.image = getMetaProperty(doc, 'og:image');
  metadata.url = getMetaProperty(doc, 'og:url');
  metadata.description = getMetaProperty(doc, 'og:description');
  metadata.siteName = getMetaProperty(doc, 'og:site_name');
  metadata.locale = getMetaProperty(doc, 'og:locale');

  // Alternate locales (can be multiple)
  const alternateLocales = getAllMetaPropertyValues(doc, 'og:locale:alternate');
  if (alternateLocales.length > 0) {
    metadata.localeAlternate = alternateLocales;
  }

  // Extract article metadata
  const article = extractArticle(doc);
  if (Object.keys(article).length > 0) {
    metadata.article = article;
  }

  // Extract video metadata
  const video = extractVideo(doc);
  if (Object.keys(video).length > 0) {
    metadata.video = video;
  }

  // Extract audio metadata
  const audio = extractAudio(doc);
  if (Object.keys(audio).length > 0) {
    metadata.audio = audio;
  }

  // Extract all images with metadata
  const images = extractImages(doc);
  if (images.length > 0) {
    metadata.images = images;
  }

  // Extract book metadata
  const book = extractBook(doc);
  if (Object.keys(book).length > 0) {
    metadata.book = book;
  }

  // Extract profile metadata
  const profile = extractProfile(doc);
  if (Object.keys(profile).length > 0) {
    metadata.profile = profile;
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as OpenGraphMetadata;
}

/**
 * Extract article-specific metadata.
 */
function extractArticle(doc: Document): OpenGraphArticle {
  const article: OpenGraphArticle = {};

  article.publishedTime = getMetaProperty(doc, 'article:published_time');
  article.modifiedTime = getMetaProperty(doc, 'article:modified_time');
  article.expirationTime = getMetaProperty(doc, 'article:expiration_time');
  article.section = getMetaProperty(doc, 'article:section');

  // Multiple authors
  const authors = getAllMetaPropertyValues(doc, 'article:author');
  if (authors.length > 0) {
    article.authors = authors;
  }

  // Multiple tags
  const tags = getAllMetaPropertyValues(doc, 'article:tag');
  if (tags.length > 0) {
    article.tags = tags;
  }

  return Object.fromEntries(
    Object.entries(article).filter(([_, value]) => value !== undefined),
  ) as OpenGraphArticle;
}

/**
 * Extract video metadata.
 */
function extractVideo(doc: Document): OpenGraphVideo {
  const video: OpenGraphVideo = {};

  video.url = getMetaProperty(doc, 'og:video') || getMetaProperty(doc, 'og:video:url');
  video.secureUrl = getMetaProperty(doc, 'og:video:secure_url');
  video.type = getMetaProperty(doc, 'og:video:type');
  video.releaseDate = getMetaProperty(doc, 'og:video:release_date');

  // Parse numeric values
  const width = getMetaProperty(doc, 'og:video:width');
  if (width) {
    video.width = Number.parseInt(width, 10);
  }

  const height = getMetaProperty(doc, 'og:video:height');
  if (height) {
    video.height = Number.parseInt(height, 10);
  }

  const duration = getMetaProperty(doc, 'og:video:duration');
  if (duration) {
    video.duration = Number.parseInt(duration, 10);
  }

  // Multiple tags
  const tags = getAllMetaPropertyValues(doc, 'og:video:tag');
  if (tags.length > 0) {
    video.tags = tags;
  }

  return Object.fromEntries(
    Object.entries(video).filter(([_, value]) => value !== undefined),
  ) as OpenGraphVideo;
}

/**
 * Extract audio metadata.
 */
function extractAudio(doc: Document): OpenGraphAudio {
  const audio: OpenGraphAudio = {};

  audio.url = getMetaProperty(doc, 'og:audio') || getMetaProperty(doc, 'og:audio:url');
  audio.secureUrl = getMetaProperty(doc, 'og:audio:secure_url');
  audio.type = getMetaProperty(doc, 'og:audio:type');

  return Object.fromEntries(
    Object.entries(audio).filter(([_, value]) => value !== undefined),
  ) as OpenGraphAudio;
}

/**
 * Extract all images with full metadata.
 */
function extractImages(doc: Document): OpenGraphImage[] {
  const images: OpenGraphImage[] = [];

  // Get all og:image values (can be multiple)
  const imageUrls = getAllMetaPropertyValues(doc, 'og:image');
  const imageSecureUrls = getAllMetaPropertyValues(doc, 'og:image:secure_url');
  const imageTypes = getAllMetaPropertyValues(doc, 'og:image:type');
  const imageWidths = getAllMetaPropertyValues(doc, 'og:image:width');
  const imageHeights = getAllMetaPropertyValues(doc, 'og:image:height');
  const imageAlts = getAllMetaPropertyValues(doc, 'og:image:alt');

  // Build image objects
  for (let i = 0; i < imageUrls.length; i++) {
    const image: OpenGraphImage = {
      url: imageUrls[i],
      secureUrl: imageSecureUrls[i],
      type: imageTypes[i],
      alt: imageAlts[i],
    };

    // Parse numeric dimensions
    if (imageWidths[i]) {
      image.width = Number.parseInt(imageWidths[i], 10);
    }
    if (imageHeights[i]) {
      image.height = Number.parseInt(imageHeights[i], 10);
    }

    // Remove undefined values
    images.push(
      Object.fromEntries(
        Object.entries(image).filter(([_, value]) => value !== undefined),
      ) as OpenGraphImage,
    );
  }

  return images;
}

/**
 * Extract book metadata.
 */
function extractBook(doc: Document): OpenGraphBook {
  const book: OpenGraphBook = {};

  book.isbn = getMetaProperty(doc, 'book:isbn');
  book.releaseDate = getMetaProperty(doc, 'book:release_date');

  // Multiple authors
  const authors = getAllMetaPropertyValues(doc, 'book:author');
  if (authors.length > 0) {
    book.authors = authors;
  }

  // Multiple tags
  const tags = getAllMetaPropertyValues(doc, 'book:tag');
  if (tags.length > 0) {
    book.tags = tags;
  }

  return Object.fromEntries(
    Object.entries(book).filter(([_, value]) => value !== undefined),
  ) as OpenGraphBook;
}

/**
 * Extract profile metadata.
 */
function extractProfile(doc: Document): OpenGraphProfile {
  const profile: OpenGraphProfile = {};

  profile.firstName = getMetaProperty(doc, 'profile:first_name');
  profile.lastName = getMetaProperty(doc, 'profile:last_name');
  profile.username = getMetaProperty(doc, 'profile:username');
  profile.gender = getMetaProperty(doc, 'profile:gender');

  return Object.fromEntries(
    Object.entries(profile).filter(([_, value]) => value !== undefined),
  ) as OpenGraphProfile;
}
