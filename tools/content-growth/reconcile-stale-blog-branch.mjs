#!/usr/bin/env node
/** One bounded CAS retry inside EXISTING Powerhouse hourly blog owner; never merges/publishes. */
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const BRANCH_RE=/^automation\/powerhouse-blog-(\d{4}-\d{2}-\d{2})$/;
const MS_DAY=86400000;
export function eligibleStaleBlogPrs(pulls,today,repository,maxAgeDays=14){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(today))||!Number.isFinite(Date.parse(today+'T12:00:00Z')))throw Error('BLOG_RECOVERY_INVALID_BUSINESS_DATE');
 if(!/^[\w.-]+\/[\w.-]+$/.test(String(repository||'')))throw Error('BLOG_RECOVERY_INVALID_REPOSITORY');
 const todayMs=Date.parse(today+'T12:00:00Z');
 return (Array.isArray(pulls)?pulls:[]).filter(pr=>{
  const m=BRANCH_RE.exec(String(pr?.head?.ref||''));
  if(!m||pr.state!=='open'||pr.base?.ref!=='main'||pr.head?.repo?.full_name!==repository)return false;
  const age=(todayMs-Date.parse(m[1]+'T12:00:00Z'))/MS_DAY;
  return Number.isInteger(age)&&age>=1&&age<=maxAgeDays;
 }).sort((a,b)=>b.head.ref.localeCompare(a.head.ref));
}
export function branchRecoveryDecision(pr,branch,repository){
 if(!pr||pr.state!=='open'||pr.base?.ref!=='main'||pr.head?.repo?.full_name!==repository||pr.head?.ref!==branch||!/^[0-9a-f]{40}$/.test(String(pr.head?.sha||'')))return 'REJECT_IDENTITY_MISMATCH';
 if(pr.mergeable_state==='behind')return 'REQUEST_GITHUB_NATIVE_UPDATE';
 if(pr.mergeable_state==='dirty')return 'CONFLICT_OWNER_REVIEW';
 if(['clean','blocked','unstable','draft'].includes(pr.mergeable_state))return 'PROTECTED_GATES_OWN_NEXT_STEP';
 return 'WAIT_GITHUB_MERGEABILITY';
}
function gh(args){return execFileSync('gh',args,{encoding:'utf8',timeout:25000,maxBuffer:6*1024*1024});}
function api(path){return JSON.parse(gh(['api',path]));}
export function recoverOneStaleBlogBranch({repo,today,fetchPage=api,updateBranch=gh}={}){
 const open=[];
 for(let page=1;page<=3;page++){
  const batch=fetchPage('repos/'+repo+'/pulls?state=open&per_page=100&page='+page);
  if(!Array.isArray(batch))throw Error('BLOG_RECOVERY_PR_LIST_UNVERIFIED');
  open.push(...batch);
  if(batch.length<100)break;
 }
 const candidates=eligibleStaleBlogPrs(open,today,repo);
 for(const item of candidates){
  const pr=fetchPage('repos/'+repo+'/pulls/'+item.number);
  if(pr?.head?.sha!==item.head.sha){console.log('BLOG_BACKLOG_HEAD_MOVED_RETRY_NEXT_HOUR:'+item.number);continue;}
  const decision=branchRecoveryDecision(pr,item.head.ref,repo);
  if(decision==='REQUEST_GITHUB_NATIVE_UPDATE'){
   updateBranch(['api','-X','PUT','repos/'+repo+'/pulls/'+item.number+'/update-branch','-f','expected_head_sha='+pr.head.sha]);
   console.log('BLOG_BACKLOG_NATIVE_UPDATE_REQUESTED:PR='+item.number+':date='+item.head.ref.slice(-10)+':old_head='+pr.head.sha);
   return {action:'UPDATE_REQUESTED',number:item.number};
  }
  if(['CONFLICT_OWNER_REVIEW','REJECT_IDENTITY_MISMATCH'].includes(decision))console.log('::warning::BLOG_BACKLOG_ORIGINAL_OWNER_ACTION:'+decision+':PR='+item.number);
 }
 console.log('BLOG_BACKLOG_NO_SAFE_NATIVE_UPDATE:candidates='+candidates.length);
 return {action:'NO_SAFE_UPDATE',candidates:candidates.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{recoverOneStaleBlogBranch({repo:String(process.env.GITHUB_REPOSITORY||''),today:String(process.env.BUSINESS_DATE||'')});}
 catch(error){console.error('::error::BLOG_BACKLOG_NATIVE_RECOVERY_FAILED:'+String(error?.message||error));process.exitCode=1;}
}
