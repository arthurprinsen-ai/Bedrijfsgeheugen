import test from 'node:test';
import assert from 'node:assert/strict';
import {composePortalProjectionLayers,projectCanonicalObject,PORTAL_LAYERS} from '../platform/read-models/portal-projection-layers.mjs';

test('canonical layer composes additively over legacy without deleting legacy capability data',()=>{
 const legacy={sourceUpdatedAt:'2026-08-29T18:00:00Z',data:{company:{name:'A',health:60},actions:[{id:'old',title:'Oude actie'}],memories:[{id:'doc',title:'Procedure'}],sourceMeta:{updatedAt:'2026-08-29T18:00:00Z'}}};
 const canonical={sourceUpdatedAt:'2026-08-29T19:00:00Z',data:{company:{health:72},actions:[{id:'new',title:'Brain actie'}],signals:[{id:'sig',title:'Signaal'}],sourceMeta:{updatedAt:'2026-08-29T19:00:00Z'}}};
 const out=composePortalProjectionLayers({legacy,canonical});assert.equal(out.company.name,'A');assert.equal(out.company.health,72);assert.deepEqual(out.actions.map(x=>x.id),['old','new']);assert.equal(out.memories[0].id,'doc');assert.equal(out.signals[0].id,'sig');assert.equal(out.sourceMeta.kind,'server-composed');
});

test('canonical item with same id overrides only that object',()=>{
 const out=composePortalProjectionLayers({legacy:{data:{actions:[{id:'a',title:'Legacy',owner:'L'},{id:'b',title:'B'}]}},canonical:{data:{actions:[{id:'a',title:'Canonical'}]}}});
 assert.deepEqual(out.actions.find(x=>x.id==='a'),{id:'a',title:'Canonical',owner:'L'});assert.equal(out.actions.find(x=>x.id==='b').title,'B');
});

test('canonical projector maps governed business objects into portal sections',()=>{
 const signal=projectCanonicalObject({}, {id:'S1',tenantId:'t1',type:'ExternalSignal',lifecycle:'ACTIVE',risk:80,provenance:{sourceRef:'EU'},data:{title:'Nieuwe regel',confidence:.9,affected:['Finance']},updatedAt:'2026-08-29T20:00:00Z'});
 assert.equal(signal.signals[0].id,'S1');assert.equal(signal.signals[0].impact,'Hoog');assert.equal(signal.sourceMeta.kind,PORTAL_LAYERS.CANONICAL);
 const decision=projectCanonicalObject(signal,{id:'D1',tenantId:'t1',type:'Decision',lifecycle:'ACTIVE',provenance:{sourceRef:'Directie'},data:{reason:'Goedgekeurd'},updatedAt:'2026-08-29T20:01:00Z'});assert.equal(decision.decisions[0].id,'D1');
 const change=projectCanonicalObject(decision,{id:'C1',tenantId:'t1',type:'Change',lifecycle:'ACTIVE',verification:'VERIFIED',data:{proposedAction:'Voer uit',executionId:'x',verifiedAt:'now'},updatedAt:'2026-08-29T20:02:00Z'});assert.equal(change.actions[0].verified,true);
});

test('unknown canonical types remain visible in audit instead of disappearing',()=>{
 const out=projectCanonicalObject({}, {id:'X1',tenantId:'t1',type:'Capability',lifecycle:'ACTIVE',provenance:{sourceRef:'system'},data:{},updatedAt:'2026-08-29T20:00:00Z'});assert.equal(out.audit.length,1);assert.match(out.audit[0].event,/Capability/);
});
