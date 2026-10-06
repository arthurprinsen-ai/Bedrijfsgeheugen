const nonEmpty=v=>typeof v==='string'&&v.trim()!=='';

export function evaluateRuntimeAuthority(registry){
  const violations=[];
  const components=Array.isArray(registry?.components)?registry.components:[];
  const material=Array.isArray(registry?.material_obligations)?registry.material_obligations:[];
  const active=components.filter(x=>x.authority==='ACTIVE');

  for(const component of components){
    if(component.classification==='LEGACY_RETIRED_PATH'&&(component.authority!=='NONE'||component.production_execution_allowed!==false)){
      violations.push({code:'RETIRED_EXECUTOR_ACTIVE',component_id:component.id});
    }
    if(component.runtime==='make'){
      if(component.authority!=='NONE'||component.production_execution_allowed!==false){
        violations.push({code:'MAKE_EXECUTION_AUTHORITY_FORBIDDEN',component_id:component.id});
      }
      if(component.resume_policy!=='EXPLICIT_REENABLE_THROUGH_CURRENT_GATES_ONLY'){
        violations.push({code:'MAKE_RESUME_POLICY_MISSING',component_id:component.id});
      }
    }
    if(component.authority==='ACTIVE'){
      const certified=nonEmpty(component.id)&&nonEmpty(component.runtime)&&nonEmpty(component.classification)&&
        typeof component.production_execution_allowed==='boolean'&&Array.isArray(component.obligations)&&nonEmpty(component.role);
      if(!certified) violations.push({code:'UNCERTIFIED_ACTIVE_COMPONENT',component_id:component.id||null});
    }
  }

  for(const obligation of material){
    const owners=active.filter(x=>(x.obligations||[]).includes(obligation));
    if(owners.length===0) violations.push({code:'MISSING_MATERIAL_OWNER',obligation});
    if(owners.length>1) violations.push({code:'DUPLICATE_MATERIAL_OWNER',obligation,owners:owners.map(x=>x.id)});
  }

  const byId=new Map(components.map(x=>[x.id,x]));
  const seenChannels=new Set();
  for(const channel of registry?.channels||[]){
    if(seenChannels.has(channel.channel)) violations.push({code:'DUPLICATE_CHANNEL_BINDING',channel:channel.channel});
    seenChannels.add(channel.channel);
    const owner=byId.get(channel.owner_component_id);
    if(!owner) violations.push({code:'UNKNOWN_CHANNEL_OWNER',channel:channel.channel,owner:channel.owner_component_id});
    else if(owner.authority!=='ACTIVE') violations.push({code:'CHANNEL_OWNER_NOT_ACTIVE',channel:channel.channel,owner:channel.owner_component_id});
    if(String(channel.delivery_runtime||'').startsWith('UNSUPPORTED')&&channel.autonomous_publish_allowed!==false){
      violations.push({code:'UNSUPPORTED_CHANNEL_NOT_FAIL_CLOSED',channel:channel.channel});
    }
  }

  const controls=registry?.controls||{};
  if(controls.single_owner_gate!=='FAIL_CLOSED') violations.push({code:'SINGLE_OWNER_GATE_NOT_FAIL_CLOSED'});
  if(controls.runtime_drift_detector!=='ENABLED') violations.push({code:'RUNTIME_DRIFT_DETECTOR_DISABLED'});
  if(controls.interrupted_run_recovery!=='EXISTING_BRAIN_OBLIGATION_RUNTIME') violations.push({code:'NON_CANONICAL_RECOVERY_RUNTIME'});
  if(controls.writeback_route!=='public.brain_append_record') violations.push({code:'NON_CANONICAL_WRITEBACK_ROUTE'});
  if(controls.supabase_edge_production_authority!=='PROTECTED_MAIN_ONLY') violations.push({code:'SUPABASE_EDGE_PRODUCTION_AUTHORITY_NOT_PROTECTED_MAIN'});
  if(controls.supabase_edge_source_of_truth!=='GITHUB_PROTECTED_MAIN') violations.push({code:'SUPABASE_EDGE_SOURCE_OF_TRUTH_NOT_PROTECTED_MAIN'});
  if(controls.supabase_edge_direct_provider_deploy!=='FORBIDDEN') violations.push({code:'DIRECT_SUPABASE_EDGE_PROVIDER_DEPLOY_NOT_FORBIDDEN'});
  if(controls.supabase_edge_manual_recovery!=='TRUSTED_CURRENT_MAIN_ONLY') violations.push({code:'SUPABASE_EDGE_MANUAL_RECOVERY_NOT_TRUSTED_MAIN_ONLY'});
  if(controls.supabase_edge_drift_policy!=='FAIL_CLOSED') violations.push({code:'SUPABASE_EDGE_DRIFT_NOT_FAIL_CLOSED'});
  if(controls.supabase_edge_promotion_workflow!=='.github/workflows/supabase-edge-production-authority.yml') violations.push({code:'SUPABASE_EDGE_PROMOTION_WORKFLOW_DRIFT'});
  if(controls.supabase_edge_provider_deployer!=='GITHUB_ACTIONS_SUPABASE_CLI') violations.push({code:'SUPABASE_EDGE_PROVIDER_DEPLOYER_DRIFT'});
  if(controls.supabase_edge_github_actions_role!=='SOLE_DEPLOYER_AND_BYTE_READBACK') violations.push({code:'SUPABASE_EDGE_GITHUB_ACTIONS_ROLE_DRIFT'});
  if(controls.supabase_edge_static_pat_required!==true) violations.push({code:'SUPABASE_EDGE_PAT_REQUIREMENT_DRIFT'});
  if(controls.supabase_edge_provider_check!=='ADVISORY_ONLY') violations.push({code:'SUPABASE_EDGE_PROVIDER_CHECK_AUTHORITY_DRIFT'});
  if(controls.supabase_edge_provider_app!=='supabase') violations.push({code:'SUPABASE_EDGE_PROVIDER_APP_DRIFT'});
  if(controls.supabase_edge_cli_version!=='2.119.0') violations.push({code:'SUPABASE_EDGE_CLI_VERSION_DRIFT'});
  if(controls.supabase_edge_pat_scope!=='PROJECT_SCOPED_EDGE_FUNCTIONS_READ_WRITE_PREFERRED') violations.push({code:'SUPABASE_EDGE_PAT_SCOPE_DRIFT'});
  if(controls.supabase_edge_provider_readback!=='BYTE_FOR_BYTE_SOURCE_TREE') violations.push({code:'SUPABASE_EDGE_PROVIDER_READBACK_DRIFT'});

  return {ready:violations.length===0,violations};
}
