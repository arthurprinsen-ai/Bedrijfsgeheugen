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

test('original protected website browser lane exercises real menu close, sticky and touch slider rather than only source regex',()=>{
  const workflow=fs.readFileSync('.github/workflows/lane-website.yml','utf8');
  const browser=fs.readFileSync('tools/site-shell/sitewide-mobile-interaction-browser-check.mjs','utf8');
  assert.match(workflow,/node tools\/site-shell\/sitewide-mobile-interaction-browser-check\.mjs/);
  assert.match(workflow,/Retain original mobile interaction browser evidence/);
  assert.match(browser,/hasTouch:true,isMobile:true/);
  assert.match(browser,/await toggle\.click/);
  assert.match(browser,/await page\.keyboard\.press\('Escape'\)/);
  assert.match(browser,/sticky\.position==='sticky'/);
  assert.match(browser,/ratio\(fg,bg\)>=4\.5/);
  assert.match(browser,/await range\.press\('Home'\)/);
  assert.match(browser,/await range\.press\('End'\)/);
  assert.match(browser,/await range\.click/);
  assert.match(browser,/if\(failures\)process\.exitCode=1/);
});

test('iPhone screenshot regression checks viewport menu geometry and one close control',()=>{
  const browser=fs.readFileSync('tools/site-shell/sitewide-mobile-interaction-browser-check.mjs','utf8');
  assert.match(js,/syncMenuGeometry/);
  assert.match(js,/bg-site-mobile-menu-open/);
  assert.match(css,/\.bg-sitewide-menu-close\{display:none!important\}/);
  assert.match(browser,/sheet leaves side gaps/);
  assert.match(browser,/sheet does not meet fixed header/);
  assert.match(browser,/duplicate menu controls/);
  assert.match(browser,/floating WhatsApp obstructs menu/);
  assert.match(browser,/route:'\/product'/);
});

test('existing website UX agent and website skill inherit mobile screenshot recurrence and proof',()=> {
  const team=fs.readFileSync('platform/agents/agent-team.mjs','utf8');
  const skill=fs.readFileSync('skills/website-portal-coherence.md','utf8');
  assert.match(team,/verify-public-mobile-menu-viewport-geometry-and-single-toggle/);
  assert.match(team,/verify-sitewide-sticky-header-and-cta-touch-contrast/);
  assert.match(team,/confirm-real-mobile-browser-gate-and-exact-production-sha/);
  assert.match(skill,/website\|mobile\|navigation-coherence-geometry\|20261111-v2/);
  assert.match(skill,/v18MobileDrawer/);
  assert.match(skill,/same original owner/);
  assert.match(skill,/320 and 390px/);
});
