import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';

test('wrong connector/resource mutation incident is retained and protected by the existing remote-write prevention', async () => {
  const incident = JSON.parse(await readFile('brain/learning/incidents/connector-mutation-routing-guard-2026-08-30.json', 'utf8'));
  assert.equal(incident.fingerprint, 'connector|mutation|wrong-tool-or-resource-selected-v1');
  assert.equal(incident.severity, 'high');
  assert.deepEqual(incident.requiredPreflight, [
    'match_requested_intent', 'match_mutation_action', 'match_resource_type',
    'match_exact_identifier', 'fail_closed_on_mismatch', 'read_back_after_mutation'
  ]);
  assert.match(incident.rootCause, /resource type|identifier|intent/i);
  assert.match(incident.requiredAction, /verify action, resource type, exact identifier and user intent/i);
  assert.equal(incident.recovery.paidOrDestructiveEscalationAllowedAutonomously, false);

  const preflight = await loadDeliveryPreflight({ component: 'shared' });
  assert.ok(preflight.appliedPreventionRules.includes('REQUIRE_AUTHORIZED_CONNECTOR_FOR_REMOTE_WRITES'));
});
