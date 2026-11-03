import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyMergedSuccessor,traceMergedSuccessor} from '../tools/delivery/janitor-incident-agent.mjs';

const repo='arthurprinsen-ai/Bedrijfsgeheugen';
// GitHub native run 41546047078 logged these exact nineteen unproven-history
// deferrals. Each chain was independently checked against provider PR metadata.
// Chains are ordered from the merged tip backward through Supersedes edges.
const cases=[
 {ob:'writer-shadow-explicit-dispatch-20261006-v1',
  chain:[3981,3970,3963,3958,3951],targets:[3963,3958,3951],retiredOpen:[3970]},
 {ob:'netlify-build-artifact-reuse-20261006-v1',
  chain:[3994,3985,3978],targets:[3978],retiredOpen:[3985]},
 {ob:'delivery-latency-hardening-20261006-v1',
  chain:[3980,3975,3971,3968,3962,3953],
  targets:[3962,3971,3968,3953],retiredOpen:[3975]},
 {ob:'ci-control-plane-convergence-20261006-v1',
  chain:[3947,3945,3942,3940,3938,3937,3934,3930,3928],
  targets:[3928,3934,3930,3938,3942,3940,3937],retiredOpen:[]},
 {ob:'same-lineage-main-refresh-20261006-v1',
  chain:[3974,3965,3959],targets:[3959],retiredOpen:[3965]},
 {ob:'recovery-supervisor-metadata-regex-20261006-v1',
  chain:[4007,4002,3995,3992],targets:[3995,3992],retiredOpen:[4002]},
 {ob:'main-push-fanout-budget-20260925-v1',
  chain:[3952,3949,3948],targets:[3948],retiredOpen:[3949]}
];
const snapshot=row=>{
 const items=new Map();
 row.chain.forEach((n,index)=>{
  const tip=index===0,open=row.retiredOpen.includes(n);
  items.set(n,{
   number:n,state:open?'open':'closed',merged:tip,
   merged_at:tip?'2026-10-06T17:00:00Z':null,
   title:open?'RETIRED — superseded by canonical successor':'Historical candidate',
   body:'Obligation-ID: '+row.ob+'\\nSupersedes: '+(row.chain[index+1]??'none')+
    '\\nWriter-Lease-State: TERMINAL_DELIVERY'
  });
 });
 return items;
};
const count=cases.reduce((n,x)=>n+x.targets.length,0);
test('original 19 deferred PRs map to exactly seven independently merged tips',()=>{
 assert.equal(count,19);
 assert.equal(new Set(cases.flatMap(x=>x.targets)).size,19);
 assert.equal(cases.length,7);
});
test('all 19 original history deferrals become positive transitive evidence without reopening',async()=>{
 for(const row of cases){
  const records=snapshot(row);
  for(const predecessor of row.targets){
   const proof=await verifyMergedSuccessor({
    repo,predecessor,obligation:row.ob,
    search:async()=>({items:[{number:row.chain[0]}],incomplete_results:false}),
    readPr:async(id)=>records.get(id)
   });
   assert.equal(proof.status,'PROVEN_MERGED_SUCCESSOR',row.ob+':#'+predecessor);
   assert.equal(proof.successor_number,row.chain[0]);
   assert.equal(proof.chain.at(-1),predecessor);
   assert.equal(proof.chain[0],row.chain[0]);
   assert.equal(proof.evidence,'GITHUB_SEARCH_POSITIVE_PLUS_TRANSITIVE_DIRECT_PR_READBACK');
   assert.equal(proof.safe_to_reopen,false);
   assert.equal(proof.proven,true);
  }
 }
});
test('direct historic #2225/#2353 successor remains supported without extra read',async()=>{
 const ob='seo-clean-url-bedrijf-overdraagbaar-maken-v1';
 const proof=await verifyMergedSuccessor({repo,predecessor:2225,obligation:ob,
  search:async()=>({items:[{number:2353}]}),
  readPr:async()=>({number:2353,state:'closed',merged:true,
   merged_at:'2026-09-19T12:09:26Z',body:'Obligation-ID: '+ob+'\\nSupersedes: 2225'})});
 assert.equal(proof.status,'PROVEN_MERGED_SUCCESSOR');
 assert.equal(proof.evidence,'GITHUB_SEARCH_POSITIVE_PLUS_DIRECT_MERGED_PR_READBACK');
 assert.deepEqual(proof.chain,[2353,2225]);
});
test('missing/misleading/unauthorized transitive links always defer, never reopen',async()=>{
 const row=cases[0],records=snapshot(row),base=records.get(3970);
 for(const bad of [
  {...base,body:'Obligation-ID: wrong\\nSupersedes: 3963'},
  {...base,title:'Not retired',state:'open'},
  {...base,body:'Obligation-ID: '+row.ob+'\\nSupersedes: 3964'},
  {...base,body:'Obligation-ID: '+row.ob+'\\nSupersedes: 3981'},
  {...base,body:'Obligation-ID: '+row.ob+'\\nSupersedes: none'},
  {...base,number:8888}
 ]){
  const v=await verifyMergedSuccessor({repo,predecessor:3951,obligation:row.ob,
   search:async()=>({items:[{number:3981}]}),
   readPr:async n=>n===3970?bad:records.get(n)});
  assert.equal(v.proven,false);
  assert.equal(v.safe_to_reopen,false);
 }
 const tip=records.get(3981);
 assert.equal(await traceMergedSuccessor({seed:{...tip,merged:false},
   predecessor:3951,obligation:row.ob,readPr:async n=>records.get(n)}),null);
 for(const search of [async()=>({items:[]}),async()=>{throw Error('403');}]){
  const v=await verifyMergedSuccessor({repo,predecessor:3951,obligation:row.ob,
   search,readPr:async n=>records.get(n)});
  assert.equal(v.safe_to_reopen,false);assert.equal(v.proven,false);
 }
});
test('native workflow preserves proof chain and forbids reopening deferred PRs',()=>{
 const workflow=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
 assert.match(workflow,/proof_chain=.*\\.chain/);
 assert.match(workflow,/chain:\\$chain,reopened:false/);
 assert.match(workflow,/TERMINAL_LEASE_REOPEN_DEFERRED_HISTORY_UNPROVEN/);
 assert.doesNotMatch(workflow,/gh api -X PATCH [^\\n]+-f state=open/);
});
