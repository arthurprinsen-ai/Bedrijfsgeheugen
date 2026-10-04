import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('portal-v2/experience.css','utf8');
const runtime=fs.readFileSync('portal-v2/experience.js','utf8');
const harness=fs.readFileSync('tools/portal-visual-density.mjs','utf8');
const assurance=JSON.parse(fs.readFileSync('config/powerhouse-portal-visual-assurance-v1.json','utf8'));

test('Portal V2 assurance v2 makes responsive UX a machine-enforced Powerhouse invariant',()=>{
  assert.equal(assurance.version,'POWERHOUSE-PORTAL-VISUAL-ASSURANCE-v2');
  assert.equal(assurance.routes.length,6);
  assert.equal(assurance.viewports.length,4);
  assert.equal(assurance.routes.length*assurance.viewports.length,24);
  assert.equal(assurance.viewports.find(viewport=>viewport.id==='narrow-mobile').width,320);
  assert.equal(assurance.thresholds.horizontal_overflow_px,2);
  assert.equal(assurance.thresholds.critical_touch_target_px,44);
  assert.match(css,/topactions \.searchrow>\.smallbtn[\s\S]*height:44px!important/);
  assert.match(runtime,/ResizeObserver/);
  assert.match(runtime,/bg:portal-experience-signal/);
  assert.match(runtime,/data-portal-visual-overflow/);
  assert.match(harness,/visual overflow markers present/);
  assert.match(harness,/critical touch targets below/);
  assert.match(harness,/experience runtime did not initialize as v2/);
});
