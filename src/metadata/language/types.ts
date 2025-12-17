/**
 * Language and localization types.
 *
 * @remarks
 * Types for language and locale metadata.
 *
 * @packageDocumentation
 */

/**
 * Language and localization metadata.
 *
 * @remarks
 * Contains language and locale information from various sources including
 * HTML lang attribute, meta tags, and OpenGraph locale.
 */
export interface LanguageMetadata {
  /** HTML lang attribute from <html> tag */
  htmlLang?: string;

  /** Content-Language meta tag */
  contentLanguage?: string;

  /** OpenGraph locale */
  ogLocale?: string;

  /** OpenGraph alternate locales */
  alternateLocales?: string[];

  /** Primary language (best guess, normalized to ISO 639-1) */
  primary?: string;

  /** Region code (if available, ISO 3166-1 alpha-2) */
  region?: string;
}
