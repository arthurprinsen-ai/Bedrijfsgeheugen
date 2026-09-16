import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const orchestrator = readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts', 'utf8');
const publisher = readFileSync('supabase/functions/powerhouse-social-publisher/index.ts', 'utf8');
const registry = JSON.parse(readFileSync('config/powerhouse-quality-surface-contracts.json', 'utf8'));

const byId = new Map(registry.surfaces.map(surface => [surface.id, surface]));

test('quality registry owns both restored content Edge Function surfaces', () => {
  for (const [id, authority] of [
    ['function:powerhouse-content-orchestrator', 'supabase/functions/powerhouse-content-orchestrator/index.ts'],
    ['function:powerhouse-social-publisher', 'supabase/functions/powerhouse-social-publisher/index.ts'],
  ]) {
    const surface = byId.get(id);
    assert.ok(surface, `${id} must be registered`);
    assert.equal(surface.authority, authority);
    assert.equal(surface.evidence_contract, 'tests/powerhouse-content-edge-surface-contract.test.mjs');
    assert.equal(surface.required, true);
  }
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
