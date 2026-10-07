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

function overlayBy(items,key){
  const map=new Map();
  for(const list of items)for(const item of list)map.set(item[key],item);
  return [...map.values()];
}

export default async request=>{
  const user=await getUser(request).catch(()=>null);
  if(!user?.id)return json({error:'UNAUTHENTICATED'},401);
  const tenantId=resolveIdentityTenant(user);
  if(!tenantId)return json({error:'TENANT_SCOPE_REQUIRED'},403);
  const key=serviceKey();
  if(!key)return json({error:'SUPABASE_SERVICE_KEY_MISSING'},503);

  const tenant=encodeURIComponent(tenantId);
  try{
    const [
      sources,publications,signals,
      domains,sourceCatalog,
      canonicalSignals,tenantSignals,
      canonicalActions,tenantActions,
      canonicalSnapshot,tenantSnapshot
    ]=await Promise.all([
      table('bronnen?select=id,naam,uitgever,soort,controle_frequentie,laatst_gecontroleerd,laatste_controle_gelukt,actief,trefwoorden&actief=eq.true&order=uitgever.asc,naam.asc',key),
      table('bronpublicaties?select=id,bron_id,titel,samenvatting,publicatiedatum,url,opgehaald_op,goedgekeurd,uitgever_url&order=publicatiedatum.desc.nullslast&limit=350',key),
      table('bg_externe_signalen?select=url,onderwerp,titel,samenvatting,domein,gepubliceerd_op,brontrouw,bevestiging,versheid,relevantie,vertrouwen,toegestaan,opgehaald_op,deadline&toegestaan=eq.true&order=gepubliceerd_op.desc.nullslast&limit=250',key),
      table('powerhouse_intelligence_domain_registry_v1?select=domain_key,label,pillar,scope,description,default_signal_type,default_action_type,default_horizon_days,metadata&active=eq.true&order=pillar.asc,label.asc',key),
      table('powerhouse_intelligence_source_catalog_v1?select=source_key,label,publisher,scope,domain_keys,source_kind,authority_tier,activation_mode,canonical_url,adapter_key,update_cadence,jurisdiction,metadata,updated_at&active=eq.true&order=scope.asc,authority_tier.desc,label.asc&limit=750',key),
      table('powerhouse_intelligence_signal_projection_v1?select=tenant_id,signal_key,source_observation_id,source_key,external_event_id,external_url,domain_key,signal_type,direction,title,summary,published_at,observed_at,deadline,source_trust,confirmation,freshness,relevance,source_confidence,probability,magnitude,exposure,urgency,reversibility,signal_score,impact_score,impact_status,estimated_value_eur,estimated_loss_eur,time_horizon_days,status,evidence,updated_at&tenant_id=eq.canonical&status=neq.DISMISSED&order=signal_score.desc,observed_at.desc&limit=250',key),
      table(`powerhouse_intelligence_signal_projection_v1?select=tenant_id,signal_key,source_observation_id,source_key,external_event_id,external_url,domain_key,signal_type,direction,title,summary,published_at,observed_at,deadline,source_trust,confirmation,freshness,relevance,source_confidence,probability,magnitude,exposure,urgency,reversibility,signal_score,impact_score,impact_status,estimated_value_eur,estimated_loss_eur,time_horizon_days,status,evidence,updated_at&tenant_id=eq.${tenant}&status=neq.DISMISSED&order=signal_score.desc,observed_at.desc&limit=250`,key),
      table('powerhouse_intelligence_action_candidate_v1?select=tenant_id,action_key,signal_key,impact_key,domain_key,title,rationale,action_type,priority_score,owner_hint,due_at,expected_value_eur,estimated_loss_avoided_eur,canonical_action_ref,outcome_ref,status,evidence,updated_at&tenant_id=eq.canonical&status=neq.DISMISSED&order=priority_score.desc,updated_at.desc&limit=100',key),
      table(`powerhouse_intelligence_action_candidate_v1?select=tenant_id,action_key,signal_key,impact_key,domain_key,title,rationale,action_type,priority_score,owner_hint,due_at,expected_value_eur,estimated_loss_avoided_eur,canonical_action_ref,outcome_ref,status,evidence,updated_at&tenant_id=eq.${tenant}&status=neq.DISMISSED&order=priority_score.desc,updated_at.desc&limit=100`,key),
      table('powerhouse_intelligence_snapshot_v1?select=*&tenant_id=eq.canonical&limit=1',key),
      table(`powerhouse_intelligence_snapshot_v1?select=*&tenant_id=eq.${tenant}&limit=1`,key)
    ]);

    const intelligenceSignals=overlayBy([canonicalSignals,tenantSignals],'signal_key')
      .sort((a,b)=>(Number(b.impact_score??b.signal_score)||0)-(Number(a.impact_score??a.signal_score)||0));
    const actionCandidates=overlayBy([canonicalActions,tenantActions],'action_key')
      .sort((a,b)=>(Number(b.priority_score)||0)-(Number(a.priority_score)||0));
    const tenantSpecific=tenantSignals.length>0||tenantActions.length>0||tenantSnapshot.length>0;
    const companyImpactApplied=tenantSignals.some(item=>item.impact_status==='SCORED');
    const snapshot=tenantSnapshot[0]||canonicalSnapshot[0]||{
      tenant_id:tenantSpecific?tenantId:'canonical',
      refreshed_at:null,
      catalog_source_count:sourceCatalog.length,
      public_source_count:sourceCatalog.filter(x=>x.activation_mode==='PUBLIC_ALWAYS').length,
      connector_source_count:sourceCatalog.filter(x=>x.activation_mode==='CONNECTOR_REQUIRED').length,
      domain_count:domains.length,
      observed_signal_count:intelligenceSignals.length,
      signals_24h:0,
      signals_7d:0,
      high_attention_count:intelligenceSignals.filter(x=>Number(x.impact_score??x.signal_score)>=70).length,
      scored_impact_count:intelligenceSignals.filter(x=>x.impact_status==='SCORED').length,
      action_candidate_count:actionCandidates.length,
      known_opportunity_value_eur:null,
      known_risk_value_eur:null,
      top_domains:[],
      source_health:{},
      status:intelligenceSignals.length?'PARTIAL':'EMPTY',
      evidence:{fallback:true}
    };

    return json({
      sources,
      publications,
      signals,
      intelligence:{
        domains,
        sourceCatalog,
        signals:intelligenceSignals,
        actionCandidates,
        snapshot,
        projectionScope:tenantSpecific?'tenant-specific enrichment over canonical source intelligence':'canonical external baseline; tenant-specific exposure awaits company evidence',
        truthPolicy:'measured_or_evidence_backed_else_unknown'
      },
      scope:{
        authenticatedTenant:tenantId,
        canonicalSignalBaseline:true,
        tenantSpecificProjectionAvailable:tenantSpecific,
        tenantExposureApplied:companyImpactApplied,
        monetaryImpactSynthesized:false
      },
      stats:{
        generatedAt:new Date().toISOString(),
        sourceCount:sources.length,
        publicationCount:publications.length,
        signalCount:signals.length,
        sourceUniverseCount:sourceCatalog.length,
        sourceDomainCount:domains.length,
        radarCount:intelligenceSignals.length,
        actionCandidateCount:actionCandidates.length,
        tenantSignalCount:tenantSignals.length,
        highAttentionCount:Number(snapshot.high_attention_count)||0
      }
    });
  }catch(error){
    return json({error:'EXTERNAL_DATA_READ_FAILED',message:error?.message||String(error)},502);
  }
};

export const config={path:'/api/portal-ondernemersdata'};
