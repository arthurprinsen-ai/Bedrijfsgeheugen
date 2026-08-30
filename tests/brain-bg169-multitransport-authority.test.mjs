import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');
const delivery = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));

test('BG169 remains one authority while supporting Make and GitHub-native transports', () => {
  const authority = delivery.integration?.productionAuthorityContract;
  assert.equal(authority?.id, 'BG169');
  assert.deepEqual(authority?.transports?.map(x => x.id), ['make', 'github-native']);
  assert.equal(authority?.fallbackPolicy, 'primary_then_verified_failover');
  assert.equal(authority?.failoverRequiresSameContract, true);
  assert.equal(authority?.ackIsExecutionProof, false);
});

test('GitHub-native BG169 failover is exact-SHA, same-repo and evidence gated', () => {
  assert.match(workflow, /BG169 GitHub-native failover/);
  assert.match(workflow, /head\.repo\.full_name/);
  assert.match(workflow, /candidate_sha/);
  assert.match(workflow, /expected_head_sha/);
  assert.match(workflow, /pulls\/\$\{PR_NUMBER\}\/merge/);
  assert.match(workflow, /merge_method/);
  assert.match(workflow, /git merge-base --is-ancestor/);
});

test('Make acknowledgement alone never suppresses verified failover', () => {
  assert.match(workflow, /BG169_HANDOFF_NOT_ACCEPTED/);
  assert.match(workflow, /github-native/);
  assert.match(workflow, /BG169_PROMOTION_NOT_VERIFIED/);
});
