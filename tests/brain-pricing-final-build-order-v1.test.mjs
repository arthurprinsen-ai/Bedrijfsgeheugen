import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('final UI normalization runs before pricing and bedrijfslek integrity restore', () => {
  const source = fs.readFileSync('netlify.toml','utf8');
  const normalizer = source.indexOf('node tools/normaliseer-site-ui.mjs');
  const pricingRestore = source.indexOf('node tools/site-shell/pricing-build-integrity.mjs restore');
  const bedrijfslekRestore = source.indexOf('node tools/site-shell/bedrijfslek-build-integrity.mjs restore');
  const i18n = source.indexOf('node tools/site-shell/apply-i18n.mjs');
  const localized = source.indexOf('node tools/site-shell/build-localized-routes.mjs');

  for (const [name,index] of Object.entries({normalizer,pricingRestore,bedrijfslekRestore,i18n,localized})) {
    assert.ok(index >= 0, name + ' must remain in Netlify build command');
  }

  assert.ok(normalizer < pricingRestore, 'final normalizer must run before pricing restore');
  assert.ok(pricingRestore < bedrijfslekRestore, 'pricing restore must precede bedrijfslek restore');
  assert.ok(bedrijfslekRestore < i18n, 'feature integrity restore must finish before i18n projection');
  assert.ok(i18n < localized, 'i18n projection must precede localized route build');
});
