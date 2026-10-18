import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('all main pushes enter production reconciliation', () => {
  const workflow = readFileSync('.github/workflows/production-source-snapshot.yml', 'utf8');
  assert.match(workflow, /push:\\s*\\n\\s*branches: \\[main\\]/);
  assert.doesNotMatch(workflow, /paths-ignore:/);
  assert.match(workflow, /deriveNetlifyDeploymentApplicability/);
});
