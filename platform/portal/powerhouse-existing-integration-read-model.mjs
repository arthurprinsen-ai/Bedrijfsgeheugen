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
  {name:'terminal',table:'powerhouse_terminal_control_plane_health_v1',query:'select=observed_at,nonterminal_obligations,blocked_obligations,escalated_reconciliation_jobs,control_plane_healthy,stale_green_truths&limit=2',max:1},
  // Existing commercial read-model and ORIGINAL Brain incident ledger, admin-only.
  // Return only non-identifying source fields; never last_evidence, person/email,
  // tenant data, provider tokens or customer-level action rows.
  {name:'commercialHandoff',table:'powerhouse_commercial_handoff_scorecard_v1',
    query:'select=measured_at,original_email_actions_7d,provider_readback_proven_7d,broken_or_unproven_handoffs_7d,linked_experiment_treatments_7d,provider_linked_replies_7d,provider_linked_meetings_7d,provider_linked_realized_revenue_eur_7d,handoff_health&limit=2',max:1},
  {name:'commercialIncidents',table:'brain_blockers',
    query:'select=fingerprint,scope,severity,state,updated_at,resolved_at&scope=like.powerhouse%3Acommercial%3A*&order=updated_at.desc&limit=17',max:16},
  // Same original innovation candidate → ONE BRAIN obligation → agent intake.
  // Source-bounded admin-only projection, NOT a second registry or executor.
  {name:'innovationCandidates',table:'powerhouse_optimization_candidate_v1',
    query:'select=candidate_id,source_key,owner_agent,status,safety_class&tenant_id=eq.canonical&order=created_at.asc&limit=101',max:100},
  {name:'innovationObligations',table:'brain_obligations',
    query:'select=business_entity,change_id,owner,state,payload_sha256,evidence&obligation_type=eq.INNOVATION_DELIVERY&capability_id=eq.powerhouse-self-improvement-layer-v1&limit=101',max:100},
  {name:'innovationIntakes',table:'brain_operations',
    query:'select=operation_type,capability_id,status,correlation_id,idempotency_key,change_id,payload_sha256,remote_ref,evidence,updated_at&operation_type=eq.INNOVATION_INTAKE&limit=101',max:100}
]);
const metric=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
const text=v=>typeof v==='string'?v.slice(0,90):null;
const rows=v=>Array.isArray(v)?v:[];
const usable=(readStates,key)=>readStates[key]==='LIVE';

const bounded=v=>typeof v==='string'?v.slice(0,160):null;
const ACK_TRUE=v=>v===true||v==='true';
/**
 * Read-only exact-identity reconciliation of the SAME existing source,
 * ONE BRAIN obligation and original agent intake; no guessed ACK or effect.
 * Fail closed on duplicate cardinality, unknown owner, partial provider reads.
 */
export function projectOriginalInnovationHandoff({candidates=[],obligations=[],intakes=[],at=new Date().toISOString()}={}){
  const c=rows(candidates),b=rows(obligations),o=rows(intakes);
  const expectedAgent=owner=>owner==='engineering'?'agent:agent-integration-engineer':
    owner==='cro'?'agent:agent-growth-market':null;
  const byId=new Map(),byOp=new Map();
  for(const record of b){
    const id=record?.business_entity;
    if(typeof id!=='string')continue;
    const group=byId.get(id)||[]; group.push(record);byId.set(id,group);
  }
  for(const record of o){
    const id=String(record?.correlation_id||'');
    const group=byOp.get(id)||[];group.push(record);byOp.set(id,group);
  }
  const entries=c.map(record=>{
    const id=String(record?.candidate_id||'');
    const owner=String(record?.owner_agent||'');
    const expected=expectedAgent(owner);
    const matches=byId.get(id)||[];
    const operations=byOp.get('innovation-delivery:'+id)||[];
    const obligation=matches.length===1?matches[0]:null;
    const operation=operations.length===1?operations[0]:null;
    const digest=String(obligation?.payload_sha256||'');
    const exact=Boolean(
      id && expected && matches.length===1 && operations.length===1
      && obligation?.change_id===record.source_key
      && obligation?.owner==='original-agent:'+owner
      && digest.length===64 && /^[a-f0-9]{64}$/i.test(digest)
      && operation?.operation_type==='INNOVATION_INTAKE'
      && operation?.capability_id===expected
      && operation?.change_id===record.source_key
      && operation?.payload_sha256===digest
      && operation?.idempotency_key==='innovation-delivery:'+id+':'+digest.slice(0,16)
    );
    const evidence=operation?.evidence||{};
    const ack=exact && operation?.status==='VERIFIED'
      && typeof operation.remote_ref==='string' && operation.remote_ref.trim()!==''
      && evidence.consumer_owner===expected
      && evidence.source_revision===obligation?.evidence?.source_revision
      && ACK_TRUE(evidence.independent_consumer_readback);
    return {
      candidateId:bounded(id),sourceKey:bounded(record?.source_key),
      ownerAgent:expected,operationStatus:bounded(operation?.status),
      obligationState:bounded(obligation?.state),sourceBound:exact,consumerAckProven:ack,
      reviewRequired:record?.safety_class==='review_required',
      // Every candidate remains open for independently measured improvement.
      nextSafeAction:!exact?'REPAIR_ORIGINAL_SOURCE_OPERATION_BINDING':
        !ack?'ORIGINAL_AGENT_SOURCE_BOUND_REVIEW_AND_RECEIPT':
        'PROTECTED_RELEASE_INDEPENDENT_EFFECT_AND_LEARNING_PROOF'
    };
  });
  const uniqueIds=new Set(entries.map(e=>e.candidateId));
  const bound=entries.filter(x=>x.sourceBound).length;
  const verified=entries.filter(x=>x.consumerAckProven).length;
  const orphans=Array.from(byOp.keys()).filter(key=>key.startsWith('innovation-delivery:') &&
    !uniqueIds.has(key.slice('innovation-delivery:'.length))).length;
  const orphanObligations=Array.from(byId.keys()).filter(id=>!uniqueIds.has(id)).length;
  const duplicate=uniqueIds.size!==entries.length;
  const complete=entries.length<=100 && b.length<=100 && o.length<=100
    && orphans===0 && orphanObligations===0 && !duplicate;
  const state=!complete?'SOURCE_IDENTITY_CONFLICT':!entries.length?'NO_SOURCE_CANDIDATES':
    bound!==entries.length?'SOURCE_LINEAGE_GAP':
    verified!==entries.length?'CONSUMER_ACK_DUE':'CONSUMER_ACK_PROVEN_OUTCOME_DUE';
  return {
    state,readAt:at,candidates:entries.length,sourceBound:bound,
    ownerEngineering:entries.filter(x=>x.ownerAgent==='agent:agent-integration-engineer').length,
    ownerCro:entries.filter(x=>x.ownerAgent==='agent:agent-growth-market').length,
    awaitingAgentAck:entries.filter(x=>!x.consumerAckProven).length,
    verifiedConsumerAcks:verified,
    orphanOperations:orphans,orphanObligations,duplicateCandidateIds:duplicate,
    independentlyVerifiedInnovations:null,
    source:'ORIGINAL_CANDIDATE_BRAIN_OBLIGATION_BRAIN_OPERATION_READBACK',
    outcomeProof:'NOT_IN_THIS_PROJECTION',
    entries:entries.slice(0,25)
  };
}


export function projectPowerhouseIntegrationReadback({datasets={},readStates={},at=new Date().toISOString()}={}){
  const healthRows=usable(readStates,'health')?rows(datasets.health):[];
  const capabilities=usable(readStates,'capabilities')?rows(datasets.capabilities):[];
  const layers=usable(readStates,'layers')?rows(datasets.layers):[];
  const expRows=usable(readStates,'experiments')?rows(datasets.experiments):[];
  const revenueRows=usable(readStates,'revenue')?rows(datasets.revenue):[];
  const loopRows=usable(readStates,'loops')?rows(datasets.loops):[];
  const terminalRows=usable(readStates,'terminal')?rows(datasets.terminal):[];
  const handoffRows=usable(readStates,'commercialHandoff')?rows(datasets.commercialHandoff):[];
  const incidentRows=usable(readStates,'commercialIncidents')?rows(datasets.commercialIncidents).filter(r=>String(r?.scope||'').startsWith('powerhouse:commercial:')).slice(0,16):[];
  const innovationAvailable=['innovationCandidates','innovationObligations','innovationIntakes'].every(x=>usable(readStates,x));
  const innovation=innovationAvailable?projectOriginalInnovationHandoff({
    candidates:datasets.innovationCandidates,obligations:datasets.innovationObligations,
    intakes:datasets.innovationIntakes,at
  }):null;
  const health=healthRows[0]||null, experiments=expRows[0]||null, revenue=revenueRows[0]||null;
  const loops=loopRows[0]||null, terminal=terminalRows[0]||null;
  const handoff=handoffRows[0]||null;
  const incidentActive=incidentRows.filter(r=>r.state==='ACTIVE').length;
  const incidentResolved=incidentRows.filter(r=>r.state==='RESOLVED').length;
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
  if(handoff && handoff.handoff_health!=='GREEN')gaps.push('COMMERCIAL_HANDOFF_PROOF_OPEN');
  if(handoff && metric(handoff.broken_or_unproven_handoffs_7d)>0)gaps.push('HISTORICAL_COMMERCIAL_HANDOFF_DEBT_OPEN');
  if(incidentActive>0)gaps.push('ACTIVE_COMMERCIAL_BRAIN_INCIDENT_REQUIRES_READBACK');
  if(innovation){
    if(innovation.state==='SOURCE_IDENTITY_CONFLICT'||innovation.state==='SOURCE_LINEAGE_GAP')gaps.push('INNOVATION_SOURCE_LINEAGE_GAP');
    if(innovation.state==='NO_SOURCE_CANDIDATES')gaps.push('INNOVATION_NO_SOURCE_CANDIDATES');
    if(innovation.awaitingAgentAck>0)gaps.push('INNOVATION_CONSUMER_ACK_DUE');
    gaps.push('INNOVATION_INDEPENDENT_OUTCOME_PROOF_REQUIRED');
  }
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
    // This is an existing admin-only data projection, NOT a new incident store.
    // Resolved source-code repair and ACTIVE end-to-end evidence debt must be
    // shown separately; neither implies an autonomous outcome or revenue.
    commercialHandoff:handoff?{
      state:text(handoff.handoff_health),
      originalEmailActions7d:metric(handoff.original_email_actions_7d),
      providerProven7d:metric(handoff.provider_readback_proven_7d),
      brokenOrUnproven7d:metric(handoff.broken_or_unproven_handoffs_7d),
      linkedTreatments7d:metric(handoff.linked_experiment_treatments_7d),
      linkedReplies7d:metric(handoff.provider_linked_replies_7d),
      linkedMeetings7d:metric(handoff.provider_linked_meetings_7d),
      realizedRevenueEur7d:metric(handoff.provider_linked_realized_revenue_eur_7d),
      readAt:handoff.measured_at||null
    }:null,
    commercialIncidents:usable(readStates,'commercialIncidents')?{
      active:incidentActive,resolved:incidentResolved,
      incidents:incidentRows.map(r=>({
        fingerprint:text(r.fingerprint),scope:text(r.scope),
        state:text(r.state),severity:text(r.severity),
        updatedAt:r.updated_at||null
      })),
      readAt:at
    }:null,
    innovationHandoff:innovation,
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
    const good=Array.isArray(value) && value.length<=source.max && (source.max!==1 || value.length===1);
    readStates[source.name]=good?'LIVE':Array.isArray(value)&&value.length>source.max?'TRUNCATED':'UNAVAILABLE';
    datasets[source.name]=good?value:[];
  });
  return projectPowerhouseIntegrationReadback({datasets,readStates,at});
}
