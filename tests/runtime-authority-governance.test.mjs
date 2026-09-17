import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluateRuntimeAuthority} from '../brain/operating-loop/runtime-authority-governance.mjs';

const registryPath='config/powerhouse-runtime-authority.json';
const registry=JSON.parse(await readFile(registryPath,'utf8'));

const active=registry.components.filter(x=>x.authority==='ACTIVE');
const retired=registry.components.filter(x=>x.classification==='LEGACY_RETIRED_PATH');

function ownersFor(obligation){
  return active.filter(x=>(x.obligations||[]).includes(obligation));
}

test('retired executors can never be active authority',()=>{
  assert.ok(retired.length>0,'expected explicit retired provenance entries');
  assert.ok(retired.every(x=>x.authority==='NONE'));
  assert.ok(retired.every(x=>x.production_execution_allowed===false));
});

test('every material obligation has exactly one active owner',()=>{
  for(const obligation of registry.material_obligations){
    const owners=ownersFor(obligation);
    assert.equal(owners.length,1,`${obligation} must have exactly one active owner, found ${owners.map(x=>x.id).join(', ')||'none'}`);
  }
});

test('seven-channel daily contract is fully mapped',()=>{
  const expected=['email_newsletter','linkedin_personal','linkedin_company','linkedin_article_personal','linkedin_article_company','instagram_company','blog'];
  assert.deepEqual([...registry.channels.map(x=>x.channel)].sort(),[...expected].sort());
  for(const channel of registry.channels){
    assert.ok(channel.owner_component_id,`${channel.channel} missing owner_component_id`);
    assert.ok(channel.delivery_runtime,`${channel.channel} missing delivery_runtime`);
    assert.ok(channel.evidence_policy,`${channel.channel} missing evidence_policy`);
  }
});

test('Make is provenance only and cannot silently resume',()=>{
  const makeEntries=registry.components.filter(x=>x.runtime==='make');
  assert.ok(makeEntries.length>0,'Make provenance must remain inventoried');
  assert.ok(makeEntries.every(x=>x.authority==='NONE'));
  assert.ok(makeEntries.every(x=>x.resume_policy==='EXPLICIT_REENABLE_THROUGH_CURRENT_GATES_ONLY'));
});

test('runtime drift and interrupted-run recovery are mandatory controls',()=>{
  assert.equal(registry.controls.single_owner_gate,'FAIL_CLOSED');
  assert.equal(registry.controls.runtime_drift_detector,'ENABLED');
  assert.equal(registry.controls.interrupted_run_recovery,'EXISTING_BRAIN_OBLIGATION_RUNTIME');
  assert.equal(registry.controls.writeback_route,'public.brain_append_record');
});

test('runtime evaluator fails closed on duplicate ownership',()=>{
  const broken=structuredClone(registry);
  broken.components.push({
    id:'rogue-duplicate-owner',runtime:'github',classification:'ACTIVE',authority:'ACTIVE',production_execution_allowed:true,
    obligations:[registry.material_obligations[0]]
  });
  const result=evaluateRuntimeAuthority(broken);
  assert.equal(result.ready,false);
  assert.ok(result.violations.some(x=>x.code==='DUPLICATE_MATERIAL_OWNER'));
});

test('runtime evaluator fails closed when retired Make is reactivated',()=>{
  const broken=structuredClone(registry);
  const make=broken.components.find(x=>x.runtime==='make');
  make.authority='ACTIVE';
  make.production_execution_allowed=true;
  const result=evaluateRuntimeAuthority(broken);
  assert.equal(result.ready,false);
  assert.ok(result.violations.some(x=>x.code==='RETIRED_EXECUTOR_ACTIVE'));
});

test('canonical registry evaluates READY',()=>{
  const result=evaluateRuntimeAuthority(registry);
  assert.equal(result.ready,true);
  assert.deepEqual(result.violations,[]);
});
