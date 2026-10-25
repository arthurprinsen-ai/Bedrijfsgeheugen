import test from 'node:test';
import assert from 'node:assert/strict';
import {explainExternalSignal} from '../modules/external-signal-action-context.js';
const now=Date.parse('2026-10-25T12:00:00Z');
const signal={signal_key:'regulatory:42',external_url:'https://www.rvo.nl/onderwerpen/',published_at:'2026-10-24T10:00:00Z',company_impacts:[{status:'SCORED',impact_score:88,target_label:'Bedrijf A',rationale:'Kan effect hebben op aangevraagd innovatieproject.'}]};
test('tenant impact with exact evidence-bound action',()=>{
 const result=explainExternalSignal(signal,[{signal_key:'regulatory:42',tenant_specific:true,status:'READY',rationale:'Controleer toepasselijkheid en deadlines.',canonical_action_ref:'action:42'}],now);
 assert.equal(result.tenantImpactConfirmed,true);assert.equal(result.scope,'KLANTSPECIFIEK');assert.equal(result.canOpenAction,true);assert.equal(result.sourceState,'RECENTE_BRON');assert.match(result.nextStep,/deadlines/);assert.equal(result.outcomeVerified,false);
});
test('global review cannot impersonate customer action',()=>{
 const result=explainExternalSignal({...signal,company_impacts:[]},[{signal_key:'regulatory:42',tenant_specific:false,status:'MATERIALIZED',rationale:'Unsupported conclusion',canonical_action_ref:'canonical:111'}],now);
 assert.equal(result.tenantImpactConfirmed,false);assert.equal(result.scope,'ALGEMEEN_VOORSTEL');assert.equal(result.canOpenAction,false);assert.doesNotMatch(result.nextStep,/Unsupported/);
});
test('other signal and unscored impact never count',()=>{
 const result=explainExternalSignal({...signal,company_impacts:[{status:'CANDIDATE',impact_score:99}]},[{signal_key:'other',tenant_specific:true,status:'READY',canonical_action_ref:'action:x'}],now);
 assert.equal(result.tenantImpactConfirmed,false);assert.equal(result.canOpenAction,false);
});
test('old, unsafe or undated sources are explicit',()=>{
 assert.equal(explainExternalSignal({...signal,published_at:'2026-01-01T00:00:00Z'},[],now).sourceState,'BRON_OUDER_DAN_14_DAGEN');
 assert.equal(explainExternalSignal({...signal,external_url:'javascript:alert(1)'},[],now).sourceUrl,null);
 assert.equal(explainExternalSignal({...signal,published_at:'invalid'},[],now).sourceState,'BRONDATUM_NIET_BEVESTIGD');
});
test('done internal action is not external verified revenue',()=>{
 const result=explainExternalSignal(signal,[{signal_key:'regulatory:42',tenant_specific:true,status:'DONE',canonical_action_ref:'action:42'}],now);
 assert.equal(result.actionStatus,'DONE');assert.equal(result.canOpenAction,false);assert.equal(result.outcomeVerified,false);
});
