import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDomainState, createPortalDomainState } from '../domain-state.js';

const clone = value => structuredClone(value);

test('domain state tracks dirty values and confirms persistence before saved', async () => {
  const writes=[];
  const store=createDomainState({
    load:async()=>({profile:{name:'A'}}),
    save:async value=>{writes.push(clone(value));return clone(value);}
  });
  await store.init();
  assert.equal(store.get('profile.name'),'A');
  store.set('profile.name','B');
  assert.equal(store.status(),'dirty');
  await store.flush();
  assert.equal(store.status(),'saved');
  assert.equal(writes.at(-1).profile.name,'B');
});

test('domain state patches nested objects without dropping sibling values', async () => {
  const store=createDomainState({load:async()=>({profile:{name:'A',employees:20}}),save:async value=>clone(value)});
  await store.init();
  store.patch('profile',{employees:21,sector:'bouw'});
  assert.deepEqual(store.get('profile'),{name:'A',employees:21,sector:'bouw'});
});

test('failed save retains edited data and exposes recoverable error status', async () => {
  let fail=true;
  const store=createDomainState({load:async()=>({profile:{name:'A'}}),save:async value=>{if(fail)throw new Error('WRITE_FAILED');return clone(value);}});
  await store.init();
  store.set('profile.name','B');
  await assert.rejects(store.flush(),/WRITE_FAILED/);
  assert.equal(store.get('profile.name'),'B');
  assert.equal(store.status(),'error');
  assert.equal(store.error()?.message,'WRITE_FAILED');
  fail=false;
  await store.flush();
  assert.equal(store.status(),'saved');
});

test('load failure becomes observable error state without inventing data', async () => {
  const store=createDomainState({load:async()=>{throw new Error('LOAD_FAILED')},save:async value=>clone(value)});
  await assert.rejects(store.init(),/LOAD_FAILED/);
  assert.equal(store.status(),'error');
  assert.equal(store.error()?.message,'LOAD_FAILED');
  assert.deepEqual(store.get(),{});
});

test('subscriptions receive deterministic status and state transitions', async () => {
  const events=[];
  const store=createDomainState({load:async()=>({profile:{name:'A'}}),save:async value=>clone(value)});
  const unsubscribe=store.subscribe(snapshot=>events.push({status:snapshot.status,name:snapshot.state?.profile?.name}));
  await store.init();
  store.set('profile.name','B');
  await store.flush();
  unsubscribe();
  assert.ok(events.some(event=>event.status==='idle'&&event.name==='A'));
  assert.ok(events.some(event=>event.status==='dirty'&&event.name==='B'));
  assert.ok(events.some(event=>event.status==='saving'));
  assert.ok(events.some(event=>event.status==='saved'&&event.name==='B'));
});

test('reload reopens server-confirmed state and clears transient error state', async () => {
  let persisted={profile:{name:'A'}};
  const store=createDomainState({load:async()=>clone(persisted),save:async value=>{persisted=clone(value);return clone(value);}});
  await store.init();
  store.set('profile.name','B');
  await store.flush();
  const reopened=createDomainState({load:async()=>clone(persisted),save:async value=>clone(value)});
  await reopened.init();
  assert.equal(reopened.get('profile.name'),'B');
  assert.equal(reopened.status(),'idle');
});

test('an edit made while a save is in flight is never overwritten by server readback', async () => {
  let release;
  const pending=new Promise(resolve=>{release=resolve});
  const store=createDomainState({load:async()=>({profile:{name:'A'}}),save:async value=>{await pending;return clone(value);}});
  await store.init();
  store.set('profile.name','B');
  const saving=store.flush();
  assert.equal(store.status(),'saving');
  store.set('profile.name','C');
  assert.equal(store.status(),'dirty');
  release();
  await saving;
  assert.equal(store.get('profile.name'),'C');
  assert.equal(store.status(),'dirty');
});


test('authenticated legacy browser state is lifted into canonical V2 state and persisted', async () => {
  const entries=new Map([['bg_portaal_user@example.com',JSON.stringify({
    niveaus:{finance:2,tech:3},mw:24,uur:52,
    cijfers:{cOmzet:'1500',cEbitda:'180'},
    eigen:{bmc:'MKB maakbedrijven'},
    taken:[{id:1,t:'Finance automatiseren',dim:'finance',s:2,d:2,klaar:false}]
  })]]);
  const storage={get length(){return entries.size},key:i=>[...entries.keys()][i]??null,getItem:key=>entries.get(key)??null};
  let persisted={portal:{profile:{employees:30}}};
  const writes=[];
  const stateClient={
    load:async()=>({mode:'authenticated',state:clone(persisted)}),
    write:async value=>{writes.push(clone(value));persisted=clone(value);return{mode:'authenticated',state:clone(value)}},
    isDemo:()=>false,
    currentUser:()=>({email:'user@example.com'}),
    authHeaders:async()=>({authorization:'Bearer token'})
  };
  const saver=async()=>({stored:true});
  const store=createPortalDomainState(stateClient,{legacyStorage:storage,businessInputSaver:saver,businessInputStoreLoader:async()=>({readLegacyPortalBusinessInputs:()=>[]})});
  await store.init();
  assert.equal(store.get('portal.profile.employees'),30,'canonical truth wins over legacy');
  assert.equal(store.get('portal.profile.hourlyCost'),52);
  assert.equal(store.get('portal.profile.maturity.finance'),2);
  assert.equal(store.get('portal.metrics.revenue'),1500);
  assert.equal(store.get('portal.canvases.bmc.answer'),'MKB maakbedrijven');
  assert.equal(store.get('portal.roadmap.items.0.title'),'Finance automatiseren');
  assert.ok(writes.length>=1,'migrated state must be persisted back to canonical state');
  assert.equal(store.get('portal.migration.browserLegacyLifted'),true);
  assert.equal(store.get('portal.migration.browserLegacyLiftVersion'),'2026-09-18-v1');
});

test('legacy browser migration is strictly scoped to the authenticated email', async () => {
  const entries=new Map([
    ['bg_portaal_other@example.com',JSON.stringify({mw:99,uur:99,niveaus:{finance:1}})],
    ['bg_portaal_open','1']
  ]);
  const storage={get length(){return entries.size},key:i=>[...entries.keys()][i]??null,getItem:key=>entries.get(key)??null};
  const stateClient={
    load:async()=>({mode:'authenticated',state:{portal:{profile:{employees:20}}}}),
    write:async value=>({mode:'authenticated',state:value}),
    isDemo:()=>false,
    currentUser:()=>({email:'user@example.com'}),
    authHeaders:async()=>({authorization:'Bearer token'})
  };
  const store=createPortalDomainState(stateClient,{legacyStorage:storage,businessInputSaver:async()=>({stored:true}),businessInputStoreLoader:async()=>({readLegacyPortalBusinessInputs:()=>[]})});
  await store.init();
  assert.equal(store.get('portal.profile.employees'),20);
  assert.equal(store.get('portal.profile.hourlyCost'),undefined);
});


test('authenticated server refresh updates the same tenant without a new customer write',async()=>{
 let persisted={portal:{profile:{employees:12},metrics:{revenue:200}}};
 let reads=0,writes=0;
 const client={
  load:async()=>{reads++;return {mode:'authenticated',state:clone(persisted)};},
  write:async next=>{writes++;persisted=clone(next);return {mode:'authenticated',state:clone(next)};},
  isDemo:()=>false,currentUser:()=>({id:'tenant-a'}),
  authHeaders:async()=>({authorization:'Bearer tenant-a'})
 };
 const domain=createPortalDomainState(client,{businessInputSaver:async()=>({stored:true})});
 await domain.init();
 persisted={portal:{profile:{employees:15},metrics:{revenue:250}}};
 const result=await domain.refresh();
 assert.deepEqual(result,{applied:true,changed:true});
 assert.equal(domain.get('portal.profile.employees'),15);
 assert.equal(domain.get('portal.metrics.revenue'),250);
 assert.equal(domain.status(),'idle');
 assert.equal(writes,0,'provider refresh cannot persist duplicate customer edits');
 assert.equal(reads,2);
 assert.deepEqual(await domain.refresh(),{applied:true,changed:false},'unchanged payload does not rebuild forms');
});

test('periodic revalidation never overwrites dirty input or input changed during the readback',async()=>{
 let persisted={profile:{name:'Original'}};let resolver=null;
 const state=createDomainState({
  load:async()=>clone(persisted),
  refreshLoad:async()=>new Promise(resolve=>{resolver=resolve}),
  save:async next=>clone(next)
 });
 await state.init();
 state.set('profile.name','Unsaved');
 assert.equal((await state.refresh()).reason,'UNSAVED_OR_UNAUTHORIZED');
 assert.equal(state.get('profile.name'),'Unsaved');
 await state.flush();
 const pending=state.refresh();
 await Promise.resolve();
 state.set('profile.name','Typed after request');
 resolver({profile:{name:'Stale server'}});
 assert.equal((await pending).reason,'CHANGED_DURING_READBACK');
 assert.equal(state.get('profile.name'),'Typed after request');
 assert.equal(state.status(),'dirty');
});

test('refresh readback failure retains last verified state and cannot claim a new state',async()=>{
 const state=createDomainState({load:async()=>({profile:{employees:8}}),refreshLoad:async()=>{throw new Error('PROVIDER_OFFLINE');},save:async x=>x});
 await state.init();
 await assert.rejects(state.refresh(),/PROVIDER_OFFLINE/);
 assert.equal(state.get('profile.employees'),8);
 assert.equal(state.status(),'idle');
});

test('a response from an old authenticated tenant can never enter a new tenant state',async()=>{
 let principal={id:'tenant-a'},release=null,refreshPending=false;
 const client={
  load:async()=>{
   if(!refreshPending)return {mode:'authenticated',state:{portal:{profile:{employees:10}}}};
   return new Promise(resolve=>{release=()=>resolve({mode:'authenticated',state:{portal:{profile:{employees:99}}}})});
  },
  write:async state=>({mode:'authenticated',state}),
  currentUser:()=>principal,isDemo:()=>false,
  authHeaders:async()=>({authorization:'Bearer current-tenant'})
 };
 const domain=createPortalDomainState(client,{businessInputSaver:async()=>({stored:true})});
 await domain.init();
 refreshPending=true;
 const pending=domain.refresh();
 await Promise.resolve();
 principal={id:'tenant-b'};
 release();
 const outcome=await pending;
 assert.equal(outcome.applied,false);
 assert.equal(domain.get('portal.profile.employees'),10);
});

test('unacknowledged Brain inputs block revalidation even if customer state was already saved',async()=>{
 let releaseBrain;
 const brainWait=new Promise(resolve=>{releaseBrain=resolve});
 let current={portal:{profile:{employees:10}}};
 const client={
  load:async()=>({mode:'authenticated',state:clone(current)}),
  write:async state=>{current=clone(state);return {mode:'authenticated',state:clone(current)};},
  currentUser:()=>({id:'tenant-a'}),isDemo:()=>false,
  authHeaders:async()=>({authorization:'Bearer tenant-a'})
 };
 const domain=createPortalDomainState(client,{businessInputSaver:async()=>{await brainWait;return {stored:true}}});
 await domain.init();
 domain.set('portal.profile.employees',11);
 const pendingSave=domain.flush();
 await Promise.resolve();
 assert.equal((await domain.refresh()).applied,false);
 releaseBrain();
 await pendingSave;
 assert.equal(domain.get('portal.profile.employees'),11);
});

test('portal listens for fresh server readbacks without adding a second backend scheduler',()=>{
 const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const shell=fs.readFileSync(new URL('../page-shell.js',import.meta.url),'utf8');
 assert.match(app,/PORTAL_REVALIDATION_INTERVAL_MS=15\*60\*1000/);
 assert.match(app,/visibilitychange/);
 assert.match(app,/revalidateVisibleCustomer/);
 assert.match(shell,/bg:portal-server-refreshed/);
 assert.match(shell,/root\.contains\(active\)/);
});


test('provider auth expiry cannot replace the previously confirmed portal snapshot',async()=>{
 let invalid=false;
 const client={
  load:async()=>invalid?{mode:'error',error:'AUTH_TOKEN_UNAVAILABLE',state:null}:{mode:'authenticated',state:{portal:{profile:{employees:17}}}},
  write:async state=>({mode:'authenticated',state}),
  isDemo:()=>false,currentUser:()=>({id:'tenant-a'}),
  authHeaders:async()=>({authorization:'Bearer tenant-a'})
 };
 const domain=createPortalDomainState(client,{businessInputSaver:async()=>({stored:true})});
 await domain.init();
 invalid=true;
 await assert.rejects(domain.refresh(),/PORTAL_REFRESH_AUTHENTICATED_READBACK_REQUIRED/);
 assert.equal(domain.get('portal.profile.employees'),17);
 assert.equal(domain.status(),'idle');
});
