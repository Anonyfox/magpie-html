# Magpie HTML 🦅

Modern TypeScript library for scraping web content with isomorphic support. Works seamlessly in both Node.js and browser environments.

## Features

- 🎯 **Isomorphic** - Works in Node.js and browsers
- 📦 **Modern ESM/CJS** - Dual format support
- 🔒 **Type-safe** - Full TypeScript support
- 🧪 **Well-tested** - Built with Node.js native test runner
- 🚀 **Zero dependencies** - Lightweight and fast
- 🔄 **Multi-Format Feed Parser** - Parse RSS 2.0, Atom 1.0, and JSON Feed with automatic format detection
- 🔗 **Smart URL Resolution** - Automatic normalization of relative URLs to absolute URLs
- 🛡️ **Error Resilient** - Graceful handling of malformed data and edge cases

## Installation

```bash
npm install magpie-html
```

## Usage

### Fetching Content (Recommended)

Use `pluck()` instead of native `fetch()` - it's a drop-in replacement that handles real-world web chaos (redirects, encodings, timeouts) automatically.

```typescript
import { pluck, parseFeed } from "magpie-html";

// Fetch with pluck (handles redirects, encodings, etc.)
const response = await pluck("https://example.com/feed.xml");
const feedContent = await response.textUtf8(); // Always UTF-8

// Parse the feed
const result = parseFeed(feedContent, response.finalUrl);

console.log(result.feed.title);
console.log(result.feed.items[0].title);
console.log(response.redirectChain); // See redirect path
console.log(response.detectedEncoding); // e.g., 'windows-1252'
```

**Why `pluck()`?** Handles broken sites with wrong encodings, redirect chains, timeouts, and size limits - while maintaining fetch compatibility. Named `pluck()` (not `fetch()`) to avoid confusion, and because magpies pluck things. 🦅

### Feed Parsing

```typescript
import { parseFeed } from "magpie-html";

// If you already have the content (not fetching)
const result = parseFeed(feedContent, "https://example.com/feed.xml");

console.log(result.feed.title);
console.log(result.feed.items[0].title);
console.log(result.feed.items[0].url); // Absolute URLs
```

Supports RSS 2.0, Atom 1.0, and JSON Feed with automatic format detection and URL normalization.

### HTML Text Extraction

```typescript
import { extractText } from "magpie-html";

const html = "<div><h1>Title</h1><p>Content</p></div>";
const text = extractText(html); // "Title Content"
```

## API

### Fetching

#### `pluck(url: string | URL, options?: PluckInit): Promise<PluckResponse>`

Enhanced fetch for web scraping. Drop-in replacement for `fetch()` with automatic handling of redirects, encodings, timeouts, and size limits.

**Options:**

- `timeout` - Request timeout in ms (default: 30000)
- `maxRedirects` - Max redirects to follow (default: 10)
- `maxSize` - Max response size in bytes (default: 10MB)
- `userAgent` - Custom User-Agent string
- `throwOnHttpError` - Throw on 4xx/5xx (default: true)
- `strictContentType` - Validate Content-Type (default: false)

**Returns:** PluckResponse with extras:

- `finalUrl` - URL after redirects
- `redirectChain` - Array of redirect URLs
- `detectedEncoding` - Detected charset
- `timing` - Request timing info
- `textUtf8()` - Get UTF-8 decoded text

### Parsing

#### `parseFeed(content: string, baseUrl?: string | URL)`

Parse any feed format with auto-detection. Returns normalized `Feed` object and original data.

#### `detectFormat(content: string)`

Detect feed format without parsing. Returns `'rss'`, `'atom'`, `'json-feed'`, or `'unknown'`.

#### `extractText(html: string)`

Extract plain text from HTML. Removes tags, scripts, styles and normalizes whitespace.

### `extractContent(doc: Document, options?: ContentExtractionOptions)`

Extract article content from a pre-parsed Document. Use with `parseHTML()` for optimal performance.

### `parseHTML(html: string)`

Parse HTML into a Document object (from `linkedom`). Use this to parse once and share the document between metadata and content extraction for optimal performance.

### Metadata Extractors

All metadata extractors accept a `Document` object (from `parseHTML`):

- `extractSEO(doc)` - SEO meta tags
- `extractOpenGraph(doc)` - OpenGraph metadata
- `extractTwitterCard(doc)` - Twitter Card metadata
- `extractCanonical(doc)` - Canonical URLs and alternates
- `extractSchemaOrg(doc)` - Schema.org / JSON-LD data
- `extractAssets(doc, baseUrl)` - All linked assets (images, scripts, fonts, media, etc.)
- `extractLinks(doc, baseUrl, options)` - Navigational links with internal/external categorization
- ...and 15+ more specialized extractors

See TypeDoc documentation for complete API reference.

## Performance Tips

**Best Practice:** Parse HTML once and reuse the document:

```typescript
import { parseHTML } from "magpie-html/utils/html-parser";
import { extractSEO, extractContent } from "magpie-html";

const doc = parseHTML(html);
const metadata = extractSEO(doc); // Fast: <5ms
const content = extractContent(doc); // Fast: ~500ms
// Total: One parse + ~500ms
```

**Note:** All content and metadata extractors require a pre-parsed Document. Always use `parseHTML()` first.

## Development

### Setup

```bash
npm install
```

### Run Tests

```bash
npm test
```

The test suite includes both unit tests (`*.test.ts`) and integration tests that use real-world HTML and feed files from the `cache/` directory.

### Watch Mode

```bash
npm run test:watch
```

### Build

```bash
npm run build
```

### Linting & Formatting

The project uses [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format

# Run all checks (typecheck + lint)
npm run check
```

### Type Check

```bash
npm run typecheck
```

### Development Mode

```bash
npm run dev
```

## Integration Testing

The `cache/` directory contains real-world HTML and feed samples from various sources for integration testing. This enables testing against actual production data structures without network calls.

## Publishing

The package is configured for easy publishing to npm:

```bash
npm publish
```

The `prepublishOnly` script automatically builds the package before publishing.

## Documentation

Full API documentation is available at:

- **[https://anonyfox.github.io/magpie-html](https://anonyfox.github.io/magpie-html)** (once repo is published)

Or generate locally:

```bash
npm run docs
npm run docs:serve
```

## License

MIT

## Author

[Anonyfox](https://anonyfox.com)
