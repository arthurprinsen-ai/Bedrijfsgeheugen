import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('prijzen.html','utf8');
const workflow=fs.readFileSync('.github/workflows/lane-website.yml','utf8');

test('pricing lifecycle tabs remain directly visible on mobile',()=>{
  assert.match(html,/\.bg-lifecycle-tabs\{display:grid!important;visibility:visible!important;opacity:1!important;position:relative!important/);
  assert.match(html,/\.bg-lifecycle-tabs button\{display:block!important;visibility:visible!important;opacity:1!important;position:relative!important;pointer-events:auto!important/);
  for(const stage of ['grow','loss','crisis','buy','sell','portfolio']){
    assert.match(html,new RegExp('data-bg-stage="'+stage+'"'));
  }
});

test('computed visibility hardening protects lifecycle control geometry',()=>{
  assert.match(html,/\.bg-lifecycle-pricing\{display:block!important;visibility:visible!important;opacity:1!important;overflow:visible!important\}/);
  assert.match(html,/height:auto!important;max-height:none!important;clip:auto!important;clip-path:none!important;transform:none!important/);
  assert.match(html,/min-height:48px!important/);
});

test('pricing interaction proof is required on deploy preview when prijzen is affected',()=>{
  assert.ok(workflow.includes('Verify pricing interactions and English route on deploy preview'));
  assert.ok(workflow.includes("if: contains(needs.classify.outputs.routes, '/prijzen')"));
  assert.ok(workflow.includes('run: node tools/site-shell/verify-pricing-i18n-production.mjs'));
});
