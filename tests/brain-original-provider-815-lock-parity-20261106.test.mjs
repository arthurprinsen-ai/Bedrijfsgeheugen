import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const root=new URL('../',import.meta.url);
const lock=JSON.parse(readFileSync(new URL('supabase/migration-history.lock.json',root),'utf8'));
const applied=lock.applied||[];
const verifiedVersion='20261106144500';
const verifiedName='weekly_cron_health_cadence_original_function_v1';
test('proven weekly cadence migration appears exactly once in original immutable provider source lock',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.deepEqual(applied.filter(row=>row.version===verifiedVersion),[{version:verifiedVersion,name:verifiedName}]);
 assert.equal(new Set(applied.map(row=>row.version)).size,applied.length);
 assert.ok(applied.length>=815);
});
test('locked version has same executable migration identity and healthy-cadence failure safeguards',()=>{
 const filename='supabase/migrations/'+verifiedVersion+'_'+verifiedName+'.sql';
 assert.ok(existsSync(new URL(filename,root)),filename);
 const sql=readFileSync(new URL(filename,root),'utf8');
 for(const guard of ['HEALTH_WEEKLY_SOURCE_SIGNATURE_DRIFT','HEALTH_WEEKLY_CANONICAL_SECURITY_DRIFT',
 'HEALTH_WEEKLY_POSTWRITE_READBACK_FAILED','7 days 2 hours'])assert.ok(sql.includes(guard),guard);
});
test('later independently applied migrations must not break historical provider lock regression',()=>{
 const versions=applied.map(row=>row.version);
 assert.deepEqual(versions,[...versions].sort(),'Original provider migration history must stay chronological');
 const mira=applied.find(row=>row.version==='20261106160000');
 if(mira) assert.equal(mira.name,'mira_original_pristine_waiting_asset_claim_v1');
 // Actual production application is checked by the protected migration parity gate,
 // not by asserting a proposed version must remain absent forever.
});
