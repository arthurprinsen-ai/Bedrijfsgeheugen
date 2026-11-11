import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const builder=fs.readFileSync('tools/site-shell/apply-cms-runtime.mjs','utf8');
const css=fs.readFileSync('assets/sitewide-mobile-ui-20261111.css','utf8');
const js=fs.readFileSync('assets/sitewide-mobile-ui-20261111.js','utf8');
const assurance=fs.readFileSync('tools/site-shell/website-cross-browser-assurance.mjs','utf8');
const config=JSON.parse(fs.readFileSync('config/powerhouse-website-cross-browser-assurance-v1.json','utf8'));

test('final canonical Netlify phase injects one public sitewide repair, including nested knowledge and English',()=>{
  assert.match(builder,/sitewide-mobile-ui-20261111\.css/);
  assert.match(builder,/sitewide-mobile-ui-20261111\.js\?v=20261111a/);
  assert.match(builder,/bg-sitewide-mobile-ui-20261111/);
  assert.match(builder,/data-bg-sitewide-mobile-ui=/);
  assert.match(builder,/'kennis'/);
  assert.match(builder,/'en'/);
  assert.match(builder,/publicPage=!\/\^\(\?:portal\|portal-next\|portal-v2\|intern\)/);
  assert.match(builder,/if\(!html\.includes\('id="bg-sitewide-mobile-ui-20261111"'\)\)/);
});

test('iPhone header remains sticky and menus have independent close controls',()=>{
  assert.match(css,/overflow-x:clip!important/);
  assert.match(css,/position:sticky!important;top:0!important;z-index:1500!important/);
  assert.match(css,/#bgMobileNav,#bgSharedMobileNav,#v18MobileDrawer/);
  assert.match(css,/\.bg-sitewide-menu-close/);
  assert.match(js,/data-bg-sitewide-close/);
  assert.match(js,/event\.stopImmediatePropagation\(\)/);
  assert.match(js,/document\.documentElement\.style\.overflow=''/);
  assert.match(js,/aria-expanded','false'/);
  assert.doesNotThrow(()=>new Function(js));
});

test('homepage white secondary CTA has visible high-contrast text',()=>{
  assert.match(css,/\.pgl \.pgl-actions a\.pgl-btn\.secondary/);
  assert.match(css,/background:#fff!important;color:#14171a!important/);
});

test('knowledge comparison uses one native full-surface input and complete 0–100 range',()=>{
  assert.match(js,/document\.getElementById\('compareFrame'\)/);
  assert.match(js,/document\.getElementById\('compareRange'\)/);
  assert.match(js,/frame\.appendChild\(range\)/);
  assert.match(js,/range\.min='0';range\.max='100';range\.step='1'/);
  assert.match(js,/frame\.setAttribute\('data-bg-compare-version','native-range-v13'\)/);
  assert.match(css,/#compareFrame #compareRange/);
  assert.match(css,/data-bg-knowledge-side="before"/);
  assert.match(css,/data-bg-knowledge-side="after"/);
});

test('daily website assurance fails when mobile close/sticky or knowledge endpoints regress',()=>{
  const knowledge=config.interactions.find(item=>item.id==='knowledge-compare-slider');
  assert.deepEqual(knowledge.routes,['/kennis/']);
  assert.equal(knowledge.assert,'knowledge_slider_native');
  assert.ok(config.screenshot_matrix.routes.includes('/kennis/'));
  assert.match(assurance,/mobile menu remained expanded after close/);
  assert.match(assurance,/mobile header not sticky/);
  assert.match(assurance,/knowledge slider end did not update/);
  assert.match(assurance,/knowledge slider start did not update/);
});
