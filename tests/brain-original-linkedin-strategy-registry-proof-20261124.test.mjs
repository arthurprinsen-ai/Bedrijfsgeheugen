import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {verifiedEditorialRegistrySelection} from '../supabase/functions/_shared/linkedin-editorial-registry-proof.mjs';
const body='Een concreet brongebonden ondernemersprobleem.';
const hash=createHash('sha256').update(body).digest('hex');
const channel='linkedin_company',id='urn:li:share:7531042147656192000',date='2026-11-24';
function fixture(){
 const ev={provider_truth_verified:true,independent_final_review_verified:true,provider_post_id:id,author_urn:'urn:li:organization:123',final_text_hash:hash,reviewed_text_hash:hash,linkedin_readback:{id,author:'urn:li:organization:123',commentary:body,lifecycleState:'PUBLISHED'}};
 return {at:'2026-11-24T19:00:00Z',proof:{tenant_id:'canonical',channel,status:'LIVE_PROVEN',publication_date:date,external_id:id,published_at:'2026-11-24T17:12:00Z',live_proven_at:'2026-11-24T17:13:00Z',evidence:ev},post:{tenant_id:'bedrijfsgeheugen',channel_kind:channel,platform:'linkedin',external_post_id:id},artifact:{channel,run_date:date,status:'published',body,generation_evidence:{provider:'openai',final_copy_approved:true,original_editorial_strategy:{contract:'ORIGINAL_LINKEDIN_EDITORIAL_DECISION-v1',channel,runDate:date,state:'EDITORIAL_CANDIDATE',receipt_state:'DRAFT_CONTEXT_ONLY',existingExperimentOwner:'NO_NEW_EXPERIMENT',sourceId:'source',sourceRevision:'a'.repeat(64),draft_body_sha256:hash,selection:{pillar:'educatie',format:'tekstpost'},learningApplied:false,authorizesPublication:false}}}};
}
test('only exact reviewed provider body and original selection can populate pillar lineage',async()=>{
 const r=await verifiedEditorialRegistrySelection(fixture());
 assert.equal(r.content_pillar,'educatie');assert.equal(r.content_hash,hash);assert.equal(r.learningApplied,false);assert.equal(r.causalLiftProven,false);
});
test('historical, frozen, wrong author/tenant, altered, unreviewed and competing selections stay unknown',async()=>{
 const variants=[x=>delete x.artifact.generation_evidence.original_editorial_strategy,x=>x.artifact.generation_evidence.provider='approved-frozen-source',x=>x.proof.evidence.linkedin_readback.author='other',x=>x.post.tenant_id='canonical',x=>x.artifact.body+=' extra',x=>x.proof.evidence.independent_final_review_verified=false,x=>x.proof.evidence.reviewed_text_hash='b'.repeat(64),x=>x.artifact.generation_evidence.original_editorial_strategy.existingExperimentOwner='ORIGINAL_LINKEDIN_LOOP',x=>x.proof.status='PUBLISHED',x=>x.proof.evidence.linkedin_readback.id='other',x=>x.proof.live_proven_at='2026-11-25T00:00:00Z'];
 for(const mutate of variants){const x=fixture();mutate(x);assert.equal(await verifiedEditorialRegistrySelection(x),null);}
});
test('original metrics registry consumes both channel selections with null-only CAS, no outbound',()=>{
 const s=readFileSync(new URL('../supabase/functions/bg-social-metrics-sync/index.ts',import.meta.url),'utf8');
 assert.equal(s.split('await registerOriginalEditorialSelections(db,proofs||[],batch)').length-1,2);
 assert.ok(s.includes(".is('content_pillar',null)"));
 assert.ok(s.includes("update({content_pillar:selection.content_pillar})"));
 assert.ok(s.includes("existing.content_pillar!==null"));
});
