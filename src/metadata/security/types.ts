/**
 * Security and privacy types.
 *
 * @remarks
 * Types for security and privacy-related metadata.
 *
 * @packageDocumentation
 */

/**
 * Security metadata.
 *
 * @remarks
 * Contains security and privacy-related headers and meta tags.
 */
export interface SecurityMetadata {
  /** Referrer policy (controls Referer header) */
  referrerPolicy?: string;

  /** Content Security Policy directives */
  contentSecurityPolicy?: string;

  /** X-UA-Compatible directive (IE compatibility mode) */
  xUaCompatible?: string;

  /** Format detection (phone numbers, dates, etc.) */
  formatDetection?: string;
}
