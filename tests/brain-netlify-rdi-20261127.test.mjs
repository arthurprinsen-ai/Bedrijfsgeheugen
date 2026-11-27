import test from 'node:test';
import assert from 'node:assert/strict';
import { publishedProductionSha, releaseRecoveryScore, releaseDriftStatus, reconcileNetlifyLiveGap } from '../tools/delivery/netlify-live-gap-reconcile.mjs';
const a='a'.repeat(40), b='b'.repeat(40);
test('only production with exact identity is accepted',()=>{
 assert.equal(publishedProductionSha({context:'production',deploy_id:'id',commit_ref:a}),a);
 for(const marker of [null,{context:'deploy-preview',deploy_id:'id',commit_ref:a},{context:'production',commit_ref:a},{context:'production',deploy_id:'id',commit_ref:'bad'}]) assert.equal(publishedProductionSha(marker),null);
});
test('source-only lag is not runtime failure and exact SHA is not health',()=>{
 assert.equal(releaseDriftStatus({headSha:b,publishedSha:a,ancestor:true,requiresDeployment:false,ageMinutes:120}),'SOURCE_ONLY_DRIFT');
 assert.equal(releaseDriftStatus({headSha:a,publishedSha:a}),'SHA_MATCHED_NEEDS_READBACK');
});
test('runtime thresholds, invalid ancestry and unknown age',()=>{
 const d={headSha:b,publishedSha:a,ancestor:true,requiresDeployment:true};
 assert.equal(releaseDriftStatus({...d,ageMinutes:4}),'RUNTIME_DRIFT');
 assert.equal(releaseDriftStatus({...d,ageMinutes:5}),'WARN_RUNTIME_DRIFT');
 assert.equal(releaseDriftStatus({...d,ageMinutes:15}),'P0_RUNTIME_DRIFT');
 assert.equal(releaseDriftStatus({...d,ageMinutes:null}),'RUNTIME_DRIFT_AGE_UNKNOWN');
 assert.equal(releaseDriftStatus({...d,ancestor:false}),'UNKNOWN');
});
test('advisory score excludes unauthorized and invalid actions',()=>{
 const d={eligible:true,probability:.8,driftMinutesAvoided:30,value:2,recoveryMinutes:3,costMinutes:1};
 assert.equal(releaseRecoveryScore(d),12);
 for(const x of [{eligible:false},{probability:1.1},{recoveryMinutes:0},{costMinutes:-1},{value:Infinity}]) assert.equal(releaseRecoveryScore({...d,...x}),null);
});
test('previous runtime changes remain visible despite latest docs-only change',()=>{
 const r=reconcileNetlifyLiveGap({headSha:b,publishedSha:a,publishedIsAncestor:true,publishedChangedPaths:['netlify/functions/x.mjs'],parentChangedPaths:['docs/x.md']});
 assert.deepEqual(r.changedPaths,['netlify/functions/x.mjs','docs/x.md']);
});
