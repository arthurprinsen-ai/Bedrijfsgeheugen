// Source admission only. Hosted Supabase Preview remains the independent replay authority.
// Never mark a proposed migration applied in the immutable production provider lock.
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,renameSync,mkdtempSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {verifyAlreadyApplied818HistoryReconciliation} from './verified-provider-history-reconciliation.mjs';
import {verifyNativeProviderHealthVersionReconciliation, EXACT_BASE_SHA, PROPOSAL, NATIVE} from './verified-provider-health-native-version-reconciliation.mjs';
import {verifyAlreadyApplied853OutreachMirror,SOURCE_853_BASE,SOURCE_853_ORIGINAL,SOURCE_853_MIRROR} from './verified-provider-853-original-outreach-source-mirror.mjs';
import {verifyAlreadyAppliedProvider888SourceLockRecovery,EXACT_PROVIDER_888_BASE,ORIGINAL_SECURITY_SQL_PATH,ORIGINAL_FOUNDER_SQL_PATH} from './verified-provider-888-personal-security-history-reconciliation.mjs';
import {verifyOriginalAfas890VersionReconciliation,EXACT_AFAS_BASE_SHA,AFAS_SOURCE_PROPOSAL,AFAS_NATIVE_SOURCE} from './verified-original-afas-890-version-reconciliation.mjs';
import {verifyOriginalProvider896SourceLockReconciliation,EXACT_ORIGINAL_896_BASE,ORIGINAL_896_FILES,ORIGINAL_896_PENDING_MIRA} from './verified-original-provider-896-source-lock-reconciliation.mjs';

const TESTS=process.argv.slice(2);
assert.ok(TESTS.length>=5 && TESTS.every(p=>/^tests\/[a-z0-9._/-]+\.test\.mjs$/.test(p)), 'Pass the existing migration-lock test suite explicitly');
const root=process.cwd();
const migrations=path.join(root,'supabase/migrations');
const lockPath=path.join(root,'supabase/migration-history.lock.json');
const base=process.env.CANDIDATE_BASE_SHA || '';
const event=process.env.CANDIDATE_EVENT_NAME || '';
const pr=process.env.CANDIDATE_PR_NUMBER || '';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:5e6}).trim();
let proposed=[];
let alreadyAppliedHistoryReconciliation=null;
let nativeProviderHealthVersionReconciliation=null;
let originalOutreach853Reconciliation=null;
let originalProvider888Reconciliation=null;
let originalAfas890Reconciliation=null;
let originalProvider896Reconciliation=null;

if (/^[a-f0-9]{40}$/.test(base)) {
  // Fail closed when the immutable review base is unavailable; checkout must fetch full history.
  git('cat-file','-e',base+'^{commit}');
  const changes=git('diff','--name-status','--no-renames',base,'HEAD').split('\n').filter(Boolean)
    .map(line=>{const [status,...rest]=line.split('\t');return {status,file:rest.join('\t')};});
  const changedMigrations=changes.filter(x=>x.file.startsWith('supabase/migrations/'));
  // Exactly one provider-attested change-of-version ONLY after PR #5586 was
  // protected merged and its original SQL actually applied at a new native
  // version. Ordinary historical migrations are still immutable.
  if(base===EXACT_BASE_SHA && changedMigrations.length===2){
    const originalSQL=spawnSync('git',['show',base+':'+PROPOSAL],{cwd:root,encoding:'utf8',maxBuffer:5e6});
    const nativeSQL=spawnSync('git',['show','HEAD:'+NATIVE],{cwd:root,encoding:'utf8',maxBuffer:5e6});
    const baseLockJSON=spawnSync('git',['show',base+':supabase/migration-history.lock.json'],{cwd:root,encoding:'utf8',maxBuffer:5e6});
    if(originalSQL.status===0 && nativeSQL.status===0 && baseLockJSON.status===0){
      const proof=verifyNativeProviderHealthVersionReconciliation({
        baseSha:base,changedMigrations,
        baseLock:JSON.parse(baseLockJSON.stdout),
        headLock:JSON.parse(readFileSync(lockPath,'utf8')),
        baseSQL:originalSQL.stdout,nativeSQL:nativeSQL.stdout
      });
      if(proof.ok)nativeProviderHealthVersionReconciliation=proof;
    }
  }
  // Exact native provider 853 recovery: the real extra 20261114080027 SQL was
  // independently proven byte-identical to protected canonical 20261114083500,
  // including native schema_migrations.statements MD5. Restore the missing
  // EXECUTABLE historical source together with exact 852/853 immutable lock.
  // No general lock-edit exception; all checks use one pinned original base.
  if(base===SOURCE_853_BASE&&changedMigrations.length===1
    &&changedMigrations[0].status==='A'
    &&changedMigrations[0].file===SOURCE_853_MIRROR){
    const original=spawnSync('git',['show',base+':'+SOURCE_853_ORIGINAL],
      {cwd:root,encoding:'utf8',maxBuffer:5e6});
    const restored=spawnSync('git',['show','HEAD:'+SOURCE_853_MIRROR],
      {cwd:root,encoding:'utf8',maxBuffer:5e6});
    const baseLock=spawnSync('git',['show',base+':supabase/migration-history.lock.json'],
      {cwd:root,encoding:'utf8',maxBuffer:5e6});
    if(original.status===0&&restored.status===0&&baseLock.status===0){
      const proof=verifyAlreadyApplied853OutreachMirror({
        baseSha:base,baseLock:JSON.parse(baseLock.stdout),
        headLock:JSON.parse(readFileSync(lockPath,'utf8')),
        proposed:[SOURCE_853_MIRROR],
        originalBaseSQL:original.stdout,restoredSQL:restored.stdout
      });
      if(proof.ok)originalOutreach853Reconciliation=proof;
    }
  }
  // ONE strictly pinned historical recovery for original-provider-applied
  // version 887, recorded in provider alongside protected-main version 888.
  // Production has 888 real versions; protected Git base has 886.
  // No generic source-lock edits or unproven migration replay permitted.
  // The external provider preview is still mandatory after this proof.
  if(base===EXACT_PROVIDER_888_BASE && changedMigrations.length===1
    && changedMigrations[0].status==='A'
    && changedMigrations[0].file===ORIGINAL_SECURITY_SQL_PATH){
    const protectedOriginal=spawnSync('git',['show',base+':'+ORIGINAL_FOUNDER_SQL_PATH],
      {cwd:root,encoding:'utf8',maxBuffer:5e6});
    const baseLock=spawnSync('git',['show',base+':supabase/migration-history.lock.json'],
      {cwd:root,encoding:'utf8',maxBuffer:5e6});
    if(protectedOriginal.status===0 && baseLock.status===0){
      const proof=verifyAlreadyAppliedProvider888SourceLockRecovery({
        baseSha:base,
        baseLock:JSON.parse(baseLock.stdout),
        headLock:JSON.parse(readFileSync(lockPath,'utf8')),
        changedMigrations,
        securitySQL:readFileSync(path.join(root,ORIGINAL_SECURITY_SQL_PATH),'utf8'),
        founderSQL:protectedOriginal.stdout
      });
      if(proof.ok) originalProvider888Reconciliation=proof;
    }
  }
  // Exactly one provider-verifiable AFAS version correction on the immutable
  // protected original main that had already applied SQL under native 62147.
  // SHA256, MD5, byte length, source path, original 889 history and 890th
  // native provider identity must ALL be exact. Never enable generic renames.
  if(base===EXACT_AFAS_BASE_SHA&&changedMigrations.length===2){
    const source=spawnSync('git',['show',base+':'+AFAS_SOURCE_PROPOSAL],
      {cwd:root,encoding:'utf8',maxBuffer:5e6});
    const native=spawnSync('git',['show','HEAD:'+AFAS_NATIVE_SOURCE],
      {cwd:root,encoding:'utf8',maxBuffer:5e6});
    const sourceLock=spawnSync('git',['show',base+':supabase/migration-history.lock.json'],
      {cwd:root,encoding:'utf8',maxBuffer:5e6});
    if(source.status===0&&native.status===0&&sourceLock.status===0){
      const proof=verifyOriginalAfas890VersionReconciliation({
        baseSha:base,changedMigrations,
        baseLock:JSON.parse(sourceLock.stdout),
        headLock:JSON.parse(readFileSync(lockPath,'utf8')),
        baseSQL:source.stdout,nativeSQL:native.stdout
      });
      if(proof.ok)originalAfas890Reconciliation=proof;
    }
  }
  // One strictly pinned original native provider 896 reconciliation:
  // the four already-applied 24Nov SQL versions and their original Git blobs
  // are independently attested (exact source .slice(0,-2) provider MD5).
  // This never permits a generic lock change or an unapplied SQL candidate.
  if(base===EXACT_ORIGINAL_896_BASE && changedMigrations.length===4){
    const baseLockJSON=spawnSync('git',['show',base+':supabase/migration-history.lock.json'],
      {cwd:root,encoding:'utf8',maxBuffer:5e6});
    if(baseLockJSON.status===0){
      const sourceSQL=Object.fromEntries(ORIGINAL_896_FILES.map(x=>[
        x.file,readFileSync(path.join(root,x.file),'utf8')
      ]));
      const pendingBase=spawnSync('git',['show',base+':'+ORIGINAL_896_PENDING_MIRA.file],
        {cwd:root,encoding:'utf8',maxBuffer:5e6});
      const proof=verifyOriginalProvider896SourceLockReconciliation({
        baseSha:base,baseLock:JSON.parse(baseLockJSON.stdout),
        headLock:JSON.parse(readFileSync(lockPath,'utf8')),
        changedMigrations,sourceSQL,
        pendingBaseSQL:pendingBase.status===0?pendingBase.stdout:null,
        pendingHeadSQL:readFileSync(path.join(root,ORIGINAL_896_PENDING_MIRA.file),'utf8')
      });
      if(proof.ok)originalProvider896Reconciliation=proof;
    }
  }
  if(!nativeProviderHealthVersionReconciliation){
    if(!originalAfas890Reconciliation)
      if(!originalOutreach853Reconciliation)
        if(!originalProvider888Reconciliation)
          assert.deepEqual(changedMigrations.filter(x=>x.status!=='A'),[], 'Applied historical migrations must never be modified or deleted in an ordinary PR');
  }
  proposed=(nativeProviderHealthVersionReconciliation||originalOutreach853Reconciliation||originalProvider888Reconciliation||originalAfas890Reconciliation||originalProvider896Reconciliation)
    ?[]:changedMigrations.map(x=>x.file);
  if (proposed.length) {
    assert.ok(event==='pull_request' || event==='merge_group' || (event==='workflow_dispatch' && /^\d+$/.test(pr)),
      'Only an identified protected PR/merge-group may propose new migrations');
    assert.ok(proposed.length<=20,'Bound proposed migration count for review');
    const baseLock=git('show',base+':supabase/migration-history.lock.json');
    const headLock=readFileSync(lockPath,'utf8').trim();
    // A single already-provider-applied recovery is attested to the exact
    // protected original SQL on an immutable historical base. Unlike ordinary
    // candidates, it restores the remote history's *existing* second version.
    // Hosted Supabase Preview remains mandatory to verify provider truth.
    const originalBlob=spawnSync('git',['show',base+':supabase/migrations/20261109152200_original_social_provider_refresh_learning_v1.sql'],{cwd:root,encoding:'utf8',maxBuffer:5e6});
    // Ordinary PR regression fixtures intentionally contain no incident-era
    // protected source. Treat its absence as "not this one-time recovery";
    // preserve the original normal migration admission path and its tests.
    const originalBaseSQL=originalBlob.status===0?originalBlob.stdout:'';
    const restoredFile='supabase/migrations/20261109152945_original_social_provider_refresh_learning_v1.sql';
    const restoredSQL=proposed.includes(restoredFile)?readFileSync(path.join(root,restoredFile),'utf8'):'';
    const reconciliation=verifyAlreadyApplied818HistoryReconciliation({
      baseSha:base,baseLock:JSON.parse(baseLock),headLock:JSON.parse(headLock),
      proposed,originalBaseSQL,restoredSQL
    });
    if (reconciliation.ok)alreadyAppliedHistoryReconciliation=reconciliation;
    else assert.equal(headLock,baseLock,
      'PR candidates must not predeclare unapplied migrations as production-applied: '+reconciliation.reason);
    const lock=JSON.parse(baseLock);
    assert.equal(lock.source,'supabase_migration_history');
    const applied=new Map(lock.applied.map(row=>[row.version,row.name]));
    const last=lock.applied.at(-1)?.version || '';
    const current=readdirSync(migrations).filter(n=>n.endsWith('.sql'));
    const used=new Set();
    for (const filename of proposed) {
      const basename=path.basename(filename);
      const match=/^(\d{14})_([a-z0-9_]+)\.sql$/.exec(basename);
      assert.ok(match,'Canonical migration filename required: '+basename);
      const [,version,name]=match;
      if (!alreadyAppliedHistoryReconciliation){
        assert.ok(version>last,'Proposed migration version must follow last provider-applied version: '+version);
        assert.ok(!applied.has(version),'Cannot replay an already applied production version: '+version);
      }
      assert.ok(!used.has(version),'Duplicate proposed migration version: '+version);
      used.add(version);
      assert.equal(current.filter(n=>n.startsWith(version+'_')).length,1,'One exact filename per version');
      const sql=readFileSync(path.join(migrations,basename),'utf8');
      // Reject empty and comment-only shims; this is not a SQL correctness/replay test.
      const executable=sql.replace(/\/\*[\s\S]*?\*\//g,'').replace(/--[^\n]*/g,'').trim();
      assert.ok(executable.length>=10 && executable.includes(';'),'No placeholder/comment-only migrations: '+basename);
    }
  }
} else {
  // Non-PR runs have no candidate exception, preserving exact immutable parity.
  assert.ok(!base,'Malformed immutable base SHA');
}

const temp=mkdtempSync(path.join(tmpdir(),'supabase-candidate-review-'));
const moved=[];
try {
  // Apply historical-provider tests to their intended population. Proposed files are
  // separately inspected above and then restored, never deleted or disguised in Git.
  const historicalTestPending=originalProvider896Reconciliation
    ?[originalProvider896Reconciliation.pending_protected_source]:[];
  for (const file of [...(alreadyAppliedHistoryReconciliation?[]:proposed),...historicalTestPending]) {
    const origin=path.join(root,file);
    const destination=path.join(temp,path.basename(file));
    renameSync(origin,destination);
    moved.push({origin,destination});
  }
  const result=spawnSync(process.execPath,['--test',...TESTS],{cwd:root,stdio:'inherit',env:process.env});
  assert.equal(result.status,0,'Existing provider-applied migration regression suite failed');
} finally {
  for (const {origin,destination} of moved.reverse()) renameSync(destination,origin);
  rmSync(temp,{recursive:true,force:true});
}
for (const filename of proposed) assert.ok(readFileSync(path.join(root,filename),'utf8').trim(),'Proposed SQL lost after test: '+filename);
if(originalProvider896Reconciliation){
 const restored=readFileSync(path.join(root,ORIGINAL_896_PENDING_MIRA.file),'utf8');
 const original=spawnSync('git',['show',base+':'+ORIGINAL_896_PENDING_MIRA.file],{cwd:root,encoding:'utf8',maxBuffer:5e6});
 assert.ok(original.status===0 && restored===original.stdout,'Exact pending Mira source must be restored for native preview');
}
console.log(JSON.stringify({
  contract:'supabase-protected-pr-migration-admission-v1',
  result:originalProvider896Reconciliation?'EXACT_ORIGINAL_NATIVE_896_SOURCE_LOCK_RECONCILIATION_PREVIEW_REQUIRED':
    originalAfas890Reconciliation?'EXACT_890_ORIGINAL_AFAS_PROVIDER_APPLIED_SOURCE_RECONCILIATION_PREVIEW_REQUIRED':
    originalProvider888Reconciliation?'EXACT_PROVIDER_APPLIED_888_SOURCE_LOCK_RECOVERY_PREVIEW_REQUIRED':
    nativeProviderHealthVersionReconciliation?'EXACT_PROVIDER_APPLIED_824_NATIVE_VERSION_SOURCE_PARITY_PREVIEW_REQUIRED':
    alreadyAppliedHistoryReconciliation?'EXACT_PROVIDER_APPLIED_818_RECONCILIATION_PREVIEW_REQUIRED':
    proposed.length?'PROPOSED_SOURCE_ONLY_PREVIEW_REQUIRED':'EXACT_PROVIDER_BASELINE_PARITY',
  original_896_source_lock_reconciliation:originalProvider896Reconciliation?.state||null,
  original_888_source_lock_reconciliation:originalProvider888Reconciliation?.state||null,
  original_afas_890_source_version_reconciliation:originalAfas890Reconciliation?.state||null,
  native_provider_version_reconciliation:nativeProviderHealthVersionReconciliation?.state||null,
  already_applied_reconciliation:alreadyAppliedHistoryReconciliation?.state||null,
  pending_protected_source:originalProvider896Reconciliation?.pending_protected_source||null,
  pending_protected_source_applied:false,
  base_sha:base||null,proposed_migrations:proposed,
  provider_applied_claim:false,hosted_preview_pass_claim:false
}));
