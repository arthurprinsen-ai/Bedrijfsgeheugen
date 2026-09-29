import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const policy=JSON.parse(fs.readFileSync('brain/policies/linkedin-company-standard-delivery-v1.json','utf8'));
const skill=fs.readFileSync('.agents/skills/linkedin-composio-publisher/SKILL.md','utf8');
const agents=fs.readFileSync('AGENTS.md','utf8');
const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const systemMap=fs.readFileSync('platform/system-map/canonical-system-map.mjs','utf8');
const brainContract=JSON.parse(fs.readFileSync('config/brain-chat-learning-contract.json','utf8'));

test('company channel rejects personal topics and retires printer globally',()=>{
  assert.equal(policy.channel,'linkedin_company');
  assert.ok(policy.forbidden_personal_topic_classes.includes('printer_scanner_story'));
  assert.ok(policy.retired_story_families.includes('printer'));
  assert.match(skill,/company LinkedIn uses business\/CEO\/MT|business-relevant subject/i);
  assert.match(agents,/printer.*globally retired/i);
});

test('production runtime is canonical auth authority with safe self-heal',()=>{
  assert.equal(policy.auth.authority,'production_powerhouse_composio');
  assert.equal(policy.auth.chat_local_state_is_diagnostic_only,true);
  assert.equal(policy.auth.require_live_token_health,true);
  assert.equal(policy.auth.safe_self_heal_before_human_oauth,true);
  assert.equal(policy.auth.buffer_fallback,false);
  assert.equal(policy.auth.make_fallback,false);
});

test('explicit user deletion permits one new-story replacement only',()=>{
  assert.equal(policy.user_deleted_recovery.explicit_user_deletion_is_verified_outcome,true);
  assert.equal(policy.user_deleted_recovery.deleted_story_remains_consumed,true);
  assert.equal(policy.user_deleted_recovery.max_same_day_replacements,1);
  assert.equal(policy.user_deleted_recovery.replacement_requires_new_story_fingerprint,true);
  assert.equal(policy.user_deleted_recovery.replacement_requires_materially_different_business_topic,true);
  assert.match(skill,/User-deleted company post recovery/);
});


test('runtime publisher blocks retired printer story before provider write',()=>{
  assert.match(publisher,/function assertLinkedInCompanyContentPolicy/);
  assert.match(publisher,/LINKEDIN_COMPANY_RETIRED_STORY_FAMILY:printer/);
  const guard=publisher.indexOf('assertLinkedInCompanyContentPolicy(commentary)');
  const create=publisher.indexOf("LINKEDIN_CREATE_LINKED_IN_POST',{author,commentary");
  assert.ok(guard>0);
  assert.ok(create>guard);
});


test('Brain and System Map inherit the company delivery policy',()=>{
  assert.equal(brainContract.policy.requireLinkedInCompanyStandardDelivery,true);
  assert.equal(brainContract.policy.companySocialRejectPersonalTopics,true);
  assert.match(systemMap,/companyStandardPolicy:'brain\/policies\/linkedin-company-standard-delivery-v1\.json'/);
  assert.match(systemMap,/printerStoryFamilyGloballyRetired:true/);
});
