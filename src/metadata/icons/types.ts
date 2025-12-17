/**
 * Icons and visual assets types.
 *
 * @remarks
 * Types for favicons, app icons, and visual branding.
 *
 * @packageDocumentation
 */

/**
 * Apple touch icon metadata.
 */
export interface AppleTouchIcon {
  /** Icon URL */
  url: string;
  /** Icon size (e.g., "180x180") */
  sizes?: string;
  /** Whether it's precomposed (no effects applied) */
  precomposed?: boolean;
}

/**
 * Safari mask icon metadata.
 */
export interface MaskIcon {
  /** SVG icon URL */
  url: string;
  /** Icon color */
  color?: string;
}

/**
 * Microsoft tile metadata.
 */
export interface MSTile {
  /** Tile image URL */
  image?: string;
  /** Tile background color */
  color?: string;
  /** Microsoft browserconfig XML URL */
  config?: string;
}

/**
 * Icons and visual assets metadata.
 *
 * @remarks
 * Contains all icon-related metadata including favicons, app icons,
 * and platform-specific icons.
 */
export interface IconsMetadata {
  /** Standard favicon */
  favicon?: string;

  /** Shortcut icon (legacy) */
  shortcutIcon?: string;

  /** Apple touch icons for iOS */
  appleTouchIcons?: AppleTouchIcon[];

  /** Safari pinned tab icon */
  maskIcon?: MaskIcon;

  /** Microsoft tile configuration */
  msTile?: MSTile;

  /** Fluid icon (legacy) */
  fluidIcon?: string;
}
