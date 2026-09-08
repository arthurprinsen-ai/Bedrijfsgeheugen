import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const required = await readFile('.github/workflows/required-test.yml','utf8');
const automation = await readFile('.github/workflows/lane-automation.yml','utf8');

const hasPullRequestTrigger = text => /(^|\n)\s{0,2}pull_request\s*:/m.test(text);

test('chat learning preflight is owned by canonical Required test preflight', () => {
  assert.match(required, /node scripts\/brain\/chat-learning-preflight\.mjs/);
});

test('learning contract suites remain in canonical automation lane', () => {
  for (const file of [
    'tests/make-agent-learning-promotion-contract.test.mjs',
    'tests/chat-learning-completeness-addendum.test.mjs',
    'tests/brain-learning-contract-delivery-classification.test.mjs',
  ]) assert.match(automation, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('standalone learning workflows do not consume broad PR runners', async () => {
  for (const file of ['bg168-materiality-promotion-tests.yml','learning-contract-delivery-classifier-tests.yml']) {
    const text = await readFile(`.github/workflows/${file}`,'utf8');
    assert.equal(hasPullRequestTrigger(text), false, `${file} must not own pull_request`);
  }
  await assert.rejects(readFile('.github/workflows/chat-learning-preflight-pr.yml','utf8'), /ENOENT/);
});