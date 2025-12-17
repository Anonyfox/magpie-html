/**
 * Atom 1.0 Feed Type Definitions
 * Spec: https://datatracker.ietf.org/doc/html/rfc4287
 */

/**
 * Atom Person construct (author, contributor)
 */
export interface AtomPerson {
  /** Name of the person (required) */
  name: string;
  /** Email address */
  email?: string;
  /** URI/URL */
  uri?: string;
}

/**
 * Atom Link element
 */
export interface AtomLink {
  /** Link href (required) */
  href: string;
  /** Link relation type */
  rel?: string;
  /** Media type */
  type?: string;
  /** Language */
  hreflang?: string;
  /** Title */
  title?: string;
  /** Length in bytes */
  length?: number;
}

/**
 * Atom Content
 */
export interface AtomContent {
  /** Content value */
  value: string;
  /** Content type: text, html, xhtml, or mime type */
  type?: string;
  /** Source URI */
  src?: string;
}

/**
 * Atom Category
 */
export interface AtomCategory {
  /** Category term (required) */
  term: string;
  /** Categorization scheme URI */
  scheme?: string;
  /** Human-readable label */
  label?: string;
}

/**
 * Atom Generator
 */
export interface AtomGenerator {
  /** Generator name */
  value: string;
  /** Generator URI */
  uri?: string;
  /** Generator version */
  version?: string;
}

/**
 * Atom Feed - represents the feed itself
 */
export interface AtomFeed {
  /** Feed ID (required) */
  id: string;
  /** Feed title (required) */
  title: string;
  /** Last updated date (required) */
  updated: string;
  /** Feed authors */
  authors?: AtomPerson[];
  /** Feed links */
  links?: AtomLink[];
  /** Feed categories */
  categories?: AtomCategory[];
  /** Feed contributors */
  contributors?: AtomPerson[];
  /** Feed generator */
  generator?: AtomGenerator;
  /** Feed icon */
  icon?: string;
  /** Feed logo */
  logo?: string;
  /** Feed rights/copyright */
  rights?: string;
  /** Feed subtitle/description */
  subtitle?: string;
}

/**
 * Atom Entry - represents an article/post
 */
export interface AtomEntry {
  /** Entry ID (required) */
  id: string;
  /** Entry title (required) */
  title: string;
  /** Last updated date (required) */
  updated: string;
  /** Entry authors */
  authors?: AtomPerson[];
  /** Entry content */
  content?: AtomContent;
  /** Entry links */
  links?: AtomLink[];
  /** Entry summary/description */
  summary?: string;
  /** Entry categories */
  categories?: AtomCategory[];
  /** Entry contributors */
  contributors?: AtomPerson[];
  /** Publication date */
  published?: string;
  /** Entry rights */
  rights?: string;
  /** Entry source feed info */
  source?: Partial<AtomFeed>;
}

/**
 * Complete Atom Feed structure
 */
export interface AtomDocument {
  /** Atom version (typically 1.0) */
  version: string;
  /** Feed metadata */
  feed: AtomFeed;
  /** Feed entries */
  entries: AtomEntry[];
}
