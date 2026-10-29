import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {attachExistingControlPlaneCockpit,isControlPlaneAdminCandidate}
  from '../portal-v2/control-plane-boot.js';

const admin=id=>({id,app_metadata:{roles:['powerhouse_admin']}});
const regular=id=>({id,app_metadata:{roles:['customer']}});
const flush=async()=>{await new Promise(resolve=>setImmediate(resolve));};
function harness({demo=false}={}){
  let snap={mode:'preview',user:null},listeners=new Set(),host=null;
  const root={querySelector(selector){
    if(selector==='[data-bg-control-plane-host="true"]')return host;
    return selector==='.main'?{}:null;
  }};
  const client={
    getSnapshot:()=>snap,isDemo:()=>demo,
    subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);}
  };
  const publish=next=>{snap=next;for(const fn of [...listeners])fn(next);};
  const setHost=h=>{host=h;};
  const createHost=()=>{const h={removed:false,remove(){this.removed=true;if(host===h)host=null;}};host=h;return h;};
  return {client,root,publish,createHost,setHost};
}
test('only signed server-role-equivalent admin candidates may request a private readback',()=>{
  assert.equal(isControlPlaneAdminCandidate(admin('one')),true);
  assert.equal(isControlPlaneAdminCandidate({id:'one',app_metadata:{powerhouse_admin:true}}),true);
  assert.equal(isControlPlaneAdminCandidate(regular('one')),false);
  assert.equal(isControlPlaneAdminCandidate({id:'one',user_metadata:{roles:['admin']}}),false);
  assert.equal(isControlPlaneAdminCandidate({app_metadata:{roles:['admin']}}),false);
});
test('anonymous, regular customers and demos never mount or call the endpoint',async()=>{
  for(const [demo,user] of [[false,null],[false,regular('person')],[true,admin('admin')]]){
    const h=harness({demo});let mounts=0,requests=0;
    const boot=attachExistingControlPlaneCockpit({stateClient:h.client,root:h.root,
      fetchImpl:async()=>{requests++;throw Error('unsafe');},
      mountImpl:async()=>{mounts++;throw Error('unsafe');}});
    h.publish({mode:user?'authenticated':'preview',user});
    await flush();
    assert.equal(mounts,0);assert.equal(requests,0);boot.destroy();
  }
});
test('one admin login starts exactly one existing mount; same-user refresh does not duplicate',async()=>{
  const h=harness();let mounts=0;
  const boot=attachExistingControlPlaneCockpit({stateClient:h.client,root:h.root,
    fetchImpl:async()=>({ok:true,status:200,json:async()=>({})}),
    mountImpl:async()=>{mounts++;return {host:h.createHost()};}});
  h.publish({mode:'authenticated',user:admin('owner')});
  await flush();
  h.publish({mode:'empty',user:admin('owner')});
  await flush();
  assert.equal(mounts,1);assert.equal(boot.currentOwner(),'owner');
  boot.destroy();
  assert.equal(boot.currentOwner(),null);
});
test('logout immediately clears the private DOM and aborts outstanding work',async()=>{
  const h=harness();let capturedSignal=null;
  const node=h.createHost();
  const boot=attachExistingControlPlaneCockpit({stateClient:h.client,root:h.root,
    fetchImpl:async(_url,opts)=>{capturedSignal=opts.signal;return {status:200,ok:true,json:async()=>({})};},
    mountImpl:async(_root,{fetchImpl})=>{await fetchImpl('/api/powerhouse-control-plane');return {host:node};}});
  h.publish({mode:'authenticated',user:admin('owner')});
  await flush();
  assert.equal(capturedSignal.aborted,false);
  h.publish({mode:'preview',user:null});
  assert.equal(capturedSignal.aborted,true);
  assert.equal(node.removed,true);
  await flush();
  assert.equal(boot.currentOwner(),null);
  boot.destroy();
});
test('cross-user delayed read cannot return tenant data or replace new subject',async()=>{
  const h=harness();
  let complete;const responses=[];
  const boot=attachExistingControlPlaneCockpit({stateClient:h.client,root:h.root,
    fetchImpl:async(_url,options)=>{
      return new Promise(resolve=>{responses.push({resolve,signal:options.signal});});
    },
    mountImpl:async(_root,{fetchImpl})=>{
      const r=await fetchImpl('/api/powerhouse-control-plane');
      await r.json();
      return {host:h.createHost()};
    }});
  h.publish({mode:'authenticated',user:admin('first')});
  await flush();
  assert.equal(responses.length,1);
  h.publish({mode:'authenticated',user:admin('second')});
  await flush();
  assert.equal(responses[0].signal.aborted,true);
  responses[0].resolve({status:200,ok:true,json:async()=>({tenant:'first'})});
  responses[1].resolve({status:200,ok:true,json:async()=>({tenant:'second'})});
  await flush();
  assert.equal(boot.currentOwner(),'second');
  assert.ok(h.root.querySelector('[data-bg-control-plane-host="true"]'));
  boot.destroy();
});
test('only the existing same-origin admin API may be called by this mount',async()=>{
  const h=harness();let calls=0;
  const boot=attachExistingControlPlaneCockpit({stateClient:h.client,root:h.root,
    fetchImpl:async()=>{calls++;return {ok:true,status:200,json:async()=>({})};},
    mountImpl:async(_root,{fetchImpl})=>{
      await assert.rejects(()=>fetchImpl('https://foreign.example/control-plane'),/NON_CANONICAL/);
      return null;
    }});
  h.publish({mode:'authenticated',user:admin('owner')});
  await flush();
  assert.equal(calls,0);boot.destroy();
});
test('the real portal app imports and attaches exactly one canonical admin control-plane mount',()=>{
  const app=readFileSync('portal-v2/app.js','utf8');
  assert.match(app,/import \{ mountControlPlaneCockpit \} from '\.\/control-plane-cockpit\.js';/);
  assert.match(app,/import \{ attachExistingControlPlaneCockpit \} from '\.\/control-plane-boot\.js';/);
  assert.match(app,/attachExistingControlPlaneCockpit\(\{/);
  assert.match(app,/stateClient:portalStateClient/);
  assert.match(app,/mountImpl:mountControlPlaneCockpit/);
  assert.doesNotMatch(app,/setInterval\([^;\n]*mountControlPlaneCockpit/);
});
