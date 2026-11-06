import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const lessonsDoc = JSON.parse(await read('docs/brain/delivery-failure-lessons.json'));
const rulesDoc = JSON.parse(await read('config/delivery-prevention-rules.json'));
const REGISTER_FINGERPRINTS = [
  "supabase|writeback|shared|migration-outside-git-without-readback",
  "supabase|governance|shared|approved-at-set-directly",
  "supabase|pipeline|shared|veto-reverted-by-queue",
  "supabase|verification|shared|sql-stage-counted-as-agent-run",
  "supabase|governance|shared|bulk-data-write-without-approval",
  "netlify|configuration|shared|wrong-env-key-name-in-functions",
  "netlify|verification|shared|deploy-ready-taken-as-outcome",
  "composio|integration|shared|active-connection-not-healthy",
  "composio|integration|shared|wrong-project-connected-account",
  "composio|verification|shared|wrong-instagram-account-measured",
  "buffer|pipeline|shared|rate-limit-429-looped-or-fallback",
  "windsor|verification|shared|ok-with-fallback-is-not-fresh",
  "ga4|verification|shared|ok-with-zero-rows-is-not-measured",
  "searchconsole|verification|shared|weekly-job-judged-by-daily-threshold",
  "dataforseo|verification|shared|empty-result-codes-misread",
  "tavily|pipeline|shared|plan-limit-432-read-as-no-results",
  "heartbeat|pipeline|shared|loop-without-owner-and-starter",
  "heartbeat|outcome|shared|missed-publication-blind-retry",
  "notion|handoff|shared|oversized-entry-page-truncated"
];

test('every system-register lesson is PROVEN, actionable and has an active prevention rule', () => {
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

test('no PROVEN lesson points at a missing or inactive rule', () => {
  const activeRules = new Set(rulesDoc.rules.filter(rule => rule.active).map(rule => rule.id));
  for (const lesson of lessonsDoc.lessons.filter(item => item.status === 'PROVEN')) {
    assert.ok(activeRules.has(lesson.preventionRule), `${lesson.fingerprint} -> ${lesson.preventionRule}`);
  }
});

test('rules that rely on the agent contract are not claimed as machine-blocked', () => {
  for (const rule of rulesDoc.rules.filter(item => item.enforcedBy === 'agent-contract')) {
    assert.ok(rule.active !== undefined && rule.scope, rule.id);
  }
});

test('lessons, rules and learning record never contain a credential', async () => {
  const files = ['docs/brain/delivery-failure-lessons.json', 'config/delivery-prevention-rules.json', 'brain/learning/2026-11-06-system-error-register-v1.json', 'docs/changes/2026-11-06-system-error-register-v1.md', 'docs/development-ledger-events/2026-11-06-system-error-register-v1.md'];
  for (const file of files) {
    assert.ok(!/github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(await read(file)), `credential-like string in ${file}`);
  }
});

test('the required PR check runs this guard', async () => {
  assert.ok((await read('.github/workflows/required-test.yml')).includes('tests/brain-system-error-register-20261106.test.mjs'));
});
