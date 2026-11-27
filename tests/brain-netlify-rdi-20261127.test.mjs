import test from 'node:test';
import assert from 'node:assert/strict';
import { readVerifiedPublishedSha, publishedProductionSha, releaseRecoveryScore, releaseDriftStatus, reconcileNetlifyLiveGap } from '../tools/delivery/netlify-live-gap-reconcile.mjs';
const a='a'.repeat(40), b='b'.repeat(40);
const deployId='c'.repeat(24);
const marker={contract:'BRAIN-DELIVERY-v2',context:'production',deploy_id:deployId,commit_ref:a};
test('only production with exact contract and deploy identity is accepted',()=>{
 assert.equal(publishedProductionSha(marker),a);
 for(const bad of [null,{...marker,contract:'other'},{...marker,context:'deploy-preview'},{...marker,deploy_id:'id'},{...marker,deploy_id:null},{...marker,commit_ref:'bad'}]) assert.equal(publishedProductionSha(bad),null);
});
test('canonical and immutable manifests must agree with bounded shared signal',async()=>{
 const calls=[];
 const got=await readVerifiedPublishedSha({fetchImpl:async(url,opts)=>{calls.push({url,opts});return {ok:true,status:200,url,json:async()=>marker};}});
 assert.equal(got,a);assert.equal(calls.length,3);
 assert.ok(calls[1].url.startsWith('https://'+deployId+'--bedrijfsgeheugen.netlify.app/'));
 assert.ok(calls.every(x=>x.opts.signal===calls[0].opts.signal&&x.opts.redirect==='error'&&x.opts.cache==='no-store'));
});
test('mismatched immutable identity, wrong contract, redirect or unavailable source require build',async()=>{
 for(const bad of [{...marker,commit_ref:b},{...marker,deploy_id:'d'.repeat(24)},{...marker,contract:'other'}]){
  assert.equal(await readVerifiedPublishedSha({fetchImpl:async(url)=>({ok:true,status:200,url,json:async()=>url.includes('--bedrijfsgeheugen')?bad:marker})}),null);
 }
 assert.equal(await readVerifiedPublishedSha({fetchImpl:async()=>({ok:false,status:503})}),null);
 assert.equal(await readVerifiedPublishedSha({fetchImpl:async()=>({ok:true,status:200,url:'https://wrong.example/release.json',json:async()=>marker})}),null);
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
