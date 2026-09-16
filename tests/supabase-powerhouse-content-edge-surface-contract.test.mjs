import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const orchestrator = readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts', 'utf8');
const publisher = readFileSync('supabase/functions/powerhouse-social-publisher/index.ts', 'utf8');
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

test('orchestrator retains exact seven-channel and personal fail-closed contracts', () => {
  assert.match(orchestrator, /const CHANNELS=\['email_newsletter','linkedin_personal','linkedin_company','linkedin_article_personal','linkedin_article_company','instagram_company','blog'\]/);
  assert.match(orchestrator, /const EXECUTABLE=new Set\(\['linkedin_personal','linkedin_company','blog'\]\)/);
  assert.match(orchestrator, /arthur-personal-linkedin-identity-v4/);
  assert.match(orchestrator, /channel-identity-hard-gate-v3/);
  assert.match(orchestrator, /PERSONAL_IDENTITY_SOURCE_MISSING_HOLD/);
  assert.match(orchestrator, /x-powerhouse-token/);
});

test('social publisher retains identity gate, exact provider readback and containment', () => {
  assert.match(publisher, /channel-identity-hard-gate-v3/);
  assert.match(publisher, /arthur-personal-linkedin-identity-v4/);
  assert.match(publisher, /personal_queue_audit/);
  assert.match(publisher, /provider_immediate_readback/);
  assert.match(publisher, /blocked_readback_mismatch/);
  assert.match(publisher, /deletePost\(token,p\.id\)/);
  assert.match(publisher, /x-powerhouse-token/);
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
