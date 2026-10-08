import {canUseCurrentAiRoute} from '../../platform/policy/customer-ai-deployment.mjs';
const clean=v=>String(v??'').trim();
const EU_TRANSFER=new Set(['NO','NONE','EEA_ONLY','EU_ONLY','NO_BY_DESIGN']);
const euScope=value=>String(value||'').toUpperCase().startsWith('EU');
const verified=residency=>residency?.evidenceStatus==='VERIFIED';
export function createDataSovereigntyClient({fetchFn=globalThis.fetch,baseUrl=process.env.BG_PORTAL_EU_SUPABASE_URL,serviceToken=process.env.BG_PORTAL_EU_SERVICE_TOKEN}={}){
  if(!fetchFn||!clean(baseUrl)||!clean(serviceToken))throw new Error('DATA_SOVEREIGNTY_CONFIG_MISSING');
  const endpoint=clean(baseUrl).replace(/\/$/,'')+'/functions/v1/portal-state-eu';
  const headers={'content-type':'application/json','x-bg-service-token':serviceToken,'x-region':'eu-central-1'};
  async function gateway(body){
    const response=await fetchFn(endpoint,{method:'POST',headers,body:JSON.stringify(body)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Object.assign(new Error(data?.error||'DATA_SOVEREIGNTY_GATEWAY_FAILED'),{code:data?.error||'DATA_SOVEREIGNTY_GATEWAY_FAILED',status:response.status});
    return data;
  }
  async function snapshot(tenantId){
    const result=await gateway({action:'data_sovereignty_get',tenantId:String(tenantId)});
    return result?.snapshot||{};
  }
  return Object.freeze({
    get:tenantId=>gateway({action:'data_sovereignty_get',tenantId:String(tenantId)}),
    setPolicy:(tenantId,policy,actor)=>gateway({action:'data_sovereignty_policy_set',tenantId:String(tenantId),policy,actor}),
    async assertAiAllowed(tenantId){
      const state=await snapshot(tenantId);
      const requestedProvider=String(state?.policy?.preferred_ai_provider||'').trim();
      // A saved preference never silently reroutes confidential data to the existing Anthropic gateway.
      if((requestedProvider&&requestedProvider!=='anthropic')||!canUseCurrentAiRoute(state?.policy?.ai_deployment_profile))
        throw Object.assign(new Error('DATA_SOVEREIGNTY_AI_BLOCKED'),{code:'DATA_SOVEREIGNTY_AI_BLOCKED',details:[{reason:'Gekozen AI-infrastructuur of regio is nog niet geprovisioneerd en geverifieerd. Externe AI-verwerking blijft geblokkeerd.'}]});
      if(state?.policy?.enforcement_mode==='BLOCK'&&state?.policy?.mode==='EU_ONLY'){
        const blockers=(state.violations||[]).filter(v=>
          v?.kind==='ai_route'||
          v?.kind==='policy'||
          (v?.kind==='provider'&&['netlify','anthropic','openai_eu','composio_groq'].includes(String(v?.key||'')))
        );
        if(blockers.length)throw Object.assign(new Error('DATA_SOVEREIGNTY_AI_BLOCKED'),{code:'DATA_SOVEREIGNTY_AI_BLOCKED',details:blockers});
      }
      return state;
    },
    async assertConnectorAllowed(tenantId,connectorId){
      const state=await snapshot(tenantId);
      if(state?.policy?.enforcement_mode!=='BLOCK')return state;
      const mode=state?.policy?.mode;
      if(!['EU_STORAGE','EU_ONLY'].includes(mode))return state;
      const connector=(state.connectors||[]).find(item=>String(item?.id||'')===String(connectorId||''));
      if(!connector)throw Object.assign(new Error('DATA_SOVEREIGNTY_CONNECTOR_BLOCKED'),{code:'DATA_SOVEREIGNTY_CONNECTOR_BLOCKED',details:[{reason:'Connector-residency is niet aantoonbaar in de actuele sovereignty snapshot.'}]});
      const source=connector.sourceResidency;
      const target=connector.targetResidency;
      const failures=[];
      for(const [side,residency] of [['source',source],['target',target]]){
        if(!residency){failures.push({side,reason:'Residency-evidence ontbreekt.'});continue;}
        if(!verified(residency))failures.push({side,reason:'Residency-evidence is niet VERIFIED.',evidenceStatus:residency.evidenceStatus||'UNKNOWN'});
        if(!euScope(residency.storageScope))failures.push({side,reason:'Opslag is niet aantoonbaar EU-only.',storageScope:residency.storageScope||'UNKNOWN'});
        if(mode==='EU_ONLY'){
          if(!euScope(residency.processingScope))failures.push({side,reason:'Verwerking is niet aantoonbaar EU-only.',processingScope:residency.processingScope||'UNKNOWN'});
          if(!EU_TRANSFER.has(String(residency.crossBorderTransfer||'UNKNOWN')))failures.push({side,reason:'Doorgifte is niet aantoonbaar beperkt tot EU/EEA.',crossBorderTransfer:residency.crossBorderTransfer||'UNKNOWN'});
        }
      }
      if(failures.length)throw Object.assign(new Error('DATA_SOVEREIGNTY_CONNECTOR_BLOCKED'),{code:'DATA_SOVEREIGNTY_CONNECTOR_BLOCKED',details:failures});
      return state;
    }
  });
}
