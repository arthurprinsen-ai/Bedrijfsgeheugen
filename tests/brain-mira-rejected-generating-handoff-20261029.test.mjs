import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recordMediaProofRejection,reconcileHistoricalRejectedGeneratingJob} from '../supabase/functions/powerhouse-instagram-media-router/preflight-write.mjs';

const history='i6e9teMFpPH7YwZG4PMS';
const url='https://cdn.openart.ai/openart-ai/production/2026-10/create-video/real.mp4';
const job={id:'original-job',status:'GENERATING',updated_at:'2026-10-29T14:44:00Z',
 publication_date:'2026-10-29',attempts:1,
 asset_manifest:{openart_history_id:history,openart_project_id:'canonical-project',generation_mode:'element2video'}};
const ob={channel:'instagram',status:'PLANNED',updated_at:'2026-10-29T14:44:00Z',
 external_id:null,live_proven_at:null};
const historyEvidence={occurrence_id:'router:openart:'+history+':instagram:2026-10-29:start',
 fingerprint:'powerhouse|instagram-mira|video-frame-identity-below-094|20261022-v1',
 evidence:{openart_history_id:history,face_identity_confidence:0.9,frame_position:'start'}};

function database(historyRows=[historyEvidence]){
 const calls=[],rpc=[];
 const db={
  async rpc(name,args){rpc.push({name,args});return {data:{},error:null}},
  from(table){
   const entry={table,fields:null,filters:[]};calls.push(entry);
   const chain={
    select(v){entry.select=v;return chain},
    update(v){entry.fields=v;return chain},
    eq(k,v){entry.filters.push(['eq',k,v]);return chain},
    is(k,v){entry.filters.push(['is',k,v]);return chain},
    like(k,v){entry.filters.push(['like',k,v]);return chain},
    async limit(n){entry.limit=n;return {data:historyRows,error:null}},
    async maybeSingle(){return {data:{id:'original-job'},error:null}}
   };
   return chain;
  }
 };
 return {db,calls,rpc};
}
test('failed completed OpenArt can update only exact generating job, without marking media verified',async()=>{
 const {db,calls,rpc}=database();
 const result=await recordMediaProofRejection(db,{
   job,ob,code:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH',position:'start',
   historyId:history,confidence:0.9,allowGeneratingExactHistory:true,assetUrl:url});
 assert.equal(result.kind,'applied');
 assert.equal(calls[0].table,'powerhouse_instagram_media_jobs_v1');
 assert.equal(calls[0].fields.status,'WAITING_PROOF');
 assert.equal(calls[0].fields.asset_manifest.rejected_openart_history_id,history);
 assert.equal(calls[0].fields.asset_manifest.rejected_asset_url,url);
 assert.equal(Object.hasOwn(calls[0].fields.asset_manifest,'asset_url'),false);
 assert.equal(Object.hasOwn(calls[0].fields,'attempts'),false);
 assert.deepEqual(calls[0].filters,[['eq','id','original-job'],['eq','status','GENERATING'],['eq','updated_at',job.updated_at]]);
 assert.equal(calls[1].table,'content_publication_obligations');
 assert.equal(calls[1].fields.last_error,calls[0].fields.last_error);
 assert.equal(rpc.length,1);
 assert.equal(rpc[0].args.p_evidence.face_identity_confidence,0.9);
});
test('cannot misclassify a different history, external post, non-provider URL or missing claim',async()=>{
 const samples=[
  {historyId:'different-history',allowGeneratingExactHistory:true,assetUrl:url},
  {historyId:history,allowGeneratingExactHistory:false,assetUrl:url},
  {historyId:history,allowGeneratingExactHistory:true,assetUrl:'https://other.example/video.mp4'},
  {historyId:history,allowGeneratingExactHistory:true,assetUrl:url,ob:{...ob,external_id:'meta-real-id'}}
 ];
 for(const sample of samples){
  const {db,calls}=database();
  const result=await recordMediaProofRejection(db,{job,ob,code:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH',
    position:'start',confidence:0.9,...sample});
  assert.equal(result.kind,'ignored');
  assert.equal(calls.length,0);
 }
});
test('canonical Heartbeat preflight reconciles old rejection only from exact Brain occurrence',async()=>{
 const {db,calls}=database();
 const result=await reconcileHistoricalRejectedGeneratingJob(db,{job,ob});
 assert.equal(result.kind,'rejected');
 assert.equal(result.historyId,history);
 assert.equal(result.score,'0.900');
 assert.equal(calls[0].table,'brain_failure_occurrences');
 assert.ok(calls[0].filters.some(x=>x[0]==='like'&&x[2].includes(history)));
 assert.equal(calls[1].fields.status,'WAITING_PROOF');
 assert.ok(!Object.hasOwn(calls[1].fields,'asset_manifest'));
 assert.ok(!Object.hasOwn(calls[1].fields,'attempts'));
 assert.equal(calls[2].table,'content_publication_obligations');
 assert.equal(calls[2].fields.last_error,calls[1].fields.last_error);
});
test('no fabricated history, post or unverified failure can leave existing claim',async()=>{
 for(const sample of [
  {job:{...job,status:'PROOF_VERIFIED'},ob,rows:[historyEvidence]},
  {job,ob:{...ob,external_id:'178xx'},rows:[historyEvidence]},
  {job,ob,rows:[]},
  {job,ob,rows:[{...historyEvidence,evidence:{openart_history_id:'different-history'}}]},
  {job,ob,rows:[{...historyEvidence,fingerprint:'unknown'}]}
 ]){
  const {db,calls}=database(sample.rows);
  const result=await reconcileHistoricalRejectedGeneratingJob(db,{job:sample.job,ob:sample.ob});
  assert.ok(['ignored','clear'].includes(result.kind));
  assert.equal(calls.some(x=>x.fields&&x.table==='powerhouse_instagram_media_jobs_v1'),false);
 }
});
test('original router uses protected on-date Brain reconciliation and exact-history completed receipt',()=>{
 const source=readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 assert.match(source,/reconcileHistoricalRejectedGeneratingJob\(db,\{job,ob\}\)/);
 assert.match(source,/originalProducerRejectedHandoff/);
 assert.match(source,/allowGeneratingExactHistory:originalProducerRejectedHandoff/);
 assert.match(source,/checkHistoricalMiraHistoryRejection\(db,manifest.openart_history_id\)/);
 assert.match(source,/if\(!fv\.body\?\.pass\|\|!miraFaceProofValid/);
});
