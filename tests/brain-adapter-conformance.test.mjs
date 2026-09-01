import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluateAdapterConformance} from '../brain/operating-loop/adapter-conformance.mjs';

const registry=JSON.parse(await readFile('config/brain-platform-adapters.json','utf8'));
const completeEvidence=platform=>({platform,compatibility_mapping:true,regression_contract:true,shared_memory:true,health:'healthy',freshness:'fresh',error:null,owner:'Integration Guardian',cost:0,revision:'a'.repeat(40),capacity:'available',execution_proof:{accepted:true,executed:true,authority:'BG169',candidate_revision:'a'.repeat(40),verified_at:'2026-09-01T06:00:00Z'},exact_revision_evidence:true,rollback_verified:true,whole_brain_lineage_verified:true,last_verified_at:'2026-09-01T06:00:00Z'});

test('every registered adapter receives exactly one conformance result',()=>{
  const evidence=Object.fromEntries(registry.platforms.map(p=>[p.platform,completeEvidence(p.platform)]));
  const result=evaluateAdapterConformance(registry,evidence);
  assert.equal(result.platforms.length,registry.platforms.length);
  assert.equal(new Set(result.platforms.map(x=>x.platform)).size,registry.platforms.length);
  assert.ok(result.platforms.every(x=>x.status==='READY'&&x.productionReady===true));
});

test('registration alone never proves production readiness',()=>{
  const result=evaluateAdapterConformance(registry,{});
  assert.ok(result.platforms.every(x=>x.productionReady===false));
  assert.ok(result.platforms.every(x=>x.status==='INCOMPLETE'));
  assert.ok(result.platforms.every(x=>x.missing.includes('health_freshness_error_owner_cost_revision')));
});

test('unavailable capacity or unverified execution blocks production',()=>{
  const make={...completeEvidence('make'),capacity:'paused'};
  const result=evaluateAdapterConformance(registry,{make});
  const item=result.platforms.find(x=>x.platform==='make');
  assert.equal(item.status,'BLOCKED');
  assert.equal(item.productionReady,false);
  assert.ok(item.blocked.includes('capacity_available'));
});

test('unknown adapters fail closed and cannot self-promote',()=>{
  const extended={...registry,platforms:[...registry.platforms,{platform:'future_unknown',lane:'automation'}]};
  const result=evaluateAdapterConformance(extended,{future_unknown:completeEvidence('future_unknown')});
  const item=result.platforms.find(x=>x.platform==='future_unknown');
  assert.equal(item.status,'INCOMPLETE');
  assert.equal(item.productionReady,false);
  assert.ok(item.missing.includes('compatibility_mapping'));
  assert.ok(item.missing.includes('regression_contract'));
});

test('adapter conformance contract mirrors the platform readiness requirements',async()=>{
  const contract=JSON.parse(await readFile('brain/contracts/adapter-conformance-v1.json','utf8'));
  assert.equal(contract.version,'ADAPTER-CONFORMANCE-v1');
  assert.deepEqual(contract.requiredEvidence,registry.activation.production_ready_requires);
  assert.equal(contract.registrationIsReadiness,false);
  assert.equal(contract.unknownAdapterState,'INCOMPLETE');
  assert.equal(registry.conformance_contract,'ADAPTER-CONFORMANCE-v1');
});
