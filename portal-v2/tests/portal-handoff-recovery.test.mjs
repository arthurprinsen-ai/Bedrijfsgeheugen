import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPortalDomainState} from '../domain-state.js';
import {allPageIds} from '../page-registry.js';

const clone=value=>structuredClone(value);
function harness(saver){
 let persisted={portal:{profile:{employees:10}}};
 let principal='company-a';
 const inputs=[];
 const stateClient={
  load:async()=>({mode:'authenticated',state:clone(persisted)}),
  write:async next=>({mode:'authenticated',state:persisted=clone(next)}),
  isDemo:()=>false,
  currentUser:()=>({id:principal}),
  authHeaders:async()=>({authorization:'Bearer '+principal})
 };
 const domain=createPortalDomainState(stateClient,{
  legacyStorage:null,
  businessInputSaver:async(input,options)=>{
   inputs.push({input:clone(input),authorization:options.authorization});
   return saver(input,inputs.length);
  }
 });
 return {domain,inputs,switchPrincipal:value=>{principal=value}};
}

test('an incomplete canonical ACK is retried by the existing refresh and preserves 52 field impacts',async()=>{
 let calls=0;
 const {domain,inputs}=harness(async()=>({stored:++calls>1}));
 await domain.init();
 for(let i=0;i<52;i++)domain.set('portal.profile.answers.field'+i,'value-'+i);
 await assert.rejects(domain.flush(),/CANONICAL_BUSINESS_INPUT_ACK_REQUIRED/);
 assert.equal(domain.status(),'saved');
 assert.deepEqual(domain.pendingHandoffs(),{pending:true,inputs:1,impacts:52,retryable:true});
 const result=await domain.refresh();
 assert.equal(result.applied,true);
 assert.equal(inputs.length,2);
 assert.equal(inputs[1].input.metadata.causalImpacts.length,52);
 assert.equal(inputs[1].input.answers.answers.field51,'value-51');
 assert.equal(domain.pendingHandoffs().pending,false);
});

test('partial multi-page Brain ACK only retries the failed section and retains unconfirmed impact',async()=>{
 let metricAttempts=0;
 const {domain,inputs}=harness(async input=>{
  if(input.modelId==='business-metrics'&&++metricAttempts===1)return {stored:false};
  return {stored:true};
 });
 await domain.init();
 domain.set('portal.profile.employees',12);
 domain.set('portal.metrics.revenue',600);
 await assert.rejects(domain.flush(),/CANONICAL_BUSINESS_INPUT_ACK_REQUIRED/);
 assert.deepEqual(domain.pendingHandoffs(),{pending:true,inputs:1,impacts:1,retryable:true});
 assert.deepEqual(inputs.map(x=>x.input.modelId),['company-profile','business-metrics']);
 const result=await domain.refresh();
 assert.equal(result.applied,true);
 assert.deepEqual(inputs.map(x=>x.input.modelId),['company-profile','business-metrics','business-metrics'],
  'originally confirmed CompanyProfile must never be resent after BusinessMetrics fails');
 assert.equal(inputs[2].input.metadata.causalImpacts.length,1);
 assert.equal(inputs[2].input.metadata.causalImpacts[0].path,'portal.metrics.revenue');
 assert.equal(domain.pendingHandoffs().pending,false);
});

test('principal mismatch blocks both recovery and new writes to prevent cross-tenant replay',async()=>{
 let calls=0;
 const {domain,inputs,switchPrincipal}=harness(async()=>({stored:++calls>1}));
 await domain.init();
 domain.set('portal.profile.employees',17);
 await assert.rejects(domain.flush(),/CANONICAL_BUSINESS_INPUT_ACK_REQUIRED/);
 switchPrincipal('company-b');
 assert.equal(domain.pendingHandoffs().retryable,false);
 assert.equal((await domain.refresh()).applied,false);
 await assert.rejects(domain.flush(),/PORTAL_(?:PENDING_HANDOFF|HYDRATED)_PRINCIPAL_MISMATCH/);
 assert.throws(()=>domain.set('portal.profile.employees',18),/PORTAL_(?:PENDING_HANDOFF|HYDRATED)_PRINCIPAL_MISMATCH/);
 assert.equal(inputs.length,1);
 assert.equal(inputs[0].authorization,'Bearer company-a');
 switchPrincipal('company-a');
 await domain.refresh();
 assert.equal(inputs[1].authorization,'Bearer company-a');
 assert.equal(domain.pendingHandoffs().pending,false);
});

test('identity rehydration cannot replay another tenant current snapshot as an earlier tenant input',async()=>{
 let attempts=0;
 const {domain,inputs,switchPrincipal}=harness(async()=>({stored:++attempts>1}));
 await domain.init();
 domain.set('portal.profile.employees',22);
 await assert.rejects(domain.flush(),/CANONICAL_BUSINESS_INPUT_ACK_REQUIRED/);
 switchPrincipal('company-b');
 await domain.init();
 assert.equal(domain.pendingHandoffs().retryable,false);
 await assert.rejects(domain.flush(),/PORTAL_(?:PENDING_HANDOFF|HYDRATED)_PRINCIPAL_MISMATCH/);
 switchPrincipal('company-a');
 // The cached model is currently bound to B; do not replay until A rehydrates.
 assert.equal(domain.pendingHandoffs().retryable,false);
 await assert.rejects(domain.flush(),/PORTAL_HYDRATED_PRINCIPAL_MISMATCH/);
 assert.equal(inputs.length,1,'no other user snapshot was transmitted');
 await domain.init();
 const recovered=await domain.refresh();
 assert.equal(recovered.applied,true);
 assert.equal(inputs.length,2);
 assert.equal(inputs[1].authorization,'Bearer company-a');
});

test('dirty unsubmitted form changes never automatically write on original revalidation',async()=>{
 const {domain,inputs}=harness(async()=>({stored:true}));
 await domain.init();
 domain.set('portal.profile.employees',42);
 assert.equal(domain.pendingHandoffs().pending,true);
 assert.equal(domain.pendingHandoffs().retryable,false);
 assert.deepEqual(await domain.refresh(),{applied:false,reason:'UNVERIFIED_OR_UNSAVED_TENANT'});
 assert.equal(inputs.length,0);
 assert.equal(domain.status(),'dirty');
});

test('every registered page retains the same Brain handoff through an ACK failure and recovery',async()=>{
 for(const page of allPageIds()){
  let calls=0;
  const {domain,inputs}=harness(async()=>({stored:++calls>1}));
  await domain.init();
  domain.set('portal.pages.'+page+'.customerChoice','accepted');
  await assert.rejects(domain.flush(),/CANONICAL_BUSINESS_INPUT_ACK_REQUIRED/,page);
  assert.equal(domain.pendingHandoffs().retryable,true,page);
  const result=await domain.refresh();
  assert.equal(result.applied,true,page);
  assert.equal(inputs.length,2,page);
  assert.equal(inputs[1].input.metadata.causalImpacts[0].sourcePage,page);
  assert.equal(domain.pendingHandoffs().pending,false,page);
 }
});

test('existing portal timer supplies retry without an extra scheduler or false confirmed result',async()=>{
 const [app,ui]=await Promise.all([
  readFile(new URL('../app.js',import.meta.url),'utf8'),
  readFile(new URL('../entrepreneur-home.js',import.meta.url),'utf8')
 ]);
 assert.match(app,/PORTAL_REVALIDATION_INTERVAL_MS=15\*60\*1000/);
 assert.match(app,/portalDomainState\.refresh\(\)/);
 assert.match(ui,/domainState\.pendingHandoffs\?\.\(\)/);
 assert.match(ui,/het gevolgadvies is nog niet bewezen/);
});

test('a second explicitly requested save during Brain in-flight ACK commits the newer same-tenant snapshot once',async()=>{
 let entered,release;
 const firstEntered=new Promise(resolve=>{entered=resolve;});
 const blockFirst=new Promise(resolve=>{release=resolve;});
 let persisted={portal:{profile:{employees:10}}};
 const inputs=[];
 const client={
  load:async()=>({mode:'authenticated',state:clone(persisted)}),
  write:async next=>({mode:'authenticated',state:persisted=clone(next)}),
  currentUser:()=>({id:'company-a',app_metadata:{tenantId:'tenant-a'}}),
  isDemo:()=>false,authHeaders:async()=>({authorization:'Bearer company-a'})
 };
 const domain=createPortalDomainState(client,{legacyStorage:null,
  businessInputSaver:async input=>{
   inputs.push(clone(input));
   if(inputs.length===1){entered();await blockFirst;}
   return {stored:true};
  }
 });
 await domain.init();
 domain.set('portal.profile.employees',20);
 const first=domain.flush();
 await firstEntered;
 domain.set('portal.profile.employees',21);
 const second=domain.flush();
 const duplicate=domain.flush();
 assert.strictEqual(second,duplicate,'concurrent explicit callers share exactly one queued follow-up');
 release();
 await Promise.all([first,second,duplicate]);
 assert.deepEqual(inputs.map(x=>x.answers.employees),[20,21],
  'each separately requested state revision reaches original Brain once');
 assert.equal(persisted.portal.profile.employees,21);
 assert.equal(domain.get('portal.profile.employees'),21);
 assert.equal(domain.status(),'saved');
 assert.equal(domain.pendingHandoffs().pending,false);
});

test('new unsaved typing during Brain ACK still requires an explicit second save',async()=>{
 let entered,release;
 const firstEntered=new Promise(resolve=>{entered=resolve});
 const block=new Promise(resolve=>{release=resolve});
 let persisted={portal:{profile:{employees:10}}};
 const inputs=[];
 const client={
  load:async()=>({mode:'authenticated',state:clone(persisted)}),
  write:async next=>({mode:'authenticated',state:persisted=clone(next)}),
  currentUser:()=>({id:'company-a'}),isDemo:()=>false,
  authHeaders:async()=>({authorization:'Bearer company-a'})
 };
 const domain=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async input=>{
  inputs.push(clone(input));
  if(inputs.length===1){entered();await block;}
  return {stored:true};
 }});
 await domain.init();
 domain.set('portal.profile.employees',20);
 const first=domain.flush();
 await firstEntered;
 domain.set('portal.profile.employees',21);
 release();
 await first;
 assert.equal(domain.status(),'dirty','no automatic save of unsent customer typing');
 assert.equal(inputs.length,1);
 await domain.flush();
 assert.deepEqual(inputs.map(x=>x.answers.employees),[20,21]);
 assert.equal(domain.status(),'saved');
});

test('same signed-in user changing company cannot refresh an earlier tenant snapshot without rehydration',async()=>{
 let tenant='tenant-a',reads=0;
 const records={
  'tenant-a':{portal:{profile:{employees:17}}},
  'tenant-b':{portal:{profile:{employees:91}}}
 };
 const client={
  load:async()=>{reads++;return {mode:'authenticated',state:clone(records[tenant])};},
  write:async next=>({mode:'authenticated',state:clone(next)}),
  currentUser:()=>({id:'same-member',app_metadata:{tenantId:tenant}}),
  isDemo:()=>false,authHeaders:async()=>({authorization:'Bearer member'})
 };
 const domain=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async()=>({stored:true})});
 await domain.init();
 assert.equal(domain.get('portal.profile.employees'),17);
 assert.equal((await domain.refresh()).applied,true);
 const readsBeforeSwitch=reads;
 tenant='tenant-b';
 assert.deepEqual(await domain.refresh(),{applied:false,reason:'UNVERIFIED_OR_UNSAVED_TENANT'});
 assert.equal(reads,readsBeforeSwitch,'no cross-tenant read under a stale hydrated principal');
 assert.equal(domain.get('portal.profile.employees'),17,'an earlier customer state cannot become new tenant source truth');
 assert.throws(()=>domain.set('portal.profile.employees',92),/PORTAL_HYDRATED_PRINCIPAL_MISMATCH/);
 await domain.init();
 assert.equal(domain.get('portal.profile.employees'),91,'new tenant must explicitly rehydrate');
 assert.equal((await domain.refresh()).applied,true,'same freshly hydrated tenant may revalidate normally');
});

test('in-flight refresh refuses a same-user tenant switch before applying source state',async()=>{
 let tenant='tenant-a',reads=0,unblock,notify;
 const blocked=new Promise(resolve=>{unblock=resolve;});
 const started=new Promise(resolve=>{notify=resolve;});
 const client={
  load:async()=>{
   reads++;
   const selected=tenant;
   if(reads===2){notify();await blocked;}
   return {mode:'authenticated',state:{portal:{profile:{employees:selected==='tenant-a'?13:80}}}};
  },
  write:async next=>({mode:'authenticated',state:clone(next)}),
  currentUser:()=>({id:'same-member',app_metadata:{tenantId:tenant}}),
  isDemo:()=>false,authHeaders:async()=>({authorization:'Bearer member'})
 };
 const domain=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async()=>({stored:true})});
 await domain.init();
 const pending=domain.refresh();
 await started;
 tenant='tenant-b';
 unblock();
 assert.deepEqual(await pending,{applied:false,reason:'CHANGED_DURING_READBACK'});
 assert.equal(domain.get('portal.profile.employees'),13);
});

test('unmapped portal-root and internal derived/journal mutations fail before writing any customer state',async()=>{
 const {domain,inputs}=harness(async()=>({stored:true}));
 await domain.init();
 const before=domain.get();
 for(const path of ['portal','portal.runtime','portal.runtime.status','portal.__brainHandoffJournalV1','portal.__brainHandoffJournalV1.byPrincipal']){
  assert.throws(()=>domain.set(path,{changed:true}),/PORTAL_DIRECT_WRITE_PATH_HAS_NO_CANONICAL_HANDOFF/,path);
  assert.throws(()=>domain.patch(path,{changed:true}),/PORTAL_DIRECT_WRITE_PATH_HAS_NO_CANONICAL_HANDOFF/,path);
 }
 assert.deepEqual(domain.get(),before);
 assert.deepEqual(domain.pendingHandoffs(),{pending:false,inputs:0,impacts:0,retryable:false});
 await domain.flush();
 assert.equal(inputs.length,0,'no orphan input or duplicate Brain write');
});
