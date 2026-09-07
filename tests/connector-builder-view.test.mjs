import test from 'node:test';
import assert from 'node:assert/strict';
import {renderConnectorBuilder,renderConnectorOverview} from '../portal-next/connector-builder-view.js';
import {createConnectorDraft} from '../portal-next/connector-model.js';

test('overview separates planned integrations, built connectors and templates',()=>{
  const html=renderConnectorOverview({planned:[{name:'GA4',purpose:'Analytics'}],connectors:[{id:'c1',name:'Invoice intake',state:'Draft'}]});
  assert.match(html,/Geplande koppelingen/);assert.match(html,/Gebouwde koppelingen/);assert.match(html,/Templates/);assert.match(html,/Koppeling bouwen/);
  assert.doesNotMatch(html,/Invoice intake[\s\S]{0,100}>Actief</);
});

test('builder exposes all ten approved stages and custom fields',()=>{
  const draft=createConnectorDraft('purchase-invoice');
  const html=renderConnectorBuilder({draft,stage:3,testResult:null});
  for(const label of ['Bron','Document/data type','Velden','Database & matching','Mapping','Doel','Review & regels','Test','Activeren','Monitoren'])assert.match(html,new RegExp(label));
  assert.match(html,/Factuurnummer/);assert.match(html,/data-add-field/);assert.match(html,/data-builder-next/);
});

test('email AFAS template visibly preserves Document Intake lineage',()=>{
  const html=renderConnectorBuilder({draft:createConnectorDraft('email-pdf-afas'),stage:2,testResult:null});
  assert.match(html,/AFAS Document Intake/);assert.match(html,/PA - Intake - Loonbeslag Email to AFAS/);assert.match(html,/KnSubject/);
});

test('activation button is disabled without passing evidence',()=>{
  const html=renderConnectorBuilder({draft:createConnectorDraft('blank'),stage:9,testResult:null});
  assert.match(html,/data-activate[^>]*disabled/);
  assert.match(html,/Testbewijs vereist/);
});
