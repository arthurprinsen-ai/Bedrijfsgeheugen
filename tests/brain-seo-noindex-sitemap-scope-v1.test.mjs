import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const seo = fs.readFileSync('.github/scripts/seocontrole.py', 'utf8');

test('noindex CMS is explicitly excluded from sitemap authority', () => {
  assert.match(seo, /GEEN_SITEMAP\s*=\s*\{[^}]*['"]cms['"]/s);
  assert.match(seo, /if naam in GEEN_SITEMAP:\s*\n\s*continue/);
});

test('SEO validator still keeps generic noindex sitemap exclusion fail-closed', () => {
  assert.match(seo, /if ['"]noindex['"] in p\[['"]ruw['"]\]:\s*\n\s*continue/);
});
