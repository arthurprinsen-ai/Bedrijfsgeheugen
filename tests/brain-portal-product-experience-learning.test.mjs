import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('portal-v2/product-experience.css','utf8');
const runtime=fs.readFileSync('portal-v2/product-experience.js','utf8');
const contract=JSON.parse(fs.readFileSync('config/powerhouse-portal-product-experience-v1.json','utf8'));

test('historical portal UX regression is machine-enforced by the shared experience layer',()=>{
  assert.equal(contract.owner,'powerhouse-product-experience');
  assert.equal(contract.acceptance.horizontal_overflow_px_max,2);
  assert.equal(contract.acceptance.critical_navigation_touch_target_px_min,44);
  assert.equal(contract.acceptance.runtime_error_budget,0);
  assert.ok(contract.viewports.some(viewport=>viewport.width===320));
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/:focus-visible/);
  assert.match(runtime,/MutationObserver/);
  assert.match(runtime,/ResizeObserver/);
  assert.match(runtime,/visual_overflow/);
  assert.match(runtime,/runtime_error/);
  assert.match(runtime,/bg:portal-experience-signal/);
});
