import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canonicalNetlifyBuild,phaseIndex} from './helpers/netlify-canonical-build-source.mjs';
const builder=fs.readFileSync('tools/site-shell/apply-commercial-pricing-v1.mjs','utf8');
test('final commercial pricing writer preserves the registered measurable Frisse Blik CTA',()=>{
  assert.match(builder,/s\.code==='frisse-blik'\?' data-bg-conversion="frisse-blik" data-bg-page-role="money" data-bg-funnel-stage="decide"'/);
  assert.match(builder,/https:\/\/www\.bedrijfsgeheugen\.nl\/frisse-blik/);
});
test('commercial pricing still runs after SEO order enrichment so last-writer protection remains required',()=>{
  const {phases}=canonicalNetlifyBuild();
  const seo=phaseIndex(phases,'seo-apply','tools/seo-order-engine/apply.mjs');
  const pricing=phaseIndex(phases,'commercial-pricing','tools/site-shell/apply-commercial-pricing-v1.mjs');
  assert.ok(pricing>seo,'commercial pricing must remain the later canonical writer');
});
