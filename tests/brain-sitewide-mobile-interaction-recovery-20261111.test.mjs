import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const learning=JSON.parse(read('brain/learning/2026-11-11-sitewide-mobile-interaction-recovery-v1.json'));
const builder=read('tools/site-shell/apply-cms-runtime.mjs');
const css=read('assets/sitewide-mobile-ui-20261111.css');
const runtime=read('assets/sitewide-mobile-ui-20261111.js');
const ledger=read('docs/development-ledger-events/2026-11-11-sitewide-mobile-interaction-recovery.md');
const assurance=read('tools/site-shell/website-cross-browser-assurance.mjs');
const assuranceContract=JSON.parse(read('config/powerhouse-website-cross-browser-assurance-v1.json'));

test('one original incident stays candidate until independent website browser evidence',()=>{
  assert.equal(learning.fingerprint,'website|mobile|header-menu-slider-interaction-and-cta-contrast|20261111-v1');
  assert.equal(learning.compiler.failure_class,'MOBILE_PUBLIC_SITE_CROSS_GENERATION_INTERACTION_AND_CONTRAST');
  assert.deepEqual(learning.evaluation.historical_replay,['tests/brain-sitewide-mobile-interaction-recovery-20261111.test.mjs']);
  assert.equal(learning.observed.public_production_verified,false);
  assert.match(ledger,/INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE/);
  assert.match(ledger,/niet LIVE/);
});

test('canonical build is the only writer to public mobile surface and excludes tenant portal',()=>{
  assert.match(builder,/sitewide-mobile-ui-20261111\.css/);
  assert.match(builder,/sitewide-mobile-ui-20261111\.js/);
  assert.match(builder,/id="bg-sitewide-mobile-ui-20261111"/);
  assert.match(builder,/\bpublicPage\b/);
  assert.match(builder,/portal-next\|portal-v2\|intern/);
  assert.match(builder,/'kennis'/);
});

test('responsive header, contrast, close-and-range semantics remain explicit',()=>{
  assert.match(css,/position:sticky!important/);
  assert.match(css,/overflow-x:clip!important/);
  assert.match(css,/\.pgl \.pgl-actions a\.pgl-btn\.secondary/);
  assert.match(css,/#compareFrame #compareRange/);
  assert.match(runtime,/data-bg-sitewide-close/);
  assert.match(runtime,/closeMenu\(open\)/);
  assert.match(runtime,/frame\.appendChild\(range\)/);
  assert.match(runtime,/range\.dispatchEvent\(new Event\('input'/);
  assert.doesNotThrow(()=>new Function(runtime));
});

test('original website assurance checks mobile close, sticky and /kennis slider keyboard bounds',()=>{
  const slider=assuranceContract.interactions.find(x=>x.id==='knowledge-compare-slider');
  assert.ok(slider);
  assert.equal(slider.assert,'knowledge_slider_native');
  assert.deepEqual(slider.routes,['/kennis/']);
  assert.ok(assuranceContract.screenshot_matrix.routes.includes('/kennis/'));
  assert.match(assurance,/mobile menu remained expanded after close/);
  assert.match(assurance,/mobile header not sticky/);
  assert.match(assurance,/knowledge slider end did not update/);
  assert.match(assurance,/knowledge slider start did not update/);
});
