/**
 * Minimal Sitemap-specific XML parser
 * Built specifically for sitemap XML without HTML parsing quirks
 */

export interface SitemapElement {
  /** Tag name (e.g., 'url', 'loc', 'urlset') */
  tagName: string;
  /** Element attributes */
  attributes: Record<string, string>;
  /** Text content */
  text: string;
  /** Child elements */
  children: SitemapElement[];
  /** Parent element (for traversal) */
  parent: SitemapElement | null;
}

/**
 * Parse Sitemap XML string into element tree
 */
export function parseSitemapXML(xml: string): SitemapElement {
  const cleaned = cleanXMLDeclaration(xml);
  const withoutComments = removeComments(cleaned);
  const root = parseElement(withoutComments, 0).element;
  return root;
}

/**
 * Remove XML declaration and clean whitespace
 */
function cleanXMLDeclaration(xml: string): string {
  return xml.replace(/<\?xml[^?]*\?>/g, '').trim();
}

/**
 * Remove XML comments
 */
function removeComments(xml: string): string {
  return xml.replace(/<!--[\s\S]*?-->/g, '');
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
  parent: SitemapElement | null = null,
  cdataMap?: Map<string, string>,
): { element: SitemapElement; endPos: number; cdataMap: Map<string, string> } {
  // Extract CDATA first (only at top level)
  const extracted = cdataMap ? { text: xml, cdataMap } : extractCDATA(xml);
  const cleanedXML = extracted.text;
  const currentCdataMap = extracted.cdataMap;

  // Find opening tag
  const openTagStart = cleanedXML.indexOf('<', startPos);
  if (openTagStart === -1) {
    throw new Error('No opening tag found');
  }

  const openTagEnd = cleanedXML.indexOf('>', openTagStart);
  if (openTagEnd === -1) {
    throw new Error('Unclosed opening tag');
  }

  const openTagContent = cleanedXML.substring(openTagStart + 1, openTagEnd);

  // Check for self-closing tag
  const isSelfClosing = openTagContent.endsWith('/');
  const tagContent = isSelfClosing ? openTagContent.slice(0, -1).trim() : openTagContent;

  // Extract tag name and attributes
  const spaceIndex = tagContent.indexOf(' ');
  const tagName = spaceIndex === -1 ? tagContent : tagContent.substring(0, spaceIndex);
  const attributes = spaceIndex === -1 ? {} : parseAttributes(tagContent.substring(spaceIndex));

  const element: SitemapElement = {
    tagName,
    attributes,
    text: '',
    children: [],
    parent,
  };

  // Handle self-closing tags
  if (isSelfClosing) {
    return { element, endPos: openTagEnd + 1, cdataMap: currentCdataMap };
  }

  // Find closing tag
  const closingTagPos = findClosingTag(cleanedXML, tagName, openTagEnd + 1);
  if (closingTagPos === -1) {
    throw new Error(`No closing tag found for <${tagName}>`);
  }

  // Extract content between tags
  const content = cleanedXML.substring(openTagEnd + 1, closingTagPos);

  // Parse children or text content
  if (content.includes('<')) {
    // Has child elements
    let pos = 0;
    const trimmedContent = content.trim();

    while (pos < trimmedContent.length) {
      const nextTag = trimmedContent.indexOf('<', pos);
      if (nextTag === -1) break;

      // Check if it's a closing tag or comment
      if (trimmedContent[nextTag + 1] === '/' || trimmedContent[nextTag + 1] === '!') {
        pos = nextTag + 1;
        continue;
      }

      try {
        const { element: child, endPos } = parseElement(
          trimmedContent,
          nextTag,
          element,
          currentCdataMap,
        );
        element.children.push(child);
        pos = endPos;
      } catch {
        pos = nextTag + 1;
      }
    }

    // Extract text content (without child elements)
    let textContent = content.replace(/<[^>]+>/g, '').trim();
    textContent = restoreCDATA(textContent, currentCdataMap);
    element.text = textContent;
  } else {
    // Pure text content
    let textContent = content.trim();
    textContent = restoreCDATA(textContent, currentCdataMap);
    element.text = textContent;
  }

  const closingTagEnd = closingTagPos + `</${tagName}>`.length;
  return { element, endPos: closingTagEnd, cdataMap: currentCdataMap };
}

/**
 * Query selector - find first matching element (case-insensitive by default)
 */
export function querySelector(
  element: SitemapElement,
  selector: string,
  caseSensitive = false,
): SitemapElement | null {
  const tagName = caseSensitive ? selector : selector.toLowerCase();
  const elementTag = caseSensitive ? element.tagName : element.tagName.toLowerCase();

  if (elementTag === tagName) {
    return element;
  }

  for (const child of element.children) {
    const found = querySelector(child, selector, caseSensitive);
    if (found) return found;
  }

  return null;
}

/**
 * Query selector all - find all matching elements
 */
export function querySelectorAll(
  element: SitemapElement,
  selector: string,
  caseSensitive = false,
): SitemapElement[] {
  const results: SitemapElement[] = [];
  const tagName = caseSensitive ? selector : selector.toLowerCase();
  const elementTag = caseSensitive ? element.tagName : element.tagName.toLowerCase();

  if (elementTag === tagName) {
    results.push(element);
  }

  for (const child of element.children) {
    results.push(...querySelectorAll(child, selector, caseSensitive));
  }

  return results;
}

/**
 * Get text content of element
 */
export function getText(element: SitemapElement | null | undefined): string {
  return element?.text || '';
}

/**
 * Get attribute value
 */
export function getAttribute(
  element: SitemapElement | null | undefined,
  name: string,
): string | null {
  return element?.attributes[name] || null;
}

/**
 * Get first child element by tag name
 */
export function getChild(element: SitemapElement, tagName: string): SitemapElement | null {
  const lowerTag = tagName.toLowerCase();
  return element.children.find((c) => c.tagName.toLowerCase() === lowerTag) || null;
}

/**
 * Get all child elements by tag name
 */
export function getChildren(element: SitemapElement, tagName: string): SitemapElement[] {
  const lowerTag = tagName.toLowerCase();
  return element.children.filter((c) => c.tagName.toLowerCase() === lowerTag);
}
