# Feed Parser Implementation Plan

Comprehensive roadmap for building robust, fast feed parsers for RSS, Atom, and JSON Feed formats.

## Overall Architecture

```
src/feed/
├── rss/              # RSS 2.0 / 0.9x parser
├── atom/             # Atom 1.0 parser
├── json-feed/        # JSON Feed parser
└── index.ts          # (Later) Unified API
```

## Phase 0: RSS XML Parser (Prerequisite) ✅

**Why**: `node-html-parser` treats `<link>` as HTML void element, breaking RSS parsing.
We built a minimal, RSS-specific XML parser that handles RSS tags correctly.

### Core Files

- [x] `src/feed/rss/xml-parser.ts` - Minimal RSS XML parser ✅
  - Parse XML string to simple DOM-like structure
  - Handle RSS-specific tags (no HTML quirks)
  - Support CDATA sections
  - Support namespaces (content:, dc:, media:)
  - Fast and minimal (not a general XML parser)
  - Return simple element tree
  - Case-insensitive matching by default
  - Case-sensitive option available

- [x] `src/feed/rss/xml-parser.test.ts` - Comprehensive tests ✅
  - Parse basic elements
  - Parse nested elements
  - Parse attributes
  - Parse CDATA sections
  - Parse namespaced elements
  - Handle malformed XML gracefully
  - Tested with real feeds (RND.de)

### Design

**Element structure:**
```typescript
interface RSSElement {
  tagName: string;
  attributes: Record<string, string>;
  text: string;
  children: RSSElement[];
}
```

**Known RSS tags to handle:**
- Channel: title, link, description, language, copyright, managingEditor, etc.
- Item: title, link, description, author, category, enclosure, guid, pubDate
- Namespaces: content:encoded, dc:creator, media:thumbnail, media:content
- Special: CDATA sections

**Strategy:**
- Simple state machine parser
- Track opening/closing tags
- Extract text between tags
- Handle attributes from opening tags
- No regex for structure (only for attributes/CDATA)
- Fail gracefully on malformed input

## Phase 1: RSS 2.0 Parser ✅

### Core Files

- [x] `src/feed/rss/types.ts` - RSS-specific TypeScript types ✅
  - Channel type
  - Item type
  - Image, enclosure, category types
  - All optional fields properly typed
  - Namespace extension types

- [x] `src/feed/rss/clean-text.ts` - Text cleanup utilities ✅
  - Strip CDATA tags
  - Decode HTML entities
  - Normalize whitespace
  - Comprehensive cleanText function

- [x] `src/feed/rss/clean-text.test.ts` - 49 tests passing ✅

- [x] `src/feed/rss/parse-date.ts` - RFC 822 date parsing ✅
  - Handle various RFC 822 formats
  - Handle invalid dates gracefully
  - Return ISO 8601 strings

- [x] `src/feed/rss/parse-date.test.ts` - 23 tests passing ✅

- [x] `src/feed/rss/extract-channel.ts` - Extract channel metadata ✅
  - All required and optional fields
  - Image, cloud, skipHours, skipDays
  - Uses custom XML parser

- [x] `src/feed/rss/extract-channel.test.ts` - 16 tests passing ✅

- [x] `src/feed/rss/extract-item.ts` - Extract individual items ✅
  - title, link, description
  - author, category (multiple)
  - comments, enclosure, guid
  - pubDate, source
  - Handle items with only title OR description

- [x] `src/feed/rss/extract-namespaces.ts` - Handle common namespaces ✅
  - content:encoded (full content)
  - dc:creator, dc:date, dc:subject
  - media:content, media:thumbnail, media:description
  - atom:link (rel="alternate")
  - Handle missing namespace declarations

- [x] `src/feed/rss/parse.ts` - Main RSS parser orchestrator ✅
  - Detect RSS version (2.0, 0.92, 0.91)
  - Orchestrate extraction
  - Return normalized structure
  - Handle malformed XML gracefully

- [x] `src/feed/rss/index.ts` - Public API exports ✅

### Unit Tests (Colocated)

- [x] `extract-channel.test.ts` ✅
  - All required fields
  - Optional fields present/missing
  - Malformed channel data
  - Empty/whitespace values

- [x] `extract-item.test.ts` ✅
  - Item with all fields
  - Item with minimal fields
  - Item with only title
  - Item with only description
  - Multiple categories
  - Enclosures with attributes
  - GUID with isPermaLink

- [x] `extract-namespaces.test.ts` ✅
  - content:encoded extraction
  - Dublin Core fields
  - Media RSS fields
  - Missing namespace declarations
  - Mixed namespaces

- [ ] `parse.test.ts`
  - Valid RSS 2.0
  - RSS 0.92 backward compat
  - Malformed XML
  - Missing required fields
  - Empty feed
  - Large feed performance

### Integration Test

- [x] `rss.integration.test.ts` - Test against real cache files ✅
  - Parse rnd.de feed (German, standard RSS)
  - Parse faz.net feed (namespaces, media)
  - Parse sueddeutsche.de feed
  - Parse n-tv.de feed
  - Parse lto.de feed
  - Verify structure (not exhaustive content)
  - Spot-check one complete item from each

## Phase 2: Atom 1.0 Parser ⬜

### Core Files

- [ ] `src/feed/atom/types.ts` - Atom-specific TypeScript types
  - Feed type
  - Entry type
  - Person type (author/contributor)
  - Link type (with rel attribute)
  - Content type (text/html/xhtml)
  - All optional fields

- [ ] `src/feed/atom/extract-feed.ts` - Extract feed metadata
  - id, title, updated (required)
  - author(s), link(s)
  - category, contributor, generator
  - icon, logo, rights, subtitle

- [ ] `src/feed/atom/extract-entry.ts` - Extract individual entries
  - id, title, updated (required)
  - author(s), content, link(s)
  - summary, category, contributor
  - published, rights, source

- [ ] `src/feed/atom/extract-person.ts` - Extract author/contributor
  - name (required)
  - email, uri
  - Handle multiple persons

- [ ] `src/feed/atom/extract-link.ts` - Extract links
  - href (required)
  - rel (alternate, self, related, enclosure, via)
  - type, hreflang, title, length
  - Handle multiple links

- [ ] `src/feed/atom/extract-content.ts` - Extract content/summary
  - type attribute (text, html, xhtml)
  - Handle different content types
  - Preserve structure for xhtml
  - Extract text for text/html

- [ ] `src/feed/atom/parse-date.ts` - RFC 3339 date parsing
  - ISO 8601 / RFC 3339 format
  - Handle timezone offsets
  - Validate and convert

- [ ] `src/feed/atom/clean-text.ts` - Text cleanup for Atom
  - Handle different content types
  - Decode entities
  - Trim whitespace

- [ ] `src/feed/atom/parse.ts` - Main Atom parser
  - Validate Atom 1.0 structure
  - Orchestrate extraction
  - Return normalized structure
  - Handle malformed XML

- [ ] `src/feed/atom/index.ts` - Public API exports

### Unit Tests (Colocated)

- [ ] `extract-feed.test.ts`
- [ ] `extract-entry.test.ts`
- [ ] `extract-person.test.ts`
- [ ] `extract-link.test.ts`
- [ ] `extract-content.test.ts`
- [ ] `parse-date.test.ts`
- [ ] `clean-text.test.ts`
- [ ] `parse.test.ts`

### Integration Test

- [ ] `atom.integration.test.ts` - Test against real cache files
  - Parse golem.de feed
  - Parse blog.rust-lang.org/main feed
  - Parse blog.rust-lang.org/inside-rust feed
  - Verify structure
  - Spot-check entries

## Phase 3: JSON Feed Parser ⬜

### Core Files

- [ ] `src/feed/json-feed/types.ts` - JSON Feed types
  - Feed type
  - Item type
  - Author type
  - Attachment type

- [ ] `src/feed/json-feed/validate.ts` - Validate JSON Feed structure
  - Check version (1.0, 1.1)
  - Check required fields
  - Return validation errors

- [ ] `src/feed/json-feed/parse.ts` - Main JSON Feed parser
  - JSON.parse with error handling
  - Validate structure
  - Return normalized structure
  - Handle malformed JSON

- [ ] `src/feed/json-feed/index.ts` - Public API exports

### Unit Tests

- [ ] `validate.test.ts`
- [ ] `parse.test.ts`

### Integration Test

- [ ] `json-feed.integration.test.ts`
  - Test if we find any JSON feeds in the wild
  - Or create synthetic test

## Phase 4: Format Detection ⬜

- [ ] `src/feed/detect.ts` - Auto-detect feed format
  - Check for RSS root element
  - Check for Atom namespace
  - Check for JSON Feed structure
  - Return format type
  - Handle ambiguous cases

- [ ] `src/feed/detect.test.ts`
  - Test all formats
  - Test malformed content
  - Test edge cases

## Phase 5: Unified API (Later) ⬜

- [ ] `src/feed/types.ts` - Normalized output types
  - Common interface across all formats
  - Map format-specific fields

- [ ] `src/feed/index.ts` - Unified parser
  - Auto-detect and route to correct parser
  - Return normalized output
  - Handle all formats

## Known Quirks & Edge Cases

### RSS 2.0
- **CDATA sections**: Need to strip `<![CDATA[` and `]]>`
- **Namespaces**: content:encoded, dc:creator, media:* common
- **Dates**: RFC 822 format varies wildly
- **Description vs content:encoded**: Both may exist
- **GUID**: May or may not be a URL (isPermaLink attribute)

### Atom 1.0
- **Multiple links**: Need to handle rel="alternate" for main link
- **Content types**: text, html, xhtml have different handling
- **Dates**: RFC 3339 (more strict than RSS)
- **Multiple authors**: Entry and feed level
- **ID requirements**: Must be IRIs, often just URLs

### JSON Feed
- **Simplest format**: No XML parsing needed
- **Version field**: Check for v1.0 vs v1.1 differences
- **Content vs summary**: Similar to RSS description/content:encoded

### Common Issues
- **Malformed XML**: Missing closing tags, invalid characters
- **Character encoding**: UTF-8, ISO-8859-1, Windows-1252
- **HTML in content**: May need sanitization
- **Relative URLs**: May need to resolve against base URL
- **Empty feeds**: No items but valid feed
- **Huge feeds**: Memory constraints with thousands of items

## Testing Strategy

### Unit Tests
- Test each function in isolation
- Edge cases and error conditions
- Malformed input handling
- Performance for large inputs

### Integration Tests
- Use real cache files (10 sources)
- Test structure is correct
- Spot-check exact content for 1 item
- Don't check every field of every item

### Performance Benchmarks
- Parse speed for 100-item feed
- Memory usage for large feeds
- Comparison across formats

## Success Criteria

✅ **Per Format (RSS, Atom, JSON Feed)**
- All unit tests passing (100% coverage of core logic)
- Integration tests passing for all cache samples
- Handles malformed data gracefully
- Performance under 10ms for typical feed
- No runtime dependencies except node-html-parser

✅ **Overall**
- Clean, readable code
- Comprehensive TypeScript types
- Isomorphic (works in browser & Node.js)
- Well documented
- Easy to extend with new formats

## Notes

- **Library choice**: `node-html-parser` - Fast, lightweight, works in browser
- **CDATA handling**: Parser doesn't auto-strip, we need to handle manually
- **Namespace syntax**: Use backslash escape: `querySelector('content\\:encoded')`
- **Text extraction**: `.text` property strips tags but keeps CDATA markers
- **Date strategy**: Parse to Date, return as ISO string for consistency
- **Error strategy**: Return partial data when possible, never throw in parsers

## Progress Tracking

- [x] Phase 0: RSS XML Parser (2/2 files, 2/2 tests) ✅
- [x] Phase 1: RSS 2.0 Parser (9/9 files, 8/8 tests, 1/1 integration) ✅
- [ ] Phase 2: Atom 1.0 Parser (0/10 files, 0/8 tests, 0/1 integration) 🔄
- [ ] Phase 3: JSON Feed Parser (0/3 files, 0/2 tests, 0/1 integration)
- [ ] Phase 4: Format Detection (0/2 files)
- [ ] Phase 5: Unified API (0/2 files)

**Total**: 11/28 files (39%), 10/20 test suites (50%), 1/3 integration tests (33%)

**Current**: 183 tests passing across 37 test suites

