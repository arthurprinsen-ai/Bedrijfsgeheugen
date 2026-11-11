import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPowerhouseRuntimeBridge} from '../portal-v2/powerhouse-runtime-bridge.js';

const tick=ms=>new Promise(resolve=>setTimeout(resolve,ms));
class Bus {
 constructor(){this.listeners=new Map();}
 addEventListener(name,handler){const set=this.listeners.get(name)||new Set();set.add(handler);this.listeners.set(name,set);}
 removeEventListener(name,handler){this.listeners.get(name)?.delete(handler);}
 emit(name,detail){for(const handler of this.listeners.get(name)||[])handler({detail});}
}
const projection={
 tenantId:'test-tenant',records:[],wholeBrainLoops:[],
 loopSummary:{complete:0,incomplete:0,total:0},
 integrationHealth:{components:[]},verifiedValue:{verifiedValues:[]},
 livingMemory:{memories:[]},businessGraph:{nodes:[],edges:[]},
 executiveCockpit:{recommendedActions:[],openKnowledgeObligations:[],activityTimeline:[],openLoops:[]}
};

test('original bridge never replaces immutable ready handshake or submits under a switched company',async()=>{
 const bus=new Bus();let tenant='A',accept=false;const posted=[];
 const listeners=new Set();
 const stateClient={
  getSnapshot:()=>({mode:'authenticated',user:{id:'shared-user',app_metadata:{tenantId:tenant}}}),
  authHeaders:async()=>({authorization:'Bearer '+tenant}),
  subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},isDemo:()=>false
 };
 const bridge=createPowerhouseRuntimeBridge({
  stateClient,domainState:{get:()=>({portal:{}}),setDerived:()=>{}},
  eventTarget:bus,intervalMs:0,
  fetchImpl:async(_url,options={})=>{
   if(options.method!=='POST')return {ok:true,json:async()=>projection};
   const record=JSON.parse(options.body);posted.push({record,token:options.headers.authorization});
   if(!accept)return {ok:false,status:503,json:async()=>({error:'provider-unavailable'})};
   return {ok:true,json:async()=>({record:{id:record.id,correlationId:record.correlationId}})};
  }
 });
 try{
  bus.emit('portal:semantic-point-select',{metric:'A-1'});
  await tick(310);
  bus.emit('portal:semantic-point-select',{metric:'A-2'});
  assert.equal(bridge.pendingHandoffs().pending,2);
  await tick(310);
  assert.equal(bridge.pendingHandoffs().pending,2,'failed delivery must remain under A');
  tenant='B';for(const fn of listeners)fn(stateClient.getSnapshot());
  assert.equal(bridge.pendingHandoffs().pending,0,'revoke old-tenant ephemeral messages');
  accept=true;
  bus.emit('portal:semantic-point-select',{metric:'B-1'});
  await tick(310);
  assert.equal(bridge.pendingHandoffs().pending,0);
  const sentUnderB=posted.filter(x=>x.token==='Bearer B');
  assert.deepEqual(sentUnderB.map(x=>x.record.payload.metric),['B-1']);
  assert.ok(posted.filter(x=>x.token==='Bearer A').every(x=>x.record.payload.metric.startsWith('A-')));
 }finally{bridge.destroy();}
});

test('bridge and customer source journal are one original authority, not two schedulers',async()=>{
 const [bridge,domain,agent]=await Promise.all([
  readFile(new URL('../portal-v2/powerhouse-runtime-bridge.js',import.meta.url),'utf8'),
  readFile(new URL('../portal-v2/domain-state.js',import.meta.url),'utf8'),
  readFile(new URL('../.agents/skills/portal-living-interface/SKILL.md',import.meta.url),'utf8')
 ]);
 assert.match(bridge,/entry\.record\.idempotencyKey===record\.idempotencyKey/);
 assert.match(bridge,/previous\.ready\|\|previous\.inflight/);
 assert.match(bridge,/user\?\.app_metadata\?\.tenantId/);
 assert.match(bridge,/record\.idempotencyKey/);
 assert.match(domain,/HANDOFF_JOURNAL_PATH='portal\.__brainHandoffJournalV1'/);
 assert.match(domain,/PORTAL_BRAIN_REPLAY_SOURCE_CONFLICT/);
 assert.match(agent,/server.*duurzame.*overdracht|server-persisted.*handoff/i);
 assert.doesNotMatch(bridge,/localStorage|sessionStorage|service_role|cron\.schedule/);
});
