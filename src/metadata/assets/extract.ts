/**
 * Assets extraction.
 *
 * @remarks
 * Extracts categorized asset URLs from HTML documents.
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 *
 * @packageDocumentation
 */

import type { HTMLDocument as Document } from '../../utils/html-parser.js';
import { normalizeUrl } from '../../utils/normalize-url.js';
import type { AssetsMetadata, ConnectionHint, PreloadResource } from './types.js';

/**
 * Extract assets metadata from parsed HTML document.
 *
 * @remarks
 * Extracts all external assets referenced in the document, organized by type.
 * All URLs are normalized to absolute format based on the document's base URL.
 *
 * The extractor finds assets from:
 * - Images: `<img>`, `<picture>`, `srcset`, OpenGraph meta tags
 * - Stylesheets: `<link rel="stylesheet">`
 * - Scripts: `<script src>`
 * - Fonts: CSS `@font-face` and `url()` with font extensions
 * - Media: `<video>`, `<audio>`, `<source>`, `<track>`
 * - Manifests: `<link rel="manifest">`
 * - Preloads: `<link rel="preload">` and `<link rel="prefetch">`
 * - Connection hints: `<link rel="dns-prefetch">` and `<link rel="preconnect">`
 *
 * @param doc - Parsed HTML document
 * @param baseUrl - Optional base URL for resolving relative URLs
 * @returns Assets metadata object with categorized URLs
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const assets = extractAssets(doc, 'https://example.com');
 * console.log(assets.images);
 * console.log(assets.stylesheets);
 * console.log(assets.scripts);
 * ```
 */
export function extractAssets(doc: Document, baseUrl?: string | URL | null): AssetsMetadata {
  const metadata: AssetsMetadata = {};

  // Determine effective base URL (from <base> tag or parameter)
  const effectiveBaseUrl = getEffectiveBaseUrl(doc, baseUrl);

  // Extract images
  const images = extractImages(doc, effectiveBaseUrl);
  if (images.length > 0) {
    metadata.images = images;
  }

  // Extract stylesheets
  const stylesheets = extractStylesheets(doc, effectiveBaseUrl);
  if (stylesheets.length > 0) {
    metadata.stylesheets = stylesheets;
  }

  // Extract scripts
  const scripts = extractScripts(doc, effectiveBaseUrl);
  if (scripts.length > 0) {
    metadata.scripts = scripts;
  }

  // Extract fonts from CSS
  const fonts = extractFonts(doc, effectiveBaseUrl);
  if (fonts.length > 0) {
    metadata.fonts = fonts;
  }

  // Extract media
  const media = extractMedia(doc, effectiveBaseUrl);
  if (media.length > 0) {
    metadata.media = media;
  }

  // Extract manifests
  const manifests = extractManifests(doc, effectiveBaseUrl);
  if (manifests.length > 0) {
    metadata.manifests = manifests;
  }

  // Extract preload/prefetch hints
  const preloads = extractPreloads(doc, effectiveBaseUrl);
  if (preloads.length > 0) {
    metadata.preloads = preloads;
  }

  // Extract connection hints
  const connectionHints = extractConnectionHints(doc, effectiveBaseUrl);
  if (connectionHints.length > 0) {
    metadata.connectionHints = connectionHints;
  }

  return metadata;
}

/**
 * Get effective base URL from <base> tag or parameter.
 */
function getEffectiveBaseUrl(doc: Document, baseUrl?: string | URL | null): string | null {
  // Check for <base> tag first
  const baseElement = doc.querySelector('base[href]');
  if (baseElement) {
    const baseHref = baseElement.getAttribute('href');
    if (baseHref) {
      try {
        // If baseUrl is provided, resolve relative base href against it
        if (baseUrl) {
          const resolvedBase = normalizeUrl(baseUrl, baseHref);
          return resolvedBase || null;
        }
        return baseHref;
      } catch {
        // Fall through to use provided baseUrl
      }
    }
  }

  // Use provided base URL
  if (baseUrl) {
    return typeof baseUrl === 'string' ? baseUrl : baseUrl.href;
  }

  return null;
}

/**
 * Extract image URLs.
 */
function extractImages(doc: Document, baseUrl: string | null): string[] {
  const urls = new Set<string>();

  // Extract from <img src>
  const imgElements = doc.querySelectorAll('img[src]');
  for (const img of Array.from(imgElements)) {
    const src = img.getAttribute('src');
    if (src) {
      const normalized = normalizeUrl(baseUrl, src);
      if (normalized) urls.add(normalized);
    }
  }

  // Extract from srcset (img and source elements)
  const srcsetElements = doc.querySelectorAll('img[srcset], source[srcset]');
  for (const element of Array.from(srcsetElements)) {
    const srcset = element.getAttribute('srcset');
    if (srcset) {
      const srcsetUrls = parseSrcset(srcset);
      for (const url of srcsetUrls) {
        const normalized = normalizeUrl(baseUrl, url);
        if (normalized) urls.add(normalized);
      }
    }
  }

  // Extract from <picture><source srcset>
  const pictureSourceElements = doc.querySelectorAll('picture source[srcset]');
  for (const source of Array.from(pictureSourceElements)) {
    const srcset = source.getAttribute('srcset');
    if (srcset) {
      const srcsetUrls = parseSrcset(srcset);
      for (const url of srcsetUrls) {
        const normalized = normalizeUrl(baseUrl, url);
        if (normalized) urls.add(normalized);
      }
    }
  }

  // Extract from OpenGraph meta tags
  const ogImages = doc.querySelectorAll('meta[property="og:image"], meta[property="og:image:url"]');
  for (const meta of Array.from(ogImages)) {
    const content = meta.getAttribute('content');
    if (content) {
      const normalized = normalizeUrl(baseUrl, content);
      if (normalized) urls.add(normalized);
    }
  }

  // Extract from Twitter Card meta tags
  const twitterImages = doc.querySelectorAll(
    'meta[name="twitter:image"], meta[name="twitter:image:src"]',
  );
  for (const meta of Array.from(twitterImages)) {
    const content = meta.getAttribute('content');
    if (content) {
      const normalized = normalizeUrl(baseUrl, content);
      if (normalized) urls.add(normalized);
    }
  }

  return Array.from(urls);
}

/**
 * Parse srcset attribute into individual URLs.
 */
function parseSrcset(srcset: string): string[] {
  const urls: string[] = [];
  const candidates = srcset.split(',').map((s) => s.trim());

  for (const candidate of candidates) {
    // srcset format: "url 1x" or "url 100w" or just "url"
    const parts = candidate.split(/\s+/);
    if (parts[0]) {
      urls.push(parts[0]);
    }
  }

  return urls;
}

/**
 * Extract stylesheet URLs.
 */
function extractStylesheets(doc: Document, baseUrl: string | null): string[] {
  const urls = new Set<string>();

  const linkElements = doc.querySelectorAll('link[rel="stylesheet"][href]');
  for (const link of Array.from(linkElements)) {
    const href = link.getAttribute('href');
    if (href) {
      const normalized = normalizeUrl(baseUrl, href);
      if (normalized) urls.add(normalized);
    }
  }

  return Array.from(urls);
}

/**
 * Extract script URLs.
 */
function extractScripts(doc: Document, baseUrl: string | null): string[] {
  const urls = new Set<string>();

  const scriptElements = doc.querySelectorAll('script[src]');
  for (const script of Array.from(scriptElements)) {
    const src = script.getAttribute('src');
    if (src) {
      const normalized = normalizeUrl(baseUrl, src);
      if (normalized) urls.add(normalized);
    }
  }

  return Array.from(urls);
}

/**
 * Extract font URLs from CSS (inline styles and style tags).
 */
function extractFonts(doc: Document, baseUrl: string | null): string[] {
  const urls = new Set<string>();

  // Extract from <style> tags
  const styleElements = doc.querySelectorAll('style');
  for (const style of Array.from(styleElements)) {
    const css = style.textContent || '';
    const fontUrls = extractFontUrlsFromCss(css);
    for (const url of fontUrls) {
      const normalized = normalizeUrl(baseUrl, url);
      if (normalized) urls.add(normalized);
    }
  }

  // Extract from inline style attributes
  const elementsWithStyle = doc.querySelectorAll('[style]');
  for (const element of Array.from(elementsWithStyle)) {
    const style = element.getAttribute('style') || '';
    const fontUrls = extractFontUrlsFromCss(style);
    for (const url of fontUrls) {
      const normalized = normalizeUrl(baseUrl, url);
      if (normalized) urls.add(normalized);
    }
  }

  // Also check for preload hints for fonts
  const fontPreloads = doc.querySelectorAll('link[rel="preload"][as="font"][href]');
  for (const link of Array.from(fontPreloads)) {
    const href = link.getAttribute('href');
    if (href) {
      const normalized = normalizeUrl(baseUrl, href);
      if (normalized) urls.add(normalized);
    }
  }

  return Array.from(urls);
}

/**
 * Extract font URLs from CSS content.
 */
function extractFontUrlsFromCss(css: string): string[] {
  const urls: string[] = [];

  // Match url(...) with font extensions
  const urlRegex = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
  const fontExtensions = /\.(woff2?|ttf|otf|eot)(\?.*)?$/i;

  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: Standard regex pattern matching
  while ((match = urlRegex.exec(css)) !== null) {
    const url = match[1];
    if (url && fontExtensions.test(url)) {
      urls.push(url);
    }
  }

  return urls;
}

/**
 * Extract media URLs (video, audio, source, track).
 */
function extractMedia(doc: Document, baseUrl: string | null): string[] {
  const urls = new Set<string>();

  // Video and audio elements with src
  const mediaElements = doc.querySelectorAll('video[src], audio[src]');
  for (const media of Array.from(mediaElements)) {
    const src = media.getAttribute('src');
    if (src) {
      const normalized = normalizeUrl(baseUrl, src);
      if (normalized) urls.add(normalized);
    }
  }

  // Source elements (inside video/audio)
  const sourceElements = doc.querySelectorAll('video source[src], audio source[src], source[src]');
  for (const source of Array.from(sourceElements)) {
    const src = source.getAttribute('src');
    if (src) {
      const normalized = normalizeUrl(baseUrl, src);
      if (normalized) urls.add(normalized);
    }
  }

  // Track elements (subtitles, captions)
  const trackElements = doc.querySelectorAll('track[src]');
  for (const track of Array.from(trackElements)) {
    const src = track.getAttribute('src');
    if (src) {
      const normalized = normalizeUrl(baseUrl, src);
      if (normalized) urls.add(normalized);
    }
  }

  // OpenGraph video
  const ogVideos = doc.querySelectorAll('meta[property="og:video"], meta[property="og:video:url"]');
  for (const meta of Array.from(ogVideos)) {
    const content = meta.getAttribute('content');
    if (content) {
      const normalized = normalizeUrl(baseUrl, content);
      if (normalized) urls.add(normalized);
    }
  }

  // OpenGraph audio
  const ogAudios = doc.querySelectorAll('meta[property="og:audio"], meta[property="og:audio:url"]');
  for (const meta of Array.from(ogAudios)) {
    const content = meta.getAttribute('content');
    if (content) {
      const normalized = normalizeUrl(baseUrl, content);
      if (normalized) urls.add(normalized);
    }
  }

  return Array.from(urls);
}

/**
 * Extract manifest URLs.
 */
function extractManifests(doc: Document, baseUrl: string | null): string[] {
  const urls = new Set<string>();

  const linkElements = doc.querySelectorAll('link[rel="manifest"][href]');
  for (const link of Array.from(linkElements)) {
    const href = link.getAttribute('href');
    if (href) {
      const normalized = normalizeUrl(baseUrl, href);
      if (normalized) urls.add(normalized);
    }
  }

  return Array.from(urls);
}

/**
 * Extract preload and prefetch resource hints.
 */
function extractPreloads(doc: Document, baseUrl: string | null): PreloadResource[] {
  const resources: PreloadResource[] = [];

  // Preload links
  const preloadElements = doc.querySelectorAll('link[rel="preload"][href]');
  for (const link of Array.from(preloadElements)) {
    const href = link.getAttribute('href');
    if (href) {
      const normalized = normalizeUrl(baseUrl, href);
      if (normalized) {
        const asAttr = link.getAttribute('as');
        const typeAttr = link.getAttribute('type');
        const crossoriginAttr = link.getAttribute('crossorigin');

        resources.push({
          url: normalized,
          as: asAttr || undefined,
          type: typeAttr || undefined,
          crossorigin: crossoriginAttr !== null ? crossoriginAttr || '' : undefined,
          prefetch: false,
        });
      }
    }
  }

  // Prefetch links
  const prefetchElements = doc.querySelectorAll('link[rel="prefetch"][href]');
  for (const link of Array.from(prefetchElements)) {
    const href = link.getAttribute('href');
    if (href) {
      const normalized = normalizeUrl(baseUrl, href);
      if (normalized) {
        const asAttr = link.getAttribute('as');
        const typeAttr = link.getAttribute('type');
        const crossoriginAttr = link.getAttribute('crossorigin');

        resources.push({
          url: normalized,
          as: asAttr || undefined,
          type: typeAttr || undefined,
          crossorigin: crossoriginAttr !== null ? crossoriginAttr || '' : undefined,
          prefetch: true,
        });
      }
    }
  }

  // Clean up undefined values (but keep empty strings for boolean attributes like crossorigin)
  return resources.map((resource) =>
    Object.fromEntries(
      Object.entries(resource).filter(([_, value]) => value !== undefined && value !== null),
    ),
  ) as PreloadResource[];
}

/**
 * Extract DNS prefetch and preconnect hints.
 */
function extractConnectionHints(doc: Document, baseUrl: string | null): ConnectionHint[] {
  const hints: ConnectionHint[] = [];

  // DNS prefetch
  const dnsPrefetchElements = doc.querySelectorAll('link[rel="dns-prefetch"][href]');
  for (const link of Array.from(dnsPrefetchElements)) {
    const href = link.getAttribute('href');
    if (href) {
      const normalized = normalizeUrl(baseUrl, href);
      if (normalized) {
        hints.push({
          url: normalized,
          preconnect: false,
        });
      }
    }
  }

  // Preconnect
  const preconnectElements = doc.querySelectorAll('link[rel="preconnect"][href]');
  for (const link of Array.from(preconnectElements)) {
    const href = link.getAttribute('href');
    if (href) {
      const normalized = normalizeUrl(baseUrl, href);
      if (normalized) {
        const crossoriginAttr = link.getAttribute('crossorigin');

        hints.push({
          url: normalized,
          preconnect: true,
          crossorigin: crossoriginAttr !== null ? crossoriginAttr || '' : undefined,
        });
      }
    }
  }

  // Clean up undefined values (but keep empty strings for boolean attributes like crossorigin)
  return hints.map((hint) =>
    Object.fromEntries(
      Object.entries(hint).filter(([_, value]) => value !== undefined && value !== null),
    ),
  ) as ConnectionHint[];
}
