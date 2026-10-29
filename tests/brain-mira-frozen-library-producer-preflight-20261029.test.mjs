import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {eligibleFrozenLibraryMediaGeneration} from '../supabase/functions/_shared/mira-frozen-winner-contract.mjs';

const winner='4f4f8eea-5e1d-4d1c-8240-ec038ec6124f';
const scene='Mira krijgt drie spreadsheets met hetzelfde cijfer. Alleen: elk bestand geeft een ander antwoord.';
const rejected='i6e9teMFpPH7YwZG4PMS';
const fixture=()=>({
 resolved:{kind:'approved_frozen_library_mapping',winner_recommendation_id:winner,problem:{id:'PH-P006',scene}},
 job:{status:'WAITING_PROOF',attempts:1,republish_forbidden:false,last_error:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:start:face=0.900:openart='+rejected,
       asset_manifest:{openart_history_id:rejected,openart_project_id:'rUF5anXD47gVokckYjf9',
         recommendation_id:winner,daily_winner_recommendation_id:winner}},
 ob:{status:'FAILED',external_id:null,live_proven_at:null,evidence:{}},
 input:{scene,canonical_problem_id:'PH-P006',recommendation_id:winner},
 postType:'reel'
});
test('exact frozen PH-P library recovery has one original-authority format preflight',()=>{
 assert.equal(eligibleFrozenLibraryMediaGeneration(fixture()),true);
});
test('cannot relabel winner, frozen scene, old history or provider project to bypass gate',()=>{
 for(const modify of [
   v=>{v.input.scene='another unrelated topic';},
   v=>{v.input.canonical_problem_id='PH-P001';},
   v=>{v.input.recommendation_id='other';},
   v=>{v.job.asset_manifest.openart_history_id='different';},
   v=>{v.job.asset_manifest.openart_project_id='';},
   v=>{v.job.asset_manifest.daily_winner_recommendation_id='other';},
   v=>{v.resolved.kind='pre_freeze_legacy';},
   v=>{v.job.last_error='MEDIA_ASSET_REQUIRED';},
   v=>{v.job.status='READY_TO_PUBLISH';},
   v=>{v.postType='image';}
 ]){const v=fixture();modify(v);assert.equal(eligibleFrozenLibraryMediaGeneration(v),false);}
});
test('publication id, duplicate status or exhausted producer budget prevent preflight',()=>{
 for(const modify of [
  v=>{v.ob.external_id='urn:ig:post:existing';},
  v=>{v.ob.live_proven_at='2026-10-29T15:00:00Z';},
  v=>{v.ob.evidence.republish_forbidden=true;},
  v=>{v.job.republish_forbidden=true;},
  v=>{v.job.asset_manifest.automatic_generation_budget_exhausted=true;},
  v=>{v.job.attempts=3;}
 ]){const v=fixture();modify(v);assert.equal(eligibleFrozenLibraryMediaGeneration(v),false);}
});
test('router uses original pinned master and preserves actual provider face/time gates',()=>{
 const code=readFileSync(new URL('../supabase/functions/powerhouse-instagram-media-router/index.ts',import.meta.url),'utf8');
 assert.match(code,/eligibleFrozenLibraryMediaGeneration\(/);
 assert.match(code,/frozenLibraryRecovery\?MIRA_MASTER_REFERENCE_ID/);
 for(const gate of ['VIDEO_NATIVE_FRAME_PROOF_UNAVAILABLE','MIRA_FACE_DRIFT_ACROSS_REEL_FRAMES','MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED','MIRA_SAME_FACE_EXACT_MEDIA_GATE_FAILED'])
  assert.ok(code.includes(gate),gate);
 assert.match(code,/MIRA_FROZEN_REEL_PRODUCER_AUTHORITY_REQUIRED/);
});
