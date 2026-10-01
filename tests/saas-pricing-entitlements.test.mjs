import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {entitlementAllows,enforceAgentMode,enforceConnectorRefreshPolicy,enforceRefreshPolicy,normalizeEntitlementRecord,planRuntimePolicy,requireEntitlement} from '../platform/saas/entitlement-policy.mjs';
import {billingReadiness,requireBillingReady} from '../platform/saas/billing-readiness.mjs';
import {canAgentExecute} from '../platform/agents/agent-work.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('pricing exposes canonical Starter Pro Groei and Enterprise tiers',async()=>{
  const html=await read('prijzen.html');
  for(const token of ['Starter','€ 99','Pro','€ 299','Groei','€ 749','Enterprise','Op maat']) assert.ok(html.includes(token),token);
  for(const plan of ['starter','pro','groei']) assert.match(html,new RegExp('https://www\\.bedrijfsgeheugen\\.nl/afsluiten\\?plan='+plan));
  assert.match(html,/Powerhouse SaaS/);
  assert.match(html,/Consulting & workshops/);
});

test('pricing package contents match the commercial capacity contract',async()=>{
  const html=await read('prijzen.html');
  for(const token of [
    'Tot 5 gebruikers','2 integraties','Nachtelijke data refresh','50 AI-vragen / maand',
    'Tot 25 gebruikers','10 integraties','Uurlijkse data refresh','AI copilot: 200 vragen / maand',
    'Tot 75 gebruikers','25 integraties','Data refresh elke 15 minuten','12 automatiseringen','6 AI-automatiseringen','750 AI-vragen / maand',
    'SSO / werkaccount','Audit trail & export','On-demand data refresh','Enterprise support (SLA)'
  ]) assert.ok(html.includes(token),token);
});

test('consulting offers and SaaS combination rule are explicit',async()=>{
  const html=await read('prijzen.html');
  for(const token of ['Directie & AI Workshop','€ 1.950','Bedrijfsgeheugen Scan','€ 2.950','Vanaf € 14.500','Transformation / Fractional Lead','Combineer zonder dubbel te betalen','tijdelijk Pro toegang','tijdelijk Groei toegang']) assert.ok(html.includes(token),token);
});

test('checkout backend trusts canonical plans and direct-checkout entitlement',async()=>{
  const source=await read('netlify/functions/checkout-create.mjs');
  assert.match(source,/getPlan\(code\)/);
  assert.match(source,/direct_checkout/);
  assert.match(source,/monthly_price_cents/);
  assert.match(source,/mode','subscription/);
});

test('yearly checkout remains ten monthly fees with the new plans',async()=>{
  const [checkoutPage,backend]=await Promise.all([read('afsluiten.html'),read('netlify/functions/checkout-create.mjs')]);
  for(const token of ["starter:{","pro:{","groei:{","yearly:'€ 990'","yearly:'€ 2.990'","yearly:'€ 7.490'"]) assert.ok(checkoutPage.includes(token),token);
  assert.match(backend,/monthly_price_cents\)\*10/);
  assert.match(backend,/billingCycle==='yearly'\?'year':'month'/);
  assert.match(backend,/metadata\[billing_cycle\]/);
});

test('connector store enforces server-side source entitlement',async()=>{
  const source=await read('netlify/functions/_portal-connectors-store.mjs');
  assert.match(source,/saas_active_entitlements/);
  assert.match(source,/PLAN_DATA_SOURCE_LIMIT/);
});

test('subscription webhook verifies signatures and provisions portal access',async()=>{
  const source=await read('netlify/functions/stripe-webhook.mjs');
  assert.match(source,/stripe-signature/);
  assert.match(source,/ensureInvitation/);
  assert.match(source,/upsertSubscription/);
});

test('central entitlement policy fails closed without active subscription',()=>{
  assert.equal(normalizeEntitlementRecord(null),null);
  assert.throws(()=>requireEntitlement(null,'intelligence_core'),/SUBSCRIPTION_REQUIRED/);
});

test('commercial numeric boolean and mode values are enforced',()=>{
  const record={organisation_id:'org',plan_code:'starter',plan_name:'Starter',status:'active',entitlements:{
    intelligence_core:true,seats:5,data_sources:2,documents:25,refresh_minutes:1440,ai_questions_month:50,automations:0,ai_automations:0,
    agent_mode:'recommend',approval_workflows:false,sso:false,audit_trail:false,organisations:1
  }};
  assert.equal(entitlementAllows(record,'intelligence_core'),true);
  assert.equal(entitlementAllows(record,'data_sources',{requested:2}),true);
  assert.equal(entitlementAllows(record,'data_sources',{requested:3}),false);
  assert.equal(entitlementAllows(record,'agent_mode',{allowedValues:['recommend']}),true);
  const p=planRuntimePolicy(record);
  assert.equal(p.planCode,'starter');
  assert.equal(p.maxSeats,5);
  assert.equal(p.maxDataSources,2);
  assert.equal(p.maxDocuments,25);
  assert.equal(p.maxAiQuestionsMonth,50);
  assert.equal(p.maxAutomations,0);
});

test('billing readiness fails closed until Stripe secrets exist',()=>{
  assert.deepEqual(billingReadiness({}),{provider:'stripe',stripeSecretConfigured:false,webhookSecretConfigured:false,selfServeAvailable:false,state:'blocked'});
  assert.throws(()=>requireBillingReady({}),/BILLING_NOT_CONFIGURED/);
  assert.equal(billingReadiness({STRIPE_SECRET_KEY:'sk_live_x',STRIPE_WEBHOOK_SECRET:'whsec_x'}).selfServeAvailable,true);
});

test('refresh policy matches Starter Pro Groei Enterprise cadence',()=>{
  const starter={planCode:'starter',refreshMinutes:1440};
  const pro={planCode:'pro',refreshMinutes:60};
  const groei={planCode:'groei',refreshMinutes:15};
  const enterprise={planCode:'enterprise',refreshMinutes:0};
  assert.equal(enforceRefreshPolicy(starter).effectiveRefreshMinutes,1440);
  assert.throws(()=>enforceRefreshPolicy(starter,60),e=>e?.code==='PLAN_REFRESH_LIMIT');
  assert.equal(enforceRefreshPolicy(pro,60).effectiveRefreshMinutes,60);
  assert.equal(enforceRefreshPolicy(groei,15).effectiveRefreshMinutes,15);
  assert.equal(enforceRefreshPolicy(enterprise,0).mode,'event_or_realtime');
});

test('connector refresh policy uses central package cadence',()=>{
  const policy={planCode:'groei',refreshMinutes:15};
  assert.equal(enforceConnectorRefreshPolicy(policy,{runtime:{refreshMinutes:30}}).effectiveRefreshMinutes,30);
  assert.equal(enforceConnectorRefreshPolicy(policy,{schedule:{refreshMinutes:15}}).effectiveRefreshMinutes,15);
  assert.throws(()=>enforceConnectorRefreshPolicy(policy,{refreshMinutes:5}),e=>e?.code==='PLAN_REFRESH_LIMIT');
});

test('agent modes preserve human approval and enterprise guardrails',()=>{
  const recommend={planCode:'starter',agentMode:'recommend'};
  const approval={planCode:'pro',agentMode:'approval_required'};
  const growth={planCode:'groei',agentMode:'approval_required'};
  const autonomous={planCode:'enterprise',agentMode:'guardrailed_autonomous'};
  assert.equal(enforceAgentMode(recommend,{status:'Executing'}).allowed,false);
  assert.equal(enforceAgentMode(approval,{status:'Executing'}).allowed,false);
  assert.equal(enforceAgentMode(growth,{status:'Executing',approvalEvidence:{approved:true,approvedBy:'owner',approvedAt:'2026-10-01T05:00:00Z'}}).allowed,true);
  assert.equal(enforceAgentMode(autonomous,{status:'Executing'}).allowed,true);
});

test('autonomy envelope still applies after Enterprise plan permits execution',()=>{
  const base={autonomyLevel:'L4',actionPolicy:'ALLOW',risk:'Low',blastRadius:'Low',reversible:true,testsAvailable:true,verifierAvailable:true,budgetAvailable:true};
  assert.equal(canAgentExecute({...base,planPolicy:{agentMode:'recommend'}}).allowed,false);
  assert.equal(canAgentExecute({...base,planPolicy:{agentMode:'approval_required'},approvalEvidence:{approved:true,approvedBy:'owner',approvedAt:'2026-10-01T05:00:00Z'}}).allowed,true);
  assert.equal(canAgentExecute({...base,planPolicy:{agentMode:'guardrailed_autonomous'},risk:'High'}).allowed,false);
});
