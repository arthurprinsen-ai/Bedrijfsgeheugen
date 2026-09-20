import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('daily blog release carries canonical publication surfaces and avoids third-party render blockers', () => {
  const html=readFileSync('blog/excel-versiebeheer-mkb/index.html','utf8');
  const sitemap=readFileSync('sitemap.xml','utf8');
  const index=readFileSync('blog/index.html','utf8');
  const rss=readFileSync('blog/rss.xml','utf8');
  const url='https://www.bedrijfsgeheugen.nl/blog/excel-versiebeheer-mkb/';
  assert.match(html,/bg-zoekwoord/);
  assert.ok(sitemap.includes(url));
  assert.ok(index.includes('/blog/excel-versiebeheer-mkb/'));
  assert.ok(rss.includes('/blog/excel-versiebeheer-mkb/'));
  assert.doesNotMatch(html,/fonts\.googleapis\.com/);
  assert.doesNotMatch(html,/gc\.zgo\.at\/count\.js/);
});
