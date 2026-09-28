import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPANY_INTELLIGENCE_OS_CONTRACT,
  buildCompanyGraph,
  compileSystemOfContext,
  selectAutonomousActions,
  buildOutcomeMemory,
  compoundIntelligence
} from '../brain/context/company-intelligence-os.mjs';

test('CRM is a source, never the brain',()=>{
  assert.equal(COMPANY_INTELLIGENCE_OS_CONTRACT.crmRole,'source-not-brain');
  assert.ok(COMPANY_INTELLIGENCE_OS_CONTRACT.invariants.includes('NO_PARALLEL_CRM'));
});

test('Company Graph links person company opportunity action outcome',()=>{
  const graph=buildCompanyGraph({
    companies:[{company_key:'acme',company_name:'Acme'}],
    people:[{person_key:'p1',person_name:'Ada',company_key:'acme'}],
    opportunities:[{opportunity_key:'o1',company_key:'acme',person_key:'p1'}],
    actions:[{action_id:'a1',opportunity_key:'o1',action_type:'email'}],
    outcomes:[{outcome_id:'x1',action_id:'a1',outcome_type:'meeting'}]
  });
  assert.equal(graph.nodes.length,5);
  assert.deepEqual(graph.edges.map(x=>x.type),[
    'person_company','company_opportunity','person_opportunity','opportunity_action','action_outcome'
  ]);
});

test('System of Context is company scoped and derived',()=>{
  const graph=buildCompanyGraph({
    companies:[{company_key:'acme'}],
    people:[{person_key:'p1',company_key:'acme'}]
  });
  const context=compileSystemOfContext({companyKey:'acme',graph,evidence:[{id:'e1'}]});
  assert.equal(context.companyKey,'acme');
  assert.equal(context.evidence.length,1);
  assert.match(context.truthBoundary,/not a parallel truth store/i);
});

test('Autonomous Action Layer preserves execution gates',()=>{
  const [action]=selectAutonomousActions({
    context:{companyKey:'acme'},
    actions:[{action_id:'a1',status:'prepared'}]
  });
  assert.equal(action.executionCandidate,true);
  assert.equal(action.contextBound,true);
  assert.equal(action.requiresExistingExecutionGates,true);
});

test('Outcome Memory never invents realized value',()=>{
  const memory=buildOutcomeMemory({
    outcomes:[{outcome_id:'x1',action_id:'a1',outcome_type:'meeting',revenue_eur:0}],
    realizedValues:[{observation_id:'v1',cycle_id:'c1',value_type:'hours_saved',numeric_value:12,unit:'hours'}]
  });
  assert.equal(memory.records.length,2);
  assert.equal(memory.records[0].value,0);
  assert.equal(memory.records[1].value,12);
});

test('Compound Intelligence closes the loop on observed outcomes',()=>{
  const memory=buildOutcomeMemory({outcomes:[{outcome_id:'x1',action_id:'a1',outcome_type:'won',revenue_eur:5000}]});
  const intelligence=compoundIntelligence({
    context:{companyKey:'acme'},
    outcomeMemory:memory,
    actions:[{action_id:'a1',status:'done'}]
  });
  assert.equal(intelligence.realizedRevenueEur,5000);
  assert.equal(intelligence.nextLearningMove,'reinforce_verified_value_path');
  assert.deepEqual(intelligence.loop,['know','understand','decide','act','measure','learn']);
});
