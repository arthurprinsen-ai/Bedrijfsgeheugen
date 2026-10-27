import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const linkedin=fs.readFileSync('.agents/skills/linkedin-composio-publisher/SKILL.md','utf8');
const continuity=fs.readFileSync('.agents/skills/powerhouse-continuity/SKILL.md','utf8');
const agents=fs.readFileSync('AGENTS.md','utf8');
const systemMap=fs.readFileSync('platform/system-map/canonical-system-map.mjs','utf8');

test('LinkedIn skill permanently applies historical story dedupe to company publishing',()=>{
  assert.match(linkedin,/linkedin-company-historical-dedupe-v5/);
  assert.match(linkedin,/linkedin_company.*durable story fingerprint/i);
  assert.match(linkedin,/employee leaves\/is sick\/on leave/i);
  assert.match(linkedin,/atomic single-writer claim.*not a substitute for historical uniqueness/i);
});

test('all chats and agents inherit the social duplicate prevention contract',()=>{
  assert.match(agents,/social\|historical-uniqueness\|all-chat-agent-inheritance\|v1/);
  assert.match(agents,/LinkedIn bedrijf en LinkedIn persoonlijk krijgen beide een duurzame story fingerprint/);
  assert.match(agents,/employee_absence_or_departure__knowledge_only_in_heads/);
  assert.match(continuity,/powerhouse-social-duplicate-prevention-inheritance-v1/);
  assert.match(continuity,/daily idempotency key only prevents concurrent\/retry duplication/i);
});

test('canonical system map exposes the upgraded social publication authority',()=>{
  assert.match(systemMap,/fingerprint:'linkedin-company-historical-dedupe-v5'/);
  assert.match(systemMap,/atomicDailyWriterIsHistoricalNoveltyProof:false/);
  assert.match(systemMap,/employee_absence_or_departure__knowledge_only_in_heads/);
  assert.match(systemMap,/tests\/brain-linkedin-company-historical-dedupe-v1\.test\.mjs/);
});

test('story-family overlap v6 is inherited and system-mapped',()=>{
  const personal=fs.readFileSync('.agents/skills/personal-linkedin-life-only/SKILL.md','utf8');
  assert.match(linkedin,/powerhouse-story-family-overlap-dedupe-v6/);
  assert.match(linkedin,/powerhouse_publication_story_family_guard_v2/);
  assert.match(linkedin,/at least 10 meaningful keywords overlap/i);
  assert.match(personal,/personal-linkedin-story-family-overlap-v2/);
  assert.match(agents,/social\|story-family-overlap\|all-chat-agent-inheritance\|v1/);
  assert.match(agents,/database backstop and cannot be bypassed/i);
  assert.match(systemMap,/id:'social-story-family-uniqueness-v6'/);
  assert.match(systemMap,/backstop:'public\.powerhouse_publication_story_family_guard_v2'/);
  assert.match(systemMap,/paraphraseRegressionBlocked:true/);
});
