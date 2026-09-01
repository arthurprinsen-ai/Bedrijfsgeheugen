import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRuntimePassportEvidence} from '../platform/read-models/data-ai-runtime-evidence.mjs';
import {buildPassportFromState} from '../portal/data-ai-passport.mjs';
import {renderCompany} from '../portal/render-company.mjs';

test('runtime evidence verifies auth controls and reports real configured regions',()=>{
  const runtime=buildRuntimePassportEvidence({company:{name:'Acme'},audit:[{id:'a1'}],agents:[{name:'Copilot',provider:'OpenAI',model:'gpt-x',riskClass:'limited'}]}, {env:{AWS_REGION:'us-east-1',BG_PORTAL_STORAGE_REGION:'us-east-1'},now:()=> '2026-09-01T20:30:00.000Z'});
  assert.equal(runtime.technicalFacts.processingRegion,'us-east-1');
  assert.equal(runtime.technicalFacts.storageRegion,'us-east-1');
  const passport=buildPassportFromState({dataAiRuntime:runtime});
  assert.equal(passport.controls.find(x=>x.id==='access-control').status,'verified');
  assert.equal(passport.controls.find(x=>x.id==='data-residency').status,'verified');
  assert.match(passport.controls.find(x=>x.id==='model-register').claim,/OpenAI \/ gpt-x/);
});

test('unknown storage region stays partially verified instead of green',()=>{
  const runtime=buildRuntimePassportEvidence({}, {env:{AWS_REGION:'us-east-1'},now:()=> '2026-09-01T20:30:00.000Z'});
  const passport=buildPassportFromState({dataAiRuntime:runtime});
  const residency=passport.controls.find(x=>x.id==='data-residency');
  assert.equal(residency.status,'partially_verified');
  assert.match(residency.claim,/us-east-1/);
});

test('explicit tenant evidence augments runtime evidence without losing runtime proof',()=>{
  const runtime=buildRuntimePassportEvidence({}, {env:{AWS_REGION:'us-east-1'},now:()=> '2026-09-01T20:30:00.000Z'});
  const passport=buildPassportFromState({dataAiRuntime:runtime,dataAiPassport:{controls:[{id:'retention',claim:'30 dagen',owner:'Acme',evidence:[{id:'retention-policy',source:'DPA annex',verified:true,confidence:100}]}]}});
  const retention=passport.controls.find(x=>x.id==='retention');
  assert.equal(retention.status,'verified');
  assert.equal(retention.claim,'30 dagen');
});

test('Data & systemen exposes the live Data AI Passport entry point',()=>{
  const html=renderCompany({health:{cards:[],risks:[],actions:[]},graph:{nodes:[]},route:'company/data'});
  assert.match(html,/DATA & AI · LIVE EVIDENCE/);
  assert.match(html,/href="\/portal\/data-ai-passport\.html"/);
  assert.match(html,/Open Data & AI Passport/);
});
