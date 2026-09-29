import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const growth=JSON.parse(readFileSync('config/seo-growth-loop.json','utf8'));
const allow=JSON.parse(readFileSync('config/seo-optimization-allowlist.json','utf8'));

test('SEO growth optimizes qualified commercial outcomes rather than raw traffic',()=>{
  assert.match(growth.optimization.objective,/qualified organic demand/i);
  assert.match(growth.optimization.objective,/order/i);
  assert.match(growth.optimization.objective,/revenue/i);
  assert.equal(growth.optimization.traffic_only_selection,false);
  assert.match(growth.optimization.commercial_priority_formula,/expected_order_value/);
});

test('SEO conversion models and money-page contract are canonical',()=>{
  const models=new Set(growth.optimization.models||[]);
  for(const model of ['search-intent-mapping','jobs-to-be-done','PAS','AIDA','4P','risk-reversal','message-match','objection-handling','outcome-memory']){
    assert.ok(models.has(model),`missing model: ${model}`);
  }
  const contract=new Set(growth.optimization.money_page_contract||[]);
  for(const rule of ['one-primary-intent','problem-outcome-fit','risk-reversal','primary-cta','buying-objection-faq','cta-instrumentation']){
    assert.ok(contract.has(rule),`missing money-page rule: ${rule}`);
  }
});

test('daily SEO autonomy is bounded and reversible',()=>{
  assert.equal(growth.optimization.max_high_confidence_changes_per_daily_cycle,3);
  assert.deepEqual(growth.optimization.daily_cycle?.slice(-2),[
    'measure-qualified-leads-orders-and-revenue',
    'route-outcomes-to-BG168-BG166-BG167'
  ]);
  assert.equal(allow.change_budget?.max_auto_changes_per_daily_cycle,3);
  assert.equal(allow.change_budget?.reversible_only,true);
});

test('SEO/CRO guardrails block low-value or deceptive growth tactics',()=>{
  const guards=new Set(growth.optimization.guardrails||[]);
  for(const rule of ['no-doorway-pages','no-scaled-thin-content','no-keyword-stuffing','no-link-schemes','no-cloaking','no-duplicate-intent-pages']){
    assert.ok(guards.has(rule),`missing guardrail: ${rule}`);
  }
  assert.match(allow.no_change_rule,/evidence/i);
  assert.ok((allow.allowed_actions||[]).includes('cta-friction-reduction'));
  assert.ok((allow.allowed_actions||[]).includes('risk-reversal'));
  assert.ok((allow.allowed_actions||[]).includes('schema-freshness'));
});
