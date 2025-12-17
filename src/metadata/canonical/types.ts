/**
 * Canonical and alternate URL metadata types.
 *
 * @remarks
 * URL relationships, internationalization, and special versions.
 *
 * @packageDocumentation
 */

/**
 * Alternate URL relationship.
 */
export interface AlternateLink {
  /** URL of the alternate version */
  href: string;
  /** Language/locale code (hreflang) */
  hreflang?: string;
  /** MIME type */
  type?: string;
  /** Title/description */
  title?: string;
}

/**
 * App link metadata for deep linking.
 */
export interface AppLinks {
  /** iOS app URL */
  ios?: string;
  /** Android app URL */
  android?: string;
  /** Web fallback URL */
  web?: string;
}

/**
 * Canonical and alternate URL metadata.
 *
 * @remarks
 * Contains canonical URLs, language alternates, special versions (AMP),
 * and app linking metadata.
 */
export interface CanonicalMetadata {
  /** Canonical URL for this page */
  canonical?: string;

  /** Language/region alternates */
  alternates?: AlternateLink[];

  /** AMP (Accelerated Mobile Pages) version URL */
  amphtml?: string;

  /** Web app manifest URL */
  manifest?: string;

  /** App deep linking URLs */
  appLinks?: AppLinks;
}
