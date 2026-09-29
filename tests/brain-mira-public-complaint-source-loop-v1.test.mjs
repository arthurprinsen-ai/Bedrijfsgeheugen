import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Mira public complaint source loop is canonical and fail-closed', () => {
  const skill=fs.readFileSync('.agents/skills/instagram-composio-publisher/SKILL.md','utf8');
  const radar=fs.readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
  assert.match(skill,/mira-public-complaint-source-loop-v1/);
  assert.match(skill,/source_signal_id/);
  assert.match(skill,/source_lineage/);
  assert.match(radar,/explicitComplaint/);
  assert.match(radar,/blocked_support_page/);
  assert.match(radar,/powerhouse_materialize_mira_problem_recommendation_v1/);
  assert.doesNotMatch(radar,/forced business bridge/i);
});
