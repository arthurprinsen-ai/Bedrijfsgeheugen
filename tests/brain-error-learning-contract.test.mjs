import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  classifyRelease,
  validateIncidentLearning,
  REQUIRED_LEARNING_FIELDS,
} from '../scripts/brain/error-learning-policy.mjs';

const preventionRules = JSON.parse(fs.readFileSync(new URL('../config/delivery-prevention-rules.json', import.meta.url), 'utf8'));
const failureLessons = JSON.parse(fs.readFileSync(new URL('../docs/brain/delivery-failure-lessons.json', import.meta.url), 'utf8'));

assert.equal(classifyRelease({ deployState: 'ready', productionReadback: null }), 'deployed-not-verified');
assert.equal(classifyRelease({ deployState: 'ready', productionReadback: { ok: false, httpStatus: 503 } }), 'verification-failed');
assert.equal(classifyRelease({ deployState: 'ready', expectedCommit: 'abc123', productionReadback: { ok: true, httpStatus: 200, commit: 'abc123' } }), 'live-verified');
assert.equal(classifyRelease({ deployState: 'ready', expectedCommit: 'abc123', productionReadback: { ok: true, httpStatus: 200, commit: 'def456' } }), 'verification-failed');

const complete = Object.fromEntries(REQUIRED_LEARNING_FIELDS.map((field) => [field, `${field}-value`]));
assert.deepEqual(validateIncidentLearning(complete), { ok: true, missing: [] });
const incomplete = { ...complete };
delete incomplete.root_cause;
delete incomplete.regression_test;
delete incomplete.prevention_rule;
assert.deepEqual(validateIncidentLearning(incomplete), { ok: false, missing: ['root_cause', 'regression_test', 'prevention_rule'] });

const rule = preventionRules.rules.find((candidate) => candidate.id === 'REQUIRE_EXACT_DEPLOY_IDENTITY_BEFORE_PRODUCTION_GREEN');
assert.ok(rule);
assert.equal(rule.active, true);
assert.match(rule.enforcedBy, /production-readback/i);
const lesson = failureLessons.lessons.find((candidate) => candidate.preventionRule === 'REQUIRE_EXACT_DEPLOY_IDENTITY_BEFORE_PRODUCTION_GREEN');
assert.ok(lesson);
assert.equal(lesson.status, 'PROVEN');
assert.match(lesson.fix, /independent production readback/i);

console.log('brain-error-learning-contract: all tests passed');
