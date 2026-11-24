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
    // Diagnostic fields are intentionally bounded and strict: a malformed
    // upstream owner/source value must NOT be reflected in Brain/Portal logs.
    channel:/^[a-z0-9_:-]{1,80}$/.test(clean(channel))
      ?clean(channel):'UNDECLARED_CHANNEL',
    reason,
    owner:/^[a-zA-Z0-9 /._-]{5,120}$/.test(clean(owner))
      ?clean(owner):'original-powerhouse-content-orchestrator'
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
  // A warning can precede the original dated decision. Once the original
  // channel decision carries an exact valid schedule, its obsolete
  // PUBLICATION_SCHEDULE_MISSING receiver warning must self-heal on the
  // SAME canonical tick, without publishing early or inventing a deadline.
  // Only a pre-due pending decision may clear this precise stale warning.
  for(const item of recovery.pending||[]){
    const channel=clean(item?.channel);
    if(!ALLOWED_CHANNEL.has(channel)||unique.has(channel))continue;
    if(item?.phase!=='PENDING'||item?.status!=='AWAITING_DUE_TIME')continue;
    const scheduledFor=clean(item?.scheduledFor);
    if(!/^20\\d{2}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$/.test(scheduledFor)
      ||!Number.isFinite(Date.parse(scheduledFor)))continue;
    const matches=obligations.filter(row=>row?.channel===channel);
    if(matches.length!==1)continue;
    const o=matches[0],previous=clean(o.next_action);
    if(o.status!=='PLANNED'||clean(o.external_id)
      ||!/^HERSTEL VEREIST \\[PUBLICATION_SCHEDULE_MISSING\\]/.test(previous))continue;
    const owner=clean(item.owner);
    if(!/^[a-zA-Z0-9 /._-]{5,120}$/.test(owner))continue;
    const nextAction='ORIGINAL_CHANNEL_SCHEDULE_CONFIRMED ['+scheduledFor+'] · '
      +owner+': volg oorspronkelijke gedateerde beslissing; controleer inhoud, '
      +'goedkeuring en exact providerbewijs vóór LIVE_PROVEN. Geen tweede publicatie.';
    updates.push(Object.freeze({
      channel,previous:o.next_action,nextAction,owner,
      code:'PUBLICATION_SCHEDULE_RECONCILED',
      handoff:'ORIGINAL_DUE_TIME_RESTORED'
    }));
    unique.add(channel);
  }
  return {ok:true,contract:PUBLICATION_HANDOFF_WRITEBACK_CONTRACT,
    updates,unresolved,alreadyIdentical,routedToOriginalOwner};
}
