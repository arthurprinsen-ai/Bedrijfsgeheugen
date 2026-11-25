import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildSkillProjectionIndex, selectSkillProjection } from '../scripts/brain/powerhouse-skill-projection.mjs';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';
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

const universalIncidentFingerprint = 'powerhouse|incident-learning|fingerprint-preflight-recurrence-prevention|20261022-v1';
const projectedLearning = buildSkillProjectionIndex();
const universalEntry = projectedLearning.entries.find(entry => entry.fingerprint === universalIncidentFingerprint);
assert.equal(universalEntry?.mandatory_preflight, true, 'universal learning is mandatory in projection');
assert.ok(selectSkillProjection(projectedLearning).selected_entries.some(entry => entry.fingerprint === universalIncidentFingerprint),
  'no-hint worker start must discover the universal prevention');
const defaultAgentPacket = compileChatLearningPreflight();
assert.ok(defaultAgentPacket.skill_projection.verification.ok, 'skill projection must be internally consistent');
assert.ok(defaultAgentPacket.skill_projection.selection.selected_entries.some(entry => entry.fingerprint === universalIncidentFingerprint),
  'real agent preflight packet must expose universal prevention without task hints');

console.log('brain-error-learning-contract: all tests passed');
