import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const policy=JSON.parse(read('brain/policies/powerhouse-incident-register-and-self-fix-v1.json'));
const lifecycle=policy.first_time_right_incident_lifecycle_v1;
const agents=read('AGENTS.md');
const delivery=read('.agents/skills/powerhouse-delivery-self-optimization/SKILL.md');
const recovery=read('.agents/skills/powerhouse-recovery-proof/SKILL.md');

test('original single-registry First Time Right contract is active and fail-closed',()=>{
 assert.ok(policy.revision>=7);
 assert.equal(policy.fail_closed,true);
 assert.equal(lifecycle.status,'ACTIVE_POLICY_WITH_SOURCE_COVERAGE_GAPS');
 assert.equal(lifecycle.original_write_function,'public.brain_observe_failure');
 assert.equal(lifecycle.occurrence_readback,'public.brain_failure_occurrences');
 assert.equal(lifecycle.requires_full_terminal_proof_before_resolved,true);
 assert.equal(lifecycle.synthetic_test_is_real_production_incident,false);
 assert.equal(lifecycle.when_canonical_write_unavailable,'INCIDENT_LOG_WRITEBACK_UNVERIFIED');
 assert.ok(lifecycle.never.includes('EXPOSE_SERVICE_ROLE_SECRETS_TO_UNTRUSTED_PR'));
});
test('hard prereqs and terminal outcome/readback are never confused with source compilation',()=>{
 for(const needed of ['EXCLUSIVE_OWNER_AND_WRITER_LEASE','SOURCE_LINEAGE_QUALITY_FRESHNESS','SECURITY_PRIVACY_AUTH_AND_CONSENT','IDEMPOTENCY_DUPLICATE_PREVENTION','REGRESSION_TEST_AND_RECOVERY_ROLLBACK','NATIVE_POST_RELEASE_AND_INDEPENDENT_PROVIDER_OUTCOME_PROOF_PLAN']){
  assert.ok(lifecycle.prebuild_requirements.includes(needed),needed);
 }
 for(const stage of ['OBSERVED','REGISTERED','ROOT_CAUSE_VERIFIED','FIX_TESTED','PROTECTED_RELEASED','PRODUCTION_READBACK','PROVIDER_OR_CUSTOMER_OUTCOME_PROVEN','LEARNING_WRITTEN','RECURRENCE_WATCHED'])assert.ok(lifecycle.phases.includes(stage),stage);
 assert.equal(lifecycle.on_missing_original_provider_readback,'RECOVERY_NOT_PROVEN');
 assert.equal(lifecycle.on_unverified_coverage,'SOURCE_COVERAGE_UNVERIFIED');
});
test('original agents plus two original skills inherit same obligatory incident protocol',()=>{
 for(const [path,text] of [['AGENTS.md',agents],['delivery skill',delivery],['recovery skill',recovery]]){
  for(const phrase of ['INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1','BLOCKED_BEFORE_BUILD','INCIDENT_LOG_WRITEBACK_UNVERIFIED','PROVIDER_OR_CUSTOMER_OUTCOME_PROVEN','NOT_YET_INDEPENDENTLY_PROVEN','brain_observe_failure','brain_failure_occurrences'])assert.ok(text.includes(phrase),path+' missing '+phrase);
 }
 assert.ok(agents.includes('## 4 november 2026 — First Time Right incident- en afsluitlevenscyclus'));
});
test('historical live evidence and observed automatic coverage remain distinct',()=>{
 const v=lifecycle.live_verification;
 assert.equal(v.native_ftr_admission,'NEGATIVE_AND_POSITIVE_LIVE_PROVEN');
 assert.equal(v.negative_run_id,41797450956);
 assert.equal(v.positive_run_id,41797567508);
 assert.equal(v.canonical_synthetic_occurrence,'ONE_READBACK_CONFIRMED');
 assert.equal(v.automatic_future_github_to_brain_ingestion,'NOT_YET_INDEPENDENTLY_PROVEN');
 assert.ok(lifecycle.never.includes('COUNT_SYNTHETIC_CANARY_AS_PRODUCTION_INCIDENT'));
 assert.ok(lifecycle.never.includes('COUNT_TRIAGE_AS_PROVIDER_RESOLUTION'));
});
test('regression source and same original single-authority policy remain referenced',()=>{
 assert.equal(lifecycle.regression,'tests/brain-first-time-right-agent-incident-lifecycle-20261104.test.mjs');
 assert.equal(policy.fingerprint,'agents-skills-register-and-self-fix-v1');
 assert.equal(policy.enforcement.entrypoint,'scripts/brain/chat-learning-preflight.mjs');
 assert.equal(policy.skill_protocol.marker,'INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1');
});
