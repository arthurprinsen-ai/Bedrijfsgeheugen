import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  COMPANY_INTELLIGENCE_OS_CONTRACT,buildCompanyGraph,compileSystemOfContext,
  buildOutcomeMemory,classifyExecutionBoundary,buildCompoundIntelligence
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
  assert.equal(memory.verifiedCount,1);
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
  const sql=readFileSync(new URL('../supabase/migrations/20260928193000_powerhouse_company_intelligence_os_v1.sql',import.meta.url),'utf8');
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
