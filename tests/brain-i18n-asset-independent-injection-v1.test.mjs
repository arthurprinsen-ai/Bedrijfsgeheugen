import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyI18nFixture } from './brain-i18n-runtime-fixture-helper.mjs';

test('apply-i18n injects runtime script independently from existing CSS', () => {
  const html = '<!doctype html><html><head><link rel="stylesheet" href="/assets/i18n.css"></head><body><aside class="v18-mobile-drawer"></aside><main></main></body></html>';
  const { once, twice } = applyI18nFixture(html);
  assert.match(once, /src="\/assets\/js\/i18n\.js\?/);
  assert.equal((once.match(/\/assets\/i18n\.css\?/g) || []).length, 1);
  assert.equal((once.match(/\/assets\/js\/i18n\.js\?/g) || []).length, 1);
  assert.equal(twice, once);
});

test('canonical pricing source acquires both i18n assets through the real build transformer', () => {
  const source = readFileSync('prijzen.html', 'utf8');
  const { once, twice } = applyI18nFixture(source, 'prijzen.html');
  assert.match(once, /href="\/assets\/i18n\.css\?/);
  assert.match(once, /src="\/assets\/js\/i18n\.js\?/);
  assert.equal((once.match(/\/assets\/i18n\.css\?/g) || []).length, 1);
  assert.equal((once.match(/\/assets\/js\/i18n\.js\?/g) || []).length, 1);
  assert.equal(twice, once);
});
