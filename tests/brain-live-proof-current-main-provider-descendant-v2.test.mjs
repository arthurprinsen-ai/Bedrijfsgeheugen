import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('LIVE_BEWEZEN requires fresh current-main/provider binding and terminal ownership', async () => {
  const skill = await readFile('.agents/skills/powerhouse-delivery-self-optimization/SKILL.md', 'utf8');
  assert.ok(skill.includes('delivery|live-proof|current-main-provider-descendant|v1'));
  assert.ok(skill.includes('provider.commit_ref === main_sha'));
  assert.ok(skill.includes('prove the feature merge is an ancestor of the provider production commit'));
  assert.ok(skill.includes('do **not** claim the newest main state is live'));
  assert.ok(skill.includes('never reuse an earlier production readback'));
  assert.ok(skill.includes('dashboard/current-state writeback'));
  for (const state of ['MERGED','DEPLOYED','LIVE_BEWEZEN']) assert.ok(skill.includes(state));
});
