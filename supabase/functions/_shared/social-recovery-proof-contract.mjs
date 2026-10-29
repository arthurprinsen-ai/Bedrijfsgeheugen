// Source-backed recovery and truth contract for the EXISTING social-recovery-runner.
// Pure helpers only: never create a second scheduler, publisher or provider side effect.
export const DUE_SOCIAL_CHANNELS=Object.freeze(['linkedin_personal','linkedin_company','instagram']);

const clean=value=>String(value??'').trim();
const object=value=>{
  if(value&&typeof value==='object'&&!Array.isArray(value))return value;
  if(typeof value==='string'){try{const decoded=JSON.parse(value);return object(decoded);}catch{}}
  return {};
};
const hasPossibleSideEffect=e=>[
  'possible_provider_side_effect','provider_create_success',
  'provider_publication_ack_verified','provider_truth_verified','republish_forbidden'
].some(key=>e[key]===true);

// A held/blocked decision is NOT a terminal skip. Only resume the EXISTING
// content loop if the pre-provider duplicate has proved no provider side effect.
// The content loop's existing source-reserve/generation classifier retains sole
// authority to select a DIFFERENT verified source and enforce attempt budgets.
export function shouldRecoverHeldPersonalDuplicate(decisions=[],obligations=[]){
  const d=(decisions||[]).find(row=>clean(row?.channel)==='linkedin_personal');
  const o=(obligations||[]).find(row=>clean(row?.channel)==='linkedin_personal');
  if(!d||!o||clean(d.decision)!=='hold'||clean(d.state)!=='blocked'||
    clean(d.delivery_ref)||clean(o.status)!=='BLOCKED'||clean(o.external_id)||
    !clean(o.last_error).startsWith('GLOBAL_POST_DUPLICATE_BLOCKED:'))return false;
  const oe=object(o.evidence),de=object(d.delivery_evidence);
  return oe.global_uniqueness_gate==='blocked'
    &&oe.publication_authority?.issued===true
    &&oe.publication_authority?.consumed===false
    &&!hasPossibleSideEffect(oe)&&!hasPossibleSideEffect(de);
}

// A day's public social obligation must never be certified green simply
// because its channel decision was placed on HOLD. Provider acceptance,
// 'scheduled', 'PUBLISHED', an unverified external ID, or a stale status is not
// independently verified publication.
export function evaluateSocialDayProviderProof(obligations=[]){
  const unresolved=[];
  for(const channel of DUE_SOCIAL_CHANNELS){
    const o=(obligations||[]).find(row=>clean(row?.channel)===channel);
    const evidence=object(o?.evidence);
    const state=clean(o?.status).toUpperCase();
    const statusProven=['LIVE_PROVEN','MEASURED','LEARNED'].includes(state);
    const providerProven=evidence.provider_truth_verified===true;
    const externalId=clean(o?.external_id);
    if(!o||!statusProven||!providerProven||!externalId){
      unresolved.push({channel,
        status:state||'MISSING',
        missing_provider_id:!externalId,
        missing_independent_readback:!providerProven,
        terminal_state_unproven:!statusProven});
    }
  }
  return {ok:unresolved.length===0,unresolved};
}
