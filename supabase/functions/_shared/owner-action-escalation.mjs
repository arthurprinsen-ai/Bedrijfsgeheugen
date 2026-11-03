// ONE BRAIN original supervisor: pure, source-backed human-only escalation plan.
// Never creates a publisher, sends email, grants OAuth or reports a notification sent.
// The existing scheduled owner-facing Powerhouse agent consumes the persisted plan.
export const OWNER_ACTION_ESCALATION_CONTRACT='one-brain-owner-action-escalation-v1';
const clean=value=>typeof value==='string'?value.trim():'';
const OWNER_ONLY_CODES=new Set([
  'EMAIL_CANONICAL_AUTHORIZATION_REQUIRED',
  'CONTENT_GENERATION_BILLING_ACTION_REQUIRED',
  'CHANNEL_CAPABILITY_PROOF_REQUIRED'
]);
const PUBLIC_ACTIONS=Object.freeze({
  EMAIL_CANONICAL_AUTHORIZATION_REQUIRED:'Activeer de bestaande geautoriseerde e-mailverzendbevoegdheid en bevestig ontvanger-opt-in en suppressie; geen nieuw verzendsysteem.',
  CONTENT_GENERATION_BILLING_ACTION_REQUIRED:'Herstel zelf het tegoed of de betaalinstellingen van de bestaande AI-provider; agents mogen geen betaling doen.',
  CHANNEL_CAPABILITY_PROOF_REQUIRED:'Open de originele providerconnectie, keur de benodigde machtigingen goed en laat dezelfde kanaaleigenaar opnieuw verifiëren.',
  LINKEDIN_COMPANY_ADMIN_OAUTH_REQUIRED:'Herstel de bestaande organisatie-OAuth via de geverifieerde originele reconnect-link, met organisatiebeheerders- en publicatierechten.'
});
const ORGANIZATION_AUTH_ERROR=/LINKEDIN_(?:COMPANY|ORG).*?(?:AUTH|OAUTH|REAUTH)|(?:COMPANY|ORG).*?OAUTH.*?REQUIRED/iu;
function currentLinkedInVerified(state){
  return state?.company_ready===true && (
    state?.company_oauth_fresh_verified===true ||
    state?.company_oauth_fresh_verified==='true'
  );
}
function unexpiredHttps(value,expires,nowMs){
  const uri=clean(value);
  if(!/^https:\/\//i.test(uri) || uri.length>1200 || !uri.startsWith('https://connect.composio.dev/'))return null;
  const exp=Date.parse(clean(expires));
  return Number.isFinite(exp)&&exp>nowMs+60_000?uri:null;
}
export function planOwnerActionEscalations({
  runDate,now=new Date().toISOString(),recovery,decisions=[],obligations=[],
  linkedinPreflight=null,ownerLink=null
}={}){
  const nowMs=Date.parse(now);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(clean(runDate))||!Number.isFinite(nowMs)
    ||recovery?.contract!=='one-brain-publication-no-silent-gap-v1'
    ||!Array.isArray(recovery?.overdue)||!Array.isArray(decisions)||!Array.isArray(obligations)){
    return {contract:OWNER_ACTION_ESCALATION_CONTRACT,status:'UNVERIFIED',owner_action_due:[],notification_sent:false};
  }
  const ds=new Map(decisions.map(d=>[clean(d?.channel),d]));
  const os=new Map(obligations.map(o=>[clean(o?.channel),o]));
  const items=[],seen=new Set();
  for(const entry of recovery.overdue){
    const channel=clean(entry?.channel),code=clean(entry?.code);
    if(!channel||seen.has(channel)||entry?.status!=='REQUIRES_RECOVERY')continue;
    const decision=ds.get(channel==='instagram'?'instagram_company':channel);
    const obligation=os.get(channel);
    if(clean(obligation?.external_id)||clean(decision?.delivery_ref))continue;
    const reason=clean(decision?.delivery_evidence?.provider_error||decision?.delivery_evidence?.error||'');
    let actionCode=OWNER_ONLY_CODES.has(code)&&entry?.requiresAuthorization===true?code:null;
    if(channel==='linkedin_company'&&ORGANIZATION_AUTH_ERROR.test(reason))
      actionCode='LINKEDIN_COMPANY_ADMIN_OAUTH_REQUIRED';
    // A source-confirmed current OAuth state outranks stale historical 403 or
    // a now-reopened duplicate incident. Do not re-notify for fixed permissions.
    if(channel==='linkedin_company'&&currentLinkedInVerified(linkedinPreflight))
      actionCode=null;
    // Generic missing media, duplicate posts, pending public proof, unapproved
    // blog and editorial failure belong to the original agents, not the owner.
    if(!actionCode)continue;
    seen.add(channel);
    const key='owner-action:'+actionCode+':'+channel;
    const directUrl=actionCode==='LINKEDIN_COMPANY_ADMIN_OAUTH_REQUIRED'
      ? unexpiredHttps(ownerLink?.url,ownerLink?.expires_at,nowMs):null;
    items.push(Object.freeze({
      notification_key:key,channel,code:actionCode,owner:clean(entry.owner)||'original-provider-owner',
      severity:'ACTION_REQUIRED',source_status:clean(obligation?.status)||'UNVERIFIED',
      scheduled_for:entry.scheduledFor||null,
      human_action:PUBLIC_ACTIONS[actionCode],action_url:directUrl,
      incident_url:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232',
      dedupe_window_hours:24,notification_sent:false,
      notification_proof:'NOT_SENT_BY_CLASSIFIER',
      next_step:'EXISTING_AGENT_RECHECK_SOURCE_AFTER_HUMAN_CONSENT'
    }));
  }
  return {
    contract:OWNER_ACTION_ESCALATION_CONTRACT,run_date:runDate,
    status:items.length?'OWNER_ACTION_REQUIRED':'NO_OWNER_ACTION_REQUIRED',
    owner_action_due:items,notification_sent:false,
    auto_fix_still_required:recovery.overdue.length-items.length,
    truth_boundary:'Persisted plan and ChatGPT task notification are not proof of an email or resolved provider.'
  };
}
