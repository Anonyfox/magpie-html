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

### Feed Parsing

```typescript
import { parseFeed } from "magpie-html";

// Auto-detect and parse any feed format (RSS, Atom, JSON Feed)
const feed = await fetch("https://example.com/feed.xml").then((r) => r.text());
const result = parseFeed(feed, "https://example.com/feed.xml");

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

### `parseFeed(content: string, baseUrl?: string | URL)`

Parse any feed format with auto-detection. Returns normalized `Feed` object and original data.

### `detectFormat(content: string)`

Detect feed format without parsing. Returns `'rss'`, `'atom'`, `'json-feed'`, or `'unknown'`.

### `extractText(html: string)`

Extract plain text from HTML. Removes tags, scripts, styles and normalizes whitespace.

### `extractContent(input: string | Document, options?: ContentExtractionOptions)`

Extract article content from HTML. Accepts either an HTML string or a pre-parsed Document for performance.

### `parseHTML(html: string)`

Parse HTML into a Document object (from `linkedom`). Use this to parse once and share the document between metadata and content extraction for optimal performance.

### Metadata Extractors

All metadata extractors accept a `Document` object (from `parseHTML`):

- `extractSEO(doc)` - SEO meta tags
- `extractOpenGraph(doc)` - OpenGraph metadata
- `extractTwitterCard(doc)` - Twitter Card metadata
- `extractCanonical(doc)` - Canonical URLs and alternates
- `extractSchemaOrg(doc)` - Schema.org / JSON-LD data
- ...and 15 more specialized extractors

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

**Slower Alternative:** Parsing multiple times:

```typescript
// ❌ Don't do this - parses HTML twice
const metadata = extractSEO(parseHTML(html));
const content = extractContent(html); // Parses again internally
```

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
