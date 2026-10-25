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

// The scheduled HTTP observer disconnects near 15s in production. Start no new side effect
// unless its worst-case provider timeouts fit a bounded runtime window.
// This is a cooperative budget, NOT a distributed lease or an exactly-once guarantee.
export async function drainGrowthQueue({
  maxReplay=MAX_REPLAY,includeOutcomes=true,maxRunMs=10_500,reserveMs=8_000,
  clock=Date.now,storeFactory=getStore,persistFn=persistToDataHub,
  dispatchFn=deliver,brainQueueFn=markBrainQueue,
  deliveryEnabledFn=()=>env('BG211_DELIVERY_ENABLED')==='true'&&Boolean(env('BG211_WEBHOOK_URL'))
}={}){
  let replayed=0,delivered=0,failed=0,persisted=0,scanned=0,pages=0,skippedPersisted=0,indexedSeen=0,indexedCompleted=0;
  const results=[];
  const startedAt=clock();
  const budgetMs=Math.max(1_000,Math.min(12_000,Number(maxRunMs)||10_500));
  const safetyReserveMs=Math.max(0,Math.min(budgetMs,Number(reserveMs)||8_000));
  const canStart=()=>clock()-startedAt+safetyReserveMs<=budgetMs;
  let budgetExpired=false;
  // Alternate first store each minute to prevent an event backlog starving outcomes.
  const stores=includeOutcomes?(Math.floor(startedAt/60_000)%2
    ? ['bg-growth-outcomes','bg-growth-events']
    : ['bg-growth-events','bg-growth-outcomes']):['bg-growth-events'];

  // Same minute executor: fresh, server-filtered index before archived receipts.
  const scans=stores.flatMap(storeName=>storeName==='bg-growth-events'
    ?[{storeName,prefix:'pending/',indexed:true},{storeName,indexed:false}]
    :[{storeName,indexed:false}]);
  for(const {storeName,prefix,indexed} of scans){
    if(!canStart()){budgetExpired=true;break;}
    const store=storeFactory(storeName);
    // Netlify's explicit pagination avoids downloading the entire historical blob catalog.
    // Delivered items are immutable receipts; scanning never deletes or replays them.
    for await(const page of store.list({paginate:true,...(prefix?{prefix}:{})})){
      pages++;
      for(const blob of page.blobs||[]){
        if(replayed>=maxReplay)break;
        if(!canStart()){budgetExpired=true;break;}
        scanned++;
      if(blob.key.startsWith('_control/'))continue;
      let sourceKey=blob.key;
      if(indexed){
        indexedSeen++;
        const pointer=await store.get(blob.key,{type:'json'}).catch(()=>null);
        if(!pointer||typeof pointer.source_key!=='string'||!pointer.source_key.startsWith('event/')){
          failed++;results.push({kind:'event',persisted:false,reason:'pending-pointer-invalid'});break;
        }
        sourceKey=pointer.source_key;
      }
      const record=await store.get(sourceKey,{type:'json'}).catch(()=>null);
      if(!record?.envelope){
        if(indexed){failed++;results.push({kind:'event',persisted:false,reason:'pending-source-missing'});break;}
        continue;
      }
      if(record.state==='delivered'||record.delivery?.delivered){
        if(indexed){await store.delete(blob.key);indexedCompleted++;}
        continue;
      }
      // Preserve the persisted receipt without repeating futile writes every minute.
      // If an authorized delivery channel becomes configured later, the item is retried.
      if(record?.datahub?.persisted&&record?.state==='datahub-persisted'&&
        record?.delivery?.reason==='delivery-disabled'&&!deliveryEnabledFn()){
        skippedPersisted++;
        if(indexed){await store.delete(blob.key);indexedCompleted++;}
        continue;
      }
      const kind=storeName==='bg-growth-events'?'event':'outcome';
      replayed++;

      const datahub=await persistFn(kind,record);
      if(!datahub.persisted){
        failed++;
        await store.setJSON(sourceKey,{
          ...record,
          state:'queued',
          datahub,
          last_attempt_at:new Date().toISOString(),
          attempts:Number(record?.attempts||0)+1
        });
        results.push({kind,key:sourceKey,persisted:false,delivered:false,reason:datahub.reason});
        break;
      }
      persisted++;

      const delivery=record?.delivery?.delivered?record.delivery:await dispatchFn(record.envelope);
      const attempts=Number(record?.attempts||0)+(delivery.attempted?1:0);
      const sourceId=kind==='event'?record.envelope.event_id:(record.outcome?.outcome_id||record.envelope.event_id);
      const queueId=datahub.readback?.queue_id||kind+':'+sourceId;
      const brainQueue=await brainQueueFn(queueId,delivery,attempts);
      const state=delivery.delivered?'delivered':'datahub-persisted';

      await store.setJSON(sourceKey,{
        ...record,
        state,
        datahub,
        delivery,
        brain_queue:brainQueue,
        last_attempt_at:new Date().toISOString(),
        attempts
      });
      // Never delete the canonical receipt: retire index only after original is persisted.
      if(indexed&&(delivery.delivered||!delivery.attempted)){
        await store.delete(blob.key);indexedCompleted++;
      }
      results.push({kind,source_id:sourceId,persisted:true,delivered:delivery.delivered,reason:delivery.reason});
      if(delivery.delivered)delivered++;
      if(delivery.attempted&&!delivery.delivered){failed++;break;}
      }
      if(failed||budgetExpired||replayed>=maxReplay)break;
    }
    if(failed||budgetExpired||replayed>=maxReplay)break;
  }

  return {accepted:true,replayed,persisted,delivered,failed,results,
    budgetExpired,elapsedMs:Math.max(0,clock()-startedAt),scanned,pages,skippedPersisted,indexedSeen,indexedCompleted};

}

export default async function handler(request,context){
  if(request.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:{allow:'POST','cache-control':'no-store'}});
  if(context?.deploy?.context!=='production')return json({error:'production-only'},403);
  if(!authorized(request))return json({error:'unauthorized'},401);
  const result=await drainGrowthQueue({maxReplay:MAX_REPLAY,includeOutcomes:true});
  return json(result,202);
}

export const config={path:'/api/growth-replay'};
