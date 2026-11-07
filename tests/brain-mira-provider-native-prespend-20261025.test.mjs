import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessMiraProviderBeforeSpend,MIRA_WAN27_PROVIDER_OBSERVATION,MIRA_MODEL_FACE_EVIDENCE,MIRA_FACE_GATE_MIN} from '../supabase/functions/_shared/mira-preventive-quality-recovery.mjs';

const masterReferenceId='Yjqu4D7v76HABNPmQPj1';
const wan={model:'wan2-7',mode:'image2video',masterReferenceId,
 params:{resolution:'1080p',duration:8,videoCount:1}};
test('real Wan 2.7 original-master 1080p output cannot satisfy native 1080x1920 silent Reel',()=>{
 const d=assessMiraProviderBeforeSpend(wan);
 assert.equal(d.ok,false);
 assert.equal(d.code,'MIRA_WAN27_IMAGE_RATIO_NOT_EXACT_REEL');
 assert.equal(d.actual_media_verified,false);
 assert.equal(d.approved_for_publish,false);
 assert.equal(d.observed.history_id,'4y4xrXvVDidv9gUDQZea');
 assert.equal(d.observed.actual_width,1292);
 assert.equal(d.observed.actual_height,1604);
 assert.equal(d.observed.actual_has_audio,true);
 assert.equal(MIRA_WAN27_PROVIDER_OBSERVATION.requested_resolution,'1080p');
});
test('even adding a caller invented aspectRatio/audio argument cannot override absent Wan image2video capability',()=>{
 for(const params of [
  {...wan.params,aspectRatio:'9:16'},
  {...wan.params,aspectRatio:'9:16',generateAudio:false},
  {...wan.params,width:1080,height:1920,hasAudio:false}
 ]){
  const d=assessMiraProviderBeforeSpend({...wan,params});
  assert.equal(d.ok,false);
  assert.equal(d.code,'MIRA_WAN27_IMAGE_RATIO_NOT_EXACT_REEL');
 }
});
test('wrong master, budget-abusing batch, and unsupported free-text mode fail closed',()=>{
 assert.equal(assessMiraProviderBeforeSpend({...wan,masterReferenceId:'wrong'}).ok,false);
 assert.equal(assessMiraProviderBeforeSpend({...wan,mode:'text2video'}).ok,false);
 assert.equal(assessMiraProviderBeforeSpend({...wan,params:{...wan.params,videoCount:6}}).ok,false);
 assert.equal(assessMiraProviderBeforeSpend({...wan,params:{...wan.params,duration:10}}).ok,false);
});
test('unproven models are NOT deemed compatible just because user asks for 1080p',()=>{
 const d=assessMiraProviderBeforeSpend({...wan,model:'unknown-model',params:{...wan.params,aspectRatio:'9:16'}});
 assert.equal(d.ok,false);
 assert.equal(d.code,'MIRA_PROVIDER_OUTPUT_CONTRACT_UNPROVEN');
});
test('Veo 3.1 has the right format controls but is blocked by recorded face-gate failures, not re-enabled',()=>{
 const v=assessMiraProviderBeforeSpend({...wan,model:'veo3-1',params:{...wan.params,aspectRatio:'9:16',generateAudio:false}});
 assert.equal(v.ok,false);
 assert.equal(v.code,'MIRA_MODEL_FACE_GATE_FAILED_BEFORE');
 assert.equal(v.approved_for_publish,false);
 assert.equal(v.actual_media_verified,false);
 assert.equal(assessMiraProviderBeforeSpend({...wan,model:'veo3-1'}).ok,false);
});
test('original router exposes read-only authorized generation_preflight BEFORE submit_asset',()=>{
 const s=readFileSync(new URL('../supabase/functions/powerhouse-instagram-media-router/index.ts',import.meta.url),'utf8');
 const pre=s.indexOf("if(action==='generation_preflight')");
 const submit=s.indexOf("if(action==='submit_asset')",pre);
 assert.ok(pre>0&&submit>pre);
 assert.match(s,/assessMiraProviderBeforeSpend\(\{/);
 assert.match(s,/const eligible=config\.ok&&\(derivedInput===null\|\|derivedInput\.ok===true\)/);
 assert.match(s,/eligible\?200:422/);
 assert.match(s,/MIRA_FROZEN_REEL_PRODUCER_AUTHORITY_REQUIRED/);
 assert.match(s,/A passing output-config or derived-input check is NOT final visual proof/);
});

test('veo3-1 element2video is blocked BEFORE spend because real paid runs failed the face gate (0.900 < 0.940)',()=>{
 const base={model:'veo3-1',mode:'element2video',masterReferenceId,params:{resolution:'1080p',duration:8,videoCount:1,aspectRatio:'9:16',generateAudio:false}};
 for(const mode of ['element2video','image2video']){
  const v=assessMiraProviderBeforeSpend({...base,mode});
  assert.equal(v.ok,false);
  assert.equal(v.code,'MIRA_MODEL_FACE_GATE_FAILED_BEFORE');
  assert.equal(v.best_recorded_face_score,0.9);
  assert.ok(v.rejected_histories.includes('B5uX1JhoC8hl0kiFTrnl'));
 }
 // caller cannot bypass with asserted evidence
 assert.equal(assessMiraProviderBeforeSpend({...base,params:{...base.params,newModelEvidenceId:'x',faceEvidenceOverrideScore:0.99}}).ok,false);
 assert.equal(assessMiraProviderBeforeSpend({...base,masterReferenceId:'other'}).ok,false);
 assert.equal(MIRA_MODEL_FACE_EVIDENCE.every(r=>r.best_face_score<MIRA_FACE_GATE_MIN),true);
});
