import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateManagementAccountingMetrics,
  buildManagementAccountingRoadmap,
  buildValueDriverGraph
} from '../brain/economics/management-accounting-intelligence.mjs';

test('management accounting intelligence stays evidence-first and benchmark-driven',()=>{
  const state={portal:{
    profile:{employees:20},
    metrics:{revenue:2000000,grossMargin:40,ebitda:200000,wages:800000,dso:60,largestCustomer:22,performance:{billable:70,defects:4,quoteConversion:30,churn:8}},
    people:{absence:6,turnover:18},
    valueFinance:{debt:500000,cash:100000,equity:700000,balance:1500000,interest:40000,multiple:5,wacc:10},
    market:{benchmarks:[
      {metric:'Omzet per medewerker',benchmark:120000,source:'Sector benchmark 2026'},
      {metric:'DSO',benchmark:40,source:'Sector benchmark 2026'},
      {metric:'Brutomarge',benchmark:45,source:'Sector benchmark 2026'}
    ]}
  }};
  const metrics=calculateManagementAccountingMetrics(state);
  const byId=new Map(metrics.map(item=>[item.id,item]));
  assert.equal(byId.get('revenue_per_employee').value,100000);
  assert.equal(byId.get('dso_days').benchmark,40);
  assert.equal(byId.has('free_cash_flow'),false);
  const roadmap=buildManagementAccountingRoadmap(state);
  assert.ok(roadmap.some(item=>item.metric_id==='dso_days'&&item.value_type==='working_capital_release'));
  assert.ok(roadmap.every(item=>item.impact_label==='POTENTIAL'));
  const graph=buildValueDriverGraph(state);
  assert.deepEqual(graph.nodes.map(node=>node.id),['people','productivity','operations','commercial','profitability','cash','capital','value']);
});
