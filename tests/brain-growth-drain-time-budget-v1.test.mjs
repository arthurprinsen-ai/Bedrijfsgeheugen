import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
// The admission learning gate does not install npm packages. Execute the exact
// production function source, injecting provider mocks instead of loading Netlify SDK.
const code=readFileSync(new URL('../netlify/functions/growth-replay.mjs',import.meta.url),'utf8');
const begin=code.indexOf('export async function drainGrowthQueue(');
const end=code.indexOf('\nexport default async function handler',begin);
assert.ok(begin>=0&&end>begin,'production replay function not found');
const drainGrowthQueue=runInNewContext('('+code.slice(begin,end).replace(/^export /,'')+')',{
  MAX_REPLAY:25,getStore:()=>{throw Error('unexpected live store')},
  persistToDataHub:()=>{throw Error('unexpected live ingest')},
  deliver:()=>{throw Error('unexpected live delivery')},
  markBrainQueue:()=>{throw Error('unexpected live brain write')},
  env:()=>'',Math,Date
});

function fixture(keys){
  const data=new Map(keys.map(key=>[key,{
    envelope:{event_id:key},state:'queued',
    datahub_event:{event_id:key},attempts:0
  }]));
  let writes=0,lists=0;
  const store={
    list({prefix}={}){
      lists++;
      return (async function*(){
        yield {blobs:[...data.keys()].filter(key=>!prefix||key.startsWith(prefix)).map(key=>({key}))};
      })();
    },
    async get(key){return data.get(key)},
    async setJSON(key,record){writes++;data.set(key,record)},
    async delete(key){data.delete(key)}
  };
  return {data,store,stats:()=>({writes,lists})};
}
function noDelivery(){
  return {attempted:false,delivered:false,reason:'delivery-disabled'};
}
const noBrainWrite=async()=>({attempted:false});

test('cooperative budget checkpoints before starting the next provider mutation',async()=>{
  const f=fixture(['e1','e2','e3']);
  let tick=0,providerCalls=0;
  const options={
    includeOutcomes:false,maxReplay:10,clock:()=>tick,
    storeFactory:()=>f.store,deliveryEnabledFn:()=>false,
    persistFn:async()=>{providerCalls++;tick+=3_000;return{attempted:true,persisted:true,readback:{queue_id:'q'+providerCalls}}},
    dispatchFn:async()=>noDelivery(),brainQueueFn:noBrainWrite
  };
  const first=await drainGrowthQueue(options);
  assert.equal(first.replayed,1);
  assert.equal(first.persisted,1);
  assert.equal(first.budgetExpired,true);
  assert.equal(providerCalls,1);
  assert.equal(f.data.get('e1').state,'datahub-persisted');
  assert.equal(f.data.get('e2').state,'queued');
  tick=60_000;
  const second=await drainGrowthQueue(options);
  assert.equal(second.replayed,1,'subsequent scheduled invocation must resume pending evidence');
  assert.equal(providerCalls,2,'persisted disabled entry must not be written again');
  assert.equal(second.skippedPersisted,1);
  assert.equal(f.data.get('e2').state,'datahub-persisted');
});

test('event and outcome stores alternate priority, preventing permanent outcome starvation',async()=>{
  const seen=[];
  const storeA=fixture(['event']);
  const storeB=fixture(['outcome']);
  await drainGrowthQueue({
    maxReplay:1,clock:()=>60_000,storeFactory:name=>{
      seen.push(name);
      return name==='bg-growth-events'?storeA.store:storeB.store;
    },persistFn:async()=>({persisted:true,readback:{queue_id:'one'}}),
    dispatchFn:async()=>noDelivery(),brainQueueFn:noBrainWrite,deliveryEnabledFn:()=>false
  });
  assert.equal(seen[0],'bg-growth-outcomes');
  assert.equal(storeB.data.get('outcome').state,'datahub-persisted');
});

test('delivered receipts and persisted disabled transport never cause duplicate side effects',async()=>{
  const f=fixture(['sent','saved','fresh']);
  f.data.set('sent',{envelope:{event_id:'sent'},state:'delivered',delivery:{delivered:true}});
  f.data.set('saved',{envelope:{event_id:'saved'},state:'datahub-persisted',
    datahub:{persisted:true},delivery:noDelivery()});
  let writes=0;
  const result=await drainGrowthQueue({
    includeOutcomes:false,clock:()=>0,storeFactory:()=>f.store,
    deliveryEnabledFn:()=>false,persistFn:async()=>{writes++;return {persisted:true}},
    dispatchFn:async()=>noDelivery(),brainQueueFn:noBrainWrite
  });
  assert.equal(result.replayed,1);
  assert.equal(result.skippedPersisted,1);
  assert.equal(writes,1);
  assert.equal(f.data.get('saved').state,'datahub-persisted');
});

test('previously persisted transport can resume when a delivery channel becomes authorized',async()=>{
  const f=fixture(['saved']);
  f.data.set('saved',{envelope:{event_id:'saved'},state:'datahub-persisted',
    datahub:{persisted:true,readback:{queue_id:'saved-1'}},delivery:noDelivery()});
  let deliveries=0,persists=0;
  const result=await drainGrowthQueue({
    includeOutcomes:false,clock:()=>0,storeFactory:()=>f.store,
    deliveryEnabledFn:()=>true,
    persistFn:async(_kind,record)=>{persists++;return record.datahub},
    dispatchFn:async()=>{deliveries++;return{attempted:true,delivered:true,reason:'accepted'}},
    brainQueueFn:noBrainWrite
  });
  assert.equal(result.delivered,1);
  assert.equal(deliveries,1);
  assert.equal(persists,1);
  assert.equal(f.data.get('saved').state,'delivered');
});

test('indexed new event beats 500 immutable archived receipts',async()=>{
  const archived=Array.from({length:500},(_,i)=>'event/old-'+i),key='event/fresh',p='pending/'+key;
  const f=fixture([...archived,key]);
  for(const k of archived)f.data.set(k,{envelope:{event_id:k},state:'datahub-persisted',datahub:{persisted:true},delivery:noDelivery()});
  f.data.set(p,{source_key:key});
  let now=0,persistCalls=0;const read=f.store.get.bind(f.store);f.store.get=async k=>{now+=35;return read(k)};
  const result=await drainGrowthQueue({includeOutcomes:false,clock:()=>now,storeFactory:()=>f.store,deliveryEnabledFn:()=>false,
    persistFn:async()=>{persistCalls++;return {persisted:true,readback:{queue_id:'real'}}},
    dispatchFn:async()=>noDelivery(),brainQueueFn:noBrainWrite});
  assert.equal(result.persisted,1);assert.equal(persistCalls,1);assert.equal(result.indexedCompleted,1);
  assert.equal(f.data.has(p),false);assert.equal(f.data.get(key).datahub.persisted,true);
  assert.ok(archived.every(k=>f.data.has(k)),'historical receipts must remain');
});

test('failed provider keeps durable pointer for a safe later retry',async()=>{
  const key='event/retry',p='pending/'+key,f=fixture([key]);f.data.set(p,{source_key:key});
  const options={includeOutcomes:false,clock:()=>0,storeFactory:()=>f.store,deliveryEnabledFn:()=>false,
    dispatchFn:async()=>noDelivery(),brainQueueFn:noBrainWrite};
  const first=await drainGrowthQueue({...options,persistFn:async()=>({persisted:false,reason:'offline'})});
  assert.equal(first.failed,1);assert.equal(f.data.has(p),true);
  const next=await drainGrowthQueue({...options,persistFn:async()=>({persisted:true,readback:{queue_id:'ack'}})});
  assert.equal(next.persisted,1);assert.equal(f.data.has(p),false);assert.equal(f.data.get(key).datahub.persisted,true);
});

test('already-persisted receipt cleans index without duplicate provider effect',async()=>{
  const key='event/durable',p='pending/'+key,f=fixture([key]);
  f.data.set(key,{envelope:{event_id:key},state:'datahub-persisted',datahub:{persisted:true},delivery:noDelivery()});
  f.data.set(p,{source_key:key});let writes=0;
  await drainGrowthQueue({includeOutcomes:false,clock:()=>0,storeFactory:()=>f.store,deliveryEnabledFn:()=>false,
    persistFn:async()=>{writes++;return {persisted:true}},dispatchFn:async()=>noDelivery(),brainQueueFn:noBrainWrite});
  assert.equal(writes,0);assert.equal(f.data.has(p),false);assert.equal(f.data.has(key),true);
});
test('invalid and temporarily missing pending pointers cannot starve a good event',async()=>{
  const key='event/good',pointer='pending/'+key,f=fixture([key]);
  f.data.set('pending/event/corrupt',{source_key:'not-a-canonical-event-key'});
  f.data.set('pending/event/missing',{source_key:'event/absent'});
  f.data.set(pointer,{source_key:key});
  let sideEffects=0;
  const result=await drainGrowthQueue({includeOutcomes:false,clock:()=>0,storeFactory:()=>f.store,
    deliveryEnabledFn:()=>false,
    persistFn:async()=>{sideEffects++;return {persisted:true,readback:{queue_id:'confirmed'}}},
    dispatchFn:async()=>noDelivery(),brainQueueFn:noBrainWrite});
  assert.equal(result.indexIntegrityFailures,2);
  assert.equal(result.indexPointerInvalid,1);
  assert.equal(result.indexSourceMissing,1);
  assert.equal(result.persisted,1,'healthy event still reaches DataHub');
  assert.equal(result.healthy,false,'partial recovery never falsely green');
  assert.equal(sideEffects,1);
  assert.equal(f.data.get(key).datahub.persisted,true);
  assert.equal(f.data.has(pointer),false);
  assert.equal(f.data.has('pending/event/corrupt'),true,'defective pointer is retained for investigation');
  assert.equal(f.data.has('pending/event/missing'),true,'missing source must remain retryable');
});

test('scheduled drain does not emit a false-green 204 when pointer integrity is broken',()=>{
  const code=readFileSync(new URL('../netlify/functions/growth-drain.mjs',import.meta.url),'utf8');
  assert.match(code,/result\.failed>0\?503:204/);
  assert.match(code,/indexIntegrityFailures:result\.indexIntegrityFailures/);
});

test('concurrent index retirement after a list snapshot is benign; real work continues',async()=>{
  const gone='pending/event/already-finished',good='event/new',goodPointer='pending/'+good;
  const f=fixture([good]);
  f.data.set(gone,{source_key:'event/already-finished'});
  f.data.set(goodPointer,{source_key:good});
  const realGet=f.store.get.bind(f.store);
  f.store.get=async key=>{if(key===gone){f.data.delete(gone);return null;}return realGet(key)};
  let calls=0;
  const result=await drainGrowthQueue({includeOutcomes:false,clock:()=>0,
    storeFactory:()=>f.store,deliveryEnabledFn:()=>false,
    persistFn:async()=>{calls++;return {persisted:true,readback:{queue_id:'ok'}}},
    dispatchFn:async()=>noDelivery(),brainQueueFn:noBrainWrite});
  assert.equal(result.indexPointerGone,1);
  assert.equal(result.indexIntegrityFailures,0);
  assert.equal(result.failed,0);
  assert.equal(result.healthy,true);
  assert.equal(result.persisted,1);
  assert.equal(calls,1);
  assert.equal(f.data.get(good).datahub.persisted,true);
  assert.equal(f.data.has(goodPointer),false);
});

test('provider exception when reading an indexed pointer never masquerades as concurrent completion',async()=>{
  const key='event/good',bad='pending/event/unreadable',f=fixture([key]);
  f.data.set(bad,{source_key:'event/unreadable'});
  f.data.set('pending/'+key,{source_key:key});
  const realGet=f.store.get.bind(f.store);
  f.store.get=async p=>{if(p===bad)throw Error('provider unavailable');return realGet(p)};
  const result=await drainGrowthQueue({includeOutcomes:false,clock:()=>0,
    storeFactory:()=>f.store,deliveryEnabledFn:()=>false,
    persistFn:async()=>({persisted:true,readback:{queue_id:'ok'}}),
    dispatchFn:async()=>noDelivery(),brainQueueFn:noBrainWrite});
  assert.equal(result.indexReadFailures,1);
  assert.equal(result.indexPointerGone,0);
  assert.equal(result.failed,1);
  assert.equal(result.healthy,false);
  assert.equal(result.persisted,1,'independent valid event still persists');
  assert.equal(f.data.has(bad),true);
});

test('missing source is still a real independent integrity failure',async()=>{
  const good='event/ok',broken='pending/event/missing',f=fixture([good]);
  f.data.set(broken,{source_key:'event/not-there'});
  f.data.set('pending/'+good,{source_key:good});
  const result=await drainGrowthQueue({includeOutcomes:false,clock:()=>0,
    storeFactory:()=>f.store,deliveryEnabledFn:()=>false,
    persistFn:async()=>({persisted:true,readback:{queue_id:'ok'}}),
    dispatchFn:async()=>noDelivery(),brainQueueFn:noBrainWrite});
  assert.equal(result.indexSourceMissing,1);
  assert.equal(result.failed,1);
  assert.equal(result.indexPointerGone,0);
  assert.equal(result.persisted,1);
  assert.equal(f.data.has(broken),true);
});
test('legacy fallback skips indexed pointers and does not double report read failures',async()=>{
  const event='event/new',pointer='pending/'+event,f=fixture([event]);
  f.data.set(pointer,{source_key:event});
  let pointerReads=0;
  const originalGet=f.store.get.bind(f.store);
  f.store.get=async key=>{if(key===pointer)pointerReads++;return originalGet(key)};
  let persistCalls=0;
  const result=await drainGrowthQueue({includeOutcomes:false,clock:()=>0,
    storeFactory:()=>f.store,deliveryEnabledFn:()=>false,
    persistFn:async()=>{persistCalls++;return{persisted:true,readback:{queue_id:'ok'}}},
    dispatchFn:async()=>noDelivery(),brainQueueFn:noBrainWrite});
  assert.equal(pointerReads,1,'pending pointer only read in indexed lane');
  assert.equal(persistCalls,1,'source only sent once');
  assert.equal(result.indexIntegrityFailures,0);
  assert.equal(result.persisted,1);
});

test('a stale eventual source miss is recovered only by strong provider evidence',async()=>{
  const key='event/source-consistency',ptr='pending/'+key,f=fixture([key]);
  f.data.set(ptr,{source_key:key});
  const original=f.store.get.bind(f.store);let weak=0,strong=0,writes=0;
  f.store.get=async(k,options={})=>{
    if(k===key&&options.consistency==='strong'){strong++;return original(k)}
    if(k===key){weak++;return null}
    return original(k);
  };
  const result=await drainGrowthQueue({includeOutcomes:false,clock:()=>0,
    storeFactory:()=>f.store,deliveryEnabledFn:()=>false,
    persistFn:async()=>{writes++;return {persisted:true,readback:{queue_id:'verified'}}},
    dispatchFn:async()=>noDelivery(),brainQueueFn:noBrainWrite});
  // The legacy source fallback may perform a second eventual read; strong recovery
  // must still be exactly once and the persisted DataHub side effect exactly once.
  assert.ok(weak>=1);assert.equal(strong,1);
  assert.equal(result.sourceStrongRecovery,1);assert.equal(result.indexSourceMissing,0);
  assert.equal(result.persisted,1);assert.equal(result.failed,0);assert.equal(writes,1);
  assert.equal(f.data.get(key).datahub.persisted,true);assert.equal(f.data.has(ptr),false);
});

test('a stale eventual pointer miss is revalidated strongly before retirement',async()=>{
  const key='event/pointer-consistency',ptr='pending/'+key,f=fixture([key]);
  f.data.set(ptr,{source_key:key});
  const original=f.store.get.bind(f.store);let strong=0;
  f.store.get=async(k,options={})=>{
    if(k===ptr&&options.consistency==='strong'){strong++;return original(k)}
    if(k===ptr)return null;
    return original(k);
  };
  const result=await drainGrowthQueue({includeOutcomes:false,clock:()=>0,
    storeFactory:()=>f.store,deliveryEnabledFn:()=>false,
    persistFn:async()=>({persisted:true,readback:{queue_id:'verified'}}),
    dispatchFn:async()=>noDelivery(),brainQueueFn:noBrainWrite});
  assert.equal(strong,1);assert.equal(result.pointerStrongRecovery,1);
  assert.equal(result.indexPointerGone,0);assert.equal(result.persisted,1);
  assert.equal(result.healthy,true);
});

test('strong source read failure stays red and retains pending pointer',async()=>{
  const key='event/provider-stale',ptr='pending/'+key,f=fixture([key]);
  f.data.set(ptr,{source_key:key});
  const orig=f.store.get.bind(f.store);
  f.store.get=async(k,options={})=>{
    if(k===key&&options.consistency==='strong')throw Error('strong backend unavailable');
    if(k===key)return null;
    return orig(k);
  };
  const result=await drainGrowthQueue({includeOutcomes:false,clock:()=>0,
    storeFactory:()=>f.store,deliveryEnabledFn:()=>false,
    persistFn:async()=>{throw Error('must not invoke DataHub')} ,
    dispatchFn:async()=>noDelivery(),brainQueueFn:noBrainWrite});
  assert.equal(result.indexReadFailures,1);assert.equal(result.failed,1);
  assert.equal(result.healthy,false);assert.equal(result.persisted,0);
  assert.equal(f.data.has(ptr),true);assert.equal(f.data.has(key),true);
});
