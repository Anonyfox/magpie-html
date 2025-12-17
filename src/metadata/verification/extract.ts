/**
 * Verification tags extraction.
 *
 * @remarks
 * Extracts domain and ownership verification tags from HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLDocument as Document } from '../../utils/html-parser.js';
import { getMetaContent } from '../../utils/meta-helpers.js';
import type { VerificationMetadata } from './types.js';

/**
 * Extract verification metadata from parsed HTML document.
 *
 * @remarks
 * Extracts verification tags used by various platforms for domain and ownership verification.
 *
 * @param doc - Parsed HTML document
 * @returns Verification metadata
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const verification = extractVerification(doc);
 * console.log(verification.googleSiteVerification);
 * console.log(verification.facebookDomainVerification);
 * ```
 */
export function extractVerification(doc: Document): VerificationMetadata {
  const metadata: VerificationMetadata = {};

  // Google Site Verification
  metadata.googleSiteVerification = getMetaContent(doc, 'google-site-verification');

  // Microsoft/Bing validation
  metadata.msvalidate = getMetaContent(doc, 'msvalidate.01');

  // Yandex verification
  metadata.yandexVerification = getMetaContent(doc, 'yandex-verification');

  // Facebook domain verification
  metadata.facebookDomainVerification = getMetaContent(doc, 'facebook-domain-verification');

  // Pinterest verification
  metadata.pinterestVerification = getMetaContent(doc, 'p:domain_verify');

  // Alexa verification
  metadata.alexaVerification = getMetaContent(doc, 'alexaVerifyID');

  // Norton Safe Web
  metadata.nortonSafeWeb = getMetaContent(doc, 'norton-safeweb-site-verification');

  // Collect other verification tags
  const otherVerifications: Record<string, string> = {};

  // Look for other common verification patterns
  const verificationPatterns = [
    'verify-v1', // Google legacy
    'verify-a', // Google legacy
    'verify', // Generic
    'verification', // Generic
    'domain-verification', // Generic
    'site-verification', // Generic
  ];

  for (const pattern of verificationPatterns) {
    const value = getMetaContent(doc, pattern);
    if (value) {
      otherVerifications[pattern] = value;
    }
  }

  // Add other verifications if any found
  if (Object.keys(otherVerifications).length > 0) {
    metadata.other = otherVerifications;
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as VerificationMetadata;
}
