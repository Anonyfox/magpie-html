/**
 * Security and privacy extraction.
 *
 * @remarks
 * Extracts security and privacy-related metadata from HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLElement } from '../../utils/html-parser.js';
import { getMetaContent, getMetaHttpEquiv } from '../../utils/meta-helpers.js';
import type { SecurityMetadata } from './types.js';

/**
 * Extract security metadata from parsed HTML document.
 *
 * @remarks
 * Extracts security and privacy-related meta tags including referrer policy,
 * content security policy, and browser compatibility directives.
 *
 * @param doc - Parsed HTML document
 * @returns Security metadata
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const security = extractSecurity(doc);
 * console.log(security.referrerPolicy);
 * console.log(security.contentSecurityPolicy);
 * ```
 */
export function extractSecurity(doc: HTMLElement): SecurityMetadata {
  const metadata: SecurityMetadata = {};

  // Referrer policy
  metadata.referrerPolicy = getMetaContent(doc, 'referrer');

  // Content Security Policy
  metadata.contentSecurityPolicy = getMetaHttpEquiv(doc, 'Content-Security-Policy');

  // X-UA-Compatible (IE compatibility mode)
  metadata.xUaCompatible = getMetaHttpEquiv(doc, 'X-UA-Compatible');

  // Format detection (iOS Safari)
  metadata.formatDetection = getMetaContent(doc, 'format-detection');

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as SecurityMetadata;
}
