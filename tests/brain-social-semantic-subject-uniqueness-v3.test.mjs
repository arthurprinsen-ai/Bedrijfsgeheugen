import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260928133500_social_semantic_subject_uniqueness_v3.sql','utf8');
const linkedinSkill=fs.readFileSync('.agents/skills/linkedin-composio-publisher/SKILL.md','utf8');
const personalSkill=fs.readFileSync('.agents/skills/personal-linkedin-life-only/SKILL.md','utf8');
const agents=fs.readFileSync('AGENTS.md','utf8');

test('v3 adds a cross-channel distinctive semantic subject gate before provider writes',()=>{
  assert.match(migration,/powerhouse_publication_distinctive_keywords_v1/i);
  assert.match(migration,/SEMANTIC_SUBJECT_DUPLICATE/);
  assert.match(migration,/LIMIT 2500/);
  assert.match(migration,/matched_channel/);
  assert.match(migration,/matched_publication_date/);
});

test('single high-signal concrete anchor is sufficient while broad domains are excluded',()=>{
  assert.match(migration,/v_distinctive_intersection,0\) = 1/);
  assert.match(migration,/length\(coalesce\(v_distinctive_anchor,''\)\) >= 7/);
  assert.match(migration,/'familie','kinderen','school','hockey'/);
  assert.doesNotMatch(migration,/'printer'/i);
});

test('skills and universal agent contract forbid semantic recycling',()=>{
  assert.match(linkedinSkill,/powerhouse-social-semantic-subject-uniqueness-v3/);
  assert.match(linkedinSkill,/printer anecdote is permanently exhausted/i);
  assert.match(personalSkill,/personal-linkedin-never-recycle-story-v2/);
  assert.match(personalSkill,/same printer anecdote is not/i);
  assert.match(agents,/Social semantic uniqueness — universal hard gate/);
  assert.match(agents,/never repaired by paraphrasing/i);
});
