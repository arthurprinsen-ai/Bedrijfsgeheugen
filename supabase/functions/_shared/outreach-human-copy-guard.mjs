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
  // First-degree LinkedIn membership is a genuine relationship fact, but no
  // proof that a particular business problem is relevant to that person.
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
  if(intent==='LINKEDIN_CONNECTION_RECONNECT'&&!hasSubstantiveOutreachEvidence(action))
    reasons.push('LINKEDIN_RELATIONSHIP_ONLY_CONTEXT');
  if((message.match(/\?/g)||[]).length>1)reasons.push('MULTIPLE_UNRELATED_QUESTIONS');
  if(['FIRST_CONTACT','LINKEDIN_CONNECTION_RECONNECT'].includes(intent)&&
    /(?:kunnen we|zullen we|boek|plan|inplannen|afspreken).{0,65}(?:meeting|afspraak|call|gesprek|kennismaking)/i.test(message))
    reasons.push('PUSHY_MEETING_CTA_FIRST_TOUCH');
  if(intent==='LINKEDIN_CONNECTION_RECONNECT'){
    if(!/\blinkedin\b/i.test(message))reasons.push('LINKEDIN_CONNECTION_NOT_ACKNOWLEDGED');
    const founder=/\b(?:gestart|begonnen|opgericht|opgestart|opgezet)\b/i.test(message) &&
      /\b(?:bedrijfsgeheugen|mijn bedrijf)\b/i.test(message);
    if(!founder)reasons.push('FOUNDER_INTRODUCTION_MISSING');
    if(/\b(?:we kennen elkaar|we hebben elkaar gesproken|goed dat we elkaar kennen)\b/i.test(message)&&
      !clean(action?.evidence?.relationship_evidence?.specific_conversation))reasons.push('UNVERIFIED_PERSONAL_FAMILIARITY');
  }
  if(/\n\s*(?:groet(?:en)?|met vriendelijke groet|hartelijke groeten)\s*[,!]?\s*\n[\s\S]{0,90}\b(?:Arthur|Bedrijfsgeheugen)\b/i.test(message))reasons.push('INLINE_SIGNATURE_DUPLICATION');
  const anchor=fold(output?.personalization_anchor),role=fold(action?.role),company=fold(action?.company_name);
  if(intent==='FIRST_CONTACT'&&anchor&&(anchor===role||anchor===company))reasons.push('ROLE_ONLY_PERSONALIZATION_ANCHOR');
  return {passed:reasons.length===0,intent,reasons};
}


// Marketing-mail authority is separate from CRM operator approval and from
// LinkedIn first-degree membership. External consent/exception evidence must
// be recorded for this exact e-mail purpose and source. Never infer permission
// from employee title, company address, user instruction or LinkedIn export.
export function hasDocumentedCommercialEmailAuthority(extra={}){
  if(!extra||typeof extra!=='object'||extra.approval_revoked===true||
    (extra.approval_revoked&&typeof extra.approval_revoked==='object'&&Object.keys(extra.approval_revoked).length>0))return false;
  const p=extra.email_marketing_permission;
  if(!p||typeof p!=='object'||p.revoked===true||p.status==='revoked')return false;
  const observedAt=Date.parse(clean(p.observed_at||p.granted_at||p.recorded_at));
  if(!Number.isFinite(observedAt)||observedAt>Date.now())return false;
  if(clean(p.evidence_ref).length<12)return false;
  if(p.basis==='explicit_opt_in')
    return p.granted===true&&p.purpose==='commercial_email';
  if(p.basis==='existing_customer_soft_opt_in')
    return p.existing_customer_verified===true&&
      p.similar_products_or_services===true&&
      p.opt_out_offered_at_collection===true&&
      p.opt_out_available_now===true&&clean(p.transaction_ref).length>=5;
  return false;
}

// Segment hints change editorial relevance ONLY; they do not prove a buyer
// pain, predict interest, raise send volume or change sender permissions.
export function classifyFounderOutreachSegment(action={}){
  const role=fold(action.role||action.evidence?.relationship_evidence?.role);
  if(/(?:cfo|chief financial|controller|finance|financieel|accountan|treasurer)/.test(role))return 'FINANCE';
  if(/(?:cto|cio|chief technology|it manager|data|analytics|bi lead|informatie|innovation|innovatie|digital|technology)/.test(role))return 'DATA_IT_INNOVATION';
  if(/(?:hr|human resources|people|talent|operations|operatie|operationeel|procesmanager|organisatieontwikkeling)/.test(role))return 'HR_OPERATIONS';
  if(/(?:ceo|chief executive|directeur|ondernemer|eigenaar|founder|oprichter|managing director|bestuurder)/.test(role))return 'FOUNDER_LEADERSHIP';
  return 'GENERAL_UNVERIFIED';
}
