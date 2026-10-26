/**
 * Adapter contract for the EXISTING Powerhouse Brain/Heartbeat.
 * Feed only consent-aware, aggregated metrics; no credentials and no outbound actions.
 */
import {runGrowthDecisionCycle, evaluateExperiment} from "./decision-core.mjs";
const ACCEPTED = Object.freeze({
 ga4:["page_dropoff","scan_abandonment","cta_underperformance"],
 search_console:["search_opportunity"],
 linkedin:["social_reply","warm_connection"],
 crm:["warm_connection","offer_stalled"],
 payments:["paid_order"]
});
export function ingestSignals(events, {now=Date.now(),maxAgeDays=30}={}) {
 if(!Array.isArray(events)) throw new TypeError("EVENTS_MUST_BE_ARRAY");
 const accepted=[],quarantined=[];
 for(const event of events){
  const kind=event?.provider, signal=event?.signal;
  if(!ACCEPTED[kind]?.includes(signal?.type)){quarantined.push({id:signal?.id??null,reason:"UNSUPPORTED_PROVIDER_SIGNAL"});continue;}
  if(!Number.isFinite(signal.observedAt)||signal.observedAt>now+300000||now-signal.observedAt>maxAgeDays*86400000){
   quarantined.push({id:signal.id??null,reason:"STALE_OR_FUTURE_SIGNAL"});continue;
  }
  if(!event.evidenceId || event.verified!==true){
   quarantined.push({id:signal.id??null,reason:"SOURCE_NOT_VERIFIED"});continue;
  }
  accepted.push({...signal,source:`${kind}:${event.evidenceId}`});
 }
 return {accepted,quarantined};
}
/** Caller persists outcomes in its existing event/learning store. */
export function heartbeatGrowthTick(input,{now=Date.now()}={}){
 const {accepted,quarantined}=ingestSignals(input.events??[],{now});
 const decisions=runGrowthDecisionCycle(accepted,{now});
 const experiments=(input.experiments??[]).map(e=>({
  id:e.id,...evaluateExperiment(e)
 }));
 return {
  schemaVersion:1,generatedAt:now,
  decisionId:`growth-tick:${input.cycleId??now}`,
  opportunities:decisions.proposals,
  rejected:[...quarantined,...decisions.rejected],
  experiments,
  actions:decisions.proposals.map(p=>({
   id:`action:${p.id}`,owner:p.agent,kind:"DESIGN_EXPERIMENT",
   status:"PROPOSED",requiresExistingApprovalAndReadback:true,
   evidenceSource:p.source,learningKey:p.learningKey
  })),
  publishReady:false,
  revenueVerified:false
 };
}


/**
 * Render-safe, tenant-isolated guidance for customer-facing external signals.
 * Existing Heartbeat supplies already verified, lawful source observations.
 * This function does not fetch, contact prospects, mutate state or claim revenue.
 */
const CUSTOMER_GUIDANCE=Object.freeze({
 search_opportunity:{title:"Zoekvraag in de markt",action:"Beoordeel een gerichte landingspagina en meet offerteaanvragen"},
 page_dropoff:{title:"Uitval op website",action:"Onderzoek de uitval en test één duidelijke vervolgstap"},
 scan_abandonment:{title:"Scan niet afgerond",action:"Verbeter de scan en bied vrijwillige opvolging aan"},
 cta_underperformance:{title:"Weinig aanvragen",action:"Test een concretere call-to-action en meet conversie"},
 social_reply:{title:"Relevante reactie",action:"Beoordeel de reactie; antwoord alleen vanuit een geldige contactbasis"},
 warm_connection:{title:"Mogelijke klantrelatie",action:"Kwalificeer de behoefte; geen ongevraagde berichten"},
 offer_stalled:{title:"Offerte wacht op vervolg",action:"Controleer opvolgmoment en toestemming"},
 paid_order:{title:"Betaalde order",action:"Controleer onafhankelijk betalingsbewijs vóór omzetregistratie"}
});
export function createCustomerSignalCards(events,{tenantId,now=Date.now(),maxAgeDays=30}={}){
 if(typeof tenantId!=="string"||!tenantId.trim())throw new Error("TENANT_REQUIRED");
 const {accepted,quarantined}=ingestSignals(events,{now,maxAgeDays});
 const cards=[],rejected=[...quarantined],seen=new Set();
 for(const signal of accepted){
  if(signal.tenantId!==tenantId){rejected.push({id:signal.id,reason:"TENANT_SCOPE_MISMATCH"});continue;}
  if(signal.containsPersonalData===true && signal.consentOrBasisVerified!==true){rejected.push({id:signal.id,reason:"PERSONAL_DATA_GUARD"});continue;}
  if(signal.type==="paid_order" && signal.independentPaymentVerified!==true){rejected.push({id:signal.id,reason:"PAYMENT_PROOF_REQUIRED"});continue;}
  const key=signal.source+":"+signal.id;
  if(seen.has(key))continue;
  seen.add(key);
  const guidance=CUSTOMER_GUIDANCE[signal.type];
  cards.push(Object.freeze({
   id:key,tenantId,category:signal.type,title:guidance.title,
   whyRelevant:typeof signal.relevanceExplanation==="string" && signal.relevanceExplanation.trim()?signal.relevanceExplanation.slice(0,500):"Vereist beoordeling tegen de actuele bedrijfscontext",
   recommendedAction:guidance.action,sourceEvidence:signal.source,
   observedAt:new Date(signal.observedAt).toISOString(),
   status:"ADVISORY_UNVERIFIED_OUTCOME",automatedActionAllowed:false
  }));
 }
 return {schemaVersion:1,tenantId,cards,rejected};
}
