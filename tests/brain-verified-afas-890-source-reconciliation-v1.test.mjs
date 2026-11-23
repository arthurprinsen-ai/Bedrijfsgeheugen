import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {verifyOriginalAfas890VersionReconciliation,
 EXACT_AFAS_BASE_SHA,AFAS_SOURCE_PROPOSAL,AFAS_NATIVE_SOURCE}
 from '../tools/ci/verified-original-afas-890-version-reconciliation.mjs';

const sql=await readFile(new URL('../supabase/migrations/20261122162147_portal_connector_real_afas_source_readback_v1.sql',import.meta.url),'utf8');
const current=JSON.parse(await readFile(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const before={...current,applied:current.applied.slice(0,-1),captured_at:'2026-11-21T12:50:55.253Z'};
const diff=[{status:'D',file:AFAS_SOURCE_PROPOSAL},{status:'A',file:AFAS_NATIVE_SOURCE}];
const props={baseSha:EXACT_AFAS_BASE_SHA,changedMigrations:diff,baseLock:before,headLock:current,baseSQL:sql,nativeSQL:sql};
test('strictly pinned original AFAS provider version reconciliation succeeds only with exact previously applied SQL',()=>{
 const result=verifyOriginalAfas890VersionReconciliation(props);
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.sourceBytes,5569);
 assert.equal(result.providerStatementMD5,'c06f2b2d0392a57ca383cf0dddb0eb3c');
 assert.equal(result.sourceSHA256,'f9e47051fe44931a1c48e7f7b271b803fd819a82c023fd1243213fb751fc293d');
 assert.equal(result.newSQLExecuted,false);
 assert.equal(result.hostedPreviewRequired,true);
 assert.equal(result.genericHistoricalRenameAllowed,false);
});
test('base, rename scope, history, provider identity and SQL bytes each fail closed independently',()=>{
 const changes=[
  {...props,baseSha:'0'.repeat(40)},
  {...props,changedMigrations:[]},
  {...props,changedMigrations:[{status:'D',file:'supabase/migrations/20261120120000_other.sql'},diff[1]]},
  {...props,baseLock:{...before,project_ref:'another-tenant'}},
  {...props,headLock:{...current,applied:current.applied.slice(0,-1)}},
  {...props,headLock:{...current,applied:[...current.applied.slice(0,-1),{version:'20261122162148',name:'portal_connector_real_afas_source_readback_v1'}]}},
  {...props,headLock:{...current,applied:[{version:'0',name:'fake'},...current.applied.slice(1)]}},
  {...props,nativeSQL:sql.replace('service_role','anon')},
  {...props,baseSQL:sql+'\n-- not exact'},
  {...props,nativeSQL:sql+'\n-- not exact'},
  {...props,headLock:{...current,captured_at:'2020-01-01T00:00:00Z'}},
 ];
 for(let i=0;i<changes.length;i++){
  const outcome=verifyOriginalAfas890VersionReconciliation(changes[i]);
  assert.equal(outcome.ok,false,'negative case '+i);
 }
});
test('protected migration admission invokes this ONLY for exactly pinned provider-evidenced version',async()=>{
 const guard=await readFile(new URL('../tools/ci/protected-supabase-pr-migration-tests.mjs',import.meta.url),'utf8');
 assert.match(guard,/base===EXACT_AFAS_BASE_SHA&&changedMigrations.length===2/);
 assert.match(guard,/verifyOriginalAfas890VersionReconciliation/);
 assert.match(guard,/originalAfas890Reconciliation/);
 assert.match(guard,/if\(!nativeProviderHealthVersionReconciliation\)/);
 assert.match(guard,/if\(!originalAfas890Reconciliation\)/);
 assert.match(guard,/Applied historical migrations must never be modified or deleted in an ordinary PR/);
});
