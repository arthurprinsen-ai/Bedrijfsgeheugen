import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.env.BLOG_ARTICLES_DIR || 'blog';
const articles = readdirSync(DIR, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(join(DIR, entry.name, 'index.html')))
  .map(entry => ({ slug: entry.name, html: readFileSync(join(DIR, entry.name, 'index.html'), 'utf8') }));
// Visible text of a fragment: skip everything between '<' and '>'. A small state machine
// instead of a tag-stripping regular expression, which static analysis rightly distrusts.
const text = markup => {
  let out = '';
  let inTag = false;
  for (const char of markup) {
    if (char === '<') inTag = true;
    else if (char === '>') inTag = false;
    else if (!inTag) out += char;
  }
  return out;
};
const lines = value => value.split('\n').map(line => line.trim()).filter(Boolean);

test('the corpus is not empty', () => {
  assert.ok(articles.length >= 40, `only ${articles.length} articles found`);
});

test('no article carries markdown list lines inside a paragraph or heading', () => {
  const offenders = [];
  for (const { slug, html } of articles) {
    for (const [, tag, inner] of html.matchAll(/<(h2|h3|p)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g)) {
      if (/(^|\n)\s*-\s+\S/.test(text(inner))) offenders.push(`${slug} <${tag}>`);
    }
  }
  assert.deepEqual([...new Set(offenders)], []);
});

test('no heading spans several lines or a whole section', () => {
  const offenders = [];
  for (const { slug, html } of articles) {
    for (const [, tag, inner] of html.matchAll(/<(h2|h3)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g)) {
      const plain = text(inner);
      if (lines(plain).length > 1 || plain.length > 160) offenders.push(`${slug} <${tag}> ${plain.slice(0, 50)}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test('every JSON-LD block of every article is valid JSON', () => {
  const offenders = [];
  for (const { slug, html } of articles) {
    for (const [, body] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(body); } catch (error) { offenders.push(`${slug}: ${error.message.slice(0, 60)}`); }
    }
  }
  assert.deepEqual(offenders, []);
});
