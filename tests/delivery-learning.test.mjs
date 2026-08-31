import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createFailureLesson, createPreflightDecision, createObservedFailure, normalizeFailureReason, routeObservedFailureToLearning } from '../tools/delivery-learning.mjs';

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

test('a known observed failure deterministically reuses the proven lesson instead of creating a new candidate', () => {
  const observed = createObservedFailure({ stage: 'PIPELINE', reason: 'integrate job failed', component: 'shared', headSha: 'head-1', evidenceRef: 'github-run:123' });
  const knownLessons = [{ fingerprint: observed.fingerprint, status: 'PROVEN', preventionRule: 'KNOWN_FIX', rootCause: 'known root cause', fix: 'known fix' }];
  const routed = routeObservedFailureToLearning({ observedFailure: observed, knownLessons });
  assert.equal(routed.type, 'REUSE_PROVEN_LESSON');
  assert.equal(routed.fingerprint, observed.fingerprint);
  assert.equal(routed.preventionRule, 'KNOWN_FIX');
  assert.equal(routed.autoPromoteToProven, false);
  assert.equal(routed.expensiveFanoutAllowed, false);
});

test('an unknown observed failure becomes one unverified learning candidate and never self-promotes', () => {
  const observed = createObservedFailure({ stage: 'PIPELINE', reason: 'Novel executor state mismatch', component: 'backend', headSha: 'head-2', evidenceRef: 'github-run:456' });
  const routed = routeObservedFailureToLearning({ observedFailure: observed, knownLessons: [], existingCandidates: [] });
  assert.equal(routed.type, 'LEARNING_CANDIDATE');
  assert.equal(routed.status, 'UNVERIFIED');
  assert.equal(routed.fingerprint, observed.fingerprint);
  assert.equal(routed.candidateId, `learning-candidate|${observed.fingerprint}`);
  assert.equal(routed.requiresRootCauseResolution, true);
  assert.equal(routed.requiresRegressionEvidence, true);
  assert.equal(routed.autoPromoteToProven, false);
  assert.equal(routed.expensiveFanoutAllowed, false);
  assert.equal(routed.evidenceRef, 'github-run:456');
  assert.equal(routed.headSha, 'head-2');
  assert.equal('rootCause' in routed, false);
  assert.equal('fix' in routed, false);
  assert.equal('preventionRule' in routed, false);
});

test('repeated unknown failure reuses the existing candidate identity rather than creating duplicate learning work', () => {
  const observed = createObservedFailure({ stage: 'PIPELINE', reason: 'Novel executor state mismatch', component: 'backend', headSha: 'head-3', evidenceRef: 'github-run:789' });
  const existingCandidates = [{ candidateId: `learning-candidate|${observed.fingerprint}`, fingerprint: observed.fingerprint, status: 'UNVERIFIED' }];
  const routed = routeObservedFailureToLearning({ observedFailure: observed, knownLessons: [], existingCandidates });
  assert.equal(routed.type, 'REUSE_LEARNING_CANDIDATE');
  assert.equal(routed.deduplicated, true);
  assert.equal(routed.candidateId, existingCandidates[0].candidateId);
  assert.equal(routed.autoPromoteToProven, false);
  assert.equal(routed.expensiveFanoutAllowed, false);
});

test('learning candidates do not preserve obvious secret material from failure text', () => {
  const observed = createObservedFailure({ stage: 'DEPLOY', reason: 'Authorization: Bearer super-secret-token password=hunter2 deploy failed', component: 'website', headSha: 'head-4', evidenceRef: 'github-run:999' });
  const routed = routeObservedFailureToLearning({ observedFailure: observed, knownLessons: [] });
  assert.equal(routed.type, 'LEARNING_CANDIDATE');
  assert.doesNotMatch(JSON.stringify(routed), /super-secret-token|hunter2/);
  assert.match(routed.signature, /\[redacted\]/i);
});

test('Unified BRAIN failed lanes route observed failure into bounded learning artifacts', () => {
  const workflow = fs.readFileSync('.github/workflows/unified-brain-delivery.yml', 'utf8');
  assert.match(workflow, /routeObservedFailureToLearning/);
  assert.match(workflow, /docs\/brain\/delivery-failure-lessons\.json/);
  assert.match(workflow, /delivery-learning-route-/);
  assert.match(workflow, /learning-route-\$\{\{ matrix\.lane \}\}/);
  assert.doesNotMatch(workflow, /autoPromoteToProven\s*:\s*true/);
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
