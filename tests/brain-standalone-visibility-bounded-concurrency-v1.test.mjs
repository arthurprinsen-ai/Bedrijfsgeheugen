import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/standalone-visibility-check.mjs','utf8');

test('full public visibility sweep keeps complete route and viewport coverage with bounded concurrency',()=>{
  assert.match(source,/UI_VR_ROUTE_CONCURRENCY \|\| 4/);
  assert.match(source,/Math\.min\(routeConcurrency, routes\.length\)/);
  assert.match(source,/Promise\.all\(Array\.from\(\{ length: workerCount \}/);
  assert.match(source,/routeIndex \+= workerCount/);
  assert.match(source,/assertBudget\(route, viewport\.name\)/);
  assert.match(source,/for \(const viewport of viewports\)/);
  assert.match(source,/routes\.length \* viewports\.length/);
});
