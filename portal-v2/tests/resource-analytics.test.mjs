import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeResourceDaily, buildResourceAnalyticsModel, resourceAnalyticsMarkup, RESOURCE_ANALYTICS_METRICS } from '../resource-analytics.js';

const rows=[
  {day:'2026-09-18T00:00:00Z',provider:'openai',resource_type:'ai_tokens',unit:'tokens',usage_events:10,resource_amount:1000,energy_kwh:0.4,co2e_kg:0.2,water_liters:3,factor_coverage:1,provenance_complete:true},
  {day:'2026-09-19T00:00:00Z',provider:'openai',resource_type:'ai_tokens',unit:'tokens',usage_events:12,resource_amount:1500,energy_kwh:0.6,co2e_kg:0.3,water_liters:4,factor_coverage:1,provenance_complete:true},
  {day:'2026-09-19T00:00:00Z',provider:'buffer',resource_type:'api_requests',unit:'requests',usage_events:20,resource_amount:20,energy_kwh:null,co2e_kg:null,water_liters:null,factor_coverage:null,provenance_complete:false},
  {day:'2026-09-19T00:00:00Z',provider:'composio',resource_type:'connector_credits',unit:'credits',usage_events:5,resource_amount:5,energy_kwh:null,co2e_kg:null,water_liters:null,factor_coverage:null,provenance_complete:false},
  {day:'2026-09-19T00:00:00Z',provider:'netlify',resource_type:'provider_cost',unit:'EUR',usage_events:1,resource_amount:2.5,energy_kwh:null,co2e_kg:null,water_liters:null,factor_coverage:null,provenance_complete:false}
];
const data={resourceIntelligence:{daily:rows}};

test('resource analytics exposes all material resource metrics',()=>{
  assert.deepEqual(RESOURCE_ANALYTICS_METRICS.map(([id])=>id),['cost','co2eKg','waterLiters','energyKwh','tokens','credits','requests']);
});

test('normalizer preserves unknown physical telemetry as null',()=>{
  const normalized=normalizeResourceDaily(rows);
  assert.equal(normalized.length,5);
  const buffer=normalized.find(row=>row.provider==='buffer');
  assert.equal(buffer.co2eKg,null);
  assert.equal(buffer.waterLiters,null);
  assert.equal(buffer.provenanceComplete,false);
});

test('daily CO2 trend aggregates only CO2 fields',()=>{
  const model=buildResourceAnalyticsModel(data,{metric:'co2eKg',days:'30'});
  assert.equal(model.daily.length,2);
  assert.equal(model.total,0.5);
  assert.equal(model.latest,0.3);
  assert.equal(Math.round(model.deltaPct),50);
  assert.deepEqual(model.providers.map(x=>x.name),['openai']);
});

test('token and credit metrics never mix resource units',()=>{
  const tokens=buildResourceAnalyticsModel(data,{metric:'tokens',days:'30'});
  const credits=buildResourceAnalyticsModel(data,{metric:'credits',days:'30'});
  assert.equal(tokens.total,2500);
  assert.equal(credits.total,5);
  assert.deepEqual(tokens.providers.map(x=>x.name),['openai']);
  assert.deepEqual(credits.providers.map(x=>x.name),['composio']);
});

test('provider and period filters are deterministic',()=>{
  const requests=buildResourceAnalyticsModel(data,{metric:'requests',provider:'buffer',days:'7'});
  assert.equal(requests.total,20);
  assert.equal(requests.daily.length,1);
  assert.deepEqual(requests.providers.map(x=>x.name),['buffer']);
});

test('dashboard markup has filters, trend, provider split and benchmark affordance',()=>{
  const html=resourceAnalyticsMarkup(data,{metric:'waterLiters',days:'30'});
  for(const label of ['Resource & Sustainability','Kosten','CO₂e','Water','Energie','Tokens','Credits','Requests','Verdeling per provider','Benchmark:']) assert.ok(html.includes(label),label);
  assert.match(html,/data-resource-filter="metric"/);
  assert.match(html,/data-resource-filter="days"/);
  assert.match(html,/data-resource-filter="provider"/);
  assert.match(html,/data-resource-filter="resourceType"/);
  assert.match(html,/data-resource-sector-benchmark/);
  assert.doesNotMatch(html,/sectorgemiddelde\s+\d/i);
});
