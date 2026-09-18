import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildExecutiveProjection} from '../portal-v2/operating-system/executive-projection.js';

const evidence=(id,confidence=.8,freshness_at='2026-09-16T18:00:00Z')=>({id,tenant_id:'t1',entity_type:'signal',source_refs:['src'],provenance:'powerhouse',freshness_at,confidence,model_or_formula_version:'v1',observed_at:freshness_at,updated_at:freshness_at});

test('executive projection is tenant scoped, role aware and limits NBA to five',()=>{
 const state={powerhouse:{executive:{health_score:72,risks:[{...evidence('r1'),title:'Risico'}],opportunities:[{...evidence('o1'),title:'Kans'}],next_best_actions:Array.from({length:7},(_,i)=>({...evidence(`a${i}`),title:`A${i}`,priority:100-i})),strategy_progress:61,outcomes:[]}}};
 const out=buildExecutiveProjection(state,{tenantId:'t1',role:'directie',now:Date.parse('2026-09-16T19:00:00Z')});
 assert.equal(out.health_score,72);assert.equal(out.next_best_actions.length,5);assert.equal(out.role,'directie');assert.equal(out.sections[0],'attention');
});

test('CEO, MT and DT get explicit executive role projections',()=>{
 const state={powerhouse:{executive:{health_score:80,strategy_progress:70}}};
 for(const [role,label] of [['ceo','CEO'],['mt','MT'],['dt','DT']]){
  const out=buildExecutiveProjection(state,{tenantId:'t1',role,now:Date.parse('2026-09-16T19:00:00Z')});
  assert.equal(out.role,role);assert.equal(out.role_label,label);assert.equal(out.sections[0],'attention');
 }
});

test('attention prioritizes critical and decision-required items and caps at three',()=>{
 const state={powerhouse:{executive:{
  risks:[{...evidence('r1'),title:'Critical',severity:'critical',priority:1},{...evidence('r2'),title:'Low',priority:2}],
  next_best_actions:[{...evidence('a1'),title:'Decision',priority:10,decision_required:true},{...evidence('a2'),title:'Action',priority:9}],
  forecasts:[{...evidence('f1'),title:'Forecast',priority:8}],
  changes:[{...evidence('c1'),title:'Change',priority:7}]
 }}};
 const out=buildExecutiveProjection(state,{tenantId:'t1',role:'ceo',now:Date.parse('2026-09-16T19:00:00Z')});
 assert.equal(out.attention.length,3);assert.equal(out.attention[0].title,'Critical');assert.ok(out.attention.some(item=>item.title==='Decision'));assert.equal(out.decision_queue.length,1);
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


test('executive cockpit fails closed before tenant hydration instead of throwing',()=> {
 const out=buildExecutiveProjection({}, {role:'ceo'});
 assert.equal(out.available,false);
 assert.equal(out.role_label,'CEO');
 assert.equal(out.health_score,null);
});

test('overview no longer mounts the empty executive day-start shell',()=> {
 const source=fs.readFileSync('portal-v2/modules/overview.js','utf8');
 assert.doesNotMatch(source,/mountExecutiveCockpit/);
 assert.match(source,/renderLegacyOverviewInsights\(root,state\)/);
 assert.match(source,/renderDirectievragen\(root,state\)/);
});
