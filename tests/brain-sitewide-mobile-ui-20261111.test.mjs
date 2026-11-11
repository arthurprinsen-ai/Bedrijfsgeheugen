import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('assets/sitewide-mobile-ui-20261111.css','utf8');
const js=fs.readFileSync('assets/sitewide-mobile-ui-20261111.js','utf8');
const builder=fs.readFileSync('tools/site-shell/apply-cms-runtime.mjs','utf8');
const assurance=fs.readFileSync('tools/site-shell/website-cross-browser-assurance.mjs','utf8');
const policy=JSON.parse(fs.readFileSync('config/powerhouse-website-cross-browser-assurance-v1.json','utf8'));

test('historical iPhone regression: one canonical public header/menu close owner and sticky fix',()=>{
  assert.match(css,/overflow-x:clip!important/);
  assert.match(css,/position:sticky!important;top:0!important/);
  assert.match(js,/data-bg-sitewide-close/);
  assert.match(js,/event.stopImmediatePropagation\(\)/);
  assert.match(assurance,/mobile menu remained expanded after close/);
  assert.match(assurance,/mobile header not sticky/);
});

test('historical iPhone regression: white-on-white CTA and native knowledge range cannot return',()=>{
  assert.match(css,/\.pgl \.pgl-actions a\.pgl-btn\.secondary/);
  assert.match(js,/fixUnreadableButtons/);
  assert.match(js,/frame.appendChild\(range\)/);
  assert.match(js,/range.min='0';range.max='100';range.step='1'/);
  assert.match(assurance,/knowledge slider end did not update/);
  assert.ok(policy.screenshot_matrix.routes.includes('/kennis/'));
});

test('one final public build, portal excluded and JavaScript valid',()=>{
  assert.match(builder,/'kennis'/);
  assert.match(builder,/publicPage=!/);
  assert.match(builder,/sitewide-mobile-ui-20261111.js/);
  assert.doesNotThrow(()=>new Function(js));
});
