// Deterministic incident-learning handoff for the ORIGINAL Powerhouse content-loop.
// NO parallel scheduler, publisher, external send, self-approval, or status mutation.
// The original single writer records each distinct failure in existing ONE BRAIN.
export const INCIDENT_LEARNING_CONTRACT='original-publication-incident-learning-v1';
const CHANNELS=new Set(['linkedin_personal','linkedin_company','instagram','blog','email_newsletter']);
const clean=v=>typeof v==='string'?v.trim():'';

export function planOriginalIncidentLearning(recovery,runDate){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(clean(runDate))
  ||recovery?.contract!=='one-brain-publication-no-silent-gap-v1'
  ||!Array.isArray(recovery.overdue)
  ||!['RECOVERY_DUE','PENDING_PROOF','PROVIDER_PROOF_COMPLETE'].includes(recovery.status))
  return {ok:false,reason:'ORIGINAL_RECOVERY_UNVERIFIED',observations:[]};
 const observed=new Set(),observations=[];
 for(const incident of recovery.overdue){
  const channel=clean(incident?.channel),code=clean(incident?.code),
   owner=clean(incident?.owner),handoff=clean(incident?.repairHandoff);
  if(!CHANNELS.has(channel)||observed.has(channel)
    ||!/^[A-Z_]{8,90}$/.test(code)
    ||!/^[A-Z_]{8,90}$/.test(handoff)
    ||!/^[a-zA-Z0-9 /._-]{5,140}$/.test(owner)
    ||incident?.status!=='REQUIRES_RECOVERY')continue;
  observed.add(channel);
  const fingerprint='powerhouse|publication-recovery|'+channel+'|'+code.toLowerCase()+'|v1';
  // No raw post text, personal identities, tokens, key or provider secrets.
  // Repeating the same daily failure is an idempotent occurrence; a new day
  // or new typed failure becomes a distinct original ONE BRAIN observation.
  const evidence={
   contract:INCIDENT_LEARNING_CONTRACT,run_date:runDate,channel,
   failure_code:code,owner_agent:owner,original_repair_handoff:handoff,
   classification:'INCIDENT_OPEN',proof_state:'NOT_PROVEN',
   occurrence_source:'original-powerhouse-content-loop',
   requires_human_authorization:incident.requiresAuthorization===true,
   required_outputs:[
    'root_cause_with_original_source_evidence',
    'bounded_fix_with_original_owner',
    'permanent_prevention_rule_before_next_action',
    'automated_regression_proof',
    'protected_skill_and_human_documentation_writeback',
    'exact_independent_provider_or_outcome_readback',
    'subsequent_natural_run_recurring_error_check'
   ],
   policy:'Do not mark PROVEN/GREEN on observation, cron completion, generated copy or provider request; preserve duplicate, consent, quality and provider proof gates.',
   issue:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232'
  };
  observations.push(Object.freeze({
   channel,code,owner,fingerprint,
   occurrenceId:'publication-recovery:'+runDate+':'+channel+':'+code,
   evidence:Object.freeze(evidence)
  }));
 }
 return {ok:true,contract:INCIDENT_LEARNING_CONTRACT,observations};
}
