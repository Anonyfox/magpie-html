/**
 * Twitter Card metadata types.
 *
 * @remarks
 * Twitter-specific metadata for rich cards.
 *
 * @packageDocumentation
 */

/**
 * Twitter app card metadata for a specific platform.
 */
export interface TwitterAppPlatform {
  /** App name */
  name?: string;
  /** App ID */
  id?: string;
  /** App URL/deep link */
  url?: string;
}

/**
 * Twitter app card metadata.
 */
export interface TwitterApp {
  /** iPhone app details */
  iphone?: TwitterAppPlatform;
  /** iPad app details */
  ipad?: TwitterAppPlatform;
  /** Google Play app details */
  googleplay?: TwitterAppPlatform;
}

/**
 * Twitter player card metadata.
 */
export interface TwitterPlayer {
  /** Player URL */
  url?: string;
  /** Player width in pixels */
  width?: number;
  /** Player height in pixels */
  height?: number;
  /** Stream URL */
  stream?: string;
}

/**
 * Twitter Card metadata extracted from meta tags.
 *
 * @remarks
 * Contains metadata for Twitter Cards used for rich social sharing on Twitter.
 * All fields are optional - only present if found in the document.
 */
export interface TwitterCardMetadata {
  /** Card type (summary, summary_large_image, app, player) */
  card?: 'summary' | 'summary_large_image' | 'app' | 'player' | string;
  /** Twitter username of website (with or without @ symbol) */
  site?: string;
  /** Twitter username of content creator (with or without @ symbol) */
  creator?: string;
  /** Content title (max 70 chars) */
  title?: string;
  /** Content description (max 200 chars) */
  description?: string;
  /** Image URL */
  image?: string;
  /** Image alt text */
  imageAlt?: string;

  /** App card details (if card type is 'app') */
  app?: TwitterApp;

  /** Player card details (if card type is 'player') */
  player?: TwitterPlayer;
}
