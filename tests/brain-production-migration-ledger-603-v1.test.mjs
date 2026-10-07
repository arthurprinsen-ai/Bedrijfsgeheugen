import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const lock=JSON.parse(fs.readFileSync('supabase/migration-history.lock.json','utf8'));
const expected=[
  [
    "20261007061626",
    "powerhouse_runtime_cron_pressure_relief_v1"
  ],
  [
    "20261007062150",
    "powerhouse_identity_graph_watermark_incremental_v1"
  ],
  [
    "20261007063127",
    "powerhouse_runtime_scheduler_mux_v1"
  ],
  [
    "20261007063348",
    "separate_runtime_maintenance_from_heartbeat_minutes"
  ],
  [
    "20261007063439",
    "bound_identity_graph_hotpath_and_heartbeat_batch"
  ],
  [
    "20261007063440",
    "bound_commercial_identity_graph_runtime_v2"
  ],
  [
    "20261007063948",
    "fold_prediction_audit_and_retire_duplicate_runtime_cron"
  ],
  [
    "20261007064533",
    "separate_runtime_mux_from_commercial_heartbeat_slots_v1"
  ],
  [
    "20261007064605",
    "remove_revenue_attribution_truncate_lock_and_duplicate_refresh"
  ],
  [
    "20261007064948",
    "align_commercial_closure_with_outbound_quality_gate_v1"
  ]
];

test('migration lock matches the observed 603-row production authority',()=>{
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  assert.equal(lock.source,'supabase_migration_history');
  assert.equal(lock.applied.length,603);
  assert.deepEqual(lock.applied.slice(-10).map(row=>[row.version,row.name]),expected);
});

test('every newly reconciled production identity has one canonical local migration file',()=>{
  for(const [version,name] of expected){
    const path='supabase/migrations/'+version+'_'+name+'.sql';
    assert.equal(fs.existsSync(path),true,path+' missing');
    const sql=fs.readFileSync(path,'utf8');
    assert.ok(sql.trim().length>0,path+' empty');
    assert.doesNotMatch(sql,/insert\s+into\s+supabase_migrations\.schema_migrations/i);
    assert.doesNotMatch(sql,/to_char\(current_timestamp,\s*'YYYYMMDDHH24MISS'\)/i);
  }
});

test('ledger identities are unique by production version and file identity',()=>{
  const versions=lock.applied.map(row=>row.version);
  assert.equal(new Set(versions).size,versions.length);
  for(const [version,name] of expected){
    const matches=fs.readdirSync('supabase/migrations').filter(file=>file.startsWith(version+'_'));
    assert.deepEqual(matches,[version+'_'+name+'.sql']);
  }
});
