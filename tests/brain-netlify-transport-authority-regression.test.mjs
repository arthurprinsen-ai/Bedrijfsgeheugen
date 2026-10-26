import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyNetlifyBridgeFailure, buildNetlifyIncidentSummary } from '../tools/delivery/netlify-authority-incident.mjs';

test('run 39209401787 bridge 420 is a non-retryable external authority incident', () => {
  const outcome = classifyNetlifyBridgeFailure({
    http: 420,
    error: 'composio_netlify_account_not_public',
  });
  assert.equal(outcome.failure_class, 'NETLIFY_AUTHORITY_NOT_VISIBLE');
  assert.equal(outcome.retryable, false);
  assert.match(outcome.next_action, /exact Composio project key/);
});

test('OIDC denial is not hidden by retry or provider failure', () => {
  assert.equal(classifyNetlifyBridgeFailure({ http: 401, error: 'oidc_auth_failed' }).retryable, false);
  assert.equal(classifyNetlifyBridgeFailure({ http: 431, error: 'composio_project_key_unauthorized' }).failure_class, 'COMPOSIO_PROJECT_OR_SESSION_AUTHORITY');
});

test('summary cannot print attacker-controlled arbitrary error strings or tokens', () => {
  const text = buildNetlifyIncidentSummary({
    http: '420<bad>',
    error: 'token=secret-value',
    sha: 'f'.repeat(40),
    runUrl: 'https://example.com/?token=secret-value',
  });
  assert.match(text, /Production Netlify transport: BLOCKED/);
  assert.match(text, /4447/);
  assert.doesNotMatch(text, /secret-value|example.com|<bad>/);
});

test('production workflow enforces authority classification and exact live readback', () => {
  const workflow = readFileSync('.github/workflows/production-source-snapshot.yml', 'utf8');
  assert.match(workflow, /netlify-authority-incident\.mjs/);
  assert.match(workflow, /NETLIFY_JIT_FALLBACK_UNAVAILABLE/);
  assert.match(workflow, /Prove exact production identity/);
  assert.match(workflow, /exit 78/);
});

test('delivery learning is linked to an active prevention rule', () => {
  const learning = JSON.parse(readFileSync('brain/learning/netlify-transport-authority-2026-10-19.json', 'utf8'));
  const policy = JSON.parse(readFileSync('config/delivery-prevention-rules.json', 'utf8'));
  assert.equal(learning.compiler.failure_class, 'NETLIFY_TRANSPORT_AUTHORITY');
  assert.equal(learning.test_evidence.production_readback, 'not yet proven');
  assert.ok(policy.linked_learning_sources.includes('brain/learning/netlify-transport-authority-2026-10-19.json'));
  assert.ok(policy.rules.some(rule => rule.id === 'NETLIFY_DEPLOY_AUTHORITY_MUST_BE_VISIBLE' && rule.active === true));
});
