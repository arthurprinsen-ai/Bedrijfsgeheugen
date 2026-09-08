import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeAiGuideResult,createConnectorAiGuideHandler} from '../platform/api/connector-ai-guide-handler.mjs';

test('AI guide recursively strips secrets and provider health claims',()=>{
  const clean=sanitizeAiGuideResult({
    summary:'Ik stel een e-mailkoppeling voor.',
    token:'abc',ready:true,healthy:true,executionId:'x',
    proposedDefinition:{source:{type:'email',apiKey:'nope'},target:{type:'datahub'},nested:{password:'x',safe:'yes'}}
  });
  assert.equal(clean.summary,'Ik stel een e-mailkoppeling voor.');
  const serialized=JSON.stringify(clean);
  assert.doesNotMatch(serialized,/(token|password|api[_-]?key|executionId|"ready"|"healthy")/i);
  assert.equal(clean.proposedDefinition.nested.safe,'yes');
});

test('AI guide only accepts POST with bounded intent and current state',async()=>{
  const handler=createConnectorAiGuideHandler({
    getUser:async()=>({id:'u1'}),
    propose:async input=>({summary:input.intent,suggestions:[],missingQuestions:[],proposedDefinition:input.currentState||{}})
  });
  const getResponse=await handler(new Request('https://example.test/api/connectors/guide'));
  assert.equal(getResponse.status,405);
  const response=await handler(new Request('https://example.test/api/connectors/guide',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({intent:'Facturen uit Outlook naar de Datahub',currentState:{source:{type:'email'}}})}));
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.summary,'Facturen uit Outlook naar de Datahub');
});

test('AI guide requires an authenticated portal user',async()=>{
  const handler=createConnectorAiGuideHandler({getUser:async()=>null,propose:async()=>({})});
  const response=await handler(new Request('https://example.test/api/connectors/guide',{method:'POST',body:'{}'}));
  assert.equal(response.status,401);
});
