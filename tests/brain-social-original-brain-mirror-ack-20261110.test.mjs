import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {verifiedSocialWindowAck} from '../supabase/functions/_shared/social-learning-window-ack.mjs';

const postId='6aaa57852bae7e96e951773d',tenantId='canonical';
const observed='2026-09-18T10:58:21.308Z';
const post={tenant_id:tenantId,post_id:postId,external_post_id:postId,published_at:'2026-09-16T08:47:02.523Z'};
const original={tenant_id:tenantId,obligation_id:'social-snapshot:'+postId+':48',post_id:postId,
 type:'MISSED_OBLIGATION',window_hours:48,status:'OPEN'};
const evaluation={tenant_id:tenantId,evaluation_id:'evaluation:'+postId+':48',post_id:postId,
 window_hours:48,observed_at:observed,metric_vector:{impressions:1963,reach:1450,likes:4,comments:0}};
const snapshot={tenant_id:tenantId,post_id:postId,source:'buffer',
 data_quality:'OBSERVED',source_event_id:'buffer:'+postId+':2026-09-18T10:58:21.308Z',
 observed_at:observed,metrics:{Impressions:1963,Reach:1450,likes:4,comments:0}};
test('an acknowledged original window requires exact provider source and original evaluation again before BRAIN closure',()=>{
 const proof=verifiedSocialWindowAck({obligation:original,post,evaluation,snapshots:[snapshot]});
 assert.equal(proof.status,'MEASUREMENT_VERIFIED');
 assert.equal(proof.source_event_id,snapshot.source_event_id);
 assert.equal(proof.evaluation_id,evaluation.evaluation_id);
 assert.equal(proof.no_causal_uplift_claim,true);
 assert.equal(proof.no_social_republish,true);
});
test('wrong source, fabricated effect or an unverified 48h window cannot settle the original BRAIN mirror',()=>{
 const verify=(s)=>verifiedSocialWindowAck({obligation:original,post,evaluation,snapshots:[s]});
 assert.equal(verify({...snapshot,source_event_id:'buffer:other:2026-09-18'}),null);
 assert.equal(verify({...snapshot,metrics:{...snapshot.metrics,Impressions:2000}}),null);
 assert.equal(verify({...snapshot,data_quality:'OBSERVED_PARTIAL_SCOPE'}),null);
 assert.equal(verify({...snapshot,observed_at:'2026-11-10T10:00:00Z'}),null);
});
test('same original store reconciles only independently acknowledged source mirror with exact ownership and optimistic version CAS',async()=>{
 const edge=await readFile(new URL('../supabase/functions/social-learning-store/index.ts',import.meta.url),'utf8');
 const originalHourly=await readFile(new URL('../netlify/functions/social-learning-evaluate.mjs',import.meta.url),'utf8');
 for(const phrase of [
  "status:'MEASUREMENT_VERIFIED'","original_obligation_id:o.obligation_id",
  "original_tenant_id:tenantId","original_post_id:o.post_id",
  "stage:'MEASUREMENT_WINDOW_ACK_VERIFIED'","exact_source_receipt:originalProof",
  "mirror.owner!=='POWERHOUSE_SOCIAL_LEARNING'",
  ".eq('version',mirror.version)","measurement_only:true,causal_lift_proven:false",
  "brain_receipts_acknowledged:brainAcked"
 ])assert.ok(edge.includes(phrase),phrase);
 assert.match(edge,/persisted\.source_event_id!==originalProof\.source_event_id/);
 assert.match(edge,/persisted\.evaluation_id!==originalProof\.evaluation_id/);
 assert.match(edge,/if\(\(mirrors\|\|\[\]\)\.length>1\)/);
 assert.match(originalHourly,/schedule:'@hourly'/);
 assert.doesNotMatch(edge,/cron\.schedule\(|SEND_EMAIL|POST_SOCIAL|PUBLISH_POST/);
});
