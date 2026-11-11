import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCompanyIntelligenceContext,renderCompanyIntelligenceContext} from '../portal-v2/operating-system/company-intelligence-context.js';

const tenantA={powerhouse:{executive:{
  problems:[{problem_id:'PH-P901',title:'Tenant A probleem',source_refs:['tenant-a-source'],capabilities:['tenant-a-cap'],confidence:.91}],
  opportunities:[{id:'opp-a',title:'Tenant A kans',problem_id:'PH-P901',confidence:.8}],
  next_best_actions:[{id:'act-a',title:'Tenant A actie',problem_id:'PH-P901',opportunity_id:'opp-a',expected_impact:{kind:'estimated',amount:12500,unit:'EUR'},source_refs:['tenant-a-action-proof'],evidence_health:{status:'healthy'},confidence:.84}],
  outcomes:[{id:'out-a',action_id:'act-a',title:'Tenant A outcome',verification_status:'VERIFIED',evidence_health:{status:'healthy'},source_refs:['tenant-a-outcome-proof'],realized:{amount:4200,unit:'EUR',metric_id:'sales',baseline_id:'base-a',period_id:'period-a'},learning_verified:true,learning_evidence_refs:['tenant-a-next-decision'],next_decision_id:'decision-a',confidence:.9}]
},outcome_pairs:[{id:'pair-a',action_id:'act-a',outcome_id:'out-a',learning_verified:true,learning_evidence_refs:['tenant-a-next-decision'],next_decision_id:'decision-a',title:'Tenant A learning',expected:{value:12500},realized:{value:4200},learning:'Tenant A lesson'}]}};

const tenantB={powerhouse:{executive:{
  problems:[{problem_id:'PH-P902',title:'Tenant B geheim',source_refs:['tenant-b-secret-source'],capabilities:['tenant-b-secret-cap'],confidence:.92}],
  opportunities:[{id:'opp-b',title:'Tenant B kans',problem_id:'PH-P902',confidence:.82}],
  next_best_actions:[{id:'act-b',title:'Tenant B geheime actie',problem_id:'PH-P902',opportunity_id:'opp-b',expected_impact:{kind:'forecast',amount:99000,unit:'EUR'},source_refs:['tenant-b-secret-action-proof'],evidence_health:{status:'healthy'},confidence:.86}],
  outcomes:[{id:'out-b',action_id:'act-b',title:'Tenant B geheime outcome',verification_status:'VERIFIED',evidence_health:{status:'healthy'},source_refs:['tenant-b-secret-outcome-proof'],realized:{amount:88000,unit:'EUR',metric_id:'sales',baseline_id:'base-b',period_id:'period-b'},learning_verified:true,learning_evidence_refs:['tenant-b-secret-next-decision'],next_decision_id:'decision-b',confidence:.95}]
},outcome_pairs:[{id:'pair-b',action_id:'act-b',outcome_id:'out-b',learning_verified:true,learning_evidence_refs:['tenant-b-secret-next-decision'],next_decision_id:'decision-b',title:'Tenant B learning',expected:{value:99000},realized:{value:88000},learning:'Tenant B secret lesson'}]}};

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

test('unrelated tenant-scoped items cannot imply a causal edge, amount or learning',()=>{
 const noProof={powerhouse:{executive:{
  problems:[{problem_id:'P1',title:'Probleem één',source_refs:['source-one']}],
  opportunities:[{id:'O2',title:'Niet gekoppelde kans',problem_id:'P2'}],
  next_best_actions:[{id:'A3',title:'Niet gekoppelde actie',opportunity_id:'O9',expectedValue:12000}],
  outcomes:[{id:'X7',title:'Niet bewezen resultaat',action_id:'A9',value:950000,verification_status:'COMPLETED'}]
 },outcome_pairs:[{id:'L9',learning:'GEEN BEWIJS: 950000 euro winst'}]}};
 const model=buildCompanyIntelligenceContext(noProof,'monitoring-learning');
 assert.equal(model.outcome,null);
 assert.equal(model.realized,null);
 assert.equal(model.expected,null,'untyped estimated number is never claimed as euros');
 assert.equal(model.learning,'');
 assert.equal(model.graph.edges.some(edge=>edge.from.startsWith('opportunity:')||edge.to.startsWith('outcome:')),false);
 const html=renderCompanyIntelligenceContext(noProof,'monitoring-learning');
 assert.match(html,/data-outcome-proof="evidence-due"/);
 assert.doesNotMatch(html,/950\.000|950000|GEEN BEWIJS/);
 assert.match(html,/nog niet onafhankelijk aangetoond/);
});
test('matching IDs with independent realized metric and next-decision proof show only scoped links',()=>{
 const model=buildCompanyIntelligenceContext(tenantA,'monitoring-learning');
 assert.equal(model.realized,4200);
 assert.equal(model.realizedUnit,'EUR');
 assert.equal(model.learning,'Tenant A lesson');
 assert.ok(model.graph.edges.some(edge=>edge.from==='action:act-a'&&edge.to==='outcome:out-a'));
 assert.ok(model.graph.edges.some(edge=>edge.from==='problem:PH-P901'&&edge.to==='opportunity:opp-a'));
 const html=renderCompanyIntelligenceContext(tenantA,'monitoring-learning');
 assert.match(html,/data-outcome-proof="verified"/);
 assert.match(html,/Tenant A lesson/);
});
test('even a matching outcome with a provider ACK but no independent source cannot claim realized value',()=>{
 const pending=structuredClone(tenantA);
 pending.powerhouse.executive.outcomes[0].evidence_health.status='stale';
 pending.powerhouse.executive.outcomes[0].verification_status='DONE';
 const model=buildCompanyIntelligenceContext(pending,'monitoring-learning');
 assert.equal(model.realized,null);
 assert.equal(model.learning,'');
 assert.equal(model.graph.edges.some(edge=>edge.to==='outcome:out-a'),false);
 assert.match(renderCompanyIntelligenceContext(pending,'monitoring-learning'),/Nog niet bewezen/);
});
