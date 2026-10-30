import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarizePredictiveSourceRecovery,loadFailureCoverage} from '../brain/observability/failure-coverage-projection.mjs';

const fingerprint='predictive|public-market|unfiltered-top80-crowds-out-valid-source-types|20261030-v1';
const observed={fingerprint,maturity:'OBSERVED',last_seen_at:'2026-10-30T07:02:15Z',evidence:{
  runtime_canary_proven:true,source_parity:true,authorized_runtime_http:200,
  new_forecasts_written:1,independent_db_forecast_evidence_count:5,
  next_natural_runtime_proven:false,forecast_outcome_proven:false,
  private_person_key:'DO_NOT_LEAK'
}};

test('technical canary is proven, but natural run and outcome remain open',()=>{
  const p=summarizePredictiveSourceRecovery(observed);
  assert.equal(p.status,'TECHNICAL_RUNTIME_PROVEN_NATURAL_PENDING');
  assert.equal(p.maturity,'OBSERVED');
  assert.equal(p.technicalRuntimeProven,true);
  assert.equal(p.naturalRuntimeProven,false);
  assert.equal(p.outcomeProven,false);
  assert.ok(!JSON.stringify(p).includes('DO_NOT_LEAK'));
});

test('observed maturity cannot claim independent outcome even with manually set result flags',()=>{
  const p=summarizePredictiveSourceRecovery({...observed,evidence:{...observed.evidence,
    next_natural_runtime_proven:true,forecast_outcome_proven:true}});
  assert.equal(p.status,'NATURAL_RUNTIME_PROVEN_OUTCOME_PENDING');
  assert.equal(p.outcomeProven,false);
  const proven=summarizePredictiveSourceRecovery({...observed,maturity:'PROVEN',evidence:{...observed.evidence,
    next_natural_runtime_proven:true,forecast_outcome_proven:true}});
  assert.equal(proven.status,'OUTCOME_EVIDENCE_PROVEN');
});

test('missing or unsupported readback remains unverified',()=>{
  assert.equal(summarizePredictiveSourceRecovery(null).status,'UNVERIFIED');
  assert.equal(summarizePredictiveSourceRecovery({...observed,evidence:{}}).status,'RECOVERY_EVIDENCE_PENDING');
});

test('server-to-server coverage keeps private incident evidence out of portal',async()=>{
  let calls=0;
  const fakeFetch=async(url)=>{
    calls++;
    if(calls===1){
      assert.ok(url.includes('brain_failure_registry'));
      return {ok:true,headers:{get:()=> '0-0/1'},json:async()=>[
        {maturity:'OBSERVED',root_cause:'recorded',regression_ref:'test',prevention_rule:'recorded',last_seen_at:'2026-10-30T07:02:15Z'}
      ]};
    }
    assert.ok(url.includes('fingerprint=eq.'));
    return {ok:true,json:async()=>[observed]};
  };
  const result=await loadFailureCoverage({baseUrl:'https://example.supabase.co/',key:'redacted-test-key',fetchImpl:fakeFetch});
  assert.equal(calls,2);
  assert.equal(result.status,'READBACK_COMPLETE');
  assert.equal(result.totals.patterns,1);
  assert.equal(result.predictiveRecovery.status,'TECHNICAL_RUNTIME_PROVEN_NATURAL_PENDING');
  assert.ok(!JSON.stringify(result).includes('DO_NOT_LEAK'));
  const portal=readFileSync(new URL('../portal-v2/modules/powerhouse-observability.js',import.meta.url),'utf8');
  assert.ok(portal.includes('data-predictive-source-proof'));
  assert.ok(portal.includes('Technisch herstel'));
  assert.ok(portal.includes('data-evidence-status'));
});
