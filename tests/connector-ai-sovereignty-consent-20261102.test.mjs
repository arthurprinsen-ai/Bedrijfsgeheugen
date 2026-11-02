import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeConnectorDataUse,connectorDataUseActivationGuard} from '../platform/connectors/connector-data-use-policy.mjs';
import {renderWizardShell,wizardStyles} from '../assets/js/koppelingen/view.js';
import {createWizardState,applyAnswer,toConnectorDefinition} from '../assets/js/koppelingen/wizard.js';
import {findTemplate} from '../assets/js/koppelingen/templates.js';
import {handlePortalConnectorsRequest} from '../platform/api/portal-connectors-handler.mjs';

test('data use is opt-in, fixed to tenant policy and prohibits training',()=>{
  assert.deepEqual(normalizeConnectorDataUse(),{mode:'CONNECTION_ONLY',modelRoute:'TENANT_POLICY',trainingUse:'PROHIBITED'});
  assert.deepEqual(normalizeConnectorDataUse({mode:'PORTAL_AI'}),{mode:'PORTAL_AI',modelRoute:'TENANT_POLICY',trainingUse:'PROHIBITED'});
  assert.throws(()=>normalizeConnectorDataUse({mode:'PORTAL_AI',trainingUse:'ALLOWED'}),{code:'INVALID_CONNECTOR_DATA_USE'});
  assert.throws(()=>normalizeConnectorDataUse({mode:'PORTAL_AI',modelRoute:'UNVERIFIED_PROVIDER'}),{code:'INVALID_CONNECTOR_DATA_USE'});
  assert.throws(()=>normalizeConnectorDataUse({mode:'PORTAL_INSIGHTS',secret:'oops'}),{code:'INVALID_CONNECTOR_DATA_USE'});
});

test('Datahub cannot be activated without an explicit customer portal-use choice',()=>{
  assert.deepEqual(connectorDataUseActivationGuard({target:{type:'datahub'}}),{allowed:false,reason:'PORTAL_DATA_USE_NOT_AUTHORIZED'});
  assert.equal(connectorDataUseActivationGuard({target:{type:'datahub'},dataUse:{mode:'PORTAL_INSIGHTS'}}).allowed,true);
  assert.equal(connectorDataUseActivationGuard({target:{type:'datahub'},dataUse:{mode:'PORTAL_AI'}}).allowed,true);
  assert.equal(connectorDataUseActivationGuard({target:{type:'afas'},dataUse:{mode:'CONNECTION_ONLY'}}).allowed,true);
});

test('wizard exposes three user choices without AI training opt-in or regional claim',()=>{
  const markup=renderWizardShell();
  for(const mode of ['CONNECTION_ONLY','PORTAL_INSIGHTS','PORTAL_AI'])assert.match(markup,new RegExp('value="'+mode+'"'));
  assert.match(markup,/name="bgDataUseMode" value="CONNECTION_ONLY" checked/);
  assert.match(markup,/https:\/\/www\.bedrijfsgeheugen\.nl\/portal-next\/compliance\.html/);
  assert.match(wizardStyles(),/bg-kw__privacy-grid/);
  let state=createWizardState(findTemplate('outlook-pdf-facturen'));
  state=applyAnswer(state,'dataUseMode','PORTAL_AI');
  const definition=toConnectorDefinition(state);
  assert.deepEqual(definition.dataUse,{mode:'PORTAL_AI',modelRoute:'TENANT_POLICY',trainingUse:'PROHIBITED'});
});

test('backend rejects invalid data-use declarations instead of persisting client instructions',async()=>{
  let persisted=false;
  const store={configured:true,async saveDraft(){persisted=true;return{};}};
  const res=await handlePortalConnectorsRequest({
    request:{method:'POST',path:'/api/connectors',body:{target:{type:'datahub'},dataUse:{mode:'PORTAL_AI',trainingUse:'ALLOWED'}}},
    user:{id:'customer',tenantId:'tenant-a'},store
  });
  assert.equal(res.status,422);
  assert.deepEqual(await res.json(),{error:'INVALID_CONNECTOR_DATA_USE'});
  assert.equal(persisted,false);
});

test('server blocks Datahub activation before any downstream plan/runtime action without opt-in',async()=>{
  let planRead=false;
  const connector={id:'c1',version:1,target:{type:'datahub'},state:'Draft'};
  const store={
    configured:true,
    async get(){return connector;},
    async getExecution(){return {id:'e1',status:'TEST_PASSED',connector_versie:1,evidence:{configVersion:1,testExecutionId:'e1',proofLevel:'PROVIDER_VERIFIED'}};},
    async getPlanRuntimePolicy(){planRead=true;return {};},
    async saveDraft(){throw Error('Activation unexpectedly persisted');}
  };
  const res=await handlePortalConnectorsRequest({
    request:{method:'POST',path:'/api/connectors/c1/activate',body:{testExecutionId:'e1'}},
    user:{id:'customer',tenantId:'tenant-a'},store,
    engine:{activationEligibility:()=>({eligible:true,reason:'ELIGIBLE'})}
  });
  assert.equal(res.status,409);
  assert.deepEqual(await res.json(),{error:'PORTAL_DATA_USE_NOT_AUTHORIZED'});
  assert.equal(planRead,false);
});
