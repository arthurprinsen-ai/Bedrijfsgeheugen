import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDefaultAgentRegistry } from '../platform/agents/agent-team.mjs';

const readJson=async path=>JSON.parse(await readFile(new URL(`../${path}`,import.meta.url),'utf8'));

test('Portal V2 parity skill is canonical, discoverable and wired to execution agents',async()=>{
  const skill=await readJson('brain/skills/portal-v2-parity-empty-state-v1.json');
  const chat=await readJson('config/brain-chat-learning-contract.json');
  const universal=await readJson('brain/policies/powerhouse-universal-agent-learning-writeback-v1.json');
  assert.equal(skill.status,'ACTIVE');
  assert.equal(skill.fingerprint,'portal-v2-empty-state-surface-preservation-v1');
  assert.ok(skill.required_behavior.some(rule=>rule.includes('populated, partial and empty')));
  assert.ok(skill.forbidden_patterns.some(rule=>rule.includes('hide adoption curve')));
  assert.ok(chat.canonicalSources.includes('brain/skills/portal-v2-parity-empty-state-v1.json'));
  assert.ok(universal.linked_learning_sources.includes('brain/skills/portal-v2-parity-empty-state-v1.json'));
  assert.equal(universal.portal_v2_parity_skill.required_when_scope_matches,true);

  const registry=createDefaultAgentRegistry();
  for(const id of skill.consumers){
    const agent=registry.get(id);
    assert.ok(agent,`${id} must exist`);
    assert.ok(agent.playbooks.includes(skill.name),`${id} must expose the parity skill playbook`);
    assert.ok(agent.learningContracts.includes('portal-v2-parity.v1'),`${id} must consume parity learning`);
  }
});
