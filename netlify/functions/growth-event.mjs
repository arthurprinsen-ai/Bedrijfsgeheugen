import { getStore, getDeployStore } from '@netlify/blobs';
import { normalizeBehaviorEvent } from '../../tools/seo-growth/normalize-observation.mjs';
import { toBg211Envelope } from '../../tools/seo-growth/bg211-envelope.mjs';

const STORE='bg-growth-events';
const ALLOWED_ORIGIN=/^https:\/\/(?:www\.)?bedrijfsgeheugen\.nl$|^https:\/\/(?:deploy-preview-\d+--|main--)?bedrijfsgeheugen\.netlify\.app$/i;
const MAX_BYTES=16_384;

function json(data,status=200,headers={}){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8',...headers}});}
function safeKey(envelope){return `event/${envelope.fingerprint.replace(/[^a-z0-9|_-]/gi,'_')}/${String(envelope.event_id).replace(/[^a-z0-9_-]/gi,'_')}`;}
function env(name){return Netlify.env.get(name)||'';}
function storeForContext(context){return context?.deploy?.context==='production'?getStore(STORE):getDeployStore(STORE);}

async function attemptBg211(envelope){
  const url=env('BG211_WEBHOOK_URL');
  if(!url||env('BG211_DELIVERY_ENABLED')!=='true')return {attempted:false,delivered:false,reason:'delivery-disabled'};
  try{
    const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_json:JSON.stringify(envelope)}),signal:AbortSignal.timeout(3500)});
    return {attempted:true,delivered:response.ok,status:response.status,reason:response.ok?'accepted':'http-error'};
  }catch(error){return {attempted:true,delivered:false,reason:error?.name==='TimeoutError'?'timeout':'network-error'};}
}

export default async function handler(request,context){
  if(request.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:{allow:'POST','cache-control':'no-store'}});
  const origin=request.headers.get('origin')||'';
  if(origin&&!ALLOWED_ORIGIN.test(origin))return json({error:'origin-not-allowed'},403);
  const raw=await request.text();
  if(Buffer.byteLength(raw,'utf8')>MAX_BYTES)return json({error:'payload-too-large'},413);
  let input;try{input=JSON.parse(raw);}catch{return json({error:'invalid-json'},400);}
  let observation;try{observation=normalizeBehaviorEvent(input);}catch(error){return json({error:'invalid-growth-event',detail:String(error.message||error)},422);}
  const envelope=toBg211Envelope(observation);
  const store=storeForContext(context);
  const key=safeKey(envelope);
  const previous=await store.get(key,{type:'json'}).catch(()=>null);
  if(previous?.envelope?.event_id===envelope.event_id)return json({accepted:true,deduped:true,event_id:envelope.event_id},202);
  const queuedAt=new Date().toISOString();
  await store.setJSON(key,{state:'queued',queued_at:queuedAt,attempts:0,envelope});
  const delivery=await attemptBg211(envelope);
  await store.setJSON(key,{state:delivery.delivered?'delivered':'queued',queued_at:queuedAt,last_attempt_at:delivery.attempted?new Date().toISOString():null,attempts:delivery.attempted?1:0,delivery,envelope});
  return json({accepted:true,deduped:false,delivery:delivery.delivered?'delivered':'queued',event_id:envelope.event_id},202);
}

export const config={path:'/api/growth-event'};
