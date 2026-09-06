import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

const MAX_REPLAY=25;
function env(name){return Netlify.env.get(name)||'';}
function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}});}
function authorized(request){const supplied=request.headers.get('x-bg-service-token')||'';const expected=env('BG_PORTAL_EU_SERVICE_TOKEN');if(!supplied||!expected)return false;const a=Buffer.from(supplied);const b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b);}
async function dataHubPost(payload){const base=env('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');const token=env('BG_PORTAL_EU_SERVICE_TOKEN');if(!base||!token)return {ok:false,reason:'datahub-unconfigured'};try{const response=await fetch(`${base}/functions/v1/growth-datahub-ingest`,{method:'POST',headers:{'content-type':'application/json','x-bg-service-token':token},body:JSON.stringify(payload),signal:AbortSignal.timeout(3500)});return {ok:response.ok,status:response.status,reason:response.ok?'ok':'http-error'};}catch(error){return {ok:false,reason:error?.name==='TimeoutError'?'timeout':'network-error'};}}
async function deliver(envelope){const url=env('BG211_WEBHOOK_URL');if(!url)return {attempted:false,delivered:false,reason:'webhook-unconfigured'};try{const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event_json:JSON.stringify(envelope)}),signal:AbortSignal.timeout(3500)});return {attempted:true,delivered:response.ok,status:response.status,reason:response.ok?'accepted':'http-error'};}catch(error){return {attempted:true,delivered:false,reason:error?.name==='TimeoutError'?'timeout':'network-error'};}}
async function candidates(storeName){const store=getStore(storeName);const {blobs}=await store.list();return {store,keys:blobs.map(x=>x.key).slice(0,MAX_REPLAY)};}

export default async function handler(request,context){
  if(request.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:{allow:'POST','cache-control':'no-store'}});
  if(context?.deploy?.context!=='production')return json({error:'production-only'},403);
  if(!authorized(request))return json({error:'unauthorized'},401);
  if(env('BG211_DELIVERY_ENABLED')!=='true')return json({accepted:true,replayed:0,delivered:0,stopped:'delivery-disabled'},202);
  let replayed=0,delivered=0,failed=0;const results=[];
  for(const storeName of ['bg-growth-events','bg-growth-outcomes']){
    const {store,keys}=await candidates(storeName);
    for(const key of keys){
      if(replayed>=MAX_REPLAY)break;
      const record=await store.get(key,{type:'json'}).catch(()=>null);if(!record?.envelope||record?.delivery?.delivered||record?.state==='delivered')continue;
      replayed++;const delivery=await deliver(record.envelope);const kind=storeName==='bg-growth-events'?'event':'outcome';const sourceId=kind==='event'?record.envelope.event_id:(record.outcome?.outcome_id||record.envelope.event_id);const queueId=`${kind}:${sourceId}`;
      await dataHubPost({action:'brain_delivery',queue_id:queueId,state:delivery.delivered?'DELIVERED':'BLOCKED',attempted:delivery.attempted,attempts:(record.attempts||0)+(delivery.attempted?1:0),last_error:delivery.delivered?'':delivery.reason||''});
      await store.setJSON(key,{...record,state:delivery.delivered?'delivered':'datahub-persisted',delivery,last_attempt_at:new Date().toISOString(),attempts:(record.attempts||0)+(delivery.attempted?1:0)});
      results.push({kind,source_id:sourceId,delivered:delivery.delivered,reason:delivery.reason});
      if(delivery.delivered){delivered++;}else{failed++;break;}
    }
    if(failed||replayed>=MAX_REPLAY)break;
  }
  return json({accepted:true,replayed,delivered,failed,results},202);
}

export const config={path:'/api/growth-replay'};