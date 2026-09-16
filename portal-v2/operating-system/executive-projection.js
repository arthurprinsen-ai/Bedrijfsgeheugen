import {evidenceHealth,normalizeEvidenceEnvelope} from './contracts.js';

const ROLE_SECTIONS=Object.freeze({
 directie:['changes','priorities','forecast','actions','value','progress','evidence','learning'],
 finance:['value','risks','forecast','actions','evidence','progress','learning','changes'],
 sales:['opportunities','forecast','actions','value','changes','evidence','learning','progress'],
 operations:['changes','risks','actions','progress','value','evidence','forecast','learning'],
 'it-data':['evidence','risks','changes','actions','progress','learning','forecast','value'],
 investor:['value','risks','forecast','progress','evidence','opportunities','learning','changes']
});
const arr=value=>Array.isArray(value)?value:[];
const num=value=>Number.isFinite(Number(value))?Number(value):null;

function safeEvidence(items,tenantId,now){
 return arr(items).map(item=>{try{const envelope=normalizeEvidenceEnvelope(item,tenantId);return Object.freeze({...item,evidence_health:evidenceHealth(envelope,{now})});}catch{return Object.freeze({...item,evidence_health:Object.freeze({status:'unavailable',confidence:0,stale:true})});}});
}
function priority(item){return Number(item?.priority??item?.score??0)||0;}

export function buildExecutiveProjection(state={}, {role='directie',tenantId,now=Date.now()}={}){
 if(!tenantId)throw new Error('TENANT_SCOPE_REQUIRED');
 const source=state?.powerhouse?.executive;
 const sections=ROLE_SECTIONS[role]||ROLE_SECTIONS.directie;
 if(!source||typeof source!=='object')return Object.freeze({available:false,role,sections,health_score:null,strategy_progress:null,risks:[],opportunities:[],next_best_actions:[],outcomes:[],changes:[],forecasts:[],evidence_health:Object.freeze({healthy:0,stale:0,low_confidence:0,unavailable:0,total:0})});
 const risks=safeEvidence(source.risks,tenantId,now),opportunities=safeEvidence(source.opportunities,tenantId,now),actions=safeEvidence(source.next_best_actions,tenantId,now).sort((a,b)=>priority(b)-priority(a)).slice(0,5),outcomes=safeEvidence(source.outcomes,tenantId,now),changes=safeEvidence(source.changes,tenantId,now),forecasts=safeEvidence(source.forecasts,tenantId,now);
 const evidence=[...risks,...opportunities,...actions,...outcomes,...changes,...forecasts];
 const health={healthy:0,stale:0,low_confidence:0,unavailable:0,total:evidence.length};
 for(const item of evidence){const status=item.evidence_health.status;if(status==='healthy')health.healthy++;else if(status==='stale')health.stale++;else if(status==='low-confidence')health.low_confidence++;else health.unavailable++;}
 return Object.freeze({available:true,role,sections,health_score:num(source.health_score),strategy_progress:num(source.strategy_progress),risks,opportunities,next_best_actions:actions,outcomes,changes,forecasts,evidence_health:Object.freeze(health)});
}
