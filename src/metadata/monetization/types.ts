/**
 * Monetization and payment types.
 *
 * @remarks
 * Types for web monetization and payment metadata.
 *
 * @packageDocumentation
 */

/**
 * Monetization metadata.
 *
 * @remarks
 * Contains web monetization and payment verification metadata.
 */
export interface MonetizationMetadata {
  /** Web Monetization API payment pointer */
  webMonetization?: string;

  /** PayPal site verification token */
  paypalVerification?: string;

  /** Brave Creator verification token */
  braveCreator?: string;

  /** Coil payment pointer (legacy) */
  coil?: string;

  /** Bitcoin address */
  bitcoin?: string;

  /** Ethereum address */
  ethereum?: string;
}
