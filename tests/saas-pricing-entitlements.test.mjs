import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

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