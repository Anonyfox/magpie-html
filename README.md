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

### Basic Example

```typescript
import { helloWorld, extractText, getEnvironment } from "magpie-html";

// Simple greeting
console.log(helloWorld("Developer"));
// Output: Hello, Developer! Welcome to Magpie HTML 🦅

// Extract text from HTML
const html = "<div><h1>Title</h1><p>Content</p></div>";
const text = extractText(html);
console.log(text);
// Output: Title Content

// Check environment
console.log(getEnvironment());
// Output: 'node' or 'browser'
```

### In Browser

```html
<script type="module">
  import { extractText } from "https://unpkg.com/magpie-html";

  const html = document.body.innerHTML;
  const text = extractText(html);
  console.log(text);
</script>
```

## Feed Parsing

### Quick Start

```typescript
import { parseFeed } from 'magpie-html';

// Parse any feed format (RSS, Atom, JSON Feed)
const result = parseFeed(feedContent);
console.log(result.feed.title);
console.log(result.feed.items[0].title);
```

### URL Normalization

Automatically resolve relative URLs to absolute URLs:

```typescript
import { parseFeed } from 'magpie-html';

const feedWithRelativeUrls = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Blog</title>
    <link>/blog</link>
    <description>Blog</description>
    <item>
      <title>Post</title>
      <link>/blog/post-1</link>
    </item>
  </channel>
</rss>`;

// Without base URL - URLs remain relative
const result1 = parseFeed(feedWithRelativeUrls);
console.log(result1.feed.url); // "/blog"

// With base URL - URLs become absolute
const result2 = parseFeed(feedWithRelativeUrls, 'https://example.com/feed.xml');
console.log(result2.feed.url); // "https://example.com/blog"
console.log(result2.feed.items[0].url); // "https://example.com/blog/post-1"
```

### Supported Feed Formats

- **RSS 2.0** (including common extensions like Dublin Core, Content, Media RSS)
- **Atom 1.0**
- **JSON Feed 1.0 and 1.1**

All formats are automatically detected and normalized to a unified interface.

## API

### Feed Parsing

#### `parseFeed(content: string, baseUrl?: string | URL): ParseResult`

Parse any feed format with automatic format detection.

- **content**: Feed content as string (XML or JSON)
- **baseUrl** (optional): Base URL for resolving relative URLs
- Returns: `ParseResult` with normalized feed data and original format-specific data

#### `parseFeedNormalized(content: string, baseUrl?: string | URL): Feed`

Convenience wrapper that returns only the normalized feed data.

#### `detectFormat(content: string): FeedFormat`

Detect the format of a feed without parsing it.

- Returns: `'rss'`, `'atom'`, `'json-feed'`, or `'unknown'`

### Text Extraction

#### `extractText(html: string): string`

Extracts plain text content from an HTML string.

- **html**: The HTML string to parse
- Returns: The extracted text with normalized whitespace

### Environment Detection

#### `isBrowser(): boolean`

Checks if the code is running in a browser environment.

#### `getEnvironment(): 'browser' | 'node'`

Gets the current runtime environment.

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

## License

MIT

## Author

[Anonyfox](https://anonyfox.com)
