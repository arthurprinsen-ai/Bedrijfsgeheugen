import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('config/brain-chat-learning-contract.json','utf8'));
const prevention=JSON.parse(fs.readFileSync('config/delivery-prevention-rules.json','utf8'));
const sourcePath='brain/learning/portal-v2-customer-project-completeness-2026-09-15.json';

function learning(){
  return JSON.parse(fs.readFileSync(sourcePath,'utf8'));
}

test('customer project incident is linked into the existing canonical chat-learning graph',()=>{
  assert.ok(contract.canonicalSources.includes('config/delivery-prevention-rules.json'));
  assert.ok(prevention.linked_learning_sources?.includes(sourcePath),'canonical prevention source must link the verified incident record');
  const record=learning();
  assert.equal(record.fingerprint,'portal-v2|customer-project|incomplete-or-wrong-context-before-green');
  assert.equal(record.type,'verified_material_learning');
  assert.equal(record.status,'VERIFIED');
});

test('learning permanently covers complete project parity and startup hydration',()=>{
  const record=learning();
  const required=['offerte','onderdelen','sprints','user stories','roadmap','taken','documenten','koppelingen'];
  for(const item of required) assert.ok(record.required_project_surfaces.includes(item),`missing project surface: ${item}`);
  assert.equal(record.hydration_contract.fail_closed,true);
  assert.equal(record.hydration_contract.generic_shell_visible_before_context,false);
  assert.equal(record.demo_contract.fictional_only,true);
  assert.equal(record.demo_contract.all_project_surfaces_populated,true);
});

test('known failure class reuses existing enforced gates instead of creating a parallel prevention truth',()=>{
  const record=learning();
  const controls=new Map(record.prevention_controls.map(control=>[control.id,control]));
  assert.equal(controls.get('portal-v2-project-parity-and-complete-demo-regressions')?.type,'regression-gate');
  assert.equal(controls.get('portal-v2-hydration-guard-regressions')?.type,'regression-gate');
  const releaseRule=prevention.rules.find(rule=>rule.id==='REQUIRE_EXACT_DEPLOY_IDENTITY_BEFORE_PRODUCTION_GREEN');
  assert.equal(releaseRule?.active,true);
  assert.equal(controls.get('REQUIRE_EXACT_DEPLOY_IDENTITY_BEFORE_PRODUCTION_GREEN')?.type,'active-prevention-rule');
});

test('live claim requires candidate tests, exact deploy identity and production route readback',()=>{
  const release=learning().release_contract;
  assert.equal(release.require_candidate_tests,true);
  assert.equal(release.require_exact_deploy_sha,true);
  assert.equal(release.require_production_route_readback,true);
  assert.equal(release.allow_live_claim_before_all_three,false);
});
