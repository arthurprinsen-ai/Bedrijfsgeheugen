import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {entitlementAllows,normalizeEntitlementRecord,planRuntimePolicy,requireEntitlement} from '../platform/saas/entitlement-policy.mjs';

test('pricing communicates equal intelligence and self-serve tiers',async()=>{
  const html=await readFile(new URL('../prijzen.html',import.meta.url),'utf8');
  assert.match(html,/dezelfde kernintelligentie/i);
  assert.match(html,/\/afsluiten\?plan=control/);
  assert.match(html,/\/afsluiten\?plan=scale/);
  assert.match(html,/Enterprise[^]*Bespreek Enterprise/);
});

test('checkout backend trusts canonical plans and direct-checkout entitlement',async()=>{
  const source=await readFile(new URL('../netlify/functions/checkout-create.mjs',import.meta.url),'utf8');
  assert.match(source,/getPlan\(code\)/);
  assert.match(source,/direct_checkout/);
  assert.match(source,/monthly_price_cents/);
  assert.match(source,/mode','subscription/);
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
    planCode:'control',status:'active',intelligenceCore:true,maxDataSources:5,refreshMinutes:1440,
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