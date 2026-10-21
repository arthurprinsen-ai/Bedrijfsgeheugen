import test from 'node:test';
import assert from 'node:assert/strict';
import { applyI18nFixture } from './brain-i18n-runtime-fixture-helper.mjs';

test('existing i18n assets do not suppress mobile language injection', () => {
  const html = '<!doctype html><html><head><link rel="stylesheet" href="/assets/i18n.css" data-bg-i18n-asset><script src="/assets/js/i18n.js" defer data-bg-i18n-asset></script></head><body><aside class="v18-mobile-drawer"></aside><main></main></body></html>';
  const { once, twice } = applyI18nFixture(html);
  assert.equal((once.match(/\/assets\/i18n\.css\?/g) || []).length, 1);
  assert.equal((once.match(/\/assets\/js\/i18n\.js\?/g) || []).length, 1);
  assert.equal((once.match(/data-bg-language-switcher="mobile"/g) || []).length, 1);
  assert.equal(twice, once);
});
