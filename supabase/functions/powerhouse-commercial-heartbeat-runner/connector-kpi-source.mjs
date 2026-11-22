/**
 * Original Connector Studio -> Powerhouse Heartbeat read-only KPI evidence gate.
 * Configured/TEST_PASSED is never an ingested provider measurement.
 * A canonical connector execution and independently stored source observation
 * must agree on the tenant, active definition/version, field, revision and proof.
 * This module cannot manufacture provider data, modify portal metrics or send mail.
 */
export const CONNECTOR_KPI_CONTRACT='original-connector-kpi-readback-v1';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIELD=/^[\p{L}_][\p{L}\p{N}_-]{0,79}$/u;
const valid=(v)=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const key=(tenant,id,field,metric)=>[tenant,id.toLowerCase(),field,metric].join('|');
const iso=value=>{const n=Date.parse(value||'');return Number.isFinite(n)?new Date(n).toISOString():null;};
const measured=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
const metricPage=Object.freeze({
  revenue:'cijfers-maatstaven',ebitda:'cijfers-maatstaven',
  grossMargin:'cijfers-maatstaven',dso:'waarde-financiering',
  cash:'waarde-financiering',absence:'mensen',turnover:'mensen',
  leadTime:'processen'
});
const UUID_FIELDS=['connectorId','executionId'];
export function normalizeConnectorRuleSource(source,metricId){
  if(!source||source.type===undefined||source.type==='portal')return {type:'portal'};
  if(source.type!=='connector'||!Object.hasOwn(metricPage,String(metricId)))return null;
  const id=String(source.connectorId||''),field=String(source.field||'');
  if(!UUID.test(id)||!FIELD.test(field)||Object.keys(source).some(k=>!['type','connectorId','field'].includes(k)))return null;
  return Object.freeze({type:'connector',connectorId:id.toLowerCase(),field});
}
function eligibleDefinition(def,tenant,id,field,metricId){
  if(String(def?.organisatie_id||'')!==tenant||String(def?.id||'').toLowerCase()!==id||def?.status!=='Active')return false;
  const cfg=valid(def?.configuratie);
  const use=valid(cfg.dataUse),route=valid(cfg.routing),runtime=valid(cfg.runtime);
  return Number.isInteger(Number(def.versie))&&Number(def.versie)>0
    &&['PORTAL_INSIGHTS','PORTAL_AI'].includes(use.mode)
    &&Array.isArray(route.portalPages)&&route.portalPages.includes(metricPage[metricId])
    &&Array.isArray(route.selectedFields)&&route.selectedFields.includes(field)
    &&runtime.impactReviewPending!==true
    &&!['blocked','revoked'].includes(String(runtime.connectionStatus||'').toLowerCase());
}
function verifiedExecution(ex,def,payload,observation){
  const proof=valid(ex?.evidence);
  return ex?.status==='LIVE_INGEST_VERIFIED'
    &&String(ex?.organisatie_id||'')===String(def?.organisatie_id||'')
    &&String(ex?.connector_id||'').toLowerCase()===String(def?.id||'').toLowerCase()
    &&Number(ex?.connector_versie)===Number(def?.versie)
    &&String(ex?.id||'')===String(payload.executionId||'')
    &&proof.proofLevel==='LIVE_PROVIDER_READBACK'
    &&proof.sourceReadSuccess===true
    &&proof.targetReadbackVerified===true
    &&typeof proof.providerReadId==='string'&&proof.providerReadId.length>=8
    &&proof.providerReadId===payload.providerReadId
    &&typeof proof.sourceRevision==='string'&&proof.sourceRevision.length>=8
    &&proof.sourceRevision===observation?.normalized_source_revision
    &&proof.sourceRevision===payload.sourceRevision;
}
/**
 * Return only eligible values, keyed to tenant + source + exact mapped field
 * and canonical KPI. No fallback to sample, connector metadata or portal data.
 */
export function buildConnectorKpiIndex({definitions=[],executions=[],observations=[],now=new Date().toISOString(),maxAgeDays=7}={}){
  const result=new Map();
  const current=Date.parse(now),ttl=Number(maxAgeDays)*86400000;
  if(!Number.isFinite(current)||!Number.isFinite(ttl)||ttl<86400000||ttl>90*86400000)
    throw Error('CONNECTOR_METRIC_CLOCK_OR_TTL_INVALID');
  const byDef=new Map();
  for(const def of (Array.isArray(definitions)?definitions:[]).slice(0,250)){
    const tenant=String(def?.organisatie_id||''),id=String(def?.id||'').toLowerCase();
    if(UUID.test(tenant)&&UUID.test(id))byDef.set(tenant+'|'+id,def);
  }
  const byExecution=new Map();
  for(const ex of (Array.isArray(executions)?executions:[]).slice(0,400)){
    if(UUID.test(String(ex?.id||'')))byExecution.set(String(ex.id),ex);
  }
  for(const obs of (Array.isArray(observations)?observations:[]).slice(0,500)){
    if(obs?.source_type!=='connector-kpi'||!obs?.raw_payload)continue;
    const payload=valid(obs.raw_payload),tenant=String(obs.tenant_id||'');
    const id=String(payload.connectorId||'').toLowerCase();
    const field=String(payload.sourceField||''),metricId=String(payload.metricId||'');
    if(payload.contract!==CONNECTOR_KPI_CONTRACT||!UUID.test(tenant)||!UUID.test(id)
      ||!FIELD.test(field)||!Object.hasOwn(metricPage,metricId)
      ||!UUID.test(String(payload.executionId||'')))continue;
    const definition=byDef.get(tenant+'|'+id);
    if(!eligibleDefinition(definition,tenant,id,field,metricId))continue;
    if(Number(payload.connectorVersion)!==Number(definition.versie))continue;
    const execution=byExecution.get(String(payload.executionId||''));
    if(!verifiedExecution(execution,definition,payload,obs))continue;
    if(!iso(obs.observed_at)||!iso(payload.measuredAt))continue;
    const when=Date.parse(payload.measuredAt),observed=Date.parse(obs.observed_at);
    if(observed<when-300000||when>current+300000||current-observed>ttl||current-when>ttl)continue;
    const value=measured(payload.value);
    if(value===null||String(obs.normalized_source_revision||'')!==String(payload.sourceRevision||''))continue;
    const identity=key(tenant,id,field,metricId);
    const existing=result.get(identity);
    if(existing&&existing.observedAt>=observed)continue;
    result.set(identity,Object.freeze({
      value,source:'connector',tenantId:tenant,connectorId:id,field,metricId,
      sourceRevision:String(payload.sourceRevision),measuredAt:iso(payload.measuredAt),
      observedAt:observed,providerReadId:String(payload.providerReadId),
      evidenceState:'CANONICAL_RECEIPT_MATCHED_NOT_EXTERNAL_INDEPENDENT_AUDIT'
    }));
  }
  return result;
}
export function measurementForConnectorRule(index,tenant,rule){
  const source=normalizeConnectorRuleSource(rule?.source,rule?.metricId);
  if(!source||source.type!=='connector'||!(index instanceof Map))return null;
  return index.get(key(String(tenant),source.connectorId,source.field,String(rule.metricId)))||null;
}
