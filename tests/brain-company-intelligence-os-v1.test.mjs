import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  COMPANY_INTELLIGENCE_OS_CONTRACT,buildCompanyGraph,compileSystemOfContext,
  buildOutcomeMemory,classifyExecutionBoundary,buildCompoundIntelligence,decideCompanyOptimization
} from '../brain/company-intelligence/company-intelligence-os.mjs';

test('Company Intelligence OS exposes all five layers',()=>{
  assert.deepEqual(COMPANY_INTELLIGENCE_OS_CONTRACT.layers,[
    'company_graph','system_of_context','autonomous_action_layer','outcome_memory','compound_intelligence'
  ]);
  assert.ok(COMPANY_INTELLIGENCE_OS_CONTRACT.invariants.includes('crm_is_a_source_not_the_brain'));
});

test('Company Graph reuses canonical identities',()=>{
  const graph=buildCompanyGraph({
    connections:[{person_key:'p1',naam:'Jan',bedrijf:'Acme BV',data_completeness:.8}],
    opportunities:[{opportunity_key:'o1',person_key:'p1',company_key:'acme bv',confidence:.7,status:'open'}],
    actions:[{action_id:'a1',person_key:'p1',company_key:'acme bv',action_type:'research_enrichment',status:'prepared'}]
  });
  assert.ok(graph.nodes.some(n=>n.nodeKey==='person:p1'));
  assert.ok(graph.nodes.some(n=>n.nodeKey==='company:acme bv'));
  assert.ok(graph.edges.some(e=>e.relation==='targets_company'));
});

test('System of Context is derived and evidence-linked',()=>{
  const graph=buildCompanyGraph({connections:[{person_key:'p1',naam:'Jan',bedrijf:'Acme BV',data_completeness:.8}]});
  const ctx=compileSystemOfContext({
    companyKey:'Acme BV',graph,
    evidence:[{company_key:'acme bv',confidence:.9,source_ref:'source:1'}],
    now:()=> '2026-09-28T18:00:00Z'
  });
  assert.equal(ctx.companyKey,'acme bv');
  assert.equal(ctx.evidenceRefs[0],'source:1');
  assert.match(ctx.truthBoundary,/derived context/);
});

test('Outcome Memory only verifies evidence-backed outcomes',()=>{
  const memory=buildOutcomeMemory({salesOutcomes:[
    {outcome_id:'1',company_key:'Acme BV',outcome_type:'meeting',revenue_eur:0,evidence:{provider:'calendar'}},
    {outcome_id:'2',company_key:'Acme BV',outcome_type:'reply',revenue_eur:0,evidence:{}}
  ]});
  assert.equal(memory.items.length,2);
  assert.equal(memory.verifiedCount,0); // Provider name alone is not independent outcome proof.
});

test('Autonomous action layer preserves human authorization',()=>{
  assert.equal(classifyExecutionBoundary({
    status:'prepared',action_type:'autonomous_email',
    evidence:{execution_gate:{human_authorization_required:true}}
  }),'human_gate');
  assert.equal(classifyExecutionBoundary({
    status:'prepared',action_type:'research_enrichment',evidence:{}
  }),'autonomous_internal');
});

test('Compound intelligence feeds verified outcomes into next decision',()=>{
  const result=buildCompoundIntelligence({
    context:{companyKey:'acme bv',contextConfidence:.8},
    outcomeMemory:{items:[{verified:true}]},
    actions:[],
    opportunities:[{status:'open'}]
  });
  assert.equal(result.loopState,'learn_and_reprioritize');
  assert.equal(result.verifiedOutcomes,1);
});

test('SQL runtime is derived, private and has one canonical orchestrator',()=>{
  const sql=readFileSync(new URL('../supabase/migration-history/repository-only/20260928193000_powerhouse_company_intelligence_os_v1.sql',import.meta.url),'utf8');
  for(const name of [
    'powerhouse_company_graph_nodes_v1','powerhouse_company_graph_edges_v1',
    'powerhouse_system_of_context_v1','powerhouse_autonomous_action_layer_v1',
    'powerhouse_outcome_memory_v1','powerhouse_compound_intelligence_v1',
    'powerhouse_run_company_intelligence_os_v1'
  ]) assert.match(sql,new RegExp(name));
  assert.match(sql,/security_invoker=true/g);
  assert.doesNotMatch(sql,/create table if not exists public\.powerhouse_company_graph/i);
  assert.match(sql,/human_gate/);
  assert.match(sql,/no_parallel_crm/);
});


// Synthetic fixtures are contract tests only, not customer economic observations.
const optimizationExample=changes=>{
  const source_refs=['erp:audited:2026-q4'];
  const candidate={
    candidate_id:'candidate-a',tenant_id:'tenant-a',status:'candidate',
    owner_agent:'original-company-optimization-owner',safety_class:'safe_reversible',
    baseline:{baseline_id:'base-a',period_id:'2026-q4',source_refs},
    proposed_action:{action:'reversible_workflow_configuration'},
    rollback_plan:{action:'restore_previous_configuration'},
    expected_impact:{financial_forecast:{
      status:'MODELLED_NOT_REALIZED',evidence_health:{status:'healthy'},
      source_revision:'revision-a',baseline_id:'base-a',period_id:'2026-q4',
      metric_id:'NET_SAVINGS_EUR',unit:'EUR',source_refs,
      scenarios:[['no_action',0],['downside',100],['base',500],['upside',800]].map(
        ([name,net])=>({case:name,net_value_eur:net,source_refs}))
    }}
  };
  return {
    tenantId:'tenant-a',
    observation:{tenant_id:'tenant-a',source_health:'healthy',
      source_revision:'revision-a',correlation_id:'correlation-a'},
    candidates:[candidate],
    authorization:{tenant_id:'tenant-a',candidate_id:'candidate-a',policy_granted:true,
      reversible_allowed:true,policy_revision:'approved-policy-a',idempotency_key:'tenant-a:scenario-a',correlation_id:'correlation-a',
      owner_lease:{active:true,owner:'original-company-optimization-owner'}},
    ...changes
  };
};

test('company optimization is a pure original-owner decision, never an unauthorized dispatch',()=>{
  const decision=decideCompanyOptimization(optimizationExample());
  assert.equal(decision.status,'READY_FOR_ORIGINAL_EXECUTOR');
  assert.equal(decision.dispatched,false);
  assert.equal(decision.closed,false);
  assert.equal(decision.candidateId,'candidate-a');
  assert.equal(decision.forecastBaseNetEur,500);
  assert.equal(decision.originalOwner,'original-company-optimization-owner');
  const compound=buildCompoundIntelligence({optimization:optimizationExample()});
  assert.equal(compound.optimizationDecision.status,'READY_FOR_ORIGINAL_EXECUTOR');
  assert.equal(buildCompoundIntelligence({}).optimizationDecision,null);
});

test('never select cross-tenant, unverified source, missing baseline or a losing downside',()=>{
  assert.equal(decideCompanyOptimization(optimizationExample({
    observation:{tenant_id:'tenant-b',source_health:'healthy',source_revision:'revision-a',correlation_id:'corr'}
  })).status,'SOURCE_EVIDENCE_DUE');
  const [valid]=optimizationExample().candidates;
  const mismatch={...valid,tenant_id:'tenant-b'};
  assert.equal(decideCompanyOptimization(optimizationExample({candidates:[mismatch]})).status,'CANDIDATE_OR_MEASUREMENT_DUE');
  assert.equal(decideCompanyOptimization(optimizationExample({
    candidates:[{...valid,safety_class:'review_required'}]
  })).status,'MEASUREMENT_OR_POLICY_REVIEW_DUE');
  assert.equal(decideCompanyOptimization(optimizationExample({
    candidates:[{...valid,baseline:{...valid.baseline,source_refs:[]}}]
  })).status,'MEASUREMENT_OR_POLICY_REVIEW_DUE');
  const forecast=valid.expected_impact.financial_forecast;
  assert.equal(decideCompanyOptimization(optimizationExample({
    candidates:[{...valid,expected_impact:{financial_forecast:{...forecast,scenarios:
      forecast.scenarios.map(s=>s.case==='downside'?{...s,net_value_eur:-1}:s)}}}]
  })).status,'MEASUREMENT_OR_POLICY_REVIEW_DUE');
});

test('policy grants, lease, idempotency and owner match are independent vetoes',()=>{
  const valid=optimizationExample();
  for(const gate of [
    {...valid.authorization,policy_granted:false},
    {...valid.authorization,owner_lease:{active:true,owner:'other-agent'}},
    {...valid.authorization,idempotency_key:''},
    {...valid.authorization,reversible_allowed:false}
  ]){
    const x=decideCompanyOptimization(optimizationExample({authorization:gate}));
    assert.equal(x.status,'ORIGINAL_POLICY_GATE_DUE');
    assert.equal(x.dispatched,false);
  }
});

test('provider receipt cannot be confused with measured savings or learning',()=>{
  const source_refs=['provider:independent:receipt'];
  const execution={independent_readback:true,status:'INDEPENDENTLY_VERIFIED',
    tenant_id:'tenant-a',candidate_id:'candidate-a',provider_receipt_id:'provider:change:1',
    source_revision:'revision-a',correlation_id:'correlation-a',idempotency_key:'tenant-a:scenario-a',
    source_refs};
  const x=decideCompanyOptimization(optimizationExample({execution}));
  assert.equal(x.status,'INDEPENDENT_MEASUREMENT_DUE');
  assert.equal(x.closed,false);
  const effect={independently_verified:true,tenant_id:'tenant-a',candidate_id:'candidate-a',
    baseline_id:'base-a',period_id:'2026-q4',comparator:'NO_ACTION',
    source_revision:'revision-a',correlation_id:'correlation-a',
    method_version:'independent-control-v1',gross_savings_eur:500,
    implementation_cost_eur:100,operating_cost_eur:50,net_savings_eur:350,
    source_refs:['erp:independent:control']};
  assert.equal(decideCompanyOptimization(optimizationExample({execution,effect})).status,'NEXT_DECISION_LEARNING_DUE');
  assert.equal(decideCompanyOptimization(optimizationExample({
    execution,effect:{...effect,net_savings_eur:500}
  })).status,'INDEPENDENT_MEASUREMENT_DUE');
  const learning={independently_verified:true,candidate_id:'candidate-a',
    tenant_id:'tenant-a',source_revision:'revision-a',correlation_id:'correlation-a',
    next_decision_id:'decision-next-1',source_refs:['brain:verified:learning']};
  const ready=decideCompanyOptimization(optimizationExample({execution,effect,learning}));
  assert.equal(ready.status,'ONE_BRAIN_CLOSURE_REVIEW_DUE');
  assert.equal(ready.observedNetEur,350);
  assert.equal(ready.closed,false);
  assert.equal(ready.dispatched,false);
});


test('duplicate candidate IDs and mismatched receipt lineage cannot become independently verified',()=>{
  const original=optimizationExample(),same=original.candidates[0];
  assert.equal(decideCompanyOptimization(optimizationExample({candidates:[same,{...same}]})).reason,
    'DUPLICATE_CANONICAL_CANDIDATE_CONFLICT');
  const auth={...original.authorization,correlation_id:'different-correlation'};
  assert.equal(decideCompanyOptimization(optimizationExample({authorization:auth})).status,
    'ORIGINAL_POLICY_GATE_DUE');
  const execution={independent_readback:true,status:'INDEPENDENTLY_VERIFIED',
    tenant_id:'tenant-a',candidate_id:'candidate-a',provider_receipt_id:'provider:receipt:1',
    source_revision:'revision-a',correlation_id:'correlation-a',
    idempotency_key:'tenant-a:scenario-a',source_refs:['provider:actual']};
  assert.equal(decideCompanyOptimization(optimizationExample({
    execution:{...execution,correlation_id:'other'}
  })).status,'EXECUTION_PROOF_DUE');
  const effect={independently_verified:true,tenant_id:'tenant-a',candidate_id:'candidate-a',
    source_revision:'revision-a',correlation_id:'correlation-a',baseline_id:'base-a',
    period_id:'2026-q4',comparator:'NO_ACTION',method_version:'matched-control-v1',
    gross_savings_eur:500,implementation_cost_eur:100,operating_cost_eur:50,
    net_savings_eur:350,source_refs:['erp:measurement']};
  assert.equal(decideCompanyOptimization(optimizationExample({
    execution,effect:{...effect,source_revision:'old'}
  })).status,'INDEPENDENT_MEASUREMENT_DUE');
  const learning={independently_verified:true,tenant_id:'tenant-b',
    candidate_id:'candidate-a',source_revision:'revision-a',correlation_id:'correlation-a',
    next_decision_id:'next',source_refs:['brain:lesson']};
  assert.equal(decideCompanyOptimization(optimizationExample({execution,effect,learning})).status,
    'NEXT_DECISION_LEARNING_DUE');
});


test('Outcome Memory requires immutable cross-source event identity, not metadata or provider send receipts',()=>{
  const raw={outcome_id:'o-1',company_key:'ACME BV',person_key:'p-1',
    outcome_type:'linkedin_engagement',revenue_eur:null,
    occurred_at:'2026-11-15T14:05:00Z',
    evidence:{source_event_id:'event-1',source_event_type:'linkedin_inbound_engagement',
      source_dedupe_key:'engagement:1',source_data_quality:'VERIFIED',
      synthetic_business_result:false}};
  const source_event_readback={event_id:'event-1',event_type:'linkedin_inbound_engagement',
    dedupe_key:'engagement:1',data_quality:'VERIFIED',independently_verified:true,
    company_key:'acme bv',person_key:'p-1',occurred_at:'2026-11-15T14:04:00Z',
    evidence:{provider:'linked-event'}};
  const good=buildOutcomeMemory({salesOutcomes:[{...raw,source_event_readback}]});
  assert.equal(good.verifiedCount,1);
  assert.equal(good.items[0].realizedValue,null,'absent revenue is unknown, never synthetic €0');
  assert.equal(buildOutcomeMemory({salesOutcomes:[{...raw,
    source_event_readback:{...source_event_readback,company_key:'other tenant'}}]}).verifiedCount,0);
  assert.equal(buildOutcomeMemory({salesOutcomes:[{...raw,
    source_event_readback:{...source_event_readback,event_id:'other-event'}}]}).verifiedCount,0);
  assert.equal(buildOutcomeMemory({salesOutcomes:[{...raw,
    evidence:{...raw.evidence,synthetic_business_result:true},source_event_readback}]}).verifiedCount,0);
  assert.equal(buildOutcomeMemory({salesOutcomes:[{...raw,
    outcome_type:'sent',source_event_readback}]}).verifiedCount,0);
  assert.equal(buildOutcomeMemory({salesOutcomes:[{...raw,
    source_event_readback:{...source_event_readback,occurred_at:'2026-11-16T14:04:00Z'}}]}).verifiedCount,0);
});

test('Realized value needs independent receipt, measurement period and baseline; a zero can be observed',()=>{
  const original={observation_id:'v1',cycle_id:'c1',numeric_value:0,
    evidence_ref:'provider:independent:observation',currency:'EUR',observed_at:'2026-11-15T15:00:00Z'};
  assert.equal(buildOutcomeMemory({realizedValues:[original]}).verifiedCount,0);
  assert.equal(buildOutcomeMemory({realizedValues:[{...original,numeric_value:null,
    provenance:{independent_readback_verified:true,source_revision:'r1',baseline_id:'b1',period_id:'p1'}}]}).items[0].realizedValue,null);
  const valid={...original,provenance:{independent_readback_verified:true,source_revision:'r1',baseline_id:'b1',period_id:'p1'}};
  const memory=buildOutcomeMemory({realizedValues:[valid]});
  assert.equal(memory.verifiedCount,1);
  assert.equal(memory.items[0].realizedValue,0,'measured zero is a valid observed amount');
  assert.equal(buildOutcomeMemory({realizedValues:[{
    ...valid,provenance:{...valid.provenance,period_id:''}
  }]}).verifiedCount,0);
});

test('Native original Outcome Memory keeps private tenant authority and checks source-event readback',()=>{
  const sql=readFileSync(new URL('../supabase/migrations/20261115170000_outcome_memory_source_readback_truth_v1.sql',import.meta.url),'utf8');
  for(const predicate of [
    'CREATE OR REPLACE VIEW public.powerhouse_outcome_memory_v1',
    'security_invoker=true',
    "e.event_id::text = o.evidence->>'source_event_id'",
    "e.dedupe_key = o.evidence->>'source_dedupe_key'",
    "e.event_type = o.evidence->>'source_event_type'",
    "e.data_quality = 'VERIFIED'",
    'e.company_key IS NOT DISTINCT FROM o.company_key',
    'e.person_key IS NOT DISTINCT FROM o.person_key',
    "o.outcome_type NOT IN ('sent','not_executed','execution_completed')",
    "r.provenance->>'independent_readback_verified'='true'",
    'REVOKE ALL ON public.powerhouse_outcome_memory_v1 FROM public, anon, authenticated',
    'GRANT SELECT ON public.powerhouse_outcome_memory_v1 TO service_role'
  ]) assert.ok(sql.includes(predicate),'missing immutable source/ACL gate: '+predicate);
  assert.doesNotMatch(sql,/create\s+table|cron\.schedule|grant\s+select\s+on\s+public\.powerhouse_outcome_memory_v1\s+to\s+authenticated/i);
});
