/**
 * SEO metadata types.
 *
 * @remarks
 * Standard HTML meta tags used by search engines and browsers.
 *
 * @packageDocumentation
 */

/**
 * Basic SEO metadata extracted from standard HTML meta tags.
 *
 * @remarks
 * Contains metadata from common SEO-related meta tags including
 * title, description, keywords, and browser-specific tags.
 */
export interface SEOMetadata {
  /** Page title from <title> tag */
  title?: string;

  /** Meta description for search results */
  description?: string;

  /** Keywords (legacy but still used) */
  keywords?: string[];

  /** Page author */
  author?: string;

  /** Site generator (e.g., WordPress, Hugo) */
  generator?: string;

  /** Viewport settings */
  viewport?: string;

  /** Browser theme color */
  themeColor?: string;

  /** Color scheme preference (light, dark, auto) */
  colorScheme?: string;

  /** Web application name */
  applicationName?: string;

  /** iOS web app title */
  appleMobileWebAppTitle?: string;

  /** iOS web app capable (standalone mode) */
  appleMobileWebAppCapable?: boolean;

  /** iOS status bar style */
  appleMobileWebAppStatusBarStyle?: string;
}
