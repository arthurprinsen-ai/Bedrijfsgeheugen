import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('portal-v2/index.html','utf8');
const css=fs.readFileSync('portal-v2/product-experience.css','utf8');
const js=fs.readFileSync('portal-v2/product-experience.js','utf8');
const contract=JSON.parse(fs.readFileSync('config/powerhouse-portal-product-experience-v1.json','utf8'));

test('product experience layer is final authority in Portal V2',()=>{
  const cssLink='<link rel="stylesheet" href="./product-experience.css?v=20261004">';
  const jsLink='<script type="module" src="./product-experience.js?v=20261004"></script>';
  assert.ok(html.includes(cssLink));
  assert.ok(html.includes(jsLink));
  assert.ok(html.indexOf(cssLink)>html.indexOf('portal-polish.css'));
  assert.ok(html.indexOf(jsLink)>html.indexOf('portal-polish.js'));
});

test('responsive and interaction invariants are encoded',()=>{
  assert.match(css,/max-inline-size:100%/);
  assert.match(css,/@media\(max-width:430px\)[\s\S]*grid-template-columns:1fr!important/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/:focus-visible/);
  assert.match(js,/ResizeObserver/);
  assert.match(js,/MutationObserver/);
  assert.match(js,/visual_overflow/);
  assert.match(js,/runtime_error/);
  assert.match(js,/bg:portal-experience-signal/);
});

test('Powerhouse contract covers narrow mobile and critical end-to-end flows',()=>{
  assert.equal(contract.owner,'powerhouse-product-experience');
  assert.equal(contract.viewports.find(v=>v.id==='narrow-mobile').width,320);
  assert.ok(contract.critical_flows.length>=5);
  assert.equal(contract.acceptance.horizontal_overflow_px_max,2);
  assert.equal(contract.acceptance.runtime_error_budget,0);
  assert.deepEqual(contract.powerhouse_loop,['input','decision','action','readback','outcome','measurement','learning','guard']);
});
