/**
 * Monetization and payment extraction.
 *
 * @remarks
 * Extracts web monetization and payment metadata from HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLElement } from '../../utils/html-parser.js';
import { getMetaContent } from '../../utils/meta-helpers.js';
import type { MonetizationMetadata } from './types.js';

/**
 * Extract monetization metadata from parsed HTML document.
 *
 * @remarks
 * Extracts web monetization, payment verification, and cryptocurrency
 * addresses from meta tags and link tags.
 *
 * @param doc - Parsed HTML document
 * @returns Monetization metadata
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const monetization = extractMonetization(doc);
 * console.log(monetization.webMonetization);
 * console.log(monetization.bitcoin);
 * ```
 */
export function extractMonetization(doc: HTMLElement): MonetizationMetadata {
  const metadata: MonetizationMetadata = {};

  // Web Monetization API (payment pointer)
  metadata.webMonetization = getMetaContent(doc, 'monetization');

  // PayPal site verification
  metadata.paypalVerification = getMetaContent(doc, 'paypal-site-verification');

  // Brave Creator verification
  metadata.braveCreator =
    getMetaContent(doc, 'brave-rewards-verification') ||
    getMetaContent(doc, 'brave-creator-verification');

  // Coil payment pointer (legacy)
  metadata.coil = getMetaContent(doc, 'coil:payment_pointer');

  // Bitcoin address
  metadata.bitcoin = getMetaContent(doc, 'bitcoin') || getMetaContent(doc, 'btc:address');

  // Ethereum address
  metadata.ethereum = getMetaContent(doc, 'ethereum') || getMetaContent(doc, 'eth:address');

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as MonetizationMetadata;
}
