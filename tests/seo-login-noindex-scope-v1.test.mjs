import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_PAGE_EXCLUDES } from '../tools/site-shell/contracts.mjs';

test('noindex login utility stays outside public SEO and sitemap scope', () => {
  assert.equal(PUBLIC_PAGE_EXCLUDES.has('inloggen.html'), true);
});
