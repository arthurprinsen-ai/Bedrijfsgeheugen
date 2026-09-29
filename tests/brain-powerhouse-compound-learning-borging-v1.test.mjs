import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const agents=fs.readFileSync('AGENTS.md','utf8');
const chat=JSON.parse(fs.readFileSync('config/brain-chat-learning-contract.json','utf8'));
const map=fs.readFileSync('platform/system-map/canonical-system-map.mjs','utf8');
const skills=[
  '.agents/skills/powerhouse-continuity/SKILL.md',
  '.agents/skills/powerhouse-self-improvement-layer/SKILL.md',
  '.agents/skills/powerhouse-company-intelligence-os/SKILL.md',
  '.agents/skills/powerhouse-foresight-prediction-intelligence/SKILL.md',
  '.agents/skills/powerhouse-system-map-governance/SKILL.md'
].map(p=>fs.readFileSync(p,'utf8'));

test('all chats and agents inherit daily compound learning',()=>{
  assert.match(agents,/daily-compound-learning\|all-nodes-inherit\|v1/i);
  assert.equal(chat.policy.requireDailyCompoundLearningInheritance,true);
  assert.equal(chat.policy.verifiedOutcomeBeforeLearning,true);
  assert.equal(chat.policy.silenceIsNeverOutcome,true);
  assert.equal(chat.policy.forbidParallelOutcomeForecastLearningStores,true);
});

test('compound learning is discoverable through chat preflight and system map',()=>{
  assert.ok(chat.canonicalSources.includes('brain/learning/2026-09-29-powerhouse-daily-compound-learning-v1.json'));
  assert.match(map,/inheritedByAllChatsAgentsSkills:true/);
  assert.match(map,/chatLearningContract:'config\/brain-chat-learning-contract\.json'/);
  assert.match(map,/agentContract:'AGENTS\.md'/);
});

test('core Powerhouse skills inherit the same compound-learning fingerprint',()=>{
  for(const skill of skills) assert.match(skill,/powerhouse\|daily-compound-learning\|all-nodes-inherit\|v1/);
});
