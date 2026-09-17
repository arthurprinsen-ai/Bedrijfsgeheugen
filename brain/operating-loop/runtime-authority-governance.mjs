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
  }

  for(const obligation of material){
    const owners=active.filter(x=>(x.obligations||[]).includes(obligation));
    if(owners.length===0) violations.push({code:'MISSING_MATERIAL_OWNER',obligation});
    if(owners.length>1) violations.push({code:'DUPLICATE_MATERIAL_OWNER',obligation,owners:owners.map(x=>x.id)});
  }

  const ids=new Set(components.map(x=>x.id));
  const seenChannels=new Set();
  for(const channel of registry?.channels||[]){
    if(seenChannels.has(channel.channel)) violations.push({code:'DUPLICATE_CHANNEL_BINDING',channel:channel.channel});
    seenChannels.add(channel.channel);
    if(!ids.has(channel.owner_component_id)) violations.push({code:'UNKNOWN_CHANNEL_OWNER',channel:channel.channel,owner:channel.owner_component_id});
    if(String(channel.delivery_runtime||'').startsWith('UNSUPPORTED')&&channel.autonomous_publish_allowed!==false){
      violations.push({code:'UNSUPPORTED_CHANNEL_NOT_FAIL_CLOSED',channel:channel.channel});
    }
  }

  const controls=registry?.controls||{};
  if(controls.single_owner_gate!=='FAIL_CLOSED') violations.push({code:'SINGLE_OWNER_GATE_NOT_FAIL_CLOSED'});
  if(controls.runtime_drift_detector!=='ENABLED') violations.push({code:'RUNTIME_DRIFT_DETECTOR_DISABLED'});
  if(controls.interrupted_run_recovery!=='EXISTING_BRAIN_OBLIGATION_RUNTIME') violations.push({code:'NON_CANONICAL_RECOVERY_RUNTIME'});
  if(controls.writeback_route!=='public.brain_append_record') violations.push({code:'NON_CANONICAL_WRITEBACK_ROUTE'});

  return {ready:violations.length===0,violations};
}
