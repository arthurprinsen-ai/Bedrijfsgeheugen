import { getUser } from '@netlify/identity';
import { resolveIdentityTenant } from '../../platform/read-models/portal-server-state.mjs';

const PROJECT_URL='https://adhjwmvyoixzjtmiroln.supabase.co';
const env=name=>String(Netlify.env.get(name)||'').trim();
const serviceKey=()=>env('SUPABASE_SERVICE_ROLE_KEY')||env('SUPABASE_SERVICE_KEY')||env('SUPABASE_SECRET_KEY');
const supabaseUrl=()=>env('SUPABASE_URL')||PROJECT_URL;
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, max-age=60, stale-while-revalidate=240','content-type':'application/json; charset=utf-8','vary':'authorization, cookie'}});

async function table(path,key){
  const response=await fetch(`${supabaseUrl()}/rest/v1/${path}`,{headers:{apikey:key,authorization:`Bearer ${key}`,accept:'application/json'}});
  if(!response.ok)throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  return response.json();
}

export default async request=>{
  const user=await getUser(request).catch(()=>null);
  if(!user?.id)return json({error:'UNAUTHENTICATED'},401);
  const tenantId=resolveIdentityTenant(user);
  if(!tenantId)return json({error:'TENANT_SCOPE_REQUIRED'},403);
  const key=serviceKey();
  if(!key)return json({error:'SUPABASE_SERVICE_KEY_MISSING'},503);
  try{
    const [sources,publications,signals,sourceUniverse,radar]=await Promise.all([
      table('bronnen?select=id,naam,uitgever,soort,controle_frequentie,laatst_gecontroleerd,laatste_controle_gelukt,actief,trefwoorden&actief=eq.true&order=uitgever.asc,naam.asc',key),
      table('bronpublicaties?select=id,bron_id,titel,samenvatting,publicatiedatum,url,opgehaald_op,goedgekeurd,uitgever_url&order=publicatiedatum.desc.nullslast&limit=350',key),
      table('bg_externe_signalen?select=url,onderwerp,titel,samenvatting,domein,gepubliceerd_op,brontrouw,bevestiging,versheid,relevantie,vertrouwen,toegestaan,opgehaald_op,deadline&toegestaan=eq.true&order=gepubliceerd_op.desc.nullslast&limit=250',key),
      table('powerhouse_source_catalog_v1?select=source_key,domain_key,source_type,provider,label,authority_tier,geography,acquisition_mode,official_url,refresh_cadence,availability_state,description,updated_at&enabled=eq.true&order=domain_key.asc,authority_tier.asc,label.asc&limit=500',key),
      table('powerhouse_signal_impact_assessment_v1?select=tenant_id,signal_key,source_url,domain_key,signal_title,observed_at,nature,relevance,magnitude,likelihood,urgency,exposure,confidence,impact_score,value_eur,downside_eur,time_horizon,impacted_dimensions,action_status,recommended_action,assessment_basis,evidence,updated_at&tenant_id=eq.canonical&order=impact_score.desc,observed_at.desc&limit=250',key)
    ]);
    const liveSources=sourceUniverse.filter(item=>['OBSERVED','LIVE'].includes(item.availability_state)).length;
    const connectedSources=sourceUniverse.filter(item=>['CONNECTED','OBSERVED','LIVE'].includes(item.availability_state)).length;
    const domainCount=new Set(sourceUniverse.map(item=>item.domain_key)).size;
    const highAttention=radar.filter(item=>Number(item.impact_score)>=70).length;
    return json({
      sources,
      publications,
      signals,
      sourceUniverse,
      radar,
      scope:{
        tenantId,
        impactScope:'GENERIC_EXTERNAL_BASELINE',
        tenantExposureApplied:false,
        monetaryImpactSynthesized:false
      },
      stats:{
        generatedAt:new Date().toISOString(),
        sourceCount:sources.length,
        publicationCount:publications.length,
        signalCount:signals.length,
        sourceUniverseCount:sourceUniverse.length,
        connectedSourceCount:connectedSources,
        observedSourceCount:liveSources,
        sourceDomainCount:domainCount,
        radarCount:radar.length,
        highAttentionCount:highAttention
      }
    });
  }catch(error){
    return json({error:'EXTERNAL_DATA_READ_FAILED',message:error?.message||String(error)},502);
  }
};
export const config={path:'/api/portal-ondernemersdata'};
