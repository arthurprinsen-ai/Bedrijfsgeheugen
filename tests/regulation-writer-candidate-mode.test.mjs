import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/regelgeving-bijwerken.yml', 'utf8');

test('scheduled regulation refresh keeps direct delivery while manual runs can choose candidate-pr', () => {
  assert.match(workflow, /workflow_dispatch:[\s\S]*?delivery_mode:[\s\S]*?default:\s*direct/);
  assert.match(workflow, /schedule:[\s\S]*?cron:/);
  assert.match(workflow, /DELIVERY_MODE:[\s\S]*?github\.event_name/);
});

test('candidate regulation writer uses canonical candidate builder with fixed allowlist', () => {
  assert.match(workflow, /repo-writer-candidate\.mjs/);
  assert.match(workflow, /allowedFiles:\s*\['data\/regelgeving\.json'\]/);
  assert.match(workflow, /writer:\s*'regelgeving-bijwerken'/);
});

test('candidate mode opens but never merges a pull request', () => {
  assert.match(workflow, /gh\s+pr\s+create/);
  assert.doesNotMatch(workflow, /gh\s+pr\s+merge/);
  assert.match(workflow, /pull-requests:\s*write/);
});
