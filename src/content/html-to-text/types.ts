/**
 * HTML to text conversion types.
 *
 * @remarks
 * Types for converting HTML to plain text with the `htmlToText` function.
 *
 * @packageDocumentation
 */

/**
 * Options for HTML to plain text conversion.
 */
export interface HtmlToTextOptions {
  /**
   * How to treat the input HTML.
   *
   * @remarks
   * - `"fragment"`: Treat as HTML fragment (default)
   * - `"document"`: Treat as full document (ignores `<head>` content)
   *
   * @defaultValue `"fragment"`
   */
  mode?: 'fragment' | 'document';

  /**
   * How to render anchor (`<a>`) tags.
   *
   * @remarks
   * - `"text"`: Show only the link text (default)
   * - `"inline"`: Show text followed by URL in parentheses, e.g., "Click here (https://example.com)"
   * - `"remove"`: Remove links entirely
   *
   * @defaultValue `"text"`
   */
  links?: 'text' | 'inline' | 'remove';

  /**
   * How to render image (`<img>`) tags.
   *
   * @remarks
   * - `"alt"`: Show the alt text (default)
   * - `"remove"`: Remove images entirely
   *
   * @defaultValue `"alt"`
   */
  images?: 'alt' | 'remove';

  /**
   * Collapse consecutive whitespace outside preserved tags.
   *
   * @remarks
   * When `true`, multiple spaces, tabs, and line breaks are collapsed into single spaces.
   * Whitespace inside preserved tags (e.g., `<pre>`, `<code>`) is always kept intact.
   *
   * @defaultValue `true`
   */
  collapseWhitespace?: boolean;

  /**
   * Maximum consecutive newlines allowed after compaction.
   *
   * @remarks
   * Limits runs of newlines to this value. Set to `1` for single spacing,
   * `2` for double spacing (default), or higher values as needed.
   *
   * @defaultValue `2`
   */
  maxNewlines?: number;

  /**
   * Optional hard-wrap column width.
   *
   * @remarks
   * When set to a positive number, lines will be wrapped at this column width.
   * Does not wrap inside preserved tags like `<pre>` or `<code>`.
   * Set to `null` to disable wrapping (default).
   *
   * @defaultValue `null`
   */
  wrap?: number | null;

  /**
   * Separator between table cells.
   *
   * @remarks
   * - `"tab"`: Use tab character (default)
   * - `"space"`: Use space character
   *
   * @defaultValue `"tab"`
   */
  tableCellSeparator?: 'tab' | 'space';

  /**
   * HTML tags to exclude entirely along with their contents.
   *
   * @remarks
   * By default excludes: `script`, `style`, `noscript`, `template`, `svg`, `canvas`
   *
   * @defaultValue `["script", "style", "noscript", "template", "svg", "canvas"]`
   */
  excludeTags?: string[];

  /**
   * Decode HTML entities.
   *
   * @remarks
   * When `true`, decodes entities like `&amp;`, `&lt;`, `&#8212;`, etc.
   *
   * @defaultValue `true`
   */
  decodeEntities?: boolean;

  /**
   * Tags whose internal whitespace is preserved.
   *
   * @remarks
   * These tags will not have their whitespace collapsed, allowing proper
   * formatting of code blocks and preformatted text.
   *
   * @defaultValue `["pre", "code", "textarea"]`
   */
  preserveTags?: string[];

  /**
   * Trim leading and trailing whitespace from the result.
   *
   * @defaultValue `true`
   */
  trim?: boolean;
}
