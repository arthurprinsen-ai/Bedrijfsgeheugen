import test from 'node:test';
import assert from 'node:assert/strict';
import { createDomainState } from '../domain-state.js';

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
  const store=createDomainState({
    load:async()=>({profile:{name:'A',employees:20}}),
    save:async value=>clone(value)
  });
  await store.init();
  store.patch('profile',{employees:21,sector:'bouw'});
  assert.deepEqual(store.get('profile'),{name:'A',employees:21,sector:'bouw'});
});

test('failed save retains edited data and exposes recoverable error status', async () => {
  let fail=true;
  const store=createDomainState({
    load:async()=>({profile:{name:'A'}}),
    save:async value=>{if(fail)throw new Error('WRITE_FAILED');return clone(value);}
  });
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

test('subscriptions receive deterministic status and state transitions', async () => {
  const events=[];
  const store=createDomainState({
    load:async()=>({profile:{name:'A'}}),
    save:async value=>clone(value)
  });
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
  const store=createDomainState({
    load:async()=>clone(persisted),
    save:async value=>{persisted=clone(value);return clone(value);}
  });
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
  const store=createDomainState({
    load:async()=>({profile:{name:'A'}}),
    save:async value=>{await pending;return clone(value);}
  });
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
