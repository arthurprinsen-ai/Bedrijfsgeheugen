import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLegacyExecutionSignals, legacySourceEnabled } from '../modules/legacy-execution-signals.js';

const baseState={portal:{profile:{employees:24,hourlyCost:52,maturity:{sturing:2,commercie:2,operatie:2,finance:2,mensen:2,analytics:2,quality:2,governance:2,tech:2,culture:2,service:2,security:2,duurzaam:2}},metrics:{},people:{},compliance:{},canvases:{},valueFinance:{},market:{},advice:{},strategy:{}}};

test('legacy modelAan semantics keep every source enabled unless explicitly false',()=>{
  assert.equal(legacySourceEnabled('Model 7S',{}),true);
  assert.equal(legacySourceEnabled('Model 7S',{'Model 7S':true}),true);
  assert.equal(legacySourceEnabled('Model 7S',{'Model 7S':false}),false);
});

test('default legacy fixture emits repeated dimensional signals because frequency drives execution-theme selection',()=>{
  const signals=generateLegacyExecutionSignals(baseState);
  assert.ok(signals.length>10);
  assert.ok(signals.filter(x=>x.dimension==='mensen').length>=2);
  assert.ok(signals.filter(x=>x.dimension==='finance').length>=2);
  assert.ok(signals.some(x=>x.source==='Model Theory of Constraints'&&x.dimension==='sturing'));
  assert.ok(signals.some(x=>x.source==='Model SWOT'));
  assert.ok(signals.some(x=>x.source==='Model Blue Ocean'&&x.dimension==='commercie'));
  assert.ok(signals.some(x=>x.source==='Model drie horizonten'&&x.dimension==='sturing'));
});

test('explicitly disabled legacy model sources no longer contribute to dimension frequency',()=>{
  const state=structuredClone(baseState);
  state.portal.strategy.models={'Model Blue Ocean':false,'Model drie horizonten':false};
  const signals=generateLegacyExecutionSignals(state);
  assert.equal(signals.some(x=>x.source==='Model Blue Ocean'),false);
  assert.equal(signals.some(x=>x.source==='Model drie horizonten'),false);
});

test('profile and operational thresholds preserve known legacy dimensions',()=>{
  const state=structuredClone(baseState);
  state.portal.metrics={largestCustomer:30,dso:45,revenue:1000,marketing:10,newCustomers:0};
  state.portal.people={absence:8,turnover:20,mto:'Geen meting'};
  state.portal.compliance={incident:0,backup:0,aiPolicy:0,dataDefinitions:0};
  const signals=generateLegacyExecutionSignals(state);
  for(const dimension of ['commercie','finance','mensen','culture','security','tech','quality']){
    assert.ok(signals.some(x=>x.dimension===dimension),`missing ${dimension}`);
  }
});
