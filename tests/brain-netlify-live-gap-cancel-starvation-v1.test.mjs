import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcileNetlifyLiveGap} from '../tools/delivery/netlify-live-gap-reconcile.mjs';
const shaA='a'.repeat(40),shaB='b'.repeat(40),shaC='c'.repeat(40);
const workflow=readFileSync(new URL('../.github/workflows/production-source-snapshot.yml',import.meta.url),'utf8');

test('last docs-only push cannot mask older unshipped portal or function changes',()=>{
 const result=reconcileNetlifyLiveGap({headSha:shaC,publishedSha:shaA,publishedIsAncestor:true,
   parentChangedPaths:['docs/changes/notes.md'],
   publishedChangedPaths:['portal-v2/foresight-scenario-studio.js','netlify/functions/portal-state.mjs','docs/changes/notes.md']});
 assert.equal(result.reason,'unpublished-ancestry-diff');
 assert.equal(result.forceDeployment,false);
 assert.ok(result.changedPaths.includes('portal-v2/foresight-scenario-studio.js'));
 assert.ok(result.changedPaths.includes('netlify/functions/portal-state.mjs'));
 assert.equal(result.changedPaths.length,3);
});
test('exact published SHA must not start a duplicate deploy',()=>{
 const result=reconcileNetlifyLiveGap({headSha:shaB,publishedSha:shaB,
   parentChangedPaths:['portal-v2/a.js']});
 assert.equal(result.publishedParity,true);
 assert.equal(result.forceDeployment,false);
 assert.deepEqual(result.changedPaths,[]);
});
test('no trustworthy provider SHA fails closed, even for governance-only changes',()=>{
 const cases=[null,'not-a-commit',shaA];
 for(const publishedSha of cases){
   const r=reconcileNetlifyLiveGap({headSha:shaB,publishedSha,
     publishedIsAncestor:false,parentChangedPaths:['docs/changes/note.md']});
   assert.equal(r.reason,'unverified-production-state');
   assert.equal(r.forceDeployment,true);
 }
});
test('no invalid head can silently mark a release up to date',()=>{
 assert.equal(reconcileNetlifyLiveGap({headSha:'unknown',publishedSha:shaA}).forceDeployment,true);
});
test('production workflow queues newest pending state but never interrupts deployed upload',()=>{
 assert.match(workflow,/group: production-source-snapshot-main-v3/);
 assert.match(workflow,/cancel-in-progress: false/);
 assert.match(workflow,/reconcileNetlifyLiveGap/);
 assert.match(workflow,/NETLIFY_LIVE_GAP_DECISION/);
 assert.match(workflow,/merge-base/);
 assert.match(workflow,/forceDeployment:forceDeployment\|\|gap.forceDeployment/);
 assert.match(workflow,/skipDeployment:manual&&!forceDeployment/);
});
