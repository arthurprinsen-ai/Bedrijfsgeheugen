import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateFirstTimeRightPrebuild} from '../tools/delivery/first-time-right-prebuild-gate.mjs';

const workflow=readFileSync(new URL('../.github/workflows/powerhouse-delivery-hygiene.yml',import.meta.url),'utf8');
const original='supabase/functions/original/index.ts';
const regression='tests/brain-first-time-right-protected-admission-stage2-20261104.test.mjs';
const evaluate=async source=>evaluateFirstTimeRightPrebuild({
  changedPaths:[original,regression],
  readSource:async path=>path===original?source:undefined,
  obligationId:'powerhouse|first-time-right|protected-admission-stage2|20261104-v1'
});

test('protected admission obtains checker from exact trusted workflow revision, never candidate import',()=>{
  assert.match(workflow,/name: First Time Right prebuild from protected policy/);
  assert.match(workflow,/TRUSTED_WORKFLOW_SHA: \$\{\{ github\.workflow_sha \}\}/);
  assert.match(workflow,/git show "\$TRUSTED_WORKFLOW_SHA:tools\/delivery\/first-time-right-prebuild-gate\.mjs"/);
  assert.match(workflow,/await import\(pathToFileURL\(process\.env\.TRUSTED_FTR_FILE\)\.href\)/);
  assert.doesNotMatch(workflow,/import\s*\{[^}]*evaluateFirstTimeRightPrebuild[^}]*\}\s*from\s*['"]\.\/tools/);
});
test('guard rejects wrong candidate head and nonregular source before evaluating',()=>{
  assert.match(workflow,/actualHead!==process\.env\.EXPECTED_HEAD_SHA/);
  assert.match(workflow,/evidence\.admitted!==true/);
  assert.match(workflow,/!stat\.isFile\(\)\|\|stat\.isSymbolicLink\(\)/);
  assert.match(workflow,/resolved!==full/);
  assert.match(workflow,/FIRST_TIME_RIGHT_CANDIDATE_HEAD_DRIFT/);
});
test('first time right blocks bad original TypeScript at prebuild without runtime side effect',async()=>{
  const result=await evaluate('export function original(){const revisionInput:any=1;const revisionInput:any=2;return revisionInput;}');
  assert.equal(result.ok,false);
  assert.equal(result.failure_evidence.provider_side_effect_allowed,false);
  assert.ok(result.reasons.some(reason=>reason.code==='MODULE_SYNTAX_REJECTED'));
});
test('valid original TypeScript is admitted by source checker but not marked production proven',async()=>{
  const result=await evaluate('export const original:Record<string,number>={value:1};');
  assert.equal(result.ok,true,JSON.stringify(result.reasons));
  assert.equal(result.state,'PREBUILD_READY');
  assert.equal(result.failure_evidence,null);
  assert.ok(result.next_gates.includes('exact production source and independent outcome readback'));
});
test('missing same-candidate regression blocks source admission',async()=>{
  const result=await evaluateFirstTimeRightPrebuild({changedPaths:[original],readSource:async()=> 'export const safe=true'});
  assert.equal(result.ok,false);
  assert.ok(result.reasons.some(reason=>reason.code==='REGRESSION_TEST_MISSING'));
});
test('protected failure propagates to original admission artifact before learning and integration closure',()=>{
  const checker=workflow.indexOf('name: First Time Right prebuild from protected policy');
  const learning=workflow.indexOf('name: Require canonical learning evidence at protected admission');
  const closure=workflow.indexOf('name: Enforce canonical integration closure at protected admission');
  assert.ok(checker>0&&learning>checker&&closure>learning);
  assert.match(workflow,/evidence\.state='FIRST_TIME_RIGHT_PREBUILD_BLOCKED'/);
  assert.match(workflow,/evidence\.admitted=false/);
  assert.match(workflow,/process\.exitCode=78/);
  assert.match(workflow,/name: Upload admission evidence/);
});
