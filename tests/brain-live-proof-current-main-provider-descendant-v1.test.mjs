import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('LIVE_BEWEZEN requires fresh current-main/provider binding and descendant proof', async () => {
  const skill = await readFile('.agents/skills/powerhouse-delivery-self-optimization/SKILL.md', 'utf8');
  assert.match(skill, /delivery\\|live-proof\\|current-main-provider-descendant\\|v1/);
  assert.match(skill, /provider\\.commit_ref === main_sha/);
  assert.match(skill, /prove the feature merge is an ancestor of the provider production commit/);
  assert.match(skill, /current .*main.* is newer than provider production[\\s\\S]*do \\*\\*not\\*\\* claim the newest main state is live/);
  assert.match(skill, /never reuse an earlier production readback after .*main.* or the provider deploy identity has changed/);
  assert.match(skill, /MERGED[\\s\\S]*DEPLOYED[\\s\\S]*LIVE_BEWEZEN/);
});
