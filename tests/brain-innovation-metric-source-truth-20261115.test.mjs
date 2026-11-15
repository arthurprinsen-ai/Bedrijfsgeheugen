import test from 'node:test';
import assert from 'node:assert/strict';
import {projectPowerhouseIntegrationReadback} from '../platform/portal/powerhouse-existing-integration-read-model.mjs';

function project(value){
  return projectPowerhouseIntegrationReadback({
    readStates:{revenue:'LIVE',loops:'LIVE',capabilities:'LIVE'},
    datasets:{
      revenue:[{realized_revenue_eur:value}],
      loops:[{overall_status:'GREEN',red_loops:value,amber_loops:0}],
      capabilities:[{evidence_rows:value}]
    }
  });
}

test('historical replay: coercible nonnumeric source values remain unknown and cannot clear loop debt',()=>{
  for(const value of [null,undefined,'','  ','\t\n',false,true,[],[0],[1],{},NaN,Infinity,'Infinity','unknown']){
    const result=project(value);
    assert.equal(result.commercial.realizedRevenueEur,null);
    assert.equal(result.loopAssurance.red,null);
    assert.equal(result.capabilities.withoutEvidence,0,'unknown evidence is not an observed zero');
    assert.ok(result.gapCodes.includes('LOOP_ASSURANCE_NOT_GREEN'));
    assert.equal(result.integrationState,'END_TO_END_UNPROVEN');
  }
});

test('actual finite numbers and numeric provider strings retain observed zero and signed amounts',()=>{
  for(const [value,expected] of [[0,0],['0',0],[' 0 ',0],[12.5,12.5],['12.50',12.5],[-2,-2],['-2',-2]]){
    const result=project(value);
    assert.equal(result.commercial.realizedRevenueEur,expected);
    assert.equal(result.loopAssurance.red,expected);
    assert.equal(result.capabilities.withoutEvidence,expected===0?1:0);
    assert.equal(result.gapCodes.includes('LOOP_ASSURANCE_NOT_GREEN'),expected!==0);
    assert.equal(result.integrationState,'END_TO_END_UNPROVEN');
  }
});
