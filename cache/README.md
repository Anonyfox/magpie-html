# Cache Directory

Real-world HTML and feed files for integration testing.

## Structure

```
cache/
└── {domain}/
    ├── homepage.html          # Main site homepage
    ├── feeds/
    │   └── *.{rss|atom}.xml   # Feed files
    └── articles/
        └── *.html             # Sample articles
```

## Sources

### German News Sites

- **rnd.de** - Redaktionsnetzwerk Deutschland
- **faz.net** - Frankfurter Allgemeine Zeitung
- **sueddeutsche.de** - Süddeutsche Zeitung
- **n-tv.de** - n-tv Nachrichten
- **golem.de** - IT/Tech News
- **lto.de** - Legal Tribune Online

### International

- **techcrunch.com** - Tech News
- **goodnews.eu** - Positive News

### Developer Blogs

- **react.dev** - Official React Blog
- **blog.rust-lang.org** - Official Rust Blog

## Usage

Files are used by integration tests to verify parsing logic against real production data.
