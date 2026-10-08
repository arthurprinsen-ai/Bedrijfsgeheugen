import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRENT_AI_DEPLOYMENT_PROFILE,validateCustomerAiDeployment,canUseCurrentAiRoute } from '../platform/policy/customer-ai-deployment.mjs';
import {createDataSovereigntyClient} from '../netlify/functions/_data-sovereignty-client.mjs';

const profile=delta=>({...CURRENT_AI_DEPLOYMENT_PROFILE,...delta});
function client(policy){return createDataSovereigntyClient({
  baseUrl:'https://example.test',serviceToken:'non-sensitive-test-token',
  fetchFn:async()=>({ok:true,json:async()=>({snapshot:{policy,violations:[],connectors:[]}})})
});}
test('a customer-selected on-prem Mistral deployment is valid desired state but cannot activate external inference',async()=>{
 const local=profile({deploymentMode:'ON_PREMISE',provider:'OLLAMA',modelFamily:'MISTRAL',computeRegion:'LOCAL',storageRegion:'LOCAL',ragRegion:'LOCAL'});
 assert.equal(validateCustomerAiDeployment(local).provider,'OLLAMA');
 assert.equal(canUseCurrentAiRoute(local),false);
 await assert.rejects(client({ai_deployment_profile:local}).assertAiAllowed('tenant-a'),{code:'DATA_SOVEREIGNTY_AI_BLOCKED'});
});
test('strict AI region requests cannot silently fall back to the existing Anthropic route',async()=>{
 assert.equal(canUseCurrentAiRoute(profile({computeRegion:'EU'})),false);
 await assert.rejects(client({preferred_ai_region:'EU'}).assertAiAllowed('tenant-a'),{code:'DATA_SOVEREIGNTY_AI_BLOCKED'});
 await assert.rejects(client({preferred_ai_provider:'openai_eu'}).assertAiAllowed('tenant-a'),{code:'DATA_SOVEREIGNTY_AI_BLOCKED'});
});
test('offline/local storage disallows provider fallback and unverified connector execution',async()=>{
 const offline=profile({deploymentMode:'AIR_GAPPED',provider:'VLLM',modelFamily:'GEMMA',computeRegion:'LOCAL',storageRegion:'LOCAL',networkMode:'OFFLINE'});
 assert.equal(validateCustomerAiDeployment(offline).networkMode,'OFFLINE');
 assert.throws(()=>validateCustomerAiDeployment({...offline,allowExternalFallback:true}),/INVALID_AI_DEPLOYMENT_PROFILE/);
 assert.throws(()=>validateCustomerAiDeployment({...offline,provider:'ANTHROPIC'}),/INVALID_AI_DEPLOYMENT_PROFILE/);
 await assert.rejects(client({ai_deployment_profile:offline}).assertConnectorAllowed('tenant-a','c1'),{code:'DATA_SOVEREIGNTY_CONNECTOR_BLOCKED'});
});
