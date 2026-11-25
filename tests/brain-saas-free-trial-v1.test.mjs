import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {TRIAL_DAYS,trialEndsAt,trialDaysLeft} from '../supabase/functions/_shared/mollie-billing.mjs';
import {trialBannerText,trialDaysLeft as portalDaysLeft} from '../portal-v2/plan-access.js';
import {createCustomerAccountHandler} from '../platform/saas/customer-account-handler.mjs';

const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('the free trial lasts exactly 30 days and needs no payment method',()=>{
  assert.equal(TRIAL_DAYS,30);
  const start=new Date('2026-10-27T10:00:00Z');
  assert.equal(trialEndsAt(start),'2026-11-26T10:00:00.000Z');
  assert.equal(trialDaysLeft('2026-11-26T10:00:00.000Z',start),30);
  assert.equal(trialDaysLeft('2026-10-01T00:00:00Z',start),0);
});

test('portal banner counts down and only shows for trialing subscriptions',()=>{
  const now=Date.parse('2026-10-27T10:00:00Z');
  assert.equal(trialBannerText({status:'active',trialEndsAt:'2026-11-26T10:00:00Z'},now),null);
  assert.match(trialBannerText({status:'trialing',trialEndsAt:'2026-11-26T10:00:00Z'},now),/nog 30 dagen/);
  assert.match(trialBannerText({status:'trialing',trialEndsAt:'2026-10-28T09:00:00Z'},now),/nog 1 dag\./);
  assert.match(trialBannerText({status:'trialing',trialEndsAt:'2026-10-27T09:00:00Z'},now),/vandaag af/);
  assert.equal(portalDaysLeft('nonsense',now),null);
});

test('customer account projection exposes the trial end only while trialing',async()=>{
  const make=sub=>createCustomerAccountHandler({
    getUser:async()=>({id:'u1',confirmedAt:'2026-10-27T00:00:00Z'}),
    storeFactory:()=>({resolveTenant:async()=>'7fed14f9-6e6a-4f7c-8ed9-dc0b6cf2a318',getEntitlements:async()=>({organisation_id:'7fed14f9-6e6a-4f7c-8ed9-dc0b6cf2a318',plan_code:'pro',plan_name:'Pro',entitlements:{},...sub})})
  });
  let body=await (await make({status:'trialing',current_period_end:'2026-11-26T10:00:00Z'})(new Request('https://x.test/'))).json();
  assert.equal(body.status,'trialing');assert.equal(body.trial_ends_at,'2026-11-26T10:00:00.000Z');
  body=await (await make({status:'active',current_period_end:'2026-11-26T10:00:00Z'})(new Request('https://x.test/'))).json();
  assert.equal(body.trial_ends_at,undefined);
});

test('edge function starts a trial without Mollie, once per e-mail, and payment converts it',async()=>{
  const [index,server,migration]=await Promise.all([
    read('supabase/functions/bg-mollie-checkout/index.ts'),
    read('supabase/functions/_shared/mollie-server.ts'),
    read('supabase/migrations/20261027173000_saas_trial_v1.sql')
  ]);
  assert.match(index,/trialMode/);
  assert.match(index,/!trialMode && !key/,'trial must not require the Mollie key');
  assert.match(server,/trial_already_used/);
  assert.match(server,/eq\('metadata->>trial_email', a\.email\)/);
  assert.match(server,/provider: 'trial'/);
  assert.match(server,/converted_payment_id/,'paying must convert the trial, not create a second organisation');
  assert.match(migration,/saas_expire_trials_v1/);
  assert.match(migration,/saas-expire-trials-daily-v1/);
  assert.match(migration,/security_invoker = true/);
});

test('website offers the free month and the checkout forwards trial mode only',async()=>{
  const [page,create]=await Promise.all([read('afsluiten.html'),read('netlify/functions/checkout-create.mjs')]);
  assert.match(page,/Start 30 dagen gratis/);
  assert.match(page,/name="mode"/);
  assert.match(page,/trial_already_used/);
  assert.match(create,/mode:'trial'/);
  assert.match(create,/trial_already_used/);
  assert.doesNotMatch(create,/body\.mode\s*\)\s*:\s*\S*key/i);
});
