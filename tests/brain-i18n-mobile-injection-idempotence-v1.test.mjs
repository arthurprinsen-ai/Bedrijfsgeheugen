import test from 'node:test';
import assert from 'node:assert/strict';
import { applyI18nFixture } from './helpers/i18n-runtime-fixture.mjs';

test('apply-i18n replaces stale mobile control with route-aware links when assets already exist', () => {
  const html = '<!doctype html><html lang="en"><head><link rel="stylesheet" href="/assets/i18n.css"><script src="/assets/js/i18n.js"></script></head><body><aside class="v18-mobile-drawer"><nav data-bg-language-switcher=\'mobile\'>STALE</nav></aside><main></main></body></html>';
  const { once, twice } = applyI18nFixture(html, 'en/prijzen.html');
  assert.doesNotMatch(once, /STALE/);
  assert.match(once, /href="\/prijzen"[^>]*hreflang="nl"/);
  assert.match(once, /href="\/en\/prijzen"[^>]*hreflang="en"[^>]*aria-current="page"/);
  assert.equal((once.match(/data-bg-language-switcher="mobile"/g) || []).length, 1);
  assert.equal(twice, once);
});

test('compact mobile host keeps route-aware switcher injection idempotent', () => {
  const html = '<!doctype html><html><head></head><body><header id="bgkopMob"><a class="bgkop-mcta" href="https://www.bedrijfsgeheugen.nl/frisse-blik">Scan</a></header><main></main></body></html>';
  const { once, twice } = applyI18nFixture(html, 'strategie.html');
  assert.match(once, /href="\/strategie"[^>]*hreflang="nl"/);
  assert.match(once, /href="\/en\/strategie"[^>]*hreflang="en"/);
  assert.match(once, /<\/nav><a class="bgkop-mcta"/);
  assert.equal((once.match(/data-bg-language-switcher="mobile"/g) || []).length, 1);
  assert.equal(twice, once);
});
