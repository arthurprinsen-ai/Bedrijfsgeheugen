import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {entitlementAllows,enforceAgentMode,enforceConnectorRefreshPolicy,enforceRefreshPolicy,normalizeEntitlementRecord,planRuntimePolicy,requireEntitlement} from '../platform/saas/entitlement-policy.mjs';
import {billingReadiness,requireBillingReady} from '../platform/saas/billing-readiness.mjs';
import {canAgentExecute} from '../platform/agents/agent-work.mjs';

test('paid Starter, Pro and Groei provision once and resume incomplete provisioning',async()=>{
  const module=await import('../netlify/functions/stripe-webhook.mjs');
  assert.equal(typeof module.completeCheckout,'function','checkout completion must be testable through its real provisioning flow');
  for(const plan of ['starter','pro','groei']){
    let organisationCalls=0,invitations=0,saved=null,intent=null;
    const store={getPlan:async()=>({code:plan,active:true}),findSubscription:async()=>saved,
      ensureCheckoutOrganisation:async()=>{organisationCalls++;return {id:'org-1'}},
      ensureCustomer:async()=>{},ensureInvitation:async()=>{invitations++},
      upsertSubscription:async row=>{saved=row;return row},
      completeCheckoutIntent:async row=>{intent=row;return row},recordCheckoutOutcome:async event=>{assert.equal(event.context.revenue_verified,false);assert.doesNotMatch(JSON.stringify(event),/owner@example/);return {id:'event-1'}}};
    const session={id:'cs_123',subscription:'sub_123',metadata:{plan_code:plan,company_name:'Acme',billing_cycle:'yearly'},customer_details:{email:'owner@example.test'}};
    const provider=async()=>({id:'sub_123',status:'active',customer:'cus_123',metadata:{}});
    await module.completeCheckout(store,session,provider);
    await module.completeCheckout(store,session,provider);
    assert.equal(saved.plan_code,plan);assert.equal(saved.organisation_id,'org-1');
    assert.equal(organisationCalls,1);assert.equal(invitations,2,'retry must repair missing invitation, not return early');
    assert.equal(intent.provider_session_id,'cs_123');assert.equal(intent.state,'completed');
    assert.equal(saved.metadata.billing_cycle,'yearly');
  }
});

test('checkout persists intent before contacting Stripe and retry uses the same provider key',async()=>{
  const module=await import('../netlify/functions/checkout-create.mjs');
  assert.equal(typeof module.createCheckoutHandler,'function');
  const order=[],keys=[];let saved;
  const store={getPlan:async()=>({code:'starter',name:'Starter',monthly_price_cents:9900,direct_checkout:true}),
    ensureCheckoutIntent:async row=>{order.push('persist');saved||=row;return saved},
    openCheckoutIntent:async()=>{order.push('readback');return {provider_session_id:'cs_123'}}};
  const handler=module.createCheckoutHandler({storeFactory:()=>store,env:{STRIPE_SECRET_KEY:'test',STRIPE_WEBHOOK_SECRET:'test'},fetchFn:async(_,options)=>{
    order.push('provider');keys.push(options.headers['idempotency-key']);
    const p=new URLSearchParams(options.body);assert.equal(p.get('line_items[0][price_data][unit_amount]'),'99000');
    assert.equal(p.get('subscription_data[metadata][plan_code]'),'starter');
    return Response.json({id:'cs_123',url:'https://checkout.stripe.com/c/pay/test'});
  }});
  const body={attempt_id:'7fed14f9-6e6a-4f7c-8ed9-dc0b6cf2a318',plan:'starter',billing_cycle:'yearly',email:'owner@example.test',company_name:'Acme'};
  for(let i=0;i<2;i++){
    const r=await handler(new Request('https://www.bedrijfsgeheugen.nl/api/checkout/create',{method:'POST',body:JSON.stringify(body)}));
    assert.equal(r.status,200);assert.equal((await r.json()).url,'https://checkout.stripe.com/c/pay/test');
  }
  assert.deepEqual(order,['persist','provider','readback','persist','provider','readback']);
  assert.equal(keys[0],keys[1]);assert.ok(keys[0]);
});

test('a failed intent write never opens a payment session',async()=>{
  const module=await import('../netlify/functions/checkout-create.mjs');
  assert.equal(typeof module.createCheckoutHandler,'function');
  let calls=0;
  const handler=module.createCheckoutHandler({env:{STRIPE_SECRET_KEY:'test',STRIPE_WEBHOOK_SECRET:'test'},storeFactory:()=>({
    getPlan:async()=>({code:'starter',direct_checkout:true,monthly_price_cents:9900}),
    ensureCheckoutIntent:async()=>{throw Error('database unavailable')}
  }),fetchFn:async()=>{calls++}});
  const response=await handler(new Request('https://www.bedrijfsgeheugen.nl/api/checkout/create',{method:'POST',body:JSON.stringify({plan:'starter',email:'a@example.test',company_name:'Acme'})}));
  assert.equal(response.status,503);assert.equal(calls,0);
});

test('account activation accepts only a confirmed identity and one paid organisation',async()=>{
  const {createAccountActivationHandler}=await import('../netlify/functions/checkout-activate.mjs');
  let writes=0;
  const user={id:'user-1',email:'owner@example.test',confirmedAt:'2026-10-21T00:00:00Z',appMetadata:{roles:['customer']}};
  const handler=createAccountActivationHandler({getUserFn:async()=>user,verifyOrigin:()=>{},
    storeFactory:()=>({resolvePaidInvitation:async()=> '91c9cdf0-f1d6-46ad-aabe-5080eb70d02a',hasPersonalPortalState:async()=>false}),
    updateUser:async(id,attributes)=>{writes++;assert.equal(id,'user-1');assert.equal(attributes.app_metadata.tenantId,'91c9cdf0-f1d6-46ad-aabe-5080eb70d02a');return {id,appMetadata:attributes.app_metadata}}
  });
  const request=()=>new Request('https://www.bedrijfsgeheugen.nl/api/checkout/activate',{method:'POST'});
  assert.equal((await handler(request())).status,200);assert.equal(writes,1);
  delete user.confirmedAt;assert.equal((await handler(request())).status,403);assert.equal(writes,1);
  user.confirmedAt='2026-10-21T00:00:00Z';user.appMetadata.tenantId='another-tenant';
  assert.equal((await handler(request())).status,409);assert.equal(writes,1);
});

test('a previously completed provider session cannot create another checkout',async()=>{
  const {createCheckoutHandler}=await import('../netlify/functions/checkout-create.mjs');
  let posts=0;
  const handler=createCheckoutHandler({env:{STRIPE_SECRET_KEY:'test',STRIPE_WEBHOOK_SECRET:'test'},storeFactory:()=>({
    getPlan:async()=>({code:'starter',direct_checkout:true,monthly_price_cents:9900}),
    ensureCheckoutIntent:async row=>({...row,provider_session_id:'cs_original'})
  }),fetchFn:async(_,options)=>{if(options.method==='POST')posts++;return Response.json({id:'cs_original',status:'complete'})}});
  const response=await handler(new Request('https://www.bedrijfsgeheugen.nl/api/checkout/create',{method:'POST',body:JSON.stringify({plan:'starter',email:'owner@example.test',company_name:'Acme'})}));
  assert.equal(response.status,200);assert.match((await response.json()).url,/success=1&session_id=cs_original/);assert.equal(posts,0);
});

test('checkout status needs persisted matching subscription proof, never only a completed redirect',async()=>{
  const {checkoutStatus}=await import('../platform/saas/billing-readiness.mjs');
  const fetchFn=async()=>Response.json({status:'complete',subscription:'sub_123'});
  assert.deepEqual(await checkoutStatus('cs_123',{fetchFn,env:{},store:{findSubscription:async()=>null}}),{ready:false,state:'provisioning'});
  assert.deepEqual(await checkoutStatus('cs_123',{fetchFn,env:{},store:{findSubscription:async()=>({status:'active',metadata:{checkout_session_id:'cs_123'}})}}),{ready:true,state:'ready'});
});

test('pricing exposes canonical Starter Pro Groei and Enterprise tiers',async()=>{
  const html=await readFile(new URL('../prijzen.html',import.meta.url),'utf8');
  for(const token of ['Starter','€ 99','Pro','€ 299','Groei','€ 749','Enterprise','Op maat']) assert.ok(html.includes(token),token);
  for(const plan of ['starter','pro','groei']) assert.match(html,new RegExp('https://www\\.bedrijfsgeheugen\\.nl/afsluiten\\?plan='+plan));
  assert.match(html,/Powerhouse SaaS/);
  assert.match(html,/Consulting & workshops/);
});

test('pricing package contents match the commercial capacity contract',async()=>{
  const html=await readFile(new URL('../prijzen.html',import.meta.url),'utf8');
  for(const token of [
    'Tot 5 gebruikers','2 integraties','Nachtelijke data refresh','50 AI-vragen / maand',
    'Tot 25 gebruikers','10 integraties','Uurlijkse data refresh','AI copilot: 200 vragen / maand',
    'Tot 75 gebruikers','25 integraties','Data refresh elke 15 minuten','12 automatiseringen','6 AI-automatiseringen','750 AI-vragen / maand',
    'SSO / werkaccount','Audit trail & export','On-demand data refresh','Enterprise support (SLA)'
  ]) assert.ok(html.includes(token),token);
});

test('consulting offers and SaaS combination rule are explicit',async()=>{
  const html=await readFile(new URL('../prijzen.html',import.meta.url),'utf8');
  for(const token of ['Directie & AI Workshop','€ 1.950','Bedrijfsgeheugen Scan','€ 2.950','Vanaf € 14.500','Transformation / Fractional Lead','Combineer zonder dubbel te betalen','tijdelijk Pro toegang','tijdelijk Groei toegang']) assert.ok(html.includes(token),token);
});

test('checkout backend trusts canonical plans and direct-checkout entitlement',async()=>{
  const source=await readFile(new URL('../netlify/functions/checkout-create.mjs',import.meta.url),'utf8');
  assert.match(source,/getPlan\(code\)/);
  assert.match(source,/direct_checkout/);
  assert.match(source,/monthly_price_cents/);
  assert.match(source,/mode','subscription/);
});


test('yearly checkout remains ten monthly fees with the new plans',async()=>{
  const [checkoutPage,backend]=await Promise.all([
    readFile(new URL('../afsluiten.html',import.meta.url),'utf8'),
    readFile(new URL('../netlify/functions/checkout-create.mjs',import.meta.url),'utf8')
  ]);
  for(const token of ["starter:{","pro:{","groei:{","yearly:'€ 990'","yearly:'€ 2.990'","yearly:'€ 7.490'"]) assert.ok(checkoutPage.includes(token),token);
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
