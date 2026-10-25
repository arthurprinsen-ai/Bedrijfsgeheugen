import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {recordMediaProofRejection} from '../supabase/functions/powerhouse-instagram-media-router/preflight-write.mjs';
import {eligibleSourceLedMediaReplacement} from '../supabase/functions/_shared/mira-frozen-winner-contract.mjs';
import {MIRA_MASTER_REFERENCE_ID,MIRA_MASTER_REFERENCE_URL} from '../supabase/functions/_shared/mira-canonical-face.mjs';

const date='2026-10-25',winner='0a56f150-2954-4355-a3d0-fc65396f8152';
const original='qAUQW2ZzqdasS0ePb1PD',rejected='a6sdR46HDe58uRlardNl';
const project='rUF5anXD47gVokckYjf9';
const scene='Mira kijkt in een rustige Nederlandse werkkamer naar haar telefoon met meerdere generieke parkeerapp-icoontjes op een scherm; haar gezicht blijft onveranderd.';
const resolved={kind:'approved_source_led',winner_recommendation_id:winner,scene,
 original_openart_history_id:original,openart_history_id:original,
 asset_url:'https://cdn.openart.ai/openart-ai/production/2026-10/create-video/rejected-original.mp4'};
const job={id:'canonical-job',updated_at:'2026-10-25T12:14:00Z',publication_date:date,status:'WAITING_PROOF',
 attempts:1,last_error:'MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED:confidence=0.890:openart='+rejected,
 asset_manifest:{source_led_auto_verify_started:true,openart_history_id:original,openart_project_id:project},
 proof_manifest:{}};
const manifest={recommendation_id:winner,daily_winner_recommendation_id:winner,scene,
 replacement_of_openart_history_id:original,openart_project_id:project,
 openart_reference_id:MIRA_MASTER_REFERENCE_ID,openart_reference_url:MIRA_MASTER_REFERENCE_URL,
 generation_mode:'image2video',openart_history_id:'newUnique20261025',
 asset_url:'https://cdn.openart.ai/openart-ai/production/2026-10/create-video/new.mp4'};

test('0.89 measured temporal rejection permits only a genuinely DIFFERENT source-matched candidate',()=>{
 assert.equal(eligibleSourceLedMediaReplacement({resolved,job,ob:{external_id:null},manifest}),true);
 assert.equal(eligibleSourceLedMediaReplacement({resolved,job,ob:{external_id:null},
  manifest:{...manifest,openart_history_id:rejected}}),false);
 assert.equal(eligibleSourceLedMediaReplacement({resolved,job,ob:{external_id:null},
  manifest:{...manifest,openart_project_id:'wrong'}}),false);
 assert.equal(eligibleSourceLedMediaReplacement({resolved,job,ob:{external_id:'instagram-existing-post'},manifest}),false);
 assert.equal(eligibleSourceLedMediaReplacement({resolved,job:{...job,last_error:'MIRA_AUTO_PROOF_TRANSPORT_FAILED'},ob:{},manifest}),false);
 assert.equal(eligibleSourceLedMediaReplacement({resolved,job:{...job,last_error:'MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED'},ob:{},manifest}),false);
});

function mockedDatabase(calls){
 class Chain{
  constructor(table){this.table=table;}
  update(value){calls.push({table:this.table,update:value});return this;}
  eq(){return this;}is(){return this;}select(){return this;}
  async maybeSingle(){return {data:{id:job.id},error:null};}
  then(resolve,reject){return Promise.resolve({error:null}).then(resolve,reject);}
 }
 return {from:t=>new Chain(t),rpc:async(name,args)=>{calls.push({rpc:name,args});return {error:null};}};
}
test('real temporal quality fail is persisted with immutable provider history, 0.900 minimum and Brain occurrence',async()=>{
 const calls=[],db=mockedDatabase(calls);
 const result=await recordMediaProofRejection(db,{job:{...job,last_error:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:start:face=0.920:openart='+original},
  ob:{status:'BLOCKED',updated_at:'2026-10-25T12:14:00Z',external_id:null},
  code:'MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED',position:'temporal',historyId:rejected,confidence:0.89});
 assert.equal(result.kind,'applied');
 assert.equal(result.last_error,'MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED:confidence=0.890:openart='+rejected);
 const write=calls.find(x=>x.table==='powerhouse_instagram_media_jobs_v1');
 assert.equal(write.update.last_error,result.last_error);
 assert.match(write.update.next_action,/different|andere/i);
 const brain=calls.find(x=>x.rpc==='brain_observe_failure');
 assert.equal(brain.args.p_evidence.openart_history_id,rejected);
 assert.equal(brain.args.p_evidence.temporal_confidence,0.89);
 assert.equal(brain.args.p_evidence.minimum_required_temporal_confidence,0.9);
 assert.equal(brain.args.p_evidence.outcome,'MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED');
 assert.match(brain.args.p_occurrence_id,/a6sdR46HDe58uRlardNl/);
});
test('missing score, wrong existing provider side effect or repeated exact history is fail-closed',async()=>{
 const calls=[],db=mockedDatabase(calls);
 for(const overrides of [
  {confidence:undefined},
  {confidence:NaN},
  {ob:{external_id:'already-created'}},
  {job:{...job,status:'LIVE_PROVEN'}}
 ]){
  const args={job,ob:{status:'BLOCKED',updated_at:job.updated_at,external_id:null},
    code:'MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED',historyId:rejected,confidence:0.89,...overrides};
  const verdict=await recordMediaProofRejection(db,args);
  assert.equal(verdict.kind,'ignored');
 }
 assert.equal(calls.length,0);
});
test('router records only genuine successful HTTP verifier verdict and preserves >=0.90 threshold',()=>{
 const router=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 const temporal=fs.readFileSync('supabase/functions/powerhouse-instagram-temporal-verifier/index.ts','utf8');
 assert.match(router,/temporalCheck.http===200&&temporalCheck.body\?\.ok===true/);
 assert.match(router,/code:'MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED'/);
 assert.match(router,/verdict\.verified===false/);
 assert.match(temporal,/Number\(v.confidence\)>=0\.9/);
 assert.match(router,/if\(!temporalCheck.body\?\.pass\)/);
});
