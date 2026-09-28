import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const planner=fs.readFileSync('supabase/migrations/20260928114500_powerhouse_linkedin_sales_machine_v1.sql','utf8');
const cycle=fs.readFileSync('supabase/migrations/20260928115000_powerhouse_linkedin_sales_machine_cycle_v1.sql','utf8');
const worker=fs.readFileSync('supabase/functions/powerhouse-linkedin-sales-machine/index.ts','utf8');
const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const skill=fs.readFileSync('.agents/skills/powerhouse-linkedin-sales-machine/SKILL.md','utf8');

test('linkedin sales machine only comments on evidence-bound company-specific posts',()=>{
  assert.match(planner,/source_company_specific/);
  assert.match(planner,/linkedin\.com\/\(posts\/\|feed\/update\/\)/);
  assert.match(planner,/relationship_revenue_score>=\.55/);
  assert.match(planner,/t\.confidence>=\.60/);
  assert.match(planner,/interval '14 days'/);
  assert.match(planner,/greatest\(0,3-/);
});

test('company page receives anonymized sales air cover',()=>{
  assert.match(planner,/sales_air_cover/);
  assert.match(planner,/'linkedin_company'/);
  assert.match(planner,/prospect_names_forbidden/);
  assert.match(planner,/Noem geen individuele prospects/i);
});

test('comment generation is governed, context first and non promotional',()=>{
  assert.match(worker,/brain_ai_governance_registry/);
  assert.match(worker,/no_sales_pitch_verified/);
  assert.match(worker,/Geen verkooptekst/);
  assert.match(worker,/maximaal 450 tekens/i);
  assert.match(worker,/powerhouse-social-publisher/);
});

test('social publisher uses allowed sales-action statuses for LinkedIn autopilot',()=>{
  const start=publisher.indexOf('async function runLinkedInCockpitAutopilot');
  const end=publisher.indexOf('const INSTAGRAM_CANONICAL_USERNAME',start);
  const block=publisher.slice(start,end);
  assert.match(block,/status:'waiting'/);
  assert.match(block,/status:'done'/);
  assert.match(block,/status:'error'/);
  assert.doesNotMatch(block,/\.update\(\{status:'dispatching'/);
  assert.doesNotMatch(block,/\.update\(\{status:'executed'/);
  assert.match(block,/eq\('action_type','reply_post'\)/);
  assert.match(block,/limit\(3\)/);
});

test('linkedin touch precedes email when available and dm is never fabricated',()=>{
  assert.match(cycle,/interval '24 hours'/);
  assert.match(planner,/'dm_capability','UNAVAILABLE'/);
  assert.match(planner,/'dm_fallback','email'/);
  assert.match(skill,/LinkedIn DM is alleen toegestaan/i);
});
