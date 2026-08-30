import { createHash } from 'node:crypto';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const SHA40=/^[a-f0-9]{40}$/i;
const MAX_BUFFER=64*1024*1024;

function git(repoDir,...args){
  return execFileSync('git',args,{cwd:repoDir,encoding:'utf8',maxBuffer:MAX_BUFFER});
}

function gitBuffer(repoDir,...args){
  return execFileSync('git',args,{cwd:repoDir,maxBuffer:MAX_BUFFER});
}

function normalizeFiles(files){
  if(!Array.isArray(files) || files.length===0) throw new Error('INVALID_CHANGED_FILES');
  const normalized=[...new Set(files.map(file=>String(file||'').trim()).filter(Boolean))].sort();
  if(normalized.length===0 || normalized.some(file=>file.startsWith('/') || file.includes('..'))) throw new Error('INVALID_CHANGED_FILES');
  return normalized;
}

async function exists(path){
  try { await access(path,fsConstants.F_OK); return true; } catch { return false; }
}

async function hashBundle(root,files){
  const hash=createHash('sha256');
  for(const file of files){
    const path=resolve(root,file);
    const present=await exists(path);
    hash.update(file); hash.update('\0'); hash.update(present?'1':'0'); hash.update('\0');
    if(present) hash.update(await readFile(path));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function scopedDiffFiles(repoDir,baseSha,candidateHeadSha,files){
  return git(repoDir,'diff','--name-only','--no-renames',baseSha,candidateHeadSha,'--',...files)
    .split(/\r?\n/).map(v=>v.trim()).filter(Boolean).sort();
}

function sameFiles(a,b){ return a.length===b.length && a.every((file,i)=>file===b[i]); }

export async function proveGitTransportParity({repoDir='.',baseSha,candidateHeadSha,changedFiles}={}){
  if(!SHA40.test(String(baseSha||''))) throw new Error('INVALID_BASE_SHA');
  if(!SHA40.test(String(candidateHeadSha||''))) throw new Error('INVALID_CANDIDATE_HEAD_SHA');
  const files=normalizeFiles(changedFiles);
  git(repoDir,'cat-file','-e',`${baseSha}^{commit}`);
  git(repoDir,'cat-file','-e',`${candidateHeadSha}^{commit}`);

  // Deliberately constrain the comparison to the writer-owned paths that were
  // already accepted by immutable operational path-policy evidence. Unrelated
  // moving-main history must not contaminate parity, while every declared path
  // must still contain a real base→candidate delta.
  const actual=scopedDiffFiles(repoDir,baseSha,candidateHeadSha,files);
  if(!sameFiles(actual,files)) throw new Error(`CHANGED_FILES_MISMATCH:${actual.join(',')}`);

  const parent=await mkdtemp(join(tmpdir(),'writer-parity-proof-'));
  const direct=join(parent,'direct');
  const candidate=join(parent,'candidate');
  const base=join(parent,'base');
  try {
    git(repoDir,'worktree','add','--detach',direct,baseSha);
    git(repoDir,'worktree','add','--detach',candidate,candidateHeadSha);
    git(repoDir,'worktree','add','--detach',base,baseSha);

    const patch=gitBuffer(repoDir,'diff','--binary','--full-index','--no-renames',baseSha,candidateHeadSha,'--',...files);
    execFileSync('git',['apply','--binary','-'],{cwd:direct,input:patch,maxBuffer:MAX_BUFFER});
    const directOutputSha256=await hashBundle(direct,files);
    const candidateOutputSha256=await hashBundle(candidate,files);
    if(directOutputSha256!==candidateOutputSha256) throw new Error('PARITY_MISMATCH');

    execFileSync('git',['apply','--binary','-R','-'],{cwd:candidate,input:patch,maxBuffer:MAX_BUFFER});
    const rollbackOutputSha256=await hashBundle(candidate,files);
    const baseOutputSha256=await hashBundle(base,files);
    if(rollbackOutputSha256!==baseOutputSha256) throw new Error('ROLLBACK_OUTPUT_MISMATCH');

    return Object.freeze({
      baseSha:String(baseSha).toLowerCase(),
      candidateHeadSha:String(candidateHeadSha).toLowerCase(),
      rollbackSha:String(baseSha).toLowerCase(),
      directOutputSha256,candidateOutputSha256,rollbackOutputSha256,baseOutputSha256,
      changedFiles:Object.freeze([...files])
    });
  } finally {
    for(const worktree of [direct,candidate,base]){
      try { git(repoDir,'worktree','remove','--force',worktree); } catch {}
    }
    await rm(parent,{recursive:true,force:true});
  }
}
