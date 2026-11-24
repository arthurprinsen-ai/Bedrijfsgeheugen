import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
const agent=readFileSync('platform/agents/agent-team.mjs','utf8');
const skill=readFileSync('.agents/skills/powerhouse-self-improvement-layer/SKILL.md','utf8');
const originalScript=readFileSync('scripts/brain/innovation-original-agent-pre-review.mjs','utf8');
const admission=readFileSync('tools/delivery/daily-learning-run-admission.mjs','utf8');

const dailyCondition="github.event_name != 'workflow_dispatch' || inputs.execution_scope != 'original_intake_recovery'";
const recoveryCondition="github.event_name == 'workflow_dispatch' && inputs.execution_scope == 'original_intake_recovery'";

test('one original daily scheduler, same workflow and shared concurrency for recover-only mode',()=>{
 assert.equal((workflow.match(/^\s+- cron:/gm)||[]).length,1);
 assert.equal((workflow.match(/^  workflow_dispatch:/gm)||[]).length,1);
 assert.match(workflow,/concurrency:\s*\n  group: powerhouse-daily-self-evolution-\$\{\{ github\.ref \}\}/);
 assert.match(workflow,/cancel-in-progress: false/);
 assert.match(workflow,/execution_scope:\n[\s\S]*?type: choice\n[\s\S]*?default: daily\n[\s\S]*?original_intake_recovery/);
 assert.doesNotMatch(workflow,/^  pull_request:/m);
 assert.doesNotMatch(workflow,/cron\.schedule|net\.http_post|new Queue|new Publisher/);
});

test('normal daily jobs remain protected by the identical first-run admission contract',()=>{
 for(const id of ['daily-admission','improve','model-freshness']){
   const job=workflow.split(new RegExp('^  '+id+':\\n','m'))[1]?.split(/^  [a-z][a-z0-9-]*:\n/m)[0];
   assert.ok(job,id+' exists');
   assert.ok(job.includes(dailyCondition),id+' excludes repair-only replay');
 }
 assert.match(admission,/DUPLICATE_DAILY_RUN_SUPPRESSED/);
 assert.match(admission,/FIRST_DAILY_RUN_ADMITTED/);
 assert.match(admission,/process\.exitCode=78/);
});

test('recovery is a bounded manual branch of one original workflow, not a second learning run',()=>{
 const job=workflow.split(/^  original-intake-recovery:\n/m)[1]?.split(/^  [a-z][a-z0-9-]*:\n/m)[0];
 assert.ok(job,'one original scoped repair job');
 const t=job;
 assert.ok(t.includes(recoveryCondition));
 assert.match(t,/node --test tests\/brain-innovation-original-agent-pre-review-20261115\.test\.mjs/);
 assert.match(t,/node scripts\/brain\/innovation-original-owner-readback\.mjs/);
 assert.match(t,/node scripts\/brain\/innovation-original-agent-pre-review\.mjs --writeback/);
 assert.match(t,/secrets\.BG_PORTAL_EU_SUPABASE_SERVICE_ROLE_KEY \|\| secrets\.SUPABASE_SERVICE_ROLE_KEY/);
 assert.doesNotMatch(t,/daily-self-evolution\.mjs|ai-model-intelligence-audit\.mjs|cron\.schedule|GITHUB_TOKEN|linkedin.*create|new queue/i);
 assert.match(t,/original-innovation-pre-review-recovery-\$\{\{ github\.run_id \}\}/);
});

test('only original versioned Brain operation may be updated, and no false agent success is minted',()=>{
 assert.match(originalScript,/p_expected_version:item\.operationVersion/);
 assert.match(originalScript,/p_status:'PLANNED'/);
 assert.match(originalScript,/consumer_ack_verified:false/);
 assert.match(originalScript,/external_side_effect:false/);
 assert.match(originalScript,/getExactOperation\(/);
 assert.match(originalScript,/VERSION_OR_PROVIDER_CONFLICT/);
 assert.doesNotMatch(originalScript,/status:'VERIFIED'|p_status:'VERIFIED'|direct_production_mutation:true/);
 assert.match(agent,/resume-original-source-bound-innovation-review-within-same-daily-workflow/);
 assert.match(skill,/original_intake_recovery/);
});
