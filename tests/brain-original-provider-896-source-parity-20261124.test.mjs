import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {verifyOriginalProvider896SourceLockReconciliation,EXACT_ORIGINAL_896_BASE,ORIGINAL_896_FILES,ORIGINAL_896_PENDING_MIRA}
 from '../tools/ci/verified-original-provider-896-source-lock-reconciliation.mjs';
const currentLock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
// Historical replay covers the exact original 896 population; the current
// production ledger has independently acquired the formerly pending Mira version.
const lock={...currentLock,applied:currentLock.applied.filter(x=>x.version<='20261124064859'&&x.version!=='20261124063700')};
test('original pending Mira source is now independently applied and retains exact immutable bytes',()=>{
 assert.equal(currentLock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(currentLock.applied.length>=897);
 assert.equal(new Set(currentLock.applied.map(x=>x.version)).size,currentLock.applied.length);
 assert.deepEqual(currentLock.applied.filter(x=>x.version==='20261124063700'),[{version:'20261124063700',name:'mira_original_exact_job_claim_v1'}]);
 const b=readFileSync(new URL('../'+ORIGINAL_896_PENDING_MIRA.file,import.meta.url));
 assert.equal(createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),'2408396c3423e7c93c1d1b58d65d921c21737482');
 assert.equal(createHash('md5').update(b).digest('hex'),'5845ceab54cf74d0d366578f1fd7cdb7');
});
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

// Execute the original scanner predicate in an isolated temporary directory.
// An identical blob at an unlisted path or a modified listed blob must fail.
test('historical social SQL recognition remains exact and fails closed on tampering',()=>{
 const scanner=new URL('../scripts/brain/check_powerhouse_supabase_security.py',import.meta.url);
 const code=`import os, sys, tempfile, pathlib, runpy
source=pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
ns={}
exec(compile(source.split('if "--self-test" in sys.argv:')[0],sys.argv[1],'exec'),ns)
files=[(pathlib.Path(x), pathlib.Path(x).read_bytes()) for x in sys.argv[2:]]
assert len(files)==3
for p,b in files:
 assert ns['historical_mirror_is_exact'](p)
 assert ns['check_sql'](b.decode(),str(p)), 'without exact historical proof normal scanner rejects'
with tempfile.TemporaryDirectory() as tmp:
 old=os.getcwd()
 try:
  os.chdir(tmp)
  for p,b in files:
   p.parent.mkdir(parents=True,exist_ok=True)
   p.write_bytes(b)
   assert ns['historical_mirror_is_exact'](p)
   p.write_bytes(b+b'-- changed byte')
   assert not ns['historical_mirror_is_exact'](p)
   assert ns['check_sql'](p.read_text(),str(p))
   other=p.with_name('20990101000000_unreviewed.sql')
   other.write_bytes(b)
   assert not ns['historical_mirror_is_exact'](other)
   assert ns['check_sql'](other.read_text(),str(other))
 finally:
  os.chdir(old)
`;
 const r=spawnSync('python3',['-c',code,scanner.pathname,...ORIGINAL_896_FILES.filter(x=>x.version!=='20261124064216').map(x=>x.file)],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr||r.error?.message);
});
