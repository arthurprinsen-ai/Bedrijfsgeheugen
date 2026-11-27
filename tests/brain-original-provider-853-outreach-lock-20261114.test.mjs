import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));

test('first original provider 851 remain immutable and exact two native original outreach versions appended',()=>{
 const applied=lock.applied;
 assert.ok(applied.length>=853);
 assert.equal(applied[851].version,'20261114080027');
 assert.equal(applied[851].name,'original_approved_connection_source_priming_v1');
 assert.equal(applied[852].version,'20261114083500');
 assert.equal(applied[852].name,'original_approved_connection_source_priming_v1');
 assert.equal(new Set(applied.map(x=>x.version)).size,applied.length);
});
test('native source lock retains real provider source identity without speculative future migration',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(Number.isFinite(Date.parse(lock.captured_at)),true);
 assert.ok(!lock.applied.some(x=>x.version==='20261114090000'));
});

import {verifyAlreadyApplied853OutreachMirror,SOURCE_853_BASE,SOURCE_853_MIRROR} from '../tools/ci/verified-provider-853-original-outreach-source-mirror.mjs';
const restoredSQL=readFileSync(new URL('../supabase/migrations/20261114080027_original_approved_connection_source_priming_v1.sql',import.meta.url),'utf8');
const originalSQL=readFileSync(new URL('../supabase/migrations/20261114083500_original_approved_connection_source_priming_v1.sql',import.meta.url),'utf8');
// The one-time source mirror attested historical provider versions 1..853.
 // Never feed the newer 854..857 live lock as if it were that historical
 // exact-head candidate. Select the immutable historical prefix in-memory;
 // do NOT edit or roll back the real provider lock or the migration SQL.
const baseLock={...lock,applied:lock.applied.slice(0,851),captured_at:'2026-11-13T18:20:40.710020Z'};
const historical853HeadLock={...lock,applied:lock.applied.slice(0,853)};
const attestation={baseSha:SOURCE_853_BASE,baseLock,headLock:historical853HeadLock,
  proposed:[SOURCE_853_MIRROR],originalBaseSQL:originalSQL,restoredSQL};
test('one-time 853 native mirror attestation is exact and only allows already applied immutable source',()=>{
 const yes=verifyAlreadyApplied853OutreachMirror(attestation);
 assert.equal(yes.ok,true,yes.reason||'native source mirror must match');
 assert.equal(yes.hostedPreviewRequired,true);
 assert.equal(yes.providerHistoryAttestedByCandidate,false);
 assert.equal(yes.externalSendAuthorized,false);
});
test('853 recovery rejects wrong protected base, unapproved migration and SQL change',()=>{
 assert.equal(verifyAlreadyApplied853OutreachMirror({...attestation,baseSha:'0'.repeat(40)}).ok,false);
 assert.equal(verifyAlreadyApplied853OutreachMirror({...attestation,proposed:['supabase/migrations/20991231000000_fake.sql']}).ok,false);
 assert.equal(verifyAlreadyApplied853OutreachMirror({...attestation,restoredSQL:restoredSQL+'--modified'}).ok,false);
 assert.equal(verifyAlreadyApplied853OutreachMirror({...attestation,headLock:{...lock,applied:[...lock.applied, {version:'20991231000000',name:'fake'}]}}).ok,false);
});
test('853 source restoration does not broaden ordinary migration admission',()=>{
 const admission=readFileSync(new URL('../tools/ci/protected-supabase-pr-migration-tests.mjs',import.meta.url),'utf8');
 assert.match(admission,/originalOutreach853Reconciliation/);
 assert.match(admission,/base===SOURCE_853_BASE&&changedMigrations\.length===1/);
 assert.match(admission,/changedMigrations\[0\]\.status==='A'/);
 assert.match(admission,/if\(!nativeProviderHealthVersionReconciliation\)/);
 assert.match(admission,/if\(!originalOutreach853Reconciliation\)/);
});

test('853 historical attestation remains exact after later native provider appends',()=>{
 const prefix=lock.applied.slice(0,853);
 assert.equal(prefix.length,853);
 assert.equal(prefix[851].version,'20261114080027');
 assert.equal(prefix[852].version,'20261114083500');
 assert.ok(lock.applied.length>=853);
 assert.equal(verifyAlreadyApplied853OutreachMirror(attestation).ok,true);
 const future=[...lock.applied,{version:'20991231000000',name:'future_provider_append'}];
 assert.deepEqual(future.slice(0,853),prefix);
 // Original strict one-time verifier must continue refusing the FULL
 // future snapshot: it does not authorize arbitrary new provider versions.
 assert.equal(verifyAlreadyApplied853OutreachMirror({...attestation,
    headLock:{...lock,applied:future}}).ok,false);
 const changed=[...prefix];
 changed[852]={...changed[852],name:'UNAUTHORIZED_REWRITE'};
 const corrupted=verifyAlreadyApplied853OutreachMirror({...attestation,
    headLock:{...historical853HeadLock,applied:changed}});
 assert.equal(corrupted.ok,false);
 assert.equal(corrupted.reason,'PREEXISTING_HISTORY_DRIFT_OR_UNATTESTED_ADDITION');
});
