import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const workflow=readFileSync('.github/workflows/supabase-edge-production-authority.yml','utf8');
const guardStart='          if [ "$GITHUB_EVENT_NAME" = "workflow_dispatch" ] && [ -z "${REQUESTED_FUNCTIONS//[[:space:]]/}" ]; then';

test('manual Edge provider parity requires an explicit non-empty function selection',()=>{
  assert.match(workflow,/workflow_dispatch:\s*\n\s*inputs:\s*\n\s*functions:[\s\S]*?required:\s*true/);
  assert.ok(workflow.includes(guardStart),'manual scope guard missing');
  assert.ok(workflow.includes('SUPABASE_EDGE_MANUAL_SCOPE_REQUIRED'));
  const start=workflow.indexOf(guardStart);
  const end=workflow.indexOf('\n          fi',start);
  assert.ok(start>=0 && end>start,'manual fail-closed Bash block not found');
  const shell='set -euo pipefail\n'+workflow.slice(start,end+'\n          fi'.length)+'\n';
  const cases=[
    {event:'workflow_dispatch',functions:'',exit:78},
    {event:'workflow_dispatch',functions:'   ',exit:78},
    {event:'workflow_dispatch',functions:'netlify-deploy-bridge',exit:0},
    {event:'push',functions:'',exit:0},
  ];
  for(const sample of cases){
    const result=spawnSync('bash',['-c',shell],{
      encoding:'utf8',
      env:{...process.env,GITHUB_EVENT_NAME:sample.event,REQUESTED_FUNCTIONS:sample.functions}
    });
    assert.equal(result.status,sample.exit,`unexpected guard result for ${JSON.stringify(sample)}: ${result.stderr||result.stdout}`);
  }
});

test('manual CI guard preserves Supabase read-only provider parity authority',()=>{
  assert.ok(workflow.includes('supabase functions download "$fn" --project-ref "$PROJECT_REF" --use-api'));
  assert.ok(workflow.includes('SUPABASE_ACCESS_TOKEN_INVALID_REAUTH_REQUIRED'));
  assert.ok(workflow.includes('SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG'));
  assert.ok(workflow.includes('git merge-base --is-ancestor'));
  assert.doesNotMatch(workflow,/supabase functions deploy/);
});
