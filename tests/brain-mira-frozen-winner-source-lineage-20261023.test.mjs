import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveMiraFrozenWinner,sourceLedAutoVerifyCandidate,sourceLedRecoverableProofRetry} from '../supabase/functions/_shared/mira-frozen-winner-contract.mjs';
import {MIRA_CASES,selectMiraProblem} from '../supabase/functions/_shared/mira-entrepreneur-caption.mjs';

const runDate='2026-10-23';
const id='7880c326-72b8-4ac8-a712-971a9a24de12';
const source='https://example.org/privacy-complaint';
const winner={run_date:runDate,recommendation_id:id};
const lineage={run_date:runDate,winner_recommendation_id:id,state:'WINNER_FROZEN',source_evidence:{source_hash:'a'.repeat(64),source_url:source}};
const recommendation={
 recommendation_id:id,status:'accepted',
 evidence:{source_backed:true,source_url:source,source_title:'Verwijdering van persoonlijke gegevens uit klachten',
   forced_business_bridge_forbidden:true,office_problem_attribution_forbidden:true}
};
const job={asset_manifest:{daily_winner_recommendation_id:id}};
const resolve=(options={})=>resolveMiraFrozenWinner(runDate,{
 winner,lineage,recommendation,job,...options
});

test('existing unreserved library problem stays deterministic only before daily freeze',()=>{
 const current=resolveMiraFrozenWinner(runDate,{});
 assert.equal(current.ok,true);
 assert.equal(current.kind,'pre_freeze_legacy');
 assert.equal(current.problem.id,selectMiraProblem(runDate).id);
});
test('a frozen complaint winner cannot be coerced into PH-P030 via date rotation',()=>{
 const actual=resolve();
 assert.equal(actual.ok,false);
 assert.equal(actual.code,'SOURCE_BACKED_MIRA_SCENE_ROUTE_REQUIRED');
 assert.notEqual(actual.winner_recommendation_id,selectMiraProblem(runDate).id);
});
test('mismatched frozen winner or mutated daily job is denied',()=>{
 assert.equal(resolve({lineage:{...lineage,winner_recommendation_id:'different'}}).code,'INSTAGRAM_FROZEN_WINNER_LINEAGE_CONFLICT');
 assert.equal(resolve({job:{asset_manifest:{daily_winner_recommendation_id:'other'}}}).code,'INSTAGRAM_FROZEN_WINNER_LINEAGE_CONFLICT');
});
test('frozen source provenance must be real, same URL, accepted and hashed',()=>{
 assert.equal(resolve({recommendation:{...recommendation,status:'suggested'}}).code,'INSTAGRAM_FROZEN_SOURCE_PROVENANCE_UNVERIFIED');
 assert.equal(resolve({lineage:{...lineage,source_evidence:{...lineage.source_evidence,source_hash:''}}}).code,'INSTAGRAM_FROZEN_SOURCE_PROVENANCE_UNVERIFIED');
 assert.equal(resolve({recommendation:{...recommendation,evidence:{...recommendation.evidence,source_url:'https://other.test'}}}).code,'INSTAGRAM_FROZEN_SOURCE_PROVENANCE_UNVERIFIED');
});
test('approved library mapping requires an existing exact canonical scene',()=>{
 const c=MIRA_CASES[1];
 const ev={...recommendation.evidence,forced_business_bridge_forbidden:false,office_problem_attribution_forbidden:false};
 assert.equal(resolve({recommendation:{...recommendation,evidence:ev}}).code,'CANONICAL_WINNER_NOT_LIBRARY_MAPPED');
 assert.equal(resolve({recommendation:{...recommendation,evidence:{...ev,approved_canonical_problem_id:c.id,approved_mira_scene:'other'}}}).code,'WINNER_SCENE_UNVERIFIED');
 const valid=resolve({recommendation:{...recommendation,evidence:{...ev,approved_canonical_problem_id:c.id,approved_mira_scene:c.scene}}});
 assert.equal(valid.ok,true);
 assert.equal(valid.problem.id,c.id);
 assert.equal(valid.winner_recommendation_id,id);
 assert.equal(valid.source_hash,'a'.repeat(64));
});
test('the production router calls the strict resolver before it can verify media',()=>{
 const src=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 assert.match(src,/resolveMiraFrozenWinner\(runDate,/);
 assert.match(src,/if\(!winnerContract\.ok\)/);
 assert.match(src,/action==='submit_asset'\)return json\(\{ok:false,error:winnerContract\.code/);
 assert.match(src,/winnerContract\.winner_recommendation_id\|\|clean\(manifest\.recommendation_id\)/);
 assert.match(src,/powerhouse-instagram-media-verifier/);
 assert.match(src,/MIRA_FACE_DRIFT_ACROSS_REEL_FRAMES/);
 assert.match(src,/MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED/);
});

test('router, orchestrator and publisher share the frozen source-led authority',()=>{
 const router=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 const orchestrator=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
 const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
 assert.match(router,/resolveMiraFrozenWinner/);
 assert.match(router,/manifest\.openart_history_id/);
 assert.match(router,/winnerContract\.asset_url/);
 assert.match(router,/MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED/);
 assert.match(orchestrator,/resolveMiraFrozenWinner/);
 assert.match(orchestrator,/miraResolvedCaption\(resolvedMira\)/);
 assert.match(orchestrator,/validateResolvedMiraCaptionForDelivery/);
 assert.match(orchestrator,/MIRA_FROZEN_SOURCE_MEDIA_PROOF_REQUIRED/);
 assert.doesNotMatch(orchestrator,/bodyText=miraCaption\(miraBusinessProblem\)/);
 assert.match(publisher,/validateResolvedMiraCaptionForDelivery/);
 assert.match(publisher,/proof\.mira_source_hash/);
 assert.match(publisher,/proof\.mira_generation_source\?\.openart_history_id/);
 assert.match(publisher,/miraFaceProofValid/);
 assert.doesNotMatch(publisher,/validateMiraCaptionForDelivery\(runDate,art\.body/);
});

test('one-shot Heartbeat source-led reuse never generates or publishes',()=>{
 const frozen={kind:'approved_source_led',
  winner_recommendation_id:'7880c326-72b8-4ac8-a712-971a9a24de12',
  scene:'Mira privacy complaints',asset_url:'https://cdn.openart.ai/mira-approved.mp4',
  openart_history_id:'S2WRHcZAKIV5Cxn2tZLE'};
 const job={id:'a',updated_at:'2026-10-23T08:00:00Z',status:'WAITING_ASSET',
  attempts:0,asset_manifest:{recommendation_id:frozen.winner_recommendation_id}};
 const input={runDate:'2026-10-23',resolved:frozen,job,ob:{external_id:null},postType:'reel',readyProviders:['openart']};
 const proposed=sourceLedAutoVerifyCandidate(input);
 assert.equal(proposed.ok,true);
 assert.equal(proposed.assetManifest.asset_url,frozen.asset_url);
 assert.equal(proposed.assetManifest.generation_mode,'image2video');
 assert.equal(proposed.assetManifest.source_led_auto_verify_started,true);
 assert.equal(proposed.assetManifest.openart_history_id,frozen.openart_history_id);
 for(const variant of [
  {job:{...job,attempts:1}},
  {job:{...job,status:'WAITING_PROOF'}},
  {job:{...job,asset_manifest:{...job.asset_manifest,source_led_auto_verify_started:true}}},
  {ob:{external_id:'existing-instagram-post'}},
  {ob:{evidence:{republish_forbidden:true}}},
  {readyProviders:[]},
  {resolved:{...frozen,kind:'unapproved'}},
  {job:{...job,asset_manifest:{recommendation_id:'different'}}}
 ]){
  assert.equal(sourceLedAutoVerifyCandidate({...input,...variant}).ok,false);
 }
});
test('the original media preflight has a CAS claim and background actual-proof call',()=>{
 const src=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 assert.match(src,/sourceLedAutoVerifyCandidate/);
 assert.match(src,/\.eq\('status',job.status\)\.eq\('attempts',job.attempts\)/);
 assert.match(src,/\.eq\('id',job\.id\)\.eq\('updated_at',job\.updated_at\)/);
 assert.match(src,/EdgeRuntime\.waitUntil\(background\)/);
 assert.match(src,/action:'submit_asset'/);
 assert.match(src,/MIRA_AUTO_PROOF_FAILED/);
 assert.match(src,/MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED/);
});


test('bounded verifier retries only transient same-source proof without another media producer',()=>{
 const frozen={kind:'approved_source_led',
  winner_recommendation_id:'7880c326-72b8-4ac8-a712-971a9a24de12',
  scene:'source-led-privacy-scene',asset_url:'https://cdn.openart.ai/existing.mp4',
  openart_history_id:'S2WRHcZAKIV5Cxn2tZLE'};
 const job={id:'existing-job',status:'WAITING_PROOF',attempts:1,
  updated_at:'2026-10-23T09:00:00Z',last_error:'MIRA_AUTO_PROOF_TRANSPORT_FAILED',
  asset_manifest:{source_led_auto_verify_started:true,
   source_led_auto_verify_contract:'mira-frozen-approved-existing-asset-only-v1',
   daily_winner_recommendation_id:frozen.winner_recommendation_id,
   scene:frozen.scene,asset_url:frozen.asset_url,openart_history_id:frozen.openart_history_id},
  proof_manifest:{}};
 const opts={runDate:'2026-10-23',resolved:frozen,job,
  ob:{external_id:null,status:'BLOCKED'},postType:'reel',
  readyProviders:['openart'],now:Date.parse('2026-10-23T09:20:00Z')};
 const retry=sourceLedRecoverableProofRetry(opts);
 assert.equal(retry.ok,true);
 assert.equal(retry.nextAttempts,2);
 assert.equal(retry.assetManifest,job.asset_manifest,'must use exact existing bytes');
 assert.equal(sourceLedRecoverableProofRetry({...opts,now:Date.parse('2026-10-23T09:01:00Z')}).ok,false);
 assert.equal(sourceLedRecoverableProofRetry({...opts,job:{...job,attempts:3}}).ok,false);
 assert.equal(sourceLedRecoverableProofRetry({...opts,job:{...job,last_error:'MIRA_AUTO_PROOF_FAILED:VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH'}}).ok,false);
 assert.equal(sourceLedRecoverableProofRetry({...opts,job:{...job,last_error:'MIRA_AUTO_PROOF_FAILED:MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED'}}).ok,false);
 assert.equal(sourceLedRecoverableProofRetry({...opts,job:{...job,proof_manifest:{exact_final_media_proven:true}}}).ok,false);
 assert.equal(sourceLedRecoverableProofRetry({...opts,ob:{external_id:'already-published'}}).ok,false);
 assert.equal(sourceLedRecoverableProofRetry({...opts,ob:{status:'APPROVED'}}).ok,false);
 assert.equal(sourceLedRecoverableProofRetry({...opts,readyProviders:[]}).ok,false);
 assert.equal(sourceLedRecoverableProofRetry({...opts,job:{...job,asset_manifest:{...job.asset_manifest,asset_url:'https://cdn.openart.ai/other.mp4'}}}).ok,false);
 const abandoned={...job,last_error:'',updated_at:'2026-10-23T09:00:00Z'};
 assert.equal(sourceLedRecoverableProofRetry({...opts,job:abandoned,now:Date.parse('2026-10-23T09:31:00Z')}).ok,true);
 assert.equal(sourceLedRecoverableProofRetry({...opts,job:abandoned,now:Date.parse('2026-10-23T09:18:00Z')}).ok,false);
 const second={...job,attempts:2,last_error:'MIRA_AUTO_PROOF_FAILED:VIDEO_FRAME_EXTRACTION_FAILED'};
 assert.equal(sourceLedRecoverableProofRetry({...opts,job:second,now:Date.parse('2026-10-23T09:35:00Z')}).nextAttempts,3);
});
test('retry triggers inside original Heartbeat preflight with CAS and never after hard vision rejection',()=>{
 const router=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 assert.match(router,/sourceLedRecoverableProofRetry/);
 assert.match(router,/attempts:candidate.nextAttempts\|\|1/);
 assert.match(router,/\.eq\('id',job.id\)\.eq\('updated_at',job.updated_at\)/);
 assert.match(router,/\.eq\('status',job.status\)\.eq\('attempts',job.attempts\)/);
 assert.match(router,/EdgeRuntime\.waitUntil\(background\)/);
});


test('Heartbeat cannot reset proof last_error or lease clock while frame verification is in flight',()=>{
 const router=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 const retryIndex=router.indexOf('sourceLedRecoverableProofRetry({');
 const preserveIndex=router.indexOf("job?.status==='WAITING_PROOF'&&");
 const preflightWriteIndex=router.indexOf('writeMediaPreflight(db,job,row)');
 assert.ok(retryIndex>=0&&preserveIndex>retryIndex&&preflightWriteIndex>preserveIndex);
 assert.match(router,/job\?\.asset_manifest\?\.source_led_auto_verify_started===true/);
 assert.match(router,/last_error:job\.last_error\|\|null,next_action:job\.next_action/);
 assert.match(router,/\.eq\('id',job\.id\)\.eq\('updated_at',job\.updated_at\)/);
});
