import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const verifier=fs.readFileSync('tools/site-shell/verify-targeted-website-routes.mjs','utf8');
const workflow=fs.readFileSync('.github/workflows/production-release-readback.yml','utf8');

test('production route verifier parallelizes independent route viewport work with a bound',()=>{
  assert.match(verifier,/async function mapWithConcurrency\(/);
  assert.match(verifier,/ROUTE_VERIFY_CONCURRENCY \|\| 4/);
  assert.match(verifier,/uniqueRoutes\.flatMap\(route=>viewports\.map/);
  assert.match(verifier,/await mapWithConcurrency\(tasks,concurrency/);
  assert.match(verifier,/Math\.min\([^\n]*,8\)/);
});

test('production route proof keeps desktop and mobile evidence and has a workflow wall-clock cap',()=>{
  assert.match(verifier,/width:1440, height:1200/);
  assert.match(verifier,/width:390, height:844/);
  assert.match(workflow,/timeout --signal=TERM --kill-after=30s 8m node tools\/site-shell\/verify-targeted-website-routes\.mjs/);
});
