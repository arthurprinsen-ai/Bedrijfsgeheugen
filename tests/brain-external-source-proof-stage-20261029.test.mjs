import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('post-release source proof retains natural-run and historical-topic acceptance gates',()=>{
  const skill=readFileSync(new URL('../.agents/skills/powerhouse-source-universe-impact-engine/SKILL.md',import.meta.url),'utf8');
  const learning=JSON.parse(readFileSync(new URL('../brain/learning/2026-10-29-tavily-plan-limit-canonical-fallback.json',import.meta.url),'utf8'));
  assert.match(skill,/NATURAL_RUN_PENDING/);
  assert.match(skill,/BEDRIJFSOVERDRACHT_PENDING/);
  assert.match(skill,/40101/);
  assert.equal(learning.evidence.postrelease_operator_run.request_id,15935);
  assert.equal(learning.evidence.postrelease_operator_run.successful,3);
  assert.equal(learning.evidence.acceptance.natural_scheduler_run,'PENDING');
  assert.equal(learning.evidence.acceptance.historically_failed_topic_Bedrijfsoverdracht,'PENDING');
  assert.equal(learning.evidence.acceptance.dataforseo_cost_delta,'UNKNOWN');
});

test('all source-domain agents route through the canonical skill and existing incident instead of inventing a parallel executor',()=>{
  const agents=readFileSync(new URL('../AGENTS.md',import.meta.url),'utf8');
  const skill=readFileSync(new URL('../.agents/skills/powerhouse-source-universe-impact-engine/SKILL.md',import.meta.url),'utf8');
  assert.match(agents,/## Externe signalen — verplichte agent- en skilloverdracht/);
  assert.ok(agents.includes('.agents/skills/powerhouse-source-universe-impact-engine/SKILL.md'));
  assert.ok(agents.includes('brain/learning/2026-10-29-tavily-plan-limit-canonical-fallback.json'));
  assert.ok(agents.includes('powerhouse|external-search|tavily-plan-limit-432|20261029'));
  assert.match(agents,/NATURAL_RUN_PENDING/);
  assert.match(agents,/HISTORICAL_TOPIC_PENDING/);
  assert.match(skill,/## Verplichte cross-agent preflight/);
  assert.match(skill,/40101-no-retry/);
  assert.match(skill,/geen extra paid retry/);
});
