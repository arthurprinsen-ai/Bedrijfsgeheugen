// Source admission only. Hosted Supabase Preview remains the independent replay authority.
// Never mark a proposed migration applied in the immutable production provider lock.
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,renameSync,mkdtempSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

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

if (/^[a-f0-9]{40}$/.test(base)) {
  // Fail closed when the immutable review base is unavailable; checkout must fetch full history.
  git('cat-file','-e',base+'^{commit}');
  const changes=git('diff','--name-status','--no-renames',base,'HEAD').split('\n').filter(Boolean)
    .map(line=>{const [status,...rest]=line.split('\t');return {status,file:rest.join('\t')};});
  const changedMigrations=changes.filter(x=>x.file.startsWith('supabase/migrations/'));
  assert.deepEqual(changedMigrations.filter(x=>x.status!=='A'),[], 'Applied historical migrations must never be modified or deleted in an ordinary PR');
  proposed=changedMigrations.map(x=>x.file);
  if (proposed.length) {
    assert.ok(event==='pull_request' || event==='merge_group' || (event==='workflow_dispatch' && /^\d+$/.test(pr)),
      'Only an identified protected PR/merge-group may propose new migrations');
    assert.ok(proposed.length<=20,'Bound proposed migration count for review');
    const baseLock=git('show',base+':supabase/migration-history.lock.json');
    const headLock=readFileSync(lockPath,'utf8').trim();
    assert.equal(headLock,baseLock,'PR candidates must not predeclare unapplied migrations as production-applied');
    const lock=JSON.parse(headLock);
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
      assert.ok(version>last,'Proposed migration version must follow last provider-applied version: '+version);
      assert.ok(!applied.has(version),'Cannot replay an already applied production version: '+version);
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
  for (const file of proposed) {
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
console.log(JSON.stringify({
  contract:'supabase-protected-pr-migration-admission-v1',
  result:proposed.length?'PROPOSED_SOURCE_ONLY_PREVIEW_REQUIRED':'EXACT_PROVIDER_BASELINE_PARITY',
  base_sha:base||null,proposed_migrations:proposed,
  provider_applied_claim:false,hosted_preview_pass_claim:false
}));
