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

import {createHash} from 'node:crypto';
const bodyHash=body=>createHash('sha256').update(body).digest('hex');
const reviewFor=body=>({contract:'blog-reader-quality-review-v1',run_date:date,channel:'blog',expected_body_sha256:bodyHash(body),reason_codes:['UNCLEAR_READER_LANGUAGE','UNSUPPORTED_PRODUCT_ACTION'],notes:'Schrijf gewoon Nederlands en verwijder onbewezen producthandelingen.',sources:[{url:'https://www.wolterskluwer.com/nl-nl/solutions/twinfield-accounting/functies/afletteren',title:'Officiële Twinfield-functie',facts:'Afletteren koppelt een banktransactie aan een openstaande post.',observed_at:'2026-10-28T17:45:00Z'}]});
test('typed quality feedback is restricted to exact blog date, bounded reasons, real body identity and source data',()=>{
 assert.equal(typeof mod.normalizeBlogQualityReview,'function');
 assert.equal(mod.normalizeBlogQualityReview(undefined,date,'linkedin_company'),null);
 const review=reviewFor('copy');assert.deepEqual(mod.normalizeBlogQualityReview(review,date,'blog').reason_codes,review.reason_codes);
 for(const change of [r=>r.run_date='2026-10-27',r=>r.channel='linkedin_company',r=>r.expected_body_sha256='bad',r=>r.reason_codes=['FORCE_PUBLISH'],r=>r.reason_codes=[],r=>r.notes='',r=>r.sources[0].url='javascript:alert(1)',r=>r.sources[0].facts='']){const r=structuredClone(review);change(r);assert.throws(()=>mod.normalizeBlogQualityReview(r,date,'blog'),/BLOG_QUALITY_REVIEW_INVALID/);}
 assert.throws(()=>mod.normalizeBlogQualityReview(review,date,'linkedin_company'),/BLOG_QUALITY_REVIEW_INVALID/);
});
test('independent semantic rejection can repair an automatic-reader-ready article through the same locked owner',async()=>{
 const {state,db}=harness();const review=reviewFor(state.artifact.body);
 const repair=await mod.reopenRejectedBlog(db,date,()=>[],review);
 assert.equal(repair.reopened,true);assert.deepEqual(repair.violations,review.reason_codes);
 assert.equal(repair.claim.quality_review.expected_body_sha256,bodyHash(state.artifact.body));
 assert.equal(repair.pending.delivery_evidence.blog_quality_repair.quality_review.notes,review.notes);
});
test('stale-body quality feedback and any provider side effect cannot claim or reset a publication',async()=>{
 const h=harness();const review=reviewFor(h.state.artifact.body);h.state.artifact.body='new body from elsewhere';
 await assert.rejects(mod.reopenRejectedBlog(h.db,date,()=>[],review),/BLOG_QUALITY_REVIEW_ARTIFACT_CHANGED/);assert.equal(h.writes(),0);
 const j=harness();j.state.obligation.external_id='already-created';
 assert.equal((await mod.reopenRejectedBlog(j.db,date,()=>[],reviewFor(j.state.artifact.body))).reopened,false);assert.equal(j.writes(),0);
});
test('successful fresh-body persistence finishes its claim so immediate new quality review does not wait eight minutes',async()=>{
 const {state,db}=harness();const first=await mod.reopenRejectedBlog(db,date,()=>[],reviewFor(state.artifact.body));
 const original=state.artifact.body;
 await assert.rejects(mod.persistRepairedBlog(db,date,first.claim,{...state.artifact,body:original},{state:'content_ready',delivery_evidence:state.decision.delivery_evidence}),/BLOG_REPAIR_UNCHANGED_BODY/);
 await mod.persistRepairedBlog(db,date,first.claim,{...state.artifact,body:'new reviewed reader article',updated_at:new Date().toISOString()},{state:'content_ready',delivery_evidence:state.decision.delivery_evidence,updated_at:new Date().toISOString()});
 assert.ok(state.decision.delivery_evidence.blog_quality_repair.completed_at);
 const next=await mod.reopenRejectedBlog(db,date,()=>[],reviewFor(state.artifact.body));
 assert.equal(next.reopened,true);assert.notEqual(next.claim.token,first.claim.token);
 await assert.rejects(mod.persistBlogRepairFailure(db,date,first.claim,{retry_after:'2100-01-01'}),/OWNERSHIP_OR_DELIVERY_CHANGED/);
});
test('authenticated API validates quality feedback before writes and passes it as private model context',()=>{
 const source=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
 const validate=source.indexOf('normalizeBlogQualityReview(request.qualityReview,runDate,channelScope)');
 assert.ok(validate>source.indexOf("return json({ok:false,error:'UNAUTHORIZED'},401)"));assert.ok(validate<source.indexOf("stage='repair-rejected-blog'"));
 assert.match(source,/reopenRejectedBlog\(db,runDate,blogReaderReadyViolations,blogQualityReview\)/);
 assert.match(source,/editorial_quality_review:pending\.channel==='blog'\?pending\.delivery_evidence\?\.blog_quality_repair\?\.quality_review\|\|null:null/);
});
