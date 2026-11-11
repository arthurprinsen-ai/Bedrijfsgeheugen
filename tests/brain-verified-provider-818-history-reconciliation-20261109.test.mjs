import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {verifyAlreadyApplied818HistoryReconciliation as check} from '../tools/ci/verified-provider-history-reconciliation.mjs';

const original=readFileSync(new URL('../supabase/migrations/20261109152200_original_social_provider_refresh_learning_v1.sql',import.meta.url),'utf8');
const mirror=readFileSync(new URL('../supabase/migrations/20261109152945_original_social_provider_refresh_learning_v1.sql',import.meta.url),'utf8');
const currentLock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
// The one-time 818-reconciliation guard tests the exact historic Nov 9
// snapshot. Subsequent independently applied provider migrations must not
// mutate or disable that historical negative-security regression.
const headLock={...currentLock,applied:currentLock.applied.filter(x=>x.version<='20261109152945')};
const baseLock={...headLock,applied:headLock.applied.slice(0,-2),captured_at:'2026-11-06T15:30:00.000Z'};
const input={
 baseSha:'3e55c792504ddbaf0916244213c58b9e827f120e',
 baseLock,headLock,
 proposed:['supabase/migrations/20261109152945_original_social_provider_refresh_learning_v1.sql'],
 originalBaseSQL:original,restoredSQL:mirror
};
const copy=o=>JSON.parse(JSON.stringify(o));

test('only 818 exact already-applied provider versions, source SQL and lock are admitted as a one-time restoration',()=>{
 const result=check(input);
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.state,'EXACT_818_ALREADY_APPLIED_SOURCE_RECONCILIATION');
 assert.equal(result.hostedPreviewRequired,true);
 assert.equal(result.providerHistoryAttestedByCandidate,false);
 assert.equal(headLock.applied.length,818);
 const sources=readdirSync(new URL('../supabase/migrations/',import.meta.url)).filter(x=>/^\d{14}_.*\.sql$/.test(x)).sort();
 assert.equal(sources.length,currentLock.applied.length,'the CURRENT full provider lock must keep its exact source SQL');
 assert.deepEqual(sources,currentLock.applied.map(x=>x.version+'_'+x.name+'.sql').sort());
 assert.deepEqual(currentLock.applied.slice(0,818),headLock.applied,'later supplier migrations cannot rewrite historical 818 snapshot');
 assert.deepEqual(headLock.applied.slice(-2),[
   {version:'20261109152200',name:'original_social_provider_refresh_learning_v1'},
   {version:'20261109152945',name:'original_social_provider_refresh_learning_v1'}
 ]);
 assert.equal(original,mirror);
});
test('fail closed for any other change, unrelated migration, shifted base or unverified SQL',()=>{
 for(const altered of [
   {baseSha:'0000000000000000000000000000000000000000'},
   {proposed:['supabase/migrations/20261109152945_fake.sql']},
   {proposed:[...input.proposed,'supabase/migrations/20261109160000_x.sql']},
   {restoredSQL:mirror+'\n-- sneaky extra SQL'},
   {restoredSQL:'create table public.unsafe(id integer);'},
   {originalBaseSQL:original+'\n-- base tampered'}
 ]){
  const outcome=check({...input,...altered});
  assert.equal(outcome.ok,false,JSON.stringify(altered));
 }
});
test('fail closed for falsified historic 816, provider metadata, reordered identities or fabricated third migration',()=>{
 const corruptions=[
   lock=>{lock.applied.pop();},
   lock=>{lock.applied[0].name='fabricated';},
   lock=>{lock.applied.at(-1).version='20261109152946';},
   lock=>{lock.project_ref='other-project';},
   lock=>{lock.source='unknown';},
   lock=>{lock.applied.reverse();},
   lock=>{lock.applied.push({version:'20261109153000',name:'fake'});},
   lock=>{lock.captured_at='2020-01-01T00:00:00Z';}
 ];
 for(const mutate of corruptions){
   const lock=copy(headLock);mutate(lock);
   assert.equal(check({...input,headLock:lock}).ok,false);
 }
 const base=copy(baseLock);base.applied[300].name='untrusted';
 assert.equal(check({...input,baseLock:base}).ok,false);
});
test('normal PR migration admission tests remain present, unchanged, and no bypass of hosted preview',()=>{
 const runner=readFileSync(new URL('../tools/ci/protected-supabase-pr-migration-tests.mjs',import.meta.url),'utf8');
 const normal=readFileSync(new URL('../tests/brain-protected-supabase-pr-migration-tests.test.mjs',import.meta.url),'utf8');
 assert.match(runner,/assert\.equal\(headLock,baseLock/);
 assert.match(runner,/if \(!alreadyAppliedHistoryReconciliation\)/);
 assert.match(runner,/hosted_preview_pass_claim:false/);
 assert.match(normal,/comment-only shim and tampering with already-applied SQL remain fail-closed/);
 assert.match(runner,/verifyAlreadyApplied818HistoryReconciliation/);
});
