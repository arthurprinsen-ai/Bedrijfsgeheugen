import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanonicalPortalProjector} from '../platform/read-models/canonical-portal-projector.mjs';
import {PORTAL_LAYERS} from '../platform/read-models/portal-projection-layers.mjs';

test('trusted projector reads and writes only canonical layer',async()=>{
 let readLayer='',writtenTenant='',written=null;const store={getLayer:async(_t,l)=>{readLayer=l;return null},putCanonical:async(t,p)=>{writtenTenant=t;written=p;return{stored:true,record:p}}};
 const projector=createCanonicalPortalProjector({store,now:()=> '2026-08-29T20:00:00Z'});
 const result=await projector.project({id:'S1',tenantId:'acme',type:'ExternalSignal',provenance:{sourceRef:'EU'},data:{title:'Regel'},updatedAt:'2026-08-29T19:59:00Z'});
 assert.equal(readLayer,PORTAL_LAYERS.CANONICAL);assert.equal(writtenTenant,'acme');assert.equal(written.origin,PORTAL_LAYERS.CANONICAL);assert.equal(written.data.signals[0].id,'S1');assert.equal(result.stored,true);
});

test('projector preserves earlier canonical objects when adding a new one',async()=>{
 let layer={data:{signals:[{id:'S1',title:'Eerste'}],sourceMeta:{updatedAt:'2026-08-29T19:00:00Z'}}};let written;const store={getLayer:async()=>layer,putCanonical:async(_t,p)=>{written=p;return{stored:true,record:p}}};
 const projector=createCanonicalPortalProjector({store,now:()=> '2026-08-29T20:00:00Z'});
 await projector.project({id:'D1',tenantId:'acme',type:'Decision',lifecycle:'ACTIVE',provenance:{sourceRef:'Directie'},data:{reason:'Akkoord'},updatedAt:'2026-08-29T20:00:00Z'});
 assert.equal(written.data.signals[0].id,'S1');assert.equal(written.data.decisions[0].id,'D1');
});
