import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync('.github/workflows/native-approved-blog-supply.yml','utf8');

test('approved blog supply grants OIDC only to the model-calling job',()=>{
  const job=workflow.match(/\n  supply:\n([\s\S]*?)(?:\n  [a-z_]+:\n|$)/)?.[1]||'';
  assert.match(job,/\n    permissions:\n      contents: read\n      id-token: write\n/);
  assert.match(job,/uses: anthropics\/claude-code-action@v1/);
  assert.match(job,/anthropic_api_key: \$\{\{ secrets\.ANTHROPIC_API_KEY \}\}/);
  assert.match(workflow,/\npermissions:\n  contents: read\n/);
  assert.doesNotMatch(job,/\n      contents: write\n|\n      pull-requests: write\n/);
});
test('OIDC adjustment does not relax approved stock, verification or quality gates',()=>{
  assert.match(workflow,/steps\.stock\.outputs\.covered != 'true'/);
  assert.match(workflow,/Autopublish toegestaan/);
  assert.match(workflow,/Quality gate/);
  assert.match(workflow,/Herzien/);
  assert.match(workflow,/verification_mode/);
  assert.match(workflow,/blog length contract failed/);
  assert.match(workflow,/at least two H2-style sections required/);
});
