import {decide} from './policy.mjs';
import {normalizeEvidence,normalizeCandidate} from './contracts.mjs';

const blockedDecisions=new Set(['PAUSE','WATCH','RESEARCH','ESCALATE_HARD_BOUNDARY']);
const executableDecision=d=>!blockedDecisions.has(d);

function bucketFor(decision,{hasDependencies=false,rank=0}={}){
  if(decision.blocked_by||!executableDecision(decision.decision)) return 'DO_NOT_DO';
  if(hasDependencies) return 'NEXT';
  return rank<3?'NOW':'LATER';
}

export function buildDecision(input,context={}){
  const candidate=normalizeCandidate(input);
  const policy=decide(candidate);
  const createdAt=context.now||new Date().toISOString();
  const portfolio_bucket=bucketFor(policy,{hasDependencies:candidate.dependencies.length>0,rank:context.rank||0});
  return {
    decision_id:`decision:${candidate.tenant_id||'global'}:${candidate.candidate_id}`,
    candidate_id:candidate.candidate_id,
    tenant_id:candidate.tenant_id,
    decision:policy.decision,
    lane:policy.lane,
    score:policy.score,
    portfolio_bucket,
    rank:context.rank??null,
    reasons:policy.reasons||[],
    blocked_by:policy.blocked_by||null,
    dependency_state:candidate.dependencies.length?'WAITING_FOR_DEPENDENCIES':'READY',
    dependencies:candidate.dependencies,
    expected_value:candidate.expected_value,
    investment:candidate.cost,
    capacity:candidate.capacity,
    duration:candidate.time,
    payback_months:candidate.payback_months,
    do_nothing_cost:candidate.do_nothing_cost,
    risk:candidate.risk,
    confidence:candidate.confidence,
    evidence_ids:[...candidate.provenance],
    assumptions:Array.isArray(input.assumptions)?input.assumptions:[],
    owner:candidate.owner,
    next_action:candidate.action,
    approval_state:candidate.approval_state,
    created_by:candidate.created_by,
    created_at:createdAt,
    valid_until:input.valid_until||null,
    dedupe_key:`company-decision:${candidate.tenant_id||'global'}:${candidate.candidate_id}`
  };
}

function dependencyOrder(candidates){
  const byId=new Map(candidates.map(c=>[c.candidate_id,c]));
  const indegree=new Map(candidates.map(c=>[c.candidate_id,0]));
  const outgoing=new Map(candidates.map(c=>[c.candidate_id,[]]));
  for(const candidate of candidates){
    for(const dependency of candidate.dependencies){
      if(!byId.has(dependency)) continue;
      indegree.set(candidate.candidate_id,(indegree.get(candidate.candidate_id)||0)+1);
      outgoing.get(dependency).push(candidate.candidate_id);
    }
  }
  const queue=candidates.filter(c=>indegree.get(c.candidate_id)===0)
    .sort((a,b)=>(b._policy.score??-Infinity)-(a._policy.score??-Infinity)||a.candidate_id.localeCompare(b.candidate_id));
  const ordered=[];
  while(queue.length){
    const current=queue.shift();
    ordered.push(current);
    for(const id of outgoing.get(current.candidate_id)||[]){
      indegree.set(id,indegree.get(id)-1);
      if(indegree.get(id)===0){
        queue.push(byId.get(id));
        queue.sort((a,b)=>(b._policy.score??-Infinity)-(a._policy.score??-Infinity)||a.candidate_id.localeCompare(b.candidate_id));
      }
    }
  }
  const cyclic=candidates.filter(c=>!ordered.some(x=>x.candidate_id===c.candidate_id));
  return {ordered,cyclic};
}

export function rankCompanyPortfolio(inputs,context={}){
  const normalized=(Array.isArray(inputs)?inputs:[]).map(input=>{
    const candidate=normalizeCandidate(input);
    return {...candidate,_raw:input,_policy:decide(candidate)};
  });
  const {ordered,cyclic}=dependencyOrder(normalized);
  const cycleIds=new Set(cyclic.map(c=>c.candidate_id));
  const result=[...ordered,...cyclic].map((candidate,index)=>{
    if(cycleIds.has(candidate.candidate_id)){
      return {
        ...candidate,
        ...candidate._policy,
        rank:index+1,
        portfolio_bucket:'DO_NOT_DO',
        blocked_by:'DEPENDENCY_CYCLE',
        dependency_state:'BLOCKED_CYCLE',
        reasons:[...(candidate._policy.reasons||[]),'dependency_cycle']
      };
    }
    const decision=buildDecision(candidate._raw,{...context,rank:index});
    return {
      ...candidate,
      ...decision,
      rank:index+1,
      dependency_state:candidate.dependencies.length?'WAITING_FOR_DEPENDENCIES':'READY',
      portfolio_bucket:bucketFor(decision,{hasDependencies:candidate.dependencies.length>0,rank:index})
    };
  });
  return result.map(({_raw,_policy,...item})=>item);
}

export {normalizeEvidence,normalizeCandidate};
