import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateDecisionScenarios,selectDecisionScenario} from '../brain/operating-loop/decision-engine.mjs';

test('decision engine ranks alternatives deterministically with evidence and constraints',()=>{
  const decision={id:'D1',tenantId:'T1',subjectId:'company:1',correlationId:'C1',owner:'management',evidenceIds:['E1'],payload:{objectiveWeights:{value:.5,risk:.3,time:.2}}};
  const alternatives=[
    {id:'A',label:'A',value:.9,risk:.5,time:.5,evidenceIds:['EA']},
    {id:'B',label:'B',value:.7,risk:.2,time:.8,evidenceIds:['EB']}
  ];
  const result=evaluateDecisionScenarios(decision,alternatives,{hardConstraints:[alt=>alt.risk<=.8]});
  assert.equal(result.scenarios.length,2);
  assert.equal(result.scenarios[0].id,'B');
  assert.deepEqual(result.scenarios[0].evidenceIds,['E1','EB']);
  assert.ok(result.scenarios.every(x=>Number.isFinite(x.score)));
});

test('selection requires explicit human rationale when policy requires it',()=>{
  const evaluated={decisionId:'D1',tenantId:'T1',correlationId:'C1',scenarios:[{id:'A',eligible:true,score:.7},{id:'B',eligible:true,score:.8}]};
  assert.throws(()=>selectDecisionScenario(evaluated,{scenarioId:'B',selectedBy:'human'}),/rationale/i);
  const selected=selectDecisionScenario(evaluated,{scenarioId:'B',selectedBy:'human',rationale:'Lower risk with sufficient value'});
  assert.equal(selected.selectedScenarioId,'B');
  assert.equal(selected.rationale,'Lower risk with sufficient value');
  assert.equal(selected.status,'SELECTED');
});
