import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Powerhouse portal visual assurance is one cross-system contract',()=>{
  const contract=JSON.parse(fs.readFileSync('config/powerhouse-portal-visual-assurance-v1.json','utf8'));
  const policy=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
  const workflow=fs.readFileSync('.github/workflows/portal-visual-density.yml','utf8');
  const portalLane=policy.lanes.find(lane=>lane.id==='portal');

  assert.equal(contract.loop_key,'portal-visual-density');
  assert.equal(contract.fingerprint,'portal-visual-density-oversized-responsive-cascade-v1');
  assert.equal(contract.authority.supabase_registry,'public.powerhouse_loop_assurance_registry_v1');
  assert.equal(contract.authority.supabase_receipts,'public.powerhouse_loop_assurance_receipts_v1');
  assert.equal(contract.authority.supabase_quality,'public.powerhouse_quality_events');
  assert.equal(contract.authority.supabase_runtime_source,null);
  assert.equal(contract.authority.supabase_receipt_mode,'explicit_external_test_evidence');
  assert.equal(contract.authority.supabase_guard_requires_pass,true);
  assert.equal(contract.authority.notion_state,'Portal V2 visual regression — canonical route authority');
  assert.equal(contract.authority.supabase_sync_function,'powerhouse-visual-assurance-sync');
  assert.equal(contract.authority.supabase_sync_cron,'powerhouse-portal-visual-assurance-sync-v1');
  assert.equal(contract.authority.notion_verified_state_page_id,'3deda36a-ac8a-8106-909c-c74f4185942e');
  assert.equal(contract.authority.notion_system_map_page_id,'3dcda36a-ac8a-8152-be3d-edbb32b06239');

  assert.equal(contract.routes.length,3);
  assert.equal(contract.viewports.length,3);
  assert.equal(contract.routes.length*contract.viewports.length,9);
  assert.deepEqual(contract.stages,['input','decision','action','readback','outcome','measurement','learning','guard']);

  for(const path of [
    'tools/portal-visual-density.mjs',
    'config/powerhouse-portal-visual-assurance-v1.json',
    '.github/workflows/portal-visual-density.yml'
  ]) assert.ok(portalLane.paths.includes(path),path);

  assert.match(workflow,/schedule:/);
  assert.match(workflow,/cron: '45 5 \* \* \*'/);
  assert.match(workflow,/https:\/\/www\.bedrijfsgeheugen\.nl/);
  assert.ok(contract.rules.includes('production_evidence_expires'));
  assert.ok(contract.rules.includes('no_tolerance_widening_to_hide_structural_mismatch'));
});
