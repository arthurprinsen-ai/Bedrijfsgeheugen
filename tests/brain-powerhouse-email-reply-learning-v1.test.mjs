import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const skill=readFileSync('.agents/skills/powerhouse-relationship-revenue/SKILL.md','utf8');
const agents=readFileSync('AGENTS.md','utf8');
const map=readFileSync('platform/system-map/canonical-system-map.mjs','utf8');

test('commercial email reply loop is canonically documented',()=>{
  for(const source of [skill,agents,map]) assert.match(source,/powerhouse-email-reply-learning-v1|email-reply-revenue-learning-v1/);
  assert.match(skill,/powerhouse_email_contact_suppressions/);
  assert.match(skill,/revenue-first|realized revenue/i);
  assert.match(agents,/geen parallelle Gmail reply cron|exact één commerciële scheduler/i);
  assert.match(map,/parallelReplyCronCount:0/);
  assert.match(map,/suppressionBeforeSideEffect:true/);
});
