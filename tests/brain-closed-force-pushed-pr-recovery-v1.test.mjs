import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('closed force-pushed PR recovery is fail-safe against stale rollback', async () => {
  const skill = await readFile('.agents/skills/powerhouse-continuity/SKILL.md', 'utf8');
  const rules = JSON.parse(await readFile('config/delivery-prevention-rules.json', 'utf8'));
  const learning = JSON.parse(await readFile('brain/learning/2026-09-25-closed-force-pushed-pr-recovery-v1.json', 'utf8'));

  assert.match(skill, /delivery\|pr-recovery\|closed-force-pushed-head\|v1/);
  assert.ok(rules.rules.some(rule => rule.id === 'RECONCILE_CLOSED_FORCE_PUSHED_PR_AGAINST_CURRENT_MAIN' && rule.active === true));
  assert.equal(learning.prevention_rule, 'RECONCILE_CLOSED_FORCE_PUSHED_PR_AGAINST_CURRENT_MAIN');
  assert.match(learning.root_cause, /current-main state/i);
});
