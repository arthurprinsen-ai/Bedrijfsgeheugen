import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalNetlifyBuild,phaseIndex} from './helpers/netlify-canonical-build-source.mjs';
test('final UI normalization runs before pricing and bedrijfslek integrity restore',()=>{
  const {phases}=canonicalNetlifyBuild();
  const normalizer=phaseIndex(phases,'site-ui','tools/normaliseer-site-ui.mjs');
  const pricing=phaseIndex(phases,'pricing-restore','tools/site-shell/pricing-build-integrity.mjs',['restore']);
  const bedrijfslek=phaseIndex(phases,'bedrijfslek-restore','tools/site-shell/bedrijfslek-build-integrity.mjs',['restore']);
  const i18n=phaseIndex(phases,'i18n-assets','tools/site-shell/apply-i18n.mjs');
  const localized=phaseIndex(phases,'localized-routes','tools/site-shell/build-localized-routes.mjs');
  assert.ok(normalizer<pricing,'normalizer must run before pricing restore');
  assert.ok(pricing<bedrijfslek,'pricing restore must precede bedrijfslek restore');
  assert.ok(bedrijfslek<i18n,'integrity restore must finish before i18n');
  assert.ok(i18n<localized,'i18n projection must precede localized routes');
});
