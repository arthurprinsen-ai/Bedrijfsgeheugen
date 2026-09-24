import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PUBLIC_PAGE_EXCLUDES, PUBLIC_UTILITY_ROUTES } from '../tools/site-shell/contracts.mjs';

test('login is a noindex public utility outside sitemap/indexable SEO scope', () => {
  assert.equal(PUBLIC_PAGE_EXCLUDES.has('inloggen.html'), true);
  assert.equal(PUBLIC_UTILITY_ROUTES.has('/inloggen'), true);
});

test('technical SEO accepts explicit utility destinations without treating them as indexable routes', async () => {
  const source = await readFile('tools/controleer-technische-seo.mjs','utf8');
  assert.match(source, /PUBLIC_UTILITY_ROUTES/);
  assert.match(source, /UTILITY_ROUTES\.has\(schoon\)/);
});
