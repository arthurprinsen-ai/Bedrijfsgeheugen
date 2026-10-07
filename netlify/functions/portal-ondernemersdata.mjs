import { getUser } from '@netlify/identity';
import { resolveIdentityTenant } from '../../platform/read-models/portal-server-state.mjs';

const PROJECT_URL='https://adhjwmvyoixzjtmiroln.supabase.co';
const env=name=>String(Netlify.env.get(name)||'').trim();
const serviceKey=()=>env('SUPABASE_SERVICE_ROLE_KEY')||env('SUPABASE_SERVICE_KEY')||env('SUPABASE_SECRET_KEY');
const supabaseUrl=()=>env('SUPABASE_URL')||PROJECT_URL;
const json=(body,status=200)=>Response.json(body,{status,headers:{
  'cache-control':'private, max-age=60, stale-while-revalidate=240',
  'content-type':'application/json; charset=utf-8',
  'vary':'authorization, cookie'
}});

async function table(path,key){
  const response=await fetch(`${supabaseUrl()}/rest/v1/${path}`,{
    headers:{apikey:key,authorization:`Bearer ${key}`,accept:'application/json'}
  });
  if(!response.ok)throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  return response.json();
}
const enc=value=>encodeURIComponent(String(value||''));
const list=value=>Array.isArray(value)?value:[];
const finite=value=>{const n=Number(value);return Number.isFinite(n)?n:null};
const sumKnown=values=>{
  const known=values.map(finite).filter(value=>value!==null);
  return known.length?known.reduce((a,b)=>a+b,0):null;
};
const maxKnown=values=>{
  const known=values.map(finite).filter(value=>value!==null);
  return known.length?Math.max(...known):null;
};

function groupBy(rows,key){
  const map=new Map();
  for(const row of list(rows)){
    const value=row?.[key];
    if(value==null)continue;
    if(!map.has(value))map.set(value,[]);
    map.get(value).push(row);
  }
  return map;
}

function mergeSignals(signals,tenantImpacts){
  const bySignal=groupBy(tenantImpacts,'signal_key');
  return list(signals).map(signal=>{
    const impacts=bySignal.get(signal.signal_key)||[];
    const scored=impacts.filter(item=>item.status==='SCORED'&&finite(item.impact_score)!==null);
    const best=scored.sort((a,b)=>(finite(b.impact_score)||0)-(finite(a.impact_score)||0))[0]||null;
    return {
      ...signal,
      probability:best?.probability??null,
      magnitude:best?.magnitude??null,
      exposure:best?.exposure??null,
      urgency:best?.urgency??signal.urgency??null,
      reversibility:best?.reversibility??null,
      impact_score:maxKnown(impacts.map(item=>item.impact_score)),
      impact_status:scored.length?'SCORED':impacts.length?'PARTIAL':'NEEDS_COMPANY_CONTEXT',
      estimated_value_eur:sumKnown(impacts.map(item=>item.estimated_value_eur)),
      estimated_loss_eur:sumKnown(impacts.map(item=>item.estimated_loss_eur)),
      company_impact_count:impacts.length,
      tenant_specific_impact:impacts.length>0,
      company_impacts:impacts.map(item=>({
        impact_key:item.impact_key,
        target_node_key:item.target_node_key,
        target_node_type:item.target_node_type,
        target_label:item.target_label,
        impact_score:item.impact_score,
        status:item.status,
        rationale:item.rationale,
        impact_dimensions:item.impact_dimensions,
        estimated_value_eur:item.estimated_value_eur,
        estimated_loss_eur:item.estimated_loss_eur,
        observed_at:item.observed_at
      }))
    };
  });
}

function mergeActions(canonicalActions,tenantActions){
  const tenantBySignal=new Map(list(tenantActions).map(item=>[item.signal_key,item]));
  const tenant=list(tenantActions).map(item=>({...item,projection_scope:'TENANT',tenant_specific:true}));
  const generic=list(canonicalActions)
    .filter(item=>!tenantBySignal.has(item.signal_key))
    .map(item=>({...item,projection_scope:'CANONICAL_REVIEW',tenant_specific:false}));
  return [...tenant,...generic].sort((a,b)=>(finite(b.priority_score)||0)-(finite(a.priority_score)||0));
}

function buildSnapshot(base,domains,catalog,signals,tenantImpacts,actions){
  const now=Date.now();
  const ageDays=value=>{
    if(!value)return Infinity;
    const time=new Date(value).getTime();
    return Number.isFinite(time)?Math.max(0,(now-time)/86400000):Infinity;
  };
  const knownOpportunity=sumKnown(tenantImpacts.map(item=>item.estimated_value_eur));
  const knownRisk=sumKnown(tenantImpacts.map(item=>item.estimated_loss_eur));
  const availability=Object.fromEntries(['CATALOGUED','AVAILABLE','CONNECTED','OBSERVED','LIVE','STALE','ERROR']
    .map(state=>[state.toLowerCase(),catalog.filter(item=>item.availability_state===state).length]));
  return {
    ...(base||{}),
    tenant_id:'authenticated',
    refreshed_at:base?.refreshed_at||new Date().toISOString(),
    catalog_source_count:catalog.length,
    public_source_count:catalog.filter(item=>item.activation_mode==='PUBLIC_ALWAYS').length,
    connector_source_count:catalog.filter(item=>item.activation_mode==='CONNECTOR_REQUIRED').length,
    domain_count:domains.length,
    observed_signal_count:signals.length,
    signals_24h:signals.filter(item=>ageDays(item.observed_at)<=1).length,
    signals_7d:signals.filter(item=>ageDays(item.observed_at)<=7).length,
    high_attention_count:signals.filter(item=>Math.max(finite(item.signal_score)||0,finite(item.impact_score)||0)>=70).length,
    scored_impact_count:tenantImpacts.filter(item=>item.status==='SCORED'&&finite(item.impact_score)!==null).length,
    action_candidate_count:actions.filter(item=>['CANDIDATE','READY','MATERIALIZED'].includes(item.status)).length,
    known_opportunity_value_eur:knownOpportunity,
    known_risk_value_eur:knownRisk,
    source_health:{...(base?.source_health||{}),availability},
    status:signals.length?'CURRENT':'EMPTY'
  };
}

export default async request=>{
  const user=await getUser(request).catch(()=>null);
  if(!user?.id)return json({error:'UNAUTHENTICATED'},401);

  const tenantId=resolveIdentityTenant(user);
  if(!tenantId)return json({error:'TENANT_SCOPE_REQUIRED'},403);

  const key=serviceKey();
  if(!key)return json({error:'SUPABASE_SERVICE_KEY_MISSING'},503);

  try{
    const tenant=enc(tenantId);
    const [
      sources,publications,signalsRaw,domains,sourceCatalog,signalsCanonical,
      tenantImpacts,canonicalActions,tenantActions,baseSnapshots
    ]=await Promise.all([
      table('bronnen?select=id,naam,uitgever,soort,controle_frequentie,laatst_gecontroleerd,laatste_controle_gelukt,actief,trefwoorden&actief=eq.true&order=uitgever.asc,naam.asc',key),
      table('bronpublicaties?select=id,bron_id,titel,samenvatting,publicatiedatum,url,opgehaald_op,goedgekeurd,uitgever_url&order=publicatiedatum.desc.nullslast&limit=350',key),
      table('bg_externe_signalen?select=url,onderwerp,titel,samenvatting,domein,gepubliceerd_op,brontrouw,bevestiging,versheid,relevantie,vertrouwen,toegestaan,opgehaald_op,deadline&toegestaan=eq.true&order=gepubliceerd_op.desc.nullslast&limit=250',key),
      table('powerhouse_intelligence_domain_registry_v1?select=domain_key,label,pillar,scope,description,default_signal_type,default_action_type,default_horizon_days,active,metadata&active=eq.true&order=scope.asc,pillar.asc,label.asc',key),
      table('powerhouse_intelligence_source_catalog_v1?select=source_key,label,publisher,scope,domain_keys,source_kind,authority_tier,activation_mode,canonical_url,adapter_key,update_cadence,jurisdiction,availability_state,last_observed_at,evidence_source_key,active,metadata&active=eq.true&order=scope.asc,authority_tier.desc,label.asc&limit=500',key),
      table('powerhouse_intelligence_signal_projection_v1?select=tenant_id,signal_key,source_observation_id,source_key,external_event_id,external_url,domain_key,signal_type,direction,title,summary,published_at,observed_at,deadline,source_trust,confirmation,freshness,relevance,source_confidence,urgency,signal_score,time_horizon_days,status,evidence&tenant_id=eq.canonical&status=neq.DISMISSED&order=signal_score.desc,observed_at.desc&limit=300',key),
      table(`powerhouse_intelligence_company_impact_v1?select=tenant_id,impact_key,signal_key,target_node_key,target_node_type,target_label,relevance,probability,magnitude,urgency,exposure,source_confidence,reversibility,impact_score,estimated_value_eur,estimated_loss_eur,impact_dimensions,rationale,evidence,status,observed_at,updated_at&tenant_id=eq.${tenant}&status=neq.DISMISSED&order=impact_score.desc.nullslast,observed_at.desc&limit=500`,key),
      table('powerhouse_intelligence_action_candidate_v1?select=tenant_id,action_key,signal_key,impact_key,domain_key,title,rationale,action_type,priority_score,owner_hint,due_at,expected_value_eur,estimated_loss_avoided_eur,canonical_action_ref,outcome_ref,status,evidence&tenant_id=eq.canonical&status=in.(CANDIDATE,READY,MATERIALIZED)&order=priority_score.desc&limit=100',key),
      table(`powerhouse_intelligence_action_candidate_v1?select=tenant_id,action_key,signal_key,impact_key,domain_key,title,rationale,action_type,priority_score,owner_hint,due_at,expected_value_eur,estimated_loss_avoided_eur,canonical_action_ref,outcome_ref,status,evidence&tenant_id=eq.${tenant}&status=in.(CANDIDATE,READY,MATERIALIZED,DONE)&order=priority_score.desc&limit=100`,key),
      table('powerhouse_intelligence_snapshot_v1?select=tenant_id,refreshed_at,catalog_source_count,public_source_count,connector_source_count,domain_count,observed_signal_count,signals_24h,signals_7d,high_attention_count,scored_impact_count,action_candidate_count,known_opportunity_value_eur,known_risk_value_eur,top_domains,source_health,status,evidence,updated_at&tenant_id=eq.canonical&limit=1',key)
    ]);

    const intelligenceSignals=mergeSignals(signalsCanonical,tenantImpacts);
    const actions=mergeActions(canonicalActions,tenantActions);
    const snapshot=buildSnapshot(baseSnapshots[0]||null,domains,sourceCatalog,intelligenceSignals,tenantImpacts,actions);

    return json({
      sources,
      publications,
      signals:signalsRaw,
      intelligence:{
        tenantId,
        projectionScope:'canonical external baseline + authenticated tenant impact overlay',
        domains,
        sourceCatalog,
        signals:intelligenceSignals,
        companyImpacts:tenantImpacts,
        actionCandidates:actions,
        snapshot,
        truthPolicy:'measured_or_evidence_backed_else_unknown'
      },
      scope:{
        authenticatedTenant:tenantId,
        externalSignalTenant:'canonical',
        tenantExposureApplied:tenantImpacts.length>0,
        tenantImpactCount:tenantImpacts.length,
        monetaryImpactSynthesized:false,
        catalogCapabilityIsConnectionTruth:false
      },
      stats:{
        generatedAt:new Date().toISOString(),
        sourceCount:sources.length,
        publicationCount:publications.length,
        signalCount:signalsRaw.length,
        intelligenceDomainCount:domains.length,
        intelligenceCatalogCount:sourceCatalog.length,
        intelligenceSignalCount:intelligenceSignals.length,
        intelligenceActionCount:actions.length,
        connectedOrObservedSourceCount:sourceCatalog.filter(item=>['CONNECTED','OBSERVED','LIVE'].includes(item.availability_state)).length
      }
    });
  }catch(error){
    return json({error:'EXTERNAL_DATA_READ_FAILED',message:error?.message||String(error)},502);
  }
};

export const config={path:'/api/portal-ondernemersdata'};
