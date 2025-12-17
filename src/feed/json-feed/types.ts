/**
 * JSON Feed Type Definitions
 * Spec: https://jsonfeed.org/version/1.1
 */

/**
 * JSON Feed Author
 */
export interface JSONFeedAuthor {
  /** Author name */
  name?: string;
  /** Author URL */
  url?: string;
  /** Author avatar URL */
  avatar?: string;
}

/**
 * JSON Feed Attachment
 */
export interface JSONFeedAttachment {
  /** Attachment URL (required) */
  url: string;
  /** MIME type */
  mime_type: string;
  /** Title */
  title?: string;
  /** Size in bytes */
  size_in_bytes?: number;
  /** Duration in seconds (for audio/video) */
  duration_in_seconds?: number;
}

/**
 * JSON Feed Hub (for WebSub/PubSubHubbub)
 */
export interface JSONFeedHub {
  /** Hub type */
  type: string;
  /** Hub URL */
  url: string;
}

/**
 * JSON Feed Item
 */
export interface JSONFeedItem {
  /** Unique ID (required) */
  id: string;
  /** Item URL */
  url?: string;
  /** External URL (for linked posts) */
  external_url?: string;
  /** Item title */
  title?: string;
  /** HTML content */
  content_html?: string;
  /** Plain text content */
  content_text?: string;
  /** Summary/excerpt */
  summary?: string;
  /** Image URL */
  image?: string;
  /** Banner image URL */
  banner_image?: string;
  /** Publication date (ISO 8601) */
  date_published?: string;
  /** Modification date (ISO 8601) */
  date_modified?: string;
  /** Item authors */
  authors?: JSONFeedAuthor[];
  /** Tags */
  tags?: string[];
  /** Language (BCP 47) */
  language?: string;
  /** Attachments */
  attachments?: JSONFeedAttachment[];
  /** Custom extensions */
  [key: string]: unknown;
}

/**
 * JSON Feed
 */
export interface JSONFeed {
  /** JSON Feed version (required) */
  version: string;
  /** Feed title (required) */
  title: string;
  /** Feed home page URL */
  home_page_url?: string;
  /** Feed URL */
  feed_url?: string;
  /** Feed description */
  description?: string;
  /** User comment */
  user_comment?: string;
  /** Next page URL (for pagination) */
  next_url?: string;
  /** Icon URL */
  icon?: string;
  /** Favicon URL */
  favicon?: string;
  /** Feed authors */
  authors?: JSONFeedAuthor[];
  /** Language (BCP 47) */
  language?: string;
  /** Whether feed is expired */
  expired?: boolean;
  /** Hubs for notifications */
  hubs?: JSONFeedHub[];
  /** Feed items (required) */
  items: JSONFeedItem[];
  /** Custom extensions */
  [key: string]: unknown;
}

/**
 * JSON Feed Document (parsed result)
 */
export interface JSONFeedDocument {
  /** Detected version */
  version: string;
  /** Feed data */
  feed: JSONFeed;
}
