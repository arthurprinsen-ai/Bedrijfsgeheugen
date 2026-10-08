import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {AI_DEPLOYMENT_OPTIONS,CURRENT_AI_DEPLOYMENT_PROFILE,validateCustomerAiDeployment,canUseCurrentAiRoute} from '../platform/policy/customer-ai-deployment.mjs';
import {createDataSovereigntyClient} from '../netlify/functions/_data-sovereignty-client.mjs';

const profile=(patch={})=>({...CURRENT_AI_DEPLOYMENT_PROFILE,...patch});
const local=profile({deploymentMode:'ON_PREMISE',provider:'OLLAMA',modelFamily:'MISTRAL',computeRegion:'LOCAL',storageRegion:'LOCAL',ragRegion:'LOCAL'});
const fakeClient=policy=>createDataSovereigntyClient({
 baseUrl:'https://example.supabase.co',serviceToken:'test-only',
 fetchFn:async (_url,options)=>({ok:true,json:async()=>({snapshot:{policy,violations:[],connectors:[]}})})
});

test('customer can select deployment, provider, inference, document and RAG location independently',()=>{
 for(const key of ['deploymentMode','provider','modelFamily','computeRegion','storageRegion','ragRegion','networkMode'])
  assert.ok(AI_DEPLOYMENT_OPTIONS[key].length>1,key);
 assert.equal(validateCustomerAiDeployment(local).deploymentMode,'ON_PREMISE');
 assert.equal(validateCustomerAiDeployment(profile({provider:'AZURE_OPENAI',computeRegion:'EU',storageRegion:'NL',ragRegion:'DE'})).ragRegion,'DE');
 assert.equal(canUseCurrentAiRoute(CURRENT_AI_DEPLOYMENT_PROFILE),true);
 assert.equal(canUseCurrentAiRoute(null),true);
 assert.equal(canUseCurrentAiRoute(local),false);
});

test('offline models cannot silently use external providers or internet',()=>{
 assert.throws(()=>validateCustomerAiDeployment({...local,deploymentMode:'AIR_GAPPED',networkMode:'STANDARD'}),/INVALID_AI_DEPLOYMENT_PROFILE/);
 assert.equal(validateCustomerAiDeployment({...local,deploymentMode:'AIR_GAPPED',networkMode:'OFFLINE'}).networkMode,'OFFLINE');
 assert.throws(()=>validateCustomerAiDeployment({...local,provider:'ANTHROPIC'}),/INVALID_AI_DEPLOYMENT_PROFILE/);
 assert.throws(()=>validateCustomerAiDeployment({...local,allowExternalFallback:true}),/INVALID_AI_DEPLOYMENT_PROFILE/);
 assert.throws(()=>validateCustomerAiDeployment({...local,trainingUse:'ALLOWED'}),/INVALID_AI_DEPLOYMENT_PROFILE/);
 assert.throws(()=>validateCustomerAiDeployment({...local,endpoint:'https://evil.example'}),/INVALID_AI_DEPLOYMENT_PROFILE/);
});

test('unprovisioned preferences fail closed before confidential model invocation',async()=>{
 await assert.rejects(fakeClient({ai_deployment_profile:local}).assertAiAllowed('tenant-a'),e=>e.code==='DATA_SOVEREIGNTY_AI_BLOCKED');
 await assert.rejects(fakeClient({preferred_ai_provider:'openai_eu'}).assertAiAllowed('tenant-a'),e=>e.code==='DATA_SOVEREIGNTY_AI_BLOCKED');
 await assert.rejects(fakeClient({preferred_ai_region:'EU'}).assertAiAllowed('tenant-a'),e=>e.code==='DATA_SOVEREIGNTY_AI_BLOCKED');
 await assert.rejects(fakeClient({ai_deployment_profile:local,enforcement_mode:'OBSERVE'}).assertConnectorAllowed('tenant-a','x'),e=>e.code==='DATA_SOVEREIGNTY_CONNECTOR_BLOCKED');
 await assert.doesNotReject(fakeClient({}).assertAiAllowed('tenant-a'));
});

test('tenant profile persists via Edge and is presented as desired state, not deployed state',async()=>{
 const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
 const [api,edge,ui,migration,client]=await Promise.all([
  read('netlify/functions/data-sovereignty.mjs'),read('supabase/functions/portal-state-eu/index.ts'),
  read('portal-next/data-sovereignty-panel.js'),read('supabase/migrations/20261008124500_customer_ai_deployment_profile_v1.sql'),
  read('netlify/functions/_data-sovereignty-client.mjs')
 ]);
 assert.match(api,/resolveIdentityTenant/);
 assert.match(api,/validateCustomerAiDeployment/);
 assert.match(edge,/validAiDeploymentProfile/);
 assert.match(edge,/ai_deployment_profile:aiDeploymentProfile/);
 assert.match(migration,/add column if not exists ai_deployment_profile jsonb/);
 for(const token of ['deploymentMode','modelFamily','computeRegion','storageRegion','ragRegion','networkMode','aiDeploymentProfile','niet geactiveerd'])
  assert.ok(ui.includes(token),token);
 assert.match(client,/canUseCurrentAiRoute/);
 assert.doesNotMatch(ui,/API_KEY|apiKey|secretKey/);
});
