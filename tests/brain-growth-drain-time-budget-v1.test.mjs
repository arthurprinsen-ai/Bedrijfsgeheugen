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
    list(){
      lists++;
      return (async function*(){
        yield {blobs:[...data.keys()].map(key=>({key}))};
      })();
    },
    async get(key){return data.get(key)},
    async setJSON(key,record){writes++;data.set(key,record)}
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
