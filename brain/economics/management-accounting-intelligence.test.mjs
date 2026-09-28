import test from 'node:test';
import assert from 'node:assert/strict';
import {
 calculateManagementAccountingMetrics,
 buildManagementAccountingRoadmap,
 buildValueDriverGraph,
 managementAccountingDataGaps,
 MANAGEMENT_ACCOUNTING_SOURCES
} from './management-accounting-intelligence.mjs';

const baseState={
 portal:{
  profile:{employees:20},
  metrics:{
   revenue:2000000,grossMargin:40,ebitda:200000,wages:800000,customers:100,largestCustomer:22,marketing:100000,newCustomers:20,dso:60,
   performance:{billable:70,onTime:92,leadTime:12,defects:4,quoteConversion:30,orders:500,churn:8}
  },
  people:{absence:6,turnover:18},
  valueFinance:{debt:500000,cash:100000,equity:700000,balance:1500000,fixed:600000,interest:40000,multiple:5,wacc:10},
  market:{benchmarks:[
   {metric:'Omzet per medewerker',benchmark:120000,source:'Sector benchmark 2026'},
   {metric:'DSO',benchmark:40,source:'Sector benchmark 2026'},
   {metric:'Brutomarge',benchmark:45,source:'Sector benchmark 2026'},
   {metric:'Verzuim',benchmark:4,source:'Sector benchmark 2026'}
  ]}
 }
};

test('calculates connected financial, workforce, commercial and cash metrics without inventing missing values',()=>{
 const metrics=calculateManagementAccountingMetrics(baseState);
 const byId=new Map(metrics.map(item=>[item.id,item]));
 assert.equal(byId.get('revenue_per_employee').value,100000);
 assert.equal(byId.get('gross_profit_per_employee').value,40000);
 assert.equal(byId.get('ebitda_margin_pct').value,10);
 assert.equal(byId.get('labour_cost_ratio').value,40);
 assert.equal(byId.get('receivables_estimate').value,328767.1233);
 assert.equal(byId.get('net_debt_to_ebitda').value,2);
 assert.equal(byId.get('interest_coverage').value,5);
 assert.equal(byId.has('roic_pct'),false);
 assert.equal(byId.has('free_cash_flow'),false);
});

test('uses only explicit customer/sector benchmarks for benchmark gaps and roadmap value scenarios',()=>{
 const roadmap=buildManagementAccountingRoadmap(baseState);
 const dso=roadmap.find(item=>item.metric_id==='dso_days');
 const margin=roadmap.find(item=>item.metric_id==='gross_margin_pct');
 const absence=roadmap.find(item=>item.metric_id==='absence_pct');
 assert.equal(dso.benchmark,40);
 assert.equal(dso.benchmark_source,'Sector benchmark 2026');
 assert.equal(dso.expected_value,109589.04);
 assert.equal(dso.value_type,'working_capital_release');
 assert.equal(margin.expected_value,100000);
 assert.equal(margin.impact_label,'POTENTIAL');
 assert.equal(absence.expected_value,16000);
 assert.ok(roadmap.every(item=>item.sourceFingerprint.startsWith('management-accounting-value-driver-v1|')));
});

test('value driver graph ties people productivity operations commercial profitability cash capital and value together',()=>{
 const graph=buildValueDriverGraph(baseState);
 assert.deepEqual(graph.nodes.map(node=>node.id),['people','productivity','operations','commercial','profitability','cash','capital','value']);
 assert.ok(graph.edges.some(edge=>edge.from==='profitability'&&edge.to==='value'));
 assert.ok(graph.roadmap.length>=4);
});

test('missing inputs remain explicit data gaps and never become zero-valued business facts',()=>{
 const metrics=calculateManagementAccountingMetrics({portal:{profile:{employees:10},metrics:{revenue:100000}}});
 const byId=new Map(metrics.map(item=>[item.id,item]));
 assert.equal(byId.get('revenue_per_employee').value,10000);
 assert.equal(byId.has('gross_profit_per_employee'),false);
 assert.equal(byId.has('ebitda_margin_pct'),false);
 const gaps=managementAccountingDataGaps({portal:{profile:{employees:10},metrics:{revenue:100000}}});
 assert.ok(gaps.some(item=>item.metric_id==='free_cash_flow'));
 assert.ok(gaps.some(item=>item.metric_id==='roic_pct'));
});

test('source catalog keeps full authoritative URLs for audit and provenance',()=>{
 assert.ok(MANAGEMENT_ACCOUNTING_SOURCES.length>=10);
 assert.ok(MANAGEMENT_ACCOUNTING_SOURCES.every(source=>source.url.startsWith('https://')));
});
