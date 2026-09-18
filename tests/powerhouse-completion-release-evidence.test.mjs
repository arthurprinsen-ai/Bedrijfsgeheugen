import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const netlify=await readFile(new URL('../netlify/functions/completion-release-readiness.mjs',import.meta.url),'utf8');
const edge=await readFile(new URL('../supabase/functions/powerhouse-release-evidence-sync/index.ts',import.meta.url),'utf8');
const migration=await readFile(new URL('../supabase/migrations/20260918060000_powerhouse_completion_hardening_v2.sql',import.meta.url),'utf8');

test('production release readiness is exact-identity and fail-closed',()=>{
  assert.match(netlify,/COMMIT_REF/);
  assert.match(netlify,/DEPLOY_ID/);
  assert.match(netlify,/context==='production'/);
  assert.match(netlify,/status:ready\?200:503/);
  assert.match(edge,/exact_production_match:true/);
  assert.match(edge,/PRODUCTION_IDENTITY_INVALID/);
  assert.match(edge,/github-delivery/);
  assert.match(edge,/netlify-production/);
});

test('completion readiness distinguishes demo and pending claim from identity errors',()=>{
  assert.match(migration,/demo_rows/);
  assert.match(migration,/pending_claim_rows/);
  assert.match(migration,/unresolved_error_rows/);
  assert.match(migration,/tenant_identity_status='demo'/);
  assert.match(migration,/tenant_identity_status='unverified'/);
});

test('completion capability status is observed, not synthesized',()=>{
  assert.match(migration,/human_feedback_ingest_available/);
  assert.match(migration,/action_economics_ingest_available/);
  assert.match(migration,/realized_value_event_available/);
  assert.match(migration,/observed_events/);
});
