/**
 * Social profiles types.
 *
 * @remarks
 * Types for social media profile links.
 *
 * @packageDocumentation
 */

/**
 * Social profile metadata.
 *
 * @remarks
 * Contains social media profile URLs and handles from various platforms.
 */
export interface SocialProfilesMetadata {
  /** Twitter/X username (without @) */
  twitter?: string;

  /** Facebook profile/page URL */
  facebook?: string;

  /** Instagram username or URL */
  instagram?: string;

  /** LinkedIn profile/company URL */
  linkedin?: string;

  /** YouTube channel URL */
  youtube?: string;

  /** GitHub username or organization URL */
  github?: string;

  /** TikTok username or URL */
  tiktok?: string;

  /** Pinterest username or URL */
  pinterest?: string;

  /** Mastodon profile URL */
  mastodon?: string;

  /** Reddit username or URL */
  reddit?: string;

  /** Other social profiles (platform: url/username) */
  other?: Record<string, string>;
}
