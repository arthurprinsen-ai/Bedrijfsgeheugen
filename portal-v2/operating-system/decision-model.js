const DECISIONS=Object.freeze(['accept','reject','defer','delegate','request-evidence','modify']);
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};

export function recordDecision(decision={}, {now=new Date().toISOString()}={}){
 if(!decision.action_id)throw new Error('DECISION_ACTION_REQUIRED');
 if(!DECISIONS.includes(decision.decision))throw new Error('DECISION_KIND_INVALID');
 if(!decision.actor||decision.actor==='authenticated-user')throw new Error('DECISION_ACTOR_REQUIRED');
 return freeze({id:decision.id||`decision:${decision.action_id}:${now}`,action_id:decision.action_id,decision:decision.decision,actor:decision.actor,timestamp:now,reason:decision.reason||'',delegate_to:decision.delegate_to||null,evidence_snapshot:structuredClone(decision.evidence_snapshot||{}),follow_up_obligation:structuredClone(decision.follow_up_obligation||null)});
}

export {DECISIONS};
