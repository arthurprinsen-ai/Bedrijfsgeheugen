import { createClient } from 'npm:@supabase/supabase-js@2';
import { repairBusinessInputsFromAuthority } from './business-input-read-repair.js';

const TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const ALLOWED_LAYERS=new Set(['legacy-migration','canonical-brain']);
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const AI_PROFILE_OPTIONS:Record<string,string[]>={
 deploymentMode:['MANAGED_CLOUD','PRIVATE_CLOUD','ON_PREMISE','AIR_GAPPED'],
 provider:['ANTHROPIC','AZURE_OPENAI','AWS_BEDROCK','GOOGLE_VERTEX','MISTRAL_API','OLLAMA','VLLM'],
 modelFamily:['CURRENT','MISTRAL','GEMMA','LLAMA','CUSTOM'],
 computeRegion:['AUTO','EU','NL','DE','US','LOCAL'],
 storageRegion:['AUTO','EU','NL','DE','US','LOCAL'],
 ragRegion:['SAME_AS_STORAGE','EU','NL','DE','US','LOCAL'],
 networkMode:['STANDARD','PRIVATE_ENDPOINT','OFFLINE']
};
const AI_PROFILE_KEYS=['deploymentMode','provider','modelFamily','computeRegion','storageRegion','ragRegion','networkMode','trainingUse','allowExternalFallback','modelId'];
function validAiDeploymentProfile(p:any):boolean{
 if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==AI_PROFILE_KEYS.length)return false;
 if(Object.keys(p).some(k=>!AI_PROFILE_KEYS.includes(k)))return false;
 for(const [key,options] of Object.entries(AI_PROFILE_OPTIONS))if(!options.includes(p[key]))return false;
 if(p.trainingUse!=='PROHIBITED'||p.allowExternalFallback!==false)return false;
 if(typeof p.modelId!=='string'||p.modelId.length>120||!/^[a-zA-Z0-9._:/-]*$/.test(p.modelId))return false;
 if(['ON_PREMISE','AIR_GAPPED'].includes(p.deploymentMode)){
  if(!['OLLAMA','VLLM'].includes(p.provider)||p.computeRegion!=='LOCAL'||p.storageRegion!=='LOCAL'||!['LOCAL','SAME_AS_STORAGE'].includes(p.ragRegion))return false;
 }
 if(p.deploymentMode==='AIR_GAPPED'&&p.networkMode!=='OFFLINE')return false;
 if(p.networkMode==='OFFLINE'&&p.deploymentMode!=='AIR_GAPPED')return false;
 if(['OLLAMA','VLLM'].includes(p.provider)&&!['ON_PREMISE','AIR_GAPPED','PRIVATE_CLOUD'].includes(p.deploymentMode))return false;
 return true;
}

async function sha256(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
const cleanUnique=(values:any[])=>[...new Set(values.map(value=>String(value??'').trim()).filter(Boolean))];

const list=(value:any)=>Array.isArray(value)?value:[];
const finite=(value:any)=>{const n=Number(value);return Number.isFinite(n)?n:null};
const sumKnown=(values:any[])=>{const known=values.map(finite).filter(value=>value!==null) as number[];return known.length?known.reduce((a,b)=>a+b,0):null};
const maxKnown=(values:any[])=>{const known=values.map(finite).filter(value=>value!==null) as number[];return known.length?Math.max(...known):null};
function groupBy(rows:any[],key:string){
  const map=new Map<any,any[]>();
  for(const row of list(rows)){
    const value=row?.[key];
    if(value==null)continue;
    if(!map.has(value))map.set(value,[]);
    map.get(value)!.push(row);
  }
  return map;
}
function mergeEntrepreneurSignals(signals:any[],tenantImpacts:any[]){
  const bySignal=groupBy(tenantImpacts,'signal_key');
  return list(signals).map((signal:any)=>{
    const impacts=bySignal.get(signal.signal_key)||[];
    const scored=impacts.filter((item:any)=>item.status==='SCORED'&&finite(item.impact_score)!==null);
    const best=scored.slice().sort((a:any,b:any)=>(finite(b.impact_score)||0)-(finite(a.impact_score)||0))[0]||null;
    return {
      ...signal,
      probability:best?.probability??null,
      magnitude:best?.magnitude??null,
      exposure:best?.exposure??null,
      urgency:best?.urgency??signal.urgency??null,
      reversibility:best?.reversibility??null,
      impact_score:maxKnown(impacts.map((item:any)=>item.impact_score)),
      impact_status:scored.length?'SCORED':impacts.length?'PARTIAL':'NEEDS_COMPANY_CONTEXT',
      estimated_value_eur:sumKnown(impacts.map((item:any)=>item.estimated_value_eur)),
      estimated_loss_eur:sumKnown(impacts.map((item:any)=>item.estimated_loss_eur)),
      company_impact_count:impacts.length,
      tenant_specific_impact:impacts.length>0,
      company_impacts:impacts.map((item:any)=>({
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
function mergeEntrepreneurActions(canonicalActions:any[],tenantActions:any[]){
  const tenantBySignal=new Map(list(tenantActions).map((item:any)=>[item.signal_key,item]));
  const tenant=list(tenantActions).map((item:any)=>({...item,projection_scope:'TENANT',tenant_specific:true}));
  const generic=list(canonicalActions)
    .filter((item:any)=>!tenantBySignal.has(item.signal_key))
    .map((item:any)=>({...item,projection_scope:'CANONICAL_REVIEW',tenant_specific:false}));
  return [...tenant,...generic].sort((a:any,b:any)=>(finite(b.priority_score)||0)-(finite(a.priority_score)||0));
}
function buildEntrepreneurSnapshot(base:any,domains:any[],catalog:any[],signals:any[],tenantImpacts:any[],actions:any[]){
  const now=Date.now();
  const ageDays=(value:any)=>{
    if(!value)return Infinity;
    const time=new Date(value).getTime();
    return Number.isFinite(time)?Math.max(0,(now-time)/86400000):Infinity;
  };
  const availability=Object.fromEntries(['CATALOGUED','AVAILABLE','CONNECTED','OBSERVED','LIVE','STALE','ERROR']
    .map(state=>[state.toLowerCase(),catalog.filter((item:any)=>item.availability_state===state).length]));
  return {
    ...(base||{}),
    tenant_id:'authenticated',
    refreshed_at:base?.refreshed_at||new Date().toISOString(),
    catalog_source_count:catalog.length,
    public_source_count:catalog.filter((item:any)=>item.activation_mode==='PUBLIC_ALWAYS').length,
    connector_source_count:catalog.filter((item:any)=>item.activation_mode==='CONNECTOR_REQUIRED').length,
    domain_count:domains.length,
    observed_signal_count:signals.length,
    signals_24h:signals.filter((item:any)=>ageDays(item.observed_at)<=1).length,
    signals_7d:signals.filter((item:any)=>ageDays(item.observed_at)<=7).length,
    high_attention_count:signals.filter((item:any)=>Math.max(finite(item.signal_score)||0,finite(item.impact_score)||0)>=70).length,
    scored_impact_count:tenantImpacts.filter((item:any)=>item.status==='SCORED'&&finite(item.impact_score)!==null).length,
    action_candidate_count:actions.filter((item:any)=>['CANDIDATE','READY','MATERIALIZED'].includes(item.status)).length,
    known_opportunity_value_eur:sumKnown(tenantImpacts.map((item:any)=>item.estimated_value_eur)),
    known_risk_value_eur:sumKnown(tenantImpacts.map((item:any)=>item.estimated_loss_eur)),
    source_health:{...(base?.source_health||{}),availability},
    status:signals.length?'CURRENT':'EMPTY'
  };
}
async function readRows(label:string,query:any){
  const {data,error}=await query;
  if(error)throw new Error(label);
  return Array.isArray(data)?data:[];
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  const token=req.headers.get('x-bg-service-token')||'';
  if(await sha256(token)!==TOKEN_HASH)return json({error:'UNAUTHORIZED'},401);
  let body:any; try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
  const action=String(body?.action||'');
  const tenantId=String(body?.tenantId||'').trim();
  const CMS_ACTIONS=new Set(['cms_public','cms_admin_list','cms_admin_save','cms_admin_publish','cms_admin_archive']);
  if(action!=='control_plane_cockpit'&&!CMS_ACTIONS.has(action)&&!tenantId)return json({error:'INVALID_REQUEST'},400);
  const url=Deno.env.get('SUPABASE_URL'); const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return json({error:'SERVER_CONFIG'},500);
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});

  if(action==='cms_public'){
    const cmsSurface=String(body?.surface||'website').trim();
    const cmsLocale=String(body?.locale||'nl-NL').trim();
    const cmsRoute=String(body?.route||'/').trim()||'/';
    if(!['website','portal'].includes(cmsSurface))return json({error:'INVALID_CMS_SURFACE'},400);
    if(!['nl-NL','en-US'].includes(cmsLocale))return json({error:'INVALID_CMS_LOCALE'},400);
    const {data,error}=await client.from('cms_content_items')
      .select('id,surface,locale,route,area,element_key,element_type,selector,content,sort_order,version,updated_at,published_at')
      .eq('status','published')
      .eq('locale',cmsLocale)
      .in('surface',['shared',cmsSurface])
      .in('route',['*',cmsRoute])
      .order('sort_order',{ascending:true})
      .order('element_key',{ascending:true});
    if(error)return json({error:'CMS_PUBLIC_READ_FAILED'},500);
    return json({items:Array.isArray(data)?data:[],surface:cmsSurface,locale:cmsLocale,route:cmsRoute,generatedAt:new Date().toISOString()});
  }

  if(action==='cms_admin_list'){
    const cmsSurface=String(body?.surface||'').trim();
    const cmsLocale=String(body?.locale||'').trim();
    const cmsRoute=String(body?.route||'').trim();
    let query=client.from('cms_content_items').select('*').order('surface').order('route').order('area').order('sort_order').order('element_key');
    if(cmsSurface)query=query.eq('surface',cmsSurface);
    if(cmsLocale)query=query.eq('locale',cmsLocale);
    if(cmsRoute)query=query.eq('route',cmsRoute);
    const {data,error}=await query.limit(5000);
    if(error)return json({error:'CMS_ADMIN_LIST_FAILED'},500);
    return json({items:Array.isArray(data)?data:[],generatedAt:new Date().toISOString()});
  }

  if(action==='cms_admin_save'){
    const item=body?.item&&typeof body.item==='object'&&!Array.isArray(body.item)?body.item:null;
    if(!item)return json({error:'INVALID_CMS_ITEM'},400);
    const cmsSurface=String(item.surface||'').trim();
    const cmsLocale=String(item.locale||'nl-NL').trim();
    const cmsRoute=String(item.route||'*').trim()||'*';
    const elementKey=String(item.element_key||'').trim();
    const elementType=String(item.element_type||'text').trim();
    const area=String(item.area||'content').trim()||'content';
    const selector=item.selector==null?null:String(item.selector).trim();
    const content=item.content&&typeof item.content==='object'&&!Array.isArray(item.content)?item.content:{};
    const actor=String(body?.actor||'cms-admin').trim().slice(0,320);
    if(!['website','portal','shared'].includes(cmsSurface)||!['nl-NL','en-US'].includes(cmsLocale)||!elementKey)return json({error:'INVALID_CMS_ITEM'},400);
    if(!['text','html','link','image','meta','attribute','toggle','structured'].includes(elementType))return json({error:'INVALID_CMS_ELEMENT_TYPE'},400);
    const {data:existing,error:existingError}=await client.from('cms_content_items')
      .select('*').eq('surface',cmsSurface).eq('locale',cmsLocale).eq('route',cmsRoute).eq('element_key',elementKey).maybeSingle();
    if(existingError)return json({error:'CMS_EXISTING_READ_FAILED'},500);
    const version=Number(existing?.version||0)+1;
    const now=new Date().toISOString();
    const next={
      surface:cmsSurface,locale:cmsLocale,route:cmsRoute,area,element_key:elementKey,element_type:elementType,
      selector,content,status:String(item.status||existing?.status||'draft')==='published'?'draft':String(item.status||existing?.status||'draft'),
      sort_order:Number.isFinite(Number(item.sort_order))?Number(item.sort_order):Number(existing?.sort_order||0),
      version,updated_at:now,updated_by:actor,
      published_at:existing?.published_at||null
    };
    if(!['draft','archived'].includes(next.status))next.status='draft';
    const {data:saved,error:saveError}=await client.from('cms_content_items')
      .upsert(next,{onConflict:'surface,locale,route,element_key'}).select('*').single();
    if(saveError)return json({error:'CMS_SAVE_FAILED'},500);
    const changeKind=existing?'save':'create';
    const {error:revisionError}=await client.from('cms_content_revisions').insert({
      item_id:saved.id,version:saved.version,snapshot:saved,change_kind:changeKind,changed_by:actor
    });
    if(revisionError)return json({error:'CMS_REVISION_WRITE_FAILED'},500);
    return json({item:saved});
  }

  if(action==='cms_admin_publish'||action==='cms_admin_archive'){
    const id=String(body?.id||'').trim();
    const actor=String(body?.actor||'cms-admin').trim().slice(0,320);
    if(!id)return json({error:'INVALID_CMS_ID'},400);
    const {data:existing,error:readError}=await client.from('cms_content_items').select('*').eq('id',id).maybeSingle();
    if(readError)return json({error:'CMS_ITEM_READ_FAILED'},500);
    if(!existing)return json({error:'CMS_ITEM_NOT_FOUND'},404);
    const now=new Date().toISOString();
    const nextStatus=action==='cms_admin_publish'?'published':'archived';
    const version=Number(existing.version||0)+1;
    const patch={status:nextStatus,version,updated_at:now,updated_by:actor,published_at:nextStatus==='published'?now:existing.published_at};
    const {data:saved,error:updateError}=await client.from('cms_content_items').update(patch).eq('id',id).select('*').single();
    if(updateError)return json({error:'CMS_STATUS_UPDATE_FAILED'},500);
    const {error:revisionError}=await client.from('cms_content_revisions').insert({
      item_id:saved.id,version:saved.version,snapshot:saved,change_kind:nextStatus==='published'?'publish':'archive',changed_by:actor
    });
    if(revisionError)return json({error:'CMS_REVISION_WRITE_FAILED'},500);
    return json({item:saved});
  }

  if(action==='control_plane_cockpit'){
    const {data:obligations,error:obligationError}=await client
      .from('powerhouse_obligation_cockpit_v1')
      .select('obligation_id,obligation_key,requested_goal,current_state,owner,operation_status,next_action,blocker,evidence_count,red_evidence_count,latest_evidence_at,policy_version,skill_version,production_observed_sha,latest_remote_ref,outcome_verified,migration_readback_verified,reconciliation_jobs,retry_count,escalated_jobs,actual_result,created_at,updated_at,time_to_terminal_seconds')
      .order('updated_at',{ascending:false})
      .limit(100);
    if(obligationError)return json({error:'CONTROL_PLANE_COCKPIT_READ_FAILED'},500);
    const {data:metrics,error:metricsError}=await client
      .from('powerhouse_control_plane_metrics_v1')
      .select('*')
      .maybeSingle();
    if(metricsError)return json({error:'CONTROL_PLANE_METRICS_READ_FAILED'},500);
    return json({
      contract:'powerhouse-control-plane-admin-cockpit-v1',
      obligations:Array.isArray(obligations)?obligations:[],
      metrics:metrics||{},
      generatedAt:new Date().toISOString()
    });
  }

  if(action==='data_sovereignty_get'){
    const {data,error}=await client.rpc('refresh_data_sovereignty_snapshot_v1',{p_tenant_id:tenantId});
    if(error)return json({error:'DATA_SOVEREIGNTY_READ_FAILED'},500);
    return json({snapshot:data});
  }

  if(action==='data_sovereignty_policy_set'){
    const policy=body?.policy&&typeof body.policy==='object'&&!Array.isArray(body.policy)?body.policy:null;
    if(!policy)return json({error:'INVALID_SOVEREIGNTY_POLICY'},400);
    const mode=String(policy.mode||'').trim();
    const preferredAiProvider=policy.preferredAiProvider==null?null:String(policy.preferredAiProvider).trim()||null;
    const preferredAiRegion=policy.preferredAiRegion==null?null:String(policy.preferredAiRegion).trim()||null;
    if(!['TRANSPARENT_GLOBAL','EU_STORAGE','EU_ONLY','CUSTOM'].includes(mode))return json({error:'INVALID_SOVEREIGNTY_MODE'},400);
    if(preferredAiProvider){
      const {data:provider,error:providerError}=await client.from('data_sovereignty_provider_registry_v1').select('provider_key,runtime_status').eq('provider_key',preferredAiProvider).maybeSingle();
      if(providerError)return json({error:'SOVEREIGNTY_PROVIDER_READ_FAILED'},500);
      if(!provider)return json({error:'UNKNOWN_AI_PROVIDER'},400);
    }
    const {data:existing,error:existingError}=await client.from('tenant_data_sovereignty_policy_v1').select('policy_version,ai_deployment_profile').eq('tenant_id',tenantId).maybeSingle();
    if(existingError)return json({error:'SOVEREIGNTY_POLICY_READ_FAILED'},500);
    const profileSupplied=Object.prototype.hasOwnProperty.call(policy,'aiDeploymentProfile');
    const aiDeploymentProfile=profileSupplied?policy.aiDeploymentProfile:(existing?.ai_deployment_profile??null);
    if(aiDeploymentProfile!==null&&!validAiDeploymentProfile(aiDeploymentProfile))
      return json({error:'INVALID_AI_DEPLOYMENT_PROFILE'},400);
    const strict=mode==='EU_ONLY';
    const storageStrict=mode==='EU_STORAGE';
    const next={
      tenant_id:tenantId,
      mode,
      preferred_ai_provider:preferredAiProvider,
      preferred_ai_region:preferredAiRegion,
      ai_deployment_profile:aiDeploymentProfile,
      allow_cross_border:strict?false:true,
      block_unknown_region:strict||storageStrict,
      enforcement_mode:strict||storageStrict?'BLOCK':'OBSERVE',
      policy_version:Number(existing?.policy_version||0)+1,
      updated_by:String(body?.actor||'portal-user').slice(0,320),
      updated_at:new Date().toISOString()
    };
    const {error:saveError}=await client.from('tenant_data_sovereignty_policy_v1').upsert(next,{onConflict:'tenant_id'});
    if(saveError)return json({error:'SOVEREIGNTY_POLICY_WRITE_FAILED'},500);
    const {data:snapshot,error:refreshError}=await client.rpc('refresh_data_sovereignty_snapshot_v1',{p_tenant_id:tenantId});
    if(refreshError)return json({error:'DATA_SOVEREIGNTY_REFRESH_FAILED'},500);
    return json({snapshot});
  }

  if(action==='data_sovereignty_provider_observe'){
    const providerKey=String(body?.providerKey||'').trim();
    if(!providerKey)return json({error:'INVALID_PROVIDER_OBSERVATION'},400);
    const {data,error}=await client.rpc('record_data_sovereignty_provider_observation_v1',{
      p_provider_key:providerKey,
      p_observed_region:body?.observedRegion==null?null:String(body.observedRegion),
      p_configured_storage_region:body?.configuredStorageRegion==null?null:String(body.configuredStorageRegion),
      p_source:String(body?.source||'runtime'),
      p_deploy_id:body?.deployId==null?null:String(body.deployId),
      p_commit_ref:body?.commitRef==null?null:String(body.commitRef),
      p_evidence:body?.evidence&&typeof body.evidence==='object'&&!Array.isArray(body.evidence)?body.evidence:{}
    });
    if(error)return json({error:'DATA_SOVEREIGNTY_PROVIDER_OBSERVE_FAILED'},500);
    return json({observation:data});
  }

  if(action==='security_trust_get'){
    const {data,error}=await client.rpc('refresh_security_trust_snapshot_v1',{p_tenant_id:tenantId});
    if(error)return json({error:'SECURITY_TRUST_READ_FAILED'},500);
    return json({snapshot:data});
  }

  if(action==='security_trust_observe'){
    const observation=body?.observation&&typeof body.observation==='object'&&!Array.isArray(body.observation)?body.observation:null;
    if(!observation)return json({error:'INVALID_SECURITY_OBSERVATION'},400);
    const providerKey=String(observation.providerKey||'').trim();
    const controlKey=String(observation.controlKey||'').trim();
    const status=String(observation.status||'').trim().toUpperCase();
    const source=String(observation.source||'runtime').trim();
    const expiresAt=observation.expiresAt==null?null:String(observation.expiresAt);
    if(!providerKey||!controlKey||!['VERIFIED','PASS','PARTIAL','WARN','FAIL','UNKNOWN'].includes(status))return json({error:'INVALID_SECURITY_OBSERVATION'},400);
    const {data,error}=await client.rpc('record_security_management_observation_v1',{
      p_tenant_id:tenantId,
      p_provider_key:providerKey,
      p_control_key:controlKey,
      p_status:status,
      p_evidence:observation.evidence&&typeof observation.evidence==='object'&&!Array.isArray(observation.evidence)?observation.evidence:{},
      p_source:source,
      p_expires_at:expiresAt,
      p_observed_by:String(body?.actor||'powerhouse-observer').slice(0,320)
    });
    if(error)return json({error:'SECURITY_TRUST_OBSERVE_FAILED'},500);
    return json({observation:data});
  }


  if(action==='entrepreneur_intelligence'){
    try{
      const [
        sources,publications,signalsRaw,domains,sourceCatalog,signalsCanonical,
        tenantImpacts,canonicalActions,tenantActions,baseSnapshots
      ]=await Promise.all([
        readRows('SOURCES',client.from('bronnen')
          .select('id,naam,uitgever,soort,controle_frequentie,laatst_gecontroleerd,laatste_controle_gelukt,actief,trefwoorden')
          .eq('actief',true).order('uitgever').order('naam')),
        readRows('PUBLICATIONS',client.from('bronpublicaties')
          .select('id,bron_id,titel,samenvatting,publicatiedatum,url,opgehaald_op,goedgekeurd,uitgever_url')
          .order('publicatiedatum',{ascending:false,nullsFirst:false}).limit(350)),
        readRows('EXTERNAL_SIGNALS',client.from('bg_externe_signalen')
          .select('url,onderwerp,titel,samenvatting,domein,gepubliceerd_op,brontrouw,bevestiging,versheid,relevantie,vertrouwen,toegestaan,opgehaald_op,deadline')
          .eq('toegestaan',true).order('gepubliceerd_op',{ascending:false,nullsFirst:false}).limit(250)),
        readRows('DOMAIN_REGISTRY',client.from('powerhouse_intelligence_domain_registry_v1')
          .select('domain_key,label,pillar,scope,description,default_signal_type,default_action_type,default_horizon_days,active,metadata')
          .eq('active',true).order('scope').order('pillar').order('label')),
        readRows('SOURCE_CATALOG',client.from('powerhouse_intelligence_source_catalog_v1')
          .select('source_key,label,publisher,scope,domain_keys,source_kind,authority_tier,activation_mode,canonical_url,adapter_key,update_cadence,jurisdiction,availability_state,last_observed_at,evidence_source_key,active,metadata')
          .eq('active',true).order('scope').order('authority_tier',{ascending:false}).order('label').limit(500)),
        readRows('SIGNAL_PROJECTION',client.from('powerhouse_intelligence_signal_projection_v1')
          .select('tenant_id,signal_key,source_observation_id,source_key,external_event_id,external_url,domain_key,signal_type,direction,title,summary,published_at,observed_at,deadline,source_trust,confirmation,freshness,relevance,source_confidence,urgency,signal_score,time_horizon_days,status,evidence')
          .eq('tenant_id','canonical').neq('status','DISMISSED').order('signal_score',{ascending:false}).order('observed_at',{ascending:false}).limit(300)),
        readRows('COMPANY_IMPACT',client.from('powerhouse_intelligence_company_impact_v1')
          .select('tenant_id,impact_key,signal_key,target_node_key,target_node_type,target_label,relevance,probability,magnitude,urgency,exposure,source_confidence,reversibility,impact_score,estimated_value_eur,estimated_loss_eur,impact_dimensions,rationale,evidence,status,observed_at,updated_at')
          .eq('tenant_id',tenantId).neq('status','DISMISSED').order('impact_score',{ascending:false,nullsFirst:false}).order('observed_at',{ascending:false}).limit(500)),
        readRows('CANONICAL_ACTIONS',client.from('powerhouse_intelligence_action_candidate_v1')
          .select('tenant_id,action_key,signal_key,impact_key,domain_key,title,rationale,action_type,priority_score,owner_hint,due_at,expected_value_eur,estimated_loss_avoided_eur,canonical_action_ref,outcome_ref,status,evidence')
          .eq('tenant_id','canonical').in('status',['CANDIDATE','READY','MATERIALIZED']).order('priority_score',{ascending:false}).limit(100)),
        readRows('TENANT_ACTIONS',client.from('powerhouse_intelligence_action_candidate_v1')
          .select('tenant_id,action_key,signal_key,impact_key,domain_key,title,rationale,action_type,priority_score,owner_hint,due_at,expected_value_eur,estimated_loss_avoided_eur,canonical_action_ref,outcome_ref,status,evidence')
          .eq('tenant_id',tenantId).in('status',['CANDIDATE','READY','MATERIALIZED','DONE']).order('priority_score',{ascending:false}).limit(100)),
        readRows('INTELLIGENCE_SNAPSHOT',client.from('powerhouse_intelligence_snapshot_v1')
          .select('tenant_id,refreshed_at,catalog_source_count,public_source_count,connector_source_count,domain_count,observed_signal_count,signals_24h,signals_7d,high_attention_count,scored_impact_count,action_candidate_count,known_opportunity_value_eur,known_risk_value_eur,top_domains,source_health,status,evidence,updated_at')
          .eq('tenant_id','canonical').limit(1))
      ]);
      const intelligenceSignals=mergeEntrepreneurSignals(signalsCanonical,tenantImpacts);
      const actionCandidates=mergeEntrepreneurActions(canonicalActions,tenantActions);
      const snapshot=buildEntrepreneurSnapshot(baseSnapshots[0]||null,domains,sourceCatalog,intelligenceSignals,tenantImpacts,actionCandidates);
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
          actionCandidates,
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
          intelligenceActionCount:actionCandidates.length,
          connectedOrObservedSourceCount:sourceCatalog.filter((item:any)=>['CONNECTED','OBSERVED','LIVE'].includes(item.availability_state)).length
        }
      });
    }catch(error){
      return json({error:'ENTREPRENEUR_INTELLIGENCE_READ_FAILED',source:String(error instanceof Error?error.message:'UNKNOWN').slice(0,80)},500);
    }
  }

  if(action==='governance'){
    const {data,error}=await client.from('brain_ai_governance_registry')
      .select('tenant_id,use_case_id,name,provider,model_id,model_revision,purpose,owner_id,lifecycle_status,risk_class,human_oversight,data_categories,prohibited_data_categories,retention_policy,transparency_required,impact_assessment_required,approved,approval_evidence_ids,evidence_ids,last_reviewed_at,next_review_at,inference_platform,training_use,processing_scope,cross_border_transfer,subprocessors,transfer_safeguard,provider_evidence_urls')
      .in('tenant_id',['canonical',tenantId])
      .eq('lifecycle_status','ACTIVE')
      .eq('approved',true)
      .order('use_case_id');
    if(error)return json({error:'GOVERNANCE_READ_FAILED'},500);
    return json({governance:data||[]});
  }

  if(action==='resource_business_value'){
    const {data:summary,error:summaryError}=await client
      .from('powerhouse_portal_resource_summary_v2')
      .select('*')
      .eq('tenant_id',tenantId)
      .maybeSingle();
    if(summaryError)return json({error:'RESOURCE_BUSINESS_VALUE_READ_FAILED'},500);
    const {data:evidence,error:evidenceError}=await client
      .from('powerhouse_action_evidence_maturity_v1')
      .select('action_id,resource_evidence_status,economics_evidence_status,outcome_evidence_status,forecast_evidence_status,evidence_maturity,calibration_eligible,calibration_eligibility_reason,human_feedback_observations,latest_resource_observed_at,latest_economics_observed_at,latest_outcome_observed_at,latest_calibration_at')
      .contains('tenant_ids',[tenantId])
      .limit(500);
    if(evidenceError)return json({error:'ACTION_EVIDENCE_READ_FAILED'},500);
    const {data:lineage,error:lineageError}=await client
      .from('powerhouse_resource_impact_v1')
      .select('factor_id,methodology,confidence,source,occurred_at')
      .eq('tenant_id',tenantId)
      .eq('calculation_status','calculated')
      .limit(5000);
    if(lineageError)return json({error:'RESOURCE_LINEAGE_READ_FAILED'},500);
    const {data:resourceDaily,error:resourceError}=await client
      .from('powerhouse_resource_intelligence_daily_v1')
      .select('day,tenant_id,provider,resource_type,unit,usage_events,resource_amount,factor_observations,factor_coverage,energy_kwh,co2e_kg,water_liters,min_factor_confidence,provenance_complete')
      .eq('tenant_id',tenantId)
      .order('day',{ascending:false})
      .limit(365);
    if(resourceError)return json({error:'RESOURCE_INTELLIGENCE_READ_FAILED'},500);
    const {data:businessValue,error:businessError}=await client
      .from('powerhouse_business_value_intelligence_v1')
      .select('action_id,action_type,channel,status,expected_value_eur,resource_observations,calculated_impact_observations,energy_kwh,co2e_kg,water_liters,tenant_ids,provider_cost_eur,external_cost_eur,human_minutes,observed_cost_eur,realized_revenue_eur,realized_net_value_eur,realized_roi,environmental_factor_coverage,business_value_status')
      .contains('tenant_ids',[tenantId])
      .limit(500);
    if(businessError)return json({error:'BUSINESS_VALUE_INTELLIGENCE_READ_FAILED'},500);
    const {data:compliance,error:complianceError}=await client
      .from('powerhouse_compliance_evidence_v1')
      .select('control_key,requirement_key,evidence_status,evidence_refs,confidence,review_required,observed_at')
      .eq('tenant_id',tenantId)
      .order('observed_at',{ascending:false})
      .limit(500);
    if(complianceError)return json({error:'COMPLIANCE_EVIDENCE_READ_FAILED'},500);
    const {data:recommendations,error:recommendationError}=await client
      .from('powerhouse_resource_optimization_queue_v1')
      .select('candidate_id,opportunity_type,expected_impact,confidence,safety_class,proposed_action,status,created_at')
      .eq('tenant_id',tenantId)
      .limit(100);
    if(recommendationError)return json({error:'RESOURCE_RECOMMENDATIONS_READ_FAILED'},500);

    const rows=Array.isArray(evidence)?evidence:[];
    const lineageRows=Array.isArray(lineage)?lineage:[];
    const factorVersions=cleanUnique(lineageRows.map((row:any)=>row.factor_id));
    const methodologies=cleanUnique(lineageRows.map((row:any)=>row.methodology));
    const sources=cleanUnique(lineageRows.map((row:any)=>row.source));
    const uniqueConfidences=[...new Set(lineageRows.map((row:any)=>Number(row.confidence)).filter((value:number)=>Number.isFinite(value)&&value>0&&value<=1))];
    const calculatedAt=lineageRows.map((row:any)=>row.occurred_at).map((value:any)=>String(value??'').trim()).filter((value:string)=>value&&Number.isFinite(Date.parse(value))).sort((a:string,b:string)=>Date.parse(b)-Date.parse(a))[0]||'';
    const resourceFootprint=summary&&lineageRows.length>0&&factorVersions.length>0&&methodologies.length>0&&sources.length>0&&uniqueConfidences.length===1&&calculatedAt?{
      coverage:Number(summary.environmental_factor_coverage)||0,
      confidence:uniqueConfidences[0],
      calculatedAt,
      factorVersions,
      methodologies,
      sources,
      calculationStatus:'calculated',
      measurementClass:'calculated',
      energyKwh:summary.energy_kwh,
      co2eKg:summary.co2e_kg,
      waterLiters:summary.water_liters
    }:null;
    const complianceRows=(Array.isArray(compliance)?compliance:[]).map((row:any)=>({
      control_key:row.control_key,requirement_key:row.requirement_key,evidence_status:row.evidence_status,
      confidence:row.confidence,review_required:row.review_required,observed_at:row.observed_at,
      evidence_count:Array.isArray(row.evidence_refs)?row.evidence_refs.length:0
    }));
    const intelligence={
      resource_daily:Array.isArray(resourceDaily)?resourceDaily:[],
      business_value:Array.isArray(businessValue)?businessValue:[],
      compliance_evidence:complianceRows,
      recommendations:Array.isArray(recommendations)?recommendations:[],
      freshness:{resource_latest_at:summary?.latest_observed_at||null,generated_at:new Date().toISOString()},
      truth_policy:'measured_or_evidence_backed_else_unknown'
    };
    const base=summary||{tenant_id:tenantId,observations:0,calculated_impact_observations:0,attributed_action_observations:0,environmental_factor_coverage:null,action_attribution_coverage:null,energy_kwh:null,co2e_kg:null,water_liters:null,observed_cost_eur:null,realized_revenue_eur:null,realized_roi:null,latest_observed_at:null};
    return json({resourceBusinessValue:{
      ...base,
      action_evidence_rows:rows.length,
      measured_actions:rows.filter((row:any)=>row.evidence_maturity==='measured').length,
      partial_actions:rows.filter((row:any)=>row.evidence_maturity==='partial').length,
      calibration_eligible_actions:rows.filter((row:any)=>row.calibration_eligible===true).length,
      human_feedback_observations:rows.reduce((total:number,row:any)=>total+Number(row.human_feedback_observations||0),0),
      evidence_source:'powerhouse_action_evidence_maturity_v1',
      resource_footprint:resourceFootprint,
      resource_intelligence:intelligence
    }});
  }

  const layer=String(body?.layer||'').trim();
  if(!ALLOWED_LAYERS.has(layer))return json({error:'INVALID_REQUEST'},400);
  if(action==='get'){
    const {data,error}=await client.rpc('bg_portal_state_get_internal',{p_tenant_id:tenantId,p_layer:layer});
    if(error)return json({error:'STORE_READ_FAILED'},500);
    let payload=Array.isArray(data)&&data[0]?data[0].payload:null;
    if(layer==='canonical-brain'){
      const {data:authorityRecords,error:authorityError}=await client.from('brain_records')
        .select('record_id,record_type,record_kind,subject_id,owner_id,observed_at,updated_at,source_revision,provenance,payload')
        .eq('tenant_id',tenantId)
        .eq('record_type','BusinessInput')
        .order('updated_at',{ascending:true})
        .limit(1000);
      if(authorityError)return json({error:'BUSINESS_INPUT_AUTHORITY_READ_FAILED'},500);
      if(Array.isArray(authorityRecords)&&authorityRecords.length>0)payload=repairBusinessInputsFromAuthority(payload||{},authorityRecords);
    }
    return json({payload});
  }
  if(action==='put'){
    if(!body.payload||typeof body.payload!=='object'||Array.isArray(body.payload))return json({error:'INVALID_PAYLOAD'},400);
    const {data,error}=await client.rpc('bg_portal_state_put_internal',{p_tenant_id:tenantId,p_layer:layer,p_payload:body.payload});
    if(error)return json({error:'STORE_WRITE_FAILED'},500);
    const row=Array.isArray(data)&&data[0]?data[0]:null; if(!row)return json({error:'STORE_WRITE_EMPTY'},500);
    return json({stored:Boolean(row.stored),stale:Boolean(row.stale),record:row.record||body.payload});
  }
  return json({error:'INVALID_ACTION'},400);
});