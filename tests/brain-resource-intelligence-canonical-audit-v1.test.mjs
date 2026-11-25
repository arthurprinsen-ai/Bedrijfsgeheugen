import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const auditPath='scripts/brain/resource-intelligence-audit.mjs';
const migrationPath='supabase/migrations/20260917094812_powerhouse_resource_intelligence_v1.sql';

test('resource audit uses the existing production-backed migration, never a phantom version', async()=>{
  const [audit,source,contract]=await Promise.all([
    readFile(auditPath,'utf8'),readFile(migrationPath,'utf8'),
    readFile('tests/powerhouse-resource-intelligence-contract.test.mjs','utf8')
  ]);
  assert.ok(audit.includes(migrationPath));
  assert.ok(contract.includes(migrationPath));
  assert.ok(!audit.includes('20260917093000_powerhouse_resource_intelligence_v1.sql'));
  assert.ok(!audit.includes('energy_wh'));
  assert.ok(!audit.includes('water_ml'));
  for(const field of [
    'energy_kwh','water_liters','co2e_kg','factor_coverage','provenance_complete',
    'powerhouse_compliance_evidence_v1','powerhouse_optimization_candidate_v1',
    'powerhouse_resource_intelligence_daily_v1','BG169'
  ]){
    assert.ok(source.includes(field), 'canonical migration is missing '+field);
    assert.ok(audit.includes(field), 'audit omitted source contract '+field);
  }
});

test('real canonical physical sums preserve NULL and never impute missing readings as zero', async()=>{
  const sql=await readFile(migrationPath,'utf8');
  for(const measure of ['energy_kwh','water_liters','co2e_kg']){
    const rx=new RegExp('sum\\('+measure+'\\)\\s+filter\\s*\\(where\\s+'+measure+'\\s+is\\s+not\\s+null\\)','i');
    assert.match(sql,rx);
    assert.doesNotMatch(sql,new RegExp('coalesce\\s*\\(\\s*'+measure+'\\s*,\\s*0\\s*\\)','i'));
  }
});

test('the original scheduled Resource Intelligence audit actually executes and remains evidence bounded',()=>{
  const stdout=execFileSync(process.execPath,[auditPath,'--check'],{
    encoding:'utf8',timeout:15000,stdio:['ignore','pipe','pipe']
  });
  const receipt=JSON.parse(stdout);
  assert.equal(receipt.status,'RESOURCE_INTELLIGENCE_READY');
  assert.equal(receipt.fingerprint,'powerhouse-resource-intelligence-v1');
  assert.equal(receipt.unknown_data_policy,'null_not_zero');
  assert.equal(receipt.production_authority,'BG169');
  assert.equal(receipt.daily_learning,true);
});
