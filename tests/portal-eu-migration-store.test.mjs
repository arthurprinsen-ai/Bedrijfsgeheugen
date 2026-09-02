import test from 'node:test';
import assert from 'node:assert/strict';
import { createEuPrimaryPortalStore } from '../netlify/functions/_portal-eu-primary-store.mjs';
import { PORTAL_LAYERS } from '../platform/read-models/portal-projection-layers.mjs';

test('reads EU first and never touches the US fallback when EU data exists',async()=>{
  let fallbackReads=0;
  const eu={get:async()=>({tenantId:'t1',origin:'composed',data:{company:{name:'EU'}}}),put:async()=>({stored:true}),putLegacy:async()=>({stored:true}),putCanonical:async()=>({stored:true})};
  const fallback={get:async()=>{fallbackReads++;return null},getLayer:async()=>{fallbackReads++;return null}};
  const store=createEuPrimaryPortalStore({euStore:eu,fallbackStore:fallback});
  const result=await store.get('t1');
  assert.equal(result.data.company.name,'EU');
  assert.equal(fallbackReads,0);
});

test('migrates both legacy and canonical fallback layers into EU on first read',async()=>{
  const writes=[];
  let euReads=0;
  const migrated={tenantId:'t1',origin:'composed',data:{company:{name:'Migrated'}}};
  const eu={
    get:async()=>{euReads++;return euReads===1?null:migrated},
    put:async()=>({stored:true}),
    putLegacy:async(_tenant,payload)=>{writes.push([PORTAL_LAYERS.LEGACY,payload]);return{stored:true}},
    putCanonical:async(_tenant,payload)=>{writes.push([PORTAL_LAYERS.CANONICAL,payload]);return{stored:true}}
  };
  const fallback={
    get:async()=>({tenantId:'t1',data:{company:{name:'Fallback'}}}),
    getLayer:async(_tenant,layer)=>layer===PORTAL_LAYERS.LEGACY?{sourceUpdatedAt:'2026-09-01T10:00:00Z',data:{company:{name:'Legacy'}}}:{sourceUpdatedAt:'2026-09-01T11:00:00Z',data:{company:{name:'Canonical'}}}
  };
  const store=createEuPrimaryPortalStore({euStore:eu,fallbackStore:fallback});
  const result=await store.get('t1');
  assert.equal(writes.length,2);
  assert.equal(result.data.company.name,'Migrated');
});

test('new writes never fall back to the US store',async()=>{
  let fallbackWrites=0;
  const eu={get:async()=>null,put:async()=>({stored:true}),putLegacy:async()=>({stored:true}),putCanonical:async()=>({stored:true})};
  const fallback={put:async()=>{fallbackWrites++;return{stored:true}}};
  const store=createEuPrimaryPortalStore({euStore:eu,fallbackStore:fallback});
  const result=await store.put('t1',{sourceUpdatedAt:'2026-09-02T08:00:00Z'});
  assert.equal(result.stored,true);
  assert.equal(fallbackWrites,0);
});
