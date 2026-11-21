// Original commercial composer: human-readability and observed-intent pre-send guard.
// This evaluates COPY only. Existing consent, suppression, source, idempotency,
// provider acknowledgement and revenue truth gates remain mandatory.
const clean=value=>String(value??'').trim();
const fold=value=>clean(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

const INTERNAL_COPY=[
  ['INTERNAL_EDITORIAL_LABEL',/(?:^|\n)\s*(?:observatie|oorzaak|praktische les|beperking|hypothese|alternatief|eerlijk alternatief)\s*:/im],
  ['PARENTHETICAL_EDITORIAL_LABEL',/\((?:probleem|oorzaak|hypothese|praktische les|beperking|alternatief)\)/i],
  ['METHODOLOGY_LEAK',/\b(?:verkennende hypothese|verkennende suggestie|geen gemeten uitkomst|geen interne analyse|niet op interne data|ik baseer (?:me|mij) alleen op)\b/i],
  ['FAKE_ALTERNATIVE',/\b(?:alternatief|eerlijk alternatief)\s*(?::|is)?\s*(?:niets|niks)\s+doen\b/i],
  ['EMPTY_TWO_OBSERVATIONS_CTA',/\bmag ik (?:je |u )?(?:twee|2) (?:concrete |korte )?observaties? sturen\b/i],
  ['ROBOT_SIGNATURE',/\b(?:human commercial composer|editorial council|sales play optimizer)\b/i],
  ['BROKEN_NATURAL_DUTCH',/\bvraag ik me iets voor\b/i],
  ['FAKE_NO_MEETING_ASSURANCE',/\bzonder vervolgafspraak\b/i]
];

export function inferObservedOutreachIntent(action={},plan={}){
  const evidence=action?.evidence||{};
  if(clean(evidence?.inbound?.message)||clean(evidence?.reply_text))return 'REPLY_TO_CONTACT';
  if(clean(plan?.play_key).toLowerCase().includes('followup'))return 'FOLLOWUP_WITH_NEW_FACT';
  if(evidence?.relationship_evidence?.linkedin_connection?.verified===true)return 'LINKEDIN_CONNECTION_RECONNECT';
  if(clean(evidence?.relationship_evidence?.previous_exchange)||
     clean(evidence?.relationship_evidence?.specific_conversation))return 'WARM_RECONNECT';
  return 'FIRST_CONTACT';
}

export function hasSubstantiveOutreachEvidence(action={}){
  const ev=action?.evidence||{},pub=ev?.public_source_evidence?.evidence||{},rel=ev?.relationship_evidence||{};
  // Job title, company name and LinkedIn URL alone cannot evidence a prospect's
  // internal problem, nor produce a unique reason to interrupt their inbox.
  if(rel?.linkedin_connection?.verified===true&&clean(rel.linkedin_connection?.connected_on))return true;
  const anchors=[
    pub.headline,pub.summary,pub.observed_fact,pub.excerpt,
    ev.headline,ev.summary,ev.inbound?.message,ev.reply_text,
    rel.previous_exchange,rel.specific_conversation,rel.recent_public_post,
    rel.confirmed_event,rel.requested_information
  ];
  const identities=[action.role,action.company_name,action.person_name].map(fold).filter(Boolean);
  return anchors.some(value=>{
    const valueNorm=fold(value);
    return valueNorm.length>=18&&!identities.includes(valueNorm)&&
      !identities.some(identity=>valueNorm===identity+' linkedin'||valueNorm==='linkedin '+identity);
  });
}

export function assessHumanOutreachCopy(action={},plan={},output={}){
  const message=clean(output?.message),subject=clean(output?.subject);
  const intent=inferObservedOutreachIntent(action,plan);
  const reasons=INTERNAL_COPY.filter(([,pattern])=>pattern.test(message)).map(([code])=>code);
  if(/^(?:een )?korte? observatie\b/i.test(subject))reasons.push('GENERIC_SUBJECT');
  if(intent==='FIRST_CONTACT'&&!hasSubstantiveOutreachEvidence(action))reasons.push('ROLE_ONLY_CONTEXT');
  if(intent==='LINKEDIN_CONNECTION_RECONNECT'){
    if(!/\blinkedin\b/i.test(message))reasons.push('LINKEDIN_CONNECTION_NOT_ACKNOWLEDGED');
    if(!/\b(?:ik (?:ben|heb)|mijn)\b[\s\S]{0,90}\b(?:bedrijfsgeheugen|bedrijf)\b/i.test(message)||
       !/\b(?:gestart|begonnen|opgericht|opgestart|opgezet)\b/i.test(message))reasons.push('FOUNDER_INTRODUCTION_MISSING');
    if(/\b(?:we kennen elkaar|we hebben elkaar gesproken|goed dat we elkaar kennen)\b/i.test(message)&&
      !clean(action?.evidence?.relationship_evidence?.specific_conversation))reasons.push('UNVERIFIED_PERSONAL_FAMILIARITY');
  }
  if(/\n\s*(?:groet(?:en)?|met vriendelijke groet|hartelijke groeten)\s*[,!]?\s*\n[\s\S]{0,90}\b(?:Arthur|Bedrijfsgeheugen)\b/i.test(message))reasons.push('INLINE_SIGNATURE_DUPLICATION');
  const anchor=fold(output?.personalization_anchor),role=fold(action?.role),company=fold(action?.company_name);
  if(intent==='FIRST_CONTACT'&&anchor&&(anchor===role||anchor===company))reasons.push('ROLE_ONLY_PERSONALIZATION_ANCHOR');
  return {passed:reasons.length===0,intent,reasons};
}
