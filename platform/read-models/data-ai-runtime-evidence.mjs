const clean=v=>String(v??'').trim();
const nowIso=()=>new Date().toISOString();
const ev=(id,source,{verified=true,confidence=95,sourceType='runtime',retrievedAt=nowIso(),model=null}={})=>({id,source,sourceType,retrievedAt,confidence,verified,aiGenerated:false,model});
const arr=v=>Array.isArray(v)?v:[];
const uniq=a=>[...new Set(a.filter(Boolean))];
const pick=(obj,keys)=>{for(const k of keys){const v=obj?.[k];if(v!==undefined&&v!==null&&clean(v))return v;}return null;};

function extractModels(state={}){
  const models=[];
  for(const agent of arr(state.agents)){
    const provider=clean(pick(agent,['provider','aiProvider','vendor']));
    const model=clean(pick(agent,['model','modelName','llm','llmModel']));
    const useCase=clean(pick(agent,['useCase','purpose','name','label']));
    if(provider||model) models.push({provider:provider||'Onbekende provider',model:model||'Onbekend model',useCase:useCase||'Onbekende use-case'});
  }
  return models;
}
function explicitHumanOversight(state={}){
  return [...arr(state.decisions),...arr(state.actions),...arr(state.recommendedActions)].filter(item=>
    item?.requiresApproval===true||item?.humanOversight===true||clean(item?.approvedBy)||clean(item?.approvalStatus)||clean(item?.owner)
  );
}
function runtimeRegion(env={}){return clean(env.BG_PORTAL_PROCESSING_REGION||env.AWS_REGION||env.NETLIFY_REGION||env.NETLIFY_FUNCTIONS_REGION);}
function storageRegion(env={}){return clean(env.BG_PORTAL_STORAGE_REGION||env.NETLIFY_BLOBS_REGION);}
function stateStore(env={}){return clean(env.BG_PORTAL_STATE_STORE)||'Netlify Blobs / brain-read-models';}

export function buildRuntimePassportEvidence(state={}, {env=process.env, now=nowIso}={}){
  const generatedAt=now();
  const company=clean(state?.company?.name)||'Klantorganisatie';
  const processingRegion=runtimeRegion(env);
  const storage=storageRegion(env);
  const store=stateStore(env);
  const models=extractModels(state);
  const oversight=explicitHumanOversight(state);
  const audits=arr(state.audit);
  const integrationNames=uniq(arr(state.integrationStatus).map(x=>clean(x?.name||x?.label||x?.provider||x?.system)));
  const retention=pick(state?.admin||{},['retention','retentionPolicy','dataRetention'])||pick(state?.sourceMeta||{},['retention','retentionPolicy']);
  const classification=pick(state?.admin||{},['dataClassification','classification'])||pick(state?.company||{},['dataClassification','classification']);
  const riskClasses=uniq(arr(state.agents).map(x=>clean(x?.riskClass||x?.aiActRiskClass||x?.riskClassification)));
  const dpia=pick(state?.admin||{},['dpia','privacyImpact','privacyImpactAssessment']);
  const controls=[];

  controls.push({
    id:'data-residency', owner:'Bedrijfsgeheugen',
    claim:`Portal API verwerking: ${processingRegion||'regio niet door runtime blootgegeven'}. Portal-state opslag: ${store}${storage?` (${storage})`:''}.`,
    evidence:[
      ev('portal-runtime-provider','Live portal draait op Netlify Functions'),
      processingRegion?ev('portal-processing-region',`Runtime processing region: ${processingRegion}`):ev('portal-processing-region','Runtime processing region ontbreekt',{verified:false,confidence:0}),
      ev('portal-state-store',`Portal-state store: ${store}`),
      storage?ev('portal-storage-region',`Geconfigureerde portal storage region: ${storage}`):ev('portal-storage-region','Exacte portal storage region niet in portalconfig vastgelegd',{verified:false,confidence:0}),
    ],
    updatedAt:generatedAt,
  });

  controls.push({
    id:'access-control', owner:'Bedrijfsgeheugen',
    claim:'Portal-state vereist een ingelogde Netlify Identity gebruiker en resolveert tenantcontext vóór data wordt gelezen of geschreven.',
    evidence:[
      ev('identity-required','/api/portal-state weigert requests zonder geauthenticeerde user'),
      ev('tenant-resolution','Tenant wordt afgeleid uit identity appMetadata.tenantId of user-id fallback'),
      ev('private-no-store','Portal-state response gebruikt private, no-store cache headers'),
    ],updatedAt:generatedAt,
  });

  controls.push({
    id:'model-register', owner:company,
    claim:models.length?`Geregistreerde AI-configuraties: ${models.map(x=>`${x.provider} / ${x.model} (${x.useCase})`).join('; ')}`:'Geen model/provider metadata aangetroffen in de huidige tenantprojectie.',
    evidence:models.map((x,i)=>ev(`model-${i+1}`,`${x.provider} / ${x.model} · ${x.useCase}`,{sourceType:'tenant-state'})),
    updatedAt:generatedAt,
  });

  controls.push({
    id:'human-oversight', owner:company,
    claim:oversight.length?`${oversight.length} actie/beslissing(en) bevatten expliciete menselijke eigenaar, approval of oversight metadata.`:'Geen expliciete human-oversight metadata aangetroffen in de huidige tenantprojectie.',
    evidence:oversight.length?[ev('human-oversight-state',`${oversight.length} expliciete oversight/approval records in tenant-state`,{sourceType:'tenant-state'})]:[],
    updatedAt:generatedAt,
  });

  controls.push({
    id:'monitoring-audit', owner:'Bedrijfsgeheugen',
    claim:audits.length?`${audits.length} auditrecord(s) beschikbaar in de huidige portalprojectie.`:'Geen auditrecords in de huidige portalprojectie.',
    evidence:audits.length?[ev('tenant-audit',`${audits.length} auditrecord(s) aanwezig`,{sourceType:'tenant-state'})]:[],
    updatedAt:generatedAt,
  });

  controls.push({
    id:'supplier-assurance', owner:'Bedrijfsgeheugen',
    claim:`Technisch aangetroffen platform/provider: Netlify, ${store}${integrationNames.length?`, ${integrationNames.join(', ')}`:''}. Contractuele DPA/subprocessor-evidence moet afzonderlijk worden geregistreerd.`,
    evidence:[
      ev('netlify-provider','Netlify is hosting/runtime provider'),
      ev('portal-state-provider',`${store} is portal-state provider`),
      ...integrationNames.map((name,i)=>ev(`integration-${i+1}`,`Tenant integration geregistreerd: ${name}`,{sourceType:'tenant-state'})),
      ev('supplier-contracts','DPA/subprocessor assurance niet uit runtime afleidbaar',{verified:false,confidence:0,sourceType:'governance'}),
    ],updatedAt:generatedAt,
  });

  controls.push({id:'retention',owner:company,claim:retention?`Bewaarbeleid in tenant-state: ${clean(retention)}`:'Geen bewaartermijn aangetroffen in tenant-state.',evidence:retention?[ev('retention-state',`Bewaarbeleid: ${clean(retention)}`,{sourceType:'tenant-state'})]:[],updatedAt:generatedAt});
  controls.push({id:'data-classification',owner:company,claim:classification?`Dataclassificatie in tenant-state: ${clean(classification)}`:'Geen expliciete dataclassificatie aangetroffen in tenant-state.',evidence:classification?[ev('classification-state',`Dataclassificatie: ${clean(classification)}`,{sourceType:'tenant-state'})]:[],updatedAt:generatedAt});
  controls.push({id:'ai-risk-classification',owner:company,claim:riskClasses.length?`AI-risicoklassen: ${riskClasses.join(', ')}`:'Geen expliciete AI Act-risicoklasse aangetroffen.',evidence:riskClasses.map((x,i)=>ev(`risk-${i+1}`,`AI-risicoklasse: ${x}`,{sourceType:'tenant-state'})),updatedAt:generatedAt});
  controls.push({id:'privacy-impact',owner:company,claim:dpia?`Privacy/impact metadata aanwezig: ${clean(dpia)}`:'Geen DPIA/privacy-impact metadata aangetroffen in tenant-state.',evidence:dpia?[ev('privacy-impact-state',`Privacy-impact metadata: ${clean(dpia)}`,{sourceType:'tenant-state'})]:[],updatedAt:generatedAt});

  return Object.freeze({generatedAt,technicalFacts:{hostingProvider:'Netlify',identityProvider:'Netlify Identity',stateStore:store,processingRegion:processingRegion||null,storageRegion:storage||null,tenantOwner:company},controls});
}
