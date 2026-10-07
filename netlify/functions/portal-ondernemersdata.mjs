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
const enc=value=>encodeURIComponent(String(value||''));
function preferTenant(rows,tenantId){
  const list=Array.isArray(rows)?rows:[];
  const own=list.filter(row=>row?.tenant_id===tenantId);
  return own.length?own:list.filter(row=>row?.tenant_id==='canonical');
}

export default async request=>{
  const user=await getUser(request).catch(()=>null);
  if(!user)return json({error:'UNAUTHENTICATED'},401);
  const key=serviceKey();
  if(!key)return json({error:'SUPABASE_SERVICE_KEY_MISSING'},503);
  const tenantId=resolveIdentityTenant(user)||'canonical';
  const tenantFilter=`or=(tenant_id.eq.${enc(tenantId)},tenant_id.eq.canonical)`;
  try{
    const [sources,publications,signals,domains,sourceCatalog,intelligenceSignals,actionCandidates,snapshots]=await Promise.all([
      table('bronnen?select=id,naam,uitgever,soort,controle_frequentie,laatst_gecontroleerd,laatste_controle_gelukt,actief,trefwoorden&actief=eq.true&order=uitgever.asc,naam.asc',key),
      table('bronpublicaties?select=id,bron_id,titel,samenvatting,publicatiedatum,url,opgehaald_op,goedgekeurd,uitgever_url&order=publicatiedatum.desc.nullslast&limit=350',key),
      table('bg_externe_signalen?select=url,onderwerp,titel,samenvatting,domein,gepubliceerd_op,vertrouwen,toegestaan,opgehaald_op,deadline&order=gepubliceerd_op.desc.nullslast&limit=250',key),
      table('powerhouse_intelligence_domain_registry_v1?select=domain_key,label,pillar,scope,description,default_signal_type,default_action_type,default_horizon_days,active,metadata&active=eq.true&order=scope.asc,pillar.asc,label.asc',key),
      table('powerhouse_intelligence_source_catalog_v1?select=source_key,label,publisher,scope,domain_keys,source_kind,authority_tier,activation_mode,canonical_url,adapter_key,update_cadence,jurisdiction,active,metadata&active=eq.true&order=scope.asc,authority_tier.desc,label.asc&limit=500',key),
      table(`powerhouse_intelligence_signal_projection_v1?select=tenant_id,signal_key,source_key,external_url,domain_key,signal_type,direction,title,summary,published_at,observed_at,deadline,signal_score,impact_score,impact_status,estimated_value_eur,estimated_loss_eur,time_horizon_days,status,evidence&${tenantFilter}&status=neq.DISMISSED&order=signal_score.desc,observed_at.desc&limit=300`,key),
      table(`powerhouse_intelligence_action_candidate_v1?select=tenant_id,action_key,signal_key,impact_key,domain_key,title,rationale,action_type,priority_score,owner_hint,due_at,expected_value_eur,estimated_loss_avoided_eur,canonical_action_ref,outcome_ref,status,evidence&${tenantFilter}&status=in.(CANDIDATE,READY,MATERIALIZED)&order=priority_score.desc&limit=100`,key),
      table(`powerhouse_intelligence_snapshot_v1?select=*&${tenantFilter}&limit=2`,key)
    ]);
    const scopedSignals=preferTenant(intelligenceSignals,tenantId);
    const scopedActions=preferTenant(actionCandidates,tenantId);
    const scopedSnapshots=preferTenant(snapshots,tenantId);
    return json({
      sources,publications,signals,
      intelligence:{
        tenantId,
        projectionScope:scopedSnapshots[0]?.tenant_id||scopedSignals[0]?.tenant_id||'canonical',
        domains,
        sourceCatalog,
        signals:scopedSignals,
        actionCandidates:scopedActions,
        snapshot:scopedSnapshots[0]||null,
        truthPolicy:'measured_or_evidence_backed_else_unknown'
      },
      stats:{
        generatedAt:new Date().toISOString(),
        sourceCount:sources.length,
        publicationCount:publications.length,
        signalCount:signals.length,
        intelligenceDomainCount:domains.length,
        intelligenceCatalogCount:sourceCatalog.length,
        intelligenceSignalCount:scopedSignals.length,
        intelligenceActionCount:scopedActions.length
      }
    });
  }catch(error){
    return json({error:'EXTERNAL_DATA_READ_FAILED',message:error?.message||String(error)},502);
  }
};
export const config={path:'/api/portal-ondernemersdata'};
