import {chooseAuthoritativeState,effectiveConfidence} from './authority.mjs';
const relevant=(x,targets)=>!x.entity_refs||!x.entity_refs.length||x.entity_refs.some(e=>targets.includes(e));
export function compileContext({mission,currentStates=[],evidence=[],patterns=[],failures=[],hardBoundaries=[]}){
  const targets=mission.targets||[];
  const selectedEvidence=evidence.filter(x=>relevant(x,targets)&&x.truth_status!=='INVALID').map(x=>({...x,effective_confidence:effectiveConfidence(x)}));
  const grouped=new Map();
  for(const s of currentStates.filter(x=>relevant(x,targets))){const k=`${s.entity_ref}:${s.state_type||''}`; if(!grouped.has(k)) grouped.set(k,[]); grouped.get(k).push(s)}
  const current_state=[...grouped.values()].map(chooseAuthoritativeState).filter(Boolean);
  return {mission:{id:mission.id,objective:mission.objective,targets},why_now:mission.why_now||null,targets,known_facts:selectedEvidence.filter(e=>['VERIFIED','SUPPORTED'].includes(e.truth_status)),evidence:selectedEvidence,patterns:patterns.filter(x=>relevant(x,targets)),current_state,failures:failures.filter(x=>relevant(x,targets)),constraints:[...(mission.constraints||[]),...hardBoundaries].filter((v,i,a)=>a.indexOf(v)===i),protected_metrics:mission.protected_metrics||[],budget:mission.budget||{},rollback:mission.rollback||{}};
}
