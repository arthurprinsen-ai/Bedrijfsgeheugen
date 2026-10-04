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
    getSnapshot:()=>({mode:'authenticated'})
  };
  const domainState={
    get:()=>({portal:{}}),
    setDerived:(path,value)=>projected.push([path,value])
  };
  const fetchImpl=async(url,options={})=>{
    requests.push({url,options});
    if(options.method==='POST')return {ok:true,json:async()=>({duplicate:false})};
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
    getSnapshot:()=>({mode:'authenticated'})
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
