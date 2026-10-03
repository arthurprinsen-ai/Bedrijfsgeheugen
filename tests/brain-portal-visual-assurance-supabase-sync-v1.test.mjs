import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const edge=fs.readFileSync('supabase/functions/powerhouse-visual-assurance-sync/index.ts','utf8');
const migration=fs.readFileSync('supabase/migrations/20261003075748_powerhouse_portal_visual_assurance_github_sync_v1.sql','utf8');

test('visual assurance sync validates canonical GitHub main evidence',()=>{
  assert.match(edge,/portal-visual-density\.yml/);
  assert.match(edge,/branch=main&status=completed/);
  assert.match(edge,/conclusion==='success'/);
  assert.match(edge,/j\?\.name==='visual-density'/);
  assert.match(edge,/powerhouse_daily_scheduler_token/);
  assert.match(edge,/x-powerhouse-token/);
  assert.match(edge,/powerhouse_loop_assurance_receipts_v1/);
  assert.match(edge,/powerhouse_refresh_loop_assurance_v1/);
});

test('visual assurance sync refreshes all eight canonical stages',()=>{
  for(const stage of ['input','decision','action','readback','outcome','measurement','learning','guard']){
    assert.ok(edge.includes(stage),stage);
  }
  assert.match(edge,/pass:true/);
  assert.match(edge,/NO_SUCCESSFUL_MAIN_RUN/);
  assert.match(edge,/VISUAL_DENSITY_JOB_NOT_GREEN/);
});

test('visual assurance sync uses one existing Powerhouse scheduler',()=>{
  assert.match(migration,/powerhouse-portal-visual-assurance-sync-v1/);
  assert.match(migration,/'12 \* \* \* \*'/);
  assert.match(migration,/vault\.decrypted_secrets/);
  assert.match(migration,/powerhouse_daily_scheduler_token/);
  assert.match(migration,/cron_jobname='powerhouse-portal-visual-assurance-sync-v1'/);
});


test('visual assurance sync quality surfaces are registered',()=>{
  const registry=JSON.parse(fs.readFileSync('config/powerhouse-quality-surface-contracts.json','utf8'));
  const byId=new Map(registry.surfaces.map(surface=>[surface.id,surface]));
  for(const id of ['function:powerhouse-visual-assurance-sync','rpc:powerhouse_refresh_loop_assurance_v1']){
    assert.ok(byId.has(id),id);
    assert.equal(byId.get(id).evidence_contract,'tests/brain-portal-visual-assurance-supabase-sync-v1.test.mjs');
  }
  assert.equal(byId.get('rpc:bg_geheim').evidence_contract,'tests/brain-content-closed-loop-contract.test.mjs');
});
