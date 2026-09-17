import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const orchestrator = readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts', 'utf8');
const publisher = readFileSync('supabase/functions/powerhouse-social-publisher/index.ts', 'utf8');
const prePublishReview = readFileSync('supabase/functions/bg-pre-publish-review/index.ts', 'utf8');
const registry = JSON.parse(readFileSync('config/powerhouse-quality-surface-contracts.json', 'utf8'));
const cockpitMigration = 'supabase/migrations/20260916163500_content_operations_cockpit_projection_repair_v1.sql';

const evidenceContract = 'tests/supabase-powerhouse-content-edge-surface-contract.test.mjs';
const byId = new Map(registry.surfaces.map(surface => [surface.id, surface]));

test('quality registry owns both restored content Edge Function surfaces', () => {
  for (const [id, authority] of [
    ['function:powerhouse-content-orchestrator', 'supabase/functions/powerhouse-content-orchestrator/index.ts'],
    ['function:powerhouse-social-publisher', 'supabase/functions/powerhouse-social-publisher/index.ts'],
  ]) {
    const surface = byId.get(id);
    assert.ok(surface, `${id} must be registered`);
    assert.equal(surface.authority, authority);
    assert.equal(surface.evidence_contract, evidenceContract);
    assert.equal(surface.required, true);
  }
});

test('quality registry owns the bg_geheim RPC dependency discovered from the restored functions', () => {
  const surface = byId.get('rpc:bg_geheim');
  assert.ok(surface, 'rpc:bg_geheim must be registered');
  assert.equal(surface.authority, 'supabase/functions/powerhouse-social-publisher/index.ts');
  assert.equal(surface.evidence_contract, evidenceContract);
  assert.equal(surface.required, true);
});

test('orchestrator retains exact seven-channel, capability truth and personal fail-closed contracts', () => {
  assert.match(orchestrator, /const\s+CHANNELS\s*=\s*\[\s*'email_newsletter'\s*,\s*'linkedin_personal'\s*,\s*'linkedin_company'\s*,\s*'linkedin_article_personal'\s*,\s*'linkedin_article_company'\s*,\s*'instagram_company'\s*,\s*'blog'\s*\]/);
  for (const channel of ['linkedin_personal', 'linkedin_company', 'blog', 'instagram_company']) {
    assert.match(orchestrator, new RegExp(`${channel}:\\s*\\{\\s*executable:\\s*true`), `${channel} must remain explicitly executable`);
  }
  for (const channel of ['email_newsletter', 'linkedin_article_personal', 'linkedin_article_company']) {
    assert.match(orchestrator, new RegExp(`${channel}:\\s*\\{\\s*executable:\\s*false`), `${channel} must remain fail-closed without an authorized executor`);
  }
  assert.match(orchestrator, /arthur-personal-linkedin-identity-v4/);
  assert.match(orchestrator, /channel-identity-hard-gate-v3/);
  assert.match(orchestrator, /personal_truth_verified\s*===\s*true/);
  assert.match(orchestrator, /PERSONAL_TRUTH_SOURCE_UNVERIFIED/);
  assert.match(orchestrator, /EXACT_FINAL_MEDIA_PROOF_REQUIRED/);
  assert.match(orchestrator, /x-powerhouse-token/);
});

test('social publisher retains identity gate, provider reconciliation, exact readback and containment', () => {
  assert.match(publisher, /channel-identity-hard-gate-v3/);
  assert.match(publisher, /arthur-personal-linkedin-identity-v4/);
  assert.match(publisher, /reconcileExistingProviderTruth/);
  assert.match(publisher, /PROVIDER_RECORD_MISSING/);
  assert.match(publisher, /stale_delivery_ref:\s*true/);
  assert.match(publisher, /FAIL_CLOSED_NO_REPLACEMENT_WITHOUT_PERSONAL_TRUTH/);
  assert.match(publisher, /personal_truth_verified\s*!==\s*true/);
  assert.match(publisher, /EXACT_FINAL_MEDIA_PROOF_REQUIRED/);
  assert.match(publisher, /const readback = await getPost\(bufferToken, created\.post\.id\)/);
  assert.match(publisher, /PROVIDER_READBACK_MISMATCH/);
  assert.match(publisher, /deletePost\(bufferToken, created\.post\.id\)/);
  assert.match(publisher, /provider_truth_verified:\s*true/);
  assert.match(publisher, /x-powerhouse-token/);
});

test('Instagram proof is bound to exact final media and canonical profile', () => {
  assert.match(prePublishReview, /FINAL_MEDIA_DIGEST_REQUIRED/);
  assert.match(prePublishReview, /EXACT_FINAL_MEDIA_UNPROVEN/);
  assert.match(prePublishReview, /INSTAGRAM_CHANNEL_ID_MISMATCH/);
  assert.match(prePublishReview, /6a70384d99afb44349f0fba9/);
});

test('Instagram proof requires verified visual evidence for the same asset', () => {
  assert.match(prePublishReview, /INSTAGRAM_VISUAL_EVIDENCE_REQUIRED/);
  assert.match(prePublishReview, /INSTAGRAM_FINAL_ASSET_MISMATCH/);
  assert.match(prePublishReview, /INSTAGRAM_MIRA_VISUAL_REQUIRED/);
  assert.match(prePublishReview, /evidence_refs/);
});

test('Instagram video requires verified start middle end Mira frames', () => {
  assert.match(prePublishReview, /INSTAGRAM_VIDEO_FRAME_EVIDENCE_REQUIRED/);
  assert.match(prePublishReview, /INSTAGRAM_MIRA_FRAME_IDENTITY_REQUIRED/);
  for (const position of ['start', 'middle', 'end']) assert.match(prePublishReview, new RegExp(position));
});

test('content operations cockpit keeps one-row projection and canonical decision delivery lineage', () => {
  assert.equal(existsSync(cockpitMigration), true, 'forward cockpit repair migration must exist on current source authority');
  const sql = readFileSync(cockpitMigration, 'utf8');
  assert.match(sql, /with\s+experiment_one\s+as/i, 'cockpit must dedupe social_experiments before joining obligations');
  assert.match(sql, /distinct\s+on\s*\(tenant_id,\s*experiment_id,\s*calendar_date\)/i);
  assert.match(sql, /left\s+join\s+public\.powerhouse_channel_decisions\s+d/i, 'cockpit must project canonical decision lineage');
  for (const field of ['d.decision', 'd.state as decision_state', 'd.delivery_ref', 'd.delivery_evidence', 'd.learning_evidence']) {
    assert.ok(sql.includes(field), `missing cockpit projection: ${field}`);
  }
  assert.match(sql, /security_invoker\s*=\s*true/i);
  assert.match(sql, /revoke\s+all\s+on\s+table\s+public\.content_operations_cockpit\s+from\s+public,\s*anon,\s*authenticated/i);
  assert.match(sql, /grant\s+select\s+on\s+table\s+public\.content_operations_cockpit\s+to\s+service_role/i);
});
