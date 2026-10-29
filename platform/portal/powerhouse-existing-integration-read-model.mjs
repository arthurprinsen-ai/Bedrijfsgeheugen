/**
 * Admin-only source projection for the EXISTING Powerhouse Control Plane.
 * Not an executor, scheduler, incident store, integration writer, or claim of
 * authenticated end-to-end business execution. Service key never leaves server.
 */
const SOURCES=Object.freeze([
  {name:'health',table:'powerhouse_one_brain_runtime_health_v1',query:'select=observed_at,total_layers,wired_layers,required_jobs,active_jobs,current_runtime_errors,evidence_sparse_required_layers,content_loop_state,architecture_state,learning_state&limit=2',max:1},
  {name:'capabilities',table:'powerhouse_one_brain_capability_inventory_v1',query:'select=capability_key,domain,connection_state,evidence_rows&limit=101',max:100},
  {name:'layers',table:'powerhouse_one_brain_intelligence_inventory_v1',query:'select=layer_key,domain,wiring_state,evidence_state,evidence_rows&limit=101',max:100},
  {name:'experiments',table:'powerhouse_autonomous_experiment_readiness_v1',query:'select=readiness_state,assignments,treatment_assignments,holdout_assignments,observed_at&limit=2',max:1},
  {name:'revenue',table:'powerhouse_revenue_event_spine_health_v1',query:'select=measured_at,scored_prospects,next_best_actions,attribution_touches,realized_revenue_eur,attributed_revenue_eur&limit=2',max:1},
  {name:'loops',table:'powerhouse_loop_integrity_health_v1',query:'select=observed_at,total_loops,green_loops,amber_loops,red_loops,fully_evidenced_loops,overall_status&limit=2',max:1},
  {name:'terminal',table:'powerhouse_terminal_control_plane_health_v1',query:'select=observed_at,nonterminal_obligations,blocked_obligations,escalated_reconciliation_jobs,control_plane_healthy,stale_green_truths&limit=2',max:1}
]);
const metric=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
const text=v=>typeof v==='string'?v.slice(0,90):null;
const rows=v=>Array.isArray(v)?v:[];
const usable=(readStates,key)=>readStates[key]==='LIVE';

export function projectPowerhouseIntegrationReadback({datasets={},readStates={},at=new Date().toISOString()}={}){
  const healthRows=usable(readStates,'health')?rows(datasets.health):[];
  const capabilities=usable(readStates,'capabilities')?rows(datasets.capabilities):[];
  const layers=usable(readStates,'layers')?rows(datasets.layers):[];
  const expRows=usable(readStates,'experiments')?rows(datasets.experiments):[];
  const revenueRows=usable(readStates,'revenue')?rows(datasets.revenue):[];
  const loopRows=usable(readStates,'loops')?rows(datasets.loops):[];
  const terminalRows=usable(readStates,'terminal')?rows(datasets.terminal):[];
  const health=healthRows[0]||null, experiments=expRows[0]||null, revenue=revenueRows[0]||null;
  const loops=loopRows[0]||null, terminal=terminalRows[0]||null;
  const sourceNames=SOURCES.map(x=>x.name);
  const sourceComplete=sourceNames.every(n=>usable(readStates,n));
  const gaps=['END_TO_END_HANDOFF_EVIDENCE_NOT_IN_THIS_PROJECTION',
    'AGENT_SKILL_EXECUTION_READBACK_NOT_IN_THIS_PROJECTION',
    'INDEPENDENT_BUSINESS_OUTCOME_VERIFICATION_REQUIRED'];
  for(const key of sourceNames)if(!usable(readStates,key))gaps.push('SOURCE_UNAVAILABLE:'+key);
  if(health?.architecture_state&&health.architecture_state!=='GREEN')gaps.push('ARCHITECTURE_NOT_GREEN');
  if(health?.learning_state&&health.learning_state!=='EVIDENCE_CURRENT')gaps.push('LEARNING_EVIDENCE_DUE');
  if(health?.content_loop_state&&health.content_loop_state!=='VERIFIED')gaps.push('CONTENT_LOOP_NOT_VERIFIED');
  if(experiments && metric(experiments.holdout_assignments)===0)
    gaps.push('CAUSAL_HOLDOUT_NOT_OBSERVED');
  if(loops && (loops.overall_status!=='GREEN'||metric(loops.red_loops)!==0||metric(loops.amber_loops)!==0))
    gaps.push('LOOP_ASSURANCE_NOT_GREEN');
  if(terminal && terminal.control_plane_healthy!==true)
    gaps.push('TERMINAL_CONTROL_PLANE_UNHEALTHY');
  if(terminal && metric(terminal.blocked_obligations)>0)
    gaps.push('BLOCKED_OBLIGATIONS_REQUIRE_ORIGINAL_OWNER');
  if(terminal && metric(terminal.escalated_reconciliation_jobs)>0)
    gaps.push('RESULT_UNKNOWN_RECONCILIATION_REQUIRES_READBACK');
  return {
    contract:'POWERHOUSE_EXISTING_SYSTEMS_ADMIN_READBACK_V1',
    observedAt:at,
    sourceState:sourceComplete?'READABLE':'PARTIAL',
    // Hard boundary: a health query never proves the whole loop ran.
    integrationState:'END_TO_END_UNPROVEN',
    sourceReadStates:Object.fromEntries(sourceNames.map(n=>[n,text(readStates[n])||'UNAVAILABLE'])),
    architecture:health?{
      state:text(health.architecture_state),learningState:text(health.learning_state),
      contentLoopState:text(health.content_loop_state),
      totalLayers:metric(health.total_layers),wiredLayers:metric(health.wired_layers),
      requiredJobs:metric(health.required_jobs),activeJobs:metric(health.active_jobs),
      currentRuntimeErrors:metric(health.current_runtime_errors),
      evidenceDueConditions:metric(health.evidence_sparse_required_layers),
      readAt:health.observed_at||null
    }:null,
    capabilities:usable(readStates,'capabilities')?{
      registered:capabilities.length,
      wired:capabilities.filter(x=>x.connection_state==='CONNECTED_TO_ONE_BRAIN').length,
      withoutEvidence:capabilities.filter(x=>metric(x.evidence_rows)===0).length,
      domains:[...new Set(capabilities.map(x=>x.domain).filter(v=>typeof v==='string'))].sort().slice(0,60)
    }:null,
    intelligence:usable(readStates,'layers')?{
      registered:layers.length,
      wired:layers.filter(x=>x.wiring_state==='WIRED').length,
      withoutEvidence:layers.filter(x=>x.evidence_state==='NO_EVIDENCE_YET').length
    }:null,
    experiments:experiments?{
      readiness:text(experiments.readiness_state),
      assignments:metric(experiments.assignments),holdoutAssignments:metric(experiments.holdout_assignments),
      readAt:experiments.observed_at||null
    }:null,
    loopAssurance:loops?{
      state:text(loops.overall_status),total:metric(loops.total_loops),
      green:metric(loops.green_loops),amber:metric(loops.amber_loops),
      red:metric(loops.red_loops),fullyEvidenced:metric(loops.fully_evidenced_loops),
      readAt:loops.observed_at||null
    }:null,
    terminalControl:terminal?{
      healthy:terminal.control_plane_healthy===true,
      nonterminal:metric(terminal.nonterminal_obligations),
      blocked:metric(terminal.blocked_obligations),
      escalated:metric(terminal.escalated_reconciliation_jobs),
      staleGreen:metric(terminal.stale_green_truths),
      readAt:terminal.observed_at||null
    }:null,
    commercial:revenue?{
      prospects:metric(revenue.scored_prospects),nextBestActions:metric(revenue.next_best_actions),
      attributionTouches:metric(revenue.attribution_touches),
      realizedRevenueEur:metric(revenue.realized_revenue_eur),
      attributedRevenueEur:metric(revenue.attributed_revenue_eur),
      readAt:revenue.measured_at||null,
      boundary:'AGGREGATED_CANONICAL_SOURCE_NOT_PAYMENT_PROVIDER_PROOF'
    }:null,
    gapCodes:gaps
  };
}

export async function readPowerhouseIntegrationReadback({baseUrl,key,fetchImpl=globalThis.fetch,at}={}){
  if(!/^https:\/\//.test(String(baseUrl||'')) || !key || typeof fetchImpl!=='function')
    return projectPowerhouseIntegrationReadback({readStates:Object.fromEntries(SOURCES.map(s=>[s.name,'CONFIG_UNAVAILABLE'])),at});
  const base=String(baseUrl).replace(/\/$/,'');
  const settled=await Promise.allSettled(SOURCES.map(async(source)=>{
    const r=await fetchImpl(base+'/rest/v1/'+source.table+'?'+source.query,{
      headers:{accept:'application/json',apikey:key,authorization:'Bearer '+key},
      signal:AbortSignal.timeout(4500)
    });
    if(!r.ok)throw new Error('READ_FAILED');
    const body=await r.json();
    if(!Array.isArray(body))throw new Error('INVALID_SOURCE_SHAPE');
    return body;
  }));
  const datasets={},readStates={};
  settled.forEach((r,index)=>{
    const source=SOURCES[index],value=r.status==='fulfilled'?r.value:null;
    const good=value!==null && value.length<=source.max && (source.max!==1 || value.length===1);
    readStates[source.name]=good?'LIVE':value&&value.length>source.max?'TRUNCATED':'UNAVAILABLE';
    datasets[source.name]=good?value:[];
  });
  return projectPowerhouseIntegrationReadback({datasets,readStates,at});
}
