import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const growth=JSON.parse(readFileSync('config/seo-growth-loop.json','utf8'));
const allow=JSON.parse(readFileSync('config/seo-optimization-allowlist.json','utf8'));
const systemMap=readFileSync('platform/system-map/canonical-system-map.mjs','utf8');
const skill=readFileSync('.agents/skills/powerhouse-seo-conversion-orders/SKILL.md','utf8');
const registry=readFileSync('docs/brain/component-registry.json','utf8');

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

test('SEO conversion system map and skill projection stay discoverable',()=>{
  assert.match(systemMap,/id:'seo-conversion-orders'/);
  assert.match(systemMap,/powerhouse-seo-conversion-orders\/SKILL\.md/);
  assert.match(systemMap,/maxDailyAutonomousChanges:3/);
  assert.match(skill,/Systeemkaart- en documentatieborging/);
  assert.match(skill,/WRITEBACK_INCOMPLETE/);
  assert.match(registry,/CAPABILITY_SEO_CONVERSION_ORDERS/);
});


test('behavioral revenue decision engine is canonical',()=>{
  const models=new Set(growth.optimization.models||[]);
  for(const m of ['cialdini-reciprocity','loss-aversion','fogg-behavior-model','hick-hyman-choice-reduction','cognitive-fluency','commitment-ladder','choice-architecture']) assert.ok(models.has(m),`missing ${m}`);
  const e=growth.optimization.behavioral_decision_engine;
  assert.match(e.objective,/qualified_order_probability/);
  assert.equal(e.optimization_metric_order[0],'realized_revenue');
  assert.equal(e.optimization_metric_order[1],'paid_orders');
  assert.equal(e.autonomy.no_dark_patterns,true);
  assert.equal(e.autonomy.rollback_on_guardrail_regression,true);
});

test('behavioral CRO actions and dark-pattern guards are enforced',()=>{
  const actions=new Set(allow.allowed_actions||[]);
  for(const a of ['section-order','proof-placement','trust-block','choice-reduction','commitment-step','loss-gain-framing']) assert.ok(actions.has(a),`missing ${a}`);
  const blocked=new Set(allow.always_blocked_without_explicit_evidence||[]);
  for(const b of ['fake-scarcity','fake-urgency','fake-social-proof','hidden-cost','preselected-consent','confirmshaming']) assert.ok(blocked.has(b),`missing ${b}`);
});


test('behavioral revenue writeback stays synchronized',()=>{
  const systemMap=readFileSync('platform/system-map/canonical-system-map.mjs','utf8');
  const learning=JSON.parse(readFileSync('brain/learning/2026-09-29-seo-conversion-orders-v1.json','utf8'));
  const change=readFileSync('docs/changes/2026-09-29-seo-conversion-orders-v1.md','utf8');
  const ledger=readFileSync('docs/development-ledger-events/2026-09-29-seo-conversion-orders-v1.md','utf8');
  const architecture=readFileSync('docs/powerhouse/behavioral-landing-revenue-engine-v2.md','utf8');

  assert.match(systemMap,/SEO \+ Behavioral Conversion-to-Orders Engine v2/);
  assert.match(systemMap,/powerhouse-persuasion-revenue\/SKILL\.md/);
  assert.match(systemMap,/realized revenue/);
  assert.equal(learning.behavioral_revenue?.fingerprint,'powerhouse-behavioral-landing-revenue-v2');
  assert.equal(learning.behavioral_revenue?.dark_patterns_forbidden,true);
  assert.equal(learning.behavioral_revenue?.max_reversible_changes_per_daily_cycle,3);
  assert.match(change,/Behavioral revenue integration/);
  assert.match(ledger,/Behavioral revenue closure/);
  assert.match(architecture,/Writeback contract/);

  for(const path of [
    '.agents/skills/powerhouse-seo-conversion-orders/SKILL.md',
    '.agents/skills/powerhouse-growth-swarm/SKILL.md',
    '.agents/skills/powerhouse-persuasion-revenue/SKILL.md'
  ]){
    const skill=readFileSync(path,'utf8');
    assert.match(skill,/Behavioral revenue writeback closure/);
    assert.match(skill,/powerhouse-behavioral-landing-revenue-v2/);
  }
});
