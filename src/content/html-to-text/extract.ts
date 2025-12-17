/**
 * HTML to text conversion.
 *
 * @remarks
 * Convert HTML to plain text using a zero-dependency streaming tokenizer.
 * Pure, deterministic transformation suitable for logs, previews, classification,
 * and search indexing. Preserves essential structure by inserting newlines at
 * block boundaries, handles entities, and provides configurable options.
 *
 * @packageDocumentation
 */

import type { HtmlToTextOptions } from './types.js';

/**
 * Convert an HTML string to plain text.
 *
 * @remarks
 * This function uses a streaming tokenizer to parse HTML and extract text content.
 * It handles block elements, whitespace preservation, HTML entities, tables, and more.
 *
 * Features:
 * - Preserves document structure with appropriate line breaks
 * - Handles HTML entities (numeric and common named entities)
 * - Configurable link and image handling
 * - Table rendering with configurable cell separators
 * - Whitespace preservation for code/pre blocks
 * - Optional hard-wrapping at column width
 *
 * @param html - HTML string (fragment or full document)
 * @param options - Conversion options
 * @returns Plain text string
 *
 * @throws {TypeError} If html is not a string
 *
 * @example
 * ```typescript
 * const html = '<div><h1>Hello</h1><p>World!</p></div>';
 * const text = htmlToText(html);
 * console.log(text); // "Hello\n\nWorld!"
 * ```
 *
 * @example
 * ```typescript
 * const html = '<a href="https://example.com">Visit</a>';
 * const text = htmlToText(html, { links: 'inline' });
 * console.log(text); // "Visit (https://example.com)"
 * ```
 */
export function htmlToText(html: string, options: HtmlToTextOptions = {}): string {
  if (typeof html !== 'string') {
    throw new TypeError('Expected html to be a string');
  }

  const settings = normalizeOptions(options);

  // Fast path: empty input
  if (html.length === 0) {
    return '';
  }

  // Sets and constants for classification
  const preservedTagSet = toSet(settings.preserveTags);
  const excludedTagSet = toSet(
    settings.excludeTags.concat(settings.mode === 'document' ? ['head'] : []),
  );
  const blockTagSet = BLOCK_TAG_SET;

  // Table state
  let insideTable = 0;
  let cellBuffer: string[] = [];
  const cellSep = settings.tableCellSeparator === 'tab' ? '\t' : ' ';

  // Stack state
  const tagStack: string[] = [];
  let preserveWhitespace = false;
  let excludeDepth = 0;

  // Link/image context
  let currentAnchorHref: string | null = null;
  let inAnchor = false;
  let anchorHasText = false;

  // Output buffer
  const out: string[] = [];

  // Simple streaming tokenizer
  const length = html.length;
  let i = 0;

  while (i < length) {
    const ch = html.charCodeAt(i);

    if (ch === 60 /* < */) {
      // Parse tag
      const tagStart = i;
      const end = html.indexOf('>', tagStart + 1);

      if (end === -1) {
        // Malformed tail: treat as text
        emitText(html.slice(i), out, settings, preserveWhitespace);
        break;
      }

      const rawTag = html.slice(tagStart + 1, end);
      i = end + 1;

      const isClosing = rawTag[0] === '/';
      const tagBody = isClosing ? rawTag.slice(1) : rawTag;
      const spaceIdx = indexOfSpace(tagBody);
      let tagName = (spaceIdx === -1 ? tagBody : tagBody.slice(0, spaceIdx)).toLowerCase();

      // Remove trailing slash for self-closing tags without space (e.g., <br/>)
      if (tagName.endsWith('/')) {
        tagName = tagName.slice(0, -1);
      }

      if (isClosing) {
        // Closing tag
        handleTagClose(tagName);
      } else {
        // Opening or self-closing tag
        const selfClosing = rawTag.endsWith('/') || SELF_CLOSING_TAG_SET.has(tagName);
        const attrs = spaceIdx === -1 ? '' : tagBody.slice(spaceIdx + 1);
        handleTagOpen(tagName, attrs, selfClosing);
      }
      continue;
    }

    // Text node
    const nextTag = html.indexOf('<', i);
    const text = nextTag === -1 ? html.slice(i) : html.slice(i, nextTag);
    i = nextTag === -1 ? length : nextTag;

    if (excludeDepth > 0) {
      continue;
    }

    if (insideTable > 0) {
      // Accumulate raw text for the current cell
      cellBuffer.push(text);
    } else {
      // Track if anchor has text before potentially suppressing it
      if (inAnchor && /\S/.test(text)) {
        anchorHasText = true;
      }

      // Suppress text content when inside a link that should be removed
      const shouldSuppressText = inAnchor && settings.links === 'remove';
      if (!shouldSuppressText) {
        emitText(text, out, settings, preserveWhitespace);
      }
    }
  }

  let result = out.join('');

  // Capture leading/trailing whitespace before collapse (for trim: false)
  const leadingMatch = result.match(/^(\s*)/);
  const trailingMatch = result.match(/(\s*)$/);
  const leadingWs = leadingMatch ? leadingMatch[1] : '';
  const trailingWs = trailingMatch ? trailingMatch[1] : '';

  if (settings.collapseWhitespace) {
    result = collapseWhitespace(result, settings.maxNewlines, settings.trim);
  }

  if (settings.wrap != null && settings.wrap > 0) {
    result = hardWrap(result, settings.wrap);
  }

  // Remove preserve markers (they were used during collapse and wrap)
  result = result.replace(new RegExp(PRESERVE_OPEN, 'g'), '');
  result = result.replace(new RegExp(PRESERVE_CLOSE, 'g'), '');

  if (settings.trim) {
    result = result.trim();
  } else if (settings.collapseWhitespace && (leadingWs || trailingWs)) {
    // Restore some whitespace when trim: false but collapse removed it
    // At least preserve one space if there was any leading/trailing whitespace
    if (leadingWs && !result.startsWith(' ') && !result.startsWith('\n')) {
      result = ` ${result}`;
    }
    if (trailingWs && !result.endsWith(' ') && !result.endsWith('\n')) {
      result = `${result} `;
    }
  }

  return result;

  // --- Helper functions ---

  function pushTag(name: string): void {
    tagStack.push(name);
    if (preservedTagSet.has(name)) {
      preserveWhitespace = true;
    }
    if (excludedTagSet.has(name)) {
      excludeDepth += 1;
    }
    if (name === 'table') {
      insideTable += 1;
    }
  }

  function popTag(name: string): void {
    // Pop until matching name (best-effort against malformed HTML)
    for (let idx = tagStack.length - 1; idx >= 0; idx -= 1) {
      const t = tagStack[idx];
      tagStack.length = idx;

      if (preservedTagSet.has(t)) {
        preserveWhitespace = false;
      }
      if (excludedTagSet.has(t)) {
        excludeDepth = Math.max(0, excludeDepth - 1);
      }
      if (t === 'table') {
        insideTable = Math.max(0, insideTable - 1);
      }
      if (t === name) {
        break;
      }
    }
  }

  function handleTagOpen(tagName: string, attrs: string, selfClosing: boolean): void {
    if (excludedTagSet.has(tagName)) {
      pushTag(tagName);
      return;
    }

    if (tagName === 'br') {
      out.push('\n');
      return;
    }

    if (tagName === 'a') {
      currentAnchorHref = extractAttr(attrs, 'href');
      inAnchor = true;
      anchorHasText = false;
      pushTag(tagName);
      if (selfClosing) {
        handleTagClose(tagName);
      }
      return;
    }

    if (tagName === 'img') {
      if (settings.images === 'alt') {
        const alt = extractAttr(attrs, 'alt');
        if (alt) {
          emitText(alt, out, settings, true);
        }
      }
      // If we are between anchors, keep a separating space to avoid collapsing words
      if (inAnchor) {
        out.push(' ');
      }
      return;
    }

    if (tagName === 'td' || tagName === 'th') {
      if (insideTable > 0) {
        cellBuffer = [];
      }
      pushTag(tagName);
      if (selfClosing) {
        handleTagClose(tagName);
      }
      return;
    }

    if (tagName === 'tr') {
      pushTag(tagName);
      if (selfClosing) {
        handleTagClose(tagName);
      }
      return;
    }

    // If entering a whitespace-preserved tag and previous output isn't at line start,
    // insert a newline to separate block context from pre/code content.
    if (preservedTagSet.has(tagName) && tagName !== 'code') {
      ensureNewline(out);
    }

    pushTag(tagName);
    if (selfClosing) {
      handleTagClose(tagName);
    }
  }

  function handleTagClose(tagName: string): void {
    if (excludedTagSet.has(tagName)) {
      popTag(tagName);
      return;
    }

    if (tagName === 'a') {
      const shouldInline =
        !!currentAnchorHref &&
        (settings.links === 'inline' || (!anchorHasText && settings.images === 'remove'));

      if (shouldInline && currentAnchorHref) {
        const prev = out.length > 0 ? out[out.length - 1] : '';
        const needSpace = anchorHasText
          ? prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n')
          : true;

        if (needSpace) {
          out.push(' ');
        }
        out.push('(', currentAnchorHref, ')');
      }

      currentAnchorHref = null;
      inAnchor = false;
      anchorHasText = false;
      popTag(tagName);
      return;
    }

    if (tagName === 'td' || tagName === 'th') {
      if (insideTable > 0) {
        const text = cellBuffer.join('');
        const normalized = settings.collapseWhitespace
          ? collapseWhitespace(
              processText(text, settings, preserveWhitespace),
              settings.maxNewlines,
              settings.trim,
            )
          : processText(text, settings, preserveWhitespace);

        // Append separator (we'll remove trailing separator on row close)
        out.push(normalized, cellSep);
        cellBuffer = [];
      }
      popTag(tagName);
      return;
    }

    if (tagName === 'tr') {
      // Remove trailing cell separator if present
      if (out.length > 0 && out[out.length - 1] === cellSep) {
        out.pop();
      }
      ensureNewline(out);
      popTag(tagName);
      return;
    }

    if (blockTagSet.has(tagName)) {
      // Block elements end with a newline
      ensureNewline(out);
    }

    popTag(tagName);
  }
}

// --- Normalization and helpers ---

interface NormalizedOptions {
  mode: 'fragment' | 'document';
  links: 'text' | 'inline' | 'remove';
  images: 'alt' | 'remove';
  collapseWhitespace: boolean;
  maxNewlines: number;
  wrap: number | null;
  tableCellSeparator: 'tab' | 'space';
  excludeTags: string[];
  decodeEntities: boolean;
  preserveTags: string[];
  trim: boolean;
}

function normalizeOptions(o: HtmlToTextOptions): NormalizedOptions {
  return {
    mode: o.mode === 'document' ? 'document' : 'fragment',
    links: o.links === 'inline' || o.links === 'remove' ? o.links : 'text',
    images: o.images === 'remove' ? 'remove' : 'alt',
    collapseWhitespace: o.collapseWhitespace !== false,
    maxNewlines: typeof o.maxNewlines === 'number' && o.maxNewlines >= 1 ? o.maxNewlines : 2,
    wrap: typeof o.wrap === 'number' && o.wrap > 0 ? Math.floor(o.wrap) : null,
    tableCellSeparator: o.tableCellSeparator === 'space' ? 'space' : 'tab',
    excludeTags: Array.isArray(o.excludeTags)
      ? o.excludeTags.map((x) => String(x).toLowerCase())
      : ['script', 'style', 'noscript', 'template', 'svg', 'canvas'],
    decodeEntities: o.decodeEntities !== false,
    preserveTags: Array.isArray(o.preserveTags)
      ? o.preserveTags.map((x) => String(x).toLowerCase())
      : ['pre', 'code', 'textarea'],
    trim: o.trim !== false,
  };
}

function toSet(arr: string[]): Set<string> {
  return new Set(arr);
}

function emitText(
  text: string,
  out: string[],
  settings: NormalizedOptions,
  preserveWhitespace: boolean,
): void {
  if (text.length === 0) {
    return;
  }
  const processed = processText(text, settings, preserveWhitespace);
  out.push(processed);
}

function processText(
  text: string,
  settings: NormalizedOptions,
  preserveWhitespace: boolean,
): string {
  let t = text;

  if (settings.decodeEntities) {
    t = decodeEntities(t);
  }

  if (preserveWhitespace) {
    // Mark region to bypass global collapse
    return PRESERVE_OPEN + t + PRESERVE_CLOSE;
  }

  if (settings.collapseWhitespace) {
    // Collapse all whitespace (including newlines) to single spaces
    t = t.replace(/[\t\f\v\r\n ]+/g, ' ');
  }

  return t;
}

function ensureNewline(out: string[]): void {
  if (out.length === 0) {
    return;
  }
  const last = out[out.length - 1];
  if (last.endsWith('\n')) {
    return;
  }
  out.push('\n');
}

function collapseWhitespace(input: string, maxNewlines: number, trim: boolean): string {
  if (input.indexOf(PRESERVE_OPEN) === -1) {
    return collapseWhitespaceGlobal(input, maxNewlines, trim);
  }

  let result = '';
  let idx = 0;

  while (idx < input.length) {
    const open = input.indexOf(PRESERVE_OPEN, idx);
    if (open === -1) {
      result += collapseWhitespaceGlobal(input.slice(idx), maxNewlines, trim);
      break;
    }

    result += collapseWhitespaceGlobal(input.slice(idx, open), maxNewlines, trim);
    const close = input.indexOf(PRESERVE_CLOSE, open + 1);

    if (close === -1) {
      // Unmatched: treat rest as normal
      result += collapseWhitespaceGlobal(input.slice(open + 1), maxNewlines, trim);
      break;
    }

    // Keep preserved content with markers (for hardWrap to respect)
    result += input.slice(open, close + 1);
    idx = close + 1;
  }

  return result;
}

function collapseWhitespaceGlobal(input: string, maxNewlines: number, trim: boolean): string {
  let s = input.replace(/[\u00A0]/g, ' '); // nbsp → space early
  // Normalize CRLF/CR to LF
  s = s.replace(/\r\n?|\u2028|\u2029/g, '\n');

  if (trim) {
    // Aggressive collapse: remove spaces around newlines
    s = s.replace(/[ \t\f\v]+\n/g, '\n');
    s = s.replace(/\n[ \t\f\v]+/g, '\n');
  }

  // Limit newline runs
  const re = new RegExp(`\\n{${maxNewlines + 1},}`, 'g');
  s = s.replace(re, '\n'.repeat(maxNewlines));
  // Collapse remaining horizontal whitespace
  s = s.replace(/[ \t\f\v]{2,}/g, ' ');
  return s;
}

function hardWrap(input: string, width: number): string {
  const lines = input.split('\n');
  const wrapped: string[] = [];

  for (const line of lines) {
    // Don't wrap lines that contain preserved content
    if (line.includes(PRESERVE_OPEN)) {
      wrapped.push(line);
      continue;
    }

    if (line.length <= width) {
      wrapped.push(line);
      continue;
    }

    let start = 0;
    while (start < line.length) {
      const end = Math.min(start + width, line.length);
      wrapped.push(line.slice(start, end));
      start = end;
    }
  }

  return wrapped.join('\n');
}

function decodeEntities(s: string): string {
  // Numeric (decimal and hex)
  s = s.replace(/&#(\d+);/g, (_, d) => safeFromCodePoint(Number(d)));
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeFromCodePoint(Number.parseInt(h, 16)));
  // Common named entities
  s = s.replace(/&([a-zA-Z]+);/g, (_, name) => NAMED_ENTITIES[name] || `&${name};`);
  return s;
}

function safeFromCodePoint(cp: number): string {
  if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) {
    return '';
  }
  try {
    return String.fromCodePoint(cp);
  } catch {
    return '';
  }
}

function extractAttr(attrs: string, name: string): string | null {
  const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const m = attrs.match(re);
  if (!m) {
    return null;
  }
  const val = m[2] ?? m[3] ?? m[4] ?? '';
  return decodeEntities(val);
}

function indexOfSpace(s: string): number {
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if (c === 32 || c === 9 || c === 10 || c === 12 || c === 13) {
      return i;
    }
  }
  return -1;
}

// --- Classification sets ---

const BLOCK_TAG_SET = toSet([
  'p',
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'nav',
  'aside',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'blockquote',
  'figure',
  'figcaption',
  'hr',
]);

const SELF_CLOSING_TAG_SET = toSet([
  'br',
  'img',
  'hr',
  'meta',
  'link',
  'input',
  'source',
  'track',
  'wbr',
]);

// Markers for preserved regions in collapse pass
const PRESERVE_OPEN = '\u2418'; // symbol for record separator visualization (any rare char)
const PRESERVE_CLOSE = '\u2419';

const NAMED_ENTITIES: Record<string, string> = Object.freeze({
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',
  mdash: '\u2014',
  ndash: '\u2013',
  hellip: '\u2026',
  copy: '\u00A9',
  reg: '\u00AE',
  trade: '\u2122',
  laquo: '\u00AB',
  raquo: '\u00BB',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201C',
  rdquo: '\u201D',
  euro: '\u20AC',
  middot: '\u00B7',
  bull: '\u2022',
});
