import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortalDomainState } from '../domain-state.js';
import { createPortalStateClient } from '../portal-state.js';

// Mirrors the original production all-capability demo browser exercise.
// Real customer state is covered separately by authenticated server + Brain tests.
const PROBES=Object.freeze([
 ['portal.profile.maturity.sturing',5],
 ['portal.profile.employees',31],
 ['portal.dataAi.maturity',4],
 ['portal.aiScan.hourlyRate',91],
 ['portal.metrics.revenue',4321],
 ['portal.profile.hourlyCost',73],
 ['portal.businessCase.target',5],
 ['portal.metrics.nps',37],
 ['portal.valueFinance.multiple',6.2],
 ['portal.people.absence',3.4],
 ['portal.market.industry','productie-parity-probe'],
 ['portal.research.filter','productie-parity-probe'],
 ['portal.compliance.policies.0','vastgesteld'],
 ['portal.aiCapabilities.0',4],
 ['portal.strategy.horizon','6 maanden'],
 ['portal.canvases.bmc.answer','productie-parity-probe'],
 ['portal.finalConclusion.text','productie-parity-probe'],
 ['portal.dueDiligence.findings',[{area:'Parity',finding:'productie-parity-probe',evidence:'runtime',materiality:1,redFlag:false,owner:'test'}]],
 ['portal.strategy.dna.ambitie','productie-parity-probe'],
 ['portal.freshness.what','productie-parity-probe'],
 ['portal.changes.toTasks.theme','productie-parity-probe'],
 ['portal.advice.modelFilter','productie-parity-probe'],
 ['portal.offer.scope','productie-parity-probe'],
 ['portal.roadmap.draft.title','productie-parity-probe'],
 ['portal.execution.completed.mensen.0',true]
]);

test('demo bulk input is a local preview, never an invented durable Brain obligation',async()=>{
 let durablePosts=0;
 const client=createPortalStateClient({demoMode:true});
 const domain=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async()=>{
  durablePosts++;return {stored:true,brainRecordId:'SHOULD_NEVER_HAPPEN'};
 }});
 await domain.init();
 const original=structuredClone(domain.get());
 assert.equal(PROBES.length,25);
 for(const [path,value] of PROBES){
  domain.set(path,value);
  assert.equal(domain.pendingHandoffs().pending,false,`demo change ${path} must not create pending real Brain handoff`);
 }
 await domain.flush();
 assert.equal(domain.status(),'saved');
 for(const [path,value] of PROBES)assert.deepEqual(domain.get(path),value,path);
 assert.equal(domain.pendingHandoffs().pending,false);
 assert.equal(durablePosts,0,'real customer Brain saver cannot run from demo');
 domain.set('',original);
 await domain.flush();
 assert.equal(domain.status(),'saved');
 assert.deepEqual(domain.get(),original,'ephemeral preview must restore without a historical Brain source conflict');
 assert.equal(domain.pendingHandoffs().pending,false);
 assert.equal(durablePosts,0);
});

test('authenticated real customer still creates pending lineage and requires its own Brain ACK',async()=>{
 let stored={portal:{profile:{employees:5}}};let posts=0;
 const client={
  isDemo:()=>false,currentUser:()=>({id:'real-tenant-A'}),authHeaders:async()=>({authorization:'Bearer real-tenant-A'}),
  load:async()=>({mode:'authenticated',state:structuredClone(stored)}),
  write:async value=>({mode:'authenticated',state:stored=structuredClone(value)})
 };
 const domain=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async()=>{
  posts++;return {stored:true,brainRecordId:'verified-in-test-only'};
 }});
 await domain.init();
 domain.set('portal.profile.employees',8);
 assert.equal(domain.pendingHandoffs().pending,true);
 await domain.flush();
 assert.equal(posts,1);
 assert.equal(domain.pendingHandoffs().pending,false);
});
