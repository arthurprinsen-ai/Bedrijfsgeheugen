import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');
const platformAdapters = JSON.parse(await readFile('config/brain-platform-adapters.json', 'utf8'));

test('BG169 remains one authority while supporting Make and GitHub-native transports', () => {
  const authority = platformAdapters.production_authority;
  assert.equal(authority?.id, 'BG169');
  assert.deepEqual(authority?.transports?.map(x => x.id), ['make', 'github-native']);
  assert.equal(authority?.fallback_policy, 'primary_then_verified_failover');
  assert.equal(authority?.failover_requires_same_contract, true);
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
  assert.doesNotMatch(workflow, /exit 1; \}\s*# no failover/);
});
