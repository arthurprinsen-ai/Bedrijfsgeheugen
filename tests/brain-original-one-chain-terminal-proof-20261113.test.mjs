import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration=readFileSync(new URL(
  '../supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql',
  import.meta.url),'utf8');

test('a terminal BRAIN content handoff must use the original source and exact consumer revision',()=>{
  for(const part of [
    'BEFORE INSERT OR UPDATE ON public.brain_obligations',
    "NEW.state NOT IN ('FULFILLED','CANCELLED')",
    'FROM public.content_publication_obligations c',
    "NEW.evidence->>'tenant_id'",
    'v_expected_revision',
    "source_record_key",
    "source_correlation_id",
    "payload_sha256",
    "consumer_ack,accepted",
    "consumer_ack,source_revision",
    "consumer_ack,source_correlation_id",
    "consumer_ack,owner",
    "consumer_ack,source_status",
    "consumer_ack,stage",
    "ERRCODE='23514'"
  ]) assert.ok(migration.includes(part),'Missing terminal source/ACK guard: '+part);
});

test('a historical or current no-publish veto cannot be misreported as sent',()=>{
  for(const part of [
    "'NO_PUBLISH_POLICY_ACK'","'NO_PUBLISH'",
    "consumer_ack,no_publish_veto_accepted",
    "no_publish_consumer,accepted",
    'v_source.external_id IS NOT NULL',
    'v_source.published_at IS NOT NULL',
    'v_source.live_proven_at IS NOT NULL',
    "possible_provider_side_effect",
    "reconciliation_required",
    "CONTENT_HANDOFF_TERMINAL_VETO_PROOF_REQUIRED"
  ]) assert.ok(migration.includes(part),'Missing no-publish safeguard: '+part);
});

test('full completion cannot come from source ACK alone',()=>{
  for(const part of [
    "'PROVEN_NEXT_EXPERIMENT_HANDOFF'",
    "consumer_ack,provider_proven",
    "consumer_ack,measurement_proven",
    "consumer_ack,experiment_proven",
    "producer,verified",
    "measurement_consumer,source_event_id",
    "analysis_consumer,evaluation_id",
    "experiment_consumer,next_provider_id",
    'v_source.learned_at IS NULL',
    "learning_applied_verified",
    "netlify_deploy_id",
    "public_http_status",
    "provider_truth_verified",
    "producer,provider_id"
  ]) assert.ok(migration.includes(part),'Missing independent outcome condition: '+part);
});

test('guard is an original writer fence, not a parallel executor or public API',()=>{
  assert.match(migration,/SECURITY INVOKER/);
  assert.match(migration,/REVOKE ALL ON FUNCTION public\.brain_guard_content_terminal_proof_v1\(\) FROM PUBLIC, anon, authenticated/);
  assert.doesNotMatch(migration,/SECURITY DEFINER|GRANT EXECUTE|CREATE (?:TABLE|POLICY|EXTENSION)|cron\.schedule\s*\(|net\.http_post\s*\(|\bhttp_post\s*\(/i);
  assert.equal((migration.match(/CREATE TRIGGER brain_content_handoff_terminal_proof_guard_v1/g)||[]).length,1);
  assert.match(migration,/NEW\.capability_id='content:email_newsletter'/);
  assert.match(migration,/NEW\.business_entity IS DISTINCT FROM 'original-provider-to-learning-chain'/);
});
