import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  resolveMiraFrozenWinner,
  eligibleSourceLedMediaReplacement,
  verifiedSourceLedMediaReplacement,
  miraResolvedCaption,
  miraResolvedEvidence,
  validateResolvedMiraCaptionForDelivery
} from '../supabase/functions/_shared/mira-frozen-winner-contract.mjs';
import {MIRA_MASTER_REFERENCE_ID,MIRA_MASTER_REFERENCE_URL} from '../supabase/functions/_shared/mira-canonical-face.mjs';

const date='2026-10-25';
const id='0a56f150-2954-4355-a3d0-fc65396f8152';
const hash='9d111ed60c5510e7fe41e8e9184c4055dd01363dd2ae78dc20c64845a1572665';
const url='https://www.nu.nl/auto/6227593/steeds-meer-betaalapps-voor-het-parkeren-dit-zijn-de-verschillen.html';
const original='qAUQW2ZzqdasS0ePb1PD';
const project='rUF5anXD47gVokckYjf9';
const alternative='a6sdR46HDe58uRlardNl';
const alternativeUrl='https://cdn.openart.ai/openart-ai/production/2026-10/create-video/WZvuT1BzGx566fWaFo8F/sample_0_1792924343592_8a4152b3.mp4';

const winner={run_date:date,recommendation_id:id};
const lineage={run_date:date,winner_recommendation_id:id,state:'WINNER_FROZEN',
  source_evidence:{source_hash:hash,source_url:url}};
const recommendation={recommendation_id:id,status:'accepted',evidence:{
  source_backed:true,source_url:url,
  source_title:'Steeds meer betaalapps voor het parkeren: dit zijn de ...',
  forced_business_bridge_forbidden:true
}};
const read=(job)=>resolveMiraFrozenWinner(date,{winner,lineage,recommendation,job});
const originalResolved=read();
assert.equal(originalResolved.ok,true);
assert.equal(originalResolved.openart_history_id,original);

const failedJob={status:'WAITING_PROOF',attempts:1,
  last_error:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:start:face=0.920:openart='+original,
  republish_forbidden:false,asset_manifest:{
    source_led_auto_verify_started:true,source_led_auto_verify_contract:'mira-frozen-approved-existing-asset-only-v1',
    openart_history_id:original,openart_project_id:project,
    daily_winner_recommendation_id:id,recommendation_id:id,
    scene:originalResolved.scene,asset_url:originalResolved.asset_url,
    openart_reference_id:MIRA_MASTER_REFERENCE_ID,openart_reference_url:MIRA_MASTER_REFERENCE_URL,
    generation_mode:'image2video'
  },proof_manifest:{}};
const candidate={...failedJob.asset_manifest,
  openart_history_id:alternative,asset_url:alternativeUrl,
  replacement_of_openart_history_id:original};

test('measured 0.920 mismatch unlocks a different same-source video for verifier ONLY',()=>{
  assert.equal(eligibleSourceLedMediaReplacement({
    resolved:originalResolved,job:failedJob,
    ob:{status:'BLOCKED',external_id:null},manifest:candidate
  }),true);
  assert.equal(read(failedJob).openart_history_id,original);
  assert.equal(read(failedJob).replacement_media_verified,false);
});

test('replacement admission fails closed on every dangerous spoof or duplicate',()=>{
  const check=(job=failedJob,manifest=candidate,ob={external_id:null})=>
    Boolean(eligibleSourceLedMediaReplacement({resolved:originalResolved,job,ob,manifest}));
  assert.equal(check({...failedJob,last_error:''}),false);
  assert.equal(check({...failedJob,status:'PROOF_VERIFIED'}),false);
  assert.equal(check({...failedJob,proof_manifest:{exact_final_media_proven:true}}),false);
  assert.equal(check({...failedJob,republish_forbidden:true}),false);
  assert.equal(check(failedJob,candidate,{external_id:'existing-provider-post'}),false);
  assert.equal(check(failedJob,{...candidate,openart_history_id:original}),false);
  assert.equal(check(failedJob,{...candidate,replacement_of_openart_history_id:'other'}),false);
  assert.equal(check(failedJob,{...candidate,openart_project_id:'different'}),false);
  assert.equal(check(failedJob,{...candidate,recommendation_id:'other'}),false);
  assert.equal(check(failedJob,{...candidate,scene:'different'}),false);
  assert.equal(check(failedJob,{...candidate,openart_reference_id:'fabricated'}),false);
  assert.equal(check(failedJob,{...candidate,generation_mode:'text2video'}),false);
  assert.equal(check(failedJob,{...candidate,asset_url:'https://untrusted.example/1.mp4'}),false);
});
const referenceSha='a'.repeat(64);
const frame=(position)=>({position,face_identity_match:true,
  canonical_reference_id:MIRA_MASTER_REFERENCE_ID,
  face_identity_confidence:0.961,master_reference_sha256:referenceSha});
const vision={canonical_reference_id:MIRA_MASTER_REFERENCE_ID,
  canonical_reference_url:MIRA_MASTER_REFERENCE_URL,face_identity_match:true,
  face_identity_confidence:0.961,master_reference_sha256:referenceSha,
  identity_comparison_method:'two_image_vision',
  frame_evidence:[frame('start'),frame('middle'),frame('end')]};
const verifiedProof={exact_final_media_proven:true,mira_source_led:true,
  mira_source_hash:hash,mira_winner_recommendation_id:id,
  mira_entrepreneur_scene:originalResolved.scene,
  media_provider:'openart',media_type:'reel',
  media_url:alternativeUrl,final_media_sha256:'b'.repeat(64),
  mira_generation_source:{openart_history_id:alternative,
    openart_reference_id:MIRA_MASTER_REFERENCE_ID,openart_reference_url:MIRA_MASTER_REFERENCE_URL},
  temporal_proof:{verified:true},instagram_visual:vision};
const successJob={...failedJob,status:'PROOF_VERIFIED',last_error:null,asset_manifest:candidate,proof_manifest:verifiedProof};
test('fully verified replacement preserves immutable frozen winner, source, text and canonical Mira face',()=>{
  const result=read(successJob);
  assert.equal(result.ok,true);
  assert.equal(result.openart_history_id,alternative);
  assert.equal(result.asset_url,alternativeUrl);
  assert.equal(result.original_openart_history_id,original);
  assert.equal(result.replacement_media_verified,true);
  assert.equal(result.source_hash,originalResolved.source_hash);
  assert.equal(result.winner_recommendation_id,id);
  assert.equal(result.caption,originalResolved.caption);
  const art={...miraResolvedEvidence(result),instagram_media_proof:verifiedProof};
  assert.equal(validateResolvedMiraCaptionForDelivery(date,miraResolvedCaption(result),art).ok,true);
  assert.equal(validateResolvedMiraCaptionForDelivery(date,miraResolvedCaption(result),
    {...art,instagram_media_proof:{...verifiedProof,temporal_proof:{verified:false}}}).ok,false);
  assert.equal(validateResolvedMiraCaptionForDelivery(date,miraResolvedCaption(result),
    {...art,instagram_media_proof:{...verifiedProof,final_media_sha256:''}}).ok,false);
});

test('false PASS, under-0.940 face, source drift, media hash mismatch and provider-post side effect never promote',()=>{
  const bad=[
    {...successJob,proof_manifest:{...verifiedProof,exact_final_media_proven:false}},
    {...successJob,proof_manifest:{...verifiedProof,mira_source_hash:'drift'}},
    {...successJob,proof_manifest:{...verifiedProof,mira_winner_recommendation_id:'other'}},
    {...successJob,proof_manifest:{...verifiedProof,final_media_sha256:'missing'}},
    {...successJob,proof_manifest:{...verifiedProof,temporal_proof:{verified:false}}},
    {...successJob,proof_manifest:{...verifiedProof,instagram_visual:{...vision,face_identity_confidence:0.920}}},
    {...successJob,proof_manifest:{...verifiedProof,instagram_visual:{...vision,
      frame_evidence:[frame('start'),{...frame('middle'),face_identity_confidence:0.920},frame('end')]}}},
    {...successJob,republish_forbidden:true},
    {...successJob,replacement_of_external_id:'already-sent'},
  ];
  for(const job of bad){
    assert.equal(verifiedSourceLedMediaReplacement({
      openart_history_id:original,asset_url:originalResolved.asset_url,
      source_hash:hash,scene:originalResolved.scene
    },id,job),null);
    assert.equal(read(job).openart_history_id,original);
  }
});
test('existing router and orchestrator still hold all original side-effect and vision gates',()=>{
  const router=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
  const orchestrator=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
  const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
  assert.match(router,/eligibleSourceLedMediaReplacement/);
  assert.match(router,/validMiraGenerationReference\(manifest\)/);
  assert.match(router,/VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH/);
  assert.match(router,/MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED/);
  assert.match(router,/miraFaceProofValid\(proof.instagram_visual/);
  assert.match(orchestrator,/select\('status,asset_manifest,proof_manifest,republish_forbidden,replacement_of_external_id'\)/);
  assert.match(publisher,/validateResolvedMiraCaptionForDelivery/);
  assert.match(publisher,/miraFaceProofValid/);
  assert.match(publisher,/proof\.mira_generation_source\?\.openart_history_id/);
});
