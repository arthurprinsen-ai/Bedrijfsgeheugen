import {validate} from './validate-contracts.mjs';
const env={id:'x1',schema_version:'brain.v1',created_at:'2026-08-28T00:00:00Z',producer:'test',trace_id:'t1',correlation_id:'c1',classification:'INTERNAL',data_quality:'HEALTHY',confidence:.8,provenance:{source:'fixture'}};
const fixtures={
  signal:{source:'s',entity_refs:[],observed_at:'2026-08-28T00:00:00Z',freshness:'FRESH',evidence_refs:['e1'],severity:'MEDIUM',domain:'SEO',dedupe_key:'d1',processing_cost:1},
  evidence:{source_id:'s1',captured_at:'2026-08-28T00:00:00Z',freshness:'FRESH',reliability:.9,independence:.8,entity_refs:[],claim_refs:[],contradictions:[],content_hash:'abc',access_class:'PUBLIC',cost:1},
  opportunity:{type:'SEO_OPPORTUNITY',targets:['page'],problem:'gap',signals:['s1'],evidence_refs:['e1'],expected_value:100,urgency:.5,strategic_fit:.8,learning_value:.4,reusability:.7,cost:10,time:1,risk:.2,status:'OPEN'},
  decision:{candidate_ref:'o1',decision:'TEST',policy_version:'p1',algorithm_version:'a1',evidence_refs:['e1'],alternatives:['WATCH'],rejection_reasons:[],expected_utility:5,risk:.2,autonomy_class:'A1',protected_metrics:['security'],re_evaluate_at:'2026-08-29T00:00:00Z'},
  mission:{decision_ref:'d1',objective:'test',type:'SEO',targets:['page'],baseline:{value:1},success_metrics:[{metric:'conversion',target:2}],protected_metrics:['security'],constraints:[],budget:{credits:10},required_capabilities:['SEO'],assigned_agents:['PH_AGENT_03'],rollback:{strategy:'restore'},status:'PENDING',hypothesis:'better page helps',attempt:1,next_action:'TEST'},
  experiment:{mission_ref:'m1',hypothesis:'x',control:'A',variants:['B'],population:'visitors',allocation:{A:.5,B:.5},start_at:'2026-08-28T00:00:00Z',stop_conditions:['sample'],sample:0,cost:0,primary_metric:'conversion',secondary_metrics:[],protected_metrics:['security'],result:null,causal_confidence:'LOW'},
  outcome:{mission_ref:'m1',decision_ref:'d1',action:'TEST',started_at:'2026-08-28T00:00:00Z',finished_at:'2026-08-28T01:00:00Z',expected_value:10,actual_value:12,business_value:12,cost:2,latency_ms:100,quality:.9,errors:[],protected_metric_effects:{security:'UNCHANGED'},attribution:'EXPERIMENT',causal_confidence:'HIGH'},
  pattern:{type:'CREATIVE',context:{channel:'Instagram'},conditions:['Mira'],recommended_action:'reuse mechanism',effect:{score:5},sample_size:30,confidence_level:.8,valid_from:'2026-08-28',last_confirmed_at:'2026-08-28',decay:.01,supporting_outcomes:['o1'],contradicting_outcomes:[],status:'PROVEN'},
  'current-state':{entity_ref:'site',state_type:'PRODUCTION',current_value:'green',valid_since:'2026-08-28',source_of_truth:'BG169',last_verified_at:'2026-08-28T01:00:00Z',confidence_level:.99,version:1}
};
for(const [type,payload] of Object.entries(fixtures)){
  const v=validate(type,{...env,...payload}); if(!v.valid) throw new Error(`${type} should pass ${v.errors}`);
  const field=Object.keys(payload)[0]; const bad={...env,...payload}; delete bad[field]; const iv=validate(type,bad); if(iv.valid) throw new Error(`${type} invalid fixture passed`);
}
const badSignal={...env,...fixtures.signal}; delete badSignal.evidence_refs; if(validate('signal',badSignal).valid) throw new Error('signal without evidence_refs passed');
const badMission={...env,...fixtures.mission}; for(const k of ['baseline','success_metrics','protected_metrics','budget','rollback']) delete badMission[k]; if(validate('mission',badMission).valid) throw new Error('mission missing gates passed');
const badOutcome={...env,...fixtures.outcome}; delete badOutcome.actual_value; delete badOutcome.cost; if(validate('outcome',badOutcome).valid) throw new Error('outcome missing actual/cost passed');
console.log('contract fixture tests passed');
