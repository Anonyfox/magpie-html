/**
 * Monetization and payment extraction.
 *
 * @remarks
 * Extracts web monetization and payment metadata from HTML documents.
 *
 * @packageDocumentation
 */

import { type DocumentInput, ensureDocument } from '../../utils/html-parser.js';
import { getMetaContent } from '../../utils/meta-helpers.js';
import type { MonetizationMetadata } from './types.js';

/**
 * Extract monetization metadata from HTML.
 *
 * @remarks
 * Extracts web monetization, payment verification, and cryptocurrency
 * addresses from meta tags and link tags.
 *
 * @param input - Parsed HTML document or raw HTML string
 * @returns Monetization metadata
 *
 * @example
 * ```typescript
 * // With parsed document (recommended for multiple extractions)
 * const doc = parseHTML(htmlString);
 * const monetization = extractMonetization(doc);
 *
 * // Or directly with HTML string
 * const monetization = extractMonetization(htmlString);
 * ```
 */
export function extractMonetization(input: DocumentInput): MonetizationMetadata {
  const doc = ensureDocument(input);
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
