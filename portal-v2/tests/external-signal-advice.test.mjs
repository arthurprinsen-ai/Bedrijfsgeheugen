import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExternalSignalAdvice,safeExternalSourceUrl} from '../operating-system/external-signal-advice.js';

const signal={
  signal_key:'external:example:1',source_key:'cbs',domain_key:'market',title:'Vraag verandert',
  observed_at:'2026-10-25T07:00:00Z',external_url:'https://www.cbs.nl/nl-nl/nieuws',
  impact_status:'NEEDS_COMPANY_CONTEXT',tenant_specific_impact:false,signal_score:82,
  estimated_value_eur:90000
};
const catalog=[{source_key:'cbs',label:'CBS',publisher:'Centraal Bureau voor de Statistiek',availability_state:'OBSERVED',last_observed_at:'2026-10-25T06:00:00Z',canonical_url:'https://www.cbs.nl'}];
const at=Date.parse('2026-10-25T08:30:00Z');

test('canonical signal is not represented as a proved opportunity, amount, or assigned action',()=>{
  const advice=buildExternalSignalAdvice(signal,{sourceCatalog:catalog,actions:[{
    signal_key:signal.signal_key,title:'Commerciële campagne lanceren',projection_scope:'CANONICAL_REVIEW',
    tenant_specific:false,priority_score:95,canonical_action_ref:'wrong'
  }],now:at});
  assert.equal(advice.impactProven,false);
  assert.equal(advice.expectedValueEur,null);
  assert.equal(advice.impactScore,null);
  assert.equal(advice.actionType,'GENERAL_PROPOSAL');
  assert.equal(advice.hasCanonicalAction,false);
  assert.equal(advice.owner,'');
  assert.match(advice.nextStep,/eigen markt|eigen klanten/i);
  assert.equal(advice.observationFresh24h,true);
  assert.equal(advice.sourceStatus,'OBSERVED');
  assert.equal(advice.externalUrl,'https://www.cbs.nl/nl-nl/nieuws');
});

test('the exact tenant-linked candidate gets its owner, timing, and evidence-backed customer effect',()=>{
  const advice=buildExternalSignalAdvice({...signal,tenant_specific_impact:true,impact_status:'SCORED',
    company_impacts:[{status:'SCORED',impact_score:73,target_label:'Eigen klantsegment',rationale:'Segment raakt een eigen product'}],
    estimated_value_eur:2400
  },{sourceCatalog:catalog,actions:[{
    signal_key:signal.signal_key,projection_scope:'TENANT',tenant_specific:true,
    title:'Controleer omzetimpact van eigen segment',owner_hint:'Verkoop',
    status:'MATERIALIZED',canonical_action_ref:'brain:obligation:123',
    due_at:'2026-10-29T10:00:00Z'
  }],now:at});
  assert.equal(advice.impactProven,true);
  assert.equal(advice.impactTarget,'Eigen klantsegment');
  assert.equal(advice.impactScore,73);
  assert.equal(advice.expectedValueEur,2400);
  assert.equal(advice.actionType,'ASSIGNED');
  assert.equal(advice.owner,'Verkoop');
  assert.equal(advice.hasCanonicalAction,true);
});

test('unrelated candidate and partial/unscored impact never inherit tenant action or money',()=>{
  const advice=buildExternalSignalAdvice({...signal,tenant_specific_impact:true,impact_status:'PARTIAL',
    company_impacts:[{status:'PARTIAL',impact_score:90,rationale:'Niet bewezen'}]
  },{actions:[{signal_key:'different',tenant_specific:true,projection_scope:'TENANT',title:'Onjuiste cross-tenant actie'}],now:at});
  assert.equal(advice.impactProven,false);
  assert.equal(advice.actionType,'VERIFY_CONTEXT');
  assert.equal(advice.expectedValueEur,null);
  assert.doesNotMatch(advice.nextStep,/Onjuiste/);
});

test('no source refresh is not labelled fresh because of a new calculation or future timestamp',()=>{
  const old=buildExternalSignalAdvice({...signal,observed_at:'2026-10-20T08:00:00Z'},{now:at});
  const future=buildExternalSignalAdvice({...signal,observed_at:'2026-10-26T08:00:00Z'},{now:at});
  assert.equal(old.observationFresh24h,false);
  assert.equal(future.observationFresh24h,false);
});
test('only full absolute https source URLs without credentials are linked',()=>{
  for(const bad of ['javascript:alert(1)','/relative','http://www.cbs.nl','https://user:secret@example.com','data:text/html,a'])assert.equal(safeExternalSourceUrl(bad),null);
  assert.equal(safeExternalSourceUrl('https://www.cbs.nl'), 'https://www.cbs.nl/');
});
