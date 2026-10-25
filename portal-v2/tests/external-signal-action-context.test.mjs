import test from 'node:test';
import assert from 'node:assert/strict';
import {explainExternalSignal} from '../modules/external-signal-action-context.js';
const now=Date.parse('2026-10-25T12:00:00Z');
const signal={signal_key:'regulatory:42',external_url:'https://www.rvo.nl/onderwerpen/',published_at:'2026-10-24T10:00:00Z',company_impacts:[{status:'SCORED',impact_score:88,target_label:'Bedrijf A',rationale:'Kan invloed hebben op een innovatieproject.'}]};

test('bedrijfsspecifiek signaal toont bewijs en exact gekoppelde vervolgstap',()=>{
  const result=explainExternalSignal(signal,[{signal_key:'regulatory:42',tenant_specific:true,status:'READY',rationale:'Controleer toepasselijkheid en deadlines.',canonical_action_ref:'action:42'}],now);
  assert.equal(result.tenantImpactConfirmed,true);
  assert.equal(result.affected,'Bedrijf A');
  assert.equal(result.canOpenAction,true);
  assert.equal(result.scope,'KLANTSPECIFIEK');
  assert.match(result.nextStep,/deadlines/);
  assert.equal(result.sourceState,'RECENTE_BRON');
  assert.equal(result.outcomeVerified,false);
});
test('algemene actie mag nooit als klantspecifieke uitvoering worden getoond',()=>{
  const result=explainExternalSignal({...signal,company_impacts:[]},[{signal_key:'regulatory:42',tenant_specific:false,status:'MATERIALIZED',canonical_action_ref:'canonical:111',rationale:'Meteen verkopen'}],now);
  assert.equal(result.tenantImpactConfirmed,false);
  assert.equal(result.canOpenAction,false);
  assert.equal(result.scope,'ALGEMEEN_VOORSTEL');
  assert.doesNotMatch(result.nextStep,/verkopen/);
});
test('ongescoord bewijs en acties van een ander signaal blijven uitgesloten',()=>{
  const result=explainExternalSignal({...signal,company_impacts:[{status:'CANDIDATE',impact_score:99}]},[{signal_key:'other',tenant_specific:true,status:'READY',canonical_action_ref:'other:1'}],now);
  assert.equal(result.tenantImpactConfirmed,false);
  assert.equal(result.canOpenAction,false);
  assert.equal(result.scope,'NOG_GEEN_ACTIE');
});
test('stale en onveilige bronnen geven geen groen bewijs',()=>{
  assert.equal(explainExternalSignal({...signal,published_at:'2026-01-01T00:00:00Z'},[],now).sourceState,'BRON_OUDER_DAN_14_DAGEN');
  assert.equal(explainExternalSignal({...signal,external_url:'javascript:alert(1)'},[],now).sourceUrl,null);
  assert.equal(explainExternalSignal({...signal,published_at:'invalid'},[],now).sourceState,'BRONDATUM_NIET_BEVESTIGD');
});
test('afgeronde actie is geen geverifieerde omzet of provider-resultaat',()=>{
  const result=explainExternalSignal(signal,[{signal_key:'regulatory:42',tenant_specific:true,status:'DONE',canonical_action_ref:'action:42'}],now);
  assert.equal(result.actionStatus,'DONE');
  assert.equal(result.canOpenAction,false);
  assert.equal(result.outcomeVerified,false);
});
