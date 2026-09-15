import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  classifyRelease,
  validateIncidentLearning,
  REQUIRED_LEARNING_FIELDS,
} from '../scripts/release/error-learning-policy.mjs';

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

const preventionRules = JSON.parse(fs.readFileSync(new URL('../config/delivery-prevention-rules.json', import.meta.url), 'utf8'));
const failureLessons = JSON.parse(fs.readFileSync(new URL('../docs/brain/delivery-failure-lessons.json', import.meta.url), 'utf8'));

test('deploy ready without production readback is never live', () => {
  assert.equal(
    classifyRelease({ deployState: 'ready', productionReadback: null }),
    'deployed-not-verified',
  );
});

test('failed production readback fails verification', () => {
  assert.equal(
    classifyRelease({
      deployState: 'ready',
      productionReadback: { ok: false, httpStatus: 503 },
    }),
    'verification-failed',
  );
});

test('only successful matching production readback is live verified', () => {
  assert.equal(
    classifyRelease({
      deployState: 'ready',
      expectedCommit: 'abc123',
      productionReadback: { ok: true, httpStatus: 200, commit: 'abc123' },
    }),
    'live-verified',
  );
});

test('commit mismatch is not live verified', () => {
  assert.equal(
    classifyRelease({
      deployState: 'ready',
      expectedCommit: 'abc123',
      productionReadback: { ok: true, httpStatus: 200, commit: 'def456' },
    }),
    'verification-failed',
  );
});

test('material incident must contain the complete learning loop', () => {
  const complete = Object.fromEntries(REQUIRED_LEARNING_FIELDS.map((field) => [field, `${field}-value`]));
  assert.deepEqual(validateIncidentLearning(complete), { ok: true, missing: [] });

  const incomplete = { ...complete };
  delete incomplete.root_cause;
  delete incomplete.regression_test;
  delete incomplete.prevention_rule;

  assert.deepEqual(validateIncidentLearning(incomplete), {
    ok: false,
    missing: ['root_cause', 'regression_test', 'prevention_rule'],
  });
});

test('canonical Brain keeps exact production identity prevention active', () => {
  const rule = preventionRules.rules.find(
    (candidate) => candidate.id === 'REQUIRE_EXACT_DEPLOY_IDENTITY_BEFORE_PRODUCTION_GREEN',
  );
  assert.ok(rule, 'canonical prevention rule is missing');
  assert.equal(rule.active, true);
  assert.match(rule.enforcedBy, /production-readback/i);

  const lesson = failureLessons.lessons.find(
    (candidate) => candidate.preventionRule === 'REQUIRE_EXACT_DEPLOY_IDENTITY_BEFORE_PRODUCTION_GREEN',
  );
  assert.ok(lesson, 'canonical failure lesson is missing');
  assert.equal(lesson.status, 'PROVEN');
  assert.match(lesson.fix, /independent production readback/i);
});

console.log('error-learning-contract: all tests passed');
