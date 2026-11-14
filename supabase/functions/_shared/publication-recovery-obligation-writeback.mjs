// Original ONE BRAIN recovery -> ORIGINAL publication-obligation handoff.
// Pure planner only. No scheduler, sender, provider call, grant or second writer.
// The source of every message is the typed original recovery classifier.
export const PUBLICATION_HANDOFF_WRITEBACK_CONTRACT='original-publication-obligation-recovery-v1';
const ALLOWED_STATUS=new Set(['PLANNED','BLOCKED','FAILED']);
const ALLOWED_CHANNEL=new Set(['linkedin_personal','linkedin_company','instagram','blog']);
const clean=v=>typeof v==='string'?v.trim():'';
/**
 * A due source handoff must be accounted for even if the original owner
 * cannot safely mutate the obligation. "Skipped" is not an outcome:
 * advanced/unauthorized/invalid lanes are carried forward explicitly for
 * original-owner reconciliation, never redirected to a second publisher.
 */
export function planOriginalPublicationHandoffs(recovery,obligations){
  const invalidSource=recovery?.contract!=='one-brain-publication-no-silent-gap-v1'
    ||!['RECOVERY_DUE','PENDING_PROOF','PROVIDER_PROOF_COMPLETE'].includes(recovery?.status)
    ||!Array.isArray(recovery?.overdue)||!Array.isArray(obligations);
  if(invalidSource) return {ok:false,reason:'RECOVERY_SOURCE_UNVERIFIED',updates:[],
    unresolved:[],alreadyIdentical:[],routedToOriginalOwner:[]};
  const unique=new Set(),updates=[],unresolved=[],alreadyIdentical=[],routedToOriginalOwner=[];
  const note=(channel,reason,owner)=>Object.freeze({
    channel,reason,owner:clean(owner)||'original-powerhouse-content-orchestrator'
  });
  for(const item of recovery.overdue){
    const channel=clean(item?.channel);
    const owner=clean(item?.owner);
    if(!ALLOWED_CHANNEL.has(channel)){
      // Email still belongs to its ORIGINAL authorisation + recipient owner:
      // it must not be silently dropped nor sent by the social writer.
      routedToOriginalOwner.push(note(channel||'UNDECLARED_CHANNEL',
        channel==='email_newsletter'?'ORIGINAL_EMAIL_OWNER_ONLY':'UNSUPPORTED_OR_MISSING_CHANNEL',
        owner));
      continue;
    }
    if(unique.has(channel)){
      unresolved.push(note(channel,'DUPLICATE_DUE_CHANNEL_RECOVERY_SOURCE',owner));
      continue;
    }
    unique.add(channel);
    const matches=obligations.filter(row=>row?.channel===channel);
    if(matches.length!==1){
      unresolved.push(note(channel,matches.length===0
        ?'ORIGINAL_OBLIGATION_MISSING':'ORIGINAL_OBLIGATION_AMBIGUOUS',owner));
      continue;
    }
    const o=matches[0],status=clean(o.status);
    if(!ALLOWED_STATUS.has(status)||clean(o.external_id)){
      // Could already have external side effects, a protected release or
      // an independently proven terminal publication: NEVER blindly retry.
      routedToOriginalOwner.push(note(channel,
        clean(o.external_id)?'POSSIBLE_EXTERNAL_SIDE_EFFECT_READBACK_REQUIRED':
        'ADVANCED_OR_UNKNOWN_STATUS_RECONCILIATION_REQUIRED',owner));
      continue;
    }
    const code=clean(item.code),handoff=clean(item.repairHandoff),
      action=clean(item.action);
    if(!/^[A-Z_]{8,90}$/.test(code)||!/^[A-Z_]{8,90}$/.test(handoff)
      ||!/^[a-zA-Z0-9 /._-]{5,120}$/.test(owner)||!action||action.length>700
      ||item.status!=='REQUIRES_RECOVERY'){
      unresolved.push(note(channel,'INVALID_OR_UNVERIFIED_OWNER_RECOVERY_CONTRACT',owner));
      continue;
    }
    // No provider failure body, token, model key or arbitrary source content.
    const nextAction='HERSTEL VEREIST ['+code+'] · '+owner+': '+action;
    if(nextAction.length>900){
      unresolved.push(note(channel,'ORIGINAL_HANDOFF_ACTION_EXCEEDS_SAFE_BOUND',owner));
      continue;
    }
    const previous=typeof o.next_action==='string'?o.next_action:null;
    if(clean(previous)===nextAction){
      alreadyIdentical.push(note(channel,'ORIGINAL_NEXT_ACTION_ALREADY_RECEIVED',owner));
      continue;
    }
    updates.push(Object.freeze({channel,previous,nextAction,code,handoff,owner}));
  }
  return {ok:true,contract:PUBLICATION_HANDOFF_WRITEBACK_CONTRACT,
    updates,unresolved,alreadyIdentical,routedToOriginalOwner};
}
