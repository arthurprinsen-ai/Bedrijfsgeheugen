import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as mod from '../supabase/functions/_shared/blog-quality-recovery.mjs';
const date='2026-10-28';
function harness(){
 const state={artifact:{run_date:date,channel:'blog',status:'content_ready',body:'rejected copy',updated_at:'2026-10-28T08:00:00Z',generation_evidence:{recommendation_id:'source-1'}},decision:{run_date:date,channel:'blog',state:'content_ready',decision:'publish',priority:75,rationale:'original',updated_at:'2026-10-28T08:00:00Z',delivery_ref:null,delivery_evidence:{}},obligation:{tenant_id:'canonical',publication_date:date,channel:'blog',status:'GENERATED',external_id:null,evidence:{}}};
 const keys={powerhouse_content_artifacts:'artifact',powerhouse_channel_decisions:'decision',content_publication_obligations:'obligation'};
 let queue=Promise.resolve(),writes=0;
 const locked={from(table){let payload=null,op='',filters=[];const q={select(){return q},eq(k,v){filters.push([k,v]);return q},update(v){payload=v;op='update';return q},upsert(v){payload=v;op='upsert';return q},async execute(){const row=state[keys[table]];if(filters.some(([k,v])=>(row[k]??null)!==v))return {data:null,error:null};if(payload){const next={...row,...structuredClone(payload)};if(table==='powerhouse_channel_decisions'&&row.state==='content_ready'&&next.state==='decided'&&next.decision==='publish'&&state.artifact.status==='content_ready'){next.state='content_ready';next.delivery_evidence={...next.delivery_evidence,state_regression_fingerprint:'content-ready-to-decided-regression-v1'};}Object.assign(row,next);writes++;}return {data:structuredClone(row),error:null}},maybeSingle(){return q.execute()},then(a,b){return q.execute().then(a,b)}};return q}};
 const db={withBlogQualityLock(d,work){assert.equal(d,date);const p=queue.then(()=>work(locked));queue=p.catch(()=>{});return p}};
 return {state,db,writes:()=>writes};
}
test('actual observed state-preservation trigger behavior does not strand a claimed quality repair',async()=>{
 const {state,db,writes}=harness();
 const repair=await mod.reopenRejectedBlog(db,date,()=>['EDITORIAL_PUBLICATION_INSTRUCTIONS']);
 assert.equal(repair.reopened,true);assert.equal(state.decision.state,'content_ready','the live regression guard stays effective');
 assert.equal(typeof mod.includeOwnedBlogRepair,'function','missing local owned-claim selection');
 const pending=mod.includeOwnedBlogRepair([],repair);
 assert.equal(pending.length,1);assert.equal(pending[0].channel,'blog');assert.equal(pending[0].delivery_evidence.blog_quality_repair.token,repair.claim.token);
 assert.equal(mod.canCommitBlogQualityRepair({runDate:date,...state,claim:repair.claim}).eligible,true);
 await mod.persistRepairedBlog(db,date,repair.claim,{...state.artifact,body:'useful new reader copy',updated_at:'2026-10-28T10:00:00Z'},{state:'content_ready',delivery_evidence:{...state.decision.delivery_evidence,blog_quality_repair_complete:true}});
 assert.equal(state.artifact.body,'useful new reader copy');assert.equal(state.decision.state,'content_ready');assert.equal(writes(),3);
});
test('a preserved content-ready claim remains exclusive until expiry, including invalid expiry fail-closed',async()=>{
 const {state,db,writes}=harness();
 const results=await Promise.all([mod.reopenRejectedBlog(db,date,()=>['BAD']),mod.reopenRejectedBlog(db,date,()=>['BAD'])]);
 assert.equal(results.filter(x=>x.reopened).length,1);assert.equal(writes(),1);
 state.decision.delivery_evidence.blog_quality_repair.claim_expires_at='invalid';
 assert.equal((await mod.reopenRejectedBlog(db,date,()=>['BAD'])).reopened,false);
 state.decision.delivery_evidence.blog_quality_repair.claim_expires_at='2000-01-01T00:00:00Z';
 assert.equal((await mod.reopenRejectedBlog(db,date,()=>['BAD'])).reopened,true);
});
test('local pending selection cannot adopt another owner and final provider changes remain denied',async()=>{
 assert.equal(typeof mod.includeOwnedBlogRepair,'function');
 const {state,db}=harness();const repair=await mod.reopenRejectedBlog(db,date,()=>['BAD']);
 const other={channel:'blog',delivery_evidence:{blog_quality_repair:{token:'another-owner'}}};
 const social={channel:'linkedin_company',delivery_evidence:{}};
 assert.deepEqual(mod.includeOwnedBlogRepair([other,social],{reopened:false}),[social]);
 assert.deepEqual(mod.includeOwnedBlogRepair([other,social],repair).map(x=>x.channel),['linkedin_company','blog']);
 for(const mutate of [x=>x.obligation.external_id='already-sent',x=>x.decision.state='published',x=>x.decision.delivery_evidence.blog_quality_repair.token='another-owner',x=>x.artifact.body='changed-by-another-owner']){const x=structuredClone(state);mutate(x);assert.equal(mod.canCommitBlogQualityRepair({runDate:date,...x,claim:repair.claim}).eligible,false);}
 const source=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
 assert.match(source,/includeOwnedBlogRepair\(pendingRowsSnapshot,blogRepair\)/);
});

test('preserved-state generation failure persists the real cooldown for its owner without rewriting content',async()=>{
 assert.equal(typeof mod.persistBlogRepairFailure,'function','missing same-owner failure persistence');
 const {state,db,writes}=harness();const repair=await mod.reopenRejectedBlog(db,date,()=>['BAD']);
 const failure={attempts:2,retry_after:new Date(Date.now()+2*3600000).toISOString(),reason:'billing'};
 await mod.persistBlogRepairFailure(db,date,repair.claim,failure);
 assert.equal(state.decision.state,'content_ready');assert.equal(state.artifact.body,'rejected copy');
 assert.equal(state.decision.delivery_evidence.generation_retry_after,failure.retry_after);
 assert.deepEqual(state.decision.delivery_evidence.artifact_generation_failure,failure);
 assert.equal(state.decision.delivery_evidence.state_regression_fingerprint,'content-ready-to-decided-regression-v1');
 state.decision.delivery_evidence.blog_quality_repair.claim_expires_at='2000-01-01T00:00:00Z';
 assert.equal((await mod.reopenRejectedBlog(db,date,()=>['BAD'])).reopened,false);
 assert.equal(writes(),2);
 state.decision.delivery_evidence.blog_quality_repair.token='another-owner';
 await assert.rejects(mod.persistBlogRepairFailure(db,date,repair.claim,failure),/OWNERSHIP_OR_DELIVERY_CHANGED/);
 assert.equal(writes(),2);
});
