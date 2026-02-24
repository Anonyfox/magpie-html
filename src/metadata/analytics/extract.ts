/**
 * Analytics and tracking extraction.
 *
 * @remarks
 * Detects analytics service IDs from HTML documents.
 * Privacy-conscious - only extracts IDs, doesn't perform any tracking.
 *
 * @packageDocumentation
 */

import { type DocumentInput, ensureDocument } from '../../utils/html-parser.js';
import type { AnalyticsMetadata } from './types.js';

/**
 * Extract analytics metadata from HTML.
 *
 * @remarks
 * Detects analytics service IDs by examining script tags and their content.
 * Only extracts identifiers, does not track or collect user data.
 *
 * @param input - Parsed HTML document or raw HTML string
 * @returns Analytics metadata
 *
 * @example
 * ```typescript
 * // With parsed document (recommended for multiple extractions)
 * const doc = parseHTML(htmlString);
 * const analytics = extractAnalytics(doc);
 *
 * // Or directly with HTML string
 * const analytics = extractAnalytics(htmlString);
 * ```
 */
export function extractAnalytics(input: DocumentInput): AnalyticsMetadata {
  const doc = ensureDocument(input);
  const metadata: AnalyticsMetadata = {};

  // Get all script tags
  const scripts = doc.querySelectorAll('script');

  const googleAnalytics = new Set<string>();
  const googleTagManager = new Set<string>();
  const facebookPixel = new Set<string>();
  const matomo = new Set<string>();
  const plausible = new Set<string>();
  const adobe = new Set<string>();
  const cloudflare = new Set<string>();
  const fathom = new Set<string>();

  for (const script of Array.from(scripts)) {
    const src = script.getAttribute('src') || '';
    const content = script.textContent || '';
    const combined = `${src} ${content}`;

    // Google Analytics (GA4: G-, Universal: UA-, Tag Manager: GT-)
    const gaMatches = combined.matchAll(/\b(UA-\d+-\d+|G-[A-Z0-9]+|GT-[A-Z0-9]+)\b/g);
    for (const match of gaMatches) {
      googleAnalytics.add(match[1]);
    }

    // Google Tag Manager (GTM-)
    const gtmMatches = combined.matchAll(/\b(GTM-[A-Z0-9]+)\b/g);
    for (const match of gtmMatches) {
      googleTagManager.add(match[1]);
    }

    // Facebook Pixel (numeric IDs in fbq or _fbq)
    const fbMatches = combined.matchAll(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/g);
    for (const match of fbMatches) {
      facebookPixel.add(match[1]);
    }

    // Matomo/Piwik
    if (src.includes('matomo') || src.includes('piwik') || content.includes('_paq')) {
      const matomoIdMatch =
        content.match(/setSiteId['"]?\s*,\s*['"]?(\d+)['"]?\s*\]/) ||
        content.match(/setSiteId\s*\(\s*['"]?(\d+)['"]?\s*\)/);
      if (matomoIdMatch) {
        matomo.add(matomoIdMatch[1]);
      }
    }

    // Plausible Analytics
    if (src.includes('plausible.io/js/')) {
      const domain = script.getAttribute('data-domain');
      if (domain) {
        plausible.add(domain);
      }
    }

    // Adobe Analytics (Omniture)
    if (src.includes('omniture') || src.includes('2o7.net') || content.includes('s.t()')) {
      const adobeIdMatch = content.match(/s_account\s*=\s*['"]([^'"]+)['"]/);
      if (adobeIdMatch) {
        adobe.add(adobeIdMatch[1]);
      }
    }

    // Cloudflare Web Analytics
    if (src.includes('cloudflareinsights.com')) {
      const cfBeacon = script.getAttribute('data-cf-beacon');
      if (cfBeacon) {
        try {
          const beacon = JSON.parse(cfBeacon);
          if (beacon.token) {
            cloudflare.add(beacon.token);
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    }

    // Fathom Analytics
    if (src.includes('cdn.usefathom.com')) {
      const siteId = script.getAttribute('data-site') || script.getAttribute('site');
      if (siteId) {
        fathom.add(siteId);
      }
    }
  }

  // Convert Sets to arrays if not empty
  if (googleAnalytics.size > 0) {
    metadata.googleAnalytics = Array.from(googleAnalytics);
  }
  if (googleTagManager.size > 0) {
    metadata.googleTagManager = Array.from(googleTagManager);
  }
  if (facebookPixel.size > 0) {
    metadata.facebookPixel = Array.from(facebookPixel);
  }
  if (matomo.size > 0) {
    metadata.matomo = Array.from(matomo);
  }
  if (plausible.size > 0) {
    metadata.plausible = Array.from(plausible);
  }
  if (adobe.size > 0) {
    metadata.adobe = Array.from(adobe);
  }
  if (cloudflare.size > 0) {
    metadata.cloudflare = Array.from(cloudflare);
  }
  if (fathom.size > 0) {
    metadata.fathom = Array.from(fathom);
  }

  return metadata;
}
