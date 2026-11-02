import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const files=readdirSync(new URL('../supabase/migrations/',import.meta.url))
 .filter(x=>/^\d{14}_[a-z0-9_]+\.sql$/.test(x)).sort();
const local=files.map(x=>({version:x.slice(0,14),name:x.slice(15,-4)}));
const known=[
 ['20261031133000','publication_sync_preserve_recovery_handoff_v1'],
 ['20261031135451','publication_sync_preserve_recovery_handoff_v1'],
 ['20261102074013','verified_tenant_intake_and_quoted_value_payment_truth'],
 ['20261102075243','verified_intake_privileged_trigger_acl_finalizer']
];

test('canonical original production provider ledger and executable Git migrations are exact identity peers',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.match(lock.captured_at,/^2026-11-02T\d\d:/);
 assert.equal(lock.applied.length,790,'complete original provider history observed at release');
 assert.equal(files.length,790,'exact same release source manifest and no extra SQL');
 assert.deepEqual(new Map(lock.applied.map(x=>[x.version,x.name])),new Map(local.map(x=>[x.version,x.name])));
 assert.equal(new Set(files.map(x=>x.slice(0,14))).size,files.length,'no duplicate migration versions');
});

test('already applied duplicate publication-handoff versions both have their exact historical original source',()=>{
 const registered=new Map(lock.applied.map(x=>[x.version,x.name]));
 for(const [version,name] of known){
  assert.equal(registered.get(version),name);
  assert.ok(files.includes(version+'_'+name+'.sql'));
 }
 const earlier=readFileSync(new URL('../supabase/migrations/20261031133000_publication_sync_preserve_recovery_handoff_v1.sql',import.meta.url),'utf8');
 const mirrored=readFileSync(new URL('../supabase/migrations/20261031135451_publication_sync_preserve_recovery_handoff_v1.sql',import.meta.url),'utf8');
 assert.equal(mirrored,earlier,'source mirror must be byte-identical to official historically applied SQL');
});

test('original quote and scan fix plus immutable revoke finalizer remain in the provider-attested inventory',()=>{
 const scan=readFileSync(new URL('../supabase/migrations/20261102074013_verified_tenant_intake_and_quoted_value_payment_truth.sql',import.meta.url),'utf8');
 const final=readFileSync(new URL('../supabase/migrations/20261102075243_verified_intake_privileged_trigger_acl_finalizer.sql',import.meta.url),'utf8');
 assert.match(scan,/AFTER INSERT OR UPDATE OF tenant_identity_status, organisatie_id/);
 assert.match(scan,/AFTER INSERT OR UPDATE OF getekend, tenant_identity_status, organisatie_id/);
 assert.match(scan,/'offerte', NEW.id::text \|\| ':voorstel', 'proposal', 0/);
 assert.doesNotMatch(scan,/'won_order'/);
 assert.match(final,/REVOKE ALL ON FUNCTION intern.trg_scan_uitkomst\(\) FROM PUBLIC, anon, authenticated/);
 assert.match(final,/REVOKE ALL ON FUNCTION intern.trg_offerte_uitkomst\(\) FROM PUBLIC, anon, authenticated/);
});

test('original snapshot explicitly remains provider observation, not a live runtime or paid customer claim',()=>{
 assert.ok(!('realized_revenue_eur' in lock));
 assert.ok(!('revenue_verified' in lock));
 assert.ok(!('runtime_healthy' in lock));
 assert.equal(typeof lock.captured_at,'string');
});
