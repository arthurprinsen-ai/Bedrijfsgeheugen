import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');
const delivery = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));

test('BG169 remains the single production authority', () => {
  const authority = delivery.integration?.productionAuthorityContract;
  assert.equal(authority?.id, 'BG169');
  assert.equal(authority?.exactShaRequired, true);
});

test('GitHub-native BG169 production transport is exact-SHA, same-repo and evidence gated', () => {
  assert.match(workflow, /BG169 GitHub-native production transport/);
  assert.match(workflow, /head\.repo\.full_name/);
  assert.match(workflow, /candidate_sha/);
  assert.match(workflow, /expected_head_sha/);
  assert.match(workflow, /pulls\/\$\{PR_NUMBER\}\/merge/);
  assert.match(workflow, /merge_method/);
  assert.match(workflow, /git merge-base --is-ancestor/);
  assert.match(workflow, /transport="github-native"/);
});

test('BG169 production transport cannot regress to Make', () => {
  assert.doesNotMatch(workflow, /BG169_HANDOFF_URL/);
  assert.doesNotMatch(workflow, /primary Make transport/i);
  assert.doesNotMatch(workflow, /transport="make"/);
  assert.doesNotMatch(workflow, /make_accepted/);
  assert.match(workflow, /BG169_PROMOTION_NOT_VERIFIED/);
});
