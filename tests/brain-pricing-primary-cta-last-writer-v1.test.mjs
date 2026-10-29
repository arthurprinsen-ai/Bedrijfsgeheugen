import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const builder=fs.readFileSync('tools/site-shell/apply-commercial-pricing-v1.mjs','utf8');
const netlify=fs.readFileSync('netlify.toml','utf8');

test('final commercial pricing writer preserves the registered measurable Frisse Blik CTA',()=>{
  assert.match(builder,/s\.code==='frisse-blik'\?' data-bg-conversion="frisse-blik" data-bg-page-role="money" data-bg-funnel-stage="decide"'/);
  assert.match(builder,/https:\/\/www\.bedrijfsgeheugen\.nl\/frisse-blik/);
});

test('commercial pricing still runs after SEO order enrichment so last-writer protection remains required',()=>{
  const command=netlify.match(/command\s*=\s*"([^"]+)"/)?.[1]||'';
  assert.equal(command,'node tools/ci/netlify-build-entry.mjs');
  const entry=fs.readFileSync('tools/ci/netlify-build-entry.mjs','utf8');
  const seo=entry.indexOf("['seo-apply','tools/seo-order-engine/apply.mjs']");
  const pricing=entry.indexOf("['commercial-pricing','tools/site-shell/apply-commercial-pricing-v1.mjs']");
  assert.ok(seo>=0&&pricing>seo,'commercial pricing must remain explicitly guarded as the later writer');
});
