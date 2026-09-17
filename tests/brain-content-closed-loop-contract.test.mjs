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

test('publisher recovers provider lineage from obligation external_id when decision delivery_ref is missing', () => {
  const publisher = read('supabase/functions/powerhouse-social-publisher/index.ts');
  assert.match(publisher, /content_publication_obligations/);
  assert.match(publisher, /external_id/);
  assert.match(publisher, /obligationByChannel/);
  assert.match(publisher, /const\s+obligation[^=]*=\s*obligationByChannel\.get\(obligationChannels\[row\.channel\]\)/);
  assert.match(publisher, /clean\(row\.delivery_ref\)\s*\|\|\s*clean\(obligation\?\.external_id\)/);
  assert.match(publisher, /delivery_ref:\s*ref/);
});

test('instagram transport readback never promotes identity-unproven media to PUBLISHED', () => {
  const publisher = read('supabase/functions/powerhouse-social-publisher/index.ts');
  assert.match(publisher, /EXACT_FINAL_MEDIA_PROOF_REQUIRED/);
  assert.match(publisher, /instagramIdentityProven/);
  assert.match(publisher, /row\.channel\s*===\s*'instagram_company'/);
  assert.match(publisher, /transport_verified_identity_unproven/);
  assert.match(publisher, /recordObligation\(db,\s*runDate,\s*row\.channel,\s*'BLOCKED'/);
});

test('orchestrator exposes unsupported channel obligations as machine-readable hard boundaries rather than silent hold', () => {
  const orchestrator = read('supabase/functions/powerhouse-content-orchestrator/index.ts');
  assert.match(orchestrator, /BLOCKED_HARD_BOUNDARY/);
  assert.match(orchestrator, /capability_state/);
  assert.match(orchestrator, /executor_capabilities/);
});

test('orchestrator preserves content_ready until executor consumes artifact', () => {
  const orchestrator = read('supabase/functions/powerhouse-content-orchestrator/index.ts');
  assert.match(orchestrator, /COVERED_STATES\s*=\s*new Set\(\[[^\]]*'content_ready'/);
  assert.match(orchestrator, /if \(shouldPreserveExisting\(previous\)\) continue;/);
});

test('database has one canonical reconciliation loop and guards invoke it before recovery', () => {
  const migration = read('supabase/migrations/20260917235901_content_closed_loop_reconciliation.sql');
  assert.match(migration, /powerhouse_reconcile_content_outcomes_v1/);
  assert.match(migration, /PROVIDER_RECORD_MISSING/);
  assert.match(migration, /provider_truth_verified/);
  assert.match(migration, /powerhouse_linkedin_personal_daily_guard_v1/);
  assert.match(migration, /powerhouse_linkedin_company_daily_guard_v1/);
  assert.match(migration, /powerhouse_blog_daily_guard_v1/);
  assert.match(migration, /powerhouse_instagram_daily_guard_v1/);
  assert.match(migration, /powerhouse_content_closed_loop_tick_v1/);
});

test('single scheduler replaces parallel content-control cron lanes', () => {
  const scheduler = read('supabase/migrations/20260917235902_content_closed_loop_scheduler.sql');
  assert.match(scheduler, /powerhouse-content-closed-loop-v1/);
  assert.match(scheduler, /powerhouse_content_closed_loop_tick_v1/);
  for (const legacy of [
    'powerhouse-content-orchestrator-daily',
    'powerhouse-social-publisher-daytime',
    'bg-buffer-sync-hourly-daytime',
    'powerhouse-linkedin-company-daily-guard-v1',
    'powerhouse-linkedin-personal-daily-guard-v1',
    'powerhouse-blog-daily-guard-v1',
    'powerhouse-instagram-daily-guard-v1',
  ]) assert.match(scheduler, new RegExp(legacy));
  assert.match(scheduler, /LEGACY_CONTENT_CONTROL_SCHEDULER_STILL_ACTIVE/);
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

test('supervisor audits provider truth before orchestrator can replan existing delivery state', () => {
  const loop = read('supabase/functions/powerhouse-content-loop/index.ts');
  const audit = loop.indexOf("'powerhouse-social-publisher', { runDate, mode: 'audit_only' }");
  const orchestrate = loop.indexOf("'powerhouse-content-orchestrator', { runDate }");
  assert.ok(audit >= 0, 'pre-orchestration provider audit must exist');
  assert.ok(orchestrate >= 0, 'orchestrator invocation must exist');
  assert.ok(audit < orchestrate, 'provider audit must happen before orchestration');
});

test('public APIs keep provider and backend diagnostics internal', () => {
  const operations = read('supabase/functions/content-operations/index.ts');
  const loop = read('supabase/functions/powerhouse-content-loop/index.ts');
  const orchestrator = read('supabase/functions/powerhouse-content-orchestrator/index.ts');
  assert.doesNotMatch(operations, /error:\s*String\(\(e as Error\)\?\.message/);
  assert.doesNotMatch(loop, /error:\s*message,\s*execution/);
  assert.doesNotMatch(orchestrator, /return json\(\{ok:false,error:message/);
  assert.match(orchestrator, /ORCHESTRATOR_INTERNAL_ERROR/);
});

test('cockpit health is outcome-based and never counts DISPATCHED as green', () => {
  const operations = read('supabase/functions/content-operations/index.ts');
  assert.match(operations, /outcomeVerified/);
  assert.match(operations, /providerTruthVerified/);
  assert.equal(/liveProven:\s*items\.filter\([^\n]*DISPATCHED/.test(operations), false);
});

test('autonomous improvement fixes executor rather than weakening immutable identity guard', () => {
  const migration = read('supabase/migrations/20260917235903_autonomous_improvement_immutable_identity_fix.sql');
  assert.match(migration, /powerhouse_autonomous_improvement_executor_v1/);
  assert.match(migration, /brain_guard_obligation_identity/);
  assert.match(migration, /IMMUTABLE_IDENTITY_GUARD_WEAKENED/);
  assert.match(migration, /payload_sha256=excluded\.payload_sha256/);
  assert.match(migration, /position\('payload_sha256=excluded\.payload_sha256' in v_executor\)>0/);
});
