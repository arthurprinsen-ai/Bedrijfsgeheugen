import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createFailureLesson, createPreflightDecision, createObservedFailure, normalizeFailureReason } from '../tools/delivery-learning.mjs';

test('failed commit PR merge and pipeline outcomes become reusable deterministic lessons', () => {
  const lesson = createFailureLesson({ stage: 'PR', reason: 'Required check Brain Delivery failed for changed portal route', rootCause: 'portal regression test was not run before opening the PR', fix: 'run portal targeted preflight before opening PR', preventionRule: 'TARGETED_PORTAL_PREFLIGHT', component: 'portal', headSha: 'abcdef1234567890' });
  assert.equal(lesson.type, 'DELIVERY_FAILURE_LESSON');
  assert.equal(lesson.stage, 'PR');
  assert.equal(lesson.preventionRule, 'TARGETED_PORTAL_PREFLIGHT');
  assert.match(lesson.fingerprint, /^delivery-failure\|pr\|portal\|[a-f0-9]{16}$/);
  assert.equal(lesson.outcomeWritebackRequired, true);
  assert.equal(lesson.reuseBeforeSimilarChange, true);
});

test('same failure wording normalizes to the same reusable fingerprint input', () => {
  assert.equal(normalizeFailureReason('  Merge   conflict in PORTAL/core.mjs #123  '), normalizeFailureReason('merge conflict in portal/core.mjs #999'));
});

test('preflight blocks a repeated known failure unless its proven prevention rule is applied', () => {
  const lessons = [{ fingerprint: 'delivery-failure|merge|portal|abc', stage: 'MERGE', component: 'portal', preventionRule: 'REBASE_AND_CONFLICT_CHECK', status: 'PROVEN' }];
  assert.throws(() => createPreflightDecision({ component: 'portal', knownLessons: lessons, appliedPreventionRules: [] }), /known delivery failure prevention missing/);
  const decision = createPreflightDecision({ component: 'portal', knownLessons: lessons, appliedPreventionRules: ['REBASE_AND_CONFLICT_CHECK'] });
  assert.equal(decision.ok, true);
  assert.deepEqual(decision.reusedLessons, ['delivery-failure|merge|portal|abc']);
});

test('shared proven lessons are mandatory in every product lane', () => {
  const lessons = [{ fingerprint: 'historical|pipeline|shared|proof', stage: 'PIPELINE', component: 'shared', preventionRule: 'BOUNDED_GITHUB_PUBLIC_PROOF', status: 'PROVEN' }];
  assert.throws(() => createPreflightDecision({ component: 'portal', knownLessons: lessons, appliedPreventionRules: [] }), /BOUNDED_GITHUB_PUBLIC_PROOF/);
  const decision = createPreflightDecision({ component: 'website', knownLessons: lessons, appliedPreventionRules: ['BOUNDED_GITHUB_PUBLIC_PROOF'] });
  assert.deepEqual(decision.reusedLessons, ['historical|pipeline|shared|proof']);
});

test('an unclassified workflow failure is captured as observed Brain evidence, not falsely marked proven', () => {
  const observed = createObservedFailure({ stage: 'PIPELINE', reason: 'integrate job failed', component: 'shared', headSha: 'abcdef1234567890', evidenceRef: 'github-run:123' });
  assert.equal(observed.status, 'OBSERVED');
  assert.equal(observed.outcomeWritebackRequired, true);
  assert.equal(observed.requiresRootCauseResolution, true);
  assert.equal(observed.evidenceRef, 'github-run:123');
});

test('chat-proven failure classes are persisted as PROVEN lessons with active prevention rules', () => {
  const lessonsDoc = JSON.parse(fs.readFileSync('docs/brain/delivery-failure-lessons.json', 'utf8'));
  const rulesDoc = JSON.parse(fs.readFileSync('config/delivery-prevention-rules.json', 'utf8'));
  const expectedRules = [
    'CLASSIFY_AND_EXECUTE_CHANGED_TEST_PATHS',
    'REQUIRE_PERSISTENT_EVIDENCE_BEFORE_GREEN',
    'CONSOLIDATE_PARALLEL_IDENTICAL_CANDIDATES',
    'CAPTURE_TRACKED_AND_UNTRACKED_EVIDENCE',
    'FULLY_QUALIFY_DETACHED_HEAD_PUSH_REFSPEC',
    'VALIDATE_MAKE_SUBSCENARIO_INPUT_ENVELOPE',
    'FAIL_CLOSED_ON_UNVERIFIED_PLATFORM_CONTROLS',
    'ISOLATE_NEGATIVE_TEST_FIXTURES',
    'SINGLE_CANONICAL_WRITER_HANDOFF',
  ];
  const provenRules = new Set((lessonsDoc.lessons || []).filter((lesson) => lesson.status === 'PROVEN').map((lesson) => lesson.preventionRule));
  const activeRules = new Set((rulesDoc.rules || []).filter((rule) => rule.active === true).map((rule) => rule.id));
  for (const rule of expectedRules) {
    assert.equal(provenRules.has(rule), true, `${rule} must be backed by a PROVEN lesson`);
    assert.equal(activeRules.has(rule), true, `${rule} must be active in prevention registry`);
  }
});
