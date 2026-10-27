import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
const segments=workflow.split(/^  model-freshness:\s*$/m);
const learning=JSON.parse(fs.readFileSync('brain/learning/2026-10-22-daily-learning-provider-freshness-isolation-v1.json','utf8'));

test('historical replay: catalog failure cannot suppress independent daily agent learning',()=>{
  assert.equal(segments.length,2,'one existing workflow with independent jobs');
  const [improve,model]=segments;
  assert.match(improve,/^  improve:\s*$/m);
  assert.match(improve,/scripts\/brain\/daily-self-evolution\.mjs/);
  assert.match(improve,/scripts\/brain\/continuous-improvement\/run-autonomous-improvement\.mjs/);
  assert.match(improve,/scripts\/brain\/continuous-improvement\/capability-inventory\.mjs/);
  assert.match(improve,/scripts\/brain\/powerhouse-engineering-closed-loop\.mjs --self-test/);
  assert.doesNotMatch(improve,/ai-model-intelligence-audit\.mjs/);
  assert.doesNotMatch(improve,/needs:\s*(?:\[)?model-freshness/);
  assert.match(improve,/daily-learning-execution-checkpoint\.json/,'daily failures have durable exact-run evidence');
  assert.match(improve,/job_status:process\.env\.DAILY_JOB_STATUS/);
  assert.match(improve,/terminal_proof:false/,'checkpoint cannot claim a green outcome');
  assert.match(improve,/uses: actions\/upload-artifact@v4\s+if: always\(\)/);
  assert.match(model,/scripts\/brain\/ai-model-intelligence-audit\.mjs/);
  assert.match(model,/node --test tests\/ai-model-intelligence-freshness-v1\.test\.mjs/);
});

test('shadow: stale supplier data is a genuine independent RED gate with preserved audit artifact',()=>{
  const model=segments[1]||'';
  assert.match(model,/name: Verify AI model intelligence contract and source-backed freshness/);
  assert.match(model,/if: always\(\)/);
  assert.match(model,/artifacts\/quality\/ai-model-intelligence-audit\.json/);
  assert.doesNotMatch(model,/continue-on-error:\s*true|\|\| true|exit 0/);
  assert.equal(learning.canonical_catalog_incident,'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4367');
  assert.equal(learning.status,'CANDIDATE');
});

test('canary: do not duplicate schedules or restamp 27 model verification claims',()=>{
  assert.equal((workflow.match(/^  schedule:\s*$/gm)||[]).length,1);
  assert.equal((workflow.match(/^  workflow_dispatch:\s*$/gm)||[]).length,1);
  assert.doesNotMatch(workflow,/^  pull_request:/m);
  assert.doesNotMatch(workflow,/sed.*verified_at|restamp.*verified_at/);
  assert.equal(learning.evidence.per_model_freshness_claims_unverified,27);
  assert.equal(learning.evaluation.historical_replay[0],'tests/brain-daily-learning-failure-isolation-v1.test.mjs');
});
