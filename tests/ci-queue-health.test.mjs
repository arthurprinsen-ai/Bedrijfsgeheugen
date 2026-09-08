import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyQueueHealth } from '../tools/ci/queue-health.mjs';

const now = Date.parse('2026-09-08T10:30:00Z');
const currentHeadByPr = { '1159': 'newsha' };
const run = (overrides={}) => ({
  prNumber: 1159,
  headSha: 'newsha',
  workflow: 'Required test',
  jobFamily: 'preflight',
  status: 'queued',
  queuedAt: new Date(now - 300000).toISOString(),
  firstStepStartedAt: null,
  ...overrides,
});

test('299999ms queue age is below SLO', () => {
  const result = classifyQueueHealth({ now, currentHeadByPr, runs:[run({queuedAt:new Date(now-299999).toISOString()})] });
  assert.equal(result.incidents.length, 0);
});

test('300000ms current-head queue with no first step is an incident', () => {
  const result = classifyQueueHealth({ now, currentHeadByPr, runs:[run()] });
  assert.equal(result.incidents.length, 1);
  assert.equal(result.incidents[0].fingerprint, 'ci-capacity:1159:newsha:Required test:preflight');
});

test('superseded queued SHA is ignored', () => {
  const result = classifyQueueHealth({ now, currentHeadByPr, runs:[run({headSha:'oldsha',queuedAt:new Date(now-900000).toISOString()})] });
  assert.equal(result.incidents.length, 0);
  assert.equal(result.ignoredSuperseded.length, 1);
});

test('started current-head work is not a queue incident', () => {
  const result = classifyQueueHealth({ now, currentHeadByPr, runs:[run({status:'in_progress',firstStepStartedAt:new Date(now-1000).toISOString()})] });
  assert.equal(result.incidents.length, 0);
});

test('duplicate observations dedupe by fingerprint and classifier never proposes reruns', () => {
  const result = classifyQueueHealth({ now, currentHeadByPr, runs:[run(),run()] });
  assert.equal(result.incidents.length, 1);
  assert.equal('rerun' in result, false);
  assert.equal('retry' in result, false);
});