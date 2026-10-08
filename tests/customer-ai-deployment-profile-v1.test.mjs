import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CURRENT_AI_DEPLOYMENT_PROFILE,validateCustomerAiDeployment,canUseCurrentAiRoute} from '../platform/policy/customer-ai-deployment.mjs';
import {createDataSovereigntyClient} from '../netlify/functions/_data-sovereignty-client.mjs';

const profile=overrides=>({...CURRENT_AI_DEPLOYMENT_PROFILE,...overrides});
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('profile is allowlisted and forbids customer-data model training, external fallback and unknown fields',()=>{
 const accepted=validateCustomerAiDeployment(profile({provider:'AZURE_OPENAI',computeRegion:'EU',storageRegion:'EU',ragRegion:'EU'}));
 assert.equal(accepted.trainingUse,'PROHIBITED');
 for(const override of [{trainingUse:'ALLOWED'},{allowExternalFallback:true},{secret:'LEAK'},{computeRegion:'PLANET_MARS'},{modelId:'https://bad.tld?key=x'}]){
  assert.throws(()=>validateCustomerAiDeployment(profile(override)),/INVALID_AI_DEPLOYMENT_PROFILE/);
 }
 assert.throws(()=>validateCustomerAiDeployment([]),/INVALID_AI_DEPLOYMENT_PROFILE/);
});

test('air-gapped/on-prem profiles cannot specify hosted providers, remote regions or online access',()=>{
 const valid=profile({deploymentMode:'AIR_GAPPED',provider:'OLLAMA',modelFamily:'GEMMA',computeRegion:'LOCAL',storageRegion:'LOCAL',networkMode:'OFFLINE'});
 assert.equal(validateCustomerAiDeployment(valid).deploymentMode,'AIR_GAPPED');
 assert.throws(()=>validateCustomerAiDeployment({...valid,provider:'AZURE_OPENAI'}),/INVALID_AI_DEPLOYMENT_PROFILE/);
 assert.throws(()=>validateCustomerAiDeployment({...valid,storageRegion:'EU'}),/INVALID_AI_DEPLOYMENT_PROFILE/);
 assert.throws(()=>validateCustomerAiDeployment({...valid,networkMode:'STANDARD'}),/INVALID_AI_DEPLOYMENT_PROFILE/);
});

test('no active routing is inferred from a saved profile or requested EU location',()=>{
 assert.equal(canUseCurrentAiRoute(null),true);
 assert.equal(canUseCurrentAiRoute(profile({})),true);
 for(const desired of [
  profile({provider:'MISTRAL_API'}),profile({computeRegion:'EU'}),profile({storageRegion:'EU'}),
  profile({modelFamily:'GEMMA'}),profile({networkMode:'PRIVATE_ENDPOINT'}),
  profile({deploymentMode:'ON_PREMISE',provider:'OLLAMA',computeRegion:'LOCAL',storageRegion:'LOCAL'})
 ])assert.equal(canUseCurrentAiRoute(desired),false);
});

function clientFor(policy){
 return createDataSovereigntyClient({
  baseUrl:'https://eu.example.test',serviceToken:'test-service-token',
  fetchFn:async(_url,req)=>{
   assert.equal(req.headers['x-region'],'eu-central-1');
   return {ok:true,json:async()=>({snapshot:{policy,violations:[],connectors:[]}})};
  }
 });
}
test('non-current model/provider or strict placement fails closed before confidential AI invocation',async()=>{
 const baseline={mode:'TRANSPARENT_GLOBAL',enforcement_mode:'OBSERVE'};
 await assert.doesNotReject(clientFor(baseline).assertAiAllowed('tenant-a'));
 await assert.doesNotReject(clientFor({...baseline,ai_deployment_profile:profile({})}).assertAiAllowed('tenant-a'));
 for(const policy of [
  {...baseline,ai_deployment_profile:profile({provider:'AWS_BEDROCK'})},
  {...baseline,ai_deployment_profile:profile({computeRegion:'NL'})},
  {...baseline,preferred_ai_provider:'openai_eu'}
 ])await assert.rejects(clientFor(policy).assertAiAllowed('tenant-a'),{code:'DATA_SOVEREIGNTY_AI_BLOCKED'});
});
test('unverified private cloud and local-storage choices block connector activation',async()=>{
 const base={mode:'TRANSPARENT_GLOBAL',enforcement_mode:'OBSERVE'};
 for(const selection of [
  profile({deploymentMode:'PRIVATE_CLOUD',networkMode:'PRIVATE_ENDPOINT'}),
  profile({deploymentMode:'ON_PREMISE',provider:'OLLAMA',computeRegion:'LOCAL',storageRegion:'LOCAL'}),
  profile({storageRegion:'EU'})
 ])await assert.rejects(clientFor({...base,ai_deployment_profile:selection}).assertConnectorAllowed('tenant-b','c1'),{code:'DATA_SOVEREIGNTY_CONNECTOR_BLOCKED'});
});
test('portal, tenant storage, API and runtime guard share the customer AI deployment contract',async()=>{
 const [panel,css,api,edge,sql,client]=await Promise.all([
  read('portal-next/data-sovereignty-panel.js'),read('portal-next/data-sovereignty-panel.css'),
  read('netlify/functions/data-sovereignty.mjs'),read('supabase/functions/portal-state-eu/index.ts'),
  read('supabase/migrations/20261008124500_customer_ai_deployment_profile_v1.sql'),
  read('netlify/functions/_data-sovereignty-client.mjs')
 ]);
 for(const k of ['deploymentMode','provider','modelFamily','computeRegion','storageRegion','ragRegion','networkMode','modelId','aiDeploymentProfile'])assert.match(panel,new RegExp(k));
 assert.match(css,/\.dsp-policy-title/);
 assert.match(api,/validateCustomerAiDeployment/);
 assert.match(edge,/validAiDeploymentProfile/);
 assert.match(edge,/ai_deployment_profile:aiDeploymentProfile/);
 assert.match(sql,/ai_deployment_profile jsonb/);
 assert.match(client,/canUseCurrentAiRoute/);
 assert.match(client,/DATA_SOVEREIGNTY_CONNECTOR_BLOCKED/);
});
