import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recordMiraExactVerificationFailure} from '../supabase/functions/powerhouse-instagram-media-router/exact-video-verification-resume.mjs';

const id='4a68dc41-6e60-4b64-ba7b-400086cb7296';
const callerClock='2026-11-18T06:47:40.928Z';
const databaseClock='2026-11-18T06:47:40.986122+00:00';
const makeDb=({updatedAt=databaseClock,status='WAITING_PROOF',lastError=null}={})=>{
 const calls=[];
 const table={
  update(patch){calls.push({kind:'update',patch});this.patch=patch;return this;},
  eq(col,value){calls.push({kind:'eq',col,value});this.filters??=[];this.filters.push([col,value]);return this;},
  is(col,value){calls.push({kind:'is',col,value});this.filters??=[];this.filters.push([col,value]);return this;},
  select(fields){calls.push({kind:'select',fields});return this;},
  async maybeSingle(){
   const f=new Map(this.filters||[]);
   const matched=f.get('id')===id&&f.get('status')===status
      &&f.get('updated_at')===updatedAt
      &&f.get('last_error')===lastError;
   return {data:matched?{id}:null,error:null};
  }
 };
 return {db:{from(name){assert.equal(name,'powerhouse_instagram_media_jobs_v1');return table;}},calls};
};
const apply=async (db,claimUpdatedAt=databaseClock)=>recordMiraExactVerificationFailure({
 db,jobId:id,claimUpdatedAt,code:'MIRA_FRAME_VISION_PROVIDER_UNAVAILABLE',
 nextAction:'Keep original OpenArt history and cooldown.',now:'2026-11-18T06:48:01Z'
});

test('original 503 is recorded using DB timestamp after trigger overwrites client updated_at',async()=>{
 const {db,calls}=makeDb();
 const result=await apply(db);
 assert.deepEqual(result,{kind:'RECORDED',job_id:id});
 const eqs=calls.filter(x=>x.kind==='eq');
 assert.deepEqual(eqs.find(x=>x.col==='updated_at')?.value,databaseClock);
 assert.deepEqual(eqs.find(x=>x.col==='status')?.value,'WAITING_PROOF');
 assert.equal(calls.find(x=>x.kind==='update').patch.last_error,'MIRA_FRAME_VISION_PROVIDER_UNAVAILABLE');
 assert.equal(calls.find(x=>x.kind==='select').fields,'id');
});

test('the old caller timestamp matches ZERO rows and cannot masquerade as a successful recovery',async()=>{
 const {db}=makeDb();
 const result=await apply(db,callerClock);
 assert.equal(result.kind,'CONCURRENT_RESULT_PRESERVED');
});

test('an actual measured quality verdict or PASS wins every stale async provider write',async()=>{
 for(const sample of [
  {status:'PROOF_VERIFIED',lastError:null},
  {status:'WAITING_PROOF',lastError:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH'},
  {status:'LIVE_PROVEN',lastError:null}
 ]){
  const {db}=makeDb(sample);
  assert.equal((await apply(db)).kind,'CONCURRENT_RESULT_PRESERVED');
 }
});

test('invalid writer receipt and untrusted errors never update original media job',async()=>{
 for(const sample of [
  {jobId:'not-a-uuid',claimUpdatedAt:databaseClock,code:'MIRA_FRAME_VISION_PROVIDER_UNAVAILABLE'},
  {jobId:id,claimUpdatedAt:'',code:'MIRA_FRAME_VISION_PROVIDER_UNAVAILABLE'},
  {jobId:id,claimUpdatedAt:databaseClock,code:'PROOF_VERIFIED'}
 ]){
  let called=false;
  const db={from(){called=true;throw new Error('SHOULD_NOT_WRITE');}};
  const result=await recordMiraExactVerificationFailure({db,...sample});
  assert.equal(result.kind,'INVALID_RECOVERY_RECEIPT');
  assert.equal(called,false);
 }
});

test('the original guarded router captures RETURNING updated_at and never filters by local claimedAt',()=>{
 const src=readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 const pos=src.indexOf('const plan=planMiraExactVideoVerificationResume(');
 assert.ok(pos>0);
 const section=src.slice(pos,src.indexOf(" // Heartbeat's existing preflight",pos));
 assert.match(section,/\.select\('id,updated_at'\)\.maybeSingle\(\)/);
 assert.match(section,/claimUpdatedAt:claim\.data\.updated_at/);
 assert.match(section,/recordMiraExactVerificationFailure/);
 assert.doesNotMatch(section,/\.eq\('updated_at',claimedAt\)/);
 assert.match(section,/\.eq\('status',job\.status\)\.eq\('attempts',job\.attempts\)/);
 assert.match(section,/\.eq\('updated_at',job\.updated_at\)/);
});
