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

function chooseScope(rows,tenantId){
  const tenantRows=rows.filter(row=>row.tenant_id===tenantId);
  if(tenantRows.length)return {scope:tenantId,rows:tenantRows};
  return {scope:'canonical',rows:rows.filter(row=>row.tenant_id==='canonical')};
}

export default async request=>{
  const user=await getUser(request).catch(()=>null);
  if(!user?.id)return json({error:'UNAUTHENTICATED'},401);
  const tenantId=resolveIdentityTenant(user);
  if(!tenantId)return json({error:'TENANT_SCOPE_REQUIRED'},403);
  const key=serviceKey();
  if(!key)return json({error:'SUPABASE_SERVICE_KEY_MISSING'},503);

  const tenantFilter=encodeURIComponent(tenantId);
  try{
    const [sources,publications,signals,domains,sourceCatalog,scopedSignals,scopedActions,scopedSnapshots]=await Promise.all([
      table('bronnen?select=id,naam,uitgever,soort,controle_frequentie,laatst_gecontroleerd,laatste_controle_gelukt,actief,trefwoorden&actief=eq.true&order=uitgever.asc,naam.asc',key),
      table('bronpublicaties?select=id,bron_id,titel,samenvatting,publicatiedatum,url,opgehaald_op,goedgekeurd,uitgever_url&order=publicatiedatum.desc.nullslast&limit=350',key),
      table('bg_externe_signalen?select=url,onderwerp,titel,samenvatting,domein,gepubliceerd_op,brontrouw,bevestiging,versheid,relevantie,vertrouwen,toegestaan,opgehaald_op,deadline&toegestaan=eq.true&order=gepubliceerd_op.desc.nullslast&limit=250',key),
      table('powerhouse_intelligence_domain_registry_v1?select=domain_key,label,pillar,scope,description,default_signal_type,default_action_type,default_horizon_days&active=eq.true&order=scope.asc,pillar.asc,label.asc&limit=200',key),
      table('powerhouse_intelligence_source_catalog_v1?select=source_key,label,publisher,scope,domain_keys,source_kind,authority_tier,activation_mode,canonical_url,adapter_key,update_cadence,jurisdiction,metadata&active=eq.true&order=scope.asc,authority_tier.desc,label.asc&limit=500',key),
      table(`powerhouse_intelligence_signal_projection_v1?select=tenant_id,signal_key,source_observation_id,source_key,external_event_id,external_url,domain_key,signal_type,direction,title,summary,published_at,observed_at,deadline,source_trust,confirmation,freshness,relevance,source_confidence,probability,magnitude,exposure,urgency,reversibility,signal_score,impact_score,impact_status,estimated_value_eur,estimated_loss_eur,time_horizon_days,status,evidence,updated_at&tenant_id=in.(canonical,${tenantFilter})&status=neq.DISMISSED&order=signal_score.desc,observed_at.desc&limit=250`,key),
      table(`powerhouse_intelligence_action_candidate_v1?select=tenant_id,action_key,signal_key,impact_key,domain_key,title,rationale,action_type,priority_score,owner_hint,due_at,expected_value_eur,estimated_loss_avoided_eur,canonical_action_ref,outcome_ref,status,evidence,updated_at&tenant_id=in.(canonical,${tenantFilter})&status=in.(CANDIDATE,READY,MATERIALIZED)&order=priority_score.desc,updated_at.desc&limit=100`,key),
      table(`powerhouse_intelligence_snapshot_v1?select=tenant_id,refreshed_at,catalog_source_count,public_source_count,connector_source_count,domain_count,observed_signal_count,signals_24h,signals_7d,high_attention_count,scored_impact_count,action_candidate_count,known_opportunity_value_eur,known_risk_value_eur,top_domains,source_health,status,evidence,updated_at&tenant_id=in.(canonical,${tenantFilter})`,key)
    ]);

    const selectedSignals=chooseScope(scopedSignals,tenantId);
    const selectedActions=chooseScope(scopedActions,tenantId);
    const selectedSnapshots=chooseScope(scopedSnapshots,tenantId);
    const projectionScope=selectedSignals.scope;
    const actionRows=selectedActions.scope===projectionScope?selectedActions.rows:scopedActions.filter(row=>row.tenant_id===projectionScope);
    const snapshotRows=selectedSnapshots.scope===projectionScope?selectedSnapshots.rows:scopedSnapshots.filter(row=>row.tenant_id===projectionScope);

    return json({
      sources,
      publications,
      signals,
      intelligence:{
        domains,
        sourceCatalog,
        signals:selectedSignals.rows,
        actionCandidates:actionRows,
        snapshot:snapshotRows[0]||null,
        projectionScope,
        requestedTenantId:tenantId,
        tenantSpecificProjection:projectionScope===tenantId,
        truthPolicy:'measured_or_evidence_backed_else_unknown',
        lineage:'source→evidence→signal→company impact→recommendation→canonical action→outcome→learning'
      },
      stats:{
        generatedAt:new Date().toISOString(),
        sourceCount:sources.length,
        publicationCount:publications.length,
        signalCount:signals.length,
        sourceUniverseCount:sourceCatalog.length,
        sourceDomainCount:domains.length,
        intelligenceSignalCount:selectedSignals.rows.length,
        actionCandidateCount:actionRows.length
      }
    });
  }catch(error){
    return json({error:'EXTERNAL_DATA_READ_FAILED',message:error?.message||String(error)},502);
  }
};
export const config={path:'/api/portal-ondernemersdata'};
