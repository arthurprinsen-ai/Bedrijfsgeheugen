import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

const MAX_REPLAY=25;
const DATAHUB_TIMEOUT_MS=2_500;
function env(name){return Netlify.env.get(name)||'';}
function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}});}
function authorized(request){const supplied=request.headers.get('x-bg-service-token')||'';const expected=env('BG_PORTAL_EU_SERVICE_TOKEN');if(!supplied||!expected)return false;const a=Buffer.from(supplied);const b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b);}
async function dataHubPost(payload){
  const base=env('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');
  const token=env('BG_PORTAL_EU_SERVICE_TOKEN');
  if(!base||!token)return {attempted:false,ok:false,reason:'datahub-unconfigured'};
  try{
    const response=await fetch(base+'/functions/v1/growth-datahub-ingest',{
      method:'POST',
      headers:{'content-type':'application/json','x-bg-service-token':token},
      body:JSON.stringify(payload),
      signal:AbortSignal.timeout(DATAHUB_TIMEOUT_MS)
    });
    const body=await response.json().catch(()=>null);
    return {attempted:true,ok:response.ok,status:response.status,body,reason:response.ok?'ok':'http-error'};
  }catch(error){
    return {attempted:true,ok:false,reason:error?.name==='TimeoutError'||error?.name==='AbortError'?'timeout':'network-error'};
  }
}
async function deliver(envelope){
  const url=env('BG211_WEBHOOK_URL');
  if(!url||env('BG211_DELIVERY_ENABLED')!=='true')return {attempted:false,delivered:false,reason:'delivery-disabled'};
  try{
    const response=await fetch(url,{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({event_json:JSON.stringify(envelope)}),
      signal:AbortSignal.timeout(2_500)
    });
    return {attempted:true,delivered:response.ok,status:response.status,reason:response.ok?'accepted':'http-error'};
  }catch(error){
    return {attempted:true,delivered:false,reason:error?.name==='TimeoutError'||error?.name==='AbortError'?'timeout':'network-error'};
  }
}
async function persistToDataHub(kind,record){
  if(record?.datahub?.persisted)return record.datahub;
  const payload=kind==='event'?{action:'event',event:record.datahub_event}:{action:'outcome',outcome:record.outcome};
  if(kind==='event'&&!record?.datahub_event)return {attempted:false,persisted:false,reason:'datahub-event-missing'};
  if(kind==='outcome'&&!record?.outcome)return {attempted:false,persisted:false,reason:'datahub-outcome-missing'};
  const result=await dataHubPost(payload);
  return {attempted:result.attempted,persisted:result.ok,status:result.status,reason:result.ok?'stored':result.reason,readback:result.ok?result.body?.result:null};
}
async function markBrainQueue(queueId,delivery,attempts){
  if(!queueId)return {attempted:false,ok:false,reason:'queue-id-missing'};
  if(!delivery.attempted&&!delivery.delivered)return {attempted:false,ok:false,reason:'delivery-not-attempted'};
  const state=delivery.delivered?'DELIVERED':'BLOCKED';
  return dataHubPost({action:'brain_delivery',queue_id:queueId,state,attempted:delivery.attempted,attempts,last_error:delivery.delivered?'':delivery.reason||''});
}

export async function drainGrowthQueue({maxReplay=MAX_REPLAY,includeOutcomes=true}={}){
  let replayed=0,delivered=0,failed=0,persisted=0;
  const results=[];
  const stores=includeOutcomes?['bg-growth-events','bg-growth-outcomes']:['bg-growth-events'];

  for(const storeName of stores){
    const store=getStore(storeName);
    const {blobs}=await store.list();
    for(const blob of blobs){
      if(replayed>=maxReplay)break;
      if(blob.key.startsWith('_control/'))continue;
      const record=await store.get(blob.key,{type:'json'}).catch(()=>null);
      if(!record?.envelope||record?.state==='delivered'||record?.delivery?.delivered)continue;
      const kind=storeName==='bg-growth-events'?'event':'outcome';
      replayed++;

      const datahub=await persistToDataHub(kind,record);
      if(!datahub.persisted){
        failed++;
        await store.setJSON(blob.key,{
          ...record,
          state:'queued',
          datahub,
          last_attempt_at:new Date().toISOString(),
          attempts:Number(record?.attempts||0)+1
        });
        results.push({kind,key:blob.key,persisted:false,delivered:false,reason:datahub.reason});
        break;
      }
      persisted++;

      const delivery=record?.delivery?.delivered?record.delivery:await deliver(record.envelope);
      const attempts=Number(record?.attempts||0)+(delivery.attempted?1:0);
      const sourceId=kind==='event'?record.envelope.event_id:(record.outcome?.outcome_id||record.envelope.event_id);
      const queueId=datahub.readback?.queue_id||kind+':'+sourceId;
      const brainQueue=await markBrainQueue(queueId,delivery,attempts);
      const state=delivery.delivered?'delivered':'datahub-persisted';

      await store.setJSON(blob.key,{
        ...record,
        state,
        datahub,
        delivery,
        brain_queue:brainQueue,
        last_attempt_at:new Date().toISOString(),
        attempts
      });
      results.push({kind,source_id:sourceId,persisted:true,delivered:delivery.delivered,reason:delivery.reason});
      if(delivery.delivered)delivered++;
      if(delivery.attempted&&!delivery.delivered){failed++;break;}
    }
    if(failed||replayed>=maxReplay)break;
  }

  return {accepted:true,replayed,persisted,delivered,failed,results};
}

export default async function handler(request,context){
  if(request.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:{allow:'POST','cache-control':'no-store'}});
  if(context?.deploy?.context!=='production')return json({error:'production-only'},403);
  if(!authorized(request))return json({error:'unauthorized'},401);
  const result=await drainGrowthQueue({maxReplay:MAX_REPLAY,includeOutcomes:true});
  return json(result,202);
}

export const config={path:'/api/growth-replay'};
