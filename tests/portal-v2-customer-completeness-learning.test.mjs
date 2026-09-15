import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('config/brain-chat-learning-contract.json','utf8'));
const prevention=JSON.parse(fs.readFileSync('config/delivery-prevention-rules.json','utf8'));
const sourcePath='brain/learning/portal-v2-customer-project-completeness-2026-09-15.json';

function learning(){
  return JSON.parse(fs.readFileSync(sourcePath,'utf8'));
}

const REQUIRED_RULES=[
  'REQUIRE_COMPLETE_CUSTOMER_PROJECT_PARITY_BEFORE_PORTAL_V2_GREEN',
  'BLOCK_GENERIC_PORTAL_SHELL_UNTIL_CUSTOMER_CONTEXT_HYDRATED',
  'REQUIRE_EXACT_SHA_PRODUCTION_READBACK_BEFORE_LIVE_CLAIM'
];

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

test('known failure class has active prevention rules wired to concrete gates',()=>{
  const rules=new Map(prevention.rules.map(rule=>[rule.id,rule]));
  for(const id of REQUIRED_RULES){
    assert.equal(rules.get(id)?.active,true,`${id} must be active`);
    assert.ok(rules.get(id)?.enforcedBy,`${id} needs an enforcement gate`);
  }
  const record=learning();
  assert.deepEqual(new Set(record.prevention_rule_ids),new Set(REQUIRED_RULES));
});

test('live claim requires candidate tests, exact deploy identity and production route readback',()=>{
  const release=learning().release_contract;
  assert.equal(release.require_candidate_tests,true);
  assert.equal(release.require_exact_deploy_sha,true);
  assert.equal(release.require_production_route_readback,true);
  assert.equal(release.allow_live_claim_before_all_three,false);
});
