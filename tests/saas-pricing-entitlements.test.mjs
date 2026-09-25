import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {entitlementAllows,enforceAgentMode,enforceConnectorRefreshPolicy,enforceRefreshPolicy,normalizeEntitlementRecord,planRuntimePolicy,requireEntitlement} from '../platform/saas/entitlement-policy.mjs';
import {billingReadiness,requireBillingReady} from '../platform/saas/billing-readiness.mjs';
import {canAgentExecute} from '../platform/agents/agent-work.mjs';

test('pricing communicates equal intelligence and self-serve tiers',async()=>{
  const html=await readFile(new URL('../prijzen.html',import.meta.url),'utf8');
  assert.match(html,/dezelfde kernintelligentie/i);
  assert.match(html,/\/afsluiten\?plan=control/);
  assert.match(html,/\/afsluiten\?plan=scale/);
  assert.match(html,/Enterprise[^]*Bespreek Enterprise/);
});


test('pricing mirrors the Portal business-context model instead of treating Scale as a company phase',async()=>{
  const html=await readFile(new URL('../prijzen.html',import.meta.url),'utf8');
  for(const label of [
    'Start &amp; validatie','Validatie &amp; eerste tractie','Snelle groei / opschalen','Professionaliseren',
    'Volwassen &amp; stabiel','Stagnatie','Verlies &amp; herstel','Acute continuïteit',
    'Financiering ophalen','Bedrijf kopen','Bedrijf verkopen','Post-merger integratie','Bedrijfsopvolging',
    'MBO / MBI','Internationaliseren','Herstructureren','Investeerder / portfolio',
    'Omzetgroei','Meer winst','Cash beschermen','Groei zonder extra FTE','Ondernemingswaarde verhogen',
    'Verkoop voorbereiden','Risico verlagen'
  ]) assert.ok(html.includes(label),label);
  assert.match(html,/Je bedrijfsfase is niet je abonnement/i);
  assert.match(html,/Primaire bedrijfsfase/i);
  assert.match(html,/Wat speelt daarnaast/i);
  assert.match(html,/Wat wil je bereiken\?/i);
  assert.match(html,/Ondernemersdoelen/i);
});

test('pricing tier copy matches canonical entitlement semantics',async()=>{
  const html=await readFile(new URL('../prijzen.html',import.meta.url),'utf8');
  assert.match(html,/Forecasting en scenarioanalyse op dagelijkse data/i);
  assert.match(html,/Forecasting en scenarioanalyse op uuractuele data/i);
  assert.match(html,/Audittrail op acties en goedkeuringen/i);
  assert.match(html,/SSO, meerdere organisaties en strengere governance/i);
  assert.match(html,/Volledig · dagelijkse data/i);
  assert.match(html,/Volledig · uuractuele data/i);
});

test('checkout backend trusts canonical plans and direct-checkout entitlement',async()=>{
  const source=await readFile(new URL('../netlify/functions/checkout-create.mjs',import.meta.url),'utf8');
  assert.match(source,/getPlan\(code\)/);
  assert.match(source,/direct_checkout/);
  assert.match(source,/monthly_price_cents/);
  assert.match(source,/mode','subscription/);
});


test('yearly pricing is carried from pricing page through checkout and billed as ten monthly fees per year',async()=>{
  const [pricing,checkoutPage,backend]=await Promise.all([
    readFile(new URL('../prijzen.html',import.meta.url),'utf8'),
    readFile(new URL('../afsluiten.html',import.meta.url),'utf8'),
    readFile(new URL('../netlify/functions/checkout-create.mjs',import.meta.url),'utf8')
  ]);
  assert.match(pricing,/searchParams\.set\('billing',billing\)/);
  assert.match(checkoutPage,/name="billing_cycle"/);
  assert.match(checkoutPage,/q\.get\('billing'\)==='yearly'/);
  assert.match(backend,/billing_cycle/);
  assert.match(backend,/monthly_price_cents\)\*10/);
  assert.match(backend,/billingCycle==='yearly'\?'year':'month'/);
  assert.match(backend,/metadata\[billing_cycle\]/);
});

test('connector store enforces the server-side source entitlement',async()=>{
  const source=await readFile(new URL('../netlify/functions/_portal-connectors-store.mjs',import.meta.url),'utf8');
  assert.match(source,/saas_active_entitlements/);
  assert.match(source,/PLAN_DATA_SOURCE_LIMIT/);
});

test('subscription webhook verifies signatures and provisions portal access',async()=>{
  const source=await readFile(new URL('../netlify/functions/stripe-webhook.mjs',import.meta.url),'utf8');
  assert.match(source,/stripe-signature/);
  assert.match(source,/ensureInvitation/);
  assert.match(source,/upsertSubscription/);
});

test('central entitlement policy fails closed without an active subscription',()=>{
  assert.equal(normalizeEntitlementRecord(null),null);
  assert.throws(()=>requireEntitlement(null,'intelligence_core'),/SUBSCRIPTION_REQUIRED/);
});

test('central entitlement policy enforces numeric boolean and mode values',()=>{
  const record={organisation_id:'org',plan_code:'control',plan_name:'Control',status:'active',entitlements:{
    intelligence_core:true,data_sources:5,refresh_minutes:1440,agent_mode:'recommend',sso:false,audit_trail:false
  }};
  assert.equal(entitlementAllows(record,'intelligence_core'),true);
  assert.equal(entitlementAllows(record,'data_sources',{requested:5}),true);
  assert.equal(entitlementAllows(record,'data_sources',{requested:6}),false);
  assert.equal(entitlementAllows(record,'agent_mode',{allowedValues:['recommend']}),true);
  assert.equal(entitlementAllows(record,'sso'),false);
  assert.deepEqual(planRuntimePolicy(record),{
    planCode:'control',status:'active',intelligenceCore:true,coreWorkspaceAccess:true,lifecycleContextAccess:true,
    recoveryWorkspaceAccess:true,maWorkspaceAccess:true,portfolioWorkspaceAccess:true,maxDataSources:5,refreshMinutes:1440,
    externalSignalScan:null,forecasting:false,scenarioAnalysis:false,agentMode:'recommend',
    organisations:0,sso:false,auditTrail:false,seniorAdvisoryMinutesMonth:0
  });
});

test('connector creation now requires an active subscription policy',async()=>{
  const source=await readFile(new URL('../netlify/functions/_portal-connectors-store.mjs',import.meta.url),'utf8');
  assert.match(source,/getPlanRuntimePolicy/);
  assert.match(source,/SUBSCRIPTION_REQUIRED/);
  assert.match(source,/PLAN_DATA_SOURCE_LIMIT/);
});

test('billing readiness fails closed until both Stripe secrets exist',()=>{
  assert.deepEqual(billingReadiness({}),{
    provider:'stripe',stripeSecretConfigured:false,webhookSecretConfigured:false,selfServeAvailable:false,state:'blocked'
  });
  assert.throws(()=>requireBillingReady({}),/BILLING_NOT_CONFIGURED/);
  assert.equal(billingReadiness({STRIPE_SECRET_KEY:'sk_live_x',STRIPE_WEBHOOK_SECRET:'whsec_x'}).selfServeAvailable,true);
});

test('checkout endpoint uses the billing readiness contract',async()=>{
  const source=await readFile(new URL('../netlify/functions/checkout-create.mjs',import.meta.url),'utf8');
  assert.match(source,/billingReadiness/);
  assert.match(source,/selfServeAvailable/);
});

test('checkout readiness endpoint never exposes secret values',async()=>{
  const source=await readFile(new URL('../netlify/functions/checkout-readiness.mjs',import.meta.url),'utf8');
  assert.match(source,/selfServeAvailable/);
  assert.doesNotMatch(source,/STRIPE_SECRET_KEY/);
  assert.doesNotMatch(source,/STRIPE_WEBHOOK_SECRET/);
});

test('refresh entitlement defaults safely and rejects faster-than-plan cadence',()=>{
  const control={planCode:'control',refreshMinutes:1440};
  const scale={planCode:'scale',refreshMinutes:60};
  const enterprise={planCode:'enterprise',refreshMinutes:0};
  assert.deepEqual(enforceRefreshPolicy(control),{
    planCode:'control',minimumRefreshMinutes:1440,requestedRefreshMinutes:1440,effectiveRefreshMinutes:1440,mode:'interval'
  });
  assert.throws(()=>enforceRefreshPolicy(control,60),error=>error?.code==='PLAN_REFRESH_LIMIT'&&error.minimumRefreshMinutes===1440);
  assert.equal(enforceRefreshPolicy(scale,60).effectiveRefreshMinutes,60);
  assert.equal(enforceRefreshPolicy(enterprise,0).mode,'event_or_realtime');
  assert.throws(()=>enforceRefreshPolicy(null,60),error=>error?.code==='SUBSCRIPTION_REQUIRED');
});

test('connector refresh policy accepts runtime and schedule cadence aliases',()=>{
  const policy={planCode:'scale',refreshMinutes:60};
  assert.equal(enforceConnectorRefreshPolicy(policy,{runtime:{refreshMinutes:120}}).effectiveRefreshMinutes,120);
  assert.equal(enforceConnectorRefreshPolicy(policy,{schedule:{refreshMinutes:60}}).effectiveRefreshMinutes,60);
  assert.throws(()=>enforceConnectorRefreshPolicy(policy,{refreshMinutes:15}),error=>error?.code==='PLAN_REFRESH_LIMIT');
});

test('connector activation applies the central refresh entitlement before Active state',async()=>{
  const source=await readFile(new URL('../platform/api/portal-connectors-handler.mjs',import.meta.url),'utf8');
  assert.match(source,/enforceConnectorRefreshPolicy/);
  assert.match(source,/getPlanRuntimePolicy/);
  assert.match(source,/PLAN_REFRESH_LIMIT/);
  assert.match(source,/refreshPolicy\.effectiveRefreshMinutes/);
});


test('agent mode policy preserves commercial autonomy boundaries',()=>{
  const recommend={planCode:'control',agentMode:'recommend'};
  const approval={planCode:'scale',agentMode:'approval_required'};
  const autonomous={planCode:'enterprise',agentMode:'guardrailed_autonomous'};
  assert.deepEqual(enforceAgentMode(recommend,{status:'Executing'}),{
    allowed:false,reason:'PLAN_RECOMMEND_ONLY',agentMode:'recommend'
  });
  assert.deepEqual(enforceAgentMode(approval,{status:'Executing'}),{
    allowed:false,reason:'PLAN_APPROVAL_REQUIRED',agentMode:'approval_required'
  });
  assert.equal(enforceAgentMode(approval,{status:'Executing',approvalEvidence:{approved:true,approvedBy:'owner',approvedAt:'2026-09-21T07:00:00Z'}}).allowed,true);
  assert.equal(enforceAgentMode(autonomous,{status:'Executing'}).allowed,true);
  assert.throws(()=>enforceAgentMode(null,{status:'Executing'}),error=>error?.code==='SUBSCRIPTION_REQUIRED');
});


test('autonomy envelope still applies after plan mode permits execution',()=>{
  const base={autonomyLevel:'L4',actionPolicy:'ALLOW',risk:'Low',blastRadius:'Low',reversible:true,testsAvailable:true,verifierAvailable:true,budgetAvailable:true};
  assert.deepEqual(canAgentExecute({...base,planPolicy:{agentMode:'recommend'}}),{
    allowed:false,reason:'PLAN_RECOMMEND_ONLY',agentMode:'recommend'
  });
  assert.deepEqual(canAgentExecute({...base,planPolicy:{agentMode:'approval_required'}}),{
    allowed:false,reason:'PLAN_APPROVAL_REQUIRED',agentMode:'approval_required'
  });
  assert.equal(canAgentExecute({...base,planPolicy:{agentMode:'approval_required'},approvalEvidence:{approved:true,approvedBy:'owner',approvedAt:'2026-09-21T07:00:00Z'}}).allowed,true);
  assert.deepEqual(canAgentExecute({...base,planPolicy:{agentMode:'guardrailed_autonomous'},risk:'High'}),{
    allowed:false,reason:'HIGH_IMPACT_REQUIRES_REVIEW'
  });
});


test('Scale keeps the complete intelligence workspace and differs by operating envelope, not model quality',()=>{
  const scale={organisation_id:'org',plan_code:'scale',plan_name:'Scale',status:'active',entitlements:{
    intelligence_core:true,data_sources:15,refresh_minutes:60,external_signal_scan:'daily',forecasting:true,scenario_analysis:true,
    agent_mode:'approval_required',organisations:1,sso:false,audit_trail:true,senior_advisory_minutes_month:120
  }};
  const policy=planRuntimePolicy(scale);
  assert.equal(policy.intelligenceCore,true);
  assert.equal(policy.coreWorkspaceAccess,true);
  assert.equal(policy.lifecycleContextAccess,true);
  assert.equal(policy.recoveryWorkspaceAccess,true);
  assert.equal(policy.maWorkspaceAccess,true);
  assert.equal(policy.portfolioWorkspaceAccess,true);
  assert.equal(policy.maxDataSources,15);
  assert.equal(policy.refreshMinutes,60);
  assert.equal(policy.agentMode,'approval_required');
  assert.equal(policy.auditTrail,true);
  assert.equal(policy.seniorAdvisoryMinutesMonth,120);
});
