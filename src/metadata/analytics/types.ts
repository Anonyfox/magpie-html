/**
 * Analytics and tracking types.
 *
 * @remarks
 * Types for analytics service detection (IDs only, no tracking).
 *
 * @packageDocumentation
 */

/**
 * Analytics metadata.
 *
 * @remarks
 * Contains detected analytics service IDs. Privacy-conscious - only extracts IDs,
 * doesn't perform any tracking.
 */
export interface AnalyticsMetadata {
  /** Google Analytics tracking IDs (UA-, G-, GT- prefixes) */
  googleAnalytics?: string[];

  /** Google Tag Manager container IDs */
  googleTagManager?: string[];

  /** Facebook Pixel IDs */
  facebookPixel?: string[];

  /** Matomo/Piwik site IDs */
  matomo?: string[];

  /** Plausible Analytics domains */
  plausible?: string[];

  /** Adobe Analytics (Omniture) IDs */
  adobe?: string[];

  /** Cloudflare Web Analytics tokens */
  cloudflare?: string[];

  /** Fathom Analytics site IDs */
  fathom?: string[];
}
