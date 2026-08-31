const arr=v=>Array.isArray(v)?v:[];
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const descTime=(a,b)=>String(b?.observedAt||'').localeCompare(String(a?.observedAt||''));
export function buildExecutiveCockpit(projection,{now=new Date().toISOString()}={}){
  if(!projection?.tenantId) throw new TypeError('canonical projection required');
  const records=arr(projection.records);
  const graphEntities=arr(projection.businessGraph?.entities);
  const kpis=graphEntities.filter(x=>x?.payload?.entityType==='kpi');
  const riskEntities=graphEntities.filter(x=>x?.payload?.entityType==='risk');
  const integrationSummary=projection.integrationHealth?.summary||{};
  const degraded=num(integrationSummary.degraded)+num(integrationSummary.blocked)+num(integrationSummary.unknown);
  const openLoops=num(projection.loopSummary?.incomplete);
  const kpiHealth=kpis.length?kpis.reduce((s,x)=>s+num(x?.payload?.health),0)/kpis.length:1;
  const riskScore=riskEntities.length?Math.max(...riskEntities.map(x=>num(x?.payload?.severity))):0;
  const healthScore=Math.max(0,Math.min(1,(kpiHealth*.6)+((1-riskScore)*.25)+((degraded===0?1:Math.max(0,1-(degraded/Math.max(1,num(integrationSummary.total)))))*.15)));
  const businessHealth={score:Number(healthScore.toFixed(3)),status:healthScore>=.8&&openLoops===0?'HEALTHY':healthScore>=.6?'ATTENTION':'AT_RISK',kpis:kpis.length,risks:riskEntities.length,openLoops};
  const opportunities=records.filter(r=>r?.type==='Opportunity'||r?.kind==='opportunity').sort(descTime);
  const threats=records.filter(r=>(r?.type==='Signal'||r?.kind==='signal')&&String(r?.payload?.classification||'').toLowerCase()==='threat').sort(descTime);
  const roadmap=records.filter(r=>r?.type==='Action'||r?.kind==='action').sort(descTime).map(r=>({id:r.id,subjectId:r.subjectId,owner:r.owner,status:r.status,observedAt:r.observedAt,recommendation:r.payload?.recommendation||null,evidenceIds:arr(r.evidenceIds)}));
  const recommendedActions=arr(projection.prioritizedAdvice).map(x=>({...x}));
  const activityTimeline=records.filter(r=>['Action','Execution','Verification','Value','Learning','Memory'].includes(r?.type)).sort(descTime).slice(0,100);
  const managementSummary={asOf:now,businessHealth:businessHealth.status,verifiedValue:{...(projection.verifiedValue?.totals||{})},topRecommendations:recommendedActions.slice(0,5),openLoops,integrations:{...(integrationSummary||{})},memoryFreshness:{...(projection.livingMemory?.summary||{})}};
  return Object.freeze({schemaVersion:'brain-executive-cockpit.v1',tenantId:String(projection.tenantId),managementSummary:Object.freeze(managementSummary),businessHealth:Object.freeze(businessHealth),opportunities:Object.freeze(opportunities),threats:Object.freeze(threats),roadmap:Object.freeze(roadmap),recommendedActions:Object.freeze(recommendedActions),activityTimeline:Object.freeze(activityTimeline),integrations:projection.integrationHealth||{components:[],summary:{}},openLoops});
}
