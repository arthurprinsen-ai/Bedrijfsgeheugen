import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const impact=fs.readFileSync('portal-v2/csrd-impact.css','utf8');
const mobile=fs.readFileSync('portal-v2/csrd-mobile-saas.css','utf8');
const app=fs.readFileSync('portal-v2/app.css','utf8');

test('portal visuals have explicit density caps',()=>{
  assert.match(impact,/\.csrd-world\{[^}]*min-height:300px;max-height:340px/);
  assert.match(impact,/\.csrd-meter-ring\{width:108px/);
  assert.doesNotMatch(impact,/\.csrd-world\{[^}]*min-height:390px/);
  assert.match(mobile,/\.csrd-world\{min-height:300px;max-height:320px/);
  assert.doesNotMatch(mobile,/min-height:420px/);
  assert.match(app,/\.core\{height:245px/);
  assert.match(app,/\.brainimg\{position:absolute;top:8px;width:160px;height:90px/);
  assert.match(app,/@media\(max-width:760px\)[\s\S]*?\.core\{height:250px\}/);
  assert.doesNotMatch(app,/\.core\{height:310px/);
});

test('visual regression harness captures desktop tablet mobile',()=>{
  const harness=fs.readFileSync('tools/portal-visual-density.mjs','utf8');
  for(const marker of ['1440,height:900','1024,height:768','390,height:844','page.screenshot','horizontal overflow','CSRD visual','brain image']) assert.ok(harness.includes(marker),marker);
});

// Delivery metadata refresh: portal visual-density recovery candidate.
