/**
 * Extract Atom entry metadata
 */

import { cleanAtomContent, cleanText } from './clean-text.js';
import { parseAtomDate } from './parse-date.js';
import type {
  AtomCategory,
  AtomContent,
  AtomEntry,
  AtomFeed,
  AtomLink,
  AtomPerson,
} from './types.js';
import type { AtomElement } from './xml-parser.js';

/**
 * Extract person (author, contributor)
 */
function extractPerson(element: AtomElement): AtomPerson | null {
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
function extractPersons(root: AtomElement, tagName: string): AtomPerson[] {
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
function extractLink(element: AtomElement): AtomLink | null {
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
function extractLinks(root: AtomElement): AtomLink[] {
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
function extractCategory(element: AtomElement): AtomCategory | null {
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
function extractCategories(root: AtomElement): AtomCategory[] {
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
 * Extract content
 */
function extractContent(root: AtomElement): AtomContent | undefined {
  const element = root.querySelector('content');
  if (!element) {
    return undefined;
  }

  const type = element.getAttribute('type');
  const src = element.getAttribute('src');
  const text = element.textContent;

  if (!text && !src) {
    return undefined;
  }

  const content: AtomContent = {
    value: text ? cleanAtomContent(text, type) : '',
  };

  if (type) {
    content.type = cleanText(type);
  }

  if (src) {
    content.src = cleanText(src);
  }

  return content;
}

/**
 * Extract text content with type attribute
 */
function extractTextContent(root: AtomElement, tagName: string): string | undefined {
  const element = root.querySelector(tagName);
  if (!element) {
    return undefined;
  }

  const text = element.textContent;
  const type = element.getAttribute('type');

  return text ? cleanAtomContent(text, type) : undefined;
}

/**
 * Extract Atom entry
 */
export function extractEntry(entryElement: AtomElement): AtomEntry {
  // Required fields
  const id = entryElement.querySelector('id')?.textContent;
  if (!id) {
    throw new Error('Invalid Atom entry: missing required <id> element');
  }

  const title = extractTextContent(entryElement, 'title');
  if (!title) {
    throw new Error('Invalid Atom entry: missing required <title> element');
  }

  const updatedRaw = entryElement.querySelector('updated')?.textContent;
  if (!updatedRaw) {
    throw new Error('Invalid Atom entry: missing required <updated> element');
  }

  const updated = parseAtomDate(updatedRaw);
  if (!updated) {
    throw new Error('Invalid Atom entry: invalid <updated> date');
  }

  const entry: AtomEntry = {
    id: cleanText(id),
    title,
    updated,
  };

  // Optional fields
  const authors = extractPersons(entryElement, 'author');
  if (authors.length > 0) {
    entry.authors = authors;
  }

  const content = extractContent(entryElement);
  if (content) {
    entry.content = content;
  }

  const links = extractLinks(entryElement);
  if (links.length > 0) {
    entry.links = links;
  }

  const summary = extractTextContent(entryElement, 'summary');
  if (summary) {
    entry.summary = summary;
  }

  const categories = extractCategories(entryElement);
  if (categories.length > 0) {
    entry.categories = categories;
  }

  const contributors = extractPersons(entryElement, 'contributor');
  if (contributors.length > 0) {
    entry.contributors = contributors;
  }

  const publishedRaw = entryElement.querySelector('published')?.textContent;
  if (publishedRaw) {
    const published = parseAtomDate(publishedRaw);
    if (published) {
      entry.published = published;
    }
  }

  const rights = extractTextContent(entryElement, 'rights');
  if (rights) {
    entry.rights = rights;
  }

  // Source is a partial feed
  const source = entryElement.querySelector('source');
  if (source) {
    const sourceData: Partial<AtomFeed> = {};

    const sourceId = source.querySelector('id')?.textContent;
    if (sourceId) {
      sourceData.id = cleanText(sourceId);
    }

    const sourceTitle = extractTextContent(source, 'title');
    if (sourceTitle) {
      sourceData.title = sourceTitle;
    }

    const sourceUpdatedRaw = source.querySelector('updated')?.textContent;
    if (sourceUpdatedRaw) {
      const sourceUpdated = parseAtomDate(sourceUpdatedRaw);
      if (sourceUpdated) {
        sourceData.updated = sourceUpdated;
      }
    }

    if (Object.keys(sourceData).length > 0) {
      entry.source = sourceData;
    }
  }

  return entry;
}
