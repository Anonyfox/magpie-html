# Cache Directory

Real-world HTML and feed files for integration testing.

## Structure

```
cache/
└── {domain}/
    ├── homepage.html                    # Main site homepage
    ├── feeds/
    │   ├── *.{rss|atom}.xml            # XML feed files
    │   └── *.json                      # JSON Feed files
    └── articles/
        └── *.html                      # Sample articles
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

### JSON Feed Examples

- **daringfireball.net** - Daring Fireball (John Gruber) - JSON Feed 1.1
- **inessential.com** - Inessential (Brent Simmons, JSON Feed co-creator) - JSON Feed 1.1
- **www.manton.org** - Manton Reece (Manton Reece, JSON Feed co-creator) - JSON Feed 1.1
- **shapeof.com** - Shape of Everything (Gus Mueller) - JSON Feed 1.1

## Usage

Files are used by integration tests to verify parsing logic against real production data.
