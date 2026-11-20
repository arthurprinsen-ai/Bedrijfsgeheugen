import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TARGETS, evaluateHeaders } from '../tools/security/verify-public-security-headers.mjs';

const workflow=readFileSync('.github/workflows/security-operations-proof.yml','utf8');

test('existing security operations workflow observes both sites frequently without creating a parallel executor',()=>{
  assert.match(workflow,/cron: '47 1,7,13,19 \* \* \*'/);
  assert.match(workflow,/cron: '17 5 \* \* 1'/);
  assert.match(workflow,/pull_request:/);
  assert.match(workflow,/Independent recurring production HTTP security proof/);
  assert.match(workflow,/run: node tools\/security\/verify-public-security-headers\.mjs/);
  assert.match(workflow,/github\.event\.schedule == '17 5 \* \* 1'/,'full weekly recovery/DR closure must not fail the 4x/day header monitor');
  assert.equal((workflow.match(/- cron:/g)||[]).length,2);
});
test('four monitored production boundaries include the legacy PW root sharing localStorage',()=>{
  assert.deepEqual(TARGETS.map(t=>t.name),[
    'Bedrijfsgeheugen','PW homepage (shared origin)','PW Zaalcoach','PW Veldcoach'
  ]);
  assert.deepEqual(new Set(TARGETS.map(t=>t.url)).size,4);
  assert.equal(TARGETS.filter(t=>t.mode==='legacy').length,1);
});
test('a Netlify direct upload without security headers fails closed for every site',()=>{
  for(const target of TARGETS){
    const empty=new Headers();
    assert.equal(evaluateHeaders(empty,target.mode).passed,false,target.name);
  }
});
