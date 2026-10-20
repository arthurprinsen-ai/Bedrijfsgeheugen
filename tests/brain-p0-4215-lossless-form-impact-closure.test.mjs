import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Run the canonical same-authority portal regression fixtures during learning
// historical replay, shadow and canary; no remote customer writes or tokens.
await import('../portal-v2/tests/all-field-brain-delivery-lossless.test.mjs');

const domain = readFileSync(new URL('../portal-v2/domain-state.js',import.meta.url),'utf8');
const impact = readFileSync(new URL('../portal-v2/portal-impact-engine.js',import.meta.url),'utf8');
const shell = readFileSync(new URL('../portal-v2/page-shell.js',import.meta.url),'utf8');

test('all pending customer impacts remain source-owned until canonical ACK',()=>{
 assert.match(domain,/pendingImpacts\.push/);
 assert.match(domain,/CANONICAL_BUSINESS_INPUT_ACK_REQUIRED/);
 assert.match(domain,/bg:portal-brain-pending/);
 assert.match(domain,/bg:portal-brain-synced/);
 assert.doesNotMatch(domain,/pendingImpacts\.slice\(-50\)/);
});
test('finance and external changes map to downstream review without inventing outcomes',()=>{
 assert.match(impact,/reviewDomains/);
 assert.match(impact,/external-intelligence/);
 assert.match(impact,/impact-economics/);
 assert.match(shell,/Niet alle gevolgen zijn al bewezen/);
});
test('tenant/customer acceptance is not inferred from unit-test green',()=>{
 const evidence=readFileSync(new URL('../brain/learning/2026-10-20-p0-4215-lossless-form-impacts.json',import.meta.url),'utf8');
 const e=JSON.parse(evidence);
 assert.equal(e.production_verified,false);
 assert.equal(e.two_customer_acceptance,'NOT_PROVEN');
 assert.equal(e.financial_forecast_acceptance,'NOT_PROVEN');
});
