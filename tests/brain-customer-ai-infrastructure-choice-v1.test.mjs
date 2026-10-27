import test from 'node:test';
import assert from 'node:assert/strict';
import {CURRENT_AI_DEPLOYMENT_PROFILE,validateCustomerAiDeployment,canUseCurrentAiRoute} from '../platform/policy/customer-ai-deployment.mjs';
import {createDataSovereigntyClient} from '../netlify/functions/_data-sovereignty-client.mjs';
const baseline={...CURRENT_AI_DEPLOYMENT_PROFILE};
const local={...baseline,deploymentMode:'AIR_GAPPED',provider:'OLLAMA',modelFamily:'MISTRAL',computeRegion:'LOCAL',storageRegion:'LOCAL',networkMode:'OFFLINE'};
const clientFor=policy=>createDataSovereigntyClient({baseUrl:'https://example.invalid',serviceToken:'evaluation-only',fetchFn:async()=>({ok:true,json:async()=>({snapshot:{policy,violations:[],connectors:[]}})})});
test('historical-replay: a selected local AI model never activates the hosted inference path',async()=>{
 assert.equal(validateCustomerAiDeployment(local).deploymentMode,'AIR_GAPPED');
 assert.equal(canUseCurrentAiRoute(local),false);
 await assert.rejects(clientFor({ai_deployment_profile:local}).assertAiAllowed('tenant-1'),{code:'DATA_SOVEREIGNTY_AI_BLOCKED'});
});
test('shadow: a requested EU inference region cannot silently use unpinned default provider',async()=>{
 await assert.rejects(clientFor({preferred_ai_region:'EU'}).assertAiAllowed('tenant-2'),{code:'DATA_SOVEREIGNTY_AI_BLOCKED'});
 assert.equal(canUseCurrentAiRoute(baseline),true);
});
test('canary: no training or unapproved external fallback and no unverified local connector',async()=>{
 assert.throws(()=>validateCustomerAiDeployment({...local,trainingUse:'ALLOWED'}),/INVALID_AI_DEPLOYMENT_PROFILE/);
 assert.throws(()=>validateCustomerAiDeployment({...local,allowExternalFallback:true}),/INVALID_AI_DEPLOYMENT_PROFILE/);
 await assert.rejects(clientFor({ai_deployment_profile:local}).assertConnectorAllowed('tenant-3','connector-1'),{code:'DATA_SOVEREIGNTY_CONNECTOR_BLOCKED'});
});
