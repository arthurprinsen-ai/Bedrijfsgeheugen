import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const harnessPath = '.github/workflows/repo-writer-operational-verification.yml';

test('operational writer harness can only dispatch menu-balk-fix in candidate-pr mode', () => {
  const text = fs.readFileSync(harnessPath, 'utf8');

  assert.match(text, /pull_request:/);
  assert.match(text, /branches:\s*\[?main\]?/);
  assert.match(text, /verify\/menu-balk-fix-/);
  assert.match(text, /github\.event\.pull_request\.head\.repo\.full_name\s*==\s*github\.repository/);
  assert.match(text, /actions:\s*write\b/);
  assert.doesNotMatch(text, /contents:\s*write\b/);
  assert.doesNotMatch(text, /pull-requests:\s*write\b/);

  assert.match(text, /gh\s+workflow\s+run\s+menu-balk-fix\.yml/);
  assert.match(text, /--ref\s+main/);
  assert.match(text, /delivery_mode=candidate-pr/);
  assert.doesNotMatch(text, /delivery_mode=direct/);
  assert.doesNotMatch(text, /\bgit\s+push\b|\bgh\s+pr\s+(create|merge)\b|\/merges\b/);
  assert.doesNotMatch(text, /NOTION|notion|publiceer|publish/i);
});

test('operational harness records the triggering PR base SHA before dispatch', () => {
  const text = fs.readFileSync(harnessPath, 'utf8');
  assert.match(text, /github\.event\.pull_request\.base\.sha/);
  assert.match(text, /EXPECTED_MAIN_SHA/);
  assert.match(text, /git\/ref\/heads\/main|repos\/\$\{GITHUB_REPOSITORY\}\/git\/ref\/heads\/main/);
  assert.match(text, /BASE_SHA_DRIFT/);
});
