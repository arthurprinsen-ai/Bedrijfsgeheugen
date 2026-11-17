import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessMiraOriginalGenerationReceipt,MIRA_ORIGINAL_GENERATION_RECEIPT_CONTRACT,
 MIRA_ORIGINAL_PROJECT_ID,MIRA_ORIGINAL_MASTER_ID,MIRA_ORIGINAL_MASTER_URL}
 from '../supabase/functions/powerhouse-instagram-media-router/pin-generation-history.mjs';

const runDate='2026-11-18';
const winner='8e8708d1-a4c4-4f9a-ad58-22ed62802e6b';
const jobId='6d457a4e-665c-4ca7-aa2e-f430e6eaf047';
const historyId='AbC0123efGH45678';
const scene='Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: DSO stijgt. Ze zoekt wie het oppakt.';
const job=()=>({
 id:jobId,tenant_id:'canonical',publication_date:runDate,channel:'instagram',
 post_type:'reel',status:'CLAIMED',attempts:1,
 required_provider:'openart',selected_provider:'openart',allowed_providers:['openart'],
 republish_forbidden:false,last_error:null,updated_at:'2026-11-17T10:01:00Z',
 asset_manifest:{claimed_by:'canonical-mira-original-producer',claimed_at:'2026-11-17T10:00:00Z',
 openart_project_id:MIRA_ORIGINAL_PROJECT_ID,
 daily_winner_recommendation_id:winner,recommendation_id:winner}
});
const valid=()=>({
 runDate,localDate:'2026-11-17',job:job(),
 ob:{tenant_id:'canonical',publication_date:runDate,status:'BLOCKED',
   external_id:null,live_proven_at:null,evidence:{}},
 winner:{run_date:runDate,recommendation_id:winner},
 lineage:{run_date:runDate,winner_recommendation_id:winner,state:'WINNER_FROZEN'},
 resolved:{kind:'approved_frozen_library_mapping',winner_recommendation_id:winner,
   problem:{id:'PH-P010',scene}},
 postType:'reel',
 input:{job_id:jobId,worker:'canonical-mira-original-producer',recommendation_id:winner,
   scene,canonical_problem_id:'PH-P010',openart_project_id:MIRA_ORIGINAL_PROJECT_ID,
   openart_reference_id:MIRA_ORIGINAL_MASTER_ID,openart_reference_url:MIRA_ORIGINAL_MASTER_URL,
   model:'wan3-0',mode:'element2video',quoted_credits:640,
   openart_history_id:historyId,provider_status:'PENDING'}
});
test('the original unspent claim alone admits one pinned async provider history, not a Meta post',()=>{
 const result=assessMiraOriginalGenerationReceipt(valid());
 assert.equal(result.ok,true);
 assert.equal(result.idempotent,false);
 assert.equal(result.history_id,historyId);
 assert.equal(result.job_id,jobId);
 assert.equal(result.claimed_by,'canonical-mira-original-producer');
 assert.equal(result.contract,MIRA_ORIGINAL_GENERATION_RECEIPT_CONTRACT);
 assert.equal(result.approved_for_publish,false);
 assert.equal(result.actual_media_verified,false);
});
test('same owner and provider history is replay-idempotent but different history refuses without extra spend',()=>{
 const v=valid();v.job.status='GENERATING';v.job.asset_manifest.openart_history_id=historyId;
 const reused=assessMiraOriginalGenerationReceipt(v);
 assert.equal(reused.ok,true);assert.equal(reused.idempotent,true);
 v.input.openart_history_id='DifferentHistory891';
 assert.equal(assessMiraOriginalGenerationReceipt(v).code,'ORIGINAL_HISTORY_IMMUTABLE_CONFLICT');
});
test('source, tenant, provider and owner are CAS-frozen and day must be current/next',()=>{
 const cases=[
 v=>{v.runDate='2026-11-09';v.job.publication_date='2026-11-09';v.ob.publication_date='2026-11-09';v.winner.run_date='2026-11-09';v.lineage.run_date='2026-11-09'},
 v=>{v.job.publication_date='2026-11-17'},
 v=>{v.job.tenant_id='other'},
 v=>{v.job.selected_provider='placid'},
 v=>{v.job.allowed_providers=[]},
 v=>{v.job.status='WAITING_ASSET'},
 v=>{v.job.attempts=2},
 v=>{v.job.asset_manifest.claimed_by='other'},
 v=>{v.input.worker='other'},
 v=>{v.input.job_id='different'},
 v=>{v.winner.recommendation_id='different'},
 v=>{v.lineage.winner_recommendation_id='different'},
 v=>{v.lineage.state='RECOMMENDATION_MATERIALIZED'},
 v=>{v.job.asset_manifest.daily_winner_recommendation_id='different'},
 v=>{v.resolved.problem.scene='different'},
 v=>{v.input.canonical_problem_id='PH-P007'},
 v=>{v.input.scene='different'},
 v=>{v.resolved.kind='pre_freeze_legacy'},
 v=>{v.postType='image'}
 ];
 for(const modify of cases){
   const v=valid();modify(v);
   assert.equal(assessMiraOriginalGenerationReceipt(v).ok,false,
     JSON.stringify(v).slice(0,250));
 }
});
test('never accept an already sent or vetoed post or unverified/costly generation',()=>{
 const cases=[
 v=>{v.ob.external_id='17992107825115789'},
 v=>{v.ob.live_proven_at='2026-11-17T10:00:00Z'},
 v=>{v.job.republish_forbidden=true},
 v=>{v.ob.evidence.republish_forbidden=true},
 v=>{v.ob.evidence.veto={active:true}},
 v=>{v.ob.evidence.veto={active:'true'}},
 v=>{v.ob.status='LIVE_PROVEN'},
 v=>{v.job.asset_manifest.openart_history_id='alreadyCostId'},
 v=>{v.job.asset_manifest.asset_url='https://cdn.openart.ai/test.mp4'},
 v=>{v.input.openart_history_id='bad-id!' },
 v=>{v.input.model='veo3-1'},
 v=>{v.input.mode='text2video'},
 v=>{v.input.openart_reference_id='wrong'},
 v=>{v.input.openart_reference_url='https://fake.example/mira.jpg'},
 v=>{v.input.openart_project_id='other'},
 v=>{v.input.quoted_credits=641},
 v=>{v.input.quoted_credits=0},
 v=>{v.input.quoted_credits='none'},
 v=>{v.input.provider_status='FAILED'},
 v=>{v.input.asset_url='https://cdn.openart.ai/test.mp4'},
 v=>{v.job.last_error='REJECTED_HISTORY'}
 ];
 for(const modify of cases){
  const v=valid();modify(v);
  assert.equal(assessMiraOriginalGenerationReceipt(v).ok,false,JSON.stringify(v).slice(0,250));
 }
});
test('the original authenticated router inserts the receipt before any publish, with atomic compare-and-swap',()=>{
 const router=readFileSync(new URL('../supabase/functions/powerhouse-instagram-media-router/index.ts',import.meta.url),'utf8');
 const helper=readFileSync(new URL('../supabase/functions/powerhouse-instagram-media-router/pin-generation-history.mjs',import.meta.url),'utf8');
 const receipt=router.indexOf("if(action==='pin_generation')");
 const verify=router.indexOf("if(action==='submit_asset'){",receipt);
 assert.ok(receipt>0&&verify>receipt);
 assert.match(router,/assessMiraOriginalGenerationReceipt\(/);
 assert.match(router,/\.eq\('status','CLAIMED'\)\.eq\('attempts',1\)\.eq\('updated_at',job.updated_at\)/);
 assert.match(router,/\.is\('last_error',null\)\.eq\('republish_forbidden',false\)/);
 assert.match(router,/\.select\('id'\)\.maybeSingle\(\)/);
 assert.match(router,/ORIGINAL_GENERATION_CAS_CONFLICT_REREAD/);
 assert.match(router,/approved_for_publish:false,actual_media_verified:false/);
 assert.doesNotMatch(helper,/fetch\(|cron\.schedule|net\.http_post|GENUI|instagram\.com\/media_publish/);
 assert.ok(router.includes("if(action==='generation_preflight')"));
 assert.ok(router.includes("if(action==='submit_asset')"));
});
