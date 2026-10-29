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
