import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/menu-balk-fix.yml', 'utf8');

test('menu writer is candidate-only under BRAIN v2', () => {
  assert.match(workflow, /delivery_mode:[\s\S]*?default:\s*candidate-pr/);
  assert.doesNotMatch(workflow, /default:\s*direct\b/);
  assert.doesNotMatch(workflow, /git\s+push\s+origin\s+HEAD:main/);
});

test('candidate mode uses the canonical writer-candidate builder and opens a PR', () => {
  assert.match(workflow, /scripts\/ci\/repo-writer-candidate\.mjs/);
  assert.match(workflow, /writer:\s*'menu-balk-fix'/);
  assert.match(workflow, /gh\s+pr\s+create/);
  assert.match(workflow, /pull-requests:\s*write/);
});

test('candidate mode fails closed on non-html changes and never merges itself', () => {
  assert.match(workflow, /NON_HTML_CHANGE/);
  assert.doesNotMatch(workflow, /gh\s+pr\s+merge/);
  assert.match(workflow, /production_authority=BG169/);
});
