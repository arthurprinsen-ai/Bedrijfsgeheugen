import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('config/powerhouse-portal-visual-assurance-v1.json','utf8'));
const workflow=fs.readFileSync('.github/workflows/portal-visual-density.yml','utf8');
const sync=fs.readFileSync('supabase/functions/powerhouse-visual-assurance-sync/index.ts','utf8');
const migration=fs.readFileSync(contract.authority.supabase_sync_migration,'utf8');
const quality=JSON.parse(fs.readFileSync(contract.authority.quality_surface_registry,'utf8'));

test('terminal visual assurance binds GitHub Supabase and Notion into one authority graph',()=>{
  assert.equal(contract.loop_key,'portal-visual-density');
  assert.equal(contract.authority.github_workflow,'.github/workflows/portal-visual-density.yml');
  assert.equal(contract.authority.supabase_sync_function,'powerhouse-visual-assurance-sync');
  assert.equal(contract.authority.supabase_sync_cron,'powerhouse-portal-visual-assurance-sync-v1');
  assert.equal(contract.authority.notion_verified_state_page_id,'3deda36a-ac8a-8106-909c-c74f4185942e');
  assert.equal(contract.authority.notion_system_map_page_id,'3dcda36a-ac8a-8152-be3d-edbb32b06239');
  assert.equal(contract.authority.notion_projection_mode,'verified-state human projection of GitHub/Supabase machine truth');
});

test('terminal visual assurance cannot silently lose execution or sync',()=>{
  assert.match(workflow,/cron: '45 5 \* \* \*'/);
  assert.match(workflow,/tools\/portal-visual-density\.mjs/);
  assert.match(sync,/portal-visual-density\.yml/);
  assert.match(sync,/branch=main&status=completed/);
  assert.match(sync,/VISUAL_DENSITY_JOB_NOT_GREEN/);
  assert.match(migration,/powerhouse-portal-visual-assurance-sync-v1/);
  assert.match(migration,/'12 \* \* \* \*'/);
});

test('terminal visual assurance quality surfaces remain discoverable',()=>{
  const ids=new Set(quality.surfaces.map(s=>s.id));
  assert.ok(ids.has('function:powerhouse-visual-assurance-sync'));
  assert.ok(ids.has('rpc:powerhouse_refresh_loop_assurance_v1'));
});

test('terminal visual assurance is freshness gated and fail closed',()=>{
  for(const rule of [
    'production_evidence_expires',
    'fail_closed_on_threshold_breach',
    'no_tolerance_widening_to_hide_structural_mismatch',
    'cross_system_authority_refs_are_machine_readable',
    'removing_github_supabase_or_notion_projection_must_fail_ci'
  ]) assert.ok(contract.rules.includes(rule),rule);
});
