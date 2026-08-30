import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowPath = new URL('../.github/workflows/main-protection-observation.yml', import.meta.url);

test('main protection observation is read-only and stores immutable evidence', async () => {
  const yaml = await readFile(workflowPath, 'utf8');
  assert.match(yaml, /name:\s*Main Protection Observation/);
  assert.match(yaml, /workflow_dispatch:/);
  assert.match(yaml, /schedule:/);
  assert.match(yaml, /contents:\s*read/);
  assert.doesNotMatch(yaml, /contents:\s*write/);
  assert.match(yaml, /repos\/\$\{GITHUB_REPOSITORY\}\/branches\/main/);
  assert.match(yaml, /repos\/\$\{GITHUB_REPOSITORY\}\/rulesets/);
  assert.match(yaml, /main-protection-certification\.mjs/);
  assert.match(yaml, /main-protection-evidence\.json/);
  assert.match(yaml, /actions\/upload-artifact@v4/);
  assert.doesNotMatch(yaml, /gh api\s+--method\s+(PUT|PATCH|POST|DELETE)/i);
});

test('blocked governance state is evidence, not a failed observation job', async () => {
  const yaml = await readFile(workflowPath, 'utf8');
  assert.match(yaml, /truth_status/);
  assert.match(yaml, /mainProtectionReady/);
  assert.doesNotMatch(yaml, /exit\s+1.*BLOCKED|BLOCKED.*exit\s+1/s);
});
