import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyOriginalProvider896SourceLockReconciliation,EXACT_ORIGINAL_896_BASE,ORIGINAL_896_FILES,ORIGINAL_896_PENDING_MIRA}
 from '../tools/ci/verified-original-provider-896-source-lock-reconciliation.mjs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const expected=[["20261124063737","original_social_loop_comparable_provider_windows","7539984b8e8929700e219842dba30d563c2e071f"],["20261124063938","original_social_analyst_variant_rotation_and_proof","36949527558ad6c0e0a85bd98b0ea7c43ece1fb5"],["20261124064216","original_personal_artifact_evidence_lossless_normalization","5c7f013f9cc253fd4837a7cf03222c6122d35c44"],["20261124064859","original_personal_observational_analyst","bdc24987007d4726b89557930064292139899851"]];
test('original production history is exactly 896 and prior 892 remain immutable',()=>{
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(lock.applied.length,896);
 assert.equal(lock.applied[891].version,'20261123214500');
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,896);
 for(let i=0;i<expected.length;i++){
  const [version,name,sha]=expected[i];
  assert.deepEqual(lock.applied[892+i],{version,name});
  const b=readFileSync(new URL('../supabase/migrations/'+version+'_'+name+'.sql',import.meta.url));
  assert.equal(createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),sha);
 }
});

test('only the exact provider-attested 892→896 original one-time historical recovery passes',()=>{
 const baseLock={...lock,applied:lock.applied.slice(0,892),captured_at:'2026-11-24T06:48:08.124Z'};
 const sourceSQL=Object.fromEntries(ORIGINAL_896_FILES.map(x=>[
  x.file,readFileSync(new URL('../'+x.file,import.meta.url),'utf8')
 ]));
 const changedMigrations=ORIGINAL_896_FILES.map(x=>({status:'A',file:x.file}));
 const pendingSQL=readFileSync(new URL('../'+ORIGINAL_896_PENDING_MIRA.file,import.meta.url),'utf8');
 const args={baseSha:EXACT_ORIGINAL_896_BASE,baseLock,headLock:lock,sourceSQL,changedMigrations,pendingBaseSQL:pendingSQL,pendingHeadSQL:pendingSQL};
 const good=verifyOriginalProvider896SourceLockReconciliation(args);
 assert.equal(good.ok,true,JSON.stringify(good));
 assert.equal(good.hosted_preview_required,true);
 assert.equal(good.no_sql_replay_authorized,true);
 assert.equal(good.provider_history_attested_by_candidate,false);
 assert.equal(good.pending_protected_source,ORIGINAL_896_PENDING_MIRA.file);
 assert.equal(good.pending_protected_source_applied,false);
 assert.equal(lock.applied.some(x=>x.version===ORIGINAL_896_PENDING_MIRA.version),false);
 assert.equal(verifyOriginalProvider896SourceLockReconciliation({...args,pendingHeadSQL:pendingSQL+'-- modified'}).ok,false);
 assert.equal(verifyOriginalProvider896SourceLockReconciliation({...args,pendingBaseSQL:pendingSQL+'-- modified',pendingHeadSQL:pendingSQL+'-- modified'}).ok,false);
 assert.equal(verifyOriginalProvider896SourceLockReconciliation({...args,pendingHeadSQL:null}).ok,false);
 assert.equal(verifyOriginalProvider896SourceLockReconciliation({...args,headLock:{...lock,applied:[...lock.applied,{version:ORIGINAL_896_PENDING_MIRA.version,name:ORIGINAL_896_PENDING_MIRA.name}]}}).ok,false);
 assert.equal(verifyOriginalProvider896SourceLockReconciliation({...args,baseSha:'0'.repeat(40)}).ok,false);
 assert.equal(verifyOriginalProvider896SourceLockReconciliation({...args,changedMigrations:[...changedMigrations,{status:'A',file:'supabase/migrations/20261124999999_unproven.sql'}]}).ok,false);
 assert.equal(verifyOriginalProvider896SourceLockReconciliation({...args,headLock:{...lock,applied:[...lock.applied.slice(0,895),{version:'20261124064859',name:'not_the_native_name'}]}}).ok,false);
 assert.equal(verifyOriginalProvider896SourceLockReconciliation({...args,headLock:{...lock,project_ref:'wrong-project'}}).ok,false);
 assert.equal(verifyOriginalProvider896SourceLockReconciliation({...args,sourceSQL:{...sourceSQL,[ORIGINAL_896_FILES[0].file]:sourceSQL[ORIGINAL_896_FILES[0].file]+'-- unsafe edit'}}).ok,false);
});
