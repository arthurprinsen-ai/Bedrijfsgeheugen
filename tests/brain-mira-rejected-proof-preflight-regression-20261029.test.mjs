import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {writeMediaPreflight,reconcileHistoricalRejectedGeneratingJob}
  from '../supabase/functions/powerhouse-instagram-media-router/preflight-write.mjs';

const history='i6e9teMFpPH7YwZG4PMS';
const rejection='VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:start:face=0.900:openart='+history;
const job={
 id:'d84f2b1d-7e3e-4396-86b0-90a9072ef37f',
 tenant_id:'canonical',publication_date:'2026-10-29',status:'WAITING_PROOF',
 attempts:1,updated_at:'2026-10-29T15:06:00Z',last_error:rejection,
 next_action:'Do not reuse rejected OpenArt bytes.',
 asset_manifest:{openart_history_id:history},proof_manifest:{}
};
const obligation={status:'BLOCKED',updated_at:job.updated_at,external_id:null,live_proven_at:null};

function mockDb(historyRows=[]){
 const calls=[];
 const db={from(table){
  const c={table,filters:[]}; calls.push(c);
  const chain={
   select(x){c.select=x;return chain},
   update(x){c.update=x;return chain},
   eq(a,b){c.filters.push([a,b]);return chain},
   is(a,b){c.filters.push([a,b]);return chain},
   like(a,b){c.filters.push([a,b]);return chain},
   async limit(){return {data:historyRows,error:null}},
   async maybeSingle(){return {data:{id:job.id},error:null}}
  };return chain;
 }};
 return {db,calls};
}
const evidence={
 occurrence_id:'router:openart:'+history+':instagram:2026-10-29:start',
 fingerprint:'powerhouse|instagram-mira|video-frame-identity-below-094|20261022-v1',
 evidence:{openart_history_id:history,face_identity_confidence:0.9,frame_position:'start'}
};

test('rejected WAITING_PROOF without asset is never overwritten by repeated preflight',async()=>{
 const {db,calls}=mockDb();
 const proposed={...job,status:'WAITING_ASSET',last_error:null,
  next_action:'Producer must submit exact asset manifest to this router.',
  updated_at:'2026-10-29T15:09:01Z'};
 const result=await writeMediaPreflight(db,job,proposed);
 assert.deepEqual(result,{kind:'preserved',status:'WAITING_PROOF'});
 assert.equal(calls.length,0,'readiness poll must make ZERO writes');
});
test('a previously demoted WAITING_ASSET job restores exact immutable rejected history',async()=>{
 const demoted={...job,status:'WAITING_ASSET',last_error:null};
 const {db,calls}=mockDb([evidence]);
 const result=await reconcileHistoricalRejectedGeneratingJob(db,{job:demoted,ob:obligation});
 assert.equal(result.kind,'rejected');
 assert.equal(result.score,'0.900');
 const media=calls.find(c=>c.table==='powerhouse_instagram_media_jobs_v1');
 assert.equal(media.update.status,'WAITING_PROOF');
 assert.equal(media.update.last_error,rejection);
 assert.ok(media.filters.some(([k,v])=>k==='status'&&v==='WAITING_ASSET'));
 assert.ok(media.filters.some(([k,v])=>k==='updated_at'&&v===demoted.updated_at));
 assert.equal(Object.hasOwn(media.update,'attempts'),false);
 assert.equal(Object.hasOwn(media.update,'asset_manifest'),false);
 assert.ok(!calls.some(c=>c.table.includes('provider')));
});
test('no Brain proof, new approved asset or external provider ID means no rejection recovery',async()=>{
 const scenarios=[
  {job:{...job,status:'WAITING_ASSET',last_error:null},ob:obligation,rows:[]},
  {job:{...job,status:'PROOF_VERIFIED'},ob:obligation,rows:[evidence]},
  {job:{...job,status:'WAITING_ASSET',asset_manifest:{openart_history_id:history,asset_url:'https://media.example/new.mp4'}},ob:obligation,rows:[evidence]},
  {job:{...job,status:'WAITING_ASSET'},ob:{...obligation,external_id:'178-real'},rows:[evidence]},
  {job:{...job,status:'WAITING_ASSET'},ob:obligation,rows:[{...evidence,evidence:{openart_history_id:'different'}}]}
 ];
 for(const item of scenarios){
  const {db,calls}=mockDb(item.rows);
  const r=await reconcileHistoricalRejectedGeneratingJob(db,{job:item.job,ob:item.ob});
  assert.ok(['clear','ignored'].includes(r.kind));
  assert.equal(calls.some(c=>c.update&&c.table==='powerhouse_instagram_media_jobs_v1'),false);
 }
});
test('router preflight includes demoted slots and never authorizes second provider post',()=>{
 const source=readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 assert.match(source,/\['GENERATING','WAITING_ASSET','WAITING_PROVIDER_CONNECTION'\]\.includes\(clean\(job\?\.status\)\)/);
 assert.match(source,/reconcileHistoricalRejectedGeneratingJob\(db,\{job,ob\}\)/);
 assert.match(source,/if\(action==='preflight'&&sourceLed&&job\?\.status==='WAITING_PROOF'/);
});
