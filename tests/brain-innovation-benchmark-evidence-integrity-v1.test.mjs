import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateInnovationBenchmark as evaluate} from '../scripts/brain/quality/innovation-benchmark.mjs';

const incumbent=Object.freeze({
  defect_yield:0.2,false_positive_rate:0.2,runtime_ms:100,cost:10,
  reproducibility:0.95,security_fit:true
});
const candidate=Object.freeze({
  defect_yield:0.3,false_positive_rate:0.15,runtime_ms:90,cost:9,
  reproducibility:0.96,security_fit:true
});

test('realistic improvement remains benchmark advice, never production or model-promotion authority',()=>{
  const r=evaluate({incumbent,candidate});
  assert.equal(r.decision,'ADOPT');
  assert.equal(r.promotion_authorized,false);
  assert.equal(r.benchmark_advisory_only,true);
});
test('incomplete benchmark does not fabricate a comparable model improvement',()=>{
  const r=evaluate({incumbent,candidate:{...candidate,cost:null}});
  assert.equal(r.decision,'INSUFFICIENT_EVIDENCE');
  assert.deepEqual(r.reasons,['benchmark_dimensions_incomplete']);
});
test('nonfinite, negative, untyped and impossible candidate evidence fails closed',()=>{
  for(const [field,value] of [
    ['cost',-1],['runtime_ms',-200],['runtime_ms','-5'],['defect_yield',NaN],
    ['false_positive_rate',-1],['false_positive_rate',1.3],
    ['reproducibility',2],['cost',Infinity],['security_fit','true']
  ]){
    const r=evaluate({incumbent,candidate:{...candidate,[field]:value}});
    assert.equal(r.decision,'INSUFFICIENT_EVIDENCE',String(field)+'='+String(value));
    assert.deepEqual(r.reasons,['benchmark_values_invalid']);
    assert.equal(r.promotion_authorized,false);
  }
});
test('invalid incumbent values cannot be laundered by a valid candidate',()=>{
  for(const [field,value] of [
    ['cost','1'],['false_positive_rate',2],['reproducibility',-1],
    ['security_fit','true']
  ]){
    assert.equal(evaluate({incumbent:{...incumbent,[field]:value},candidate}).decision,'INSUFFICIENT_EVIDENCE');
  }
});
test('unapproved baseline and candidate security regressions remain fail-closed',()=>{
  assert.deepEqual(evaluate({incumbent:{...incumbent,security_fit:false},candidate}).reasons,
    ['incumbent_security_baseline_unproven']);
  assert.deepEqual(evaluate({incumbent,candidate:{...candidate,security_fit:false}}).reasons,
    ['security_fit_regression']);
});
test('regression remains rejected; legitimate zero-cost metrics remain valid',()=>{
  assert.equal(evaluate({incumbent,candidate:{...candidate,false_positive_rate:0.3}}).decision,'REJECT');
  assert.equal(evaluate({incumbent,candidate:{...candidate,cost:0}}).decision,'ADOPT');
});
