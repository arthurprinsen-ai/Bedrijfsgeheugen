// Original ONE BRAIN recovery -> ORIGINAL publication-obligation handoff.
// Pure planner only. No scheduler, sender, provider call, grant or second writer.
// The source of every message is the typed original recovery classifier.
export const PUBLICATION_HANDOFF_WRITEBACK_CONTRACT='original-publication-obligation-recovery-v1';
const ALLOWED_STATUS=new Set(['PLANNED','BLOCKED','FAILED']);
const ALLOWED_CHANNEL=new Set(['linkedin_personal','linkedin_company','instagram','blog']);
const clean=v=>typeof v==='string'?v.trim():'';
export function planOriginalPublicationHandoffs(recovery,obligations){
  if(recovery?.contract!=='one-brain-publication-no-silent-gap-v1'
    ||!['RECOVERY_DUE','PENDING_PROOF','PROVIDER_PROOF_COMPLETE'].includes(recovery?.status)
    ||!Array.isArray(recovery?.overdue)||!Array.isArray(obligations))
    return {ok:false,reason:'RECOVERY_SOURCE_UNVERIFIED',updates:[]};
  const unique=new Set(),updates=[];
  for(const item of recovery.overdue){
    const channel=clean(item?.channel);
    if(!ALLOWED_CHANNEL.has(channel)||unique.has(channel))continue;
    unique.add(channel);
    const o=obligations.find(row=>row?.channel===channel);
    if(!o||!ALLOWED_STATUS.has(clean(o.status))||clean(o.external_id))continue;
    const owner=clean(item.owner),code=clean(item.code),handoff=clean(item.repairHandoff),
      action=clean(item.action);
    if(!/^[A-Z_]{8,90}$/.test(code)||!/^[A-Z_]{8,90}$/.test(handoff)
      ||!/^[a-zA-Z0-9 /._-]{5,120}$/.test(owner)||!action||action.length>700
      ||item.status!=='REQUIRES_RECOVERY')continue;
    // No provider failure body, token, model key or arbitrary source content.
    const nextAction='HERSTEL VEREIST ['+code+'] · '+owner+': '+action;
    if(nextAction.length>900)continue;
    const previous=typeof o.next_action==='string'?o.next_action:null;
    if(clean(previous)===nextAction)continue;
    updates.push(Object.freeze({channel,previous,nextAction,code,handoff}));
  }
  return {ok:true,contract:PUBLICATION_HANDOFF_WRITEBACK_CONTRACT,updates};
}
