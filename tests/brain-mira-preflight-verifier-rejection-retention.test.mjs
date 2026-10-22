import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {retainMediaProofFailure,recordMediaProofRejection,writeMediaPreflight} from '../supabase/functions/powerhouse-instagram-media-router/preflight-write.mjs';

const assetUrl='https://cdn.openart.ai/openart-ai/production/video.mp4';
const base={status:'WAITING_PROOF',asset_manifest:{asset_url:assetUrl},last_error:null,next_action:'Submit exact media',attempts:108};
const rejected='VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:start:face=0.920:openart=test';

test('readiness does not erase exact failed Mira proof or replace it with MEDIA_ASSET_REQUIRED',()=>{
 const existing={...base,last_error:rejected,next_action:'Choose a fresh OpenArt source'};
 const actual=retainMediaProofFailure(existing,{last_error:'MEDIA_ASSET_REQUIRED'},base);
 assert.equal(actual.last_error,rejected);
 assert.equal(actual.next_action,'Choose a fresh OpenArt source');
 assert.equal(actual.status,'WAITING_PROOF');
 assert.deepEqual(actual.asset_manifest,base.asset_manifest);
 assert.equal(actual.attempts,108);
});

test('current blocked obligation supplies diagnosis if job has no diagnostic yet',()=>{
 const actual=retainMediaProofFailure(base,{last_error:'MIRA_VIDEO_FRAME_CANONICAL_FACE_MISMATCH',next_action:'Investigate real identity'},base);
 assert.equal(actual.last_error,'MIRA_VIDEO_FRAME_CANONICAL_FACE_MISMATCH');
 assert.equal(actual.next_action,'Investigate real identity');
});

test('generic missing asset is not misclassified and no error is promoted to verified',()=>{
 assert.strictEqual(retainMediaProofFailure(base,{last_error:'MEDIA_ASSET_REQUIRED'},base),base);
 assert.strictEqual(retainMediaProofFailure({...base,last_error:rejected},{}, {...base,status:'PROOF_VERIFIED'}).status,'PROOF_VERIFIED');
 assert.strictEqual(retainMediaProofFailure({...base,last_error:rejected},{},{...base,asset_manifest:{}}).last_error,null);
});

function fakeDb(){
 const calls=[];
 const db={from(name){
   const call={name,fields:null,filters:[]};calls.push(call);
   const q={
     update(fields){call.fields=fields;return q},
     eq(field,value){call.filters.push(['eq',field,value]);return q},
     is(field,value){call.filters.push(['is',field,value]);return q},
     select(field){call.select=field;return q},
     async maybeSingle(){return {data:{id:'media-job'},error:null}}
   };return q;
 }};
 return {db,calls};
}
const job={id:'media-job',status:'WAITING_PROOF',updated_at:'2026-10-22T11:00:00Z',publication_date:'2026-10-22'};
const ob={status:'BLOCKED',updated_at:'2026-10-22T11:00:00Z',external_id:null};

test('one genuine verification failure writes exact diagnostic under CAS, never success/media replacement',async()=>{
 const {db,calls}=fakeDb();
 const result=await recordMediaProofRejection(db,{job,ob,code:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH',position:'start',historyId:'OpenArtHistory123',confidence:.92});
 assert.equal(result.kind,'applied');
 assert.equal(calls.length,2);
 assert.equal(calls[0].name,'powerhouse_instagram_media_jobs_v1');
 assert.match(calls[0].fields.last_error,/^VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:start:face=0\.920:openart=OpenArtHistory123$/);
 assert.match(calls[0].fields.next_action,/>=0.94/);
 assert.equal(Object.hasOwn(calls[0].fields,'status'),false);
 assert.equal(Object.hasOwn(calls[0].fields,'asset_manifest'),false);
 assert.equal(Object.hasOwn(calls[0].fields,'attempts'),false);
 assert.deepEqual(calls[0].filters,[['eq','id','media-job'],['eq','status','WAITING_PROOF'],['eq','updated_at',job.updated_at]]);
 assert.equal(calls[1].name,'content_publication_obligations');
 assert.deepEqual(calls[1].filters.slice(-2),[['eq','status','BLOCKED'],['is','external_id',null]]);
 assert.equal(calls[1].fields.last_error,calls[0].fields.last_error);
 assert.equal(Object.hasOwn(calls[1].fields,'external_id'),false);
});

test('verified, already posted, missing CAS and invalid reason cannot mutate job',async()=>{
 for(const input of [
   {job:{...job,status:'PROOF_VERIFIED'},ob},
   {job,ob:{...ob,external_id:'17842'}},
   {job:{...job,updated_at:null},ob},
   {job,ob,code:'MEDIA_ASSET_REQUIRED'}
 ]){
  const {db,calls}=fakeDb();
  const result=await recordMediaProofRejection(db,{job,ob,code:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH',position:'start',historyId:'h',confidence:.93,...input});
  assert.equal(result.kind,'ignored');
  assert.equal(calls.length,0);
 }
});

test('existing preflight CAS and exact router fail-closed path remain wired',()=>{
 const source=readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 assert.match(source,/recordMediaProofRejection\(db,\{job,ob,code:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH'/);
 assert.match(source,/retainMediaProofFailure\(job,ob,baseRow\)/);
 assert.match(source,/if\(!fv\.body\?\.pass\|\|!miraFaceProofValid/);
 assert.match(source,/return json\(\{ok:false,error:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH'/);
 assert.match(source,/const write=await writeMediaPreflight\(db,job,row\)/);
 assert.match(source,/\.is\('external_id',null\)/);
 assert.equal(typeof writeMediaPreflight,'function');
});
