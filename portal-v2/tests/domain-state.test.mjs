import test from 'node:test';
import assert from 'node:assert/strict';
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
