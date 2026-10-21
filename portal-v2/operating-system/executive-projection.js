import {evidenceHealth,normalizeEvidenceEnvelope} from './contracts.js';

const ROLE_SECTIONS=Object.freeze({
 directie:['attention','decisions','changes','priorities','forecast','actions','value','progress','evidence','learning'],
 ceo:['attention','decisions','value','risks','forecast','progress','opportunities','evidence','learning','changes'],
 mt:['attention','decisions','progress','risks','actions','changes','forecast','value','evidence','learning'],
 dt:['attention','decisions','risks','progress','actions','forecast','changes','value','evidence','learning'],
 finance:['value','risks','forecast','actions','evidence','progress','learning','changes'],
 sales:['opportunities','forecast','actions','value','changes','evidence','learning','progress'],
 operations:['changes','risks','actions','progress','value','evidence','forecast','learning'],
 'it-data':['evidence','risks','changes','actions','progress','learning','forecast','value'],
 investor:['value','risks','forecast','progress','evidence','opportunities','learning','changes']
});
const ROLE_LABELS=Object.freeze({directie:'Directie',ceo:'CEO',mt:'MT',dt:'DT',finance:'Finance',sales:'Sales',operations:'Operations','it-data':'IT & Data',investor:'Investeerder'});
const arr=value=>Array.isArray(value)?value:[];
const num=value=>Number.isFinite(Number(value))?Number(value):null;
const txt=value=>String(value??'').trim();

function safeEvidence(items,tenantId,now){
 return arr(items).map(item=>{try{const envelope=normalizeEvidenceEnvelope(item,tenantId);return Object.freeze({...item,evidence_health:evidenceHealth(envelope,{now})});}catch{return Object.freeze({...item,evidence_health:Object.freeze({status:'unavailable',confidence:0,stale:true})});}});
}
function priority(item){return Number(item?.priority??item?.score??item?.severity_score??0)||0;}
const IMPACT_LABELS=new Set(['OBSERVED','ESTIMATED','POTENTIAL']);
function normalizeProblem(item={},tenantId,now){
 const problemId=txt(item.problem_id||item.problemId);
 if(!/^PH-P\d{3}$/.test(problemId))return null;
 const impactLabel=txt(item.impact_label||item.impactLabel||item.impact?.label).toUpperCase();
 const evidence=safeEvidence([item],tenantId,now)[0];
 return Object.freeze({...evidence,
  problem_id:problemId,
  title:txt(item.title||item.name||item.problem_name||problemId),
  impact_label:IMPACT_LABELS.has(impactLabel)?impactLabel:'POTENTIAL',
  impact_value:num(item.impact_value??item.impactValue??item.value),
  root_causes:arr(item.root_causes||item.rootCauses),
  actions:arr(item.actions),
  capabilities:arr(item.capabilities),
  outcome_metrics:arr(item.outcome_metrics||item.outcomes),
  source_refs:arr(item.source_refs||item.evidence_refs||item.evidenceIds),
  confidence:num(item.confidence??item.evidence_health?.confidence)??0,
  symptoms:arr(item.symptoms),
  buying_trigger:txt(item.buying_trigger||item.buyingTrigger),
  sector_or_segment:txt(item.sector_or_segment||item.segment||item.sector),
  source_class:txt(item.source_class||item.sourceClass),
  freshness_status:txt(item.freshness_status||item.freshnessStatus),
  benchmark_context:txt(item.benchmark_context||item.benchmarkContext),
  context_relevance:txt(item.context_relevance||item.relevance_reason||item.relevanceReason),
  priority_dimensions:Object.freeze({
   recency:num(item.priority_dimensions?.recency??item.recency_score),
   scale:num(item.priority_dimensions?.scale??item.scale_score),
   urgency:num(item.priority_dimensions?.urgency??item.urgency_score),
   buying_intent:num(item.priority_dimensions?.buying_intent??item.buying_intent_score),
   powerhouse_relevance:num(item.priority_dimensions?.powerhouse_relevance??item.powerhouse_relevance_score)
  })
 });
}
function needsDecision(item={}){
 const state=txt(item.decision_state||item.approval_state||item.status).toUpperCase();
 return Boolean(item.decision_required||item.requires_decision||item.approval_required||['PROPOSED','PENDING_APPROVAL','DECISION_REQUIRED','AWAITING_DECISION'].includes(state));
}
function urgency(item={}){
 const severity=txt(item.severity||item.impact).toLowerCase();
 const severityBoost=severity==='critical'?1000:severity==='high'?500:severity==='medium'?150:0;
 return severityBoost+priority(item)+(needsDecision(item)?250:0);
}
function attentionReason(item,kind){
 if(needsDecision(item))return 'Besluit nodig';
 if(kind==='risk')return txt(item.severity)?`Risico · ${txt(item.severity)}`:'Risico';
 if(kind==='forecast')return 'Vooruitblik';
 if(kind==='change')return 'Belangrijke verandering';
 return 'Prioriteit';
}
function attentionItems({risks,actions,forecasts,changes}){
 return [
  ...risks.map(item=>({...item,attention_kind:'risk'})),
  ...actions.filter(needsDecision).map(item=>({...item,attention_kind:'decision'})),
  ...forecasts.filter(item=>priority(item)>0||txt(item.severity)).map(item=>({...item,attention_kind:'forecast'})),
  ...changes.filter(item=>priority(item)>0||txt(item.severity)).map(item=>({...item,attention_kind:'change'}))
 ].sort((a,b)=>urgency(b)-urgency(a)).slice(0,3).map(item=>Object.freeze({...item,attention_reason:attentionReason(item,item.attention_kind)}));
}

export function buildExecutiveProjection(state={}, {role='directie',tenantId,now=Date.now()}={}){
 const normalizedRole=ROLE_SECTIONS[role]?role:'directie';
 const source=state?.powerhouse?.executive;
 const sections=ROLE_SECTIONS[normalizedRole];
 const unavailable=Object.freeze({available:false,role:normalizedRole,role_label:ROLE_LABELS[normalizedRole],sections,health_score:null,strategy_progress:null,problems:[],risks:[],opportunities:[],next_best_actions:[],decision_queue:[],attention:[],outcomes:[],changes:[],forecasts:[],evidence_health:Object.freeze({healthy:0,stale:0,low_confidence:0,unavailable:0,total:0})});
 if(!tenantId||!source||typeof source!=='object')return unavailable;
 const problems=arr(source.problems).map(item=>normalizeProblem(item,tenantId,now)).filter(Boolean).sort((a,b)=>urgency(b)-urgency(a)).slice(0,5);
 const risks=safeEvidence(source.risks,tenantId,now).sort((a,b)=>urgency(b)-urgency(a));
 const opportunities=safeEvidence(source.opportunities,tenantId,now).sort((a,b)=>priority(b)-priority(a));
 const actions=safeEvidence(source.next_best_actions,tenantId,now).sort((a,b)=>priority(b)-priority(a)).slice(0,5);
 const outcomes=safeEvidence(source.outcomes,tenantId,now);
 const changes=safeEvidence(source.changes,tenantId,now).sort((a,b)=>urgency(b)-urgency(a));
 const forecasts=safeEvidence(source.forecasts,tenantId,now).sort((a,b)=>urgency(b)-urgency(a));
 const decisions=actions.filter(needsDecision);
 const attention=attentionItems({risks,actions,forecasts,changes});
 const evidence=[...problems,...risks,...opportunities,...actions,...outcomes,...changes,...forecasts];
 const health={healthy:0,stale:0,low_confidence:0,unavailable:0,total:evidence.length};
 for(const item of evidence){const status=item.evidence_health.status;if(status==='healthy')health.healthy++;else if(status==='stale')health.stale++;else if(status==='low-confidence')health.low_confidence++;else health.unavailable++;}
 return Object.freeze({available:true,role:normalizedRole,role_label:ROLE_LABELS[normalizedRole],sections,health_score:num(source.health_score),strategy_progress:num(source.strategy_progress),problems,risks,opportunities,next_best_actions:actions,decision_queue:decisions,attention,outcomes,changes,forecasts,evidence_health:Object.freeze(health)});
}
