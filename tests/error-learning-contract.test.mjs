import assert from 'node:assert/strict';
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

console.log('error-learning-contract: all tests passed');
