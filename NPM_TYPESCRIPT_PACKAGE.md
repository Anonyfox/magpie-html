# Modern TypeScript NPM Package - Complete Setup Guide

A comprehensive guide to building a production-ready, universal TypeScript package with modern tooling, testing, and documentation.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [TypeScript Configuration](#typescript-configuration)
3. [Build System](#build-system)
4. [Testing Strategy](#testing-strategy)
5. [Code Quality Tools](#code-quality-tools)
6. [Documentation](#documentation)
7. [Package Publishing](#package-publishing)
8. [Project Structure](#project-structure)
9. [Best Practices](#best-practices)

---

## Initial Setup

### 1. Initialize Package

```bash
npm init -y
```

### 2. Install Core Dependencies

```bash
# TypeScript and type definitions
npm install -D typescript @types/node

# Build tools
npm install -D tsup tsx

# Code quality
npm install -D @biomejs/biome

# Documentation
npm install -D typedoc typedoc-plugin-missing-exports
```

### 3. Configure Node.js Version

Create `.nvmrc`:

```
22
```

---

## TypeScript Configuration

### `tsconfig.json`

Modern, strict configuration for dual ESM/CJS builds:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "cache", "**/*.test.ts"]
}
```

**Key Decisions:**
- `ES2022` target for modern JavaScript features
- `moduleResolution: "bundler"` for optimal bundler compatibility
- Strict type checking enabled
- Test files excluded from build
- Cache directory excluded from type checking

---

## Build System

### tsup Configuration

`tsup.config.ts` - Fast, zero-config bundler:

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'es2022',
});
```

**Features:**
- Generates CommonJS and ESM simultaneously
- Automatic TypeScript declaration files
- Source maps for debugging
- Clean build directory on each build

### package.json Build Scripts

```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsx watch src/index.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

**Key Decisions:**
- `type: "module"` declares package as ESM-first
- Dual exports for maximum compatibility
- Separate type definitions for CJS/ESM
- `tsx` for rapid development iteration

---

## Testing Strategy

### Node.js Native Test Runner

No Jest, Vitest, or Mocha needed - use built-in Node.js testing:

```json
{
  "scripts": {
    "test": "node --import tsx --test **/*.test.ts"
  }
}
```

### Test Structure

**Colocated Unit Tests:**
```
src/
├── index.ts
├── index.test.ts          # Unit tests next to source
├── feed/
│   ├── parse.ts
│   ├── parse.test.ts
│   └── rss/
│       ├── extract-item.ts
│       └── extract-item.test.ts
```

**Integration Tests:**
```
src/
├── integration.test.ts
└── feed/
    ├── feed.integration.test.ts
    └── rss/
        └── rss.integration.test.ts
```

### Example Test File

```typescript
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

describe('myFunction', () => {
  it('should handle valid input', () => {
    const result = myFunction('valid');
    assert.equal(result, 'expected');
  });

  it('should handle edge cases', () => {
    assert.throws(() => myFunction(null), /Error/);
  });
});
```

**Benefits:**
- Zero dependencies for testing
- Fast execution
- Native TypeScript support via `tsx`
- Familiar API (similar to Mocha)

---

## Code Quality Tools

### Biome - All-in-One Tool

Replace ESLint + Prettier + Import Sorter with Biome:

```bash
npm install -D @biomejs/biome
```

### `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.9/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "includes": [
      "**/*.ts",
      "**/*.tsx",
      "**/*.js",
      "**/*.jsx",
      "**/*.json",
      "!**/node_modules/**",
      "!**/dist/**",
      "!**/cache/**",
      "!**/*.log",
      "!**/package-lock.json"
    ]
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExcessiveCognitiveComplexity": {
          "level": "warn",
          "options": { "maxAllowedComplexity": 20 }
        }
      },
      "style": {
        "noNonNullAssertion": "off",
        "useTemplate": "warn"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always",
      "arrowParentheses": "always"
    }
  }
}
```

### Scripts

```json
{
  "scripts": {
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
    "format": "biome format --write .",
    "check": "biome check --write ."
  }
}
```

**Benefits:**
- Single tool for linting, formatting, and organizing imports
- 25x faster than ESLint
- Zero configuration conflicts
- Respects `.gitignore` automatically

---

## Documentation

### TypeDoc Configuration

`typedoc.json`:

```json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs",
  "exclude": ["**/*.test.ts"],
  "excludeExternals": true,
  "excludePrivate": true,
  "excludeProtected": true,
  "hideGenerator": true,
  "theme": "default",
  "name": "Your Package Name",
  "readme": "README.md",
  "tsconfig": "tsconfig.json",
  "gitRemote": "origin",
  "githubPages": true,
  "plugin": ["typedoc-plugin-missing-exports"],
  "entryPointStrategy": "resolve",
  "categorizeByGroup": true,
  "navigation": {
    "includeCategories": true,
    "includeGroups": true
  },
  "searchInComments": true,
  "customCss": "./typedoc-custom.css",
  "customFooterHtml": "<footer class=\"tsd-page-footer\"><!-- Custom footer --></footer>"
}
```

### Custom Branding

`typedoc-custom.css`:

```css
:root {
  --color-primary: #e95420; /* Brand color */
  --color-primary-hover: #ba431a;
  --color-footer-bg: #000000;
  --color-footer-text: #ffffff;
}

a {
  color: var(--color-primary);
}

a:hover {
  color: var(--color-primary-hover);
}

.tsd-page-footer {
  background-color: var(--color-footer-bg);
  color: var(--color-footer-text);
  padding: 1.5rem 0;
  text-align: center;
}
```

### Scripts

```json
{
  "scripts": {
    "docs": "typedoc",
    "docs:serve": "npx serve docs"
  }
}
```

### TSDoc Comments

```typescript
/**
 * Parse a web feed from a string.
 *
 * @remarks
 * Automatically detects the format (RSS, Atom, or JSON Feed) and parses
 * accordingly. Returns a normalized structure for consistent handling.
 *
 * @param content - The feed content as a string
 * @param baseUrl - Optional base URL for resolving relative links
 * @returns Parsed and normalized feed data
 *
 * @throws {Error} If the format cannot be detected or parsing fails
 *
 * @example
 * ```typescript
 * const feed = parseFeed(xmlString, 'https://example.com');
 * console.log(feed.title);
 * ```
 */
export function parseFeed(content: string, baseUrl?: string): Feed {
  // ...
}
```

**Documentation Sections:**
- `@remarks` - Additional context and behavior notes
- `@param` - Parameter descriptions with types
- `@returns` - Return value description
- `@throws` - Error conditions
- `@example` - Usage examples with code blocks

---

## Package Publishing

### Files Configuration

Control what gets published to npm:

**`.npmignore`:**
```
# Development files
src/
cache/
docs/
.github/

# Config files
tsconfig.json
tsup.config.ts
biome.json
.biomeignore
typedoc.json
typedoc-custom.css

# Development artifacts
*.log
.nvmrc
```

**`package.json` - Files field:**
```json
{
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

### Publishing Metadata

```json
{
  "name": "@your-org/package-name",
  "version": "1.0.0",
  "description": "Brief description",
  "keywords": ["typescript", "parser", "isomorphic"],
  "author": {
    "name": "Your Name",
    "email": "you@example.com",
    "url": "https://yoursite.com"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourorg/repo"
  },
  "bugs": {
    "url": "https://github.com/yourorg/repo/issues"
  },
  "homepage": "https://github.com/yourorg/repo#readme",
  "engines": {
    "node": ">=18"
  }
}
```

### Pre-publish Checklist

```json
{
  "scripts": {
    "prepublishOnly": "npm run check && npm run typecheck && npm test && npm run build"
  }
}
```

---

## Project Structure

### Recommended Layout

```
my-package/
├── .github/
│   ├── workflows/
│   │   └── docs.yml.disabled    # CI/CD templates
│   └── SETUP_DOCS.md             # Deployment instructions
├── cache/                         # Test fixtures (tracked, ignored by tools)
│   ├── domain1.com/
│   │   ├── feeds/
│   │   │   └── main.rss.xml
│   │   ├── articles/
│   │   │   └── article-slug.html
│   │   └── homepage.html
│   └── README.md
├── docs/                          # Generated documentation (ignored by git)
├── dist/                          # Build output (ignored by git)
├── src/
│   ├── index.ts                   # Main export
│   ├── index.test.ts              # Colocated tests
│   ├── integration.test.ts        # Integration tests
│   ├── utils/                     # Shared utilities
│   │   ├── normalize-url.ts
│   │   └── normalize-url.test.ts
│   └── feature/                   # Feature modules
│       ├── index.ts               # Public API
│       ├── types.ts               # Type definitions
│       ├── parse.ts
│       ├── parse.test.ts
│       ├── feature.integration.test.ts
│       └── submodule/             # Deep nesting for complex features
│           ├── index.ts
│           ├── concept-a.ts
│           ├── concept-a.test.ts
│           ├── concept-b.ts
│           └── concept-b.test.ts
├── .gitattributes                 # Git metadata
├── .gitignore
├── .npmignore
├── .nvmrc                         # Node version
├── biome.json                     # Code quality config
├── LICENSE
├── package.json
├── README.md
├── tsconfig.json
├── tsup.config.ts
├── typedoc.json
└── typedoc-custom.css
```

### `.gitattributes`

Mark test fixtures as vendored to exclude from language stats:

```
cache/** linguist-vendored
```

### `.gitignore`

```
# Dependencies
node_modules/

# Build output
dist/

# Documentation
docs/

# Logs
*.log

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

---

## Best Practices

### 1. Module Design

**One Concept Per File:**
- Each file should have a single, clear responsibility
- Colocate tests next to source files
- Use `index.ts` to aggregate and expose public APIs

**Example:**
```
src/feed/rss/
├── index.ts              # Public API exports
├── types.ts              # Type definitions
├── parse.ts              # Main orchestrator
├── parse.test.ts
├── xml-parser.ts         # XML parsing logic
├── xml-parser.test.ts
├── extract-channel.ts    # Channel extraction
├── extract-channel.test.ts
├── extract-item.ts       # Item extraction
└── extract-item.test.ts
```

### 2. Universal/Isomorphic Code

**Check Environment:**
```typescript
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function getEnvironment(): 'browser' | 'node' {
  return isBrowser() ? 'browser' : 'node';
}
```

**Avoid Node.js-Specific APIs in Core Logic:**
- Don't use `fs`, `path`, `crypto`, etc. in code meant for browsers
- Use feature detection instead of environment detection when possible
- Document any environment-specific limitations

### 3. Error Handling

**Never Throw from Utility Functions:**
```typescript
/**
 * Normalize a URL to absolute format.
 *
 * @remarks
 * Never throws - returns original string if normalization fails.
 * Uses best-effort approach to fix common URL issues.
 */
export function normalizeUrl(url: string, baseUrl?: string): string {
  try {
    // Normalization logic
  } catch {
    return url; // Best-effort: return original on failure
  }
}
```

**Clear Error Messages:**
```typescript
if (!isValidFormat(content)) {
  throw new Error(
    `Unable to detect feed format. Expected RSS, Atom, or JSON Feed. ` +
    `Content starts with: ${content.substring(0, 100)}`
  );
}
```

### 4. Testing Philosophy

**Unit Tests - Comprehensive:**
- Test all edge cases
- Test error conditions
- Test boundary values
- Aim for 100% coverage of critical paths

**Integration Tests - Selective:**
- Use real-world data from `/cache`
- Verify data shape, not every field
- Spot-check content accuracy for 1-2 items
- Ensure cross-format consistency

**Example Integration Test:**
```typescript
it('should parse real RSS feed', async () => {
  const xml = await readFile('./cache/example.com/feeds/main.rss.xml', 'utf-8');
  const feed = parseRSS(xml);

  // Verify structure
  assert.ok(feed.channel);
  assert.ok(Array.isArray(feed.channel.items));
  assert.ok(feed.channel.items.length > 0);

  // Spot-check first item
  const first = feed.channel.items[0];
  assert.equal(first.title, 'Expected Title');
  assert.match(first.link, /^https?:\/\//);
});
```

### 5. TypeScript Practices

**Explicit Return Types:**
```typescript
export function parse(content: string): ParsedResult {
  // Explicit return type aids documentation and catches errors
}
```

**Prefer Interfaces for Objects:**
```typescript
export interface Feed {
  title: string;
  items: FeedItem[];
}
```

**Use Type Guards:**
```typescript
export function isRSS(content: string): boolean {
  return content.trim().includes('<rss');
}
```

### 6. Documentation Strategy

**Document Public APIs Thoroughly:**
- Every exported function needs TSDoc
- Include `@remarks` for behavior notes
- Provide `@example` with real code
- Document `@throws` conditions

**Don't Document Internals:**
- Internal functions can have brief comments
- Test files don't need TSDoc
- Let code be self-documenting where possible

**Lean README:**
- Brief introduction
- Installation instructions
- Quick start example
- Link to full API docs

### 7. Dependency Philosophy

**Zero Runtime Dependencies When Possible:**
- Reduces bundle size
- Eliminates supply chain risks
- Improves reliability
- Faster installs

**When to Add Dependencies:**
- Complex algorithms (e.g., date parsing libraries)
- Browser/Node compatibility shims
- Well-maintained, security-critical code

**Dev Dependencies Are Fine:**
- Build tools, linters, documentation generators
- These don't affect end users

### 8. Cache Directory for Real-World Testing

**Structure:**
```
cache/
├── domain1.com/
│   ├── feeds/
│   │   ├── main.rss.xml
│   │   └── category.atom.xml
│   ├── articles/
│   │   ├── article-slug-1.html
│   │   └── article-slug-2.html
│   └── homepage.html
└── README.md
```

**Purpose:**
- Real-world data for integration testing
- Captures edge cases from production
- Reproducible test environment
- No need for network calls in tests

**Maintenance:**
- Track in Git (not ignored)
- Mark as `linguist-vendored` in `.gitattributes`
- Exclude from TypeScript, Biome, and build tools
- Include `.npmignore` to exclude from published package

### 9. Incremental Development

**Phase-by-Phase Approach:**
1. Build one format/feature to 100% completeness
2. Write comprehensive unit tests
3. Add integration tests with real data
4. Document thoroughly
5. Only then move to next format/feature

**Don't:**
- Build partial implementations across multiple features
- Generalize before understanding individual cases
- Share code between formats until all formats are complete

### 10. Public API Design

**Keep Exports Lean:**
```typescript
// ❌ Don't export internal utilities
export { parseXML } from './xml-parser';

// ✅ Only export what users need
export { parseFeed } from './parse';
export type { Feed, FeedItem } from './types';
```

**Use Barrel Exports:**
```typescript
// src/feed/index.ts
export { parseFeed } from './parse';
export { detectFormat, isRSS, isAtom } from './detect';
export type * from './types';

// src/index.ts
export * from './feed';
```

---

## GitHub Pages Deployment (Optional)

### `.github/workflows/docs.yml`

```yaml
name: Deploy Docs

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run docs
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './docs'
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## Summary Checklist

When starting a new package, ensure you have:

- [ ] Modern `package.json` with dual ESM/CJS exports
- [ ] Strict `tsconfig.json` with appropriate exclusions
- [ ] `tsup` for fast, reliable builds
- [ ] `tsx` for development iteration
- [ ] Biome for code quality (replaces ESLint + Prettier)
- [ ] Node.js native test runner
- [ ] Colocated unit tests
- [ ] Integration tests with real data
- [ ] TypeDoc with custom branding
- [ ] Comprehensive TSDoc comments
- [ ] `.npmignore` and `files` field configured
- [ ] `.gitattributes` for vendored files
- [ ] Cache directory for test fixtures
- [ ] Proper `.gitignore` for build artifacts
- [ ] README with quick start and API docs link
- [ ] MIT LICENSE file
- [ ] `.nvmrc` for Node.js version
- [ ] One concept per file structure
- [ ] Public API carefully curated
- [ ] Zero runtime dependencies (if possible)
- [ ] Universal/isomorphic code design

---

**This setup provides a production-ready, maintainable, and professional TypeScript package that follows modern best practices and scales from small utilities to complex libraries.**

