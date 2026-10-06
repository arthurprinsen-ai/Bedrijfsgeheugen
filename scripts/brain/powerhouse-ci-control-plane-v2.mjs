import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const repoRoot=path.resolve(here,'..','..');

export function parseOnBlock(source=''){
  const lines=String(source).split(/\r?\n/);
  const onIndex=lines.findIndex(line=>/^on:\s*$/.test(line));
  if(onIndex<0) return [];
  const events=[];
  for(let i=onIndex+1;i<lines.length;i++){
    const line=lines[i];
    if(/^[^\s#]/.test(line) && line.trim()) break;
    const m=line.match(/^  ([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if(m) events.push({name:m[1],index:i,inline:m[2]});
  }
  return events;
}

export function pullRequestMode(source=''){
  const lines=String(source).split(/\r?\n/);
  const events=parseOnBlock(source);
  const pr=events.find(event=>event.name==='pull_request');
  if(!pr) return 'none';
  let end=lines.length;
  for(const event of events) if(event.index>pr.index){end=Math.min(end,event.index);}
  const block=lines.slice(pr.index,end).join('\n');
  const closedOnly=/types:\s*\[\s*closed\s*\]/.test(block) || /-\s*closed\s*$/.test(block);
  return closedOnly?'closed-only':'head';
}

export async function auditCiControlPlane({root=repoRoot}={}){
  const policy=JSON.parse(await readFile(path.join(root,'config/powerhouse-ci-control-plane-v2.json'),'utf8'));
  const workflowDir=path.join(root,'.github','workflows');
  const names=(await readdir(workflowDir)).filter(name=>/\.ya?ml$/.test(name)).sort();
  const headTriggers=[];
  const lifecycle=[];
  for(const name of names){
    const rel='.github/workflows/'+name;
    const source=await readFile(path.join(workflowDir,name),'utf8');
    const mode=pullRequestMode(source);
    if(mode==='head') headTriggers.push(rel);
    if(mode==='closed-only') lifecycle.push(rel);
  }
  const errors=[];
  if(policy.fingerprint!=='powerhouse-ci-control-plane-v2') errors.push('control-plane fingerprint drift');
  if(policy.version!==2) errors.push('control-plane version drift');
  const canonical=String(policy.canonical_pr_workflow||'');
  if(!headTriggers.includes(canonical)) errors.push('canonical Required workflow must own pull_request HEAD ingress');
  const unauthorized=headTriggers.filter(item=>item!==canonical);
  if(unauthorized.length) errors.push('unauthorized pull_request HEAD workflows: '+unauthorized.join(', '));
  if(headTriggers.length>Number(policy.pull_request_head_workflow_budget||1)) errors.push('pull_request workflow budget exceeded');
  const lifecycleAllow=new Set(policy.lifecycle_pull_request_closed_allowlist||[]);
  const unexpectedLifecycle=lifecycle.filter(item=>!lifecycleAllow.has(item));
  if(unexpectedLifecycle.length) errors.push('unexpected pull_request closed lifecycle workflows: '+unexpectedLifecycle.join(', '));
  const requiredSource=await readFile(path.join(root,canonical),'utf8');
  const requiredEvents=parseOnBlock(requiredSource).map(event=>event.name);
  if(!requiredEvents.includes('merge_group')) errors.push('Required must run on merge_group');
  if(!/^\s{2}test:\s*$/m.test(requiredSource)) errors.push('Required canonical test job missing');
  if(/^concurrency:\s*$/m.test(requiredSource)) errors.push('workflow-level Required concurrency forbidden; fast ingress may not wait on a workflow lock');
  const slo=policy.slo||{};
  if(Number(slo.fast_gate_queue_p95_seconds)>30) errors.push('fast queue SLO weakened');
  if(Number(slo.fast_gate_total_p95_seconds)>120) errors.push('fast total SLO weakened');
  if(Number(slo.agent_active_external_wait_seconds)>30) errors.push('agent active external wait SLO weakened');
  return {
    ok:errors.length===0,
    errors,
    headTriggers,
    lifecycle,
    workflowCount:names.length,
    slo
  };
}

async function main(){
  const result=await auditCiControlPlane();
  console.log(JSON.stringify({status:result.ok?'CI_CONTROL_PLANE_V2_OK':'CI_CONTROL_PLANE_V2_BLOCKED',...result},null,2));
  if(!result.ok) process.exitCode=1;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await main();
