export const AGENT_WORK_STATES = Object.freeze(['Detected','Assigned','Investigating','FixPrepared','WaitingApproval','Executing','Verifying','Resolved','LearningRecorded']);
export const AUTONOMY_LEVELS = Object.freeze(['L0','L1','L2','L3','L4','L5']);

export function createAgentWork(input) {
  for (const field of ['id','tenantId','trigger','priority','primaryAgentId','status']) if (!input?.[field]) throw new TypeError(`${field} is required`);
  if (!AGENT_WORK_STATES.includes(input.status)) throw new TypeError('invalid AgentWork status');
  return Object.freeze({
    id:input.id, tenantId:input.tenantId, trigger:input.trigger, problem:input.problem ?? null, priority:input.priority,
    primaryAgentId:input.primaryAgentId, supportAgentIds:Object.freeze([...(input.supportAgentIds ?? [])]),
    affectedObjectIds:Object.freeze([...(input.affectedObjectIds ?? [])]), evidence:Object.freeze([...(input.evidence ?? [])]),
    plan:input.plan ?? null, risk:input.risk ?? null, status:input.status, changeId:input.changeId ?? null,
    verification:input.verification ?? null, outcome:input.outcome ?? null, learningId:input.learningId ?? null,
  });
}

export function canAgentExecute({ autonomyLevel, actionPolicy, risk, blastRadius, reversible, testsAvailable, verifierAvailable, budgetAvailable }) {
  if (!AUTONOMY_LEVELS.includes(autonomyLevel)) throw new TypeError('invalid autonomy level');
  if (actionPolicy === 'DENY') return Object.freeze({ allowed:false, reason:'POLICY_DENY' });
  if (autonomyLevel === 'L0' || autonomyLevel === 'L1' || autonomyLevel === 'L2') return Object.freeze({ allowed:false, reason:'AUTONOMY_PREPARE_ONLY' });
  if (risk === 'High' || blastRadius === 'High') return Object.freeze({ allowed:false, reason:'HIGH_IMPACT_REQUIRES_REVIEW' });
  if (!reversible || !testsAvailable || !verifierAvailable || !budgetAvailable) return Object.freeze({ allowed:false, reason:'AUTONOMY_ENVELOPE_NOT_SATISFIED' });
  return Object.freeze({ allowed:true, reason:'WITHIN_AUTONOMY_ENVELOPE' });
}
