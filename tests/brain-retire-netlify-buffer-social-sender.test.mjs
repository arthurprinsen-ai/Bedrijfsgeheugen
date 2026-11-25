import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler, {config,runSocialPublicationDelivery,localDayWindow,providerReconciliationState} from '../netlify/functions/social-publication-delivery.mjs';
import hook from '../netlify/functions/social-publication-delivery-deploy.mjs';

const sender=readFileSync(new URL('../netlify/functions/social-publication-delivery.mjs',import.meta.url),'utf8');
const deployHook=readFileSync(new URL('../netlify/functions/social-publication-delivery-deploy.mjs',import.meta.url),'utf8');

test('duplicate Netlify social sender has no schedule or write-capable Buffer transport',()=>{
  assert.equal(config.schedule,undefined);
  assert.doesNotMatch(sender,/https:\/\/api\.buffer\.com|BUFFER_API_KEY|function buffer\s*\(/i);
  assert.doesNotMatch(sender,/createPost\s*\(|publishInstagramViaComposio\s*\(/);
  assert.doesNotMatch(deployHook,/runSocialPublicationDelivery|social-publication-delivery\.mjs|api\.buffer\.com/i);
});
test('retired direct request and callable legacy worker are explicitly nonpublishing',async()=>{
  const result=await runSocialPublicationDelivery();
  assert.equal(result.ok,false);
  assert.equal(result.provider_write_performed,false);
  assert.equal(result.delivery_claimed,false);
  assert.equal(result.canonical_executor,'supabase:powerhouse-social-publisher');
  const response=await handler();
  assert.equal(response.status,410);
  const body=await response.json();
  assert.equal(body.reason,'RETIRED_DUPLICATE_BUFFER_SENDER');
});
test('deprecated deploy hook never dispatches a provider write',async()=>{
  const result=await hook.deploySucceeded({deploy:{context:'production',id:'test',commitRef:'abc'}});
  assert.equal(result.provider_write_performed,false);
});
test('read-only historical timing helpers retain Amsterdam DST behavior without invoking a sender',()=>{
  const winter=localDayWindow('2026-01-15');
  const summer=localDayWindow('2026-07-15');
  assert.match(winter.start,/T23:00:00\.000Z$/);
  assert.match(summer.start,/T22:00:00\.000Z$/);
  assert.equal(providerReconciliationState('PLANNED','scheduled'),'DISPATCHED');
  assert.equal(providerReconciliationState('DISPATCHED','scheduled'),null);
});
