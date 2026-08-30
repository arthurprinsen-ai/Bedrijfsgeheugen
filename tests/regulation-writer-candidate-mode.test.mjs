import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/regelgeving-bijwerken.yml', 'utf8');

test('scheduled and manual regulation refreshes are candidate-only', () => {
  assert.match(workflow, /workflow_dispatch:[\s\S]*?delivery_mode:[\s\S]*?default:\s*candidate-pr/);
  assert.match(workflow, /schedule:[\s\S]*?cron:/);
  assert.doesNotMatch(workflow, /default:\s*direct\b/);
  assert.doesNotMatch(workflow, /git\s+push\s+origin\s+HEAD:main/);
});

test('regulation writer uses canonical candidate builder with fixed allowlist', () => {
  assert.match(workflow, /repo-writer-candidate\.mjs/);
  assert.match(workflow, /allowedFiles:\s*\['data\/regelgeving\.json'\]/);
  assert.match(workflow, /writer:\s*'regelgeving-bijwerken'/);
});

test('regulation writer opens but never merges a pull request', () => {
  assert.match(workflow, /gh\s+pr\s+create/);
  assert.doesNotMatch(workflow, /gh\s+pr\s+merge/);
  assert.match(workflow, /production_authority=BG169/);
});
