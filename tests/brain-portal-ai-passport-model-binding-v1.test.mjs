import test from 'node:test';
import assert from 'node:assert/strict';
import {mountSecurityTrustWorkspace,disposeSecurityTrustWorkspace} from '../portal-v2/modules/security-trust-workspace.js';
const tick=async()=>{for(let i=0;i<40;i++)await Promise.resolve();};
const events=()=>{const listeners=new Map();return {addEventListener(e,fn){if(!listeners.has(e))listeners.set(e,new Set());listeners.get(e).add(fn);},removeEventListener(e,fn){listeners.get(e)?.delete(fn);},emit(e){for(const fn of listeners.get(e)||[])fn();}};};
function fixture(initialStatus='saved'){
 let user={id:'tenant-a'},listener=null,authListener=null,status=initialStatus,reads=0;
 const state={portal:{aiModelPreferences:{defaultModelId:'model-a',models:[{modelId:'model-a',routeId:'route-a'}],assignments:{brain:'model-a'},policy:'eu-both'},runtime:{observability:{updatedAt:'2026-10-20T17:00:00Z'}}}};
 const root={innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[]};
 const stateClient={currentUser:()=>user,isDemo:()=>false,authHeaders:async()=>({authorization:'Bearer private'}),subscribe:fn=>(authListener=fn,()=>authListener=null)};
 const domainState={get:()=>state,status:()=>status,subscribe:fn=>(listener=fn,()=>listener=null)};
 const fetchImpl=async()=>{reads++;return {ok:true,json:async()=>({snapshot:{generatedAt:'2026-10-20T17:00:00Z',providers:[],aiRoutes:[{provider:'Registered-provider',modelId:'registered-model',purpose:'Advice'}]}})}};
 return {root,stateClient,domainState,fetchImpl,change(model,nextStatus='saved'){status=nextStatus;state.portal.aiModelPreferences.defaultModelId=model;listener?.({});},ack(){status='saved';listener?.({});},switchUser(){user={id:'tenant-b'};authListener?.({});},get listener(){return listener},get reads(){return reads}};
}
test('passport binds saved tenant model choice without inferring execution from registry',async()=>{
 const f=fixture();await mountSecurityTrustWorkspace(f.root,{...f,pageId:'data-ai-passport'});
 assert.match(f.root.innerHTML,/model-a/);assert.match(f.root.innerHTML,/route-a/);assert.match(f.root.innerHTML,/registered-model/);
 assert.match(f.root.innerHTML,/geen uitvoeringsbewijs/i);assert.match(f.root.innerHTML,/2026-10-20T17:00:00Z/);
 assert.match(f.root.innerHTML,/https:\/\/www.bedrijfsgeheugen.nl\/portaal\?page=ai-modelkeuze/);
 f.change('<img src=x onerror=alert(1)>');await tick();assert.match(f.root.innerHTML,/&lt;img/);assert.doesNotMatch(f.root.innerHTML,/<img/);
 disposeSecurityTrustWorkspace(f.root);assert.equal(f.listener,null);
});
test('identity change clears previous customer details and detaches listeners',async()=>{
 const f=fixture();await mountSecurityTrustWorkspace(f.root,{...f,pageId:'data-ai-passport'});
 f.switchUser();assert.doesNotMatch(f.root.innerHTML,/model-a|registered-model/);assert.equal(f.listener,null);
});
test('late readback cannot overwrite another page after disposal',async()=>{
 const f=fixture();let release;const pending=new Promise(r=>release=r);
 const mounting=mountSecurityTrustWorkspace(f.root,{...f,pageId:'data-ai-passport',fetchImpl:async()=>{await pending;return {ok:true,json:async()=>({snapshot:{providers:[{name:'private-old-tenant'}]}})}}});
 await tick();disposeSecurityTrustWorkspace(f.root);f.root.innerHTML='Other page';release();await mounting;assert.equal(f.root.innerHTML,'Other page');
});
test('failure clears previous trust facts instead of retaining a success display',async()=>{
 const f=fixture();let fail=false;
 const controller=await mountSecurityTrustWorkspace(f.root,{...f,pageId:'data-ai-passport',fetchImpl:async(...args)=>fail?{ok:false,status:502,json:async()=>({error:'UNAVAILABLE'})}:f.fetchImpl(...args)});
 assert.match(f.root.innerHTML,/model-a/);fail=true;await controller.refresh({force:true});
 assert.match(f.root.innerHTML,/niet veilig/);assert.doesNotMatch(f.root.innerHTML,/model-a/);controller.dispose();
});
test('ready-for-test remains separate from execution and admin preference uses same tenant',async()=>{
 const f=fixture();f.stateClient.currentUser=()=>({id:'tenant-a',roles:['admin']});const calls=[];
 await mountSecurityTrustWorkspace(f.root,{...f,pageId:'data-ai-passport',fetchImpl:async url=>{calls.push(url);return {ok:true,json:async()=>url.includes('activation-status')?{readyForTest:true,checks:[{label:'Provider route',status:'COMPLETE'}]}:{snapshot:{providers:[]}}}}});
 assert.match(f.root.innerHTML,/klaar voor een handmatige test/i);assert.match(f.root.innerHTML,/geen uitvoeringsbewijs/i);
 assert.match(f.root.innerHTML,/Provider route/);assert.ok(calls.includes('/api/tenant-ai-activation-status'));assert.ok(calls.every(url=>!url.includes('scope=')));disposeSecurityTrustWorkspace(f.root);
});
test('focus refresh displays new Heartbeat snapshot without another scheduler',async()=>{
 const f=fixture(),eventTarget=events();let time=0,generation='old';
 const controller=await mountSecurityTrustWorkspace(f.root,{...f,pageId:'data-ai-passport',eventTarget,now:()=>time,fetchImpl:async()=>({ok:true,json:async()=>({snapshot:{generatedAt:generation}})})});
 assert.match(f.root.innerHTML,/old/);generation='new-heartbeat';time=31000;eventTarget.emit('focus');await tick();assert.match(f.root.innerHTML,/new-heartbeat/);controller.dispose();
});
test('activation waits for save ACK and immediately revalidates after saved transition',async()=>{
 const f=fixture();let activationReads=0;
 await mountSecurityTrustWorkspace(f.root,{...f,pageId:'data-ai-passport',fetchImpl:async url=>{if(url.includes('activation-status'))activationReads++;return {ok:true,json:async()=>url.includes('activation-status')?{readyForTest:true,checks:[]}:{snapshot:{}}}}});
 assert.equal(activationReads,1);f.change('changed-during-save','saving');await tick();assert.equal(activationReads,1);assert.doesNotMatch(f.root.innerHTML,/Servercontrole: klaar/);
 f.ack();await tick();assert.equal(activationReads,2);assert.match(f.root.innerHTML,/Servercontrole: klaar/);disposeSecurityTrustWorkspace(f.root);
});
test('authoritative evidence event refreshes immediately and queues one in-flight followup',async()=>{
 const f=fixture(),documentTarget=events();let reads=0,release=null;
 const fetchImpl=async()=>{reads++;if(release)await release.promise;return {ok:true,json:async()=>({snapshot:{generatedAt:'rev-'+reads}})}};
 const controller=await mountSecurityTrustWorkspace(f.root,{...f,pageId:'data-ai-passport',documentTarget,fetchImpl});
 assert.equal(reads,3);documentTarget.emit('bg:runtime-evidence');await tick();assert.equal(reads,6);
 let resolve;release={promise:new Promise(r=>resolve=r)};documentTarget.emit('bg:runtime-evidence');await tick();documentTarget.emit('bg:runtime-evidence');resolve();release=null;await tick();assert.equal(reads,12);controller.dispose();
});
test('mount while saving reads readiness after ACK even without another preference change',async()=>{
 const f=fixture('saving');let activationReads=0;
 await mountSecurityTrustWorkspace(f.root,{...f,pageId:'data-ai-passport',fetchImpl:async url=>{if(url.includes('activation-status'))activationReads++;return {ok:true,json:async()=>({snapshot:{}})}}});
 assert.equal(activationReads,0);f.ack();await tick();assert.equal(activationReads,1);disposeSecurityTrustWorkspace(f.root);
});
