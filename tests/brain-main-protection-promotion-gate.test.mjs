import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowPath = new URL('../.github/workflows/unified-brain-delivery.yml', import.meta.url);

test('production handoff fails closed when live main protection is not verified', async () => {
  const yaml = await readFile(workflowPath, 'utf8');

  assert.match(yaml, /Certify live main protection before production handoff/);
  assert.match(yaml, /repos\/\$\{GITHUB_REPOSITORY\}\/branches\/main/);
  assert.match(yaml, /repos\/\$\{GITHUB_REPOSITORY\}\/rulesets/);
  assert.match(yaml, /main-protection-certification\.mjs/);
  assert.match(yaml, /MAIN_PROTECTION_BLOCKED/);
  assert.match(yaml, /main-protection-promotion-block/);

  const protectionGate = yaml.indexOf('Certify live main protection before production handoff');
  const bg169Handoff = yaml.indexOf('BG169 primary Make transport with GitHub-native failover');
  assert.ok(protectionGate >= 0 && bg169Handoff >= 0 && protectionGate < bg169Handoff,
    'live main protection must be verified before BG169 transport');
});

test('verification-only delivery remains non-promoting and does not require protected main', async () => {
  const yaml = await readFile(workflowPath, 'utf8');
  assert.match(yaml, /Record verification-only non-promotion evidence/);
  assert.match(yaml, /inputs\.verification_only == true/);
  assert.match(yaml, /inputs\.verification_only != true/);
});
