import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 verifyNativeProviderHealthVersionReconciliation, EXACT_BASE_SHA, PROPOSAL, NATIVE
} from '../tools/ci/verified-provider-health-native-version-reconciliation.mjs';

const headLock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const candidateSQL=readFileSync(new URL('../'+NATIVE,import.meta.url),'utf8');
const baseLock={
 ...headLock,
 captured_at:'2026-11-10T13:17:39.187581Z',
 applied:headLock.applied.slice(0,-1)
};
const diff=[{status:'D',file:PROPOSAL},{status:'A',file:NATIVE}];
const args=()=>({
 baseSha:EXACT_BASE_SHA,changedMigrations:diff,
 baseLock,headLock,baseSQL:candidateSQL,nativeSQL:candidateSQL
});
const verify=patch=>verifyNativeProviderHealthVersionReconciliation({...args(),...patch});

test('only original protected native-version rename and provider-proven 824 lock is accepted',()=>{
 const x=verify();
 assert.equal(x.ok,true,JSON.stringify(x));
 assert.equal(x.replayAppliedSql,false);
 assert.equal(x.hostedPreviewRequired,true);
 assert.equal(x.providerHistoryAttestedByCandidate,false);
 assert.equal(x.authoritativeProviderVersion,'20261110160055');
});

test('all other PR bases and changed migration paths remain blocked',()=>{
 assert.equal(verify({baseSha:'a'.repeat(40)}).ok,false);
 assert.equal(verify({changedMigrations:[diff[1]]}).ok,false);
 assert.equal(verify({changedMigrations:[...diff,{status:'D',file:'supabase/migrations/20261110134500_original_source_wait_is_not_send_v1.sql'}]}).ok,false);
 assert.equal(verify({changedMigrations:[{status:'M',file:PROPOSAL},diff[1]]}).ok,false);
});

test('previous 823 provider-applied rows must never be removed, modified or reordered',()=>{
 assert.equal(verify({headLock:{...headLock,applied:headLock.applied.slice(1)}}).ok,false);
 const mutated=structuredClone(headLock);
 mutated.applied[100].name='forged_provider_action';
 assert.equal(verify({headLock:mutated}).ok,false);
 const stale=structuredClone(headLock);
 stale.applied.at(-1).version='20261110153331';
 assert.equal(verify({headLock:stale}).ok,false);
 assert.equal(verify({baseLock:{...baseLock,applied:baseLock.applied.slice(0,-1)}}).ok,false);
});

test('SQL bytes and independent provider digest must match exact original base',()=>{
 assert.equal(verify({nativeSQL:candidateSQL+'-- harmless but unverified'}).ok,false);
 assert.equal(verify({baseSQL:candidateSQL+'-- altered baseline'}).ok,false);
 assert.equal(verify({nativeSQL:candidateSQL.replace('security_invoker = true','security_invoker = false')}).ok,false);
});

test('provider project, capture monotonicity and metadata are not bypassed',()=>{
 assert.equal(verify({headLock:{...headLock,project_ref:'malicious-provider'}}).ok,false);
 assert.equal(verify({headLock:{...headLock,source:'fake_api'}}).ok,false);
 assert.equal(verify({headLock:{...headLock,captured_at:'2026-11-09T13:17:39Z'}}).ok,false);
 assert.equal(verify({headLock:{...headLock,extra_metadata:'not_source_backed'}}).ok,false);
});
