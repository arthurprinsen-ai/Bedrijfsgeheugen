import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const check=readFileSync('tools/site-shell/standalone-visibility-check.mjs','utf8');

test('all public routes and three viewports keep their existing fail-closed CLS gate',()=>{
  assert.match(check,/routesFromSitemap/);
  assert.match(check,/for \(let routeIndex = workerIndex; routeIndex < routes\.length; routeIndex \+= workerCount\)/);
  assert.match(check,/name: 'phone', width: 390, height: 844/);
  assert.match(check,/name: 'tablet', width: 768, height: 1024/);
  assert.match(check,/name: 'desktop', width: 1440, height: 900/);
  assert.match(check,/if \(state\.cls > 0\.1\) failures\.push/);
  assert.match(check,/CLS \$\{state\.cls\.toFixed\(3\)\} exceeds 0\.100/);
  assert.doesNotMatch(check,/allowCls|ignoreCls|skipLayoutShift|disableCls|CLS[_-]BYPASS/i);
});

test('source attribution is bounded, read-only and attached to actual CLS failures',()=>{
  assert.match(check,/new PerformanceObserver\(list =>/);
  assert.match(check,/!entry\.hadRecentInput/);
  assert.match(check,/Array\.from\(entry\.sources \|\| \[\]\)\.slice\(0, 3\)/);
  assert.match(check,/source\.previousRect/);
  assert.match(check,/source\.currentRect/);
  assert.match(check,/window\.__bgClsSources\.length > 12/);
  assert.match(check,/window\.__bgClsSources\.slice\(-8\)/);
  assert.match(check,/layout-shift sources=\$\{JSON\.stringify\(state\.clsSources \|\| \[\]\)\.slice\(0, 1800\)\}/);
  assert.match(check,/failures\.push\(/);
});
