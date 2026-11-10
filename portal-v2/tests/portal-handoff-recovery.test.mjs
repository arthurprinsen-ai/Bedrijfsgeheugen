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
