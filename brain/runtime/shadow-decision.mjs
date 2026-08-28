import {decide} from '../decision/policy.mjs';
import {compileContext} from '../context/compiler.mjs';

export const SHADOW_POLICY_VERSION='brain-shadow-v1';

export function evaluateShadow({candidate, mission, currentStates=[], evidence=[], patterns=[], failures=[], hardBoundaries=[], proposedTeam=[]}) {
  if (!candidate || !mission) throw new Error('candidate_and_mission_required');
  const policy=decide(candidate);
  const context=compileContext({mission,currentStates,evidence,patterns,failures,hardBoundaries});
  const now=new Date().toISOString();
  return {
    mode:'SHADOW',
    side_effects_allowed:false,
    policy_version:SHADOW_POLICY_VERSION,
    evaluated_at:now,
    trace_id:candidate.trace_id||mission.trace_id||null,
    correlation_id:candidate.correlation_id||mission.correlation_id||null,
    decision:policy.decision,
    lane:policy.lane,
    expected_utility:Number.isFinite(policy.score)?policy.score:null,
    reasons:policy.reasons||[],
    blocked_by:policy.blocked_by||null,
    evidence_refs:[...(candidate.evidence_refs||[])],
    alternatives_considered:[...(candidate.alternatives||[])],
    proposed_team:[...proposedTeam],
    re_evaluate_at:candidate.re_evaluate_at||null,
    context
  };
}
