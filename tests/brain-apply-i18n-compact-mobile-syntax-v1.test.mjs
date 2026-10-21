import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { applyI18nFixture } from './helpers/i18n-runtime-fixture.mjs';

test('apply-i18n parses and preserves compact mobile CTA while injecting language control', () => {
  execFileSync(process.execPath, ['--check', 'tools/site-shell/apply-i18n.mjs'], { stdio: 'pipe' });
  const html = '<!doctype html><html lang="nl"><head></head><body><header id="bgkopMob"><a class="bgkop-mcta" href="https://www.bedrijfsgeheugen.nl/frisse-blik">Frisse Blik</a></header><main></main></body></html>';
  const { once, twice } = applyI18nFixture(html);
  assert.match(once, /<nav class="bg-mobile-language"[^>]*data-bg-language-switcher="mobile"[^>]*>[\s\S]*?<\/nav><a class="bgkop-mcta"/);
  assert.match(once, /href="https:\/\/www\.bedrijfsgeheugen\.nl\/frisse-blik"/);
  assert.equal((once.match(/data-bg-language-switcher="mobile"/g) || []).length, 1);
  assert.equal(twice, once, 're-running the real transformer must be byte-idempotent');
});
