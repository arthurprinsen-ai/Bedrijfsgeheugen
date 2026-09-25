import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSafeProductionSupersession, isNonProductionPath } from '../tools/site-shell/production-supersession.mjs';
import { evaluateProductionReadback } from '../tools/site-shell/verify-production-release.mjs';

const A='a'.repeat(40), B='b'.repeat(40);

test('safe non-production descendant supersession is accepted',()=>{
  const result=evaluateSafeProductionSupersession({
    expectedCommit:A, observedCommit:B, expectedIsAncestor:true,
    changedPaths:['docs/changes/x.md','.agents/skills/x/SKILL.md','tests/x.test.mjs','brain/learning/x.json']
  });
  assert.equal(result.ok,true);
  assert.equal(result.mode,'safe-descendant');
});

test('runtime-affecting descendant supersession remains fail closed',()=>{
  const result=evaluateSafeProductionSupersession({
    expectedCommit:A, observedCommit:B, expectedIsAncestor:true,
    changedPaths:['docs/changes/x.md','tools/site-shell/runtime.mjs']
  });
  assert.equal(result.ok,false);
  assert.deepEqual(result.unsafePaths,['tools/site-shell/runtime.mjs']);
});

test('non-descendant production SHA is rejected',()=>{
  assert.equal(evaluateSafeProductionSupersession({expectedCommit:A,observedCommit:B,expectedIsAncestor:false,changedPaths:[]}).ok,false);
});

test('production truth accepts proven safe descendant but not unproven mismatch',()=>{
  assert.equal(evaluateProductionReadback({mergeSha:A,deployedSha:B,deployStatus:'ready',deployId:'d1',routesOk:true,supersessionSafe:true}).status,'LIVE_VERIFIED');
  assert.equal(evaluateProductionReadback({mergeSha:A,deployedSha:B,deployStatus:'ready',deployId:'d1',routesOk:true,supersessionSafe:false}).status,'RELEASE_INCOMPLETE');
});

test('allowlist remains narrow',()=>{
  assert.equal(isNonProductionPath('docs/x.md'),true);
  assert.equal(isNonProductionPath('.github/workflows/x.yml'),true);
  assert.equal(isNonProductionPath('config/delivery-prevention-rules.json'),true);
  assert.equal(isNonProductionPath('site/index.html'),false);
  assert.equal(isNonProductionPath('tools/site-shell/x.mjs'),false);
});
