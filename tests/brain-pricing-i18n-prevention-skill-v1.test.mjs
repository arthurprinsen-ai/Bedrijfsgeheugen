import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const continuity = fs.readFileSync('.agents/skills/powerhouse-continuity/SKILL.md','utf8');
const delivery = fs.readFileSync('.agents/skills/powerhouse-delivery-concurrency/SKILL.md','utf8');
const i18n = fs.readFileSync('assets/js/i18n.js','utf8');
const redirects = fs.readFileSync('_redirects','utf8');
const proof = fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('public language switches use static localized routes', () => {
  assert.match(i18n,/if \(!isPortal\(\)\) \{[\s\S]*location\.assign\(localizedHref\(normalized\)\)/);
  assert.match(redirects,/\/en\/\*\s+\/en\/:splat\.html\s+200/);
  assert.match(redirects,/\/nl\/\*\s+\/nl\/:splat\.html\s+200/);
});

test('production behavior proof covers toggles and English switch', () => {
  for (const marker of [
    'data-bg-stage="loss"',
    'data-bg-price-tab="run"',
    'data-bg-billing="yearly"',
    'PRICING_I18N_PRODUCTION_BEHAVIOR_PROVEN',
    'Switching language failed',
    'Prijzen voor digitalisering in het mkb'
  ]) assert.ok(proof.includes(marker), 'missing production behavior proof marker: ' + marker);
});

test('continuity and delivery skills contain the interaction-proof prevention rule', () => {
  for (const source of [continuity, delivery]) {
    assert.match(source,/pricing-toggle-i18n-runtime-20260924-v1/);
    assert.match(source,/marker-presence/i);
    assert.match(source,/state-change/i);
    assert.match(source,/static localized/i);
    assert.match(source,/production browser/i);
  }
});
