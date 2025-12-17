import { parse } from 'node-html-parser';
import { readFileSync } from 'fs';

console.log('=== Testing node-html-parser with our feeds ===\n');

// Test RSS 2.0 (RND)
console.log('1. RSS 2.0 (rnd.de):');
const rss = readFileSync('cache/rnd.de/feeds/wirtschaft-category.rss.xml', 'utf-8');
const rssDoc = parse(rss, { lowerCaseTagName: false });
const rssTitle = rssDoc.querySelector('channel > title')?.text;
const rssItems = rssDoc.querySelectorAll('item');
console.log(`   Title: ${rssTitle}`);
console.log(`   Items: ${rssItems.length}`);
console.log(`   First item title: ${rssItems[0]?.querySelector('title')?.text.substring(0, 50)}...`);
console.log(`   Performance: ${rssItems.length} items parsed\n`);

// Test Atom (Golem)
console.log('2. Atom 1.0 (golem.de):');
const atom = readFileSync('cache/golem.de/feeds/main.atom.xml', 'utf-8');
const atomDoc = parse(atom, { lowerCaseTagName: false });
const atomTitle = atomDoc.querySelector('feed > title')?.text;
const atomEntries = atomDoc.querySelectorAll('entry');
console.log(`   Title: ${atomTitle}`);
console.log(`   Entries: ${atomEntries.length}`);
console.log(`   First entry title: ${atomEntries[0]?.querySelector('title')?.text.substring(0, 50)}...`);
console.log(`   Has link rel: ${atomEntries[0]?.querySelector('link')?.getAttribute('href') ? 'yes' : 'no'}\n`);

// Test RSS with namespaces (FAZ)
console.log('3. RSS 2.0 with namespaces (faz.net):');
const fazRss = readFileSync('cache/faz.net/feeds/aktuell.rss.xml', 'utf-8');
const fazDoc = parse(fazRss, { lowerCaseTagName: false });
const fazItems = fazDoc.querySelectorAll('item');
const fazItem = fazItems[0];
console.log(`   Items: ${fazItems.length}`);
console.log(`   content:encoded exists: ${!!fazItem?.querySelector('content\\:encoded')}`);
console.log(`   dc:creator exists: ${!!fazItem?.querySelector('dc\\:creator')}`);
console.log(`   media:thumbnail exists: ${!!fazItem?.querySelector('media\\:thumbnail')}`);

// Check namespaced content
const contentEncoded = fazItem?.querySelector('content\\:encoded');
const dcCreator = fazItem?.querySelector('dc\\:creator');
console.log(`   content:encoded text length: ${contentEncoded?.text?.length || 0}`);
console.log(`   dc:creator text: ${dcCreator?.text || 'none'}\n`);

// Test edge cases
console.log('4. Edge cases:');
const description = rssItems[0]?.querySelector('description')?.text;
console.log(`   Description extracted: ${description?.substring(0, 60)}...`);
console.log(`   No CDATA artifacts: ${!description?.includes('CDATA')}\n`);

console.log('✓ node-html-parser looks good for our use case!');

