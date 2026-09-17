import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => {
  assert.ok(existsSync(path), `${path} must exist`);
  return readFileSync(path, 'utf8');
};

test('personal LinkedIn requires explicit verified truth in source, artifact and final review', () => {
  const orchestrator = read('supabase/functions/powerhouse-content-orchestrator/index.ts');
  const review = read('supabase/functions/bg-pre-publish-review/index.ts');
  const publisher = read('supabase/functions/powerhouse-social-publisher/index.ts');
  for (const [name, text] of [['orchestrator', orchestrator], ['review', review], ['publisher', publisher]]) {
    assert.match(text, /personal_truth_verified/, `${name} must enforce personal_truth_verified`);
  }
  assert.match(orchestrator, /personal_truth_verified\s*===\s*true/);
  assert.match(review, /PERSONAL_TRUTH_UNVERIFIED/);
});

test('publisher treats missing provider readback as stale state instead of a successful dispatch', () => {
  const publisher = read('supabase/functions/powerhouse-social-publisher/index.ts');
  assert.match(publisher, /PROVIDER_RECORD_MISSING/);
  assert.match(publisher, /stale_delivery_ref/);
  assert.match(publisher, /provider_truth_verified/);
});

test('orchestrator exposes unsupported channel obligations as machine-readable hard boundaries rather than silent hold', () => {
  const orchestrator = read('supabase/functions/powerhouse-content-orchestrator/index.ts');
  assert.match(orchestrator, /BLOCKED_HARD_BOUNDARY/);
  assert.match(orchestrator, /capability_state/);
  assert.match(orchestrator, /executor_capabilities/);
});

test('database has one canonical reconciliation loop and guards invoke it before recovery', () => {
  const path = 'supabase/migrations/20260917_content_closed_loop_reconciliation.sql';
  const migration = read(path);
  assert.match(migration, /powerhouse_reconcile_content_outcomes_v1/);
  assert.match(migration, /PROVIDER_RECORD_MISSING/);
  assert.match(migration, /provider_truth_verified/);
  assert.match(migration, /powerhouse_linkedin_personal_daily_guard_v1/);
  assert.match(migration, /powerhouse_linkedin_company_daily_guard_v1/);
  assert.match(migration, /powerhouse_blog_daily_guard_v1/);
  assert.match(migration, /powerhouse_instagram_daily_guard_v1/);
  assert.match(migration, /powerhouse_content_closed_loop_tick_v1/);
});

test('single content supervisor drains generation, dispatches, readbacks and reconciles', () => {
  const loop = read('supabase/functions/powerhouse-content-loop/index.ts');
  assert.match(loop, /powerhouse_reconcile_content_outcomes_v1/);
  assert.match(loop, /powerhouse-content-orchestrator/);
  assert.match(loop, /powerhouse-social-publisher/);
  assert.match(loop, /powerhouse-blog-queue/);
  assert.match(loop, /bg-buffer-sync/);
  assert.match(loop, /GREEN MEANS OUTCOME VERIFIED/);
  assert.match(loop, /loop_state/);
});

test('cockpit health is outcome-based and never counts DISPATCHED as green', () => {
  const operations = read('supabase/functions/content-operations/index.ts');
  assert.match(operations, /outcomeVerified/);
  assert.match(operations, /providerTruthVerified/);
  assert.equal(/liveProven:\s*items\.filter\([^\n]*DISPATCHED/.test(operations), false);
});
