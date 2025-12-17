import { parseRSSXML, querySelector, querySelectorAll } from './src/feed/rss/xml-parser.js';
import { readFileSync } from 'fs';

console.log('Testing XML parser with real RSS feed...\n');

const rssContent = readFileSync('cache/rnd.de/feeds/wirtschaft-category.rss.xml', 'utf-8');

try {
  const root = parseRSSXML(rssContent);
  console.log('✓ Parsed RSS successfully');
  console.log(`Root tag: ${root.tagName}`);

  const channel = querySelector(root, 'channel');
  console.log(`\n✓ Found channel: ${channel ? 'yes' : 'no'}`);

  if (channel) {
    const title = querySelector(channel, 'title');
    const link = querySelector(channel, 'link');
    const description = querySelector(channel, 'description');

    console.log(`Title: ${title?.text}`);
    console.log(`Link: ${link?.text}`);
    console.log(`Description: ${description?.text?.substring(0, 50)}...`);

    const items = querySelectorAll(channel, 'item');
    console.log(`\n✓ Found ${items.length} items`);

    if (items.length > 0) {
      const firstItem = items[0];
      const itemTitle = querySelector(firstItem, 'title');
      const itemLink = querySelector(firstItem, 'link');
      console.log(`\nFirst item:`);
      console.log(`  Title: ${itemTitle?.text?.substring(0, 60)}...`);
      console.log(`  Link: ${itemLink?.text?.substring(0, 60)}...`);
    }
  }

  console.log('\n✓ XML Parser works great!');
} catch (error) {
  console.error('✗ Error:', error.message);
  console.error(error.stack);
}

