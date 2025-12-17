/**
 * URL normalization utilities for resolving relative URLs to absolute URLs.
 *
 * @remarks
 * This module provides utilities for converting relative URLs to absolute URLs with
 * best-effort error handling. All functions are designed to never throw errors - if
 * normalization fails, the original string is returned unchanged.
 *
 * Supports all common relative URL formats:
 * - Absolute paths: `/path` → `https://example.com/path`
 * - Relative paths: `./path`, `../path`, `path`
 * - Protocol-relative: `//cdn.com/file` → `https://cdn.com/file`
 *
 * Features HTTP to HTTPS upgrade by default (unless base URL is explicitly HTTP).
 *
 * @packageDocumentation
 */

/**
 * Normalize a URL to absolute form using a base URL.
 *
 * @remarks
 * This function converts relative URLs to absolute URLs. It handles all common
 * relative URL formats and never throws errors. If normalization fails for any
 * reason, the original string is returned unchanged.
 *
 * @example
 * ```typescript
 * // Absolute path
 * normalizeUrl('https://example.com/feed.xml', '/blog/post')
 * // Returns: "https://example.com/blog/post"
 *
 * // Relative path
 * normalizeUrl('https://example.com/feeds/rss.xml', '../images/logo.png')
 * // Returns: "https://example.com/images/logo.png"
 *
 * // Protocol-relative
 * normalizeUrl('https://example.com/feed.xml', '//cdn.example.com/file.mp3')
 * // Returns: "https://cdn.example.com/file.mp3"
 *
 * // No base URL - returns as-is
 * normalizeUrl(null, '/blog/post')
 * // Returns: "/blog/post"
 * ```
 *
 * @param baseUrl - Base URL for resolving relative URLs (string or URL object)
 * @param urlString - URL to normalize (can be relative, absolute, protocol-relative, etc.)
 * @returns Normalized absolute URL, or original string if normalization fails
 */
export function normalizeUrl(
  baseUrl: string | URL | null | undefined,
  urlString: string | null | undefined,
): string {
  // Return original if no URL string provided
  if (!urlString || typeof urlString !== 'string') {
    return urlString || '';
  }

  const trimmed = urlString.trim();
  if (!trimmed) {
    return urlString;
  }

  // No base URL - try to validate as absolute or return as-is
  if (!baseUrl) {
    return validateOrReturnOriginal(trimmed);
  }

  try {
    // Parse base URL
    const base = typeof baseUrl === 'string' ? new URL(baseUrl) : baseUrl;

    // Check if URL is already absolute
    if (isAbsoluteUrl(trimmed)) {
      return validateOrReturnOriginal(trimmed);
    }

    // Handle protocol-relative URLs (//example.com/path)
    if (trimmed.startsWith('//')) {
      const protocol = base.protocol || 'https:';
      return validateOrReturnOriginal(`${protocol}${trimmed}`);
    }

    // Handle absolute paths (/path)
    if (trimmed.startsWith('/')) {
      const origin = base.origin;
      return validateOrReturnOriginal(`${origin}${trimmed}`);
    }

    // Handle relative paths (./path, ../path, or just path)
    // Use URL constructor to resolve relative to base
    const resolved = new URL(trimmed, base);
    return resolved.href;
  } catch {
    // If anything fails, return original
    return urlString;
  }
}

/**
 * Check if URL is absolute (has protocol)
 */
function isAbsoluteUrl(url: string): boolean {
  try {
    // Try to parse as URL
    const parsed = new URL(url);
    // Must have protocol and host
    return Boolean(parsed.protocol && parsed.host);
  } catch {
    return false;
  }
}

/**
 * Validate URL or return original
 * Attempts to parse and clean up the URL
 */
function validateOrReturnOriginal(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.href;
  } catch {
    return url;
  }
}

/**
 * Normalize multiple URLs at once.
 *
 * @remarks
 * Convenience function for batch URL normalization. Filters out null/undefined values.
 *
 * @param baseUrl - Base URL for resolving relative URLs
 * @param urls - Array of URLs to normalize
 * @returns Array of normalized URLs (nulls/undefined filtered out)
 */
export function normalizeUrls(
  baseUrl: string | URL | null | undefined,
  urls: (string | null | undefined)[] | null | undefined,
): string[] {
  if (!urls || !Array.isArray(urls)) {
    return [];
  }

  return urls.map((url) => normalizeUrl(baseUrl, url)).filter((url): url is string => Boolean(url));
}

/**
 * Upgrade HTTP URLs to HTTPS (unless base URL is explicitly HTTP).
 *
 * @remarks
 * This function implements the HTTPS-by-default policy. HTTP URLs are automatically
 * upgraded to HTTPS unless the base URL itself is HTTP, indicating an HTTP-only site.
 *
 * @param baseUrl - Base URL (determines if HTTP should be kept)
 * @param url - URL to potentially upgrade
 * @returns URL with HTTPS protocol if appropriate, otherwise unchanged
 */
export function preferHttps(baseUrl: string | URL | null | undefined, url: string): string {
  if (!url || !url.startsWith('http://')) {
    return url;
  }

  // If base URL is explicitly HTTP, keep HTTP
  if (baseUrl) {
    try {
      const base = typeof baseUrl === 'string' ? new URL(baseUrl) : baseUrl;
      if (base.protocol === 'http:') {
        return url;
      }
    } catch {
      // Ignore errors
    }
  }

  // Try to upgrade to HTTPS
  return url.replace(/^http:/, 'https:');
}

/**
 * Normalize URL and prefer HTTPS protocol.
 *
 * @remarks
 * Convenience function combining {@link normalizeUrl} with {@link preferHttps}.
 * This is the recommended function for most use cases.
 *
 * @param baseUrl - Base URL for resolving relative URLs
 * @param urlString - URL to normalize
 * @returns Normalized absolute URL with HTTPS preference
 */
export function normalizeUrlHttps(
  baseUrl: string | URL | null | undefined,
  urlString: string | null | undefined,
): string {
  const normalized = normalizeUrl(baseUrl, urlString);
  return preferHttps(baseUrl, normalized);
}
