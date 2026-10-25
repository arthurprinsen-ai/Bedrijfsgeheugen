import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateUnifiedLearningContract, REQUIRED } from '../scripts/brain/validate-unified-learning-contract.mjs';

test('unified contract is wired to daily job, shared skill and agent instructions',()=>{
  const result=validateUnifiedLearningContract();
  assert.deepEqual(result.errors,[]);
  assert.equal(result.status,'CONTRACT_VALID');
});
test('missing or weakened evidence requirements fail closed',()=>{
  const files=Object.fromEntries(REQUIRED.map(p=>[p,fs.readFileSync(p,'utf8')]));
  const cfg='config/powerhouse-daily-self-evolution.json';
  files[cfg]=files[cfg].replace('"evidence_before_promotion": true','"evidence_before_promotion": false');
  const result=validateUnifiedLearningContract({read:p=>files[p]});
  assert.equal(result.status,'BLOCKED');
  assert.ok(result.errors.some(x=>x.includes('evidence_before_promotion')));
});
test('broken skill reference and lost scheduled guard cannot silently pass',()=>{
  const files=Object.fromEntries(REQUIRED.map(p=>[p,fs.readFileSync(p,'utf8')]));
  files['AGENTS.md']=files['AGENTS.md'].replaceAll('docs/architecture/unified-brain-heartbeat-learning-revenue-contract-20261025.md','missing-contract.md');
  files['.github/workflows/powerhouse-daily-self-evolution.yml']=files['.github/workflows/powerhouse-daily-self-evolution.yml'].replace('node scripts/brain/validate-unified-learning-contract.mjs','echo skipped');
  const r=validateUnifiedLearningContract({read:p=>files[p]});
  assert.ok(r.errors.some(x=>x.includes('AGENTS.md')));
  assert.ok(r.errors.some(x=>x.includes('Daily workflow')));
});
