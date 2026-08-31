import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExternalIntelligencePlan} from '../brain/operating-loop/external-intelligence-loop.mjs';

test('cross-domain intelligence requires verified evidence and produces impact, recommendation and decision-ready advice',()=>{
  const input={tenantId:'T1',domain:'market',signalId:'S1',subjectId:'market:segment-a',owner:'strategy',correlationId:'C1',evidence:[{id:'E1',verified:true,source:'official-source'}],signal:{summary:'Demand rising',confidence:.9,urgency:.8,impact:.7,recommendation:'Increase capacity'}};
  const plan=buildExternalIntelligencePlan(input,{impactId:'IMP1'});
  assert.equal(plan.status,'READY');
  assert.equal(plan.signal.type,'Signal');
  assert.equal(plan.impact.type,'Impact');
  assert.equal(plan.advice.recommendation,'Increase capacity');
  assert.deepEqual(plan.advice.evidenceIds,['E1']);
  assert.equal(plan.advice.correlationId,'C1');
});

test('unverified or ownerless signals fail closed',()=>{
  assert.throws(()=>buildExternalIntelligencePlan({tenantId:'T1',domain:'regulation',signalId:'S1',subjectId:'reg:1',owner:'legal',evidence:[{id:'E1',verified:false}],signal:{recommendation:'Act'}}),/verified evidence/i);
  assert.throws(()=>buildExternalIntelligencePlan({tenantId:'T1',domain:'technology',signalId:'S1',subjectId:'tech:1',owner:'UNASSIGNED',evidence:[{id:'E1',verified:true}],signal:{recommendation:'Act'}}),/owner/i);
});

test('supported domains include market competitor customer technology regulation and seo',()=>{
  for(const domain of ['market','competitor','customer','technology','regulation','seo']){
    const plan=buildExternalIntelligencePlan({tenantId:'T1',domain,signalId:`S-${domain}`,subjectId:`${domain}:1`,owner:'agent',evidence:[{id:`E-${domain}`,verified:true}],signal:{confidence:.8,urgency:.7,impact:.6,recommendation:'Review'}} ,{impactId:`I-${domain}`});
    assert.equal(plan.domain,domain);
  }
});
