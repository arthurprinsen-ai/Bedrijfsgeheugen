import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson=async path=>JSON.parse(await readFile(new URL(`../${path}`,import.meta.url),'utf8'));

test('missing-connections recovery is canonical, evidence-first and discoverable',async()=>{
  const skill=await readJson('brain/skills/powerhouse-missing-connections-recovery-v1.json');
  const learning=await readJson('brain/learning/2026-09-18-missing-connections-recovery-v1.json');
  const chat=await readJson('config/brain-chat-learning-contract.json');

  assert.equal(skill.status,'ACTIVE');
  assert.equal(skill.fingerprint,'powerhouse-missing-connections-runtime-schema-readback-v1');
  assert.equal(learning.source_pr,2023);
  assert.equal(learning.terminal_state,'RECORDED_PENDING_FINAL_DELIVERY_READBACK');

  assert.ok(skill.required_behavior.some(rule=>rule.includes('live schema and runtime evidence')));
  assert.ok(skill.required_behavior.some(rule=>rule.includes('earliest truthful stage')));
  assert.ok(skill.forbidden_patterns.some(rule=>rule.includes('fabricating economics')));
  assert.ok(skill.forbidden_patterns.some(rule=>rule.includes('queued CI')));

  assert.ok(chat.canonicalSources.includes('brain/skills/powerhouse-missing-connections-recovery-v1.json'));
  assert.ok(chat.canonicalSources.includes('brain/learning/2026-09-18-missing-connections-recovery-v1.json'));

  for(const rule of [
    'CURRENT_RUNTIME_SCHEMA_BEFORE_MISSING_CONNECTION_CLAIM',
    'CONFIGURED_IS_NOT_PERSISTED_EVIDENCE',
    'QUEUED_CI_IS_NOT_A_ROOT_CAUSE',
    'NO_PARALLEL_LINEAGE_FOR_OWNED_OBLIGATION',
    'HISTORICAL_ACTIONS_BOOTSTRAP_ONLY_TO_TRUTHFUL_STAGE',
    'LIVE_PROVEN_REQUIRES_PRODUCTION_READBACK_AND_LEARNING_WRITEBACK'
  ]) assert.ok(learning.prevention_rules.includes(rule));
});
