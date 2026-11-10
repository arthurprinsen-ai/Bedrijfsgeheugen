import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {canRebuildVisiblePortalPage} from '../page-shell.js';
import {loadRuntimeEvidence} from '../runtime-evidence.js';
import {allPageIds} from '../page-registry.js';

const root=({page='advies',form=false,open=true}={})=>({
  dataset:{pageId:page},
  classList:{contains:name=>name==='open'&&open},
  getAttribute:name=>name==='aria-hidden'?(open?'false':'true'):null,
  querySelector:selector=>selector==='#pvNative'?{querySelector:()=>form?{}:null}:null,
  contains:()=>false
});
const state=(status='saved')=>({initialized:()=>true,status:()=>status});
const client=(id='A',mode='authenticated',snapshotId=id)=>({
  currentUser:()=>({id}),getSnapshot:()=>({mode,user:{id:snapshotId}}),isDemo:()=>false
});
test('all registered native pages share a safe read-only cross-page refresh',()=>{
  for(const page of allPageIds()){
    const common={domainState:state(),stateClient:client(),pageId:page,principal:'A'};
    assert.equal(canRebuildVisiblePortalPage({...common,root:root({page})}),true,page);
    assert.equal(canRebuildVisiblePortalPage({...common,root:root({page,form:true})}),false,page+' form draft');
  }
});
test('cross-page refresh guards route, tenant, hydration, dirty state and hidden route',()=>{
  const common={root:root(),domainState:state(),stateClient:client(),pageId:'advies',principal:'A'};
  assert.equal(canRebuildVisiblePortalPage(common),true);
  assert.equal(canRebuildVisiblePortalPage({...common,principal:'B'}),false);
  assert.equal(canRebuildVisiblePortalPage({...common,pageId:'profiel'}),false);
  assert.equal(canRebuildVisiblePortalPage({...common,stateClient:client('B','authenticated','A')}),false);
  assert.equal(canRebuildVisiblePortalPage({...common,stateClient:client('A','preview')}),false);
  assert.equal(canRebuildVisiblePortalPage({...common,domainState:state('dirty')}),false);
  assert.equal(canRebuildVisiblePortalPage({...common,domainState:state('saving')}),false);
  assert.equal(canRebuildVisiblePortalPage({...common,domainState:{initialized:()=>false,status:()=> 'idle'}}),false);
  assert.equal(canRebuildVisiblePortalPage({...common,root:root({open:false})}),false);
});
test('same authenticated runtime response emits once, changed proof emits again',async()=>{
  const prevEvent=globalThis.CustomEvent,prevDispatch=globalThis.dispatchEvent;
  const events=[];let revision=1;let stored=null;
  globalThis.CustomEvent=class{constructor(type,{detail}){this.type=type;this.detail=detail;}};
  globalThis.dispatchEvent=e=>events.push(e);
  const domainState={get:path=>path==='portal.runtime'?stored:undefined,setDerived:(path,next)=>{assert.equal(path,'portal.runtime');stored=next;}};
  const opts={domainState,fetchImpl:async()=>({ok:true,status:200,json:async()=>({records:[{type:'Evidence',id:'r'+revision,observedAt:'2026-11-10T08:00:00Z'}],wholeBrainLoops:[],integrationHealth:{components:[]}})}),
    authHeadersProvider:async()=>({authorization:'Bearer same-tenant'}),validateSession:()=>true};
  try{
    assert.ok(await loadRuntimeEvidence(opts));assert.equal(events.length,1);
    assert.ok(await loadRuntimeEvidence(opts));assert.equal(events.length,1);
    revision++;
    assert.ok(await loadRuntimeEvidence(opts));assert.equal(events.length,2);
    assert.equal(events[1].detail.source,'brain-operating-loop');
    assert.equal(await loadRuntimeEvidence({...opts,validateSession:()=>false}),null);
    assert.equal(events.length,2);
  }finally{
    if(prevEvent===undefined)delete globalThis.CustomEvent;else globalThis.CustomEvent=prevEvent;
    if(prevDispatch===undefined)delete globalThis.dispatchEvent;else globalThis.dispatchEvent=prevDispatch;
  }
});
test('source rule: changed runtime, partial canonical ACK and identity boundary all feed safe one-page dispatcher',async()=>{
  const source=await readFile(new URL('../page-shell.js',import.meta.url),'utf8');
  assert.match(source,/bg:runtime-evidence/);
  assert.match(source,/bg:portal-identity-boundary/);
  assert.match(source,/const confirmed=\[\.\.\.impacts\]/);
  assert.match(source,/scheduleVisiblePageRebuild\(root\)/);
  assert.match(source,/canRebuildVisiblePortalPage\(options\(\)\)/);
});
