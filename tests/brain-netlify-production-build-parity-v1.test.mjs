import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canonicalNetlifyBuild,phaseIndex} from './brain-netlify-canonical-build-source.mjs';
const workflow=fs.readFileSync('.github/workflows/lane-website.yml','utf8');
test('website lane executes canonical Netlify production build before local browser proof',()=>{
  const {phases}=canonicalNetlifyBuild();
  assert.match(workflow,/preview_mode == 'local-exact-candidate'/);
  assert.match(workflow,/node tools\/ci\/netlify-build-entry\.mjs/);
  assert.match(workflow,/STATIC_I18N_NETWORK: '0'/);
  assert.match(workflow,/STATIC_I18N_REQUIRE_CACHE: '1'/);
  const required=[
    ['pricing-capture','tools/site-shell/pricing-build-integrity.mjs',['capture']],
    ['homepage-pricing-cleanup','tools/prijzen-uit-de-homepage.mjs',[]],
    ['pricing-restore','tools/site-shell/pricing-build-integrity.mjs',['restore']],
    ['seo-apply','tools/seo-order-engine/apply.mjs',[]],
    ['i18n-assets','tools/site-shell/apply-i18n.mjs',[]],
    ['localized-routes','tools/site-shell/build-localized-routes.mjs',[]],
    ['commercial-pricing','tools/site-shell/apply-commercial-pricing-v1.mjs',[]],
    ['sitemap','tools/genereer-sitemap.mjs',[]],
    ['release-evidence','tools/bouw-release-evidence.mjs',[]],
  ];
  const indexes=required.map(([name,script,args])=>phaseIndex(phases,name,script,args));
  assert.deepEqual(indexes,[...indexes].sort((a,b)=>a-b),'build phase order drift');
});
