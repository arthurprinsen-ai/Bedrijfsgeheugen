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
const str=x=>typeof x==='string'?x.trim():'';
function reasonFor(channel,obligation,decision){
  const error=str(obligation?.last_error);
  const boundary=str(decision?.delivery_evidence?.capability_reason);
  if(channel==='email_newsletter')return 'EMAIL_CANONICAL_AUTHORIZATION_REQUIRED';
  // The original content generator records a precise classified provider
  // failure before any publication side effect. A 429 billing refusal must
  // not masquerade as a failed social transport or prompt blind retries.
  if(decision?.delivery_evidence?.artifact_generation_failure?.classification==='PROVIDER_BILLING')
    return 'CONTENT_GENERATION_BILLING_ACTION_REQUIRED';
  if(error.startsWith('GLOBAL_POST_DUPLICATE_BLOCKED'))return 'DISTINCT_VERIFIED_STORY_REQUIRED';
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
    const isFailed=['FAILED','BLOCKED'].includes(str(obligation?.status))
      ||str(decision?.state)==='blocked';
    // Missing decision is itself a recovery obligation: never silently skip a lane.
    const isMissingSchedule=!isScheduled;
    const code=isMissingSchedule?'PUBLICATION_SCHEDULE_MISSING':reasonFor(entry.channel,obligation,decision);
    const item={
      channel:entry.channel,
      owner:code==='MIRA_UNIQUE_SOURCE_WINNER_REQUIRED'
        ? 'powerhouse-mira-public-problem-source-agent / original-daily-winner-selector'
        : entry.owner, code,
      action:REMEDIATION[code], scheduledFor:isScheduled?new Date(scheduleMs).toISOString():null,
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
