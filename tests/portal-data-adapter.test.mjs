import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortalDataAdapter } from '../portal/data-adapter.mjs';
function store(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)}}
test('adapter uses cached state immediately',async()=>{const s=store();s.setItem('bg.portal.state.v2',JSON.stringify({savedAt:100,state:{id:'cached'}}));const a=createPortalDataAdapter({storage:s,now:()=>110,loadRemote:async()=>({id:'remote'})});const x=await a.loadInitial();assert.equal(x.source,'cache');assert.equal(x.state.id,'cached')});
test('adapter loads remote and caches when cache missing',async()=>{const s=store();const a=createPortalDataAdapter({storage:s,now:()=>100,loadRemote:async()=>({id:'remote'})});const x=await a.loadInitial();assert.equal(x.source,'remote');assert.equal(x.state.id,'remote');assert.equal(JSON.parse(s.getItem('bg.portal.state.v2')).state.id,'remote')});
test('adapter falls back safely when remote fails',async()=>{const a=createPortalDataAdapter({storage:store(),loadRemote:async()=>{throw new Error('offline')}});const x=await a.loadInitial();assert.equal(x.source,'sample');assert.ok(x.state.company)});
test('refresh preserves last known state on remote failure',async()=>{const s=store();s.setItem('bg.portal.state.v2',JSON.stringify({savedAt:1,state:{id:'last-good'}}));const a=createPortalDataAdapter({storage:s,loadRemote:async()=>{throw new Error('offline')}});const x=await a.refresh();assert.equal(x.source,'cache');assert.equal(x.state.id,'last-good');assert.equal(x.changed,false)});
