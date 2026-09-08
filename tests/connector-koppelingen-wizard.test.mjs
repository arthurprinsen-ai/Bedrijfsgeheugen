import test from 'node:test';
import assert from 'node:assert/strict';
import {createWizardState,applyAnswer,nextQuestion,toConnectorDefinition} from '../assets/js/koppelingen/wizard.js';
import {findTemplate} from '../assets/js/koppelingen/templates.js';

test('wizard asks only for the first missing human decision',()=>{
  const state=createWizardState(findTemplate('outlook-pdf-facturen'));
  assert.equal(nextQuestion(state).key,'connection');
  assert.equal(nextQuestion(state).phase,'source');
});

test('wizard skips target choice when template has one safe default target',()=>{
  let state=createWizardState(findTemplate('outlook-pdf-facturen'));
  state=applyAnswer(state,'connection','m365-1');
  assert.equal(nextQuestion(state).key,'confirmSchedule');
});

test('generated definition keeps technical config internal and uses safe defaults',()=>{
  let state=createWizardState(findTemplate('outlook-pdf-facturen'));
  state=applyAnswer(state,'connection','m365-1');
  state=applyAnswer(state,'confirmSchedule',true);
  const definition=toConnectorDefinition(state);
  assert.equal(definition.source.type,'email');
  assert.equal(definition.source.connectionId,'m365-1');
  assert.equal(definition.target.type,'datahub');
  assert.equal(definition.schedule,'dag');
  assert.equal(definition.documentType,'invoice');
  assert.equal(definition.activation,'test-required');
  assert.equal('credentials' in definition,false);
});

test('wizard never turns a catalog choice into provider health evidence',()=>{
  let state=createWizardState(findTemplate('afas-datahub'));
  state=applyAnswer(state,'connection','afas-1');
  const definition=toConnectorDefinition(state);
  const serialized=JSON.stringify(definition);
  assert.doesNotMatch(serialized,/"(?:ready|healthy)"\s*:/i);
});
