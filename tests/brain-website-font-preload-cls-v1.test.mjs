import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/lettertype-terugval.mjs','utf8');
const contract=JSON.parse(fs.readFileSync('config/powerhouse-website-cross-browser-assurance-v1.json','utf8'));

test('website CLS repair preloads both critical Latin webfonts before swap',()=>{
  for(const marker of [
    'bg-critical-font-preloads',
    'fonts.gstatic.com/s/instrumentsans/',
    'fonts.gstatic.com/s/bricolagegrotesque/',
    'rel="preload"',
    'as="font"',
    'crossorigin="anonymous"'
  ]) assert.ok(source.includes(marker),marker);
  assert.match(source,/font-display:swap/);
});

test('website CLS repair keeps the canonical cross-browser threshold strict',()=>{
  assert.equal(contract.thresholds.max_cls,0.1);
  assert.equal(contract.evidence_generation,'2026-10-04-font-preload-cls-terminal-v1');
  assert.ok(contract.rules.includes('no_tolerance_widening_to_hide_structural_mismatch'));
});
