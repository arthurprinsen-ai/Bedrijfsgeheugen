import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const POLICY_PATH='config/pr-authority-ratchet.json';
const TUNING_PATH='config/powerhouse-engineering-tuning.json';
const WORKFLOW_DIR='.github/workflows';
const ABSOLUTE_INITIAL_CEILING=55;

export function eventBlock(source,eventName='pull_request'){
  const lines=source.split(/\r?\n/);
  const start=lines.findIndex(line=>new RegExp(`^  ${eventName}:\\s*`).test(line));
  if(start<0) return null;
  const block=[lines[start]];
  for(let i=start+1;i<lines.length;i+=1){
    const line=lines[i];
    if(/^  [A-Za-z0-9_-]+:\s*/.test(line)) break;
    if(/^[A-Za-z][A-Za-z0-9_-]*:\s*/.test(line)) break;
    block.push(line);
  }
  return block.join('\n');
}

export function removeEventBlock(source,eventName='pull_request'){
  const lines=source.split(/\r?\n/);
  const start=lines.findIndex(line=>new RegExp(`^  ${eventName}:\\s*`).test(line));
  if(start<0) return source;
  let end=start+1;
  while(end<lines.length && !/^  [A-Za-z0-9_-]+:\s*/.test(lines[end]) && !/^[A-Za-z][A-Za-z0-9_-]*:\s*/.test(lines[end])) end+=1;
  return [...lines.slice(0,start),...lines.slice(end)].join('\n').replace(/\n{3,}/g,'\n\n');
}

export function isDirectPullRequestWorkflow(source){
  const block=eventBlock(source,'pull_request');
  if(!block) return false;
  return !/types:\s*\[\s*closed\s*\]/.test(block);
}

export async function directPullRequestWorkflows(root='.'){
  const dir=path.join(root,WORKFLOW_DIR);
  const names=(await readdir(dir)).filter(name=>/\.ya?ml$/.test(name)).sort();
  const direct=[];
  for(const name of names){
    const source=await readFile(path.join(dir,name),'utf8');
    if(isDirectPullRequestWorkflow(source)) direct.push(name);
  }
  return direct;
}

async function readJson(root,relative){
  return JSON.parse(await readFile(path.join(root,relative),'utf8'));
}

export async function validatePolicy(root='.'){
  const policy=await readJson(root,POLICY_PATH);
  const tuning=await readJson(root,TUNING_PATH);
  const direct=await directPullRequestWorkflows(root);
  const errors=[];
  const target=Number(policy.target_direct_pr_workflows);
  const budget=Number(policy.budget);
  const initialCeiling=Number(policy.initial_ceiling);
  const canonical=[...(policy.canonical_direct_pr_workflows||[])].sort();

  if(target!==2) errors.push('target_direct_pr_workflows must remain 2');
  if(initialCeiling!==ABSOLUTE_INITIAL_CEILING) errors.push(`initial_ceiling must remain ${ABSOLUTE_INITIAL_CEILING}`);
  if(!Number.isFinite(budget) || budget<target || budget>ABSOLUTE_INITIAL_CEILING) errors.push(`budget must stay between ${target} and ${ABSOLUTE_INITIAL_CEILING}`);
  if(Number(policy.max_retirements_per_cycle)!==1) errors.push('max_retirements_per_cycle must remain 1');
  if(direct.length>budget) errors.push(`direct PR workflow budget exceeded: ${direct.length} > ${budget}`);
  for(const name of canonical) if(!direct.includes(name)) errors.push(`canonical direct PR authority missing: ${name}`);
  for(const retired of policy.retired||[]) if(direct.includes(retired.workflow)) errors.push(`retired PR authority reintroduced: ${retired.workflow}`);
  if(Number(tuning?.ci?.direct_pr_workflow_target)!==target) errors.push('engineering tuning target drift');
  if(Number(tuning?.ci?.direct_pr_workflow_budget)!==budget) errors.push('engineering tuning budget drift');
  if(tuning?.safety?.autonomous_gate_weakening_forbidden!==true) errors.push('autonomous gate weakening must remain forbidden');

  return {ok:errors.length===0,errors,direct,target,budget,canonical};
}

async function proveCandidate(root,candidate){
  const delegated=await readFile(path.join(root,candidate.delegated_to),'utf8');
  const missing=(candidate.proof_contains||[]).filter(token=>!delegated.includes(token));
  return {ok:missing.length===0,missing};
}

export async function applyNext(root='.'){
  const state=await validatePolicy(root);
  if(!state.ok) throw new Error(`PR authority policy invalid before ratchet: ${state.errors.join('; ')}`);
  if(state.direct.length<=state.target) return {changed:false,reason:'TARGET_REACHED',...state};

  const policy=await readJson(root,POLICY_PATH);
  const candidates=policy.candidates||[];
  for(const candidate of candidates){
    if(!state.direct.includes(candidate.workflow)) continue;
    const proof=await proveCandidate(root,candidate);
    if(!proof.ok) continue;

    const workflowPath=path.join(root,WORKFLOW_DIR,candidate.workflow);
    const source=await readFile(workflowPath,'utf8');
    const next=removeEventBlock(source,'pull_request');
    if(next===source) continue;
    await writeFile(workflowPath,next);

    const after=await directPullRequestWorkflows(root);
    if(after.length!==state.direct.length-1) throw new Error(`ratchet must remove exactly one direct PR authority: before=${state.direct.length} after=${after.length}`);

    const nextPolicy={
      ...policy,
      budget:Math.min(Number(policy.budget),after.length),
      retired:[...(policy.retired||[]),{
        workflow:candidate.workflow,
        delegated_to:path.basename(candidate.delegated_to),
        proof:candidate.reason||'Delegated assurance proven by canonical Required lane.'
      }],
      candidates:candidates.filter(item=>item.workflow!==candidate.workflow)
    };
    await writeFile(path.join(root,POLICY_PATH),JSON.stringify(nextPolicy,null,2)+'\n');

    const tuning=await readJson(root,TUNING_PATH);
    tuning.ci={...(tuning.ci||{}),direct_pr_workflow_target:2,direct_pr_workflow_budget:nextPolicy.budget,architecture_attention_required:after.length>2};
    await writeFile(path.join(root,TUNING_PATH),JSON.stringify(tuning,null,2)+'\n');

    return {changed:true,retired:candidate.workflow,delegated_to:candidate.delegated_to,before:state.direct.length,after:after.length,budget:nextPolicy.budget};
  }
  return {changed:false,reason:'NO_PROVEN_CANDIDATE',...state};
}

async function main(){
  const mode=process.argv[2]||'--check';
  if(mode==='--check'){
    const result=await validatePolicy('.');
    console.log(JSON.stringify(result,null,2));
    if(!result.ok) process.exitCode=1;
    return;
  }
  if(mode==='--apply-next'){
    const result=await applyNext('.');
    console.log(JSON.stringify(result,null,2));
    return;
  }
  throw new Error(`Unknown mode: ${mode}`);
}

const isMain=process.argv[1] && fileURLToPath(import.meta.url)===path.resolve(process.argv[1]);
if(isMain) main().catch(error=>{ console.error(error.stack||error); process.exit(1); });
