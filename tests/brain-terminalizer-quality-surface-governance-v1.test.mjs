import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminalizer treats quality surface registry as governance instead of unknown runtime', async()=>{
  const workflow=await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');
  const governanceStart=workflow.indexOf('is_governance_path()');
  const runtimeStart=workflow.indexOf('runtime_classes=', governanceStart);
  assert.ok(governanceStart>=0 && runtimeStart>governanceStart);
  const governanceBlock=workflow.slice(governanceStart,runtimeStart);
  assert.match(governanceBlock,/config\/powerhouse-quality-surface-contracts\.json/);
  assert.match(workflow,/UNWIRED_NON_NETLIFY_RUNTIME_READBACK/);
});
