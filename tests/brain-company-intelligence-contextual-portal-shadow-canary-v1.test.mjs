import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCompanyIntelligenceContext,renderCompanyIntelligenceContext} from '../portal-v2/operating-system/company-intelligence-context.js';

const tenantA={powerhouse:{executive:{
  problems:[{problem_id:'PH-P901',title:'Tenant A probleem',source_refs:['tenant-a-source'],capabilities:['tenant-a-cap'],confidence:.91}],
  opportunities:[{id:'opp-a',title:'Tenant A kans',confidence:.8}],
  next_best_actions:[{id:'act-a',title:'Tenant A actie',expectedValue:12500,confidence:.84}],
  outcomes:[{id:'out-a',title:'Tenant A outcome',value:4200,confidence:.9}]
},outcome_pairs:[{id:'pair-a',title:'Tenant A learning',expected:{value:12500},realized:{value:4200},learning:'Tenant A lesson'}]}};

const tenantB={powerhouse:{executive:{
  problems:[{problem_id:'PH-P902',title:'Tenant B geheim',source_refs:['tenant-b-secret-source'],capabilities:['tenant-b-secret-cap'],confidence:.92}],
  opportunities:[{id:'opp-b',title:'Tenant B kans',confidence:.82}],
  next_best_actions:[{id:'act-b',title:'Tenant B geheime actie',expectedValue:99000,confidence:.86}],
  outcomes:[{id:'out-b',title:'Tenant B geheime outcome',value:88000,confidence:.95}]
},outcome_pairs:[{id:'pair-b',title:'Tenant B learning',expected:{value:99000},realized:{value:88000},learning:'Tenant B secret lesson'}]}};

test('shadow/canary tenant projection never mixes isolated customer context',()=>{
  const mode=String(process.env.POWERHOUSE_LEARNING_EVAL_MODE||'HISTORICAL_REPLAY');
  assert.ok(['HISTORICAL_REPLAY','SHADOW','CANARY'].includes(mode));
  const a=renderCompanyIntelligenceContext(tenantA,'executive-cockpit');
  const b=renderCompanyIntelligenceContext(tenantB,'executive-cockpit');
  for(const secret of ['Tenant B geheim','tenant-b-secret-source','Tenant B geheime actie','Tenant B secret lesson']) assert.equal(a.includes(secret),false);
  for(const secret of ['Tenant A probleem','tenant-a-source','Tenant A actie','Tenant A lesson']) assert.equal(b.includes(secret),false);
  assert.match(a,/Tenant A probleem/);
  assert.match(b,/Tenant B geheim/);
  assert.equal(buildCompanyIntelligenceContext({},'executive-cockpit').available,false);
  assert.match(renderCompanyIntelligenceContext({},'executive-cockpit'),/Nog onvoldoende bewezen context/);
});

test('canary keeps expected and realized value semantically separate',()=>{
  const model=buildCompanyIntelligenceContext(tenantA,'monitoring-learning');
  assert.equal(model.expected,12500);
  assert.equal(model.realized,4200);
  assert.notEqual(model.expected,model.realized);
  const html=renderCompanyIntelligenceContext(tenantA,'monitoring-learning');
  assert.match(html,/Verwacht/);
  assert.match(html,/gerealiseerd/);
});
