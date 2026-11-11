import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPortalEvidence, buildPortalAction, portalCorrelationFromStored, createPowerhouseRuntimeBridge } from '../powerhouse-runtime-bridge.js';

class FakeBus {
  constructor(){this.listeners=new Map();}
  addEventListener(name,fn){const set=this.listeners.get(name)||new Set();set.add(fn);this.listeners.set(name,set);}
  removeEventListener(name,fn){this.listeners.get(name)?.delete(fn);}
  emit(name,detail){for(const fn of this.listeners.get(name)||[])fn({detail});}
}

const projection={
  tenantId:'tenant-a',
  records:[{id:'e1',type:'Evidence',observedAt:'2026-10-04T12:00:00Z'}],
  wholeBrainLoops:[],loopSummary:{complete:0,incomplete:0,total:0},
  integrationHealth:{components:[{name:'Supabase',healthy:true}]},
  verifiedValue:{verifiedValues:[]},livingMemory:{memories:[]},
  businessGraph:{nodes:[],edges:[]},executiveCockpit:{recommendedActions:[],openKnowledgeObligations:[],activityTimeline:[],openLoops:[]}
};

test('portal write result keeps the canonical PORTAL_INPUT correlation',()=>{
  assert.equal(portalCorrelationFromStored({sourceRevision:'abc123'}),'PORTAL_INPUT-abc123');
  assert.equal(portalCorrelationFromStored({}),'');
});

test('portal evidence is bounded and keeps predecessor lineage',()=>{
  const evidence=buildPortalEvidence({
    event:'portal_projection_synced',
    correlationId:'PORTAL_INPUT-abc',
    predecessorIds:['r1','r1','r2'],
    detail:{label:'x'.repeat(400),scenario:'base'}
  });
  assert.equal(evidence.type,'Evidence');
  assert.equal(evidence.correlationId,'PORTAL_INPUT-abc');
  assert.deepEqual(evidence.predecessorIds,['r1','r2']);
  assert.ok(evidence.payload.label.length<=220);
});

test('runtime bridge authenticates readback, writes same-lineage evidence and refreshes UI projection',async()=>{
  const bus=new FakeBus();
  const requests=[];
  const projected=[];
  const subscribers=new Set();
  const stateClient={
    authHeaders:async()=>({authorization:'Bearer identity-token'}),
    subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn);},
    getSnapshot:()=>({mode:'authenticated',user:{id:'user-tenant-a'}})
  };
  const domainState={
    get:()=>({portal:{}}),
    setDerived:(path,value)=>projected.push([path,value])
  };
  const fetchImpl=async(url,options={})=>{
    requests.push({url,options});
    if(options.method==='POST'){
      const record=JSON.parse(options.body);
      return {ok:true,json:async()=>({duplicate:false,record:{id:record.id,correlationId:record.correlationId}})};
    }
    return {ok:true,json:async()=>projection};
  };
  const bridge=createPowerhouseRuntimeBridge({stateClient,domainState,fetchImpl,eventTarget:bus,intervalMs:0,onRuntime:()=>{}});
  await bridge.refresh();
  assert.equal(requests[0].url,'/api/brain-operating-loop');
  assert.equal(requests[0].options.headers.authorization,'Bearer identity-token');
  assert.equal(projected.at(-1)[0],'portal.runtime');

  bus.emit('bg:portal-brain-synced',{stored:[{sourceRevision:'rev-42',brainRecordId:'brain-1',currentStateRecordId:'state-1'}]});
  await new Promise(resolve=>setTimeout(resolve,90));
  const post=requests.find(item=>item.options.method==='POST');
  assert.ok(post,'bridge schreef geen Brain-evidence');
  const body=JSON.parse(post.options.body);
  assert.equal(body.correlationId,'PORTAL_INPUT-rev-42');
  assert.deepEqual(body.predecessorIds,['brain-1','state-1']);
  assert.equal(body.payload.event,'portal_projection_synced');
  assert.equal(post.options.headers.authorization,'Bearer identity-token');
  assert.ok(requests.filter(item=>!item.options.method).length>=2,'na mutatie werd runtime niet teruggelezen');
  bridge.destroy();
});

test('portal action intent becomes a canonical requested Brain Action',()=>{
  const action=buildPortalAction({
    detail:{label:'Marge verbeteren',sourceType:'future_lens',scenario:'base',horizon:6,action:'create_action'},
    correlationId:'PORTAL_INPUT-rev-42',
    predecessorIds:['evidence-1'],
    id:'intent-1',
    idempotencyKey:'intent-key'
  });
  assert.equal(action.type,'Action');
  assert.equal(action.status,'REQUESTED');
  assert.equal(action.executed,false);
  assert.equal(action.correlationId,'PORTAL_INPUT-rev-42');
  assert.deepEqual(action.predecessorIds,['evidence-1']);
  assert.equal(action.payload.intent,'create_action');
  assert.equal(action.payload.sourceType,'future_lens');
});

test('runtime bridge persists action intents and reads the Brain projection back',async()=>{
  const bus=new FakeBus();
  const requests=[];
  const stateClient={
    authHeaders:async()=>({authorization:'Bearer identity-token'}),
    subscribe(){return()=>{};},
    getSnapshot:()=>({mode:'authenticated',user:{id:'user-tenant-a'}})
  };
  const domainState={get:()=>({portal:{}}),setDerived:()=>{}};
  const fetchImpl=async(url,options={})=>{
    requests.push({url,options});
    if(options.method==='POST'){
      const record=JSON.parse(options.body);
      return {ok:true,json:async()=>({duplicate:false,record:{id:record.id,correlationId:record.correlationId}})};
    }
    return {ok:true,json:async()=>projection};
  };
  const bridge=createPowerhouseRuntimeBridge({stateClient,domainState,fetchImpl,eventTarget:bus,intervalMs:0});
  bus.emit('bg:portal-brain-synced',{stored:[{sourceRevision:'rev-action',brainRecordId:'brain-1',currentStateRecordId:'state-1'}]});
  await new Promise(resolve=>setTimeout(resolve,90));
  bus.emit('portal:action-intent',{label:'Marge verbeteren',sourceType:'future_lens',action:'create_action'});
  await new Promise(resolve=>setTimeout(resolve,90));
  const posts=requests.filter(item=>item.options.method==='POST').map(item=>JSON.parse(item.options.body));
  const action=posts.find(item=>item.type==='Action');
  assert.ok(action,'actie-intentie werd niet canoniek opgeslagen');
  assert.equal(action.status,'REQUESTED');
  assert.equal(action.correlationId,'PORTAL_INPUT-rev-action');
  assert.equal(action.payload.label,'Marge verbeteren');
  assert.equal(action.payload.sourceType,'future_lens');
  assert.equal(requests.at(-1).options.method,undefined,'na Action-write moet canonical Brain readback volgen');
  bridge.destroy();
});

test('failed POST keeps the immutable record until the original refresh retries and exact ACK arrives',async()=>{
 const bus=new FakeBus();
 let attempts=0;const postBodies=[];
 const stateClient={getSnapshot:()=>({mode:'authenticated',user:{id:'tenant-user-A'}}),
  authHeaders:async()=>({authorization:'Bearer tenant-A'}),subscribe:()=>()=>{},isDemo:()=>false};
 const bridge=createPowerhouseRuntimeBridge({
  stateClient,domainState:{get:()=>null,setDerived:()=>{}},eventTarget:bus,intervalMs:0,
  fetchImpl:async(_url,options={})=>{
   if(options.method!=='POST')return {ok:true,json:async()=>projection};
   attempts++;postBodies.push(options.body);
   if(attempts===1)return {ok:false,status:503,json:async()=>({error:'TEMPORARY'})};
   const record=JSON.parse(options.body);
   return {ok:true,status:200,json:async()=>({record:{id:record.id,correlationId:record.correlationId}})};
  }
 });
 try{
  bus.emit('portal:action-intent',{label:'Orderstroom verbeteren',action:'create_action'});
  await new Promise(resolve=>setTimeout(resolve,70));
  assert.equal(attempts,1);
  assert.deepEqual(bridge.pendingHandoffs(),{pending:1,unverified:1},'no ACK means no deletion');
  await bridge.refresh();
  await new Promise(resolve=>setTimeout(resolve,25));
  assert.equal(attempts,2);
  assert.equal(postBodies[0],postBodies[1],'retry may not generate another ID, timestamp or content');
  assert.equal(bridge.pendingHandoffs().pending,0);
  await bridge.refresh();
  await new Promise(resolve=>setTimeout(resolve,25));
  assert.equal(attempts,2,'confirmed operation must never be sent twice');
 }finally{bridge.destroy();}
});

test('HTTP 200 without exact Brain record ID/correlation is not an acknowledgement',async()=>{
 const bus=new FakeBus();let attempts=0;const seen=[];
 const bridge=createPowerhouseRuntimeBridge({
  stateClient:{getSnapshot:()=>({mode:'authenticated',user:{id:'tenant-A'}}),
   authHeaders:async()=>({authorization:'Bearer tenant-A'}),subscribe:()=>()=>{},isDemo:()=>false},
  domainState:{get:()=>null,setDerived:()=>{}},eventTarget:bus,intervalMs:0,
  fetchImpl:async(_url,options={})=>{
   if(options.method!=='POST')return {ok:true,json:async()=>projection};
   attempts++;const record=JSON.parse(options.body);seen.push(record);
   return {ok:true,json:async()=>attempts===1
      ?{record:{id:'SOMEONE-ELSES-RECORD',correlationId:record.correlationId}}
      :{duplicate:true,record:{id:record.id,correlationId:record.correlationId}}};
  }
 });
 try{
  bus.emit('bg:portal-brain-synced',{stored:[{sourceRevision:'source-abc',brainRecordId:'r1',currentStateRecordId:'r2'}]});
  await new Promise(resolve=>setTimeout(resolve,100));
  assert.equal(bridge.pendingHandoffs().pending,1);
  await bridge.refresh();await new Promise(resolve=>setTimeout(resolve,25));
  assert.equal(attempts,2);
  assert.equal(seen[0].id,seen[1].id);
  assert.equal(bridge.pendingHandoffs().pending,0);
 }finally{bridge.destroy();}
});

test('identity switch discards old session queue before any network POST and resets action correlation',async()=>{
 const bus=new FakeBus();const subscribers=new Set();const posts=[];
 let user='tenant-A';let token='Bearer A';
 const stateClient={getSnapshot:()=>({mode:'authenticated',user:{id:user}}),
  authHeaders:async()=>({authorization:token}),subscribe:fn=>{subscribers.add(fn);return()=>subscribers.delete(fn);},isDemo:()=>false};
 const bridge=createPowerhouseRuntimeBridge({
  stateClient,domainState:{get:()=>null,setDerived:()=>{}},eventTarget:bus,intervalMs:0,
  fetchImpl:async(_url,options={})=>{
   if(options.method==='POST'){
    const record=JSON.parse(options.body);posts.push({record,token:options.headers.authorization});
    return {ok:true,json:async()=>({record:{id:record.id,correlationId:record.correlationId}})};
   }
   return {ok:true,json:async()=>projection};
  }
 });
 try{
  bus.emit('bg:portal-brain-synced',{stored:[{sourceRevision:'from-A',brainRecordId:'B-A',currentStateRecordId:'S-A'}]});
  assert.equal(bridge.pendingHandoffs().pending,1);
  user='tenant-B';token='Bearer B';
  for(const fn of subscribers)fn(stateClient.getSnapshot());
  assert.equal(bridge.pendingHandoffs().pending,0,'no old pending entry can move to tenant B');
  await new Promise(resolve=>setTimeout(resolve,95));
  assert.equal(posts.length,0,'tenant A data must not be posted under B bearer');
  bus.emit('portal:action-intent',{label:'Nieuwe actie B',action:'create_action'});
  await new Promise(resolve=>setTimeout(resolve,65));
  assert.equal(posts.length,1);
  assert.equal(posts[0].token,'Bearer B');
  assert.equal(posts[0].record.correlationId.startsWith('PORTAL_UI-'),true,'must not inherit tenant A correlation');
  assert.equal(bridge.pendingHandoffs().pending,0);
 }finally{bridge.destroy();}
});

test('network exception retains pending evidence until a later focus or readback',async()=>{
 const bus=new FakeBus();let fail=true;let posts=0;
 const bridge=createPowerhouseRuntimeBridge({
  stateClient:{getSnapshot:()=>({mode:'authenticated',user:{id:'tenant-A'}}),
   authHeaders:async()=>({authorization:'Bearer A'}),subscribe:()=>()=>{},isDemo:()=>false},
  domainState:{get:()=>null,setDerived:()=>{}},eventTarget:bus,intervalMs:0,
  fetchImpl:async(_url,options={})=>{
   if(options.method!=='POST')return {ok:true,json:async()=>projection};
   posts++;
   if(fail)throw new Error('offline');
   const record=JSON.parse(options.body);
   return {ok:true,json:async()=>({record:{id:record.id,correlationId:record.correlationId}})};
  }
 });
 try{
  bus.emit('portal:semantic-point-select',{metric:'response-time'});
  await new Promise(resolve=>setTimeout(resolve,300));
  assert.equal(posts,1);
  assert.equal(bridge.pendingHandoffs().pending,1);
  fail=false;
  await bridge.refresh();await new Promise(resolve=>setTimeout(resolve,30));
  assert.equal(posts,2);
  assert.equal(bridge.pendingHandoffs().pending,0);
 }finally{bridge.destroy();}
});

test('a second same-kind UI event never replaces a ready but unacknowledged Brain handoff',async()=>{
 const bus=new FakeBus();let accepts=false;const attempts=[];
 const stateClient={
  getSnapshot:()=>({mode:'authenticated',user:{id:'shared-user',app_metadata:{tenantId:'company-A'}}}),
  authHeaders:async()=>({authorization:'Bearer company-A'}),
  subscribe:()=>()=>{},isDemo:()=>false
 };
 const bridge=createPowerhouseRuntimeBridge({
  stateClient,domainState:{get:()=>null,setDerived:()=>{}},eventTarget:bus,intervalMs:0,
  fetchImpl:async(_url,opts={})=>{
   if(opts.method!=='POST')return {ok:true,json:async()=>projection};
   const record=JSON.parse(opts.body);attempts.push(record);
   if(!accepts)return {ok:false,status:503,json:async()=>({error:'RETRY'})};
   return {ok:true,json:async()=>({record:{id:record.id,correlationId:record.correlationId}})};
  }
 });
 try{
  bus.emit('portal:semantic-point-select',{metric:'first-metric'});
  await new Promise(resolve=>setTimeout(resolve,300));
  assert.equal(bridge.pendingHandoffs().pending,1);
  bus.emit('portal:semantic-point-select',{metric:'second-metric'});
  assert.equal(bridge.pendingHandoffs().pending,2,'unacknowledged first event must not disappear');
  await new Promise(resolve=>setTimeout(resolve,300));
  assert.equal(bridge.pendingHandoffs().pending,2);
  assert.ok(attempts.some(record=>record.payload.metric==='first-metric'));
  assert.ok(attempts.some(record=>record.payload.metric==='second-metric'));
  accepts=true;
  await bridge.refresh();await new Promise(resolve=>setTimeout(resolve,60));
  assert.equal(bridge.pendingHandoffs().pending,0,'both handoffs eventually get their own exact ACK');
  for(const metric of ['first-metric','second-metric']){
   const records=attempts.filter(record=>record.payload.metric===metric);
   assert.ok(records.length>=2,'failed same record must retry: '+metric);
   assert.equal(new Set(records.map(record=>record.idempotencyKey)).size,1,'original immutable key');
   assert.equal(new Set(records.map(record=>record.id)).size,1,'original immutable record ID');
  }
 }finally{bridge.destroy();}
});

test('tenant membership switch for the SAME user revokes all previous tenant pending records',async()=>{
 const bus=new FakeBus(),subscribers=new Set();let tenant='company-A';const sent=[];
 const client={
  getSnapshot:()=>({mode:'authenticated',user:{id:'same-user',app_metadata:{tenantId:tenant}}}),
  authHeaders:async()=>({authorization:'Bearer '+tenant}),
  subscribe:fn=>{subscribers.add(fn);return()=>subscribers.delete(fn);},
  isDemo:()=>false
 };
 const bridge=createPowerhouseRuntimeBridge({
  stateClient:client,domainState:{get:()=>null,setDerived:()=>{}},eventTarget:bus,intervalMs:0,
  fetchImpl:async(_url,opts={})=>{
   if(opts.method!=='POST')return {ok:true,json:async()=>projection};
   const record=JSON.parse(opts.body);sent.push({token:opts.headers.authorization,record});
   return {ok:true,json:async()=>({record:{id:record.id,correlationId:record.correlationId}})};
  }
 });
 try{
  bus.emit('portal:semantic-point-select',{metric:'tenant-A-private'});
  assert.equal(bridge.pendingHandoffs().pending,1);
  tenant='company-B';for(const fn of subscribers)fn(client.getSnapshot());
  assert.equal(bridge.pendingHandoffs().pending,0);
  await new Promise(resolve=>setTimeout(resolve,310));
  assert.equal(sent.length,0,'old private A item must not go out under B authorization');
  bus.emit('portal:semantic-point-select',{metric:'tenant-B-public'});
  await new Promise(resolve=>setTimeout(resolve,310));
  assert.equal(sent.length,1);
  assert.equal(sent[0].record.payload.metric,'tenant-B-public');
  assert.equal(sent[0].token,'Bearer company-B');
 }finally{bridge.destroy();}
});

test('the same source revision never creates concurrent duplicate runtime Brain evidence',async()=>{
 const bus=new FakeBus();let successful=false;const sent=[];
 const bridge=createPowerhouseRuntimeBridge({
  stateClient:{getSnapshot:()=>({mode:'authenticated',user:{id:'tenant-A',app_metadata:{tenantId:'a'}}}),
   authHeaders:async()=>({authorization:'Bearer a'}),subscribe:()=>()=>{},isDemo:()=>false},
  domainState:{get:()=>null,setDerived:()=>{}},eventTarget:bus,intervalMs:0,
  fetchImpl:async(_url,opts={})=>{
   if(opts.method!=='POST')return {ok:true,json:async()=>projection};
   const record=JSON.parse(opts.body);sent.push(record);
   return successful
    ?{ok:true,json:async()=>({record:{id:record.id,correlationId:record.correlationId}})}
    :{ok:false,json:async()=>({error:'retry'})};
  }
 });
 try{
  const source={stored:[{sourceRevision:'immutable-r1',brainRecordId:'brain-1',currentStateRecordId:'state-1'}]};
  bus.emit('bg:portal-brain-synced',source);
  await new Promise(resolve=>setTimeout(resolve,80));
  assert.equal(bridge.pendingHandoffs().pending,1);
  bus.emit('bg:portal-brain-synced',source);
  assert.equal(bridge.pendingHandoffs().pending,1,'same source ACK should not spawn a second handoff');
  successful=true;
  await bridge.refresh();await new Promise(resolve=>setTimeout(resolve,25));
  assert.equal(bridge.pendingHandoffs().pending,0);
  assert.equal(new Set(sent.map(record=>record.idempotencyKey)).size,1);
 }finally{bridge.destroy();}
});
