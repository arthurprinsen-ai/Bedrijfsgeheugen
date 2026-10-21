import test from 'node:test';
import assert from 'node:assert/strict';
import { applyI18nFixture } from './helpers/i18n-runtime-fixture.mjs';

test('apply-i18n independently ensures CSS, runtime JS and mobile control', () => {
  const html = '<!doctype html><html><head><link rel="stylesheet" href="/assets/i18n.css" data-bg-i18n-asset></head><body><aside class="v18-mobile-drawer"></aside><main></main></body></html>';
  const { once, twice } = applyI18nFixture(html);
  assert.equal((once.match(/href="\/assets\/i18n\.css\?/g) || []).length, 1);
  assert.equal((once.match(/src="\/assets\/js\/i18n\.js\?/g) || []).length, 1);
  assert.equal((once.match(/data-bg-language-switcher="mobile"/g) || []).length, 1);
  assert.equal(twice, once, 'partial existing assets must not create duplicate elements');
});
