import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  REQUIRED_VISIBILITY_VIEWPORTS,
  selectVisibilityViewports
} from '../tools/site-shell/visibility-viewport-sharding.mjs';

const workflow=readFileSync(new URL('../.github/workflows/lane-website.yml',import.meta.url),'utf8');
const sweeper=readFileSync(new URL('../tools/site-shell/standalone-visibility-check.mjs',import.meta.url),'utf8');
const required=readFileSync(new URL('../.github/workflows/required-test.yml',import.meta.url),'utf8');
const section=(start,end)=>workflow.split(start)[1]?.split(end)[0]??'';

test('full local visibility sweep preserves exact phone/tablet/desktop shape',()=>{
  assert.deepEqual(selectVisibilityViewports().map(x=>x.name),['phone','tablet','desktop']);
  assert.deepEqual(REQUIRED_VISIBILITY_VIEWPORTS.map(x=>[x.name,x.width,x.height]),[
    ['phone',390,844],['tablet',768,1024],['desktop',1440,900]
  ]);
  assert.equal(new Set(REQUIRED_VISIBILITY_VIEWPORTS.map(x=>x.name)).size,3);
});

test('every CI viewport shard selects exactly its own viewport, no silent omissions',()=>{
  for(const name of ['phone','tablet','desktop']){
    const result=selectVisibilityViewports(name);
    assert.equal(result.length,1);
    assert.equal(result[0].name,name);
  }
  assert.throws(()=>selectVisibilityViewports('invalid-device'),/VISIBILITY_VIEWPORT_SHARD_UNKNOWN/);
  assert.throws(()=>selectVisibilityViewports('mobile'),/VISIBILITY_VIEWPORT_SHARD_UNKNOWN/);
  assert.throws(()=>selectVisibilityViewports(null),/VISIBILITY_VIEWPORT_SHARD_INVALID_TYPE/);
});

test('matrix must run all three viewports, retain full source checkout and fail closed',()=>{
  const shard=section('  browser-visibility:\n','  browser:\n');
  assert.ok(shard,'missing browser-visibility job');
  assert.match(shard,/matrix:\s*\n\s*viewport:\s*\[phone, tablet, desktop\]/);
  assert.match(shard,/fail-fast:\s*false/);
  assert.match(shard,/max-parallel:\s*3/);
  assert.match(shard,/needs:\s*\[classify, syntax-preflight, preview-ready\]/);
  assert.match(shard,/if:\s*needs\.classify\.outputs\.requires_preview == 'true'/);
  assert.match(shard,/ref:\s*\$\{\{ inputs\.candidate_sha \}\}/);
  assert.match(shard,/UI_VR_VIEWPORT_SHARD:\s*\$\{\{ matrix\.viewport \}\}/);
  assert.match(shard,/Run exact local candidate|Build and serve exact local candidate/);
  assert.match(shard,/PLAYWRIGHT_PACKAGE=playwright@1\.61\.0/);
  assert.match(shard,/timeout --signal=TERM --kill-after=15s 9m node tools\/site-shell\/standalone-visibility-check\.mjs/);
  assert.doesNotMatch(shard,/continue-on-error:\s*true/);
});

test('existing browser contract remains required, other tests never disappear',()=>{
  const browser=workflow.split('  browser:\n')[1];
  assert.ok(browser,'original required browser job missing');
  for(const marker of [
    'Verify affected routes on desktop and mobile',
    'Verify checkout selection and server-confirmed completion rendering',
    'Verify high-risk full website regression contracts',
    'Verify every header menu panel is readable',
    'Verify broad high-risk browser contracts'
  ]) assert.ok(browser.includes(marker),marker);
  assert.equal(workflow.split('      - name: Verify all public pages are visibly rendered').length-1,1);
  assert.match(required,/uses:\s*\.\/\.github\/workflows\/lane-website\.yml/);
  assert.match(required,/needs\.website\.result/);
  assert.match(workflow,/browser-visibility:\s*[\s\S]*?browser:/);
});

test('source sweeps all routes without relaxing CLS and visibility safeguards',()=>{
  assert.match(sweeper,/selectVisibilityViewports\(process\.env\.UI_VR_VIEWPORT_SHARD \|\| ''\)/);
  assert.match(sweeper,/routes\.length\s*<\s*20/);
  for(const requiredRoute of ['/ai-act','/benchmark']) assert.ok(sweeper.includes(requiredRoute));
  assert.match(sweeper,/if \(state\.textLength < 120\)/);
  assert.match(sweeper,/if \(state\.cls > 0\.1\)/);
  assert.match(sweeper,/for \(let routeIndex = workerIndex; routeIndex < routes\.length; routeIndex \+= workerCount\)/);
  assert.match(sweeper,/if \(failures\.length\)/);
});
