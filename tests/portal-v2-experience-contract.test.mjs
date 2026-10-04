import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('portal-v2/index.html','utf8');
const css=fs.readFileSync('portal-v2/experience.css','utf8');
const runtime=fs.readFileSync('portal-v2/experience.js','utf8');
const state=fs.readFileSync('portal-v2/portal-state.js','utf8');
const assurance=JSON.parse(fs.readFileSync('config/powerhouse-portal-visual-assurance-v1.json','utf8'));

test('Portal V2 loads one explicit experience contract after the base visual layers',()=>{
  assert.match(html,/href="\.\/experience\.css\?v=20261004-1"/);
  assert.match(html,/src="\.\/experience\.js\?v=20261004-1"/);
  assert.match(css,/--pv-content-max:1600px/);
  assert.match(runtime,/__BG_PORTAL_EXPERIENCE__/);
});

test('responsive contract prevents giant media and horizontal component overflow',()=>{
  assert.match(css,/#portalView img[\s\S]*max-width:100%/);
  assert.match(css,/#portalView canvas[\s\S]*max-width:100%!important/);
  assert.match(css,/\.chart-container[\s\S]*max-height:460px/);
  assert.match(css,/@media\(max-width:760px\)[\s\S]*max-height:340px/);
  assert.match(css,/table\{width:100%;max-width:100%/);
});

test('interaction contract keeps touch targets, focus visibility and reduced-motion support',()=>{
  assert.match(css,/--pv-touch:44px/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(runtime,/data-interactive/);
  assert.match(runtime,/ResizeObserver/);
  assert.match(runtime,/data-portal-visual-overflow/);
  assert.match(runtime,/bg:portal-experience-signal/);
  assert.match(css,/topactions \.searchrow>\.smallbtn[\s\S]*height:44px!important/);
});

test('portal state remains fail-closed and backend writes go through canonical APIs',()=>{
  assert.match(state,/const API_URL='\/api\/portal-state'/);
  assert.match(state,/if\(!user\)throw new Error\('AUTH_REQUIRED'\)/);
  assert.match(state,/savePortalBusinessInput\(buildPortalBusinessInput/);
  assert.match(state,/body\?\.stored===false/);
});


test('experience assurance covers critical customer flows at desktop tablet and two mobile widths',()=>{
  assert.equal(assurance.routes.length,6);
  assert.equal(assurance.viewports.length,4);
  assert.equal(assurance.routes.length*assurance.viewports.length,24);
  assert.equal(assurance.viewports.find(viewport=>viewport.id==='narrow-mobile').width,320);
  assert.equal(assurance.thresholds.critical_touch_target_px,44);
});
