// Local Git object preparation only. No branch/ref changes, checkout or network.
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const SHA=/^[a-f0-9]{40}$/;
const hash=b=>createHash('sha256').update(b).digest('hex');
const safe=p=>typeof p==='string'&&p.length>0&&p.length<=512&&!p.startsWith('/')&&!p.includes('\\')&&!/[\x00-\x1f\x7f]/.test(p)&&p.split('/').every(x=>x&&x!=='.'&&x!=='..'&&x.toLowerCase()!=='.git');
const protectedPath=p=>p.startsWith('.github/workflows/')||p.startsWith('supabase/migrations/')||p==='supabase/migration-history.lock.json'||p.startsWith('config/brain-writer-approved-');
function git(cwd,args,{input,env={}}={}){
 const r=spawnSync('git',args,{cwd,input,encoding:null,maxBuffer:64*1024*1024,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',...env}});
 if(r.error||r.status!==0)throw Error('GIT_OBJECT_PREPARATION_FAILED:'+args[0]+':'+String(r.stderr||'').slice(0,200));
 return r.stdout;
}
function tree(cwd,sha){
 if(!SHA.test(sha))throw Error('INVALID_OBJECT_SHA');
 const entries=new Map();
 for(const row of git(cwd,['ls-tree','-rz','--full-tree',sha]).toString('utf8').split('\0').filter(Boolean)){
   const m=/^(100644|100755|120000|160000) (blob|commit) ([a-f0-9]{40})\t(.+)$/.exec(row);
   if(!m||!safe(m[4])||m[4].includes('\ufffd')||entries.has(m[4]))throw Error('UNSUPPORTED_TREE_ENTRY');
   entries.set(m[4],{mode:m[1],type:m[2],sha:m[3]});
 }
 return entries;
}
const same=(a,b)=>a===b||!!a&&!!b&&a.mode===b.mode&&a.type===b.type&&a.sha===b.sha;
const changed=(a,b)=>[...new Set([...a.keys(),...b.keys()])].filter(p=>!same(a.get(p),b.get(p))).sort();
const eqPaths=(a,b)=>a.length===b.length&&a.every((p,i)=>p===b[i]);
export function prepareReviewedUnion({cwd,manifest,manifestBytes,preflight,declaredPaths}){
 if(!preflight||typeof manifestBytes!=='string'||preflight.manifestSha256!==hash(manifestBytes)||JSON.stringify(JSON.parse(manifestBytes))!==JSON.stringify(manifest)||preflight.writeAuthorized!==false||preflight.headSha!==manifest?.expectedHead||preflight.prBaseSha!==manifest.expectedBase||preflight.obligation!==manifest.obligation||preflight.branch!==manifest.branch||!SHA.test(preflight.executionMainSha||''))throw Error('REVIEWED_PREFLIGHT_REQUIRED');
 const main=preflight.executionMainSha,head=preflight.headSha;
 if(!Array.isArray(manifest.candidatePaths)||!Array.isArray(declaredPaths)||!manifest.candidatePaths.length||manifest.candidatePaths.length>128||manifest.candidatePaths.some(p=>!safe(p)||protectedPath(p))||new Set(manifest.candidatePaths).size!==manifest.candidatePaths.length||!eqPaths([...manifest.candidatePaths].sort(),[...declaredPaths].sort()))throw Error('APPROVED_CANDIDATE_SCOPE_MISMATCH');
 const bases=git(cwd,['merge-base','--all',main,head]).toString().trim().split(/\s+/);
 if(bases.length!==1||!SHA.test(bases[0]))throw Error('AMBIGUOUS_MERGE_BASE');
 const base=tree(cwd,bases[0]),incoming=tree(cwd,main),candidate=tree(cwd,head);
 const scope=changed(base,candidate);
 if(!eqPaths(scope,[...manifest.candidatePaths].sort()))throw Error('ACTUAL_CANDIDATE_SCOPE_MISMATCH');
 const patches=new Map();
 for(const f of manifest.files??[]){
  if(!scope.includes(f.path)||patches.has(f.path)||protectedPath(f.path)||typeof f.content!=='string'||hash(f.content)!==f.contentSha256)throw Error('UNAPPROVED_UNION_PATCH');
  const old=candidate.get(f.path),current=incoming.get(f.path);
  if(old?.mode!=='100644'||current?.mode!=='100644'||old.type!=='blob'||current.type!=='blob')throw Error('UNSUPPORTED_PATCH_MODE');
  if(hash(git(cwd,['cat-file','blob',old.sha]))!==f.expectedOldSha256||hash(git(cwd,['cat-file','blob',current.sha]))!==f.expectedMainSha256)throw Error('UNION_SOURCE_DIGEST_DRIFT');
  patches.set(f.path,f);
 }
 const result=new Map(incoming);
 for(const p of scope){
  const b=base.get(p),m=incoming.get(p),h=candidate.get(p),patch=patches.get(p);
  if(patch){
   const sha=git(cwd,['hash-object','-w','--stdin'],{input:Buffer.from(patch.content,'utf8')}).toString().trim();
   result.set(p,{mode:'100644',type:'blob',sha});
  }else if(same(m,b)||same(m,h)){
   if(h)result.set(p,h);else result.delete(p);
  }else throw Error('UNREVIEWED_OVERLAP:'+p);
 }
 // Never silently overwrite paths through file/directory collisions.
 for(const p of result.keys()){const bits=p.split('/');for(let i=1;i<bits.length;i++)if(result.has(bits.slice(0,i).join('/')))throw Error('FILE_DIRECTORY_COLLISION');}
 const delta=changed(incoming,result);
 if(delta.some(p=>!scope.includes(p)))throw Error('UNION_SCOPE_EXPANSION');
 const dir=mkdtempSync(join(tmpdir(),'reviewed-union-'));
 try{
  const env={GIT_INDEX_FILE:join(dir,'index')};
  git(cwd,['read-tree',main],{env});
  const updates=delta.map(p=>{const e=result.get(p);return e?e.mode+' '+e.sha+'\t'+p+'\0':'0 '+'0'.repeat(40)+'\t'+p+'\0';}).join('');
  if(updates)git(cwd,['update-index','-z','--index-info'],{env,input:Buffer.from(updates)});
  const sha=git(cwd,['write-tree'],{env}).toString().trim();
  const actual=tree(cwd,sha);
  if(changed(actual,result).length)throw Error('UNION_TREE_READBACK_MISMATCH');
  // Two exact ordered parents are verified after object creation; no ref is moved.
  const commit=git(cwd,['commit-tree',sha,'-p',head,'-p',main,'-m','Reviewed writer union candidate (not published)']).toString().trim();
  const parents=git(cwd,['show','-s','--format=%P',commit]).toString().trim().split(' ');
  if(!eqPaths(parents,[head,main])||git(cwd,['show','-s','--format=%T',commit]).toString().trim()!==sha)throw Error('UNION_COMMIT_READBACK_MISMATCH');
  return Object.freeze({state:'PREPARED_NOT_PUBLISHED',head,main,commit,tree:sha,scope:Object.freeze(delta),manifestSha256:preflight.manifestSha256,writeAuthorized:false});
 }finally{rmSync(dir,{recursive:true,force:true});}
}
