/**
 * Eén bewijsvaste commerciële kwalificatie voor de bestaande dagelijkse Brain-lus.
 * Observeer en adviseer; nooit zelf contact, order of omzet materialiseren.
 */
import { deriveNeedProfile } from './need-discovery.mjs';

const txt=v=>String(v??'').trim();
const arr=v=>Array.isArray(v)?v:[];
const asObject=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
const validAt=(value,now,maxAgeDays=90)=>{
  const timestamp=Date.parse(value||'');
  return Number.isFinite(timestamp)&&timestamp<=now&&timestamp>=now-maxAgeDays*86400000;
};
const hasRef=v=>typeof v==='string'&&v.trim().length>=7;
const verifiedFact=(value,now)=>{const f=asObject(value);return f.verified===true&&hasRef(f.source_ref)&&validAt(f.observed_at,now);};
const OUTCOME_STAGE=Object.freeze({
  reply:'reply',reply_received:'reply',qualified_lead:'request',lead_request:'request',
  scan_submitted:'request',meeting:'meeting',meeting_booked:'meeting',
  proposal:'proposal',proposal_sent:'proposal',quote_requested:'proposal',
  paid_order:'order',order_confirmed:'order',closed_won:'order'
});
const ORDER_TYPES=new Set(['paid_order','order_confirmed','closed_won']);
function verifiedOutcome(row,opportunityKey,now){
  if(!opportunityKey||txt(row?.opportunity_key)!==opportunityKey)return null;
  const type=txt(row?.outcome_type).toLowerCase(),stage=OUTCOME_STAGE[type];
  if(!stage||!validAt(row?.occurred_at,now,365))return null;
  const evidence=asObject(row?.evidence);
  const ref=evidence.provider_receipt_id||evidence.provider_event_id||evidence.provider_id||
    evidence.order_receipt_id||evidence.order_id||evidence.payment_receipt_id;
  // "executed_at", a guessed stage and generic event IDs are never provider proof.
  if(!hasRef(ref)||(evidence.verified!==true&&evidence.provider_verified!==true))return null;
  const id=txt(row?.outcome_id||row?.dedupe_key||ref);
  if(!id)return null;
  return {id,stage,type,ref:txt(ref),occurredAt:row.occurred_at,
    revenueEur:ORDER_TYPES.has(type)&&evidence.payment_confirmed===true&&hasRef(evidence.payment_receipt_id)&&finite(row.revenue_eur)&&Number(row.revenue_eur)>0
      ?Number(row.revenue_eur):null};
}

/**
 * Do not use profile intent guesses, engagement counts, prospect news, or €2900
 * entry-offer assumptions as a customer-confirmed buying signal.
 */
export function qualifyCommercialOpportunity(opportunity={}, {salesOutcomes=[],now=new Date().toISOString()}={}){
  const nowMs=new Date(now).getTime();
  if(!Number.isFinite(nowMs))throw new TypeError('Valid assessment time required');
  const key=txt(opportunity.opportunity_key);
  if(!key)throw new TypeError('Canonical opportunity_key required');
  const evidence=asObject(opportunity.evidence);
  const verifiedDiscovery=verifiedFact(evidence.need_discovery_proof,nowMs);
  const need=deriveNeedProfile(verifiedDiscovery?asObject(evidence.need_discovery):{});
  const confirmedNeed=verifiedDiscovery&&need.problemConfirmed&&need.impactConfirmed&&need.urgencyConfirmed;
  const confirmedBuyer=verifiedFact(evidence.decision_maker_proof,nowMs)&&need.decisionReady;
  const offerFit=verifiedFact(evidence.offer_fit_proof,nowMs)&&hasRef(evidence.offer_fit_proof.offer_key);
  const budget=verifiedFact(evidence.budget_proof,nowMs);
  const suppression=evidence.contact_suppressed===true||evidence.opted_out===true;
  const exactRows=arr(salesOutcomes).map(o=>verifiedOutcome(o,key,nowMs)).filter(Boolean);
  const unique=[...new Map(exactRows.map(o=>[o.id,o])).values()];
  const funnel=Object.freeze(Object.fromEntries(['reply','request','meeting','proposal','order'].map(
    stage=>[stage,unique.filter(o=>o.stage===stage).length])));
  const observedRevenue=unique.reduce((sum,o)=>sum+(o.revenueEur||0),0);
  const hasProposal=funnel.proposal>0,hasOrder=funnel.order>0;
  const firstPartyIntent=unique.some(o=>['request','meeting','proposal','order'].includes(o.stage));
  const missing=[];
  if(!verifiedDiscovery||!need.problemConfirmed)missing.push('confirmed_problem_with_source');
  if(!verifiedDiscovery||!need.impactConfirmed)missing.push('measured_business_impact');
  if(!verifiedDiscovery||!need.urgencyConfirmed)missing.push('verified_timing');
  if(!offerFit)missing.push('product_or_service_fit');
  if(!confirmedBuyer)missing.push('decision_maker_or_process');
  if(!budget)missing.push('budget_or_investment_process');
  if(!firstPartyIntent)missing.push('verified_first_party_buying_signal');
  if(!hasOrder)missing.push('order_or_win_receipt');
  if(observedRevenue<=0)missing.push('verified_payment_and_revenue');
  let classification='RESEARCH_REQUIRED';
  if(suppression)classification='NO_CONTACT';
  else if(hasOrder)classification='ORDER_OBSERVED';
  else if(confirmedNeed&&offerFit&&confirmedBuyer&&budget&&hasProposal&&firstPartyIntent)classification='PROPOSAL_FOLLOW_UP';
  else if(confirmedNeed&&offerFit&&confirmedBuyer&&budget&&firstPartyIntent)classification='PROPOSAL_CANDIDATE';
  else if(confirmedNeed&&offerFit)classification='DISCOVERY_CANDIDATE';
  // First choose a missing evidence task, not a speculative outbound send.
  let nextAction='VERIFY_CUSTOMER_PROBLEM';
  if(suppression)nextAction='SUPPRESS_EXTERNAL_CONTACT';
  else if(hasOrder)nextAction=observedRevenue>0?'MEASURE_REALIZED_RESULT_AND_LEARN':'VERIFY_PAYMENT_AND_INVOICE';
  else if(classification==='PROPOSAL_FOLLOW_UP')nextAction='REVIEW_PROPOSAL_WITH_AUTHORIZED_CHANNEL';
  else if(classification==='PROPOSAL_CANDIDATE')nextAction='PREPARE_EVIDENCE_BACKED_PROPOSAL';
  else if(!confirmedNeed)nextAction='VERIFY_NEED_IMPACT_AND_URGENCY';
  else if(!offerFit)nextAction='VERIFY_SOLUTION_FIT';
  else if(!confirmedBuyer)nextAction='IDENTIFY_DECISION_MAKER';
  else if(!budget)nextAction='VALIDATE_INVESTMENT_PROCESS';
  else nextAction='VALIDATE_FIRST_PARTY_INTENT';
  const weighted=(confirmedNeed?30:0)+(offerFit?20:0)+(confirmedBuyer?15:0)+(budget?10:0)
    +(funnel.request>0?10:0)+(funnel.meeting>0?10:0)+(funnel.proposal>0?15:0)+(hasOrder?30:0);
  const qualificationScore=suppression?0:Math.min(100,weighted);
  const knownExpected=verifiedFact(evidence.value_estimate_proof,nowMs)&&finite(opportunity.expected_value_eur)&&Number(opportunity.expected_value_eur)>=0
    ?Number(opportunity.expected_value_eur):null;
  return Object.freeze({
    opportunityKey:key,companyKey:txt(opportunity.company_key)||null,
    classification,qualificationScore,
    sellable:['PROPOSAL_CANDIDATE','PROPOSAL_FOLLOW_UP'].includes(classification),
    nextAction,missingEvidence:Object.freeze(missing),verifiedFunnel:funnel,
    confirmedProblem:confirmedNeed,confirmedBuyer,verifiedOfferFit:offerFit,
    observedRevenueEur:observedRevenue>0?observedRevenue:null,
    expectedValueEur:knownExpected,
    evidenceRefs:Object.freeze([...new Set(unique.map(x=>x.ref))]),
    observedOutcomeCount:unique.length,
    status:'ASSESSMENT_ONLY_NOT_EXECUTED',
    externalContactAuthorized:false,
    financialTruth:'realized only with exact matched order and verified payment receipt',
    sourcesAnalyzed:'bounded canonical sales-outcome window; absence of observations is not a negative'
  });
}

export function prioritizeCommercialOpportunities(opportunities=[],opts={}){
  const items=arr(opportunities).filter(x=>txt(x?.opportunity_key)&&txt(x?.status)==='open')
    .map(o=>qualifyCommercialOpportunity(o,opts));
  const order={ORDER_OBSERVED:0,PROPOSAL_FOLLOW_UP:1,PROPOSAL_CANDIDATE:2,DISCOVERY_CANDIDATE:3,RESEARCH_REQUIRED:4,NO_CONTACT:5};
  items.sort((a,b)=>order[a.classification]-order[b.classification]||b.qualificationScore-a.qualificationScore||a.opportunityKey.localeCompare(b.opportunityKey));
  const classificationCounts=Object.fromEntries(Object.keys(order).map(k=>[k,items.filter(x=>x.classification===k).length]));
  const missingEvidenceCounts={};
  for(const item of items)for(const gap of item.missingEvidence)missingEvidenceCounts[gap]=(missingEvidenceCounts[gap]||0)+1;
  return Object.freeze({contract:'commercial-opportunity-evidence-v1',analyzed:items.length,
    classificationCounts:Object.freeze(classificationCounts),
    missingEvidenceCounts:Object.freeze(missingEvidenceCounts),
    prioritized:Object.freeze(items),
    readOnly:true,executionAuthority:'existing commercial heartbeat, privacy and provider gates only'});
}
