import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowPath='.github/workflows/portal-v2-live-preview.yml';
const functionalSpecPath='tests/integration/portal-v2-functional-parity.spec.js';
const legacySpecPath='tests/integration/portal-v2-legacy-algorithm-parity.spec.js';

async function text(path){return readFile(path,'utf8');}

test('Portal V2 live preview binds checkout and Netlify preview to the exact PR head SHA',async()=>{
  const workflow=await text(workflowPath);
  assert.match(workflow,/ref:\s*\$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(workflow,/HEAD_SHA:\s*\$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(workflow,/actual=\$\(git rev-parse HEAD\)/);
  assert.match(workflow,/test "\$actual" = "\$HEAD_SHA"/);
  assert.match(workflow,/commits\/\$\{HEAD_SHA\}\/status/);
  assert.match(workflow,/Timed out waiting for Netlify preview on exact head SHA/);
});

test('Portal V2 browser boot uses canonical runtime readiness instead of visible copy',async()=>{
  for(const path of [functionalSpecPath,legacySpecPath]){
    const spec=await text(path);
    assert.match(spec,/globalThis\.__BG_PORTAL_DOMAIN_STATE__/);
    assert.match(spec,/\[data-mobile-nav=\\"overview\\"\]/);
    assert.doesNotMatch(spec,/getByRole\(['"]heading['"].*Welkom terug, Arthur/);
  }
});

test('Portal V2 parity tests remain cache-busted and fail closed on HTTP errors',async()=>{
  const functional=await text(functionalSpecPath);
  const legacy=await text(legacySpecPath);
  for(const spec of [functional,legacy]){
    assert.match(spec,/Date\.now\(\)/);
    assert.match(spec,/response\.status\(\).*toBeLessThan\(400\)/s);
    assert.match(spec,/timeout:45000/);
  }
});
