const required=(value,name)=>{
  if(value===undefined||value===null||String(value).trim()==='') throw new TypeError(`GitHub CurrentState adapter requires ${name}`);
  return String(value).trim();
};

const mapWorkflowState=(status,conclusion)=>{
  const state=String(status||'').toLowerCase();
  const result=String(conclusion||'').toLowerCase();

  if(state==='queued') return {health:'healthy',capacity:'available',executionStatus:'queued',error:null};
  if(state==='in_progress'||state==='waiting'||state==='requested'||state==='pending') return {health:'healthy',capacity:'available',executionStatus:'running',error:null};
  if(state==='completed'){
    if(result==='success') return {health:'healthy',capacity:'available',executionStatus:'completed',error:null};
    if(result==='cancelled') return {health:'degraded',capacity:'interrupted',executionStatus:'interrupted',error:'GITHUB_WORKFLOW_CANCELLED'};
    if(['failure','timed_out','startup_failure','action_required'].includes(result)){
      return {health:'unhealthy',capacity:'available',executionStatus:'failed',error:`GITHUB_WORKFLOW_${result.toUpperCase()}`};
    }
    if(['neutral','skipped','stale'].includes(result)){
      return {health:'degraded',capacity:'available',executionStatus:result||'completed',error:null};
    }
  }
  return {health:'unknown',capacity:'unknown',executionStatus:'unknown',error:'GITHUB_WORKFLOW_STATE_UNKNOWN'};
};

export function createGithubCurrentStateInput({tenantId,repository,sha,runId,workflow,status,conclusion,updatedAt}={}){
  const tenant=required(tenantId,'tenantId');
  const repo=required(repository,'repository');
  const revision=required(sha,'sha');
  const execution=required(runId,'runId');
  const name=required(workflow,'workflow');
  const observedAt=required(updatedAt,'updatedAt');
  const workflowStatus=String(status||'').toLowerCase();
  const workflowConclusion=conclusion===undefined||conclusion===null?null:String(conclusion).toLowerCase();
  const mapped=mapWorkflowState(workflowStatus,workflowConclusion);

  return {
    tenantId:tenant,
    source:'github',
    id:`github-current-state:${repo}:${name}:${execution}`,
    component:`github:${repo}:${name}`,
    raw:{
      repository:repo,
      sha:revision,
      run_id:execution,
      updated_at:observedAt,
      workflow:name,
      status:workflowStatus,
      conclusion:workflowConclusion
    },
    observedAt,
    health:mapped.health,
    error:mapped.error,
    owner:'github-actions',
    cost:null,
    revision,
    capacity:mapped.capacity,
    executionStatus:mapped.executionStatus,
    verified:true
  };
}
