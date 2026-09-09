import { getStore, getDeployStore } from '@netlify/blobs';
import { normalizeBehaviorEvent } from '../../tools/seo-growth/normalize-observation.mjs';
import { normalizeGrowthEventForDataHub } from '../../tools/seo-growth/datahub-contract.mjs';
import { toBg211Envelope } from '../../tools/seo-growth/bg211-envelope.mjs';
import { mapGrowthObservationToPowerhouseEvent } from '../../tools/seo-growth/powerhouse-core-map.mjs';
import { ingestPowerhouseEvent } from './_powerhouse-core-client.mjs';

const STORE='bg-growth-events';
const ALLOWED_ORIGIN=/^https:\/\/(?:www\.)?bedrijfsgeheugen\.nl$|^https:\/\/(?:deploy-preview-\d+--|main--)?bedrijfsgeheugen\.netlify\.app$/i;
const MAX_BYTES=16_384;

function json(data,status=200,headers={}){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8',...headers}});}
function safeKey(envelope){return `event/${envelope.fingerprint.replace(/[^a-z0-9|_-]/gi,'_')}/${String(envelope.event_id).replace(/[^a-z0-9_-]/gi,'_')}`;}
function env(name){return Netlify.env.get(name)||'';}
function storeForContext(context){return context?.deploy?.context==='production'?getStore(STORE):getDeployStore(STORE);}
function dataHubUrl(){const base=env('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');return base?`${base}/functions/v1/growth-datahub-ingest`:'';}
function coreEnv(){const base=env('POWERHOUSE_CORE_URL')||env('BG_PORTAL_EU_SUPABASE_URL')&&`${env('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'')}/functions/v1/powerhouse-runtime`;return {POWERHOUSE_CORE_URL:base,POWERHOUSE_CORE_TOKEN:env('POWERHOUSE_CORE_TOKEN')||env('BG_POWERHOUSE_CORE_TOKEN')};}
async function dataHubPost(payload){const url=dataHubUrl();const token=env('BG_PORTAL_EU_SERVICE_TOKEN');if(!url||!token)return {attempted:false,ok:false,reason:'datahub-unconfigured'};try{const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json','x-bg-service-token':token},body:JSON.stringify(payload),signal:AbortSignal.timeout(3500)});const body=await response.json().catch(()=>null);return {attempted:true,ok:response.ok,status:response.status,body,reason:response.ok?'ok':'http-error'};}catch(error){return {attempted:true,ok:false,reason:error?.name==='TimeoutError'?'timeout':'network-error'};}}
async function attemptDataHub(event){const result=await dataHubPost({action:'event',event});return {attempted:result.attempted,persisted:result.ok,status:result.status,reason:result.ok?'stored':result.reason,readback:result.ok?result.body?.result:null};}
async function attemptPowerhouseCore(observation,input){try{const event=mapGrowthObservationToPowerhouseEvent(observation,input);const body=await ingestPowerhouseEvent(event,{env:coreEnv(),fetchFn:fetch});return {attempted:true,persisted:true,event,readback:body};}catch(error){return {attempted:true,persisted:false,reason:String(error?.message||error)};}}

export default async function handler(request,context){
  if(request.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:{allow:'POST','cache-control':'no-store'}});
  const origin=request.headers.get('origin')||'';if(origin&&!ALLOWED_ORIGIN.test(origin))return json({error:'origin-not-allowed'},403);
  const raw=await request.text();if(Buffer.byteLength(raw,'utf8')>MAX_BYTES)return json({error:'payload-too-large'},413);
  let input;try{input=JSON.parse(raw);}catch{return json({error:'invalid-json'},400);}
  let observation;try{observation=normalizeBehaviorEvent(input);}catch(error){return json({error:'invalid-growth-event',detail:String(error.message||error)},422);}
  const envelope=toBg211Envelope(observation);
  let datahubEvent;try{datahubEvent=normalizeGrowthEventForDataHub({event_id:observation.event_id||envelope.event_id,event_type:observation.event_type,canonical:observation.canonical,intent:observation.intent_id,intent_owner:input.intent_owner||'',attribution_root_key:observation.attribution_root||input.attribution_root_key||'',source:observation.source,medium:observation.medium,campaign:input.campaign||'',occurred_at:observation.occurred_at||new Date().toISOString(),page_role:observation.page_role,funnel_stage:observation.funnel_stage,content_id:observation.content_id||input.content_id||'',content_type:observation.content_type||input.content_type||'',channel:observation.channel||input.channel||'',fingerprint:envelope.fingerprint});}catch(error){return json({error:'invalid-datahub-growth-event',detail:String(error.message||error)},422);}
  const store=storeForContext(context);const key=safeKey(envelope);const previous=await store.get(key,{type:'json'}).catch(()=>null);
  if(previous?.envelope?.event_id===envelope.event_id&&previous?.datahub?.persisted&&previous?.powerhouse_core?.persisted)return json({accepted:true,deduped:true,event_id:envelope.event_id,datahub:'persisted',powerhouse_core:'persisted'},202);
  const queuedAt=previous?.queued_at||new Date().toISOString();await store.setJSON(key,{state:'queued',queued_at:queuedAt,attempts:previous?.attempts||0,envelope,datahub_event:datahubEvent});
  const [datahub,powerhouseCore]=await Promise.all([attemptDataHub(datahubEvent),attemptPowerhouseCore(observation,input)]);
  const state=powerhouseCore.persisted?'powerhouse-core-persisted':datahub.persisted?'datahub-persisted':'degraded';
  await store.setJSON(key,{state,queued_at:queuedAt,last_attempt_at:new Date().toISOString(),attempts:(previous?.attempts||0)+1,datahub,powerhouse_core:powerhouseCore,envelope,datahub_event:datahubEvent});
  return json({accepted:true,deduped:false,event_id:envelope.event_id,datahub:datahub.persisted?'persisted':'queued',powerhouse_core:powerhouseCore.persisted?'persisted':'degraded'},powerhouseCore.persisted?202:503);
}

export const config={path:'/api/growth-event'};
