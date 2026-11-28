import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyOpenRegulatoryPredecessor} from './terminal-migration-identity.mjs';
const sha=/^[0-9a-f]{40}$/;
const num=n=>Number.isSafeInteger(n)&&n>0;
const line=(body,key)=>{const lines=String(body||'').split(/\r?\n/).filter(l=>l.startsWith(key+':'));return lines.length===1?lines[0].slice(key.length+1).trim():null;};
export function planRegulatoryOwnerRetirement({predecessor,successor,files,originalBlob,successorBlob,currentBlob,expectedHead,headRecheck,repo,run,job,evidence,mainSha,protectedRunAncestry,protectedMergeAncestry}={}){
 const fail=()=>{throw Error('REGULATORY_OWNER_RETIREMENT_UNPROVEN');};
 const obligation=line(predecessor?.body,'Obligation-ID');
 const proof=verifyOpenRegulatoryPredecessor({predecessor,successor,files,originalBlob,successorBlob,currentBlob,obligation,headRecheck});
 const n=successor.number, merged=successor.merge_commit_sha, candidate=successor.head?.sha;
 const projection=Number(line(successor.body,'Terminal-Skill-Projection-Run'));
 const production=line(successor.body,'Terminal-Production-Readback');
 if(!sha.test(expectedHead)||expectedHead!==predecessor.head.sha||!sha.test(candidate)||!sha.test(mainSha)||
   protectedRunAncestry!==true||protectedMergeAncestry!==true||
   typeof repo!=='string'||!repo||[predecessor,successor].some(p=>p.head?.repo?.full_name!==repo||p.base?.repo?.full_name!==repo||p.base?.ref!=='main')||
   predecessor.head.ref!=='writer/regulatory-source-watch/'+obligation.slice('regulatory-source-watch-'.length)||
   line(predecessor.body,'Writer-Lease-Owner')!==obligation||
   line(predecessor.body,'Writer-Lease-Scope')!=='data/regulatory-source-state.json'||
   line(predecessor.body,'Writer-Lease-Release')!=='MERGED_AND_PRODUCTION_READBACK_AND_LEARNING_WRITEBACK'||
   line(successor.body,'Writer-Lease-State')!=='RELEASED'||line(successor.body,'Terminal-State')!=='LIVE_BEWEZEN'||
   line(successor.body,'Terminal-Main-SHA')!==merged||!num(projection)||
   !num(run?.id)||run.path!=='.github/workflows/obligation-terminal-closure.yml'||run.event!=='workflow_dispatch'||
   run.head_branch!=='main'||!sha.test(run.head_sha)||run.repository?.full_name!==repo||
   run.display_title!=='Obligation Terminal Closure PR #'+n||run.status!=='completed'||run.conclusion!=='success'||
   job?.run_id!==run.id||job.name!=='close-obligation'||job.conclusion!=='success'||!Array.isArray(job.steps)||
   !['Persist canonical Brain terminal evidence before terminal claim','Persist terminal evidence and release writer lease','Publish immutable terminal evidence'].every(name=>job.steps.filter(s=>s.name===name&&s.conclusion==='success').length===1)||
   evidence?.contract!=='POWERHOUSE-GITHUB-DELIVERY-STATE-MACHINE-v1'||evidence.terminal_state!=='LIVE_BEWEZEN'||
   evidence.obligation_id!==obligation||evidence.candidate_head_sha!==candidate||evidence.main_merge_sha!==merged||
   evidence.skill_projection_required!==true||evidence.skill_projection_run_id!==projection||
   evidence.writer_lease_state!=='RELEASED'||evidence.outcome_evidence!==true||evidence.verified!==true||
   !sha.test(evidence.production_observed_sha))fail();
 const mode=evidence.production_readback_mode;
 const expectedProduction=mode==='canonical_run'&&num(evidence.production_readback_run_id)?'run:'+evidence.production_readback_run_id:
   mode==='github_main'?'main:'+evidence.production_observed_sha:
   mode==='descendant'&&typeof evidence.production_deploy_id==='string'&&/^[a-z0-9-]{10,100}$/.test(evidence.production_deploy_id)?'descendant:'+evidence.production_observed_sha+':deploy:'+evidence.production_deploy_id:null;
 if(!expectedProduction||expectedProduction!==production)fail();
 const body=predecessor.body.split(/\r?\n/).filter(l=>! /^(Writer-Lease-State|Writer-Lease-Release|Superseded-By|Closure-Reason|Terminal-State|Terminal-Successor-Run):/.test(l)).join('\n').trimEnd()+'\n\n'+[
   'Writer-Lease-State: RELEASED_SUPERSEDED','Writer-Lease-Release: SUPERSEDED_BY_TERMINAL_SUCCESSOR',
   'Superseded-By: '+n,'Closure-Reason: canonical successor #'+n+' LIVE_BEWEZEN; exact source blob '+originalBlob+' on protected main.',
   'Terminal-State: SUPERSEDED_BY_LIVE_BEWEZEN_SUCCESSOR','Terminal-Successor-Run: '+run.id
 ].join('\n')+'\n';
 return {body,receipt:{...proof,status:'OWNER_TERMINAL_RETIREMENT_READY',terminal_run:run.id,skill_projection_run:projection,main_sha:mainSha}};
}
function cli(){
 const env=process.env,repo=env.GITHUB_REPOSITORY;
 if(env.GITHUB_REF!=='refs/heads/main'||env.GITHUB_EVENT_NAME!=='workflow_dispatch'||!repo||!/^[\w.-]+\/[\w.-]+$/.test(repo))throw Error('OWNER_WORKFLOW_CONTEXT_INVALID');
 if(![env.PREDECESSOR,env.SUCCESSOR,env.TERMINAL_RUN].every(s=>/^[1-9]\d*$/.test(s||'')&&num(Number(s)))||!sha.test(env.EXPECTED_HEAD))throw Error('OWNER_RETIREMENT_INPUT_INVALID');
 const [pre,suc,runId]=[env.PREDECESSOR,env.SUCCESSOR,env.TERMINAL_RUN].map(Number);
 const gh=(...args)=>JSON.parse(execFileSync('gh',['api',...args],{encoding:'utf8',timeout:20000}));
 const pr=n=>gh('repos/'+repo+'/pulls/'+n);
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',timeout:30000}).trim();
 const prefix='repos/'+repo+'/actions/runs/';
 const predecessor=pr(pre),successor=pr(suc);
 const run=gh(prefix+runId),jobs=gh(prefix+runId+'/jobs?filter=latest&per_page=100');
 if(jobs.total_count!==1||jobs.jobs?.length!==1||run.id!==runId||run.conclusion!=='success')throw Error('TERMINAL_RUN_UNPROVEN');
 const files=gh('repos/'+repo+'/pulls/'+pre+'/files?per_page=100');
 if(!sha.test(predecessor.head?.sha)||!sha.test(successor.merge_commit_sha)||!sha.test(run.head_sha))throw Error('OWNER_SOURCE_IDENTITY_INVALID');
 git('fetch','origin','main','--no-tags');const mainSha=git('rev-parse','origin/main');
 git('merge-base','--is-ancestor',env.GITHUB_SHA,mainSha);
 git('merge-base','--is-ancestor',run.head_sha,mainSha);
 git('merge-base','--is-ancestor',successor.merge_commit_sha,mainSha);
 git('fetch','origin',predecessor.head.sha,'--no-tags');
 const source='data/regulatory-source-state.json',blob=ref=>git('rev-parse',ref+':'+source);
 const dir=mkdtempSync(join(tmpdir(),'regulatory-terminal-'));
 try{
  execFileSync('gh',['run','download',String(runId),'--repo',repo,'--name','obligation-terminal-evidence-'+suc,'--dir',dir],{stdio:'inherit',timeout:30000});
  const evidence=JSON.parse(readFileSync(join(dir,'obligation-terminal-evidence.json'),'utf8'));
  const live=pr(pre),liveSuccessor=pr(suc);
  if(live.body!==predecessor.body||live.state!==predecessor.state||live.merged!==predecessor.merged||live.changed_files!==predecessor.changed_files||liveSuccessor.body!==successor.body||liveSuccessor.head?.sha!==successor.head?.sha||liveSuccessor.merge_commit_sha!==successor.merge_commit_sha||liveSuccessor.merged!==true)throw Error('OWNER_RETIREMENT_IDENTITY_DRIFT');
  git('fetch','origin','main','--no-tags');
  if(git('rev-parse','origin/main')!==mainSha)throw Error('OWNER_RETIREMENT_MAIN_DRIFT');
  const plan=planRegulatoryOwnerRetirement({predecessor,successor,files,originalBlob:blob(predecessor.head.sha),successorBlob:blob(successor.merge_commit_sha),currentBlob:blob(mainSha),expectedHead:env.EXPECTED_HEAD,headRecheck:live.head?.sha,repo,run,job:jobs.jobs[0],evidence,mainSha,protectedRunAncestry:true,protectedMergeAncestry:true});
  // The existing source owner owns the one concurrency group; nonowners must DEFER.
  // Close and change lease in the same provider request. Never merge the predecessor.
  gh('--method','PATCH','repos/'+repo+'/pulls/'+pre,'-f','state=closed','-f','body='+plan.body);
  const closed=pr(pre);
  if(closed.state!=='closed'||closed.merged!==false||closed.head?.sha!==env.EXPECTED_HEAD||closed.body!==plan.body)throw Error('OWNER_RETIREMENT_READBACK_UNPROVEN');
  mkdirSync('.artifacts',{recursive:true});
  const receipt={...plan.receipt,status:'OWNER_TERMINAL_RETIREMENT_PROVEN',writer_lease_released:true,closed:true,merged:false,verified:true};
  writeFileSync('.artifacts/regulatory-owner-retirement.json',JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify(receipt));
 }finally{rmSync(dir,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)cli();
