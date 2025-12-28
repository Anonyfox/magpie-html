/**
 * Extract Atom feed metadata
 */

import { cleanAtomContent, cleanText } from './clean-text.js';
import { parseAtomDate } from './parse-date.js';
import type { AtomCategory, AtomFeed, AtomGenerator, AtomLink, AtomPerson } from './types.js';
import { parseXML } from './xml-parser.js';

/**
 * Extract date from element with fallbacks for different Atom versions and extensions
 * Tries selectors in order: updated (Atom 1.0), modified (Atom 0.3), issued (Atom 0.3), dc:date (Dublin Core)
 */
function extractAtomDate(element: ReturnType<typeof parseXML>): string | null {
  // Try Atom 1.0 <updated>
  let dateText = element.querySelector('updated')?.textContent;
  if (dateText) {
    const parsed = parseAtomDate(dateText);
    if (parsed) return parsed;
  }

  // Try Atom 0.3 <modified>
  dateText = element.querySelector('modified')?.textContent;
  if (dateText) {
    const parsed = parseAtomDate(dateText);
    if (parsed) return parsed;
  }

  // Try Atom 0.3 <issued>
  dateText = element.querySelector('issued')?.textContent;
  if (dateText) {
    const parsed = parseAtomDate(dateText);
    if (parsed) return parsed;
  }

  // Try Dublin Core <dc:date>
  const dcDateElements = element.children.filter(child => child.tagName === 'dc:date');
  if (dcDateElements.length > 0) {
    dateText = dcDateElements[0].textContent;
    if (dateText) {
      const parsed = parseAtomDate(dateText);
      if (parsed) return parsed;
    }
  }

  return null;
}

/**
 * Extract person (author, contributor)
 */
function extractPerson(element: ReturnType<typeof parseXML>): AtomPerson | null {
  const name = element.querySelector('name')?.textContent;
  if (!name) {
    return null; // Name is required for person construct
  }

  const person: AtomPerson = {
    name: cleanText(name),
  };

  const email = element.querySelector('email')?.textContent;
  if (email) {
    person.email = cleanText(email);
  }

  const uri = element.querySelector('uri')?.textContent;
  if (uri) {
    person.uri = cleanText(uri);
  }

  return person;
}

/**
 * Extract all persons of a given tag name
 */
function extractPersons(root: ReturnType<typeof parseXML>, tagName: string): AtomPerson[] {
  const persons: AtomPerson[] = [];
  const elements = root.querySelectorAll(tagName);

  for (const element of elements) {
    const person = extractPerson(element);
    if (person) {
      persons.push(person);
    }
  }

  return persons;
}

/**
 * Extract link
 */
function extractLink(element: ReturnType<typeof parseXML>): AtomLink | null {
  const href = element.getAttribute('href');
  if (!href) {
    return null; // href is required
  }

  const link: AtomLink = {
    href: cleanText(href),
  };

  const rel = element.getAttribute('rel');
  if (rel) {
    link.rel = cleanText(rel);
  }

  const type = element.getAttribute('type');
  if (type) {
    link.type = cleanText(type);
  }

  const hreflang = element.getAttribute('hreflang');
  if (hreflang) {
    link.hreflang = cleanText(hreflang);
  }

  const title = element.getAttribute('title');
  if (title) {
    link.title = cleanText(title);
  }

  const length = element.getAttribute('length');
  if (length) {
    const lengthNum = Number.parseInt(length, 10);
    if (!Number.isNaN(lengthNum)) {
      link.length = lengthNum;
    }
  }

  return link;
}

/**
 * Extract all links
 */
function extractLinks(root: ReturnType<typeof parseXML>): AtomLink[] {
  const links: AtomLink[] = [];
  const elements = root.querySelectorAll('link');

  for (const element of elements) {
    const link = extractLink(element);
    if (link) {
      links.push(link);
    }
  }

  return links;
}

/**
 * Extract category
 */
function extractCategory(element: ReturnType<typeof parseXML>): AtomCategory | null {
  const term = element.getAttribute('term');
  if (!term) {
    return null; // term is required
  }

  const category: AtomCategory = {
    term: cleanText(term),
  };

  const scheme = element.getAttribute('scheme');
  if (scheme) {
    category.scheme = cleanText(scheme);
  }

  const label = element.getAttribute('label');
  if (label) {
    category.label = cleanText(label);
  }

  return category;
}

/**
 * Extract all categories
 */
function extractCategories(root: ReturnType<typeof parseXML>): AtomCategory[] {
  const categories: AtomCategory[] = [];
  const elements = root.querySelectorAll('category');

  for (const element of elements) {
    const category = extractCategory(element);
    if (category) {
      categories.push(category);
    }
  }

  return categories;
}

/**
 * Extract generator
 */
function extractGenerator(root: ReturnType<typeof parseXML>): AtomGenerator | null {
  const element = root.querySelector('generator');
  if (!element) {
    return null;
  }

  const value = element.textContent;
  if (!value) {
    return null;
  }

  const generator: AtomGenerator = {
    value: cleanText(value),
  };

  const uri = element.getAttribute('uri');
  if (uri) {
    generator.uri = cleanText(uri);
  }

  const version = element.getAttribute('version');
  if (version) {
    generator.version = cleanText(version);
  }

  return generator;
}

/**
 * Extract text content with type attribute
 */
function extractTextContent(
  root: ReturnType<typeof parseXML>,
  tagName: string,
): string | undefined {
  const element = root.querySelector(tagName);
  if (!element) {
    return undefined;
  }

  const text = element.textContent;
  const type = element.getAttribute('type');

  return text ? cleanAtomContent(text, type) : undefined;
}

/**
 * Extract Atom feed-level metadata
 */
export function extractFeed(xml: string): AtomFeed {
  const doc = parseXML(xml);

  // The root element should be the feed
  const feed = doc.tagName === 'feed' ? doc : doc.querySelector('feed');

  if (!feed) {
    throw new Error('Invalid Atom feed: missing <feed> element');
  }

  // Required fields
  const id = feed.querySelector('id')?.textContent;
  if (!id) {
    throw new Error('Invalid Atom feed: missing required <id> element');
  }

  const title = extractTextContent(feed, 'title');
  if (!title) {
    throw new Error('Invalid Atom feed: missing required <title> element');
  }

  const updated = extractAtomDate(feed);
  if (!updated) {
    throw new Error('Invalid Atom feed: missing or invalid date (tried <updated>, <modified>, <issued>, <dc:date>)');
  }

  const result: AtomFeed = {
    id: cleanText(id),
    title,
    updated,
  };

  // Optional fields
  const authors = extractPersons(feed, 'author');
  if (authors.length > 0) {
    result.authors = authors;
  }

  const links = extractLinks(feed);
  if (links.length > 0) {
    result.links = links;
  }

  const categories = extractCategories(feed);
  if (categories.length > 0) {
    result.categories = categories;
  }

  const contributors = extractPersons(feed, 'contributor');
  if (contributors.length > 0) {
    result.contributors = contributors;
  }

  const generator = extractGenerator(feed);
  if (generator) {
    result.generator = generator;
  }

  const icon = feed.querySelector('icon')?.textContent;
  if (icon) {
    result.icon = cleanText(icon);
  }

  const logo = feed.querySelector('logo')?.textContent;
  if (logo) {
    result.logo = cleanText(logo);
  }

  const rights = extractTextContent(feed, 'rights');
  if (rights) {
    result.rights = rights;
  }

  const subtitle = extractTextContent(feed, 'subtitle');
  if (subtitle) {
    result.subtitle = subtitle;
  }

  return result;
}
