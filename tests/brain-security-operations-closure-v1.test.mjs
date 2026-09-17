import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const contractPath = new URL('../brain/production/security-operations-closure-v1.json', import.meta.url);
const workflowPath = new URL('../.github/workflows/powerhouse-security-operations-closure.yml', import.meta.url);
const deliveryPolicyPath = new URL('../config/brain-delivery-system.json', import.meta.url);
const socialMetricReplayPath = new URL('../supabase/migrations/20260910104922_bg_post_prestatie_metric_sleutels_normaliseren.sql', import.meta.url);
const notionReplayPath = new URL('../supabase/migrations/20260909181648_notion_post_feature_staging.sql', import.meta.url);

const requiredOpen = new Set([
  'isolated_restore_dr_exercise',
  'credential_rotation_end_to_end',
  'cross_platform_iam_review',
]);

const requiredClosed = new Set([
  'supabase_owner_management_mfa',
  'netlify_owner_team_management_mfa',
]);

test('security/operations closure contract is fail-closed while required evidence is open', () => {
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  assert.equal(contract.fingerprint, 'powerhouse-security-operations-closure-v1');
  assert.equal(contract.authority_reference, 'docs/changes/powerhouse-security-operations-hardening-v1.md');

  const open = contract.obligations.filter((item) => item.status !== 'CLOSED_PROVEN');
  assert.deepEqual(new Set(open.map((item) => item.id)), requiredOpen);
  assert.equal(contract.overall_status, 'BLOCKED');
  assert.ok(open.every((item) => Array.isArray(item.evidence_required) && item.evidence_required.length > 0));

  const closed = new Set(contract.already_proven.filter((item) => item.status === 'CLOSED_PROVEN').map((item) => item.id));
  assert.ok([...requiredClosed].every((id) => closed.has(id)));
});

test('Buffer credential rotation is secret-protected and runtime-proven but remains fail-closed until revocation', () => {
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const rotation = contract.obligations.find((item) => item.id === 'credential_rotation_end_to_end');
  assert.ok(rotation, 'credential_rotation_end_to_end obligation must exist');
  assert.equal(rotation.status, 'OPEN');
  assert.match(rotation.latest_readback, /BUFFER_API_KEY/);
  assert.match(rotation.latest_readback, /is_secret=true/);
  assert.match(rotation.latest_readback, /buffer-social-collect/);
  assert.match(rotation.latest_readback, /source=buffer/);
  assert.match(rotation.latest_readback, /data_quality=OBSERVED/);
  assert.match(rotation.latest_readback, /rotated credential works in production/i);
  assert.match(rotation.latest_readback, /revoked|unusable/i);
  assert.ok(rotation.evidence_required.some((item) => /secret protections/i.test(item)));
  assert.ok(rotation.evidence_required.some((item) => /post-rotation|consumer/i.test(item)));
  assert.ok(rotation.evidence_required.some((item) => /superseded credentials/i.test(item)));
});

test('closure contract never stores credential values', () => {
  const raw = fs.readFileSync(contractPath, 'utf8');
  assert.doesNotMatch(raw, /"(?:secret|token|password|api_key)_value"\s*:/i);
  assert.doesNotMatch(raw, /Bearer\s+[A-Za-z0-9._~+\/-]{20,}/);
});

test('social metric snapshot replay baseline exists before the dependent performance view', () => {
  const sql = fs.readFileSync(socialMetricReplayPath, 'utf8');
  const tableAt = sql.search(/create table if not exists public\.social_metric_snapshots/i);
  const viewAt = sql.search(/create or replace view public\.bg_post_prestatie/i);
  assert.ok(tableAt >= 0, 'fresh replay must create social_metric_snapshots before the view depends on it');
  assert.ok(viewAt > tableAt, 'social_metric_snapshots baseline must precede bg_post_prestatie');
  assert.match(sql, /primary key \(tenant_id, snapshot_id\)/i);
  assert.match(sql, /unique \(tenant_id, source_event_id\)/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on table public\.social_metric_snapshots from anon, authenticated/i);
  assert.match(sql, /grant all on table public\.social_metric_snapshots to service_role/i);
});

test('notion synced posts replay baseline is secure before later ALTER statements', () => {
  const sql = fs.readFileSync(notionReplayPath, 'utf8');
  const tableAt = sql.search(/create table if not exists public\.notion_synced_posts/i);
  const alterAt = sql.search(/alter table public\.notion_synced_posts\s+add column/i);
  assert.ok(tableAt >= 0, 'fresh replay must create notion_synced_posts before altering it');
  assert.ok(alterAt > tableAt, 'notion_synced_posts baseline must precede later ALTER statements');
  assert.match(sql, /post_id text primary key/i);
  assert.match(sql, /alter table public\.notion_synced_posts enable row level security/i);
  assert.match(sql, /revoke all on table public\.notion_synced_posts from public, anon, authenticated/i);
  assert.match(sql, /grant all on table public\.notion_synced_posts to service_role/i);
});

test('CI gate runs the closure test read-only', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/i);
  assert.match(workflow, /node --test tests\/brain-security-operations-closure-v1\.test\.mjs/);
  assert.doesNotMatch(workflow, /contents:\s*write/i);
});

test('security closure artifacts are classified by the existing shared delivery system', () => {
  const policy = JSON.parse(fs.readFileSync(deliveryPolicyPath, 'utf8'));
  const changedPaths = [
    'brain/production/security-operations-closure-v1.json',
    'tests/brain-security-operations-closure-v1.test.mjs',
  ];

  const plan = createDeliveryPlan({
    changedPaths,
    headSha: '0123456789abcdef0123456789abcdef01234567',
    policy,
  });

  assert.deepEqual(plan.changedPaths, [...changedPaths].sort());
  assert.ok(plan.lanes.some((lane) => lane.id === 'backend'));
  assert.ok(plan.lanes.length > 0);
});
