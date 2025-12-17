/**
 * Verification tags types.
 *
 * @remarks
 * Types for domain and ownership verification tags.
 *
 * @packageDocumentation
 */

/**
 * Verification metadata.
 *
 * @remarks
 * Contains verification tags from various platforms for domain and ownership verification.
 */
export interface VerificationMetadata {
  /** Google Site Verification token */
  googleSiteVerification?: string;

  /** Bing/Microsoft verification token */
  msvalidate?: string;

  /** Yandex verification token */
  yandexVerification?: string;

  /** Facebook domain verification token */
  facebookDomainVerification?: string;

  /** Pinterest domain verification token */
  pinterestVerification?: string;

  /** Alexa verification token */
  alexaVerification?: string;

  /** Norton Safe Web verification token */
  nortonSafeWeb?: string;

  /** Other verification tags (platform: token) */
  other?: Record<string, string>;
}
