import {intelligenceToImpact} from './lifecycle.mjs';
const allowedDomains=new Set(['market','competitor','customer','technology','regulation','seo']);
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));

export function buildExternalIntelligencePlan(input,{impactId}={}){
  if(!input?.tenantId||!input?.signalId||!input?.subjectId) throw new TypeError('intelligence identity required');
  const domain=String(input.domain||'').toLowerCase();
  if(!allowedDomains.has(domain)) throw new Error('unsupported intelligence domain');
  const owner=String(input.owner||'').trim();
  if(!owner||owner==='UNASSIGNED') throw new Error('intelligence owner required');
  const evidence=(Array.isArray(input.evidence)?input.evidence:[]).filter(x=>x?.verified===true&&x?.id);
  if(evidence.length===0) throw new Error('verified evidence required');
  if(!input.signal?.recommendation) throw new Error('recommendation required');
  const evidenceIds=evidence.map(x=>String(x.id));
  const signal={tenantId:String(input.tenantId),type:'Signal',id:String(input.signalId),subjectId:String(input.subjectId),correlationId:input.correlationId||String(input.signalId),predecessorIds:evidenceIds,owner,status:'VERIFIED',evidenceIds,payload:{domain,summary:input.signal.summary||null,confidence:clamp(input.signal.confidence),urgency:clamp(input.signal.urgency),impact:clamp(input.signal.impact),recommendation:String(input.signal.recommendation)}};
  const impact=intelligenceToImpact(signal,{id:impactId||`${input.signalId}:impact`,owner,impactScore:signal.payload.impact,payload:{domain,confidence:signal.payload.confidence,urgency:signal.payload.urgency}});
  const priorityScore=signal.payload.impact*signal.payload.confidence*signal.payload.urgency;
  const advice={sourceId:signal.id,subjectId:signal.subjectId,correlationId:signal.correlationId,predecessorIds:[impact.id],owner,evidenceIds:[...evidenceIds],recommendation:signal.payload.recommendation,impact:signal.payload.impact,confidence:signal.payload.confidence,urgency:signal.payload.urgency,priorityScore};
  return Object.freeze({schemaVersion:'brain-external-intelligence.v1',status:'READY',domain,signal:Object.freeze(signal),impact:Object.freeze(impact),advice:Object.freeze(advice),evidence:Object.freeze(evidence.map(x=>Object.freeze({...x})))});
}
