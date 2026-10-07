import test from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDER_REGISTRY, buildDataSovereigntyModel, providerForEvent } from '../data-ai-passport.js';

test('sovereignty registry is fail-closed for unverified account settings',()=>{
  const byId=Object.fromEntries(PROVIDER_REGISTRY.map(p=>[p.id,p]));
  assert.equal(byId.supabase.status,'verified_eu');
  assert.match(byId.supabase.processing,/eu-central-1/);
  assert.equal(byId.netlify.status,'action_required');
  assert.match(byId.netlify.processing,/Niet bewezen/);
  assert.equal(byId.github.status,'outside_eu');
  assert.equal(byId.notion.status,'unknown');
  assert.equal(byId.anthropic.status,'outside_eu');
  assert.match(byId.anthropic.storage,/Verenigde Staten/);
  assert.equal(byId.openai.customerFlow,'excluded');
});

test('runtime events are mapped to processors without exposing payload contents',()=>{
  const state={portal:{runtime:{observability:{events:[
    {id:'1',occurredAt:new Date().toISOString(),source:'Supabase',title:'operation stored',status:'VERIFIED',category:'platform'},
    {id:'2',occurredAt:new Date().toISOString(),layer:'GitHub / Delivery',title:'commit readback',status:'SUCCESS',category:'delivery'}
  ]}}}};
  const model=buildDataSovereigntyModel(state);
  assert.equal(model.events[0].providerId,'supabase');
  assert.equal(model.events[1].providerId,'github');
  assert.equal(model.events[0].category,'Platform-/runtime-metadata');
  assert.equal(providerForEvent({source:'Anthropic Claude'}),'anthropic');
});

test('customer scope keeps explicit boundaries visible when runtime proves a technical provider',()=>{
  const state={portal:{runtime:{observability:{events:[{id:'g',source:'GitHub',title:'release'}]}}}};
  const model=buildDataSovereigntyModel(state);
  assert.ok(model.customerProviders.some(p=>p.id==='github'));
  assert.ok(model.customerProviders.some(p=>p.id==='supabase'));
});
