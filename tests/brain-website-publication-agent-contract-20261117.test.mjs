import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const agents=readFileSync(new URL('../AGENTS.md',import.meta.url),'utf8');
const skill=readFileSync(new URL('../.agents/skills/powerhouse-continuity/SKILL.md',import.meta.url),'utf8');
const lesson=JSON.parse(readFileSync(new URL('../brain/learning/2026-11-17-website-publication-proof-agent-contract-v1.json',import.meta.url),'utf8'));
const playbook=readFileSync(new URL('../docs/brain/groen-draaiboek.md',import.meta.url),'utf8');
test('original agents and continuity skill reject deployment-only daily blog green',()=>{
 for(const doc of [agents,skill]) {
  assert.match(doc,/Netlify READY/);
  assert.match(doc,/content_publication_obligations/);
  assert.match(doc,/LIVE_PROVEN/);
  assert.match(doc,/ONE BRAIN/);
  assert.match(doc,/PROCESSED/);
  assert.match(doc,/2026-11-17|17 november 2026/);
 }
});
test('no duplicate executor, forbidden protected-gate bypass or manual state promotion',()=>{
 assert.match(agents,/geen tweede writer\/cron\/queue|een tweede writer\/cron\/queue starten/i);
 assert.match(skill,/geen parallelle scheduler/i);
 assert.match(skill,/nooit directe databasepromotie/);
 assert.match(playbook,/405 "required status check is expected"/);
 assert.match(playbook,/update-branch/);
});
test('learning remains candidate until native provider and consumer readback',()=>{
 assert.equal(lesson.status,'CANDIDATE');
 assert.equal(lesson.compiler.failure_class,'WEBSITE_DEPLOY_GREEN_BUT_DAILY_BLOG_UNPROVEN');
 assert.deepEqual(lesson.evaluation.historical_replay,['tests/brain-website-publication-agent-contract-20261117.test.mjs']);
 assert.match(lesson.acceptance,/ONE BRAIN|publisher\/consumer/);
});
