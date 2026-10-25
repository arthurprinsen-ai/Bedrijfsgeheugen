import test from 'node:test';
import assert from 'node:assert/strict';
import {planCurrentMainReconstruction} from '../tools/delivery/current-main-reconstruction.mjs';
const sha='a'.repeat(40);
const pr={number:4924,behind_by:2,sameRepository:true,optedIn:true,writerLeaseOwned:true,changedFiles:['a.mjs']};
test('authorized candidate produces advisory plan only',()=>{
 const [p]=planCurrentMainReconstruction({mainSha:sha,pulls:[pr]});
 assert.equal(p.action,'PROPOSE_RECONSTRUCTION');assert.equal(p.base,sha);
 assert.ok(p.required.includes('CodeQL'));assert.ok(p.required.includes('production provider readback'));
});
test('never mutate shared System Map, drafts or unauthorized PRs',()=>{
 const rows=[{...pr,number:4897,changedFiles:['platform/system-map/canonical-system-map.mjs']},{...pr,number:2,draft:true},{...pr,number:3,optedIn:false}];
 assert.deepEqual(planCurrentMainReconstruction({mainSha:sha,pulls:rows}).map(p=>p.action),['OWNER_HANDOFF','OWNER_HANDOFF','OWNER_HANDOFF']);
});
test('unverified comparison fails closed',()=>{
 assert.equal(planCurrentMainReconstruction({mainSha:sha,pulls:[{...pr,behind_by:null}]} )[0].action,'READ_ONLY');
 assert.throws(()=>planCurrentMainReconstruction({mainSha:'main',pulls:[]}),/MAIN_SHA_REQUIRED/);
});
