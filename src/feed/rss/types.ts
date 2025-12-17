/**
 * RSS 2.0 Feed Type Definitions
 * Spec: https://www.rssboard.org/rss-specification
 */

/**
 * RSS Channel - represents the feed itself
 */
export interface RssChannel {
  /** Title of the channel (required) */
  title: string;
  /** URL of the website (required) */
  link: string;
  /** Description of the channel (required) */
  description: string;
  /** Language code (e.g., 'en-us', 'de') */
  language?: string;
  /** Copyright notice */
  copyright?: string;
  /** Email of editor */
  managingEditor?: string;
  /** Email of webmaster */
  webMaster?: string;
  /** Publication date */
  pubDate?: string;
  /** Last build date */
  lastBuildDate?: string;
  /** Categories */
  category?: string[];
  /** Generator program */
  generator?: string;
  /** URL to documentation */
  docs?: string;
  /** Cloud for updates */
  cloud?: RssCloud;
  /** Time to live (minutes) */
  ttl?: number;
  /** Channel image */
  image?: RssImage;
  /** Skip hours */
  skipHours?: number[];
  /** Skip days */
  skipDays?: string[];
}

/**
 * RSS Item - represents an article/entry
 */
export interface RssItem {
  /** Title of the item */
  title?: string;
  /** URL of the item */
  link?: string;
  /** Description/summary */
  description?: string;
  /** Author email */
  author?: string;
  /** Categories */
  category?: string[];
  /** Comments URL */
  comments?: string;
  /** Media enclosure */
  enclosure?: RssEnclosure;
  /** Unique identifier */
  guid?: RssGuid;
  /** Publication date */
  pubDate?: string;
  /** Source feed */
  source?: RssSource;
}

/**
 * RSS Image
 */
export interface RssImage {
  /** URL of image */
  url: string;
  /** Title of image */
  title: string;
  /** Link associated with image */
  link: string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Description */
  description?: string;
}

/**
 * RSS Enclosure - attached media file
 */
export interface RssEnclosure {
  /** URL of the media */
  url: string;
  /** Length in bytes */
  length: number;
  /** MIME type */
  type: string;
}

/**
 * RSS GUID - unique identifier
 */
export interface RssGuid {
  /** The GUID value */
  value: string;
  /** Whether the GUID is a permalink */
  isPermaLink: boolean;
}

/**
 * RSS Source - source feed info
 */
export interface RssSource {
  /** Name of RSS channel */
  value: string;
  /** URL of RSS feed */
  url: string;
}

/**
 * RSS Cloud - for push notifications
 */
export interface RssCloud {
  domain: string;
  port: number;
  path: string;
  registerProcedure: string;
  protocol: string;
}

/**
 * Complete RSS Feed structure
 */
export interface RssFeed {
  /** RSS version */
  version: string;
  /** Channel metadata */
  channel: RssChannel;
  /** Feed items */
  items: RssItem[];
}

/**
 * RSS Namespaced content (extensions)
 */
export interface RssNamespaces {
  /** Full content (content:encoded) */
  contentEncoded?: string;
  /** Dublin Core creator (dc:creator) */
  dcCreator?: string;
  /** Dublin Core date (dc:date) */
  dcDate?: string;
  /** Dublin Core subject (dc:subject) */
  dcSubject?: string[];
  /** Media content URL (media:content) */
  mediaContent?: RssMediaContent[];
  /** Media thumbnail (media:thumbnail) */
  mediaThumbnail?: RssMediaThumbnail[];
}

/**
 * Media RSS Content
 */
export interface RssMediaContent {
  url: string;
  type?: string;
  medium?: string;
  width?: number;
  height?: number;
}

/**
 * Media RSS Thumbnail
 */
export interface RssMediaThumbnail {
  url: string;
  width?: number;
  height?: number;
}

/**
 * Extended RSS Item with namespaces
 */
export interface RssItemExtended extends RssItem {
  /** Namespaced extensions */
  namespaces?: RssNamespaces;
}

/**
 * Extended RSS Feed with namespace support
 */
export interface RssFeedExtended extends RssFeed {
  items: RssItemExtended[];
}
