/**
 * Links extraction.
 *
 * @remarks
 * Extract navigational links from HTML documents with advanced filtering
 * and categorization for crawler and SEO use cases.
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
import type { ExtractedLink, LinksExtractionOptions, LinksMetadata } from './types.js';

/**
 * Extract links from parsed HTML document.
 *
 * @remarks
 * Extracts all `<a href>` links with comprehensive metadata and filtering options.
 * Perfect for crawlers, SEO analysis, and link discovery.
 *
 * Features:
 * - Internal/external link categorization
 * - Rel attribute filtering (nofollow, ugc, sponsored, etc.)
 * - Automatic URL normalization
 * - Hash link filtering
 * - Scheme filtering (only http/https)
 * - Deduplication
 * - Link text extraction
 *
 * @param doc - Parsed HTML document
 * @param baseUrl - Base URL for resolving relative links and determining internal/external
 * @param options - Extraction options for filtering and categorization
 * @returns Links metadata with categorized links
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const links = extractLinks(doc, 'https://example.com');
 *
 * // Get all internal links (same origin)
 * console.log(links.internal);
 *
 * // Get external links excluding nofollow
 * const linksNoFollow = extractLinks(doc, 'https://example.com', {
 *   scope: 'external',
 *   excludeRel: ['nofollow']
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Crawler use case - get follow-able links
 * const links = extractLinks(doc, baseUrl, {
 *   excludeRel: ['nofollow', 'ugc', 'sponsored'],
 *   includeHashLinks: false
 * });
 * ```
 */
export function extractLinks(
  doc: Document,
  baseUrl?: string | URL | null,
  options: LinksExtractionOptions = {},
): LinksMetadata {
  const opts = normalizeOptions(options);

  // Determine effective base URL (from <base> tag or parameter)
  const effectiveBaseUrl = getEffectiveBaseUrl(doc, baseUrl);
  const baseOrigin = effectiveBaseUrl ? getOrigin(effectiveBaseUrl) : null;

  // Extract all links
  const allLinks = extractAllLinks(doc, effectiveBaseUrl, baseOrigin, opts);

  // Categorize links
  const internal: ExtractedLink[] = [];
  const external: ExtractedLink[] = [];
  const nofollow: ExtractedLink[] = [];

  for (const link of allLinks) {
    if (link.internal) internal.push(link);
    if (link.external) external.push(link);
    if (link.nofollow) nofollow.push(link);
  }

  // Build metadata
  const metadata: LinksMetadata = {
    all: allLinks.length > 0 ? allLinks : undefined,
    internal: internal.length > 0 ? internal : undefined,
    external: external.length > 0 ? external : undefined,
    nofollow: nofollow.length > 0 ? nofollow : undefined,
    totalCount: allLinks.length,
    internalCount: internal.length,
    externalCount: external.length,
    nofollowCount: nofollow.length,
  };

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as LinksMetadata;
}

/**
 * Normalize extraction options.
 */
function normalizeOptions(options: LinksExtractionOptions): Required<LinksExtractionOptions> {
  return {
    scope: options.scope || 'all',
    excludeRel: options.excludeRel || [],
    includeRel: options.includeRel || [],
    includeHashLinks: options.includeHashLinks ?? false,
    deduplicate: options.deduplicate ?? true,
    limit: options.limit || Number.POSITIVE_INFINITY,
  };
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
 * Get origin from URL string.
 */
function getOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Extract all links from document.
 */
function extractAllLinks(
  doc: Document,
  baseUrl: string | null,
  baseOrigin: string | null,
  options: Required<LinksExtractionOptions>,
): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const seenUrls = new Set<string>();

  // Get all anchor elements
  const anchorElements = doc.querySelectorAll('a[href]');

  for (const anchor of Array.from(anchorElements)) {
    const href = anchor.getAttribute('href');
    if (!href) continue;

    const trimmedHref = href.trim();
    if (!trimmedHref) continue;

    // Skip hash-only links if not allowed
    if (!options.includeHashLinks && trimmedHref.startsWith('#')) {
      continue;
    }

    // Check scheme - only allow http/https or relative URLs
    const scheme = getScheme(trimmedHref);
    if (scheme && !isHttpLike(scheme)) {
      continue;
    }

    // Parse rel attribute
    const rel = anchor.getAttribute('rel')?.trim() || undefined;
    const relParts = rel ? rel.toLowerCase().split(/\s+/).filter(Boolean) : [];

    // Check rel exclusions
    if (options.excludeRel.length > 0) {
      const hasExcluded = relParts.some((r) =>
        options.excludeRel.includes(
          r as 'nofollow' | 'noopener' | 'noreferrer' | 'ugc' | 'sponsored',
        ),
      );
      if (hasExcluded) continue;
    }

    // Check rel inclusions
    if (options.includeRel.length > 0) {
      const hasIncluded = relParts.some((r) =>
        options.includeRel.includes(
          r as 'nofollow' | 'noopener' | 'noreferrer' | 'ugc' | 'sponsored',
        ),
      );
      if (!hasIncluded) continue;
    }

    // Normalize URL
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(baseUrl, trimmedHref) || trimmedHref;
    } catch {
      continue;
    }

    // Deduplicate if enabled
    if (options.deduplicate) {
      if (seenUrls.has(normalizedUrl)) continue;
      seenUrls.add(normalizedUrl);
    }

    // Determine if internal/external
    let isInternal = false;
    let isExternal = false;

    if (baseOrigin) {
      try {
        const linkOrigin = getOrigin(normalizedUrl);
        if (linkOrigin) {
          isInternal = linkOrigin === baseOrigin;
          isExternal = linkOrigin !== baseOrigin;
        }
      } catch {
        // Unable to determine, skip classification
      }
    }

    // Apply scope filter
    if (options.scope === 'internal' && !isInternal) continue;
    if (options.scope === 'external' && !isExternal) continue;

    // Extract link metadata
    const link: ExtractedLink = {
      url: normalizedUrl,
      text: anchor.textContent?.trim() || undefined,
      title: anchor.getAttribute('title')?.trim() || undefined,
      rel: rel || undefined,
      target: anchor.getAttribute('target')?.trim() || undefined,
      internal: isInternal || undefined,
      external: isExternal || undefined,
      nofollow: relParts.includes('nofollow') || undefined,
      ugc: relParts.includes('ugc') || undefined,
      sponsored: relParts.includes('sponsored') || undefined,
      noopener: relParts.includes('noopener') || undefined,
      noreferrer: relParts.includes('noreferrer') || undefined,
    };

    // Clean up undefined values
    links.push(
      Object.fromEntries(
        Object.entries(link).filter(([_, value]) => value !== undefined),
      ) as ExtractedLink,
    );

    // Check limit
    if (links.length >= options.limit) {
      break;
    }
  }

  return links;
}

/**
 * Get URL scheme.
 */
function getScheme(url: string): string {
  const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(url);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Check if scheme is HTTP-like.
 */
function isHttpLike(scheme: string): boolean {
  return scheme === 'http' || scheme === 'https' || scheme === '';
}
