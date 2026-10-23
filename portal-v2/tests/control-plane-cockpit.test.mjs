import test from 'node:test';
import assert from 'node:assert/strict';
import { controlPlaneCockpitMarkup } from '../control-plane-cockpit.js';

test('cockpit shows only requested operational decision fields per obligation',()=>{
  const html=controlPlaneCockpitMarkup({
    generatedAt:'2026-09-18T20:00:00Z',
    metrics:{obligations_total:2,obligations_fulfilled:1,first_time_right_pct:50,retries_total:1,escalations_total:0,false_success_risk_count:0,human_intervention_count:0},
    obligations:[{
      obligation_id:'1',obligation_key:'demo',requested_goal:'Doe het',current_state:'RUNNING',
      evidence_count:4,red_evidence_count:1,blocker:'Geen',next_action:'VERIFY_PRODUCTION',actual_result:'Nog open',
      retry_count:1,reconciliation_jobs:1,outcome_verified:false,migration_readback_verified:false
    }]
  });
  for(const value of ['Doe het','RUNNING','Bewijs','Blokkade','Volgende actie','VERIFY_PRODUCTION','Resultaat','Nog open']) assert.match(html,new RegExp(value));
  assert.doesNotMatch(html,/payload_sha256|service_role|raw evidence/i);
});

test('cockpit metrics include first-time-right and false-success visibility',()=>{
  const html=controlPlaneCockpitMarkup({metrics:{first_time_right_pct:75,false_success_risk_count:2},obligations:[]});
  assert.match(html,/First time right/);
  assert.match(html,/75\.0%/);
  assert.match(html,/False-success risk/);
});

test('FULFILLED without an actual outcome receipt is red rather than a green release',()=>{
  const html=controlPlaneCockpitMarkup({
    metrics:{obligations_total:1,obligations_fulfilled:1},
    obligations:[{obligation_key:'customer-value',requested_goal:'Waarde leveren',current_state:'FULFILLED',
      outcome_verified:false,migration_readback_verified:true,evidence_count:9,red_evidence_count:0}]
  });
  assert.match(html,/data-state="bad"/);
  assert.match(html,/FULFILLED · UITKOMST ONBEWEZEN/);
  assert.match(html,/Geclaimd afgerond/);
  assert.match(html,/Geen productiesucces bewezen/);
  assert.doesNotMatch(html,/data-state="ok"/);
});

test('Only literal outcome_verified=true promotes FULFILLED to green',()=>{
  const verified=controlPlaneCockpitMarkup({obligations:[
    {obligation_key:'done',current_state:'FULFILLED',outcome_verified:true}
  ]});
  assert.match(verified,/data-state="ok"/);
  assert.doesNotMatch(verified,/UITKOMST ONBEWEZEN|Geen productiesucces bewezen/);
  const forged=controlPlaneCockpitMarkup({obligations:[
    {obligation_key:'forged',current_state:'FULFILLED',outcome_verified:'true'}
  ]});
  assert.match(forged,/data-state="bad"/);
  assert.match(forged,/Outcome open/);
});

test('Unverified outcomes do not allow HTML injection into the control-plane screen',()=>{
  const html=controlPlaneCockpitMarkup({obligations:[
    {obligation_key:'<script>alert(1)</script>',current_state:'FULFILLED',outcome_verified:null}
  ]});
  assert.doesNotMatch(html,/<script>/);
  assert.match(html,/&lt;script&gt;/);
});
