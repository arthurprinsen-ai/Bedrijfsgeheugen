import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcileHistoricalRejectedGeneratingJob,recordMediaProofRejection}
 from '../supabase/functions/powerhouse-instagram-media-router/preflight-write.mjs';

const history='NewVerifiedOpenArtHistory99';
const date='2026-11-03';
const job={id:'existing-daily-job',status:'WAITING_ASSET',publication_date:date,
 attempts:0,updated_at:'2026-11-03T10:00:00Z',
 asset_manifest:{openart_history_id:history,rejected_openart_history_id:history}};
const ob={status:'BLOCKED',updated_at:'2026-11-03T10:00:00Z',external_id:null,live_proven_at:null};
const proof={occurrence_id:'router:openart:'+history+':instagram:'+date+':start',
 fingerprint:'powerhouse|instagram-mira|video-frame-identity-below-094|20261022-v1',
 evidence:{openart_history_id:history,face_identity_confidence:0.9,frame_position:'start'}};
function dbWith(rows=[]){
 const calls=[];
 return {calls,db:{from(table){
   const record={table,filters:[]};calls.push(record);
   const chain={
    select(x){record.select=x;return chain;},
    update(x){record.update=x;return chain;},
    eq(k,v){record.filters.push(['eq',k,v]);return chain;},
    is(k,v){record.filters.push(['is',k,v]);return chain;},
    like(k,v){record.filters.push(['like',k,v]);return chain;},
    async limit(){return {data:rows,error:null};},
    async maybeSingle(){return {data:{id:job.id},error:null};}
   };
   return chain;
 }}};
}
test('original ONE BRAIN rejection restores only original media job to WAITING_PROOF',async()=>{
 const {db,calls}=dbWith([proof]);
 const r=await reconcileHistoricalRejectedGeneratingJob(db,{job,ob});
 assert.equal(r.kind,'rejected');
 assert.equal(r.score,'0.900');
 assert.equal(r.historyId,history);
 const updated=calls.filter(x=>x.update);
 assert.equal(updated.length,2);
 assert.equal(updated[0].table,'powerhouse_instagram_media_jobs_v1');
 assert.equal(updated[0].update.status,'WAITING_PROOF');
 assert.equal(updated[0].update.last_error,
  'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:start:face=0.900:openart='+history);
 for(const key of ['attempts','asset_manifest','proof_manifest','external_id','live_proven_at']){
   assert.equal(Object.hasOwn(updated[0].update,key),false,key);
 }
 assert.ok(updated[0].filters.some(([method,key,value])=>
  method==='eq'&&key==='updated_at'&&value===job.updated_at));
 assert.equal(Object.hasOwn(updated[1].update,'status'),false);
 assert.equal(Object.hasOwn(updated[1].update,'external_id'),false);
 assert.equal(calls.some(x=>/meta|provider_post|instagram_post/i.test(x.table)),false);
});
test('missing proof, missing pinned history, or existing provider post never fabricates recovery',async()=>{
 for(const item of [
  {j:job,o:ob,rows:[]},
  {j:{...job,asset_manifest:{}},o:ob,rows:[proof]},
  {j:job,o:{...ob,external_id:'178-real'},rows:[proof]},
  {j:{...job,status:'PROOF_VERIFIED'},o:ob,rows:[proof]},
  {j:job,o:ob,rows:[{...proof,evidence:{openart_history_id:'OTHER'}}]}
 ]){
  const {db,calls}=dbWith(item.rows);
  const r=await reconcileHistoricalRejectedGeneratingJob(db,{job:item.j,ob:item.o});
  assert.notEqual(r.kind,'rejected');
  assert.equal(calls.some(x=>x.table==='powerhouse_instagram_media_jobs_v1'&&x.update),false);
 }
});
test('unclaimed WAITING_ASSET video cannot bypass original CAS rejection writer',async()=>{
 const {db,calls}=dbWith([proof]);
 const r=await recordMediaProofRejection(db,{job,ob,
  code:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH',position:'start',
  historyId:history,confidence:0.9,assetUrl:'https://cdn.openart.ai/example.mp4'});
 assert.equal(r.kind,'ignored');
 assert.equal(calls.length,0);
});
test('original media router and identical Mira identity standard stay intact',()=>{
 const router=readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 const face=readFileSync('supabase/functions/_shared/mira-canonical-face.mjs','utf8');
 assert.match(face,/MIRA_IDENTITY_MIN_CONFIDENCE=0\.94/);
 assert.match(router,/reconcileHistoricalRejectedGeneratingJob\(db,\{job,ob\}\)/);
 assert.match(router,/if\(!fv\.body\?\.pass\|\|!miraFaceProofValid/);
 assert.match(router,/VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH/);
});
