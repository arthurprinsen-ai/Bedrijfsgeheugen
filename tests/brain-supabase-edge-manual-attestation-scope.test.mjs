import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const workflow=readFileSync('.github/workflows/supabase-edge-production-authority.yml','utf8');
const guardStart='          if [ "$GITHUB_EVENT_NAME" = "workflow_dispatch" ] && [ -z "${REQUESTED_FUNCTIONS//[[:space:]]/}" ] && [ -z "$REQUESTED_REPLAY_PR" ]; then';

test('manual Edge provider parity requires an explicit non-empty function selection or original replay',()=>{
  assert.match(workflow,/workflow_dispatch:\s*\n\s*inputs:\s*\n\s*functions:[\s\S]*?required:\s*false[\s\S]*?replay_pr:[\s\S]*?required:\s*false/);
  assert.ok(workflow.includes(guardStart),'manual scope guard missing');
  assert.ok(workflow.includes('SUPABASE_EDGE_MANUAL_SCOPE_REQUIRED'));
  const start=workflow.indexOf(guardStart);
  const end=workflow.indexOf('\n          fi',start);
  assert.ok(start>=0 && end>start,'manual fail-closed Bash block not found');
  const shell='set -euo pipefail\n'+workflow.slice(start,end+'\n          fi'.length)+'\n';
  const cases=[
    {event:'workflow_dispatch',functions:'',replay:'',exit:78},
    {event:'workflow_dispatch',functions:'   ',replay:'',exit:78},
    {event:'workflow_dispatch',functions:'netlify-deploy-bridge',replay:'',exit:0},
    {event:'workflow_dispatch',functions:'',replay:'6136',exit:0},
    {event:'push',functions:'',replay:'',exit:0},
  ];
  for(const sample of cases){
    const result=spawnSync('bash',['-c',shell],{
      encoding:'utf8',
      env:{...process.env,GITHUB_EVENT_NAME:sample.event,REQUESTED_FUNCTIONS:sample.functions,REQUESTED_REPLAY_PR:sample.replay}
    });
    assert.equal(result.status,sample.exit,'unexpected guard result for '+JSON.stringify(sample)+': '+(result.stderr||result.stdout));
  }
});

test('original replay rejects ambiguous input and non-manual or malformed PR identity before any provider read',()=>{
  const start=workflow.indexOf('            [ "$GITHUB_EVENT_NAME" = workflow_dispatch ] && [[');
  const end=workflow.indexOf('\n            }',start);
  assert.ok(start>=0&&end>start);
  const shell='set -euo pipefail\n'+workflow.slice(start,end+'\n            }'.length)+'\n';
  const cases=[
    ['workflow_dispatch','','6136',0],
    ['workflow_dispatch','netlify-deploy-bridge','6136',78],
    ['workflow_dispatch','','0',78],
    ['workflow_dispatch','','abc',78],
    ['workflow_dispatch','','6136;echo invalid',78],
    ['push','','6136',78],
  ];
  for(const [event,functions,replay,exit] of cases){
    const result=spawnSync('bash',['-c',shell],{encoding:'utf8',env:{...process.env,GITHUB_EVENT_NAME:event,REQUESTED_FUNCTIONS:functions,REQUESTED_REPLAY_PR:replay}});
    assert.equal(result.status,exit,JSON.stringify({event,functions,replay,stderr:result.stderr}));
  }
  assert.ok(workflow.includes('SUPABASE_EDGE_REPLAY_TARGET_INVALID'));
  assert.ok(workflow.includes('SUPABASE_EDGE_REPLAY_ORIGINAL_SOURCE_SUPERSEDED'));
  assert.ok(workflow.includes('SUPABASE_EDGE_REPLAY_EMPTY_SCOPE'));
});

test('manual CI guard preserves Supabase read-only provider parity authority',()=>{
  assert.ok(workflow.includes('supabase functions download "$fn" --project-ref "$PROJECT_REF" --use-api'));
  assert.ok(workflow.includes('SUPABASE_ACCESS_TOKEN_INVALID_REAUTH_REQUIRED'));
  assert.ok(workflow.includes('SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG'));
  assert.ok(workflow.includes('git merge-base --is-ancestor'));
  assert.doesNotMatch(workflow,/supabase functions deploy/);
});
