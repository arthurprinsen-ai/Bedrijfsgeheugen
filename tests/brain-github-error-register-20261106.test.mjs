import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const lessonsDoc = JSON.parse(await read('docs/brain/delivery-failure-lessons.json'));
const rulesDoc = JSON.parse(await read('config/delivery-prevention-rules.json'));
const REGISTER_FINGERPRINTS = [
  "github|governance|shared|workflow-file-write-needs-contents-and-workflows-permission",
  "github|governance|shared|token-pasted-in-chat",
  "github|pipeline|shared|expired-token-error-swallowed",
  "github|verification|shared|unauthenticated-api-rate-limit-and-raw-cache",
  "github|merge|shared|merge-405-required-check-branch-behind-main",
  "github|merge|shared|auto-merge-forbidden-repo-setting-off",
  "github|writeback|shared|contents-api-409-concurrent-agent-commits",
  "github|pr|shared|branch-ref-prefix-collision-422",
  "github|pr|shared|duplicate-branch-from-parallel-process",
  "github|verification|shared|check-runs-queried-by-branch-name",
  "github|pipeline|shared|pr-body-edit-does-not-retrigger-required",
  "github|pipeline|shared|new-test-or-path-outside-lane-config",
  "supabase|preview|shared|incomplete-git-branch-name",
  "github|handoff|shared|anonymous-read-only-session-claimed-pr-state",
  "github|pipeline|shared|apt-chrome-hash-sum-mismatch-ci-red"
];

test('every register lesson is PROVEN, actionable and has an active prevention rule', () => {
  const activeRules = new Set(rulesDoc.rules.filter(rule => rule.active).map(rule => rule.id));
  for (const fingerprint of REGISTER_FINGERPRINTS) {
    const lesson = lessonsDoc.lessons.find(item => item.fingerprint === fingerprint);
    assert.ok(lesson, `lesson missing: ${fingerprint}`);
    assert.equal(lesson.status, 'PROVEN', fingerprint);
    assert.equal(lesson.component, 'shared', fingerprint);
    assert.ok(lesson.rootCause.trim().length > 20 && lesson.fix.trim().length > 20, `rootCause and fix required: ${fingerprint}`);
    assert.ok(activeRules.has(lesson.preventionRule), `active rule missing for ${fingerprint}: ${lesson.preventionRule}`);
  }
});

test('fingerprints and rule ids stay unique', () => {
  const fingerprints = lessonsDoc.lessons.map(item => item.fingerprint);
  assert.equal(new Set(fingerprints).size, fingerprints.length, 'duplicate lesson fingerprint');
  const ruleIds = rulesDoc.rules.map(rule => rule.id);
  assert.equal(new Set(ruleIds).size, ruleIds.length, 'duplicate rule id');
});

test('no PROVEN lesson refers to a rule that is missing or inactive', () => {
  const activeRules = new Set(rulesDoc.rules.filter(rule => rule.active).map(rule => rule.id));
  const missing = lessonsDoc.lessons.filter(item => item.preventionRule && !activeRules.has(item.preventionRule)).map(item => item.preventionRule);
  assert.deepEqual(missing, []);
});

test('lessons, rules and learning record never contain a credential', async () => {
  const files = ['docs/brain/delivery-failure-lessons.json', 'config/delivery-prevention-rules.json', 'brain/learning/2026-11-06-github-error-register-v1.json', 'docs/changes/2026-11-06-github-error-register-v1.md'];
  for (const file of files) {
    assert.ok(!/github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}/.test(await read(file)), `credential-like string in ${file}`);
  }
});

test('the required PR check runs this guard and AGENTS.md points to it', async () => {
  assert.ok((await read('.github/workflows/required-test.yml')).includes('tests/brain-github-error-register-20261106.test.mjs'));
  assert.ok((await read('AGENTS.md')).includes('tests/brain-github-error-register-20261106.test.mjs'));
});
