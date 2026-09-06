import { getStore, getDeployStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';
import { normalizeGrowthOutcome } from '../../tools/seo-growth/datahub-contract.mjs';
import { normalizeUniversalEvent } from '../../tools/universal-event-envelope.mjs';

const STORE='bg-growth-outcomes';
const MAX_BYTES=16_384;
function env(name){return Netlify.env.get(name)||'';}
function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}});}
function storeForContext(context){return context?.deploy?.context==='production'?getStore(STORE):getDeployStore(STORE);}
function authorized(request){const supplied=request.headers.get('x-bg-service-token')||'';const expected=env('BG_PORTAL_EU_SERVICE_TOKEN');if(!supplied||!expected)return false;const a=Buffer.from(supplied);const b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b);}
function keyFor(outcome){return `outcome/${outcome.outcome_id.replace(/[^a-z0-9_-]/gi,'_')}`;}
function dataHubUrl(){const base=env('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');return base?`${base}/functions/v1/growth-datahub-ingest`:'';}
async function dataHubPost(payload){const url=dataHubUrl();const token=env('BG_PORTAL_EU_SERVICE_TOKEN');if(!url||!token)return {attempted:false,ok:false,reason:'datahub-unconfigured'};try{const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json','x-bg-service-token':token},body:JSON.stringify(payload),signal:AbortSignal.timeout(3500)});const body=await response.json().catch(()=>null);return {attempted:true,ok:response.ok,status:response.status,body,reason:response.ok?'ok':'http-error'};}catch(error){return {attempted:true,ok:false,reason:error?.name==='TimeoutError'?'timeout':'network-error'};}}
async function attemptDataHub(outcome){const result=await dataHubPost({action:'outcome',outcome});return {attempted:result.attempted,persisted:result.ok,status:result.status,reason:result.ok?'stored':result.reason,readback:result.ok?result.body?.result:null};}
async function markBrainQueue(queueId,delivery){if(!queueId)return {attempted:false,ok:false,reason:'queue-id-missing'};const state=delivery.delivered?'DELIVERED':delivery.attempted?'BLOCKED':'QUEUED';return dataHubPost({action:'brain_delivery',queue_id:queueId,state,attempted:delivery.attempted,attempts:delivery.attempted?1:0,last_error:delivery.delivered?'':delivery.reason||''});}
async function attemptBg211(envelope){const url=env('BG211_WEBHOOK_URL');if(!url||env('BG211_DELIVERY_ENABLED')!=='true')return {attempted:false,delivered:false,reason:'delivery-disabled'};try{const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_json:JSON.stringify(envelope)}),signal:AbortSignal.timeout(3500)});return {attempted:true,delivered:response.ok,status:response.status,reason:response.ok?'accepted':'http-error'};}catch(error){return {attempted:true,delivered:false,reason:error?.name==='TimeoutError'?'timeout':'network-error'};}}

export default async function handler(request,context){
  if(request.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:{allow:'POST','cache-control':'no-store'}});
  if(!authorized(request))return json({error:'unauthorized'},401);
  const raw=await request.text();if(Buffer.byteLength(raw,'utf8')>MAX_BYTES)return json({error:'payload-too-large'},413);
  let input;try{input=JSON.parse(raw);}catch{return json({error:'invalid-json'},400);}
  let outcome;try{outcome=normalizeGrowthOutcome(input);}catch(error){return json({error:'invalid-growth-outcome',detail:String(error.message||error)},422);}
  const envelope=normalizeUniversalEvent({event_id:outcome.outcome_id,occurred_at:outcome.occurred_at,source_system:'commercial-outcome',producer_id:'growth-datahub-outcome',domain:'growth',event_type:'business-outcome',severity:'info',entity_keys:[outcome.canonical,outcome.intent_owner].filter(Boolean),correlation_id:outcome.fingerprint,attribution_root_key:outcome.attribution_root_key,evidence_refs:[],payload:outcome,payload_class:'learning',privacy_class:'non-pii-analytics',retention_tier:'tiered-v1',cost_units:0,status:'OBSERVED'});
  const store=storeForContext(context);const key=keyFor(outcome);const previous=await store.get(key,{type:'json'}).catch(()=>null);
  if(previous?.outcome?.outcome_id===outcome.outcome_id&&previous?.datahub?.persisted)return json({accepted:true,deduped:true,outcome_id:outcome.outcome_id,datahub:'persisted',brain:previous?.delivery?.delivered?'delivered':'queued'},202);
  const queuedAt=previous?.queued_at||new Date().toISOString();await store.setJSON(key,{state:'queued',queued_at:queuedAt,outcome,envelope});
  const datahub=await attemptDataHub(outcome);const delivery=await attemptBg211(envelope);const queueId=datahub.readback?.queue_id||`outcome:${outcome.outcome_id}`;const brainQueue=datahub.persisted?await markBrainQueue(queueId,delivery):{attempted:false,ok:false,reason:'datahub-not-persisted'};const state=delivery.delivered?'delivered':datahub.persisted?'datahub-persisted':'queued';
  await store.setJSON(key,{state,queued_at:queuedAt,datahub,delivery,brain_queue:brainQueue,outcome,envelope,last_attempt_at:(datahub.attempted||delivery.attempted)?new Date().toISOString():null});
  return json({accepted:true,deduped:false,outcome_id:outcome.outcome_id,datahub:datahub.persisted?'persisted':'queued',brain:delivery.delivered?'delivered':'queued'},202);
}

export const config={path:'/api/growth-outcome'};