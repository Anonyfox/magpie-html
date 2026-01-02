/**
 * Minimal Atom-specific XML parser
 * Built specifically for Atom 1.0 feeds with their specific quirks
 */

export interface AtomElement {
  /** Tag name (e.g., 'feed', 'entry', 'title') */
  tagName: string;
  /** Element attributes */
  attributes: Record<string, string>;
  /** Text content (with CDATA stripped) */
  text: string;
  /** Child elements */
  children: AtomElement[];
  /** Parent element (for traversal) */
  parent: AtomElement | null;

  /** Query selector - find first matching child */
  querySelector: (selector: string) => AtomElement | null;
  /** Query selector all - find all matching children */
  querySelectorAll: (selector: string) => AtomElement[];
  /** Get attribute value */
  getAttribute: (name: string) => string | null;
  /** Get text content */
  get textContent(): string;
}

/**
 * Remove XML comments
 */
function removeComments(xml: string): string {
  return xml.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Remove DOCTYPE declarations
 */
function removeDoctype(xml: string): string {
  return xml.replace(/<!DOCTYPE[^>]*>/gi, '');
}

/**
 * Parse Atom XML string into element tree
 */
export function parseAtomXML(xml: string): AtomElement {
  const withoutDoctype = removeDoctype(xml);
  const withoutComments = removeComments(withoutDoctype);
  const { text: cleanedXML, cdataMap } = extractCDATA(withoutComments);
  const root = parseElement(cleanedXML, 0, null, cdataMap).element;
  return root;
}

/**
 * Extract CDATA content and replace with placeholder
 */
function extractCDATA(text: string): { text: string; cdataMap: Map<string, string> } {
  const cdataMap = new Map<string, string>();
  let counter = 0;

  const processed = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_match, content) => {
    const placeholder = `__CDATA_${counter}__`;
    cdataMap.set(placeholder, content);
    counter++;
    return placeholder;
  });

  return { text: processed, cdataMap };
}

/**
 * Restore CDATA content from placeholders
 */
function restoreCDATA(text: string, cdataMap: Map<string, string>): string {
  let result = text;
  for (const [placeholder, content] of cdataMap.entries()) {
    result = result.replace(placeholder, content);
  }
  return result;
}

/**
 * Parse attributes from opening tag
 */
function parseAttributes(tagContent: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attrRegex = /(\S+)=["']([^"']*)["']/g;
  let match: RegExpExecArray | null = attrRegex.exec(tagContent);

  while (match !== null) {
    attributes[match[1]] = match[2];
    match = attrRegex.exec(tagContent);
  }

  return attributes;
}

/**
 * Find matching closing tag position
 */
function findClosingTag(xml: string, tagName: string, startPos: number): number {
  const openTag = `<${tagName}`;
  const closeTag = `</${tagName}>`;
  let depth = 1;
  let pos = startPos;

  while (pos < xml.length && depth > 0) {
    const nextOpen = xml.indexOf(openTag, pos);
    const nextClose = xml.indexOf(closeTag, pos);

    if (nextClose === -1) {
      return -1; // No closing tag found
    }

    if (nextOpen !== -1 && nextOpen < nextClose) {
      // Found nested opening tag
      depth++;
      pos = nextOpen + openTag.length;
    } else {
      // Found closing tag
      depth--;
      if (depth === 0) {
        return nextClose;
      }
      pos = nextClose + closeTag.length;
    }
  }

  return -1;
}

/**
 * Parse a single element and its children
 */
function parseElement(
  xml: string,
  startPos: number,
  parent: AtomElement | null = null,
  cdataMap: Map<string, string>,
): { element: AtomElement; endPos: number } {
  // Find opening tag
  const openTagStart = xml.indexOf('<', startPos);
  if (openTagStart === -1) {
    throw new Error('No opening tag found');
  }

  const openTagEnd = xml.indexOf('>', openTagStart);
  if (openTagEnd === -1) {
    throw new Error('Unclosed opening tag');
  }

  const openTagContent = xml.substring(openTagStart + 1, openTagEnd);

  // Check for self-closing tag
  const isSelfClosing = openTagContent.endsWith('/');
  const tagContent = isSelfClosing ? openTagContent.slice(0, -1).trim() : openTagContent;

  // Extract tag name and attributes
  const spaceIndex = tagContent.indexOf(' ');
  const tagName = spaceIndex === -1 ? tagContent : tagContent.substring(0, spaceIndex);
  const attributes = spaceIndex === -1 ? {} : parseAttributes(tagContent.substring(spaceIndex));

  const element: AtomElement = {
    tagName,
    attributes,
    text: '',
    children: [],
    parent,
    querySelector: (selector: string) => querySelector(element as AtomElement, selector),
    querySelectorAll: (selector: string) => querySelectorAll(element as AtomElement, selector),
    getAttribute: (name: string) => element.attributes[name] ?? null,
    get textContent() {
      return element.text;
    },
  };

  // Handle self-closing tags
  if (isSelfClosing) {
    return {
      element,
      endPos: openTagEnd + 1,
    };
  }

  // Find closing tag
  const closingTagStart = findClosingTag(xml, tagName, openTagEnd + 1);
  if (closingTagStart === -1) {
    throw new Error(`No closing tag found for <${tagName}>`);
  }

  // Extract content between opening and closing tags
  const contentStart = openTagEnd + 1;
  const content = xml.substring(contentStart, closingTagStart);

  // Parse children and text
  const children: AtomElement[] = [];
  const textParts: string[] = [];
  let pos = 0;

  while (pos < content.length) {
    const nextTagStart = content.indexOf('<', pos);

    if (nextTagStart === -1) {
      // No more tags, rest is text
      textParts.push(content.substring(pos));
      break;
    }

    // Text before next tag
    if (nextTagStart > pos) {
      textParts.push(content.substring(pos, nextTagStart));
    }

    // Check if it's a closing tag or comment
    if (content[nextTagStart + 1] === '/' || content[nextTagStart + 1] === '!') {
      // Skip closing tags and comments
      const tagEnd = content.indexOf('>', nextTagStart);
      if (tagEnd !== -1) {
        pos = tagEnd + 1;
      } else {
        break;
      }
      continue;
    }

    // Parse child element
    try {
      const { element: childElement, endPos } = parseElement(
        xml,
        contentStart + nextTagStart,
        element,
        cdataMap,
      );
      children.push(childElement);
      pos = endPos - contentStart;
    } catch {
      // If parsing fails, treat as text
      pos = nextTagStart + 1;
    }
  }

  // Combine and clean text
  const rawText = textParts.join('').trim();
  const restoredText = restoreCDATA(rawText, cdataMap);
  element.text = restoredText;
  element.children = children;

  const closingTagEnd = closingTagStart + `</${tagName}>`.length;

  return {
    element,
    endPos: closingTagEnd,
  };
}

/**
 * Query selector - find first matching element
 */
function querySelector(element: AtomElement, selector: string): AtomElement | null {
  // Search in direct children first
  for (const child of element.children) {
    if (child.tagName === selector) {
      return child;
    }
  }

  // Deep search
  for (const child of element.children) {
    const result = querySelector(child, selector);
    if (result) {
      return result;
    }
  }

  return null;
}

/**
 * Query selector all - find all matching elements
 */
function querySelectorAll(element: AtomElement, selector: string): AtomElement[] {
  const results: AtomElement[] = [];

  // Search direct children
  for (const child of element.children) {
    if (child.tagName === selector) {
      results.push(child);
    }
  }

  // Deep search in children (but don't add duplicates)
  // const directChildrenTags = new Set(results.map((r) => r.tagName));
  for (const child of element.children) {
    const childResults = querySelectorAll(child, selector);
    for (const childResult of childResults) {
      if (!results.includes(childResult)) {
        results.push(childResult);
      }
    }
  }

  return results;
}

/**
 * Parse XML and return root element
 */
export function parseXML(xml: string): AtomElement {
  // Remove XML declaration and processing instructions
  const cleaned = xml.replace(/<\?[^?]*\?>/g, '').trim();
  return parseAtomXML(cleaned);
}
