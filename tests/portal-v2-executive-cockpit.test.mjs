import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExecutiveProjection} from '../portal-v2/operating-system/executive-projection.js';

const evidence=(id,confidence=.8,freshness_at='2026-09-16T18:00:00Z')=>({id,tenant_id:'t1',entity_type:'signal',source_refs:['src'],provenance:'powerhouse',freshness_at,confidence,model_or_formula_version:'v1',observed_at:freshness_at,updated_at:freshness_at});

test('executive projection is tenant scoped, role aware and limits NBA to five',()=>{
 const state={powerhouse:{executive:{health_score:72,risks:[{...evidence('r1'),title:'Risico'}],opportunities:[{...evidence('o1'),title:'Kans'}],next_best_actions:Array.from({length:7},(_,i)=>({...evidence(`a${i}`),title:`A${i}`,priority:100-i})),strategy_progress:61,outcomes:[]}}};
 const out=buildExecutiveProjection(state,{tenantId:'t1',role:'directie',now:Date.parse('2026-09-16T19:00:00Z')});
 assert.equal(out.health_score,72);assert.equal(out.next_best_actions.length,5);assert.equal(out.role,'directie');assert.equal(out.sections[0],'changes');
});

test('missing canonical executive data renders an unavailable state instead of claims',()=>{
 const out=buildExecutiveProjection({}, {tenantId:'t1',role:'finance',now:Date.now()});
 assert.equal(out.available,false);assert.equal(out.health_score,null);assert.deepEqual(out.next_best_actions,[]);
});

test('stale and low-confidence evidence are surfaced in health summary',()=>{
 const state={powerhouse:{executive:{risks:[{...evidence('stale',.9,'2026-09-10T18:00:00Z')},{...evidence('low',.2),title:'laag'}]}}};
 const out=buildExecutiveProjection(state,{tenantId:'t1',now:Date.parse('2026-09-16T19:00:00Z')});
 assert.ok(out.evidence_health.stale>=1);assert.ok(out.evidence_health.low_confidence>=1);
});
