import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('LIVE_BEWEZEN requires fresh current-main/provider binding and descendant proof', async () => {
  const skill = await readFile('.agents/skills/powerhouse-delivery-self-optimization/SKILL.md', 'utf8');
  assert.ok(skill.includes('delivery|live-proof|current-main-provider-descendant|v1'));
  assert.ok(skill.includes('provider.commit_ref === main_sha'));
  assert.ok(skill.includes('prove the feature merge is an ancestor of the provider production commit'));
  assert.ok(skill.includes('do **not** claim the newest main state is live'));
  assert.ok(skill.includes('never reuse an earlier production readback after `main` or the provider deploy identity has changed'));
  assert.ok(skill.includes('MERGED'));
  assert.ok(skill.includes('DEPLOYED'));
  assert.ok(skill.includes('LIVE_BEWEZEN'));
});
