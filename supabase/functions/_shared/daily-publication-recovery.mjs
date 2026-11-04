// Read-only deadline classification consumed inside the ORIGINAL Powerhouse content-loop.
// This is not a second publisher, lease, scheduler, approval or source of truth.
export const PUBLICATION_RECOVERY_CONTRACT='one-brain-publication-no-silent-gap-v1';
const CHANNELS=Object.freeze([
  {channel:'linkedin_personal',decision:'linkedin_personal',owner:'powerhouse-content-orchestrator / powerhouse-social-publisher'},
  {channel:'linkedin_company',decision:'linkedin_company',owner:'powerhouse-content-orchestrator / powerhouse-social-publisher'},
  {channel:'instagram',decision:'instagram_company',owner:'powerhouse-instagram-media-router / powerhouse-social-publisher'},
  {channel:'blog',decision:'blog',owner:'powerhouse-blog-queue / protected daily GitHub blog writer'},
  {channel:'email_newsletter',decision:'email_newsletter',owner:'canonical Powerhouse email / authorized recipient owner'}
]);
const GRACE_MS=30*60*1000;
// Each retry remains inside the ORIGINAL channel owner's existing scheduled
// execution. This classification never publishes, creates a scheduler, or
// changes the provider's idempotency / permission boundaries.
const REPAIR_HANDOFF=Object.freeze({
  EMAIL_CANONICAL_AUTHORIZATION_REQUIRED:'VERIFY_SENDER_OPT_IN_AND_SUPPRESSION_THEN_RESUME',
  CONTENT_GENERATION_BILLING_ACTION_REQUIRED:'RESTORE_APPROVED_GENERATION_CAPABILITY_THEN_REGENERATE',
  DISTINCT_VERIFIED_STORY_REQUIRED:'DISCOVER_DIFFERENT_VERIFIED_SOURCE_THEN_REGENERATE',
  MIRA_FINAL_MEDIA_PROOF_REQUIRED:'REBUILD_AND_VERIFY_FINAL_MEDIA_THEN_RESUME',
  MIRA_UNIQUE_SOURCE_WINNER_REQUIRED:'FIND_FRESH_DISTINCT_SOURCE_AND_FREEZE_WINNER',
  BLOG_APPROVAL_RELEASE_READBACK_REQUIRED:'CORRECT_EDITORIAL_RELEASE_AND_READBACK',
  CHANNEL_CAPABILITY_PROOF_REQUIRED:'RESTORE_ORIGINAL_PROVIDER_PERMISSION_THEN_RECONCILE',
  EXACT_PROVIDER_PUBLICATION_PROOF_MISSING:'RECONCILE_EXTERNAL_SIDE_EFFECT_BEFORE_IDEMPOTENT_RETRY',
  PUBLICATION_SCHEDULE_MISSING:'REPAIR_ORIGINAL_DAILY_DECISION_THEN_RESUME'
});
const str=x=>typeof x==='string'?x.trim():'';
function reasonFor(channel,obligation,decision){
  const error=str(obligation?.last_error);
  const boundary=str(decision?.delivery_evidence?.capability_reason);
  if(channel==='email_newsletter')return 'EMAIL_CANONICAL_AUTHORIZATION_REQUIRED';
  // The original content generator records a precise classified provider
  // failure before any publication side effect. A 429 billing refusal must
  // not masquerade as a failed social transport or prompt blind retries.
  // A new review or source collision outranks an OLD provider quota error.
  // A previous 429 can stay in JSON after the approved model has regenerated.
  const current=decision?.delivery_evidence||{};
  const currentError=str(current.error);
  if(error.startsWith('GLOBAL_POST_DUPLICATE_BLOCKED')
    ||currentError.startsWith('GLOBAL_POST_DUPLICATE_BLOCKED')
    ||(channel==='linkedin_company'
      &&Array.isArray(current.violations)
      &&current.violations.some(v=>v?.code==='COMPANY_RECENT_OPERATIONAL_FRICTION_REPEAT')))
    return 'DISTINCT_VERIFIED_STORY_REQUIRED';
  if(decision?.state==='decided'
    &&current.artifact_generation_failure?.classification==='PROVIDER_BILLING')
    return 'CONTENT_GENERATION_BILLING_ACTION_REQUIRED';
  if(channel==='instagram')return str(decision?.delivery_evidence?.daily_winner_recommendation_id)
    ? 'MIRA_FINAL_MEDIA_PROOF_REQUIRED' : 'MIRA_UNIQUE_SOURCE_WINNER_REQUIRED';
  if(channel==='blog')return 'BLOG_APPROVAL_RELEASE_READBACK_REQUIRED';
  if(boundary)return 'CHANNEL_CAPABILITY_PROOF_REQUIRED';
  return 'EXACT_PROVIDER_PUBLICATION_PROOF_MISSING';
}
const REMEDIATION=Object.freeze({
  EMAIL_CANONICAL_AUTHORIZATION_REQUIRED:'Controleer uitsluitend oorspronkelijke bevoegdheid, ontvanger-opt-in en suppressie; nooit een nieuwe of ongevraagde verzender.',
  CONTENT_GENERATION_BILLING_ACTION_REQUIRED:'Oorspronkelijke AI-tekstgenerator heeft geen providertegoed; vraag bevoegde accountbeheerder om herstel of gebruik pas een opnieuw goedgekeurde en bewezen beschikbare bestaande fallback. Niet automatisch betalen, route wisselen of extra sends proberen.',
  DISTINCT_VERIFIED_STORY_REQUIRED:'Laat oorspronkelijke bronagent een wezenlijk nieuw geverifieerd verhaal vinden; behoud onveranderlijke duplicate-gate en provider-ID.',
  MIRA_FINAL_MEDIA_PROOF_REQUIRED:'Maak/controleer nieuwe Mira-media in de originele router met frame-identiteit >= 0,940, inhoudskwaliteit en exact definitief mediabewijs.',
  MIRA_UNIQUE_SOURCE_WINNER_REQUIRED:'Laat de bestaande Mira-bronagent eerst een nieuw, gedateerd en onafhankelijk MKB-probleem vinden, bestaande onderwerp- en brondubbelingen uitsluiten en daarna exact één originele dagwinnaar vastleggen. Pas na die stap mag de mediarouter een nieuwe video voorbereiden.',
  BLOG_APPROVAL_RELEASE_READBACK_REQUIRED:'Herstel oorspronkelijke redactionele goedkeuring, protected PR, Required/CodeQL/BRAIN, merge, Netlify en exact publiek artikelbewijs.',
  CHANNEL_CAPABILITY_PROOF_REQUIRED:'Herstel de oorspronkelijke providerbevoegdheid veilig, vraag vereiste menselijke OAuth-consent; geen alternatieve account of publisher.',
  EXACT_PROVIDER_PUBLICATION_PROOF_MISSING:'Herneem alleen de oorspronkelijke idempotente lane na controle op mogelijk extern effect; lees provider-ID terug, nooit blind opnieuw publiceren.',
  PUBLICATION_SCHEDULE_MISSING:'Herstel de oorspronkelijke gedateerde kanaalbeslissing; verzin geen deadline en verzend niets op basis van een aanname.'
});
export function assessDailyPublicationRecovery({
  runDate, now=new Date().toISOString(), obligations=[], decisions=[], isTerminal=()=>false, graceMs=GRACE_MS
}={}){
  const observed=Date.parse(now);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(str(runDate))||!Number.isFinite(observed)
    ||!Array.isArray(obligations)||!Array.isArray(decisions)
    ||typeof isTerminal!=='function'||!Number.isFinite(graceMs)||graceMs<0)
    return {contract:PUBLICATION_RECOVERY_CONTRACT,status:'UNVERIFIED',overdue:[],pending:[],reason:'INPUT_UNVERIFIED'};
  const byObligation=new Map(obligations.map(o=>[str(o?.channel),o]));
  const byDecision=new Map(decisions.map(d=>[str(d?.channel),d]));
  const overdue=[],pending=[];
  for(const entry of CHANNELS){
    const obligation=byObligation.get(entry.channel);
    const decision=byDecision.get(entry.decision);
    // A real provider acknowledgement/readback is authoritative; no resend
    // merely because a later readback endpoint becomes unavailable.
    if(obligation&&isTerminal(obligation))continue;
    // The original Supabase postgres driver returns timestamptz as a Date
    // object. Accept only a valid Date or a timestamp string; rejecting Date
    // as "missing schedule" falsely hides the actual overdue publication.
    const rawSchedule=decision?.scheduled_for;
    const scheduledFor=rawSchedule instanceof Date && Number.isFinite(rawSchedule.getTime())
      ? rawSchedule.toISOString() : str(rawSchedule);
    const scheduleMs=Date.parse(scheduledFor);
    const isScheduled=scheduledFor.length>0&&Number.isFinite(scheduleMs);
    const isExpired=isScheduled && observed>=scheduleMs+graceMs;
    // An explicit failed AI generation is actionable immediately, even when the
    // planned publication time has not passed. Waiting for due+30m loses the
    // chance to restore the approved provider and regenerate good content.
    const providerGenerationFailed=decision?.state==='decided'
      &&decision?.delivery_evidence?.artifact_generation_failure?.classification==='PROVIDER_BILLING';
    const isFailed=['FAILED','BLOCKED'].includes(str(obligation?.status))
      ||str(decision?.state)==='blocked'||providerGenerationFailed;
    // Missing decision is itself a recovery obligation: never silently skip a lane.
    const isMissingSchedule=!isScheduled;
    const code=isMissingSchedule?'PUBLICATION_SCHEDULE_MISSING':reasonFor(entry.channel,obligation,decision);
    const item={
      channel:entry.channel,
      owner:code==='MIRA_UNIQUE_SOURCE_WINNER_REQUIRED'
        ? 'powerhouse-mira-problem-radar-v1 / powerhouse_select_instagram_daily_winner_v1'
        : entry.owner, code,
      action:REMEDIATION[code], scheduledFor:isScheduled?new Date(scheduleMs).toISOString():null,
      // Present deadline risk as risk, never falsely as a missed publication.
      phase:isExpired?'MISSED_DEADLINE':isFailed||isMissingSchedule?'EARLY_RECOVERY':'PENDING',
      // Original publisher MUST reconcile external provider side effects before
      // any retry; content regeneration is a new qualified artifact, not a
      // duplicate of an already-delivered post or email.
      repairHandoff:REPAIR_HANDOFF[code],
      // Immutable hash identifies distinct rejected revisions without storing
      // public-facing draft copy or personal data in incident evidence.
      rejectedCopySha256:/^[a-f0-9]{64}$/.test(str(decision?.delivery_evidence?.reviewed_text_hash))
        ?str(decision.delivery_evidence.reviewed_text_hash):null,
      rejectedRecommendationId:/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(str(decision?.delivery_evidence?.fallback_recommendation_id))
        ?str(decision.delivery_evidence.fallback_recommendation_id):null,
      status:isExpired||isFailed||isMissingSchedule?'REQUIRES_RECOVERY':'AWAITING_DUE_TIME',
      requiresAuthorization:code==='MIRA_UNIQUE_SOURCE_WINNER_REQUIRED' ? false : code==='CONTENT_GENERATION_BILLING_ACTION_REQUIRED'
        || entry.channel==='email_newsletter'
        ||str(decision?.delivery_evidence?.capability_state)==='BLOCKED_HARD_BOUNDARY'
    };
    if(isExpired||isFailed||isMissingSchedule)overdue.push(item);
    else pending.push(item);
  }
  return {contract:PUBLICATION_RECOVERY_CONTRACT,
    status:overdue.length?'RECOVERY_DUE':pending.length?'PENDING_PROOF':'PROVIDER_PROOF_COMPLETE',
    overdue,pending,graceMinutes:Math.round(graceMs/60000)};
}


// Pre-flight readiness runs inside the ORIGINAL hourly content-loop before any
// channel deadline is missed. Advisory only: no duplicate publisher, new
// schedule, approval, provider access token, or social side-effect.
export const PREVENTIVE_PUBLICATION_CONTRACT='one-brain-social-preflight-before-deadline-v1';
const PREVENTIVE_CHANNELS=['linkedin_personal','linkedin_company','instagram','blog'];
const PREVENTIVE_OWNER=Object.freeze({
 linkedin_personal:'powerhouse-content-orchestrator / powerhouse-social-publisher',
 linkedin_company:'powerhouse-content-orchestrator / powerhouse-social-publisher',
 instagram:'powerhouse-instagram-media-router / original Mira producer',
 blog:'powerhouse-content-orchestrator / original protected blog publisher'
});
const PREVENTIVE_ACTION=Object.freeze({
 DECISION_NOT_READY:'Original source agent must create a new dated decision and verified buyer-relevant content before the due time; never invent a source.',
 PUBLICATION_SCHEDULE_MISSING:'Repair the original exact daily channel schedule before any provider create.',
 DISTINCT_VERIFIED_STORY_REQUIRED:'Original editor selects a substantially new verified story family before publication; do not disable the global duplicate gate.',
 SOURCE_EDITORIAL_REVISION_REQUIRED:'Original editor repairs genuine contract failures with bounded source-backed revisions; no invented personal facts or AI status dump.',
 BLOG_EDITORIAL_APPROVAL_REQUIRED:'Original blog writer corrects reader-ready copy, checks primary-date claims and obtains genuine editorial release before protected GitHub/Netlify publishing.',
 MIRA_PRODUCER_CLAIM_REQUIRED:'Original Mira producer must claim the frozen daily media job BEFORE paid generation; preserve exact OpenArt ID and source. A format preflight is not a claim.',
 MIRA_FAILED_MEDIA_REPLACEMENT_REQUIRED:'Original Mira producer must use a genuinely different approved video; never replay rejected history or relax 0.940 three-frame identity.',
 MIRA_FINAL_MEDIA_PROOF_REQUIRED:'Original router must verify native MP4, start/middle/end face at least 0.940, temporal proof and exact media SHA before publisher delivery.',
 ORIGINAL_PROVIDER_CONSENT_REQUIRED:'Only the authorized owner can grant genuinely missing provider rights using the original verified, unexpired action URL; never bypass consent.',
 INDEPENDENT_PROVIDER_READBACK_REQUIRED:'An existing provider publication acknowledgement is not independent readback. Reconcile the exact provider ID using the original authorized publisher; never resend or invent proof.',
 VERIFIED_ARTIFACT_NOT_READY:'Original channel editor must finish fresh sourced content and original quality proof before its scheduled slot.'
});
const PREVENTIVE_WINDOW_MS=12*60*60*1000;
export function assessPreventivePublicationReadiness({
 runDate, now=new Date().toISOString(), obligations=[], decisions=[], mediaJobs=[],
 isTerminal=()=>false, leadMs=PREVENTIVE_WINDOW_MS
}={}){
 const observed=Date.parse(now);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(str(runDate))||!Number.isFinite(observed)
    ||!Array.isArray(obligations)||!Array.isArray(decisions)||!Array.isArray(mediaJobs)
    ||typeof isTerminal!=='function'||!Number.isFinite(leadMs)||leadMs<0)
   return {contract:PREVENTIVE_PUBLICATION_CONTRACT,status:'UNVERIFIED',atRisk:[],ready:[],reason:'SOURCE_UNVERIFIED'};
 const byOb=new Map(obligations.map(x=>[str(x?.channel),x]));
 const byDec=new Map(decisions.map(x=>[str(x?.channel),x]));
 const media=mediaJobs.find(x=>str(x?.channel)==='instagram')||mediaJobs[0]||null;
 const atRisk=[],ready=[];
 for(const channel of PREVENTIVE_CHANNELS){
   const ob=byOb.get(channel);
   const dec=byDec.get(channel==='instagram'?'instagram_company':channel);
   // A provider create/ACK can be terminal for idempotency without being independently LIVE_PROVEN.
   // Surface missing independent proof as reconciliation-only, never as permission to resend.
   if(ob&&['linkedin_personal','linkedin_company','instagram'].includes(channel)
      &&str(ob.status)==='PUBLISHED'&&!ob.live_proven_at
      &&ob.evidence?.provider_truth_verified!==true){
     atRisk.push({channel,owner:PREVENTIVE_OWNER[channel],
       code:'INDEPENDENT_PROVIDER_READBACK_REQUIRED',
       action:PREVENTIVE_ACTION.INDEPENDENT_PROVIDER_READBACK_REQUIRED,
       scheduledFor:null,minutesToDeadline:null,phase:'READBACK_PENDING',
       requiresAuthorization:false,nextStep:'ORIGINAL_PROVIDER_RECONCILE_ONLY',
       scope:'READ_ONLY_EXISTING_CONTENT_LOOP'});
     continue;
   }
   if(ob&&isTerminal(ob)){ready.push({channel,proof:'ORIGINAL_TERMINAL_PROVIDER_READBACK'});continue;}
   const raw=dec?.scheduled_for;
   const scheduledFor=raw instanceof Date&&Number.isFinite(raw.getTime())?raw.toISOString():str(raw);
   const due=scheduledFor?Date.parse(scheduledFor):NaN;
   const validDue=Number.isFinite(due);
   const remainingMs=validDue?due-observed:null;
   const earlyWindow=!validDue||(remainingMs!==null&&remainingMs<=leadMs);
   if(!earlyWindow)continue;
   const error=str(ob?.last_error);
   const ed=dec?.delivery_evidence||{};
   const state=str(dec?.state);
   const capability=str(ed.capability_state);
   const mediaStatus=str(media?.status);
   let code=null;
   if(!dec||!validDue)code=dec?'PUBLICATION_SCHEDULE_MISSING':'DECISION_NOT_READY';
   else if(channel==='linkedin_personal'||channel==='linkedin_company'){
     if(error.startsWith('GLOBAL_POST_DUPLICATE_BLOCKED')
       ||str(ed.error).startsWith('GLOBAL_POST_DUPLICATE_BLOCKED')
       ||Array.isArray(ed.violations)&&ed.violations.some(x=>x?.code==='COMPANY_RECENT_OPERATIONAL_FRICTION_REPEAT'))
       code='DISTINCT_VERIFIED_STORY_REQUIRED';
     else if(ed.artifact_generation_failure||str(ed.error).startsWith('PERSONAL_EDITORIAL_CONTRACT_FAILED'))
       code='SOURCE_EDITORIAL_REVISION_REQUIRED';
     else if(['decided','blocked'].includes(state)||['BLOCKED','FAILED'].includes(str(ob?.status)))
       code='VERIFIED_ARTIFACT_NOT_READY';
   }else if(channel==='instagram'){
     if(['WAITING_PROOF'].includes(mediaStatus)
        ||str(media?.last_error).includes('MIRA_FACE')
        ||str(media?.last_error).includes('MIRA_CONTINUOUS')
        ||str(media?.last_error).includes('MIRA_NATIVE'))
       code='MIRA_FAILED_MEDIA_REPLACEMENT_REQUIRED';
     else if(mediaStatus==='WAITING_ASSET'&&!str(media?.asset_manifest?.openart_history_id))
       code='MIRA_PRODUCER_CLAIM_REQUIRED';
     else if(!(mediaStatus==='PROOF_VERIFIED'
       &&media?.proof_manifest?.identity_gate_result==='PASS'
       &&media?.proof_manifest?.exact_final_media_proven===true))
       code='MIRA_FINAL_MEDIA_PROOF_REQUIRED';
   }else if(channel==='blog'){
     if(!ob?.approved_at)code='BLOG_EDITORIAL_APPROVAL_REQUIRED';
     else if(['decided','blocked'].includes(state)||str(ob.status)==='GENERATED')
       code='VERIFIED_ARTIFACT_NOT_READY';
   }
   // Provider permission is the final diagnostic only if no more precise
   // source/media/editorial gate exists. Human consent cannot be fabricated.
   if(!code&&capability==='BLOCKED_HARD_BOUNDARY')
     code='ORIGINAL_PROVIDER_CONSENT_REQUIRED';
   if(!code){ready.push({channel,proof:'PRECONDITIONS_NO_KNOWN_FAILURE_NOT_PROVIDER_ACK'});continue;}
   const humanOnly=code==='ORIGINAL_PROVIDER_CONSENT_REQUIRED'
     ||code==='BLOG_EDITORIAL_APPROVAL_REQUIRED';
   atRisk.push({
     channel,owner:PREVENTIVE_OWNER[channel],code,
     action:PREVENTIVE_ACTION[code],
     scheduledFor:validDue?new Date(due).toISOString():null,
     minutesToDeadline:remainingMs===null?null:Math.floor(remainingMs/60000),
     phase:remainingMs!==null&&remainingMs<0?'PAST_DUE':'BEFORE_DUE',
     requiresAuthorization:humanOnly,
     // No fake blocker, provider receipt, new scheduling or account link.
     nextStep:'ORIGINAL_CHANNEL_OWNER_SELF_REPAIR',
     scope:'READ_ONLY_EXISTING_CONTENT_LOOP'
   });
 }
 return {contract:PREVENTIVE_PUBLICATION_CONTRACT,
   status:atRisk.length?'PREVENTIVE_ACTION_REQUIRED':'NO_PREVENTIVE_RISK_DETECTED',
   atRisk,ready,lookaheadHours:Math.round(leadMs/3600000)};
}
